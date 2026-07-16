import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  studentId?: string;
  enabled?: boolean;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY");

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey
  ) {
    console.error(
      "Missing required Supabase environment variables."
    );

    return jsonResponse(
      {
        error:
          "The student-login status service is not configured correctly.",
      },
      500
    );
  }

  const authorization =
    request.headers.get("Authorization");

  if (!authorization) {
    return jsonResponse(
      {
        error: "You must be logged in.",
      },
      401
    );
  }

  /*
    User-scoped client:
    verifies the parent calling this function.
  */
  const userClient = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  /*
    Admin client:
    updates the child Auth account and database records.
  */
  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  try {
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          error:
            "Your login session is not valid.",
        },
        401
      );
    }

    const body =
      (await request.json()) as RequestBody;

    const studentId = String(
      body.studentId || ""
    ).trim();

    const enabled = body.enabled;

    if (!studentId) {
      return jsonResponse(
        {
          error: "Student profile is required.",
        },
        400
      );
    }

    if (typeof enabled !== "boolean") {
      return jsonResponse(
        {
          error:
            "Enabled status must be true or false.",
        },
        400
      );
    }

    /*
      Confirm the caller is an active parent account.
    */
    const {
      data: parentProfile,
      error: parentError,
    } = await userClient
      .from("profiles")
      .select(
        `
          id,
          account_type,
          account_status
        `
      )
      .eq("id", user.id)
      .maybeSingle();

    if (parentError) {
      throw parentError;
    }

    if (
      !parentProfile ||
      parentProfile.account_type !==
        "parent" ||
      parentProfile.account_status !==
        "active"
    ) {
      return jsonResponse(
        {
          error:
            "Only an active parent account can update a student login.",
        },
        403
      );
    }

    /*
      Confirm the parent manages this student profile.
    */
    const {
      data: parentLink,
      error: linkError,
    } = await userClient
      .from("account_student_links")
      .select(
        `
          id,
          account_id,
          student_id,
          relationship_role,
          can_view
        `
      )
      .eq("account_id", user.id)
      .eq("student_id", studentId)
      .eq("relationship_role", "parent")
      .eq("can_view", true)
      .maybeSingle();

    if (linkError) {
      throw linkError;
    }

    if (!parentLink) {
      return jsonResponse(
        {
          error:
            "You do not manage this student profile.",
        },
        403
      );
    }

    /*
      Load the student's login record.
    */
    const {
      data: loginRecord,
      error: loginError,
    } = await adminClient
      .from("student_login_accounts")
      .select(
        `
          id,
          student_id,
          parent_account_id,
          student_account_id,
          username,
          login_status,
          last_login_at
        `
      )
      .eq("student_id", studentId)
      .eq("parent_account_id", user.id)
      .maybeSingle();

    if (loginError) {
      throw loginError;
    }

    if (
      !loginRecord ||
      !loginRecord.student_account_id
    ) {
      return jsonResponse(
        {
          error:
            "This student does not have a login account.",
        },
        404
      );
    }

    /*
      Ban or unban the student's Supabase Auth account.

      "none" removes the ban.
      "876000h" is approximately 100 years.
    */
    const {
      data: updatedAuthUser,
      error: authUpdateError,
    } =
      await adminClient.auth.admin.updateUserById(
        loginRecord.student_account_id,
        {
          ban_duration: enabled
            ? "none"
            : "876000h",
        }
      );

    if (
      authUpdateError ||
      !updatedAuthUser.user
    ) {
      throw (
        authUpdateError ||
        new Error(
          "The student Auth account could not be updated."
        )
      );
    }

    const nextStatus = enabled
      ? "active"
      : "disabled";

    /*
      Update the student login record.
    */
    const {
      data: updatedLogin,
      error: statusUpdateError,
    } = await adminClient
      .from("student_login_accounts")
      .update({
        login_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loginRecord.id)
      .select(
        `
          id,
          student_id,
          student_account_id,
          username,
          login_status,
          last_login_at,
          updated_at
        `
      )
      .single();

    if (statusUpdateError) {
      throw statusUpdateError;
    }

    /*
      Keep the student profile login flag in sync.
    */
    const {
      error: profileUpdateError,
    } = await adminClient
      .from("student_profiles")
      .update({
        login_enabled: enabled,
      })
      .eq("id", studentId);

    if (profileUpdateError) {
      throw profileUpdateError;
    }

    return jsonResponse({
      success: true,
      message: enabled
        ? "Student login re-enabled successfully."
        : "Student login disabled successfully.",
      login: {
        id: updatedLogin.id,
        studentId:
          updatedLogin.student_id,
        username:
          updatedLogin.username,
        loginStatus:
          updatedLogin.login_status,
        lastLoginAt:
          updatedLogin.last_login_at,
        updatedAt:
          updatedLogin.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "update-student-login-status raw error:",
      error
    );

    console.error(
      "update-student-login-status serialized error:",
      JSON.stringify(error, null, 2)
    );

    const possibleError =
      error as {
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
          "The student login status could not be updated.",
        details:
          possibleError?.details || null,
        hint:
          possibleError?.hint || null,
        code:
          possibleError?.code || null,
      },
      500
    );
  }
});

