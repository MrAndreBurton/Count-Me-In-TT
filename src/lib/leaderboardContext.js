// UI context discovery never grants access; leaderboard_api rechecks each action.
export async function loadLeaderboardContext(client, organisationId = null) {
  const { data: { user } = {}, error: userError } = await client.auth.getUser();
  if (userError) {
    if ([401, 403].includes(userError.status) || /session missing|missing.*session/i.test(userError.message || "")) {
      return { status: "signed_out" };
    }
    throw userError;
  }
  if (!user) return { status: "signed_out" };
  const { data: profile, error } = await client.from("profiles")
    .select("id, full_name, admin_role, account_status").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (profile?.account_status !== "active") return { status: "forbidden" };
  const isSuperadmin = profile.admin_role === "super_admin";
  if (!organisationId) return isSuperadmin
    ? { status: "ready", profile, isSuperadmin, roles: [] }
    : { status: "forbidden" };
  const { data: staff, error: staffError } = await client.from("organisation_staff")
    .select("id").eq("organisation_id", organisationId).eq("profile_id", user.id)
    .eq("status", "active").is("ended_at", null).maybeSingle();
  if (staffError) throw staffError;
  if (!staff) return { status: "forbidden" };
  const { data: roleRows, error: roleError } = await client.from("organisation_staff_roles")
    .select("role").eq("staff_id", staff.id);
  if (roleError) throw roleError;
  const roles = (roleRows || []).map(r => r.role);
  if (!roles.some(r => ["organisation_admin", "teacher", "tutor"].includes(r))) return { status: "forbidden" };
  const { data: organisation, error: orgError } = await client.from("organisations")
    .select("id, name, organisation_type, status").eq("id", organisationId).eq("status", "active").maybeSingle();
  if (orgError) throw orgError;
  if (!organisation) return { status: "forbidden" };
  return { status: "ready", profile, organisation, roles, isSuperadmin };
}
