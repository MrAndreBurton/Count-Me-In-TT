import { supabase } from "../lib/supabase";

export async function fetchAdminDashboardData() {
  const [
    studentsResult,
    roundsResult,
    membershipsResult,
    badgesResult,
    membershipRequestsResult,
  ] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("game_results")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "verification_status",
        "verified",
      ),

    supabase
      .from("student_memberships")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_current", true),

    supabase
      .from("student_badges")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("membership_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending"),
  ]);

  const results = [
    studentsResult,
    roundsResult,
    membershipsResult,
    badgesResult,
    membershipRequestsResult,
  ];

  const failedResult =
    results.find(
      (result) => result.error,
    );

  if (failedResult) {
    throw failedResult.error;
  }

  const pendingMembershipRequests =
    membershipRequestsResult.count || 0;

  const tasks = [];

  if (
    pendingMembershipRequests > 0
  ) {
    tasks.push({
      id: "membership-requests",

      text: `Review ${pendingMembershipRequests} pending membership ${
        pendingMembershipRequests === 1
          ? "request"
          : "requests"
      }`,
    });
  }

  return {
    stats: {
      students:
        studentsResult.count || 0,

      verifiedRounds:
        roundsResult.count || 0,

      activeMemberships:
        membershipsResult.count || 0,

      badgesAwarded:
        badgesResult.count || 0,
    },

    tasks,
  };
}

