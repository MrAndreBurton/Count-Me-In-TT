import { useMemo, useState } from "react";

import {
  Link,
} from "react-router-dom";

import {
  Plus,
  UsersRound,
} from "lucide-react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import StudentCard from "../../components/admin/students/StudentCard";
import StudentFilters from "../../components/admin/students/StudentFilters";
import { adminStudents } from "../../data/adminStudents";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    membershipFilter,
    setMembershipFilter,
  ] = useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return adminStudents.filter((student) => {
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

      return (
        matchesSearch &&
        matchesMembership &&
        matchesStatus
      );
    });
  }, [
    searchTerm,
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


