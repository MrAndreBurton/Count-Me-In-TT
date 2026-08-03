import {
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  fetchAdminParents,
} from "../../services/adminParentsService";

import {
  createAdminStudent,
} from "../../services/adminStudentsService";

import {
  mapSupabaseParentToAdminParent,
} from "../../utils/adminParentMapper";

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

  const [parents, setParents] =
    useState([]);

  const [isLoadingParents, setIsLoadingParents] =
    useState(true);

  const [parentLoadError, setParentLoadError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formData, setFormData] =
    useState(initialFormData);

  useEffect(() => {
  let isMounted = true;

  async function loadParents() {
    try {
      setIsLoadingParents(true);
      setParentLoadError("");

      const data =
        await fetchAdminParents();

      if (!isMounted) return;

      const mappedParents = data.map(
        mapSupabaseParentToAdminParent,
      );

      setParents(mappedParents);
    } catch (error) {
      console.error(
        "Unable to load parents:",
        error,
      );

      if (isMounted) {
        setParentLoadError(
          "Parent accounts could not be loaded.",
        );
      }
    } finally {
      if (isMounted) {
        setIsLoadingParents(false);
      }
    }
  }

  loadParents();

  return () => {
    isMounted = false;
  };
}, []);

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

  async function handleSubmit(event) {
  event.preventDefault();

  try {
    setIsSubmitting(true);

    const {
      firstName,
      lastName,
    } = splitFullName(formData.name);

    const createdStudent =
      await createAdminStudent({
        profileData: {
          account_id:
            formData.parentId || null,

          first_name: firstName,
          last_name: lastName,

          public_display_name:
            formData.displayName.trim(),

          school_type:
            toDatabaseLearningCategory(
              formData.learningCategory,
            ),

          current_level:
            formData.level.trim() || null,

          current_school:
            formData.learningCategory ===
            "No School"
              ? "No School"
              : formData.school.trim() ||
                null,

          profile_status:
            formData.status
              .trim()
              .toLowerCase(),

          profile_type: "child",

          login_enabled: false,
        },
      });

    navigate(
      `/admin/students/${createdStudent.id}`,
    );
  } catch (error) {
    console.error(
      "Unable to create student:",
      error,
    );

    alert(
      error.message ||
        "Unable to create student. Please try again.",
    );
  } finally {
    setIsSubmitting(false);
  }
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

    {isLoadingParents && (
      <p className="mb-4 text-sm font-bold text-slate-500">
        Loading parent accounts...
      </p>
    )}

    {parentLoadError && (
      <p className="mb-4 text-sm font-bold text-red-600">
        {parentLoadError}
      </p>
    )}

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
                disabled={
                  isSubmitting ||
                  isLoadingParents ||
                  Boolean(parentLoadError)
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
               <Save size={18} />

               {isSubmitting
                 ? "Creating..."
                 : "Create student"}
             </button>
            </div>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
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

function splitFullName(fullName = "") {
  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      lastName: "",
    };
  }

  return {
    firstName: nameParts[0],
    lastName: nameParts
      .slice(1)
      .join(" "),
  };
}

function toDatabaseLearningCategory(
  category,
) {
  if (category === "Primary") {
    return "primary";
  }

  if (category === "Secondary") {
    return "secondary";
  }

  if (category === "No School") {
    return "no_school";
  }

  return category
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}




