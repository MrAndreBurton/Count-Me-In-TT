import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import StudentCard from "../../components/admin/students/StudentCard";
import StudentFilters from "../../components/admin/students/StudentFilters";

import {
  fetchAdminStudents,
} from "../../services/adminStudentsService";

import {
  mapSupabaseStudentToAdminStudent,
} from "../../utils/adminStudentMapper";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] =
    useState("");
  
  const [
    learningCategoryFilter,
    setLearningCategoryFilter,
  ] = useState("All");

  const [
    membershipFilter,
    setMembershipFilter,
  ] = useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [students, setStudents] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

useEffect(() => {
  let isMounted = true;

  async function loadStudents() {
    try {
      setIsLoading(true);
      setLoadError("");

      const data =
        await fetchAdminStudents();

      console.log(
        "Supabase students:",
        data,
      );

      if (!isMounted) return;

      const mappedStudents = data.map(
       mapSupabaseStudentToAdminStudent,
      );

       setStudents(mappedStudents);


    } catch (error) {
      console.error(
        "Unable to load students:",
        error,
      );

      if (isMounted) {
        setLoadError(
          "Students could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  loadStudents();

  return () => {
    isMounted = false;
  };
}, [refreshKey]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        student.displayName
          .toLowerCase()
          .includes(normalizedSearch) ||
        student.school
          .toLowerCase()
          .includes(normalizedSearch) ||
        student.level
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesMembership =
        membershipFilter === "All" ||
        student.membershipCategory === membershipFilter;

      const matchesStatus =
        statusFilter === "All" ||
        student.status === statusFilter;

      const matchesLearningCategory =
        learningCategoryFilter === "All" ||
        student.learningCategory ===
        learningCategoryFilter;


      return (
        matchesSearch &&
         matchesLearningCategory &&
        matchesMembership &&
        matchesStatus
      );
    });
 }, [
  students,
  searchTerm,
  learningCategoryFilter,
  membershipFilter,
  statusFilter,
]);
  return (
    <AdminLayout>
      <section className="pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Student Management
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Students
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Manage learner profiles, school
              information, memberships and platform
              activity.
            </p>
          </div>

          <Link
  to="/admin/students/new"
  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-yellow-500 hover:text-slate-950"
>
  <Plus size={19} />

  Add student
</Link>

        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <UsersRound size={22} />
          </div>

          <div>
            <p className="text-2xl font-black text-slate-950">
              {filteredStudents.length}
            </p>

            <p className="text-sm text-slate-500">
              Students displayed
            </p>
          </div>
          </div>

          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={isLoading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={17} /> Refresh students
          </button>
        </div>

        {loadError && <p role="alert" className="mt-4 text-sm text-red-700">{loadError}</p>}

        <div className="mt-8">
          <StudentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            learningCategoryFilter={
            learningCategoryFilter
            }
            onLearningCategoryChange={
               setLearningCategoryFilter
           }
            membershipFilter={membershipFilter}
            onMembershipChange={
              setMembershipFilter
            }
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        {filteredStudents.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map(
              (student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                />
              ),
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound size={26} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              No students found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filter
              selections.
            </p>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}


