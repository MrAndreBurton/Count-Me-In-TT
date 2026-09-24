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
  username?: string;
  password?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "The student-login service is not configured correctly." }, 500);
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

  let createdAuthUserId: string | null = null;
  let createdLoginRecordId: string | null = null;
  let targetStudentId: string | null = null;

  try {
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Your login session is not valid." }, 401);
    }

    const body = (await request.json()) as RequestBody;
    const studentId = String(body.studentId || "").trim();
    targetStudentId = studentId || null;
    const organisationId = String(body.organisationId || "").trim() || null;
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!studentId) return jsonResponse({ error: "Student profile is required." }, 400);

    const normalizedUsername = normalizeUsername(username);

    if (normalizedUsername.length < 4 || normalizedUsername.length > 30) {
      return jsonResponse(
        { error: "Username must contain between 4 and 30 valid characters." },
        400
      );
    }

    if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalizedUsername)) {
      return jsonResponse(
        { error: "Username may use letters, numbers, dots, underscores and hyphens." },
        400
      );
    }

    if (password.length < 8) {
      return jsonResponse({ error: "Password must contain at least 8 characters." }, 400);
    }

    const authorizationContext = await authorizeStudentLoginManagement({
      adminClient,
      userId: user.id,
      studentId,
      organisationId,
    });

    if (!authorizationContext) {
      return jsonResponse(
        { error: "You do not have permission to create a login for this student." },
        403
      );
    }

    // Read the learner with the service-role client only after caller
    // authentication and the explicit management predicate have passed.
    const { data: studentProfile, error: studentError } = await adminClient
      .from("student_profiles")
      .select(`
        id,
        first_name,
        last_name,
        public_display_name,
        profile_status,
        student_account_id,
        login_enabled
      `)
      .eq("id", studentId)
      .eq("profile_status", "active")
      .maybeSingle();

    if (studentError) throw studentError;
    if (!studentProfile) {
      return jsonResponse({ error: "The student profile could not be found." }, 404);
    }

    if (studentProfile.login_enabled || studentProfile.student_account_id) {
      return jsonResponse(
        { error: "A login has already been created for this student." },
        409
      );
    }

    const { data: existingStudentLogin, error: existingStudentLoginError } =
      await adminClient
        .from("student_login_accounts")
        .select("id, username, login_status")
        .eq("student_id", studentId)
        .maybeSingle();

    if (existingStudentLoginError) throw existingStudentLoginError;

    if (existingStudentLogin) {
      return jsonResponse({ error: "A login record already exists for this student." }, 409);
    }

    const { data: existingUsername, error: usernameError } = await adminClient
      .from("student_login_accounts")
      .select("id")
      .eq("normalized_username", normalizedUsername)
      .maybeSingle();

    if (usernameError) throw usernameError;

    if (existingUsername) {
      return jsonResponse({ error: "That username is already in use." }, 409);
    }

    const loginEmail = `${normalizedUsername}@students.countmeintt.com`;

    const displayName =
      studentProfile.public_display_name ||
      `${studentProfile.first_name || "Student"} ${
        studentProfile.last_name?.charAt(0)?.toUpperCase() || ""
      }.`.trim();

    const { data: createdUserData, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: loginEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          account_type: "student",
          student_profile_id: studentId,
          username: normalizedUsername,
          must_change_password: false,
        },
      });

    if (createUserError || !createdUserData.user) {
      throw createUserError || new Error("The student Auth account could not be created.");
    }

    createdAuthUserId = createdUserData.user.id;

    const { error: profileUpsertError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: createdAuthUserId,
          full_name: displayName,
          account_type: "student",
          account_status: "active",
        },
        { onConflict: "id" }
      );

    if (profileUpsertError) throw profileUpsertError;

    const { data: automaticallyCreatedLink, error: automaticLinkError } =
      await adminClient
        .from("account_student_links")
        .select("id, account_id, student_id")
        .eq("account_id", createdAuthUserId)
        .maybeSingle();

    if (automaticLinkError) throw automaticLinkError;

    const automaticallyCreatedStudentId =
      automaticallyCreatedLink?.student_id || null;

    if (automaticallyCreatedLink) {
      const { error: updateStudentLinkError } = await adminClient
        .from("account_student_links")
        .update({
          student_id: studentId,
          relationship_role: "student",
          can_view: true,
          can_edit: false,
          can_manage_membership: false,
          can_play: true,
        })
        .eq("id", automaticallyCreatedLink.id);

      if (updateStudentLinkError) throw updateStudentLinkError;
    } else {
      const { error: insertStudentLinkError } = await adminClient
        .from("account_student_links")
        .insert({
          account_id: createdAuthUserId,
          student_id: studentId,
          relationship_role: "student",
          can_view: true,
          can_edit: false,
          can_manage_membership: false,
          can_play: true,
        });

      if (insertStudentLinkError) throw insertStudentLinkError;
    }

    if (
      automaticallyCreatedStudentId &&
      automaticallyCreatedStudentId !== studentId
    ) {
      const { error: deleteTemporaryProfileError } = await adminClient
        .from("student_profiles")
        .delete()
        .eq("id", automaticallyCreatedStudentId)
        .eq("account_id", createdAuthUserId);

      if (deleteTemporaryProfileError) throw deleteTemporaryProfileError;
    }

    const passwordChangedAt =
    new Date().toISOString();

    const { data: loginRecord, error: loginRecordError } = await adminClient
      .from("student_login_accounts")
      .insert({
        student_id: studentId,
        parent_account_id: authorizationContext.parentAccountId,
        provisioned_by_account_id: authorizationContext.provisionedByAccountId,
        provisioning_type: authorizationContext.type,
        organisation_id: authorizationContext.organisationId,
        student_account_id: createdAuthUserId,
        username: normalizedUsername,
        normalized_username: normalizedUsername,
        login_email: loginEmail,
        login_status: "active",
        must_change_password: false,
        password_changed_at: passwordChangedAt,
        last_login_at: null,
      })
      .select(`
        id,
        student_id,
        student_account_id,
        username,
        normalized_username,
        login_status,
        must_change_password,
        created_at,
        password_changed_at
      `)
      .single();

    if (loginRecordError) throw loginRecordError;
    createdLoginRecordId = loginRecord.id;

    const { error: studentUpdateError } = await adminClient
      .from("student_profiles")
      .update({
        student_account_id: createdAuthUserId,
        login_enabled: true,
      })
      .eq("id", studentId);

    if (studentUpdateError) throw studentUpdateError;

    return jsonResponse({
      success: true,
      message: "Student login created successfully.",
      login: {
        id: loginRecord.id,
        studentId: loginRecord.student_id,
        username: loginRecord.username,
        normalizedUsername: loginRecord.normalized_username,
        loginStatus: loginRecord.login_status,
        mustChangePassword: loginRecord.must_change_password,
      },
    });
  } catch (error) {
    console.error("create-student-login error:", error);

    // Compensating cleanup: database/Auth creation is not one transaction.
    // First reverse only the learner linkage created by this attempt. The
    // student_account_id predicate prevents cleanup from clearing a different
    // or concurrently established account linkage.
    if (createdAuthUserId && targetStudentId) {
      const { error: learnerCleanupError } = await adminClient
        .from("student_profiles")
        .update({
          student_account_id: null,
          login_enabled: false,
        })
        .eq("id", targetStudentId)
        .eq("student_account_id", createdAuthUserId);

      if (learnerCleanupError) {
        console.error(
          "Unable to restore learner login state after failed provisioning:",
          learnerCleanupError
        );
      }
    }

    // Remove the login row before deleting the Auth user so ON DELETE SET NULL
    // cannot leave a partial student_login_accounts record behind.
    if (createdLoginRecordId) {
      const { error: loginCleanupError } = await adminClient
        .from("student_login_accounts")
        .delete()
        .eq("id", createdLoginRecordId);

      if (loginCleanupError) {
        console.error("Unable to clean up partial student login row:", loginCleanupError);
      }
    }

    if (createdAuthUserId) {
      const { error: cleanupError } =
        await adminClient.auth.admin.deleteUser(createdAuthUserId);

      if (cleanupError) {
        console.error("Unable to clean up partially created Auth user:", cleanupError);
      }
    }

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
          "The student login could not be created.",
        details: possibleError?.details || null,
        hint: possibleError?.hint || null,
        code: possibleError?.code || null,
      },
      500
    );
  }
});
