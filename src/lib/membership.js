import { supabase } from "./supabase";

export async function getCurrentStudentMembership(studentId) {
  const cleanStudentId = String(studentId || "").trim();

  if (!cleanStudentId) {
    throw new Error("Student profile is required.");
  }

  const { data, error } = await supabase
    .from("student_memberships")
    .select(
      `
        id,
        student_id,
        status,
        starts_at,
        expires_at,
        is_current,
        auto_renew,
        source,
        membership_plans (
          id,
          plan_key,
          name,
          description,
          plan_type,
          price_ttd,
          duration_months,
          is_paid,
          entitlements
        )
      `
    )
    .eq("student_id", cleanStudentId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const plan = data.membership_plans;

  return {
    id: data.id,
    studentId: data.student_id,
    status: data.status,
    startsAt: data.starts_at,
    expiresAt: data.expires_at,
    isCurrent: Boolean(data.is_current),
    autoRenew: Boolean(data.auto_renew),
    source: data.source,

    plan: plan
      ? {
          id: plan.id,
          key: plan.plan_key,
          name: plan.name,
          description: plan.description,
          type: plan.plan_type,
          priceTtd: Number(plan.price_ttd || 0),
          durationMonths: plan.duration_months,
          isPaid: Boolean(plan.is_paid),
          entitlements: plan.entitlements || {},
        }
      : null,
  };
}

export async function getPlayableProfileMembership() {
  const { getPlayableProfile } = await import(
    "./gameResults"
  );

  const playableProfile =
    await getPlayableProfile();

  if (!playableProfile) {
    return {
      guest: true,
      profile: null,
      membership: null,
    };
  }

  const membership =
    await getCurrentStudentMembership(
      playableProfile.profile.id
    );

  return {
    guest: false,
    profile: playableProfile.profile,
    membership,
  };
}

export function formatMembershipDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-TT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

