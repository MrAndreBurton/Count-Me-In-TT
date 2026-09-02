import {
  Check,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  Save,
  UserPlus,
  UserRound,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

const defaultFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  relationship: "Mother",
  communicationPreference: "WhatsApp",
  receiveProgressUpdates: true,
  receiveMembershipReminders: true,
  receivePlatformAnnouncements: false,
  status: "Active",
  notes: "",
};

export default function ParentForm({
  initialData = defaultFormData,
  mode = "create",
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    ...defaultFormData,
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const parentName = useMemo(() => {
    return [
      formData.firstName.trim(),
      formData.lastName.trim(),
    ]
      .filter(Boolean)
      .join(" ");
  }, [
    formData.firstName,
    formData.lastName,
  ]);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName =
        "First name is required.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName =
        "Last name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      newErrors.email =
        "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required.";
    }

    if (!formData.relationship) {
      newErrors.relationship =
        "Select a relationship.";
    }

    if (
      !formData.communicationPreference
    ) {
      newErrors.communicationPreference =
        "Select a communication preference.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit({
        ...formData,
        firstName:
          formData.firstName.trim(),
        lastName:
          formData.lastName.trim(),
        name: parentName,
        email: formData.email
          .trim()
          .toLowerCase(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      <FormSection
        eyebrow="Parent Information"
        title="Parent details"
        description="Enter the parent or guardian’s primary account information."
        icon={UserRound}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="First name"
            name="firstName"
            required
            error={errors.firstName}
          >
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              placeholder="Enter first name"
              className={inputClass(
                errors.firstName,
              )}
            />
          </FormField>

          <FormField
            label="Last name"
            name="lastName"
            required
            error={errors.lastName}
          >
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              placeholder="Enter last name"
              className={inputClass(
                errors.lastName,
              )}
            />
          </FormField>

          <FormField
            label="Email address"
            name="email"
            required
            error={errors.email}
            helpText="This will later be used for parent login."
          >
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="parent@email.com"
                className={`${inputClass(
                  errors.email,
                )} pl-11`}
              />
            </div>
          </FormField>

          <FormField
            label="Phone number"
            name="phone"
            required
            error={errors.phone}
          >
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="868-555-0000"
                className={`${inputClass(
                  errors.phone,
                )} pl-11`}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        eyebrow="Family Relationship"
        title="Relationship to student"
        description="Identify the parent or guardian’s relationship to connected student profiles."
        icon={UserPlus}
      >
        <FormField
          label="Relationship"
          name="relationship"
          required
          error={errors.relationship}
        >
          <select
            id="relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            className={inputClass(
              errors.relationship,
            )}
          >
            <option value="Mother">
              Mother
            </option>

            <option value="Father">
              Father
            </option>

            <option value="Guardian">
              Guardian
            </option>

            <option value="Grandparent">
              Grandparent
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </FormField>
      </FormSection>

      <FormSection
        eyebrow="Communication"
        title="Communication preferences"
        description="Choose how this parent prefers to receive important updates."
        icon={MessageCircle}
      >
        <FormField
          label="Preferred method"
          name="communicationPreference"
          required
          error={
            errors.communicationPreference
          }
        >
          <select
            id="communicationPreference"
            name="communicationPreference"
            value={
              formData.communicationPreference
            }
            onChange={handleChange}
            className={inputClass(
              errors.communicationPreference,
            )}
          >
            <option value="WhatsApp">
              WhatsApp
            </option>

            <option value="Email">
              Email
            </option>

            <option value="Phone">
              Phone
            </option>
          </select>
        </FormField>

        <div className="mt-6 space-y-3">
          <PreferenceCheckbox
            name="receiveProgressUpdates"
            checked={
              formData.receiveProgressUpdates
            }
            onChange={handleChange}
            title="Receive progress updates"
            description="Updates about connected students’ learning activity and performance."
          />

          <PreferenceCheckbox
            name="receiveMembershipReminders"
            checked={
              formData.receiveMembershipReminders
            }
            onChange={handleChange}
            title="Receive membership reminders"
            description="Reminders for memberships attached to connected student profiles."
          />

          <PreferenceCheckbox
            name="receivePlatformAnnouncements"
            checked={
              formData.receivePlatformAnnouncements
            }
            onChange={handleChange}
            title="Receive platform announcements"
            description="General CountMeInTT news, updates and feature announcements."
          />
        </div>
      </FormSection>

      <FormSection
        eyebrow="Account Access"
        title="Account status"
        description="Choose the parent account’s current access status."
        icon={CheckCircle2}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            value="Active"
            selected={
              formData.status === "Active"
            }
            onChange={handleChange}
            title="Active"
            description="Account can access the platform."
          />

          <StatusCard
            value="Pending"
            selected={
              formData.status === "Pending"
            }
            onChange={handleChange}
            title="Pending"
            description="Waiting for account setup to be completed."
          />

          <StatusCard
            value="Inactive"
            selected={
              formData.status === "Inactive"
            }
            onChange={handleChange}
            title="Inactive"
            description="Account access is currently disabled."
          />
        </div>
      </FormSection>

      <FormSection
        eyebrow="Internal Information"
        title="Admin notes"
        description="These notes are visible only inside the administrative workspace."
        icon={Save}
      >
        <FormField
          label="Notes"
          name="notes"
          helpText="Optional"
        >
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={5}
            placeholder="Add any internal notes about this parent account..."
            className={`${inputClass()} resize-none`}
          />
        </FormField>
      </FormSection>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-7 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus size={19} />

          {isSubmitting
            ? "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : "Create Parent"}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
          <Icon size={22} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-7">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  name,
  required = false,
  error,
  helpText,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-bold text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="mt-2">
        {children}
      </div>

      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : (
        helpText && (
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {helpText}
          </p>
        )
      )}
    </div>
  );
}

function PreferenceCheckbox({
  name,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-yellow-300 hover:bg-yellow-50">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 rounded border-slate-300 accent-yellow-400"
      />

      <span>
        <span className="block font-bold text-slate-800">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function StatusCard({
  value,
  selected,
  onChange,
  title,
  description,
}) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border p-5 transition ${
        selected
          ? "border-yellow-400 bg-yellow-50 ring-4 ring-yellow-100"
          : "border-slate-200 hover:border-yellow-300"
      }`}
    >
      <input
        type="radio"
        name="status"
        value={value}
        checked={selected}
        onChange={onChange}
        className="sr-only"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-slate-950">
          {title}
        </p>

        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            selected
              ? "border-yellow-500 bg-yellow-400 text-slate-950"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && (
            <Check size={15} />
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </label>
  );
}

function inputClass(error) {
  return `w-full rounded-2xl border bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
  }`;
}

