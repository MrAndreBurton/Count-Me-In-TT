import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Building2,
  ChevronRight,
  Search,
  School,
} from "lucide-react";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  fetchAdminOrganisations,
} from "../../services/adminOrganisationsService";

function formatStatus(status) {
  if (!status) return "Unknown";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
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

export default function OrganisationsPage() {
  const [organisations, setOrganisations] =
    useState([]);
  const [searchTerm, setSearchTerm] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrganisations() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await fetchAdminOrganisations();

        if (!isMounted) return;

        setOrganisations(data);
      } catch (error) {
        console.error(
          "Unable to load organisations:",
          error,
        );

        if (isMounted) {
          setLoadError(
            "Organisations could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrganisations();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrganisations = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return organisations;
    }

    return organisations.filter(
      (organisation) =>
        [
          organisation.name,
          organisation.organisation_type,
          organisation.school_catalogue_id,
          organisation.status,
          formatOrganisationType(
            organisation.organisation_type,
          ),
        ]
          .filter(Boolean)
          .some((value) =>
            value
              .toLowerCase()
              .includes(normalizedSearch),
          ),
    );
  }, [organisations, searchTerm]);

  return (
    <AdminLayout>
      <section className="pb-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Organisation Management
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Organisations
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            View organisations connected to
            CountMeInTT and manage their
            institutional workspaces.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <Building2 size={22} />
          </div>

          <div>
            <p className="text-2xl font-black text-slate-950">
              {filteredOrganisations.length}
            </p>

            <p className="text-sm text-slate-500">
              Organisations displayed
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
              placeholder="Search organisations"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:bg-white"
            />
          </label>
        </div>

        {isLoading && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-slate-600">
              Loading organisations...
            </p>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">
              {loadError}
            </p>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          filteredOrganisations.length ===
            0 && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Building2 size={26} />
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-950">
                No organisations found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                No organisations match this
                search.
              </p>
            </div>
          )}

        {!isLoading &&
          !loadError &&
          filteredOrganisations.length > 0 && (
            <div className="mt-8 grid gap-4">
              {filteredOrganisations.map(
                (organisation) => (
                  <Link
                    key={organisation.id}
                    to={`/admin/organisations/${organisation.id}`}
                    className="group flex items-center justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                        {organisation.organisation_type ===
                        "school" ? (
                          <School size={23} />
                        ) : (
                          <Building2 size={23} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-slate-950">
                          {organisation.name}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="font-medium">
                            {formatOrganisationType(
                              organisation.organisation_type,
                            )}
                          </span>

                          <span
                            aria-hidden="true"
                            className="text-slate-300"
                          >
                            •
                          </span>

                          <span>
                            {formatStatus(
                              organisation.status,
                            )}
                          </span>

                          {organisation.school_catalogue_id && (
                            <>
                              <span
                                aria-hidden="true"
                                className="text-slate-300"
                              >
                                •
                              </span>

                              <span className="font-medium">
                                {
                                  organisation.school_catalogue_id
                                }
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      size={21}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-yellow-600"
                    />
                  </Link>
                ),
              )}
            </div>
          )}
      </section>
    </AdminLayout>
  );
}


