import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

export default function StudentFilters({
  searchTerm,
  onSearchChange,
  learningCategoryFilter,
  onLearningCategoryChange,
  membershipFilter,
  onMembershipChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search by student, school or level..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100"
          />
        </label>

        <label className="relative">
  <SlidersHorizontal
    size={18}
    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
  />

  <select
    value={learningCategoryFilter}
    onChange={(event) =>
      onLearningCategoryChange(
        event.target.value,
      )
    }
    className="h-12 min-w-44 appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100"
  >
    <option value="All">
      All categories
    </option>

    <option value="Primary">
      Primary
    </option>

    <option value="Secondary">
      Secondary
    </option>

    <option value="No School">
      No School
    </option>
  </select>
</label>
        
        <label className="relative">
          <SlidersHorizontal
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            value={membershipFilter}
            onChange={(event) =>
              onMembershipChange(event.target.value)
            }
            className="h-12 min-w-48 appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100"
          >
            <option value="All">
              All memberships
            </option>

            <option value="Annual">
              Annual
            </option>

            <option value="Term">
              Term
            </option>

            <option value="Free">
              Free
            </option>
          </select>
        </label>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value)
          }
          className="h-12 min-w-40 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100"
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
  );
}

