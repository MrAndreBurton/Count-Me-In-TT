import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  RefreshCcw,
  Save,
  UserRound,
  UsersRound,
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
  fetchAdminMembershipById,
  fetchMembershipPlans,
  fetchStudentMembershipHistory,
  replaceAdminMembership,
  updateAdminMembership,
} from "../../services/adminMembershipsService";


const statusOptions = [
  "pending",
  "active",
  "grace",
  "paused",
  "expired",
  "cancelled",
];

export default function MembershipProfilePage() {
  const { membershipId } = useParams();
  const navigate = useNavigate();

  const [membership, setMembership] =
    useState(null);

  const [plans, setPlans] =
    useState([]);

  const [formData, setFormData] =
    useState({
      planId: "",
      status: "active",
      startsAt: "",
      expiresAt: "",
      autoRenew: false,
      source: "manual",
      notes: "",
      cancellationReason: "",
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [activeAction, setActiveAction] =
    useState("");

  const [actionPlanId, setActionPlanId] =
    useState("");

  const [actionStartDate, setActionStartDate] =
    useState(
      new Date().toISOString().slice(0, 10),
    );

  const [actionExpiryDate, setActionExpiryDate] =
    useState("");

  const [actionReason, setActionReason] =
    useState("");

  const [isProcessingAction, setIsProcessingAction] =
    useState(false);

  const [membershipHistory, setMembershipHistory] =
    useState([]);

  const [isLoadingHistory, setIsLoadingHistory] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMembership() {
      try {
        setIsLoading(true);
        setLoadError("");

        const [
          membershipData,
          planData,
        ] = await Promise.all([
          fetchAdminMembershipById(
            membershipId,
          ),
          fetchMembershipPlans(),
        ]);

        if (!isMounted) return;

        if (!membershipData) {
          setMembership(null);
          return;
        }

        setMembership(membershipData);
        setPlans(planData);

        setIsLoadingHistory(true);
        setHistoryError("");

        try {
          const historyData =
            await fetchStudentMembershipHistory(
              membershipData.student_id,
            );

          if (!isMounted) return;

          setMembershipHistory(historyData);
        } catch (historyLoadError) {
          console.error(
            "Unable to load membership history:",
            historyLoadError,
          );

          if (isMounted) {
            setHistoryError(
              "Membership history could not be loaded.",
            );
          }
        } finally {
          if (isMounted) {
            setIsLoadingHistory(false);
          }
        }

        setFormData({
          planId:
            membershipData.plan_id || "",

          status:
            membershipData.status ||
            "active",

          startsAt: toDateInputValue(
            membershipData.starts_at,
          ),

          expiresAt: toDateInputValue(
            membershipData.expires_at,
          ),

          autoRenew:
            Boolean(
              membershipData.auto_renew,
            ),

          source:
            membershipData.source ||
            "manual",

          notes:
            membershipData.notes || "",

          cancellationReason:
            membershipData
              .cancellation_reason || "",
        });
      } catch (error) {
        console.error(
          "Unable to load membership:",
          error,
        );

        if (isMounted) {
          setLoadError(
            "The membership record could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMembership();

    return () => {
      isMounted = false;
    };
  }, [membershipId]);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setSaveMessage("");
  }

async function handleSubmit(event) {
  event.preventDefault();

  if (!membership) return;

  if (
    formData.status === "cancelled" &&
    !formData.cancellationReason.trim()
  ) {
    alert(
      "Please provide a cancellation reason.",
    );

    return;
  }

  if (
    formData.expiresAt &&
    formData.startsAt &&
    new Date(formData.expiresAt) <=
      new Date(formData.startsAt)
  ) {
    alert(
      "The expiry date must be later than the start date.",
    );

    return;
  }

  try {
    setIsSaving(true);
    setSaveMessage("");

    const isCancelled =
      formData.status === "cancelled";

    const updatedMembership =
      await updateAdminMembership(
        membership.id,
        {
          plan_id: formData.planId,

          status: formData.status,

          starts_at: toTimestamp(
            formData.startsAt,
          ),

          expires_at:
            formData.expiresAt
              ? toTimestamp(
                  formData.expiresAt,
                )
              : null,

          auto_renew:
            formData.autoRenew,

          source: formData.source,

          notes:
            formData.notes.trim() ||
            null,

          cancelled_at:
            isCancelled
              ? membership.cancelled_at ||
                new Date().toISOString()
              : null,

          cancellation_reason:
            isCancelled
              ? formData
                  .cancellationReason
                  .trim()
              : null,

          is_current:
            ![
              "expired",
              "cancelled",
            ].includes(
              formData.status,
            ),
        },
      );

    setMembership(updatedMembership);

    setSaveMessage(
      "Membership changes saved.",
    );
  } catch (error) {
    console.error(
      "Unable to update membership:",
      error,
    );

    alert(
      error.message ||
        "Unable to update membership. Please try again.",
    );
  } finally {
    setIsSaving(false);
  }
}



async function handleReplaceMembership(action) {
  if (!membership) return;

  const selectedPlanId =
    action === "change_plan"
      ? actionPlanId
      : membership.plan_id;

  if (!selectedPlanId) {
    alert("Please select a membership plan.");
    return;
  }

  try {
    setIsProcessingAction(true);

    const newMembership =
      await replaceAdminMembership({
        membershipId: membership.id,
        planId: selectedPlanId,
        startsAt: toTimestamp(
          actionStartDate,
        ),
        expiresAt: actionExpiryDate
          ? toTimestamp(actionExpiryDate)
          : null,
        status: "active",
        source: "manual",
        autoRenew: false,
        notes:
          actionReason.trim() || null,
        action,
      });

    navigate(
      `/admin/memberships/${newMembership.id}`,
    );
  } catch (error) {
    console.error(
      `Unable to complete ${action}:`,
      error,
    );

    alert(
      error.message ||
        "Unable to complete the membership action.",
    );
  } finally {
    setIsProcessingAction(false);
  }
}

async function handleCancelMembership() {
  if (!membership) return;

  if (!actionReason.trim()) {
    alert(
      "Please provide a cancellation reason.",
    );
    return;
  }

  try {
    setIsProcessingAction(true);

    const updatedMembership =
      await updateAdminMembership(
        membership.id,
        {
          status: "cancelled",
          is_current: false,
          auto_renew: false,
          cancelled_at:
            new Date().toISOString(),
          cancellation_reason:
            actionReason.trim(),
        },
      );

    setMembership(updatedMembership);

    setFormData((currentData) => ({
      ...currentData,
      status: "cancelled",
      autoRenew: false,
      cancellationReason:
        actionReason.trim(),
    }));

    setActiveAction("");
    setActionReason("");

    setSaveMessage(
      "Membership cancelled.",
    );
  } catch (error) {
    console.error(
      "Unable to cancel membership:",
      error,
    );

    alert(
      error.message ||
        "Unable to cancel membership.",
    );
  } finally {
    setIsProcessingAction(false);
  }
}

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-400" />

          <p className="mt-5 font-bold text-slate-700">
            Loading membership...
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
            Unable to load membership
          </h1>

          <p className="mt-3 text-red-600">
            {loadError}
          </p>

          <Link
            to="/admin/memberships"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={18} />
            Return to memberships
          </Link>
        </section>
      </AdminLayout>
    );
  }

  if (!membership) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <CreditCard
            size={34}
            className="mx-auto text-slate-300"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Membership not found
          </h1>

          <p className="mt-2 text-slate-500">
            This membership record does not exist.
          </p>

          <Link
            to="/admin/memberships"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={18} />
            Return to memberships
          </Link>
        </section>
      </AdminLayout>
    );
  }

  const student =
    membership.student_profiles;

  const parent =
    student?.profiles;

  const plan =
    membership.membership_plans;

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
          to="/admin/memberships"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-yellow-600"
        >
          <ArrowLeft size={18} />
          Back to memberships
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-300 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                  Membership Management
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {studentName ||
                    "Unnamed student"}
                </h1>

                <p className="mt-2 font-semibold text-slate-700">
                  {plan?.name ||
                    "No plan assigned"}
                </p>
              </div>

              <StatusBadge
                status={
                  membership.status
                }
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
              icon={UsersRound}
              label="Parent"
              value={
                parent?.full_name ||
                "No parent linked"
              }
            />

            <SummaryDetail
              icon={CalendarDays}
              label="Started"
              value={formatDate(
                membership.starts_at,
                "Not provided",
              )}
            />

            <SummaryDetail
              icon={CalendarDays}
              label="Expires"
              value={formatDate(
                membership.expires_at,
                "No expiry",
              )}
            />
          </div>
                </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Membership Actions
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Manage lifecycle
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                setActiveAction("renewal")
              }
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-yellow-400 hover:text-slate-950"
            >
              Renew membership
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAction("change_plan");

                setActionPlanId(
                  membership.plan_id || "",
                );
              }}

              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-yellow-300 hover:bg-yellow-50"
            >
              Change plan
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveAction("cancel")
              }
              className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
            >
              Cancel membership
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveAction("restore")
              }
              className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              Restore membership
            </button>
          </div>
        </section>

        {activeAction && (
          <section className="mt-6 rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
            <h2 className="text-xl font-black text-slate-950">
              {activeAction === "renewal" &&
                "Renew membership"}

              {activeAction === "change_plan" &&
                "Change membership plan"}

              {activeAction === "cancel" &&
                "Cancel membership"}

              {activeAction === "restore" &&
                "Restore membership"}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {activeAction === "change_plan" && (
                <SelectField
                  label="New plan"
                  name="actionPlanId"
                  value={actionPlanId}
                  onChange={(event) =>
                    setActionPlanId(
                      event.target.value,
                    )
                  }
                  options={plans.map((plan) => ({
                    value: plan.id,
                    label: plan.name,
                  }))}
                />
              )}

              {activeAction !== "cancel" && (
                <>
                  <FormField
                    label="Start date"
                    name="actionStartDate"
                    type="date"
                    value={actionStartDate}
                    onChange={(event) =>
                      setActionStartDate(
                        event.target.value,
                      )
                    }
                    required
                  />

                  <FormField
                    label="Custom expiry date"
                    name="actionExpiryDate"
                    type="date"
                    value={actionExpiryDate}
                    onChange={(event) =>
                      setActionExpiryDate(
                        event.target.value,
                      )
                    }
                  />
                </>
              )}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                {activeAction === "cancel"
                  ? "Cancellation reason"
                  : "Action notes"}
              </span>

              <textarea
                value={actionReason}
                onChange={(event) =>
                  setActionReason(
                    event.target.value,
                  )
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveAction("");
                  setActionPlanId("");
                  setActionExpiryDate("");
                  setActionReason("");
                }}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => {
                  if (activeAction === "cancel") {
                    handleCancelMembership();
                    return;
                  }

                  handleReplaceMembership(
                    activeAction,
                  );
                }}
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
              >
                {isProcessingAction
                  ? "Processing..."
                  : "Confirm action"}
              </button>
            </div>
          </section>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
                Membership Details
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Plan and status
              </h2>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <SelectField
                label="Membership plan"
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                options={plans.map(
                  (membershipPlan) => ({
                    value:
                      membershipPlan.id,

                    label: `${
                      membershipPlan.name
                    } — TT$${
                      membershipPlan.price_ttd
                    }`,
                  }),
                )}
              />

              <SelectField
                label="Membership status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={statusOptions.map(
                  (status) => ({
                    value: status,
                    label:
                      formatStatus(
                        status,
                      ),
                  }),
                )}
              />

              <FormField
                label="Start date"
                name="startsAt"
                type="date"
                value={formData.startsAt}
                onChange={handleChange}
                required
              />

              <FormField
                label="Expiry date"
                name="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={handleChange}
              />

              <SelectField
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                options={[
                  {
                    value: "manual",
                    label: "Manual",
                  },
                  {
                    value: "payment",
                    label: "Payment",
                  },
                  {
                    value: "promotion",
                    label: "Promotion",
                  },
                  {
                    value: "school",
                    label: "School",
                  },
                  {
                    value: "system",
                    label: "System",
                  },
                  {
                    value: "migration",
                    label: "Migration",
                  },
                ]}
              />

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  name="autoRenew"
                  checked={
                    formData.autoRenew
                  }
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 accent-yellow-400"
                />

                <span>
                  <span className="block text-sm font-bold text-slate-700">
                    Auto-renew
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    Renew automatically when the
                    membership expires.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {formData.status ===
            "cancelled" && (
            <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
                Cancellation
              </p>

              <h2 className="mt-2 text-xl font-black text-red-900">
                Cancellation reason
              </h2>

              <textarea
                name="cancellationReason"
                value={
                  formData.cancellationReason
                }
                onChange={handleChange}
                rows={4}
                required
                placeholder="Explain why this membership is being cancelled."
                className="mt-5 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
              Admin Notes
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Internal membership notes
            </h2>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={5}
              placeholder="Add internal notes about this membership."
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
            />
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
                  Review the membership details
                  before saving.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/memberships",
                  )
                }
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
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
                  : "Save changes"}
              </button>
            </div>
          </div>
                </form>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Membership History
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
           Plan timeline ({membershipHistory.length})
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review previous and current memberships
            for this student.
          </p>

          {isLoadingHistory && (
            <div className="py-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-400" />

              <p className="mt-4 text-sm font-bold text-slate-600">
                Loading membership history...
              </p>
            </div>
          )}

          {!isLoadingHistory && historyError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="font-bold text-red-700">
                {historyError}
              </p>
            </div>
          )}

          {!isLoadingHistory &&
            !historyError &&
            membershipHistory.length === 0 && (
              <div className="mt-6 rounded-2xl bg-slate-50 py-10 text-center">
                <CreditCard
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-bold text-slate-500">
                  No membership history found
                </p>
              </div>
            )}

          {!isLoadingHistory &&
            !historyError &&
            membershipHistory.length > 0 && (
              <div className="mt-7 space-y-4">
                {membershipHistory.map(
                  (historyItem) => (
                    <MembershipHistoryItem
                      key={historyItem.id}
                      membership={historyItem}
                      selectedMembershipId={
                        membership.id
                      }
                    />
                  ),
                )}
              </div>
            )}
        </section>
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

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
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
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
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
    active:
      "bg-emerald-100 text-emerald-700",
    pending:
      "bg-amber-100 text-amber-700",
    grace:
      "bg-blue-100 text-blue-700",
    paused:
      "bg-violet-100 text-violet-700",
    expired:
      "bg-slate-100 text-slate-600",
    cancelled:
      "bg-red-100 text-red-700",
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

function MembershipHistoryItem({
  membership,
  selectedMembershipId,
}) {
  const plan =
    membership.membership_plans;

  const isSelected =
    membership.id === selectedMembershipId;

  return (
    <Link
      to={`/admin/memberships/${membership.id}`}
      className={`block rounded-2xl border p-5 transition ${
        isSelected
          ? "border-yellow-300 bg-yellow-50"
          : "border-slate-200 hover:border-yellow-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-slate-950">
              {plan?.name || "Unknown plan"}
            </p>

            {membership.is_current && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                Current
              </span>
            )}

            {isSelected && (
              <span className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-black text-yellow-800">
                Viewing
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {formatDate(
              membership.starts_at,
              "Unknown start date",
            )}
            {" → "}
            {formatDate(
              membership.expires_at,
              "No expiry",
            )}
          </p>

          {membership.cancellation_reason && (
            <p className="mt-3 text-sm text-red-600">
              Cancellation reason:{" "}
              {membership.cancellation_reason}
            </p>
          )}
        </div>

        <StatusBadge
          status={membership.status}
        />
      </div>

      {membership.metadata?.action && (
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Action:{" "}
          {formatAction(
            membership.metadata.action,
          )}
        </p>
      )}
    </Link>
  );
}

function formatAction(action) {
  if (!action) return "";

  return action
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatStatus(status) {
  if (!status) return "Pending";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function formatDate(
  dateValue,
  fallback,
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

function toDateInputValue(
  dateValue,
) {
  if (!dateValue) return "";

  return new Date(dateValue)
    .toISOString()
    .slice(0, 10);
}

function toTimestamp(dateValue) {
  return new Date(
    `${dateValue}T12:00:00`,
  ).toISOString();
}

