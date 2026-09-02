import React, { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminRoute({ children }) {
  const location = useLocation();

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAccess() {
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

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select(
              "account_type, admin_role, account_status"
            )
            .eq("id", session.user.id)
            .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const allowedAdminRoles = [
          "super_admin",
          "admin",
          "moderator",
        ];

        const isActiveAdmin =
          allowedAdminRoles.includes(
            profile?.admin_role
          ) &&
          profile?.account_status === "active";

        if (isMounted) {
          setStatus(
            isActiveAdmin
              ? "authorized"
              : "forbidden"
          );
        }
      } catch (error) {
        console.error(
          "Admin access check failed:",
          error
        );

        if (isMounted) {
          setStatus("error");
        }
      }
    }

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-slate-700">
            Checking admin access…
          </p>
        </div>
      </div>
    );
  }

  if (status === "signed_out") {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (status === "forbidden") {
    return <Navigate to="/dashboard" replace />;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Unable to verify access
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Please refresh the page or sign in
            again.
          </p>
        </div>
      </div>
    );
  }

  return children;
}


