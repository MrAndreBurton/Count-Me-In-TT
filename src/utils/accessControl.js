export function getEntitlement(
  membership,
  entitlementKey,
  fallback = null,
) {
  if (!entitlementKey) {
    return fallback;
  }

  const entitlements =
    membership?.plan?.entitlements ||
    membership?.membership_plans
      ?.entitlements ||
    membership?.entitlements ||
    {};

  return (
    entitlements[entitlementKey] ??
    fallback
  );
}

export function hasEntitlement(
  membership,
  entitlementKey,
) {
  return (
    getEntitlement(
      membership,
      entitlementKey,
      false,
    ) === true
  );
}

export function hasAnyAccess(
  membership,
  entitlementKey,
) {
  const value = getEntitlement(
    membership,
    entitlementKey,
    null,
  );

  return (
    value === true ||
    value === "basic" ||
    value === "limited" ||
    value === "full" ||
    value === "top_50" ||
    value === "full_200" ||
    typeof value === "number"
  );
}

export function hasFullAccess(
  membership,
  entitlementKey,
) {
  const value = getEntitlement(
    membership,
    entitlementKey,
    null,
  );

  return (
    value === true ||
    value === "full" ||
    value === "full_200" ||
    value === "all"
  );
}

export function getNumericEntitlement(
  membership,
  entitlementKey,
  fallback = 0,
) {
  const value = getEntitlement(
    membership,
    entitlementKey,
    fallback,
  );

  return typeof value === "number"
    ? value
    : fallback;
}

export function getCurrentMembership(
  memberships = [],
) {
  return (
    memberships.find(
      (membership) =>
        membership.is_current === true,
    ) || null
  );
}

