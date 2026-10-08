export const PLATFORM_ADMIN_ROLES = [
  "super_admin",
  "admin",
  "moderator",
];

export function isActivePlatformAdmin(profile) {
  return (
    profile?.account_status === "active" &&
    PLATFORM_ADMIN_ROLES.includes(profile?.admin_role)
  );
}

export function canBypassParentChildLimit(profile) {
  return (
    profile?.account_status === "active" &&
    ["super_admin", "admin"].includes(profile?.admin_role)
  );
}
