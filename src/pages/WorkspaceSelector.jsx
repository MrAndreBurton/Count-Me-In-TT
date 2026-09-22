import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "moderator",
];

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
    .join(" · ");
}

export default function WorkspaceSelector() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [status, setStatus] = useState("loading");
  const [isSigningOut, setIsSigningOut] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaces() {
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

        /*
         * Account identity
         *
         * An active account may have one or more
         * independent workspace contexts.
         */
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              account_type,
              admin_role,
              account_status
            `
          )
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (
          !profileData ||
          profileData.account_status !== "active"
        ) {
          if (isMounted) {
            setProfile(profileData);
            setStatus("forbidden");
          }

          return;
        }

        /*
         * Organisation discovery
         *
         * Only the authenticated user's own active
         * staff relationships are requested.
         * Database RLS remains authoritative.
         */
        const {
          data: staffData,
          error: staffError,
        } = await supabase
          .from("organisation_staff")
          .select(
            `
              id,
              organisation_id
            `
          )
          .eq("profile_id", session.user.id)
          .eq("status", "active")
          .is("ended_at", null);

        if (staffError) {
          throw staffError;
        }

        const activeStaff = staffData || [];

        const organisationIds = [
          ...new Set(
            activeStaff.map(
              (staff) => staff.organisation_id
            )
          ),
        ];

        const staffIds = activeStaff.map(
          (staff) => staff.id
        );

        let organisations = [];
        let roleRows = [];

        if (organisationIds.length > 0) {
          const {
            data,
            error,
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
            .in("id", organisationIds)
            .eq("status", "active");

          if (error) {
            throw error;
          }

          organisations = data || [];
        }

        if (staffIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("organisation_staff_roles")
            .select(
              `
                staff_id,
                role
              `
            )
            .in("staff_id", staffIds);

          if (error) {
            throw error;
          }

          roleRows = data || [];
        }

        /*
         * Build the workspace list from actual
         * authorization relationships.
         *
         * Nothing below hard-codes a particular
         * organisation, user or organisation UUID.
         */
        const discoveredWorkspaces = [];

        /*
         * Platform workspace
         */
        if (
          ADMIN_ROLES.includes(
            profileData.admin_role
          )
        ) {
          const platformRoleLabel =
            profileData.admin_role ===
            "super_admin"
              ? "Super Administrator"
              : profileData.admin_role ===
                  "moderator"
                ? "Moderator"
                : "Administrator";

          discoveredWorkspaces.push({
            key: "platform",
            type: "platform",
            label: "Control Centre",
            roleLabel: platformRoleLabel,
            path: "/admin",
          });
        }

        /*
         * Personal workspace
         */
        if (
          profileData.account_type === "parent"
        ) {
          discoveredWorkspaces.push({
            key: "personal",
            type: "personal",
            label: "Parent Dashboard",
            roleLabel: "Personal workspace",
            path: "/dashboard",
          });
        } else if (
          profileData.account_type === "student"
        ) {
          discoveredWorkspaces.push({
            key: "personal",
            type: "personal",
            label: "Student Dashboard",
            roleLabel: "Personal workspace",
            path: "/dashboard",
          });
        }

        /*
         * Organisation workspaces
         *
         * Multiple roles in the same organisation
         * produce one workspace card.
         */
        for (const organisation of organisations) {
          const staff = activeStaff.find(
            (item) =>
              item.organisation_id ===
              organisation.id
          );

          if (!staff) {
            continue;
          }

          const roles = roleRows
            .filter(
              (row) =>
                row.staff_id === staff.id
            )
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

          discoveredWorkspaces.push({
            key: `organisation:${organisation.id}`,
            type: "organisation",
            organisationId: organisation.id,
            label: organisation.name,
            roleLabel:
              formatOrganisationRoles(roles) ||
              "Organisation staff",
            path: `/organisation/${organisation.id}`,
          });
        }

        if (isMounted) {
          setProfile(profileData);
          setWorkspaces(
            discoveredWorkspaces
          );

          setStatus(
            discoveredWorkspaces.length > 0
              ? "ready"
              : "forbidden"
          );
        }
      } catch (error) {
        console.error(
          "Unable to load workspace selector:",
          error
        );

        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, []);

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
            Preparing your workspaces…
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
          <ShieldCheck
            size={32}
            className="mx-auto text-slate-500"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            No workspace available
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            This account does not currently have an
            active CountMeInTT workspace.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Unable to open your workspaces
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Refresh the page or sign in again.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  const firstName =
    profile?.full_name
      ?.trim()
      .split(/\s+/)[0] || "there";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-yellow-400 font-black text-slate-950 shadow-sm">
              C
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-slate-950">
                CountMeInTT
              </p>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Learning Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={18} />

            {isSigningOut
              ? "Signing out…"
              : "Sign out"}
          </button>
        </header>

        <main className="flex flex-1 items-center py-12 sm:py-16">
          <div className="w-full">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-yellow-100 text-yellow-800">
                <ShieldCheck size={28} />
              </div>

              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-yellow-700">
                Welcome back
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {firstName}
              </h1>

              <p className="mt-7 text-lg leading-8 text-slate-600">
                Choose the workspace you would like to
                open.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
              {workspaces.map((workspace) => {
                const Icon =
                  workspace.type === "platform"
                    ? LayoutDashboard
                    : workspace.type ===
                        "organisation"
                      ? Building2
                      : Users;

                const isFeatured =
                  workspace.type === "platform";

                return (
                  <button
                    key={workspace.key}
                    type="button"
                    onClick={() =>
                      navigate(workspace.path)
                    }
                    className={
                      isFeatured
                        ? "group relative overflow-hidden rounded-3xl border border-yellow-300 bg-yellow-400 p-7 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-yellow-200"
                        : "group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-slate-200"
                    }
                  >
                    {isFeatured && (
                      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/20" />
                    )}

                    <div className="relative">
                      <div
                        className={
                          isFeatured
                            ? "grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-yellow-300"
                            : "grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-800"
                        }
                      >
                        <Icon size={24} />
                      </div>

                      <h2 className="mt-7 text-2xl font-black text-slate-950">
                        {workspace.label}
                      </h2>

                      <p className="mt-3 min-h-6 text-sm font-semibold leading-6 text-slate-600">
                        {workspace.roleLabel}
                      </p>

                      <div
                        className={
                          isFeatured
                            ? "mt-7 flex items-center justify-between border-t border-slate-950/15 pt-5"
                            : "mt-7 flex items-center justify-between border-t border-slate-200 pt-5"
                        }
                      >
                        <span className="font-bold text-slate-800">
                          Open workspace
                        </span>

                        <ArrowRight
                          size={21}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-400">
          CountMeInTT Workspaces
        </footer>
      </div>
    </div>
  );
}


