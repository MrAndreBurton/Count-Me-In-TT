import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizeStudentLoginManagement } from "../_shared/studentLoginAuthorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  studentId?: string;
  organisationId?: string;
  newPassword?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(
      { error: "The password-reset service is not configured correctly." },
      500
    );
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return jsonResponse({ error: "You must be logged in." }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Your login session is not valid." }, 401);
    }

    const body = (await request.json()) as RequestBody;
    const studentId = String(body.studentId || "").trim();
    const organisationId = String(body.organisationId || "").trim() || null;
    const newPassword = String(body.newPassword || "");

    if (!studentId) return jsonResponse({ error: "Student profile is required." }, 400);

    if (newPassword.length < 8) {
      return jsonResponse(
        { error: "The new password must contain at least 8 characters." },
        400
      );
    }

    const authorizationContext = await authorizeStudentLoginManagement({
      adminClient,
      userId: user.id,
      studentId,
      organisationId,
    });

    if (!authorizationContext) {
      return jsonResponse(
        { error: "You do not have permission to manage this student's login." },
        403
      );
    }

    const { data: loginRecord, error: loginError } = await adminClient
      .from("student_login_accounts")
      .select(`
        id,
        student_id,
        parent_account_id,
        provisioned_by_account_id,
        provisioning_type,
        organisation_id,
        student_account_id,
        username,
        login_status
      `)
      .eq("student_id", studentId)
      .maybeSingle();

    if (loginError) throw loginError;

    if (!loginRecord || !loginRecord.student_account_id) {
      return jsonResponse(
        { error: "This student does not have an active login account." },
        404
      );
    }

    // A parent can manage only a parent-provisioned login. An organisation
    // context can manage only the login belonging to that same organisation.
    if (
      authorizationContext.type === "parent" &&
      (
        loginRecord.provisioning_type !== "parent" ||
        loginRecord.parent_account_id !== authorizationContext.parentAccountId
      )
    ) {
      return jsonResponse(
        { error: "You do not have permission to manage this student's login." },
        403
      );
    }

    if (
      authorizationContext.type === "organisation" &&
      (
        loginRecord.provisioning_type !== "organisation" ||
        loginRecord.organisation_id !== authorizationContext.organisationId
      )
    ) {
      return jsonResponse(
        { error: "You do not have permission to manage this student's login." },
        403
      );
    }

    const { data: updatedUser, error: passwordError } =
      await adminClient.auth.admin.updateUserById(
        loginRecord.student_account_id,
        { password: newPassword }
      );

    if (passwordError || !updatedUser.user) {
  throw passwordError || new Error("The student password could not be updated.");
}

const passwordChangedAt =
  new Date().toISOString();

const { error: updateLoginError } = await adminClient
  .from("student_login_accounts")
  .update({
    login_status: "active",
    must_change_password: false,
    password_changed_at: passwordChangedAt,
    updated_at: passwordChangedAt,
  })
      .eq("id", loginRecord.id);

    if (updateLoginError) throw updateLoginError;

    return jsonResponse({
      success: true,
      message: "Student password reset successfully.",
      student: {
        studentId,
        username: loginRecord.username,
        loginStatus: "active",
      },
    });
  } catch (error) {
    console.error("reset-student-password error:", error);

    const possibleError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      error?: string;
    };

    return jsonResponse(
      {
        error:
          possibleError?.message ||
          possibleError?.error ||
          possibleError?.details ||
          "The student password could not be reset.",
        details: possibleError?.details || null,
        hint: possibleError?.hint || null,
        code: possibleError?.code || null,
      },
      500
    );
  }
});
