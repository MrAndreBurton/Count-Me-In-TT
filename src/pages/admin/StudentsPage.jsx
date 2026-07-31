import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Plus,
  UsersRound,
} from "lucide-react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import StudentCard from "../../components/admin/students/StudentCard";
import StudentFilters from "../../components/admin/students/StudentFilters";

import {
  fetchAdminStudents,
} from "../../services/adminStudentsService";

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

function formatStatus(
  status,
  fallback = "Pending",
) {
  if (!status) return fallback;

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function formatLearningCategory(category) {
  if (!category) return "No School";

  const normalized =
    category.toLowerCase();

  if (normalized === "primary") {
    return "Primary";
  }

  if (normalized === "secondary") {
    return "Secondary";
  }

  if (
    normalized === "no_school" ||
    normalized === "no school"
  ) {
    return "No School";
  }

  return category;
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

      const mappedStudents = data.map((student) => {
  const fullName = [
    student.first_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const currentMembership =
    student.student_memberships?.find(
      (membership) =>
        membership.is_current,
    ) ||
    student.student_memberships?.[0] ||
    null;

  return {
    id: student.id,
    parentId: student.account_id,

    name: fullName || "Unnamed student",
    displayName:
      student.public_display_name ||
      fullName ||
      "Unnamed student",

    initials: getInitials(fullName),

    learningCategory:
      formatLearningCategory(
        student.school_type,
      ),

    level:
      student.current_level ||
      "Level not provided",

    school:
      student.current_school ||
      "No school selected",

    membership:
      currentMembership?.membership_plans
        ?.name || "Free",

    membershipStatus:
      formatStatus(
        currentMembership?.status,
        "Inactive",
      ),

    membershipExpiry:
      formatDate(
        currentMembership?.expires_at,
        "Not applicable",
      ),

    status: formatStatus(
      student.profile_status,
      "Pending",
    ),

    joinedDate: formatDate(
      student.created_at,
      "Not available",
    ),

    gamesPlayed: 0,
    streak: 0,
    badges: 0,
    accuracy: 0,
    lastActive: "Not available",

    parent: student.profiles
      ? {
          id: student.profiles.id,
          name:
            student.profiles.full_name ||
            "Parent account",
          phone:
            student.profiles.phone ||
            "Not provided",
          relationship: "Parent",
          email: "",
        }
      : {
          name: "No parent linked",
          phone: "",
          relationship: "",
          email: "",
        },

    progress: [],
    activity: [],

    recommendation: {
      title: "Complete first learning activity",
      description:
        "Assign the student a suitable starter activity based on their current level.",
    },
  };
});

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
}, []);

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
        student.membership === membershipFilter;

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

        <div className="mt-8 flex items-center gap-3">
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


