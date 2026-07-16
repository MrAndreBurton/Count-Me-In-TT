import { supabase } from "./supabase";

function cleanText(value) {
  return String(value || "").trim();
}

export function normalizeStudentUsername(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

export function validateStudentUsername(value) {
  const normalizedUsername = normalizeStudentUsername(value);

  if (!normalizedUsername) {
    return {
      valid: false,
      normalizedUsername,
      message: "Enter a username.",
    };
  }

  if (normalizedUsername.length < 4) {
    return {
      valid: false,
      normalizedUsername,
      message: "Username must contain at least 4 characters.",
    };
  }

  if (normalizedUsername.length > 30) {
    return {
      valid: false,
      normalizedUsername,
      message: "Username cannot contain more than 30 characters.",
    };
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalizedUsername)) {
    return {
      valid: false,
      normalizedUsername,
      message:
        "Username may use letters, numbers, dots, underscores and hyphens.",
    };
  }

  return {
    valid: true,
    normalizedUsername,
    message: "",
  };
}

export function validatePassword(value) {
  const password = String(value || "");

  if (!password) {
    return {
      valid: false,
      message: "Enter a password.",
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must contain at least 8 characters.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export async function getStudentLoginAccount(studentId) {
  const cleanStudentId = cleanText(studentId);

  if (!cleanStudentId) {
    throw new Error("Student profile is required.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return {
      authenticated: false,
      login: null,
    };
  }

  const { data, error } = await supabase
    .from("student_login_accounts")
    .select(`
      id,
      student_id,
      parent_account_id,
      student_account_id,
      username,
      normalized_username,
      login_status,
      must_change_password,
      last_login_at,
      created_at,
      updated_at
    `)
    .eq("student_id", cleanStudentId)
    .eq("parent_account_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    authenticated: true,
    login: data || null,
  };
}

export async function createStudentLogin({
  studentId,
  username,
  password,
}) {
  const cleanStudentId = cleanText(studentId);

  if (!cleanStudentId) {
    throw new Error("Student profile is required.");
  }

  const usernameValidation = validateStudentUsername(username);

  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.message);
  }

  const passwordValidation =
    validatePassword(password);

  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "You must be logged in as a parent to create a student login."
    );
  }

  const { data, error } = await supabase.functions.invoke(
    "create-student-login",
    {
      body: {
        studentId: cleanStudentId,
        username: usernameValidation.normalizedUsername,
        password: String(password),
      },
    }
  );

  if (error) {
    console.error("Student login function error:", error);

    let responseBody = null;

    try {
      const response = error.context;
      if (response) {
        responseBody = await response.json();
      }
    } catch (responseError) {
      console.error(
        "Unable to read function error response:",
        responseError
      );
    }

    console.error(
      "Student login function response JSON:",
      JSON.stringify(responseBody, null, 2)
    );

    const serverMessage =
      typeof responseBody?.error === "string"
        ? responseBody.error
        : typeof responseBody?.message === "string"
          ? responseBody.message
          : typeof responseBody?.error?.message === "string"
            ? responseBody.error.message
            : error.message ||
              "The student login could not be created.";

    throw new Error(serverMessage);
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "The student login could not be created."
    );
  }

  return {
    success: true,
    message:
      data.message ||
      "Student login created successfully.",
    login: data.login,
  };
}

export async function resetStudentPassword({
  studentId,
  newPassword,
}) {
  const cleanStudentId = cleanText(studentId);

  if (!cleanStudentId) {
    throw new Error("Student profile is required.");
  }

  const passwordValidation =
    validatePassword(newPassword);

  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "You must be logged in as a parent to reset a student password."
    );
  }

  const { data, error } = await supabase.functions.invoke(
    "reset-student-password",
    {
      body: {
        studentId: cleanStudentId,
        newPassword: String(newPassword),
      },
    }
  );

  if (error) {
    console.error(
      "Reset student password function error:",
      error
    );

    let responseBody = null;

    try {
      if (error.context) {
        responseBody = await error.context.json();
      }
    } catch (responseError) {
      console.error(
        "Unable to read password-reset response:",
        responseError
      );
    }

    const message =
      typeof responseBody?.error === "string"
        ? responseBody.error
        : typeof responseBody?.message === "string"
          ? responseBody.message
          : error.message ||
            "The student password could not be reset.";

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "The student password could not be reset."
    );
  }

  return {
    success: true,
    message:
      data.message ||
      "Student password reset successfully.",
    student: data.student,
  };
}

export async function updateStudentLoginStatus({
  studentId,
  enabled,
}) {
  const cleanStudentId = cleanText(studentId);

  if (!cleanStudentId) {
    throw new Error("Student profile is required.");
  }

  if (typeof enabled !== "boolean") {
    throw new Error(
      "Enabled status must be true or false."
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "You must be logged in as a parent to update a student login."
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "update-student-login-status",
      {
        body: {
          studentId: cleanStudentId,
          enabled,
        },
      }
    );

  if (error) {
    console.error(
      "Update student login status function error:",
      error
    );

    let responseBody = null;

    try {
      if (error.context) {
        responseBody =
          await error.context.json();
      }
    } catch (responseError) {
      console.error(
        "Unable to read login-status response:",
        responseError
      );
    }

    const message =
      typeof responseBody?.error === "string"
        ? responseBody.error
        : typeof responseBody?.message === "string"
          ? responseBody.message
          : error.message ||
            "The student login status could not be updated.";

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "The student login status could not be updated."
    );
  }

  return {
    success: true,
    message:
      data.message ||
      (enabled
        ? "Student login re-enabled successfully."
        : "Student login disabled successfully."),
    login: data.login,
  };
}

export function studentUsernameToLoginEmail(username) {
  const normalizedUsername =
    normalizeStudentUsername(username);

  if (!normalizedUsername) {
    throw new Error("Enter a student username.");
  }

  return `${normalizedUsername}@students.countmeintt.com`;
}

export async function signInStudent({
  username,
  password,
}) {
  const usernameValidation =
    validateStudentUsername(username);

  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.message);
  }

  if (!password) {
    throw new Error("Enter the student password.");
  }

  const email = studentUsernameToLoginEmail(
    usernameValidation.normalizedUsername
  );

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password: String(password),
    });

  if (error) {
    throw new Error(
      error.message === "Invalid login credentials"
        ? "The username or password is incorrect."
        : error.message
    );
  }

  return {
    user: data.user,
    session: data.session,
  };
}


