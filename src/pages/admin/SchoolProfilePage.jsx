import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  School,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  fetchAdminSchoolById,
} from "../../services/adminOrganisationsService";

function getLearnerName(student) {
  return (
    student.public_display_name ||
    `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
    "Unnamed learner"
  );
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function formatDate(
  dateValue,
  fallback = "Not available",
) {
  if (!dateValue) return fallback;

  return new Date(
    dateValue,
  ).toLocaleDateString("en-TT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SchoolProfilePage() {
  const { organisationId } = useParams();

  const [school, setSchool] =
    useState(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSchool() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await fetchAdminSchoolById(
            organisationId,
          );

        if (!isMounted) return;

        setSchool(data);
      } catch (error) {
        console.error(
          "Unable to load school profile:",
          error,
        );

        if (isMounted) {
          setLoadError(
            "The school profile could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSchool();

    return () => {
      isMounted = false;
    };
  }, [organisationId]);

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <p className="font-bold text-slate-600">
            Loading school profile...
          </p>
        </section>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-black text-red-700">
            Unable to load school
          </h1>

          <p className="mt-3 text-red-600">
            {loadError}
          </p>

          <Link
            to="/admin/schools"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={18} />
            Return to schools
          </Link>
        </section>
      </AdminLayout>
    );
  }

  if (!school) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <School size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            School not found
          </h1>

          <p className="mt-2 text-slate-500">
            This school organisation does not exist.
          </p>

          <Link
            to="/admin/schools"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-yellow-500 hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Return to schools
          </Link>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="pb-12">
        <Link
          to="/admin/schools"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={18} />
          Back to schools
        </Link>

        <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              School Profile
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {school.name}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Institutional overview and active
              learner roster.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            {formatStatus(school.status)}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <UsersRound size={23} />
            </div>

            <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              {school.learners.length}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              Active learners
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <School size={23} />
            </div>

            <p className="mt-5 text-lg font-black tracking-tight text-slate-950">
              {school.school_catalogue_id ||
                "Not linked"}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              School catalogue
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <CalendarDays size={23} />
            </div>

            <p className="mt-5 text-lg font-black tracking-tight text-slate-950">
              {formatDate(school.created_at)}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              Organisation created
            </p>
          </article>
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                Institutional Roster
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Learners
              </h2>
            </div>

            <p className="text-sm font-bold text-slate-400">
              Active enrolments only
            </p>
          </div>

          {school.learners.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <UserRound size={26} />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                No active learners
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                This school currently has no active
                organisation enrolments.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {school.learners.map(
                ({
                  enrolmentId,
                  joinedAt,
                  student,
                  groups,
                }) => (
                  <article
                    key={enrolmentId}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                          <GraduationCap
                            size={23}
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-slate-950">
                            {getLearnerName(
                              student,
                            )}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span>
                              Profile:{" "}
                              <strong className="font-bold text-slate-700">
                                {formatStatus(
                                  student.profile_status,
                                )}
                              </strong>
                            </span>

                            <span>
                              Origin:{" "}
                              <strong className="font-bold text-slate-700">
                                {formatStatus(
                                  student.origin_type,
                                )}
                              </strong>
                            </span>

                            <span>
                              Joined:{" "}
                              <strong className="font-bold text-slate-700">
                                {formatDate(
                                  joinedAt,
                                )}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {groups.length > 0 ? (
                          groups.map((group) => (
                            <div
                              key={group.id}
                              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                            >
                              <BookOpen
                                size={16}
                              />

                              <span>
                                {group.name}
                              </span>

                              {group.academic_year && (
                                <span className="text-slate-400">
                                  {
                                    group.academic_year
                                  }
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-400">
                            No active group
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
