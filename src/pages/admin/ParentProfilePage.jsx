import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MessageCircle,
  Phone,
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
  fetchAdminParentById,
} from "../../services/adminParentsService";

export default function ParentProfilePage() {
  const { parentId } = useParams();

  const [parent, setParent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
  let isMounted = true;

  async function loadParent() {
    try {
      setIsLoading(true);
      setLoadError("");

      const data =
        await fetchAdminParentById(parentId);

      if (!isMounted) return;

      if (!data) {
        setParent(null);
        return;
      }

      setParent({
        id: data.id,
        name: data.full_name,
        initials: getInitials(data.full_name),
        email: "",
        phone: data.phone || "Not provided",
        relationship: "Parent",
        status: formatAccountStatus(
          data.account_status,
        ),
        communicationPreference:
          formatCommunicationPreference(
            data.communication_preference,
          ),
        joined: formatDate(data.created_at),
        lastActive: "Not available",
        notes: "No admin notes added.",
        connectedStudents:
          data.student_profiles || [],
      });
    } catch (error) {
      console.error(
        "Unable to load parent profile:",
        error,
      );

      if (isMounted) {
        setLoadError(
          "The parent profile could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  loadParent();

  return () => {
    isMounted = false;
  };
}, [parentId]);

if (isLoading) {
  return (
    <AdminLayout>
      <section className="py-16 text-center">
        <p className="font-bold text-slate-600">
          Loading parent profile...
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
          Unable to load parent
        </h1>

        <p className="mt-3 text-red-600">
          {loadError}
        </p>
      </section>
    </AdminLayout>
  );
}

  if (!parent) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <UserRound size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Parent not found
          </h1>

          <p className="mt-2 text-slate-500">
            This parent profile does not exist.
          </p>

          <Link
            to="/admin/parents"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-yellow-400 hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Return to parents
          </Link>
        </section>
      </AdminLayout>
    );
  }

  const connectedStudents =
  parent.connectedStudents || [];

  const statusStyles = {
    Active:
      "bg-emerald-100 text-emerald-700",
    Pending:
      "bg-amber-100 text-amber-700",
    Inactive:
      "bg-slate-100 text-slate-600",
  };

  return (
    <AdminLayout>
      <section className="pb-12">
        <Link
          to="/admin/parents"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to parents
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-yellow-200 bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-100 shadow-sm">
          <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between lg:p-9">
            <div className="flex items-center gap-5">
  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-black text-white">
    {parent.initials}
  </div>

  <div>
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-800">
      Parent Profile
    </p>

    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
      {parent.name}
    </h1>

    <p className="mt-2 font-medium text-slate-700">
      {parent.relationship}
    </p>
  </div>
</div>

<div className="flex items-center gap-3">
  <Link
    to={`/admin/parents/${parent.id}/edit`}
    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-yellow-500 hover:text-slate-950"
  >
    Edit Parent
  </Link>

  <span
    className={`rounded-full px-4 py-2 text-sm font-bold ${
      statusStyles[parent.status] || statusStyles.Inactive
    }`}
  >
    {parent.status}
  </span>
</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Contact Information
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Parent details
            </h2>

            <div className="mt-7 space-y-5">
              <DetailRow
                icon={Mail}
                label="Email"
                value={parent.email}
              />

              <DetailRow
                icon={Phone}
                label="Phone"
                value={parent.phone}
              />

              <DetailRow
                icon={MessageCircle}
                label="Communication preference"
                value={
                  parent.communicationPreference
                }
              />

              <DetailRow
                icon={CalendarDays}
                label="Date joined"
                value={parent.joined}
              />

              <DetailRow
                icon={UserRound}
                label="Last active"
                value={parent.lastActive}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                  Connected Students
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Student profiles
                </h2>
              </div>

              <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-yellow-100 px-3 font-black text-yellow-700">
                {connectedStudents.length}
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {connectedStudents.map(
                (student) => (
                  <Link
                    key={student.id}
                    to={`/admin/students/${student.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-yellow-300 hover:bg-yellow-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 font-black text-white">
                        {getInitials(
                          `${student.first_name || ""} ${
                            student.last_name || ""
                          }`,
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-950">
                          {`${student.first_name || ""} ${
                            student.last_name || ""
                          }`.trim()}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {student.school_type || "Not set"} ·{" "}
                          {student.current_level || "Not set"}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-yellow-700">
                      View
                    </span>
                  </Link>
                ),
              )}

              {connectedStudents.length === 0 && (
                <div className="rounded-2xl bg-slate-50 py-10 text-center">
                  <UsersRound
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-bold text-slate-500">
                    No students connected
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Admin Notes
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Parent account notes
          </h2>

          <p className="mt-5 leading-7 text-slate-600">
            {parent.notes}
          </p>
        </section>
      </section>
    </AdminLayout>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatAccountStatus(status) {
  if (!status) return "Pending";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function formatCommunicationPreference(
  preference,
) {
  if (!preference) return "Not provided";

  if (preference === "whatsapp") {
    return "WhatsApp";
  }

  return (
    preference.charAt(0).toUpperCase() +
    preference.slice(1)
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  return new Date(dateValue).toLocaleDateString(
    "en-TT",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}




