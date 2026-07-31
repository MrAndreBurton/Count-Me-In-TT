import {
  ArrowLeft,
  CheckCircle2,
  Save,
  UserPlus,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  getAdminParents,
} from "../../data/adminParents";

import {
  createAdminStudent,
} from "../../data/adminStudents";

const initialFormData = {
  name: "",
  displayName: "",
  learningCategory: "Primary",
  level: "",
  school: "",
  membership: "Free",
  membershipStatus: "Active",
  status: "Active",
  membershipExpiry: "",
  parentId: "",
};

export default function AddStudentPage() {
  const navigate = useNavigate();

  const parents = getAdminParents();

  const [formData, setFormData] =
    useState(initialFormData);

  const [createdStudent, setCreatedStudent] =
    useState(null);

    const selectedParent =
    parents.find(
      (parent) =>
        parent.id === formData.parentId,
    ) || null;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const studentId = `student-${Date.now()}`;

    const newStudent = {
      id: studentId,
      name: formData.name.trim(),
      displayName:
        formData.displayName.trim(),
      initials: getInitials(formData.name),
      learningCategory:
        formData.learningCategory,
      level: formData.level.trim(),
      school:
        formData.school.trim() || "No School",
      membership: formData.membership,
      membershipStatus:
        formData.membershipStatus,
      status: formData.status,
      membershipExpiry:
        formData.membershipExpiry,
       parentId: selectedParent?.id || null,

       parent: selectedParent
         ? {
            name: selectedParent.name,
            email: selectedParent.email,
            phone: selectedParent.phone,
            relationship:
              selectedParent.relationship,
          }
        : {
            name: "No parent linked",
            email: "",
            phone: "",
            relationship: "",
          },

      gamesPlayed: 0,
      lastActive: "Not active yet",
      joinedDate: new Date().toLocaleDateString(
        "en-TT",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      ),

      progress: [],
      activity: [],

      recommendation: {
        title: "Complete first learning activity",
        description:
          "Assign the student a suitable starter activity based on their learning category and current level.",
      },
    };

  const createdStudent =
  createAdminStudent(newStudent);

navigate(
  `/admin/students/${createdStudent.id}`,
);

  }

  function resetForm() {
    setFormData(initialFormData);
    setCreatedStudent(null);
  }

  if (createdStudent) {
    return (
      <AdminLayout>
        <section className="mx-auto max-w-3xl py-12">
          <div className="rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-sm lg:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
              Student created
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {createdStudent.name}
            </h1>

            <p className="mt-3 text-slate-500">
              The student record was created
              locally for testing.
            </p>

            <div className="mx-auto mt-8 grid max-w-xl gap-4 rounded-3xl bg-slate-50 p-6 text-left sm:grid-cols-2">
              <SummaryItem
                label="Display name"
                value={createdStudent.displayName}
              />

              <SummaryItem
                label="Learning category"
                value={
                  createdStudent.learningCategory
                }
              />

              <SummaryItem
                label="Current level"
                value={
                  createdStudent.level ||
                  "Not provided"
                }
              />

              <SummaryItem
                label="Membership"
                value={createdStudent.membership}
              />
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <UserPlus size={18} />
                Add another student
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/students")
                }
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-yellow-400 hover:text-slate-950"
              >
                Return to students
              </button>
            </div>
          </div>
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

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Student Management
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Add new student
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Create a student record with their
            personal, academic, membership and
            parent information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <SectionHeading
              eyebrow="Student Information"
              title="Personal details"
            />

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <FormField
                label="Full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Amari Joseph"
                required
              />

              <FormField
                label="Display name"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Amari J."
                required
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <SectionHeading
              eyebrow="Academic Profile"
              title="Learning information"
            />

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <SelectField
                label="Learning category"
                name="learningCategory"
                value={
                  formData.learningCategory
                }
                onChange={handleChange}
                options={[
                  "Primary",
                  "Secondary",
                  "No School",
                ]}
              />

              <FormField
                label="Current level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                placeholder="Standard 5"
              />

              <FormField
                label="School"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="San Juan Boys' R.C."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <SectionHeading
              eyebrow="Membership"
              title="Account and access"
            />

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <SelectField
                label="Membership"
                name="membership"
                value={formData.membership}
                onChange={handleChange}
                options={[
                  "Free",
                  "Term",
                  "Annual",
                ]}
              />

              <SelectField
                label="Membership status"
                name="membershipStatus"
                value={
                  formData.membershipStatus
                }
                onChange={handleChange}
                options={[
                  "Active",
                  "Pending",
                  "Inactive",
                  "Expired",
                ]}
              />

              <SelectField
                label="Account status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  "Active",
                  "Pending",
                  "Inactive",
                  "Suspended",
                ]}
              />

              <FormField
                label="Membership expiry"
                name="membershipExpiry"
                type="date"
                value={
                  formData.membershipExpiry
                }
                onChange={handleChange}
              />
            </div>
          </section>

         <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
  <SectionHeading
    eyebrow="Parent Information"
    title="Parent or guardian"
  />

  <div className="mt-7">
    <SelectField
      label="Linked parent"
      name="parentId"
      value={formData.parentId}
      onChange={handleChange}
      options={[
        {
          value: "",
          label: "No parent linked",
        },
        ...parents.map((parent) => ({
          value: parent.id,
          label: `${parent.name} — ${parent.relationship}`,
        })),
      ]}
    />

    {selectedParent && (
      <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
        <SummaryItem
          label="Email"
          value={selectedParent.email}
        />

        <SummaryItem
          label="Phone"
          value={selectedParent.phone}
        />

        <SummaryItem
          label="Relationship"
          value={selectedParent.relationship}
        />
      </div>
    )}
  </div>
</section>



          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Fields marked as required must be
              completed before creating the
              student.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate("/admin/students")
                }
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
              >
                <Save size={18} />
                Create student
              </button>
            </div>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function SectionHeading({
  eyebrow,
  title,
}) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">
        {title}
      </h2>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
      >
        {options.map((option) => {
  const optionValue =
    typeof option === "string"
      ? option
      : option.value;

  const optionLabel =
    typeof option === "string"
      ? option
      : option.label;

  return (
    <option
      key={optionValue || "empty"}
      value={optionValue}
    >
      {optionLabel}
    </option>
  );
})}



      </select>
    </label>
  );
}


