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
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";

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

        if (isMounted) {
          setWorkspace({
            organisation,
            staffId: staff.id,
            roles,
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
  }, [organisationId]);

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
  } = workspace;

  const roleLabel =
    formatOrganisationRoles(roles) ||
    "Organisation staff";

  const organisationTypeLabel =
    formatOrganisationType(
      organisation.organisation_type
    );

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
                <h2 className="text-xl font-black text-slate-950">
                  Organisation workspace
                </h2>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Your organisation context is
                  active. Learners, groups and
                  organisation tools will be added
                  in the next workspace layer.
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-400">
          CountMeInTT Organisation Workspace
        </footer>
      </div>
    </div>
  );
}


