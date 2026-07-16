import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    return jsonResponse(
      {
        error:
          "The login-tracking service is not configured correctly.",
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

    const {
      data: profile,
      error: profileError,
    } = await adminClient
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

    if (profileError) {
      throw profileError;
    }

    if (
      !profile ||
      profile.account_type !== "student" ||
      profile.account_status !== "active"
    ) {
      return jsonResponse(
        {
          error:
            "Only an active student account can record a student login.",
        },
        403
      );
    }

    const loginTime =
      new Date().toISOString();

    const {
      data: updatedLogin,
      error: updateError,
    } = await adminClient
      .from("student_login_accounts")
      .update({
        last_login_at: loginTime,
        updated_at: loginTime,
      })
      .eq("student_account_id", user.id)
      .eq("login_status", "active")
      .select(
        `
          id,
          student_id,
          username,
          login_status,
          last_login_at
        `
      )
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updatedLogin) {
      return jsonResponse(
        {
          error:
            "The active student login record could not be found.",
        },
        404
      );
    }

    return jsonResponse({
      success: true,
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
      },
    });
  } catch (error) {
    console.error(
      "record-student-login error:",
      error
    );

    const possibleError =
      error as {
        message?: string;
        details?: string;
        code?: string;
      };

    return jsonResponse(
      {
        error:
          possibleError?.message ||
          possibleError?.details ||
          "The student login time could not be recorded.",
        code:
          possibleError?.code || null,
      },
      500
    );
  }
});

