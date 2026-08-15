import {
  ArrowLeft,
  Award,
  CalendarDays,
  Gamepad2,
  GraduationCap,
  Layers3,
  Mail,
  Pencil,
  Phone,
  School,
  ShieldCheck,
  Target,
  UserRound,
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
  fetchAdminStudentById,
} from "../../services/adminStudentsService";

import {
  mapSupabaseStudentToAdminStudent,
} from "../../utils/adminStudentMapper";

function StatCard({
  icon,
  label,
  value,
  detail,
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
        {icon}
      </div>

      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {label}
      </p>

      {detail && (
        <p className="mt-1 text-sm text-slate-400">
          {detail}
        </p>
      )}
    </article>
  );
}

export default function StudentProfilePage() {
  const { studentId } = useParams();

  const [student, setStudent] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

useEffect(() => {
  let isMounted = true;

  async function loadStudent() {
    try {
      setIsLoading(true);
      setLoadError("");

      const data =
        await fetchAdminStudentById(
          studentId,
        );

      if (!isMounted) return;

      if (!data) {
        setStudent(null);
        return;
      }

      setStudent(
  mapSupabaseStudentToAdminStudent(data),
);
    } catch (error) {
      console.error(
        "Unable to load student profile:",
        error,
      );

      if (isMounted) {
        setLoadError(
          "The student profile could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  loadStudent();

  return () => {
    isMounted = false;
  };
}, [studentId]);

if (isLoading) {
  return (
    <AdminLayout>
      <section className="py-16 text-center">
        <p className="font-bold text-slate-600">
          Loading student profile...
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
          Unable to load student
        </h1>

        <p className="mt-3 text-red-600">
          {loadError}
        </p>

        <Link
          to="/admin/students"
          className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
        >
          Return to students
        </Link>
      </section>
    </AdminLayout>
  );
}

  if (!student) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <UserRound size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Student not found
          </h1>

          <p className="mt-2 text-slate-500">
            This student profile does not exist.
          </p>

          <Link
            to="/admin/students"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-yellow-500 hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Return to students
          </Link>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="pb-12">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to students
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-300 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-white text-3xl font-black text-yellow-700 shadow-sm">
                  {student.initials}
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                    Student Profile
                  </p>

                  <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                    {student.name}
                  </h1>

                  <p className="mt-2 font-semibold text-slate-700">
                    Public display name: {student.displayName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-3">
    <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-slate-800">
      {student.membership} Member
    </span>

    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
      <ShieldCheck size={16} />
      {student.membershipStatus}
    </span>
  </div>

  <Link
    to={`/admin/students/${student.id}/edit`}
    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
  >
    <Pencil size={17} />
    Edit student
  </Link>
</div>
            </div>
          </div>

         <div className="grid gap-5 border-t border-slate-100 p-6 sm:grid-cols-2 lg:grid-cols-5 lg:p-8">
  <div className="flex items-start gap-3">
    <GraduationCap
      size={20}
      className="mt-0.5 text-yellow-600"
    />

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Current level
      </p>

      <p className="mt-1 font-bold text-slate-800">
        {student.level}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-3">
    <Layers3
      size={20}
      className="mt-0.5 text-yellow-600"
    />

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Learning category
      </p>

      <p className="mt-1 font-bold text-slate-800">
        {student.learningCategory}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-3">
    <School
      size={20}
      className="mt-0.5 text-yellow-600"
    />

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        School
      </p>

      <p className="mt-1 font-bold text-slate-800">
        {student.school}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-3">
    <CalendarDays
      size={20}
      className="mt-0.5 text-yellow-600"
    />

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Joined
      </p>

      <p className="mt-1 font-bold text-slate-800">
        {student.joinedDate}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-3">
    <ShieldCheck
      size={20}
      className="mt-0.5 text-yellow-600"
    />

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Membership expires
      </p>

      <p className="mt-1 font-bold text-slate-800">
        {student.membershipExpiry}
      </p>
    </div>
  </div>
</div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
  <StatCard
    icon={<Gamepad2 size={24} />}
    value={student.gamesPlayed}
    label="Rounds played"
    detail="Verified learning activities"
  />

  <StatCard
    icon={<Target size={24} />}
    value={`${student.accuracy}%`}
    label="Average accuracy"
    detail="Across verified rounds"
  />

  <StatCard
    icon={<Award size={24} />}
    value={student.badges}
    label="Badges earned"
    detail="Achievements unlocked"
  />
</div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
  <div>
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
      Recent Activity
    </p>

    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
      Learning journey
    </h2>
  </div>

  <div className="mt-7">
    {student.activity.length === 0 ? (
      <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
        <Gamepad2
          size={28}
          className="mx-auto text-slate-300"
        />

        <p className="mt-3 font-bold text-slate-700">
          No learning activity yet
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Verified game rounds will appear here once this student begins playing.
        </p>
      </div>
    ) : (
      <div className="space-y-1">
        {student.activity.map(
          (activity, index) => (
            <div
              key={activity.id}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {index !==
                student.activity.length - 1 && (
                <div className="absolute left-[19px] top-10 h-[calc(100%-2rem)] w-px bg-slate-200" />
              )}

              <div className="relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <Gamepad2 size={18} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-800">
                    {activity.title}
                  </p>

                  {activity.isPersonalBest && (
                    <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-700">
                      Personal best
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {activity.detail}
                </p>

                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {activity.date}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    )}
  </div>
</section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                Account Information
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                {student.account.name}
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-0.5 text-slate-400"
                  />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                      {student.account.email ||
                        "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    size={18}
                    className="mt-0.5 text-slate-400"
                  />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {student.account.phone ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}



