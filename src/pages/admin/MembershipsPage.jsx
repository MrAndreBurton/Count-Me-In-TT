import { Link } from "react-router-dom";

import {
  CreditCard,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  fetchAdminMemberships,
} from "../../services/adminMembershipsService";

import {
  fetchAdminMembershipRequests,
} from "../../services/adminMembershipRequestsService";

export default function MembershipsPage() {
  const [memberships, setMemberships] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [historyFilter, setHistoryFilter] =
    useState("Current");

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [
    membershipRequests,
    setMembershipRequests,
  ] = useState([]);

  const [
    isLoadingRequests,
    setIsLoadingRequests,
  ] = useState(true);

  const [
    requestLoadError,
    setRequestLoadError,
  ] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMemberships() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await fetchAdminMemberships();

        if (!isMounted) return;

        setMemberships(data);
      } catch (error) {
        console.error(
          "Unable to load memberships:",
          error,
        );

        if (isMounted) {
          setLoadError(
            "Memberships could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMemberships();

    return () => {
      isMounted = false;
    };
  }, []);

useEffect(() => {
  let isMounted = true;

  async function loadMembershipRequests() {
    try {
      setIsLoadingRequests(true);
      setRequestLoadError("");

      const data =
        await fetchAdminMembershipRequests();

      if (!isMounted) return;

      setMembershipRequests(data);
    } catch (error) {
      console.error(
        "Unable to load membership requests:",
        error,
      );

      if (isMounted) {
        setRequestLoadError(
          "Membership requests could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoadingRequests(false);
      }
    }
  }

  loadMembershipRequests();

  return () => {
    isMounted = false;
  };
}, []);

const openRequestCount = useMemo(() => {
  const openStatuses = [
    "pending",
    "contacted",
    "payment_pending",
  ];

  return membershipRequests.filter(
    (request) =>
      openStatuses.includes(
        request.status,
      ),
  ).length;
}, [membershipRequests]);

  const filteredMemberships = useMemo(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    return memberships.filter(
      (membership) => {
        const matchesHistory =
        historyFilter === "All" ||
        membership.is_current === true;
        
        const student =
        membership.student_profiles;

        const parent = student?.profiles;

        const studentName = [
          student?.first_name,
          student?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const parentName =
          parent?.full_name
            ?.toLowerCase() || "";

        const matchesSearch =
          !searchValue ||
          studentName.includes(searchValue) ||
          parentName.includes(searchValue);

        const formattedStatus =
          formatStatus(membership.status);

        const matchesStatus =
          statusFilter === "All" ||
          formattedStatus === statusFilter;

       return (
         matchesSearch &&
         matchesStatus &&
         matchesHistory
       );
      },
    );
  }, [
    memberships,
    searchTerm,
    statusFilter,
    historyFilter,
  ]);

  return (
    <AdminLayout>
      <section className="pb-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
          Access Management
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Memberships
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Manage student plans, access periods,
          renewals and membership status.
        </p>

<nav className="mt-8 flex flex-wrap gap-3 border-b border-slate-200">
  <Link
    to="/admin/memberships"
    className="border-b-4 border-yellow-400 px-4 py-3 text-sm font-black text-slate-950"
  >
    Memberships
  </Link>

  <Link
    to="/admin/memberships/requests"
    className="inline-flex items-center gap-2 border-b-4 border-transparent px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-yellow-200 hover:text-slate-950"
  >
    Requests

    {!isLoadingRequests &&
      !requestLoadError &&
      openRequestCount > 0 && (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">
          {openRequestCount}
        </span>
      )}
  </Link>
</nav>

{isLoadingRequests && (
  <p className="mt-3 text-xs font-bold text-slate-400">
    Checking membership requests...
  </p>
)}

{requestLoadError && (
  <p className="mt-3 text-xs font-bold text-red-600">
    {requestLoadError}
  </p>
)}

        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <CreditCard size={22} />
          </div>

          <div>
            <p className="text-2xl font-black text-slate-950">
              {isLoading
                ? "—"
                : filteredMemberships.length}
            </p>

            <p className="text-sm text-slate-500">
              Memberships displayed
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
            <label className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search student or parent"
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
            >
              <option value="All">
                All statuses
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Expired">
                Expired
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
           
           <select
  value={historyFilter}
  onChange={(event) =>
    setHistoryFilter(
      event.target.value,
    )
  }
  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
>
  <option value="Current">
    Current memberships
  </option>

  <option value="All">
    All membership history
  </option>
</select>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-400" />

            <p className="mt-5 font-bold text-slate-700">
              Loading memberships...
            </p>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <h2 className="text-xl font-black text-red-800">
              Unable to load memberships
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {loadError}
            </p>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          filteredMemberships.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <CreditCard
                size={34}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-xl font-black text-slate-950">
                No memberships found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Membership records will appear
                here once assigned to students.
              </p>
            </div>
          )}

        {!isLoading &&
          !loadError &&
          filteredMemberships.length > 0 && (
            <div className="mt-8 space-y-4">
              {filteredMemberships.map(
                (membership) => (
                  <MembershipRow
                    key={membership.id}
                    membership={membership}
                  />
                ),
              )}
            </div>
          )}
      </section>
    </AdminLayout>
  );
}

function MembershipRow({
  membership,
}) {
  const student =
    membership.student_profiles;

  const parent = student?.profiles;

  const plan =
    membership.membership_plans;

  const studentName = [
    student?.first_name,
    student?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
   <Link
     to={`/admin/memberships/${membership.id}`}
     className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"
   >
      <div>
        <p className="font-black text-slate-950">
          {studentName ||
            "Unnamed student"}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {parent?.full_name ||
            "No parent linked"}
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Plan
        </p>

        <p className="mt-1 font-bold text-slate-800">
          {plan?.name || "No plan"}
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Expires
        </p>

        <p className="mt-1 font-bold text-slate-800">
          {formatDate(
            membership.expires_at,
            "No expiry",
          )}
        </p>
      </div>

      <span className="w-fit rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">
        {formatStatus(
          membership.status,
        )}
      </span>
    </Link>
  );
}

function formatStatus(status) {
  if (!status) return "Pending";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function formatDate(
  dateValue,
  fallback,
) {
  if (!dateValue) return fallback;

  return new Date(
    dateValue,
  ).toLocaleDateString("en-TT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
