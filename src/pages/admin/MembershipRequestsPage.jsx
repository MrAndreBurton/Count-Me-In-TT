import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  fetchAdminMembershipRequests,
} from "../../services/adminMembershipRequestsService";

const openStatuses = [
  "pending",
  "contacted",
  "payment_pending",
];

export default function MembershipRequestsPage() {
  const [requests, setRequests] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [requestView, setRequestView] =
    useState("open");

  useEffect(() => {
    let isMounted = true;

    async function loadRequests() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await fetchAdminMembershipRequests();

        if (!isMounted) return;

        setRequests(data);
      } catch (error) {
        console.error(
          "Unable to load membership requests:",
          error,
        );

        if (isMounted) {
          setLoadError(
            error?.message ||
              "Membership requests could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const openRequestCount = useMemo(
    () =>
      requests.filter((request) =>
        openStatuses.includes(
          request.status,
        ),
      ).length,
    [requests],
  );

  const visibleRequests = useMemo(() => {
    if (requestView === "all") {
      return requests;
    }

    return requests.filter((request) =>
      openStatuses.includes(
        request.status,
      ),
    );
  }, [requests, requestView]);

  return (
    <AdminLayout>
      <section className="pb-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
          Access Management
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Membership Requests
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Review and process student membership
          requests.
        </p>

        <nav className="mt-8 flex flex-wrap gap-3 border-b border-slate-200">
          <Link
            to="/admin/memberships"
            className="border-b-4 border-transparent px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-yellow-200 hover:text-slate-950"
          >
            Memberships
          </Link>

          <Link
            to="/admin/memberships/requests"
            className="inline-flex items-center gap-2 border-b-4 border-yellow-400 px-4 py-3 text-sm font-black text-slate-950"
          >
            Requests

            {openRequestCount > 0 && (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">
                {openRequestCount}
              </span>
            )}
          </Link>
        </nav>

<div className="mt-6 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={() =>
      setRequestView("open")
    }
    className={
      requestView === "open"
        ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
        : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
    }
  >
    Open Requests ({openRequestCount})
  </button>

  <button
    type="button"
    onClick={() =>
      setRequestView("all")
    }
    className={
      requestView === "all"
        ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
        : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
    }
  >
    All Request History
  </button>
</div>

        {isLoading && (
          <section className="py-16 text-center">
            <p className="font-bold text-slate-600">
              Loading membership requests...
            </p>
          </section>
        )}

        {loadError && (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-black text-red-900">
              Unable to load requests
            </h2>

            <p className="mt-2 text-red-700">
              {loadError}
            </p>
          </section>
        )}

        {!isLoading &&
          !loadError &&
          visibleRequests.length === 0 && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                No membership requests
              </h2>

              <p className="mt-3 text-slate-500">
                New requests will appear here.
              </p>
            </section>
          )}

        {!isLoading &&
          !loadError &&
          visibleRequests.length > 0 && (
            <div className="mt-8 space-y-4">
              {visibleRequests.map((request) => {
                const student =
                  request.student_profiles;

                const plan =
                  request.membership_plans;

                const studentName = [
                  student?.first_name,
                  student?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <Link
                    key={request.id}
                    to={`/admin/memberships/requests/${request.id}`}
                    className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50"
                   >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-950">
                          {studentName ||
                            "Unnamed student"}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-yellow-700">
                          {plan?.name ||
                            "Unknown plan"}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Requested{" "}
                          {formatDate(
                            request.requested_at,
                          )}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">
                        {formatStatus(
                          request.status,
                        )}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
      </section>
    </AdminLayout>
  );
}

function formatStatus(status = "") {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleDateString(
    "en-TT",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}

