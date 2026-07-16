import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  studentId?: string;
  username?: string;
  password?: string;
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

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get(
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
          "The student-login service is not configured correctly.",
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
    creates the child Auth user and performs the
    linked database writes.
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

  let createdAuthUserId: string | null = null;

  try {
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          error: "Your login session is not valid.",
        },
        401
      );
    }

    const body =
      (await request.json()) as RequestBody;

    const studentId = String(
      body.studentId || ""
    ).trim();

    const username = String(
      body.username || ""
    ).trim();

    const password = String(
      body.password || ""
    );

    if (!studentId) {
      return jsonResponse(
        {
          error: "Student profile is required.",
        },
        400
      );
    }

    const normalizedUsername =
      normalizeUsername(username);

    if (
      normalizedUsername.length < 4 ||
      normalizedUsername.length > 30
    ) {
      return jsonResponse(
        {
          error:
            "Username must contain between 4 and 30 valid characters.",
        },
        400
      );
    }

    if (
      !/^[a-z0-9][a-z0-9._-]*$/.test(
        normalizedUsername
      )
    ) {
      return jsonResponse(
        {
          error:
            "Username may use letters, numbers, dots, underscores and hyphens.",
        },
        400
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        {
          error:
            "Password must contain at least 8 characters.",
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
          full_name,
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
      parentProfile.account_type !== "parent" ||
      parentProfile.account_status !== "active"
    ) {
      return jsonResponse(
        {
          error:
            "Only an active parent account can create a student login.",
        },
        403
      );
    }

    /*
      Confirm the parent manages this student.
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
          can_view,
          can_edit
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

    const {
      data: studentProfile,
      error: studentError,
    } = await userClient
      .from("student_profiles")
      .select(
        `
          id,
          first_name,
          last_name,
          public_display_name,
          profile_status,
          student_account_id,
          login_enabled
        `
      )
      .eq("id", studentId)
      .eq("profile_status", "active")
      .maybeSingle();

    if (studentError) {
      throw studentError;
    }

    if (!studentProfile) {
      return jsonResponse(
        {
          error:
            "The student profile could not be found.",
        },
        404
      );
    }

    if (
      studentProfile.login_enabled ||
      studentProfile.student_account_id
    ) {
      return jsonResponse(
        {
          error:
            "A login has already been created for this student.",
        },
        409
      );
    }

    /*
      Check whether this student already has a login record.
    */
    const {
      data: existingStudentLogin,
      error: existingStudentLoginError,
    } = await adminClient
      .from("student_login_accounts")
      .select(
        `
          id,
          username,
          login_status
        `
      )
      .eq("student_id", studentId)
      .maybeSingle();

    if (existingStudentLoginError) {
      throw existingStudentLoginError;
    }

    if (existingStudentLogin) {
      return jsonResponse(
        {
          error:
            "A login record already exists for this student.",
        },
        409
      );
    }

    /*
      Check username availability.
    */
    const {
      data: existingUsername,
      error: usernameError,
    } = await adminClient
      .from("student_login_accounts")
      .select("id")
      .eq(
        "normalized_username",
        normalizedUsername
      )
      .maybeSingle();

    if (usernameError) {
      throw usernameError;
    }

    if (existingUsername) {
      return jsonResponse(
        {
          error:
            "That username is already in use.",
        },
        409
      );
    }

    /*
      Internal email used by Supabase Auth.

      The student will log in with the username.
      The frontend will convert the username into
      this internal email automatically.
    */
    const loginEmail =
      `${normalizedUsername}@students.countmeintt.com`;

    const displayName =
      studentProfile.public_display_name ||
      `${studentProfile.first_name || "Student"} ${
        studentProfile.last_name
          ?.charAt(0)
          ?.toUpperCase() || ""
      }.`.trim();

    /*
      Create the child’s independent Supabase Auth user.
    */
    const {
      data: createdUserData,
      error: createUserError,
    } = await adminClient.auth.admin.createUser({
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

    if (
      createUserError ||
      !createdUserData.user
    ) {
      throw (
        createUserError ||
        new Error(
          "The student Auth account could not be created."
        )
      );
    }

    createdAuthUserId =
      createdUserData.user.id;

    /*
      Ensure the profiles row contains the correct
      student account values.

      If your existing Auth trigger already created
      the row, this updates it. Otherwise, it inserts it.
    */
    const {
      error: profileUpsertError,
    } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: createdAuthUserId,
          full_name: displayName,
          account_type: "student",
          account_status: "active",
        },
        {
          onConflict: "id",
        }
      );

    if (profileUpsertError) {
      throw profileUpsertError;
    }

    /*
  A database trigger may already have created a default
  playable profile and account_student_links row for the
  new Auth user.

  Reuse that existing link and point it to the parent-managed
  student profile instead of inserting a second playable link.
*/
const {
  data: automaticallyCreatedLink,
  error: automaticLinkError,
} = await adminClient
  .from("account_student_links")
  .select(
    `
      id,
      account_id,
      student_id
    `
  )
  .eq("account_id", createdAuthUserId)
  .maybeSingle();

if (automaticLinkError) {
  throw automaticLinkError;
}

const automaticallyCreatedStudentId =
  automaticallyCreatedLink?.student_id || null;

if (automaticallyCreatedLink) {
  const {
    error: updateStudentLinkError,
  } = await adminClient
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

  if (updateStudentLinkError) {
    throw updateStudentLinkError;
  }
} else {
  const {
    error: insertStudentLinkError,
  } = await adminClient
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

  if (insertStudentLinkError) {
    throw insertStudentLinkError;
  }
}

/*
  Remove the temporary learning profile that the Auth trigger
  created for the new student account. The Auth account is now
  linked to the parent's existing child profile instead.
*/
if (
  automaticallyCreatedStudentId &&
  automaticallyCreatedStudentId !== studentId
) {
  const {
    error: deleteTemporaryProfileError,
  } = await adminClient
    .from("student_profiles")
    .delete()
    .eq("id", automaticallyCreatedStudentId)
    .eq("account_id", createdAuthUserId);

  if (deleteTemporaryProfileError) {
    throw deleteTemporaryProfileError;
  }
}

    /*
      Save the student login record.
    */
    const {
      data: loginRecord,
      error: loginRecordError,
    } = await adminClient
      .from("student_login_accounts")
      .insert({
        student_id: studentId,
        parent_account_id: user.id,
        student_account_id: createdAuthUserId,
        username: normalizedUsername,
        normalized_username:
          normalizedUsername,
        login_email: loginEmail,
        login_status:
          "active",
        must_change_password: false,
        last_login_at: null,
      })
      .select(
        `
          id,
          student_id,
          student_account_id,
          username,
          normalized_username,
          login_status,
          must_change_password,
          created_at
        `
      )
      .single();

    if (loginRecordError) {
      throw loginRecordError;
    }

    /*
      Activate login access on the student profile.
    */
    const {
      error: studentUpdateError,
    } = await adminClient
      .from("student_profiles")
      .update({
        student_account_id:
          createdAuthUserId,
        login_enabled: true,
      })
      .eq("id", studentId);

    if (studentUpdateError) {
      throw studentUpdateError;
    }

    return jsonResponse({
      success: true,
      message:
        "Student login created successfully.",
      login: {
        id: loginRecord.id,
        studentId:
          loginRecord.student_id,
        username:
          loginRecord.username,
        normalizedUsername:
          loginRecord.normalized_username,
        loginStatus:
          loginRecord.login_status,
        mustChangePassword:
          loginRecord.must_change_password,
      },
    });
 } catch (error) {
  console.error(
    "create-student-login raw error:",
    error
  );

  console.error(
    "create-student-login serialized error:",
    JSON.stringify(error, null, 2)
  );

  /*
    Remove the Auth user if a later database step failed.
  */
  if (createdAuthUserId) {
    const { error: cleanupError } =
      await adminClient.auth.admin.deleteUser(
        createdAuthUserId
      );

    if (cleanupError) {
      console.error(
        "Unable to clean up partially created Auth user:",
        cleanupError
      );
    }
  }

  const possibleError =
    error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      error?: string;
    };

  const message =
    possibleError?.message ||
    possibleError?.error ||
    possibleError?.details ||
    "The student login could not be created.";

  return jsonResponse(
    {
      error: message,
      details: possibleError?.details || null,
      hint: possibleError?.hint || null,
      code: possibleError?.code || null,
    },
    500
  );
}
});

