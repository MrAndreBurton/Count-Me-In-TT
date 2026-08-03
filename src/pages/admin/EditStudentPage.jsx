import {
  ArrowLeft,
  Save,
  UserRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
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
  fetchAdminStudentById,
  updateAdminStudentProfile,
} from "../../services/adminStudentsService";

import {
  mapSupabaseStudentToAdminStudent,
} from "../../utils/adminStudentMapper";

export default function EditStudentPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] =
    useState(null);

  const [parents, setParents] =
    useState([]);

  const [formData, setFormData] = useState({
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
  });

  const selectedParent =
  parents.find(
    (parent) =>
      parent.id === formData.parentId,
  ) || null;

  useEffect(() => {
  async function loadEditData() {
    try {
      const [
        studentData,
        parentData,
      ] = await Promise.all([
        fetchAdminStudentById(studentId),
        fetchAdminParents(),
      ]);

      if (!studentData) return;

      const mappedStudent =
        mapSupabaseStudentToAdminStudent(
          studentData,
        );

      const mappedParents =
        parentData.map((parent) => ({
          id: parent.id,
          name:
            parent.full_name ||
            "Unnamed parent",
          email: "",
          phone:
            parent.phone ||
            "Not provided",
          relationship: "Parent",
        }));

      setStudent(mappedStudent);
      setParents(mappedParents);

      setFormData({
        name: mappedStudent.name,
        displayName:
          mappedStudent.displayName,
        learningCategory:
          mappedStudent.learningCategory,
        level: mappedStudent.level,
        school: mappedStudent.school,
        membership:
          mappedStudent.membership,
        membershipStatus:
          mappedStudent.membershipStatus,
        status: mappedStudent.status,
        membershipExpiry:
          mappedStudent.membershipExpiry,
        parentId:
          mappedStudent.parentId || "",
      });
    } catch (error) {
      console.error(
        "Unable to load edit data:",
        error,
      );
    }
  }

  loadEditData();
}, [studentId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

  }

  async function handleSubmit(event) {
  event.preventDefault();

  if (!student) return;

  try {
    const {
      firstName,
      lastName,
    } = splitFullName(formData.name);

    await updateAdminStudentProfile(
      student.id,
      {
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
          formData.status.toLowerCase(),
      },
    );

    navigate(
      `/admin/students/${student.id}`,
    );
  } catch (error) {
    console.error(
      "Unable to update student:",
      error,
    );

    alert(
      error.message ||
        "Unable to update student. Please try again.",
    );
  }
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
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-yellow-400 hover:text-slate-950"
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
        <button
          type="button"
          onClick={() =>
            navigate(
              `/admin/students/${student.id}`,
            )
          }
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to student profile
        </button>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Student Management
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Edit {student.name}
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Update the student’s personal,
            academic, membership and parent
            information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                Student Information
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Personal details
              </h2>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
  <FormField
    label="Full name"
    name="name"
    value={formData.name}
    onChange={handleChange}
    required
  />

  <FormField
    label="Display name"
    name="displayName"
    value={formData.displayName}
    onChange={handleChange}
    required
  />

  <SelectField
    label="Learning category"
    name="learningCategory"
    value={formData.learningCategory}
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
  />
</div>


          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                Account Status
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Membership and access
              </h2>
            </div>

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
                value={
                  formData.membershipExpiry
                }
                onChange={handleChange}
                placeholder="July 30, 2027"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
  <div>
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
      Parent Information
    </p>

    <h2 className="mt-2 text-2xl font-black text-slate-950">
      Parent or guardian
    </h2>
  </div>

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
            <div>
             <p className="text-sm text-slate-500">
               Review the information before saving.
            </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/students/${student.id}`,
                  )
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
                Save changes
              </button>
            </div>
          </div>
        </form>
      </section>
    </AdminLayout>
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
        {value || "Not provided"}
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


