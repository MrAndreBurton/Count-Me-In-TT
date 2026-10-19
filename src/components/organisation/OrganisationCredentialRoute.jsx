import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function OrganisationCredentialRoute({ children }) {
  const { organisationId, studentId } = useParams();
  const location = useLocation();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    async function verify() {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        if (!session?.user) {
          if (mounted) setStatus("signed_out");
          return;
        }
        const { data, error } = await supabase.rpc(
          "discover_organisation_student_credential_state",
          { target_organisation_id: organisationId, target_student_id: studentId },
        );
        if (mounted) setStatus(!error && ["NONE", "CURRENT_ORGANISATION_MANAGED", "EXTERNAL"].includes(data) ? "authorized" : "forbidden");
      } catch (error) {
        console.error("Unable to verify organisation credential access:", error);
        if (mounted) setStatus("error");
      }
    }
    verify();
    return () => { mounted = false; };
  }, [organisationId, studentId]);

  if (status === "loading") return <div className="min-h-screen grid place-items-center">Checking organisation access…</div>;
  if (status === "signed_out") return <Navigate to="/login" state={{ from: location }} replace />;
  if (status === "forbidden") return <Navigate to={`/organisation/${organisationId}`} replace />;
  if (status === "error") return <div className="min-h-screen grid place-items-center">Unable to verify access. Please refresh.</div>;
  return children;
}
