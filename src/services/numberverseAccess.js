import { supabase } from "../lib/supabase";
import { getPlayableProfileMembership } from "../lib/membership";
import {
  canUseNumberverseEvidence,
  getNumberverseAccess,
} from "../lib/membershipAccess";

export const NUMBERVERSE_ACCESS_CLASSES = {
  INTRO: "INTRO",
  CORE: "CORE",
  PREMIUM: "PREMIUM",
  EVIDENCE: "EVIDENCE",
};

export const NUMBERVERSE_ACCESS_LEVELS = {
  INTRO: "intro",
  CORE: "core",
  FULL: "full",
};

export const GUEST_NUMBERVERSE_ACCESS = {
  authenticated: false,
  profile: null,
  accessLevel: NUMBERVERSE_ACCESS_LEVELS.INTRO,
  canUseEvidence: false,
  allowedClasses: [
    NUMBERVERSE_ACCESS_CLASSES.INTRO,
  ],
};

function getAllowedClasses(
  accessLevel,
  canUseEvidence
) {
  if (
    accessLevel === NUMBERVERSE_ACCESS_LEVELS.FULL
  ) {
    return [
      NUMBERVERSE_ACCESS_CLASSES.INTRO,
      NUMBERVERSE_ACCESS_CLASSES.CORE,
      NUMBERVERSE_ACCESS_CLASSES.PREMIUM,
      ...(canUseEvidence
        ? [NUMBERVERSE_ACCESS_CLASSES.EVIDENCE]
        : []),
    ];
  }

  if (
    accessLevel === NUMBERVERSE_ACCESS_LEVELS.CORE
  ) {
    return [
      NUMBERVERSE_ACCESS_CLASSES.INTRO,
      NUMBERVERSE_ACCESS_CLASSES.CORE,
    ];
  }

  return [
    NUMBERVERSE_ACCESS_CLASSES.INTRO,
  ];
}

export function canAccessNumberverseClass(
  access,
  requiredClass
) {
  if (!access || !requiredClass) {
    return false;
  }

  return Array.isArray(access.allowedClasses)
    ? access.allowedClasses.includes(requiredClass)
    : false;
}

export async function getNumberverseAccessState() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return GUEST_NUMBERVERSE_ACCESS;
  }

  const outcome =
    await getPlayableProfileMembership();

  if (
    outcome.guest ||
    !outcome.profile
  ) {
    return {
      ...GUEST_NUMBERVERSE_ACCESS,
      authenticated: true,
    };
  }

  const membership = outcome.membership;

  const accessLevel =
    getNumberverseAccess(membership);

  const canUseEvidence =
    canUseNumberverseEvidence(membership);

  return {
    authenticated: true,
    profile: outcome.profile,
    accessLevel,
    canUseEvidence,
    allowedClasses: getAllowedClasses(
      accessLevel,
      canUseEvidence
    ),
  };
}

export function subscribeToNumberverseAuthChanges(
  callback
) {
  const { data } =
    supabase.auth.onAuthStateChange(() => {
      window.setTimeout(callback, 0);
    });

  return () => data.subscription.unsubscribe();
}
