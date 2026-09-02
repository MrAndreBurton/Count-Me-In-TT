import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  RefreshCcw,
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
  approveAdminMembershipRequest,
  fetchAdminMembershipRequestById,
  updateAdminMembershipRequest,
} from "../../services/adminMembershipRequestsService";

const statusOptions = [
  "pending",
  "contacted",
  "payment_pending",
  "declined",
  "cancelled",
];

export default function MembershipRequestProfilePage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] =
    useState(null);

  const [formData, setFormData] =
    useState({
      status: "pending",
      adminNotes: "",
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [isApproving, setIsApproving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRequest() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await fetchAdminMembershipRequestById(
            requestId,
          );

        if (!isMounted) return;

        if (!data) {
          setRequest(null);
          return;
        }

        setRequest(data);

        setFormData({
          status:
            data.status || "pending",

          adminNotes:
            data.admin_notes || "",
        });
      } catch (error) {
        console.error(
          "Unable to load membership request:",
          error,
        );

        if (isMounted) {
          setLoadError(
            error?.message ||
              "The membership request could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRequest();

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setSaveMessage("");
  }

  async function handleSubmit(event) {
  event.preventDefault();

  if (!request) return;

  if (
    [
      "approved",
      "declined",
      "cancelled",
    ].includes(request.status)
  ) {
    alert(
      "Approved, declined and cancelled requests are read-only.",
    );

    return;
  }

    try {
      setIsSaving(true);
      setSaveMessage("");

      const now =
        new Date().toISOString();

      const updates = {
        status: formData.status,

        admin_notes:
          formData.adminNotes.trim() ||
          null,
      };

      if (
        formData.status === "contacted" &&
        !request.contacted_at
      ) {
        updates.contacted_at = now;
      }

      if (
        formData.status === "declined"
      ) {
        updates.declined_at =
          request.declined_at || now;
      } else {
        updates.declined_at = null;
      }

      const updatedRequest =
        await updateAdminMembershipRequest(
          request.id,
          updates,
        );

      setRequest(updatedRequest);

      setFormData({
        status:
          updatedRequest.status ||
          "pending",

        adminNotes:
          updatedRequest.admin_notes ||
          "",
      });

      setSaveMessage(
        "Request changes saved.",
      );
    } catch (error) {
      console.error(
        "Unable to update membership request:",
        error,
      );

      alert(
        error?.message ||
          "Unable to update the membership request.",
      );
    } finally {
      setIsSaving(false);
    }
  }

async function handleApproveRequest() {
  if (!request) return;

  const canApprove = [
    "pending",
    "contacted",
    "payment_pending",
  ].includes(request.status);

  if (!canApprove) {
    alert(
      "Only an open membership request can be approved.",
    );

    return;
  }

  const confirmed = window.confirm(
    `Approve this request for ${
      request.membership_plans?.name ||
      "the selected membership plan"
    }?`,
  );

  if (!confirmed) return;

  try {
    setIsApproving(true);
    setSaveMessage("");

    const newMembershipId =
      await approveAdminMembershipRequest(
        request.id,
      );

    navigate(
      `/admin/memberships/${newMembershipId}`,
      {
        replace: true,
      },
    );
  } catch (error) {
    console.error(
      "Unable to approve membership request:",
      error,
    );

    alert(
      error?.message ||
        "Unable to approve the membership request.",
    );
  } finally {
    setIsApproving(false);
  }
}

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-400" />

          <p className="mt-5 font-bold text-slate-700">
            Loading membership request...
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
            Unable to load request
          </h1>

          <p className="mt-3 text-red-600">
            {loadError}
          </p>

          <Link
            to="/admin/memberships/requests"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={18} />
            Return to requests
          </Link>
        </section>
      </AdminLayout>
    );
  }

  if (!request) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <CreditCard
            size={34}
            className="mx-auto text-slate-300"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Request not found
          </h1>

          <p className="mt-2 text-slate-500">
            This membership request does not exist.
          </p>

          <Link
            to="/admin/memberships/requests"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={18} />
            Return to requests
          </Link>
        </section>
      </AdminLayout>
    );
  }

  const student =
    request.student_profiles;

  const parent =
    student?.profiles;

  const plan =
    request.membership_plans;

const isHistoricalRequest = [
  "approved",
  "declined",
  "cancelled",
].includes(request.status);

const studentName = [
  student?.first_name,
  student?.last_name,
]
  .filter(Boolean)
  .join(" ");

  return (
    <AdminLayout>
      <section className="pb-12">
        <Link
          to="/admin/memberships/requests"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to membership requests
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-300 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                  Membership Request
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {studentName ||
                    "Unnamed student"}
                </h1>

                <p className="mt-2 font-semibold text-slate-700">
                  {plan?.name ||
                    "Unknown plan"}
                </p>
              </div>

              <StatusBadge
                status={request.status}
              />
            </div>
          </div>

          <div className="grid gap-5 border-t border-slate-100 p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
            <SummaryDetail
              icon={UserRound}
              label="Student"
              value={
                studentName ||
                "Not provided"
              }
            />

            <SummaryDetail
              icon={CreditCard}
              label="Requested plan"
              value={
                plan?.name ||
                "Not provided"
              }
            />

            <SummaryDetail
              icon={CalendarDays}
              label="Requested"
              value={formatDate(
                request.requested_at,
                "Unknown date",
              )}
            />

            <SummaryDetail
              icon={UserRound}
              label="Parent"
              value={
                parent?.full_name ||
                request.contact_name ||
                "Not provided"
              }
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Contact Information
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Request contact
            </h2>

            <div className="mt-6 space-y-4">
              <ContactRow
                icon={UserRound}
                label="Contact name"
                value={
                  request.contact_name ||
                  parent?.full_name ||
                  "Not provided"
                }
              />

              <ContactRow
                icon={Mail}
                label="Email"
                value={
                  request.contact_email ||
                  "Not provided"
                }
              />

              <ContactRow
                icon={Phone}
                label="Phone"
                value={
                  request.contact_phone ||
                  parent?.phone ||
                  "Not provided"
                }
              />

              <ContactRow
                icon={Phone}
                label="Preferred method"
                value={formatStatus(
                  request.preferred_contact_method ||
                    "not provided",
                )}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Request Details
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Notes and payment
            </h2>

            <div className="mt-6 space-y-5">
              <DetailBlock
                label="Request notes"
                value={
                  request.notes ||
                  "No request notes."
                }
              />

              <DetailBlock
                label="Payment reference"
                value={
                  request.payment_reference ||
                  "Not provided"
                }
              />
            </div>
          </section>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Request Management
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Status and admin notes
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <SelectField
                label="Request status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isHistoricalRequest}
                options={statusOptions.map(
                  (status) => ({
                    value: status,
                    label:
                      formatStatus(status),
                  }),
                )}
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current stage
                </p>

                <p className="mt-2 font-black text-slate-900">
                  {formatStatus(
                    formData.status,
                  )}
                </p>
              </div>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-700">
                Admin notes
              </span>

              <textarea
                name="adminNotes"
                value={
                  formData.adminNotes
                }
                onChange={handleChange}
                rows={5}
                disabled={isHistoricalRequest}
                placeholder="Add internal notes about this request."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />
            </label>
          </section>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              {saveMessage ? (
                <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <CheckCircle2 size={17} />
                  {saveMessage}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Review the request before saving.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
  <button
    type="button"
    onClick={() =>
      navigate(
        "/admin/memberships/requests",
      )
    }
    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
  >
    Back to Requests
  </button>

  {!isHistoricalRequest ? (
    <>
      {[
        "pending",
        "contacted",
        "payment_pending",
      ].includes(request.status) && (
        <button
          type="button"
          onClick={handleApproveRequest}
          disabled={
            isApproving ||
            isSaving
          }
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isApproving ? (
            <RefreshCcw
              size={18}
              className="animate-spin"
            />
          ) : (
            <CheckCircle2 size={18} />
          )}

          {isApproving
            ? "Approving..."
            : "Approve Request"}
        </button>
      )}

      <button
        type="submit"
        disabled={
          isSaving ||
          isApproving
        }
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (
          <RefreshCcw
            size={18}
            className="animate-spin"
          />
        ) : (
          <Save size={18} />
        )}

        {isSaving
          ? "Saving..."
          : "Save Request"}
      </button>
    </>
  ) : (
    <span className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600">
      Historical Record — Read Only
    </span>
  )}
</div>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}

function SummaryDetail({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        size={20}
        className="mt-0.5 text-yellow-600"
      />

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

function ContactRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <Icon
        size={18}
        className="mt-0.5 text-yellow-600"
      />

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

function DetailBlock({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 leading-7 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
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
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({
  status,
}) {
  const styles = {
    pending:
      "bg-amber-100 text-amber-700",
    contacted:
      "bg-blue-100 text-blue-700",
    payment_pending:
      "bg-violet-100 text-violet-700",
    approved:
      "bg-emerald-100 text-emerald-700",
    declined:
      "bg-red-100 text-red-700",
    cancelled:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
        styles[status] ||
        styles.pending
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(value = "") {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  value,
  fallback,
) {
  if (!value) return fallback;

  return new Date(
    value,
  ).toLocaleDateString("en-TT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


