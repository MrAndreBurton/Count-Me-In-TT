import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = new Set([
  "organisation_admin",
  "teacher",
  "tutor",
]);

const AUTH_USERS_PAGE_SIZE = 1000;

const ALLOWED_APP_ORIGINS = new Set([
  "http://localhost:5173",
  "https://countmeintt.com",
  "https://www.countmeintt.com",
]);

type OrganisationRole =
  | "organisation_admin"
  | "teacher"
  | "tutor";

type RequestBody = {
  organisationId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string | null;
  roles?: string[];
};

type StaffProvisioningRow = {
  staff_id: string;
  organisation_id: string;
  profile_id: string;
  staff_position: string | null;
  staff_status: string;
  roles: string[];
  staff_action: string;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: string | null = null,
) {
  return jsonResponse(
    {
      success: false,
      error: message,
      code,
      details,
    },
    status,
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRoles(values: unknown): OrganisationRole[] | null {
  if (!Array.isArray(values)) return null;

  const normalized = [
    ...new Set(
      values.map((value) =>
        typeof value === "string" ? value.trim() : "",
      ),
    ),
  ];

  if (
    normalized.length === 0 ||
    normalized.some(
      (role) => !role || !ALLOWED_ROLES.has(role),
    )
  ) {
    return null;
  }

  return normalized.sort() as OrganisationRole[];
}

async function findAuthUserByEmail(
  adminClient: ReturnType<typeof createClient>,
  email: string,
) {
  let page = 1;

  while (true) {
    const { data, error } =
      await adminClient.auth.admin.listUsers({
        page,
        perPage: AUTH_USERS_PAGE_SIZE,
      });

    if (error) throw error;

    const users = data?.users || [];

    const match = users.find(
      (candidate) =>
        normalizeEmail(candidate.email || "") === email,
    );

    if (match) return match;

    if (data.nextPage == null) {
      return null;
    }

    page = data.nextPage;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse(
      "METHOD_NOT_ALLOWED",
      "Method not allowed.",
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return errorResponse(
      "SERVICE_NOT_CONFIGURED",
      "The staff provisioning service is not configured correctly.",
      500,
    );
  }

  const authorization =
    request.headers.get("Authorization");

  if (!authorization) {
    return errorResponse(
      "AUTH_REQUIRED",
      "You must be logged in.",
      401,
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
    },
  );

  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  try {
    /*
     * 1. Authenticate the original caller.
     */
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return errorResponse(
        "AUTH_REQUIRED",
        "Your login session is not valid.",
        401,
      );
    }

    /*
     * 2. Staff V1 is platform-admin provisioning only.
     *
     * Preserve the existing CountMeInTT platform-admin
     * semantics: admin and super_admin only.
     * moderator is deliberately not included.
     */
    const {
      data: callerProfile,
      error: callerProfileError,
    } = await adminClient
      .from("profiles")
      .select("id, account_status, admin_role")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfileError) throw callerProfileError;

    if (
      !callerProfile ||
      callerProfile.account_status !== "active" ||
      !["admin", "super_admin"].includes(
        callerProfile.admin_role,
      )
    ) {
      return errorResponse(
        "PLATFORM_ADMIN_REQUIRED",
        "You do not have permission to add organisation staff.",
        403,
      );
    }

    /*
     * 3. Validate and normalize the request.
     */
    let body: RequestBody;

    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return errorResponse(
        "INVALID_REQUEST",
        "The request body must contain valid JSON.",
        400,
      );
    }

    const organisationId = String(
      body.organisationId || "",
    ).trim();

    const firstName = String(
      body.firstName || "",
    ).trim();

    const lastName = String(
      body.lastName || "",
    ).trim();

    const email = normalizeEmail(
      String(body.email || ""),
    );

    const position =
      body.position == null
        ? null
        : String(body.position).trim() || null;

    const roles = normalizeRoles(body.roles);

    if (!organisationId) {
      return errorResponse(
        "ORGANISATION_REQUIRED",
        "Organisation is required.",
        400,
      );
    }

    if (!firstName) {
      return errorResponse(
        "FIRST_NAME_REQUIRED",
        "First name is required.",
        400,
      );
    }

    if (!lastName) {
      return errorResponse(
        "LAST_NAME_REQUIRED",
        "Last name is required.",
        400,
      );
    }

    if (!email) {
      return errorResponse(
        "EMAIL_REQUIRED",
        "Email is required.",
        400,
      );
    }

    if (!isValidEmail(email)) {
      return errorResponse(
        "EMAIL_INVALID",
        "Enter a valid email address.",
        400,
      );
    }

    if (!roles) {
      return errorResponse(
        "ROLE_REQUIRED",
        "At least one valid organisation role is required.",
        400,
      );
    }

    /*
     * 4. Confirm the target organisation before creating
     *    or inviting an Auth user.
     *
     * This avoids sending an invitation for an organisation
     * that cannot subsequently accept staff provisioning.
     */
    const {
      data: organisation,
      error: organisationError,
    } = await adminClient
      .from("organisations")
      .select("id, name, status")
      .eq("id", organisationId)
      .eq("status", "active")
      .maybeSingle();

    if (organisationError) throw organisationError;

    if (!organisation) {
      return errorResponse(
        "ORGANISATION_NOT_ACTIVE",
        "The organisation could not be found or is not active.",
        404,
      );
    }

    /*
     * 5. Resolve the adult account entirely server-side.
     */
    let authUser =
      await findAuthUserByEmail(adminClient, email);

    let accountResolution: "existing" | "invited";

    if (authUser) {
      accountResolution = "existing";
    } else {
      /*
       * New adult staff own their credentials.
       * We send an invitation rather than choosing a password.
       */
      const fullName = `${firstName} ${lastName}`;

      const requestOrigin =
        request.headers.get("Origin")?.trim() || "";

      if (!ALLOWED_APP_ORIGINS.has(requestOrigin)) {
        return errorResponse(
          "INVITATION_ORIGIN_NOT_ALLOWED",
          "The staff invitation could not be created from this application origin.",
          400,
        );
      }

      const invitationRedirectUrl =
        `${requestOrigin}/reset-password`;

      const {
        data: invitationData,
        error: invitationError,
      } =
        await adminClient.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo: invitationRedirectUrl,
            data: {
              full_name: fullName,
              account_type: "staff",
            },
          },
        );

      if (
        invitationError ||
        !invitationData?.user
      ) {
        console.error(
          "add-organisation-staff invitation error:",
          invitationError,
        );

        return errorResponse(
          "INVITATION_FAILED",
          "The staff invitation could not be created.",
          500,
          invitationError?.message || null,
        );
      }

      authUser = invitationData.user;
      accountResolution = "invited";
    }

    /*
     * 6. Require the Auth identity to have a corresponding
     *    active public profile.
     *
     * For new invitations, handle_new_user() should have
     * created this synchronously through the Auth trigger.
     *
     * Existing accounts are never silently repaired here.
     */
    const {
      data: targetProfile,
      error: targetProfileError,
    } = await adminClient
      .from("profiles")
      .select(`
        id,
        full_name,
        account_type,
        account_status,
        admin_role
      `)
      .eq("id", authUser.id)
      .maybeSingle();

    if (targetProfileError) throw targetProfileError;

    if (
      !targetProfile ||
      targetProfile.account_status !== "active"
    ) {
      return errorResponse(
        "ACCOUNT_IDENTITY_INVALID",
        "The staff account does not have a valid active CountMeInTT profile.",
        409,
      );
    }

    /*
     * 7. Provision the organisation relationship through
     *    the service-role-only transactional RPC.
     *
     * Existing account identity is deliberately preserved:
     * no name, account_type, password, email or admin_role
     * changes are made here.
     */
    const {
      data: provisioningData,
      error: provisioningError,
    } = await adminClient.rpc(
      "provision_organisation_staff_v1",
      {
        p_organisation_id: organisationId,
        p_profile_id: targetProfile.id,
        p_position: position,
        p_roles: roles,
      },
    );

    if (provisioningError) {
      console.error(
        "add-organisation-staff provisioning error:",
        provisioningError,
      );

      const knownCode =
        provisioningError.message?.match(
          /(ORGANISATION_NOT_ACTIVE|PROFILE_NOT_FOUND_OR_INACTIVE|ROLE_REQUIRED|INVALID_ROLE|STAFF_RELATIONSHIP_ENDED|STAFF_PROVISIONING_FAILED)/,
        )?.[1] || "STAFF_PROVISIONING_FAILED";

      const status =
        knownCode === "STAFF_RELATIONSHIP_ENDED"
          ? 409
          : knownCode === "ORGANISATION_NOT_ACTIVE" ||
              knownCode === "PROFILE_NOT_FOUND_OR_INACTIVE"
          ? 404
          : knownCode === "ROLE_REQUIRED" ||
              knownCode === "INVALID_ROLE"
          ? 400
          : 500;

      return errorResponse(
        knownCode,
        knownCode === "STAFF_RELATIONSHIP_ENDED"
          ? "This staff relationship has previously ended and cannot be reopened by ordinary provisioning."
          : "The organisation staff relationship could not be provisioned.",
        status,
        provisioningError.message || null,
      );
    }

    const staffRow =
      (Array.isArray(provisioningData)
        ? provisioningData[0]
        : provisioningData) as
        | StaffProvisioningRow
        | null;

    if (!staffRow) {
      return errorResponse(
        "STAFF_PROVISIONING_FAILED",
        "The organisation staff relationship could not be provisioned.",
        500,
      );
    }

    /*
     * 8. Return authoritative account + employment state.
     */
    return jsonResponse({
      success: true,
      message:
        accountResolution === "invited"
          ? "Staff member invited and added successfully."
          : "Existing account added to the organisation successfully.",
      accountResolution,
      organisation: {
        id: organisation.id,
        name: organisation.name,
      },
      account: {
        profileId: targetProfile.id,
        fullName: targetProfile.full_name,
        email,
        accountType: targetProfile.account_type,
        accountStatus: targetProfile.account_status,
      },
      staff: {
        staffId: staffRow.staff_id,
        organisationId:
          staffRow.organisation_id,
        profileId: staffRow.profile_id,
        position: staffRow.staff_position,
        status: staffRow.staff_status,
        roles: staffRow.roles,
        action: staffRow.staff_action,
      },
    });
  } catch (error) {
    console.error(
      "add-organisation-staff error:",
      error,
    );

    const possibleError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return errorResponse(
      "STAFF_PROVISIONING_FAILED",
      "The staff member could not be added.",
      500,
      possibleError?.message ||
        possibleError?.details ||
        null,
    );
  }
});
