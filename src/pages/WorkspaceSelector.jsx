import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
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

export default function WorkspaceSelector() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [isSigningOut, setIsSigningOut] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
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

        const { data, error } = await supabase
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

        if (error) {
          throw error;
        }

        const hasAdminAccess =
          ADMIN_ROLES.includes(data?.admin_role) &&
          data?.account_status === "active";

        if (!hasAdminAccess) {
          if (isMounted) {
            setStatus("forbidden");
          }

          return;
        }

        if (isMounted) {
          setProfile(data);
          setStatus("ready");
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

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    try {
      setIsSigningOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Sign out failed:", error);
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
    return <Navigate to="/login" replace />;
  }

  if (status === "forbidden") {
    if (profile?.account_type === "student") {
      return (
        <Navigate
          to="/student-dashboard"
          replace
        />
      );
    }

    return <Navigate to="/dashboard" replace />;
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

  const roleLabel =
    profile?.admin_role === "super_admin"
      ? "Super Administrator"
      : profile?.admin_role === "moderator"
        ? "Moderator"
        : "Administrator";

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    "there";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div>
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

              <p className="mt-3 text-sm font-semibold text-slate-500">
                {roleLabel}
              </p>

              <p className="mt-7 text-lg leading-8 text-slate-600">
                Choose the workspace you would like to
                open.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="group relative overflow-hidden rounded-3xl border border-yellow-300 bg-yellow-400 p-7 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-yellow-200"
              >
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/20" />

                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-yellow-300">
                    <LayoutDashboard size={24} />
                  </div>

                  <h2 className="mt-7 text-2xl font-black text-slate-950">
                    Control Centre
                  </h2>

                  <p className="mt-3 min-h-16 text-sm leading-6 text-slate-800">
                    Manage students, memberships, games,
                    reports and platform settings.
                  </p>

                  <div className="mt-7 flex items-center justify-between border-t border-slate-950/15 pt-5">
                    <span className="font-bold text-slate-950">
                      Open workspace
                    </span>

                    <ArrowRight
                      size={21}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-800">
                  <Users size={24} />
                </div>

                <h2 className="mt-7 text-2xl font-black text-slate-950">
                  Parent Dashboard
                </h2>

                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">
                  Experience CountMeInTT exactly as a
                  parent does and manage your learner
                  profiles.
                </p>

                <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5">
                  <span className="font-bold text-slate-800">
                    Open workspace
                  </span>

                  <ArrowRight
                    size={21}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-400">
          CountMeInTT Control Centre
        </footer>
      </div>
    </div>
  );
}

