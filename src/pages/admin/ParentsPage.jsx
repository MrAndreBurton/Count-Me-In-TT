import {
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import ParentCard from "../../components/admin/parents/ParentCard";

import {
  mapSupabaseParentToAdminParent,
} from "../../utils/adminParentMapper";


import {
  fetchAdminParents,
} from "../../services/adminParentsService";

export default function ParentsPage() {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [parents, setParents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const searchValue =
    searchTerm.toLowerCase().trim();

useEffect(() => {
  let isMounted = true;

  async function loadParents() {
    try {
      setIsLoading(true);
      setLoadError("");

      const data = await fetchAdminParents();

      if (!isMounted) return;

      const mappedParents = data.map(
        mapSupabaseParentToAdminParent,
      );

      setParents(mappedParents);

    } catch (error) {
      console.error(
        "Unable to load parents:",
        error,
      );

      if (isMounted) {
        setLoadError(
          "Parent accounts could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  loadParents();

  return () => {
    isMounted = false;
  };
}, []);

  const filteredParents = parents.filter(
    (parent) => {
      const matchesSearch =
        !searchValue ||
        parent.name
          .toLowerCase()
          .includes(searchValue) ||
        parent.email
          .toLowerCase()
          .includes(searchValue) ||
        parent.phone.includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        parent.status === statusFilter;

      return matchesSearch && matchesStatus;
    },
  );

  return (
    <AdminLayout>
      <section className="pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Account Management
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Parents
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Manage parent accounts, contact
              information and connected student
              profiles.
            </p>
          </div>

          <Link
            to="/admin/parents/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-yellow-500 hover:text-slate-950"
          >
            <UserPlus size={19} />
            Add parent
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <UsersRound size={22} />
          </div>

          <div>
            <p className="text-2xl font-black text-slate-950">
              {isLoading ? "—" : filteredParents.length}
            </p>

            <p className="text-sm text-slate-500">
              Parents displayed
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <label className="relative block">
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
                placeholder="Search by name, email or phone"
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
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
              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {isLoading && (
  <div className="mt-8 rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm">
    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-400" />

    <p className="mt-5 font-bold text-slate-700">
      Loading parent accounts...
    </p>

    <p className="mt-2 text-sm text-slate-500">
      Retrieving the latest client information.
    </p>
  </div>
)}

{!isLoading && loadError && (
  <div
    role="alert"
    className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center"
  >
    <h2 className="text-xl font-black text-red-800">
      Unable to load parents
    </h2>

    <p className="mt-2 text-sm text-red-700">
      {loadError}
    </p>
  </div>
)}

{!isLoading &&
  !loadError &&
  (filteredParents.length > 0 ? (
    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {filteredParents.map((parent) => (
        <ParentCard
          key={parent.id}
          parent={parent}
        />
      ))}
    </div>
  ) : (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <UsersRound
        size={34}
        className="mx-auto text-slate-300"
      />

      <h2 className="mt-4 text-xl font-black text-slate-950">
        No parents found
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search or status filter.
      </p>
    </div>
  ))}
      </section>
    </AdminLayout>
  );
}


