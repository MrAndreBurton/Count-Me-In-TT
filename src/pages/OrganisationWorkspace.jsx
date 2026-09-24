import { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  LogOut,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  discoverAssignedGroupScope,
  discoverOrganisationAdminScope,
} from "../lib/organisationDiscovery";
import { isActivePlatformAdmin } from "../lib/accountCapabilities";
import { createOrganisationStudent } from "../lib/organisationRoster";

const ORGANISATION_ROLE_LABELS = {
  organisation_admin: "Organisation Administrator",
  teacher: "Teacher",
  tutor: "Tutor",
};

const ORGANISATION_ROLE_ORDER = [
  "organisation_admin",
  "teacher",
  "tutor",
];

function formatOrganisationRoles(roles) {
  return roles
    .map(
      (role) =>
        ORGANISATION_ROLE_LABELS[role] || role
    )
    .join(" | ");
}

function formatOrganisationType(type) {
  if (type === "school") {
    return "School";
  }

  if (type === "tutoring_service") {
    return "Tutoring Service";
  }

  return "Organisation";
}

export default function OrganisationWorkspace() {
  const { organisationId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] =
    useState(null);

  const [status, setStatus] =
    useState("loading");

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const [reloadToken, setReloadToken] =
    useState(0);

  const [isAddLearnerOpen, setIsAddLearnerOpen] =
    useState(false);

  const [isAddingLearner, setIsAddingLearner] =
    useState(false);

  const [addLearnerError, setAddLearnerError] =
    useState("");

  const [newLearner, setNewLearner] = useState({
    firstName: "",
    lastName: "",
    publicDisplayName: "",
    currentLevel: "",
    academicYear: "",
    groupId: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOrganisationWorkspace() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          if (isMounted) {
            setStatus("signed_out");
          }

          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("admin_role, account_status")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profile || profile.account_status !== "active") {
          if (isMounted) {
            setStatus("forbidden");
          }

          return;
        }

        const hasActivePlatformAdminAccess =
          isActivePlatformAdmin(profile);

        /*
         * The URL requests an organisation context.
         *
         * It does not grant access to that context.
         *
         * The organisation must first be visible
         * through the existing organisations RLS.
         */
        const {
          data: organisation,
          error: organisationError,
        } = await supabase
          .from("organisations")
          .select(
            `
              id,
              name,
              organisation_type,
              status
            `
          )
          .eq("id", organisationId)
          .eq("status", "active")
          .maybeSingle();

        if (organisationError) {
          throw organisationError;
        }

        if (!organisation) {
          if (isMounted) {
            setStatus("forbidden");
          }

          return;
        }

        /*
         * Resolve the authenticated account's
         * current active staff relationship.
         *
         * This prevents the page from treating
         * organisation visibility alone as a
         * selected staff context.
         */
        const {
          data: staff,
          error: staffError,
        } = await supabase
          .from("organisation_staff")
          .select(
            `
              id,
              organisation_id
            `
          )
          .eq(
            "organisation_id",
            organisation.id
          )
          .eq(
            "profile_id",
            session.user.id
          )
          .eq("status", "active")
          .is("ended_at", null)
          .maybeSingle();

        if (staffError) {
          throw staffError;
        }

        if (!staff) {
          if (isMounted) {
            setStatus("forbidden");
          }

          return;
        }

        /*
         * Roles describe what kind of
         * organisation staff context this is.
         *
         * Actual access to future organisation
         * resources remains governed by RLS.
         */
        const {
          data: roleData,
          error: roleError,
        } = await supabase
          .from("organisation_staff_roles")
          .select("role")
          .eq("staff_id", staff.id);

        if (roleError) {
          throw roleError;
        }

        const roles = (roleData || [])
          .map((row) => row.role)
          .sort(
            (roleA, roleB) =>
              ORGANISATION_ROLE_ORDER.indexOf(
                roleA
              ) -
              ORGANISATION_ROLE_ORDER.indexOf(
                roleB
              )
          );

        /*
 * Roles decide which discovery paths the
 * frontend should attempt.
 *
 * They do not grant access themselves.
 * Every returned row remains governed by RLS.
 */

const hasAssignedGroupRole =
  roles.includes("teacher") ||
  roles.includes("tutor");

const hasOrganisationAdminRole =
  roles.includes("organisation_admin");

let groupDiscovery = {
  groups: [],
  learners: [],
  counts: {
    activeGroups: 0,
    visibleLearners: 0,
  },
};

let adminDiscovery = {
  learners: [],
  counts: {
    activeEnrolments: 0,
    visibleLearners: 0,
  },
};

/*
 * Teachers/tutors attempt the assigned-group path.
 */
if (hasAssignedGroupRole) {
  groupDiscovery = await discoverAssignedGroupScope({
    supabase,
    organisationId: organisation.id,
    staffId: staff.id,
  });
}

/*
 * Organisation administrators additionally attempt
 * the organisation-wide active-enrolment path.
 */
if (hasOrganisationAdminRole || hasActivePlatformAdminAccess) {
  adminDiscovery = await discoverOrganisationAdminScope({
    supabase,
    organisationId: organisation.id,
  });
}

/*
 * Multiple valid authorization paths are unioned.
 * A learner visible through more than one path must
 * still appear only once.
 */
const learnerMap = new Map();

for (const learner of groupDiscovery.learners) {
  learnerMap.set(learner.studentId, {
    ...learner,
    groups: [...learner.groups],
  });
}

for (const learner of adminDiscovery.learners) {
  const existing = learnerMap.get(learner.studentId);

  if (existing) {
    continue;
  }

  learnerMap.set(learner.studentId, {
    ...learner,
    groups: [...learner.groups],
  });
}

const learners = [...learnerMap.values()].sort((a, b) =>
  a.displayName.localeCompare(b.displayName)
);

const discovery = {
  groups: groupDiscovery.groups,
  learners,
  counts: {
    activeGroups: groupDiscovery.groups.length,
    activeEnrolments:
      adminDiscovery.counts.activeEnrolments,
    visibleLearners: learners.length,
  },
};

if (isMounted) {
  setWorkspace({
    organisation,
    staffId: staff.id,
    roles,
    isActivePlatformAdmin: hasActivePlatformAdminAccess,
    canManageRoster:
      hasActivePlatformAdminAccess ||
      hasOrganisationAdminRole,
    discovery,
  });

  setStatus("ready");
}

      } catch (error) {
        console.error(
          "Unable to load organisation workspace:",
          error
        );

        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadOrganisationWorkspace();

    return () => {
      isMounted = false;
    };
  }, [organisationId, reloadToken]);

  function openAddLearner() {
    const defaultGroupId =
      workspace?.discovery?.groups?.length === 1
        ? workspace.discovery.groups[0].id
        : "";

    setNewLearner({
      firstName: "",
      lastName: "",
      publicDisplayName: "",
      currentLevel: "",
      academicYear: "",
      groupId: defaultGroupId,
    });
    setAddLearnerError("");
    setIsAddLearnerOpen(true);
  }

  function closeAddLearner() {
    if (isAddingLearner) return;
    setIsAddLearnerOpen(false);
    setAddLearnerError("");
  }

  function updateNewLearner(field, value) {
    setNewLearner((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAddLearner(event) {
    event.preventDefault();

    if (!workspace?.canManageRoster) {
      setAddLearnerError(
        "You do not have permission to manage this roster."
      );
      return;
    }

    try {
      setIsAddingLearner(true);
      setAddLearnerError("");

      await createOrganisationStudent({
        supabase,
        organisationId: workspace.organisation.id,
        firstName: newLearner.firstName,
        lastName: newLearner.lastName,
        publicDisplayName: newLearner.publicDisplayName,
        currentSchool:
          workspace.organisation.organisation_type === "school"
            ? workspace.organisation.name
            : null,
        currentLevel: newLearner.currentLevel,
        academicYear: newLearner.academicYear,
        groupId: newLearner.groupId || null,
      });

      setIsAddLearnerOpen(false);
      setReloadToken((value) => value + 1);
    } catch (error) {
      console.error("Unable to add learner:", error);
      setAddLearnerError(
        error?.message ||
          "The learner could not be added. Please try again."
      );
    } finally {
      setIsAddingLearner(false);
    }
  }

  async function handleSignOut() {
    try {
      setIsSigningOut(true);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Sign out failed:",
        error
      );

      setIsSigningOut(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-slate-700">
            Opening organisation workspace...
          </p>
        </div>
      </div>
    );
  }

  if (status === "signed_out") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <ShieldCheck size={28} />
          </div>

          <h1 className="mt-6 text-2xl font-black text-slate-950">
            Workspace unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            This organisation is not available to
            your current account.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/workspace", {
                replace: true,
              })
            }
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Back to workspaces
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">
            Unable to open this workspace
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            The organisation workspace could not
            be loaded. Return to your workspaces
            and try again.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/workspace")
            }
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Back to workspaces
          </button>
        </div>
      </div>
    );
  }

 const {
  organisation,
  roles,
  discovery,
  canManageRoster,
} = workspace;

const groups = discovery?.groups ?? [];
const learners = discovery?.learners ?? [];

  const roleLabel =
    formatOrganisationRoles(roles) ||
    "Organisation staff";

  const organisationTypeLabel =
    formatOrganisationType(
      organisation.organisation_type
    );

const hasOrganisationAdminRole =
  roles.includes("organisation_admin");

const hasRosterView =
  canManageRoster || hasOrganisationAdminRole;

const groupsHeading =
  hasRosterView
    ? "Groups"
    : "My Groups";

const learnersHeading =
  hasRosterView
    ? "Learners"
    : "My Learners";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              navigate("/workspace")
            }
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Workspaces
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={18} />

            {isSigningOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </header>

        <main className="flex flex-1 items-center py-12 sm:py-16">
          <div className="w-full">
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-yellow-100 text-yellow-800">
                <Building2 size={28} />
              </div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-yellow-700">
                {organisationTypeLabel}
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {organisation.name}
              </h1>

              <p className="mt-4 text-base font-semibold text-slate-500">
                {roleLabel}
              </p>

              <div className="mt-9 border-t border-slate-200 pt-8">
  <section>
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {hasRosterView
            ? "Organisation groups"
            : "Teaching scope"}
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          {groupsHeading}
        </h2>
      </div>

      <p className="text-sm font-semibold text-slate-500">
        {groups.length}{" "}
        {groups.length === 1 ? "group" : "groups"}
      </p>
    </div>

    {groups.length === 0 ? (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
        <p className="font-semibold text-slate-700">
          {hasRosterView
            ? "No active groups."
            : "No active groups assigned."}
        </p>
      </div>
    ) : (
      <div className="mt-5 grid gap-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-bold text-slate-950">
                  {group.name}
                </h3>

                {group.academic_year && (
                  <p className="mt-1 text-sm text-slate-500">
                    {group.academic_year}
                  </p>
                )}
              </div>

              <p className="text-sm font-semibold text-slate-600">
                {group.learnerCount}{" "}
                {group.learnerCount === 1
                  ? "learner"
                  : "learners"}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>

  <section className="mt-10 border-t border-slate-200 pt-8">
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {hasRosterView
            ? "Organisation roster"
            : "Authorised learner scope"}
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          {learnersHeading}
        </h2>
      </div>

      <div className="flex flex-col items-end gap-2">
        {canManageRoster && (
          <button
            type="button"
            onClick={openAddLearner}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Add learner
          </button>
        )}

        <p className="text-sm font-semibold text-slate-500">
          {learners.length}{" "}
          {learners.length === 1
            ? "learner"
            : "learners"}
        </p>
      </div>
    </div>

    {learners.length === 0 ? (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
        <p className="font-semibold text-slate-700">
          {hasRosterView
            ? "No active learners are currently available."
            : "No learners are currently available through your assigned groups."}
       </p>
      </div>
    ) : (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {learners.map((learner) => (
          <div
            key={learner.studentId}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <h3 className="font-bold text-slate-950">
              {learner.displayName}
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              {learner.groups.map((group) => (
                <span
                  key={group.groupId}
                  className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800"
                >
                  {group.groupName}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
</div>
            </div>
          </div>
        </main>

        {isAddLearnerOpen && canManageRoster && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-5 py-8">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-700">
                    Organisation roster
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Add learner
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Create an organisation learner and optionally place them in an active group.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAddLearner}
                  disabled={isAddingLearner}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                  aria-label="Close add learner form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddLearner} className="mt-7 grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    First name
                    <input
                      required
                      value={newLearner.firstName}
                      onChange={(event) =>
                        updateNewLearner("firstName", event.target.value)
                      }
                      className="rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Last name
                    <input
                      required
                      value={newLearner.lastName}
                      onChange={(event) =>
                        updateNewLearner("lastName", event.target.value)
                      }
                      className="rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Display name
                  <input
                    value={newLearner.publicDisplayName}
                    onChange={(event) =>
                      updateNewLearner("publicDisplayName", event.target.value)
                    }
                    placeholder="Optional — defaults to first and last name"
                    className="rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Current level
                    <input
                      value={newLearner.currentLevel}
                      onChange={(event) =>
                        updateNewLearner("currentLevel", event.target.value)
                      }
                      placeholder="Optional"
                      className="rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Academic year
                    <input
                      value={newLearner.academicYear}
                      onChange={(event) =>
                        updateNewLearner("academicYear", event.target.value)
                      }
                      placeholder="e.g. 2026/27"
                      className="rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Add to group
                  <select
                    value={newLearner.groupId}
                    onChange={(event) =>
                      updateNewLearner("groupId", event.target.value)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                  >
                    <option value="">No group yet</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                       {group.name}
                      </option>
                    ))}
                  </select>
                </label>

                {addLearnerError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {addLearnerError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddLearner}
                    disabled={isAddingLearner}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingLearner}
                    className="rounded-xl bg-yellow-400 px-5 py-3 font-black text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingLearner ? "Adding learner..." : "Add learner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-slate-400">
          CountMeInTT Organisation Workspace
        </footer>
      </div>
    </div>
  );
}


