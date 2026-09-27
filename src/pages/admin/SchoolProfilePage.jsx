import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
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

import {
  addOrganisationStaff,
  fetchOrganisationStaff,
} from "../../lib/organisationStaff";

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

function formatDateTime(
  dateValue,
  fallback = "Never",
) {
  if (!dateValue) return fallback;

  return new Date(
    dateValue,
  ).toLocaleString("en-TT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SchoolProfilePage() {
  const { organisationId } = useParams();

  const [school, setSchool] =
    useState(null);

  const [staff, setStaff] =
    useState([]);

  const [showAddStaff, setShowAddStaff] =
    useState(false);

  const [staffForm, setStaffForm] =
    useState({
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      roles: [],
    });

  const [isAddingStaff, setIsAddingStaff] =
    useState(false);

  const [staffFormError, setStaffFormError] =
    useState("");

  const [staffFormSuccess, setStaffFormSuccess] =
    useState("");

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

          const [
            schoolData,
            staffData,
        ] = await Promise.all([
          fetchAdminSchoolById(
            organisationId,
          ),
          fetchOrganisationStaff(
            organisationId,
          ),
        ]);

        if (!isMounted) return;

        setSchool(schoolData);
        setStaff(staffData);

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

    function updateStaffForm(field, value) {
    setStaffForm((current) => ({
      ...current,
      [field]: value,
    }));

    setStaffFormError("");
    setStaffFormSuccess("");
  }

  function toggleStaffRole(role) {
    setStaffForm((current) => {
      const hasRole =
        current.roles.includes(role);

      return {
        ...current,
        roles: hasRole
          ? current.roles.filter(
              (currentRole) =>
                currentRole !== role
            )
          : [...current.roles, role],
      };
    });

    setStaffFormError("");
    setStaffFormSuccess("");
  }

  function resetStaffForm() {
    setStaffForm({
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      roles: [],
    });

    setStaffFormError("");
  }

  async function handleAddStaff(event) {
    event.preventDefault();

    try {
      setIsAddingStaff(true);
      setStaffFormError("");
      setStaffFormSuccess("");

      const result =
        await addOrganisationStaff({
          organisationId,
          firstName: staffForm.firstName,
          lastName: staffForm.lastName,
          email: staffForm.email,
          position: staffForm.position,
          roles: staffForm.roles,
        });

      const refreshedStaff =
        await fetchOrganisationStaff(
          organisationId
        );

      setStaff(refreshedStaff);

      setStaffFormSuccess(
        result.message ||
          "Staff member added successfully."
      );

      resetStaffForm();
    } catch (error) {
      console.error(
        "Unable to add organisation staff:",
        error
      );

      setStaffFormError(
        error?.message ||
          "The staff member could not be added."
      );
    } finally {
      setIsAddingStaff(false);
    }
  }

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
              Institutional overview, staff and
              active learner roster.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            {formatStatus(school.status)}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <BriefcaseBusiness size={23} />
            </div>

            <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              {
                staff.filter(
                  (member) =>
                    member.status === "active"
                ).length
              }
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              Active staff
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                Organisation Staff
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Staff
              </h2>

              <p className="mt-2 text-sm font-bold text-slate-400">
                {staff.length}{" "}
                {staff.length === 1
                  ? "staff relationship"
                  : "staff relationships"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddStaff((current) => !current);
                setStaffFormError("");
                setStaffFormSuccess("");
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              {showAddStaff
                ? "Cancel"
                : "Add staff"}
            </button>
          </div>

                     {showAddStaff && (
            <form
              onSubmit={handleAddStaff}
              className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  Add organisation staff
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Add an existing account or invite a
                  new staff member and assign their
                  authority within this organisation.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    First name
                  </span>

                  <input
                    type="text"
                    value={staffForm.firstName}
                    onChange={(event) =>
                      updateStaffForm(
                        "firstName",
                        event.target.value
                      )
                    }
                    autoComplete="given-name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Last name
                  </span>

                  <input
                    type="text"
                    value={staffForm.lastName}
                    onChange={(event) =>
                      updateStaffForm(
                        "lastName",
                        event.target.value
                      )
                    }
                    autoComplete="family-name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Email
                  </span>

                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(event) =>
                      updateStaffForm(
                        "email",
                        event.target.value
                      )
                    }
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Position
                  </span>

                  <input
                    type="text"
                    value={staffForm.position}
                    onChange={(event) =>
                      updateStaffForm(
                        "position",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Principal"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-500"
                  />

                  <span className="mt-2 block text-xs text-slate-400">
                    Optional real-world job title.
                  </span>
                </label>
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-bold text-slate-700">
                  Organisation roles
                </legend>

                <p className="mt-1 text-xs text-slate-400">
                  Select one or more roles. These
                  control authority within this
                  organisation only.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "organisation_admin",
                      label: "Organisation Admin",
                    },
                    {
                      value: "teacher",
                      label: "Teacher",
                    },
                    {
                      value: "tutor",
                      label: "Tutor",
                    },
                  ].map((role) => (
                    <label
                      key={role.value}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4"
                    >
                      <input
                        type="checkbox"
                        checked={staffForm.roles.includes(
                          role.value
                        )}
                        onChange={() =>
                          toggleStaffRole(
                            role.value
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-bold text-slate-700">
                        {role.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {staffFormError && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {staffFormError}
                </div>
              )}

              {staffFormSuccess && (
                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {staffFormSuccess}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isAddingStaff}
                  className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingStaff
                    ? "Adding staff..."
                    : "Add staff member"}
                </button>

                <button
                  type="button"
                  disabled={isAddingStaff}
                  onClick={() => {
                    resetStaffForm();
                    setShowAddStaff(false);
                    setStaffFormSuccess("");
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {staff.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <BriefcaseBusiness size={26} />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                No staff recorded
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                This organisation currently has no
                staff relationships.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {staff.map((member) => (
                <article
                  key={member.staffId}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                        <BriefcaseBusiness
                          size={23}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-950">
                          {member.fullName}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-600">
                          {member.position ||
                            "Position not recorded"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                          <span>
                            Staff status:{" "}
                            <strong className="font-bold text-slate-700">
                              {formatStatus(
                                member.status,
                              )}
                            </strong>
                          </span>

                          <span>
                            Account:{" "}
                            <strong className="font-bold text-slate-700">
                              {formatStatus(
                                member.accountStatus,
                              )}
                            </strong>
                          </span>

                          <span>
                            Joined:{" "}
                            <strong className="font-bold text-slate-700">
                              {formatDate(
                                member.joinedAt,
                              )}
                            </strong>
                          </span>

                          {member.endedAt && (
                            <span>
                              Ended:{" "}
                              <strong className="font-bold text-slate-700">
                                {formatDate(
                                  member.endedAt,
                                )}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {member.roles.length > 0 ? (
                        member.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                          >
                            {role
                              .split("_")
                              .map(
                                (word) =>
                                  word
                                    .charAt(0)
                                    .toUpperCase() +
                                  word.slice(1)
                              )
                              .join(" ")}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-400">
                          No organisation role
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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
                  login,
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

                         {student.origin_type === "organisation" &&
  student.profile_status === "active" && (
    <div className="mt-4">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="text-slate-500">
          Login:{" "}
          <strong className="font-bold text-slate-700">
            {login?.username ||
              "Not created"}
          </strong>
        </span>

        {login && (
          <span className="text-slate-500">
            Last login:{" "}
            <strong className="font-bold text-slate-700">
              {formatDateTime(
                login.last_login_at,
              )}
            </strong>
          </span>
        )}
      </div>

      <Link
        to={`/admin/schools/${organisationId}/learners/${student.id}/login`}
        className="mt-3 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-yellow-500 hover:text-slate-950"
      >
        {login
          ? "Manage Login"
          : "Create Login"}
      </Link>
    </div>
  )}
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
