import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { supabase } from "../lib/supabase";
import "./MembershipRequest.css";

import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

import {
  createMembershipRequest,
  getEligibleMembershipStudents,
  getRequestableMembershipPlans,
} from "../lib/membershipRequests";

function formatPrice(value) {
  const price = Number(value);

  if (Number.isNaN(price)) {
    return "";
  }

  return `TT$${price.toFixed(0)}`;
}

function getStudentName(student) {
  return (
    student?.public_display_name ||
    [student?.first_name, student?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Student"
  );
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function MembershipRequestLayout({ children }) {
  return (
    <>
      <SiteHeader />

      <main className="membership-request-page">
        {children}
      </main>

      <SiteFooter />
    </>
  );
}

export default function MembershipRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedPlan =
    searchParams.get("plan") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [selectedPlanId, setSelectedPlanId] =
    useState("");

  const [
    preferredContactMethod,
    setPreferredContactMethod,
  ] = useState("whatsapp");

  const [contactName, setContactName] =
    useState("");

  const [contactEmail, setContactEmail] =
    useState("");

  const [contactPhone, setContactPhone] =
    useState("");

  const [notes, setNotes] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [submittedRequest, setSubmittedRequest] =
    useState(null);

  const selectedStudent = useMemo(() => {
    return (
      students.find(
        (student) =>
          student.id === selectedStudentId
      ) || null
    );
  }, [students, selectedStudentId]);

  const selectedPlan = useMemo(() => {
    return (
      plans.find(
        (plan) => plan.id === selectedPlanId
      ) || null
    );
  }, [plans, selectedPlanId]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!active) {
          return;
        }

        setUser(currentUser || null);

        if (!currentUser) {
          return;
        }

        setContactEmail(currentUser.email || "");

        const [
          eligibleStudents,
          availablePlans,
        ] = await Promise.all([
          getEligibleMembershipStudents(),
          getRequestableMembershipPlans(),
        ]);

        if (!active) {
          return;
        }

        setStudents(eligibleStudents);
        setPlans(availablePlans);

        if (eligibleStudents.length === 1) {
          setSelectedStudentId(
            eligibleStudents[0].id
          );
        }

        const normalizedRequestedPlan =
          normalizeValue(requestedPlan);

        if (normalizedRequestedPlan) {
          const matchingPlan =
            availablePlans.find((plan) => {
              const possibleValues = [
                plan.id,
                plan.plan_key,
                plan.name,
              ]
                .filter(Boolean)
                .map(normalizeValue);

              return possibleValues.some(
                (value) =>
                  value ===
                    normalizedRequestedPlan ||
                  value.includes(
                    normalizedRequestedPlan
                  )
              );
            });

          if (matchingPlan) {
            setSelectedPlanId(
              matchingPlan.id
            );
          }
        }
      } catch (error) {
        console.error(
          "Unable to load membership request page:",
          error
        );

        if (active) {
          setErrorMessage(
            error?.message ||
              "We could not load the membership request form."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [requestedPlan]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage("");

      if (!selectedStudentId) {
        throw new Error(
          "Please select the student receiving membership."
        );
      }

      if (!selectedPlanId) {
        throw new Error(
          "Please select a membership plan."
        );
      }

      if (!contactName.trim()) {
        throw new Error(
          "Please enter a contact name."
        );
      }

      if (!contactEmail.trim()) {
        throw new Error(
          "Please enter a contact email address."
        );
      }

      if (
        ["whatsapp", "phone"].includes(
          preferredContactMethod
        ) &&
        !contactPhone.trim()
      ) {
        throw new Error(
          "Please enter a phone or WhatsApp number."
        );
      }

      const result =
        await createMembershipRequest({
          studentProfileId:
            selectedStudentId,
          planId: selectedPlanId,
          preferredContactMethod,
          contactName,
          contactEmail,
          contactPhone,
          notes,
        });

      setSubmittedRequest(result);
    } catch (error) {
      console.error(
        "Unable to submit membership request:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Your membership request could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <MembershipRequestLayout>
        <section className="membership-request-card">
          <p>Loading membership options...</p>
        </section>
      </MembershipRequestLayout>
    );
  }

  if (!user) {
    return (
      <MembershipRequestLayout>
        <section className="membership-request-card">
          <p className="membership-request-eyebrow">
            COUNTMEINTT MEMBERSHIP
          </p>

          <h1>Sign in to request membership</h1>

          <p>
            Membership must be connected to a
            CountMeInTT student profile. Sign in or
            create a free account before submitting
            a request.
          </p>

          <div className="membership-request-actions">
            <Link
              to="/login"
              className="membership-request-primary-button"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="membership-request-secondary-button"
            >
              Create Free Account
            </Link>
          </div>

          <Link
            to="/membership"
            className="membership-request-text-link"
          >
            Return to Membership Options
          </Link>
        </section>
      </MembershipRequestLayout>
    );
  }

  if (submittedRequest) {
    const submittedStudent =
      submittedRequest.student ||
      selectedStudent;

    const submittedPlan =
      submittedRequest.plan ||
      selectedPlan;

    return (
      <MembershipRequestLayout>
        <section className="membership-request-card membership-request-success">
          <div className="membership-request-success-icon">
            ✓
          </div>

          <p className="membership-request-eyebrow">
            REQUEST RECEIVED
          </p>

          <h1>
            Membership Request Submitted
          </h1>

          <p>
            Your request has been received. We will
            contact you with payment instructions.
            Once payment is confirmed, membership
            will normally be activated within 24
            hours.
          </p>

          <div className="membership-request-summary">
            <div>
              <span>Student</span>

              <strong>
                {getStudentName(
                  submittedStudent
                )}
              </strong>
            </div>

            <div>
              <span>Membership</span>

              <strong>
                {submittedPlan?.name ||
                  "Paid Membership"}
              </strong>
            </div>

            {submittedPlan?.price !==
              undefined && (
              <div>
                <span>Price</span>

                <strong>
                  {formatPrice(
                    submittedPlan.price_ttd
                  )}
                </strong>
              </div>
            )}

            <div>
              <span>Status</span>
              <strong>Pending</strong>
            </div>
          </div>

          <div className="membership-request-actions">
            <button
              type="button"
              className="membership-request-primary-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Return to Dashboard
            </button>

            <Link
              to="/membership"
              className="membership-request-secondary-button"
            >
              View Membership Options
            </Link>
          </div>
        </section>
      </MembershipRequestLayout>
    );
  }

  if (students.length === 0) {
    return (
      <MembershipRequestLayout>
        <section className="membership-request-card">
          <p className="membership-request-eyebrow">
            COUNTMEINTT MEMBERSHIP
          </p>

          <h1>
            No eligible student profile found
          </h1>

          <p>
            A student profile must be connected to
            this account before membership can be
            requested.
          </p>

          <div className="membership-request-actions">
            <Link
              to="/dashboard"
              className="membership-request-primary-button"
            >
              Return to Dashboard
            </Link>

            <Link
              to="/membership"
              className="membership-request-secondary-button"
            >
              View Membership Options
            </Link>
          </div>
        </section>
      </MembershipRequestLayout>
    );
  }

  return (
    <MembershipRequestLayout>
      <section className="membership-request-card">
        <p className="membership-request-eyebrow">
          COUNTMEINTT MEMBERSHIP
        </p>

        <h1>Request Membership</h1>

        <p className="membership-request-intro">
          Select the student and membership plan.
          We will contact you with payment
          instructions before activating the
          membership.
        </p>

        {errorMessage && (
          <div
            className="membership-request-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="membership-request-form"
        >
          <div className="membership-request-field">
            <label htmlFor="membership-student">
              Student
            </label>

            <select
              id="membership-student"
              value={selectedStudentId}
              onChange={(event) => {
                setSelectedStudentId(
                  event.target.value
                );
                setErrorMessage("");
              }}
              disabled={
                submitting ||
                students.length === 1
              }
              required
            >
              <option value="">
                Choose a student
              </option>

              {students.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                >
                  {getStudentName(student)}
                </option>
              ))}
            </select>

            {students.length === 1 && (
              <small>
                Membership will be requested for
                this student profile.
              </small>
            )}
          </div>

          <fieldset className="membership-request-fieldset">
            <legend>Membership plan</legend>

            <div className="membership-request-plan-options">
              {plans.map((plan) => {
                const isSelected =
                  selectedPlanId === plan.id;

                return (
                  <label
                    key={plan.id}
                    className={`membership-request-plan-option ${
                      isSelected
                        ? "membership-request-plan-option-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="membership-plan"
                      value={plan.id}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedPlanId(
                          plan.id
                        );
                        setErrorMessage("");
                      }}
                      disabled={submitting}
                    />

                    <span>
                      <strong>{plan.name}</strong>

                      {plan.price_ttd !==
                        undefined && (
                        <small>
                          {formatPrice(
                            plan.price_ttd
                          )}
                        </small>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {plans.length === 0 && (
              <p>
                No paid membership plans are
                currently available.
              </p>
            )}
          </fieldset>

          <div className="membership-request-field">
            <label htmlFor="membership-contact-name">
              Contact name
            </label>

            <input
              id="membership-contact-name"
              type="text"
              value={contactName}
              onChange={(event) =>
                setContactName(
                  event.target.value
                )
              }
              placeholder="Parent, guardian or student name"
              disabled={submitting}
              required
            />
          </div>

          <div className="membership-request-field">
            <label htmlFor="membership-contact-email">
              Email address
            </label>

            <input
              id="membership-contact-email"
              type="email"
              value={contactEmail}
              onChange={(event) =>
                setContactEmail(
                  event.target.value
                )
              }
              placeholder="name@example.com"
              disabled={submitting}
              required
            />
          </div>

          <fieldset className="membership-request-fieldset">
            <legend>
              Preferred contact method
            </legend>

            <div className="membership-request-contact-options">
              <label>
                <input
                  type="radio"
                  name="preferred-contact"
                  value="whatsapp"
                  checked={
                    preferredContactMethod ===
                    "whatsapp"
                  }
                  onChange={(event) =>
                    setPreferredContactMethod(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                />
                WhatsApp
              </label>

              <label>
                <input
                  type="radio"
                  name="preferred-contact"
                  value="email"
                  checked={
                    preferredContactMethod ===
                    "email"
                  }
                  onChange={(event) =>
                    setPreferredContactMethod(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                />
                Email
              </label>

              <label>
                <input
                  type="radio"
                  name="preferred-contact"
                  value="phone"
                  checked={
                    preferredContactMethod ===
                    "phone"
                  }
                  onChange={(event) =>
                    setPreferredContactMethod(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                />
                Phone
              </label>
            </div>
          </fieldset>

          <div className="membership-request-field">
            <label htmlFor="membership-contact-phone">
              Phone or WhatsApp number
              {preferredContactMethod ===
                "email" && (
                <span> (optional)</span>
              )}
            </label>

            <input
              id="membership-contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(event) =>
                setContactPhone(
                  event.target.value
                )
              }
              placeholder="e.g. 868-555-1234"
              disabled={submitting}
              required={[
                "whatsapp",
                "phone",
              ].includes(
                preferredContactMethod
              )}
            />
          </div>

          <div className="membership-request-field">
            <label htmlFor="membership-notes">
              Notes or questions
              <span> (optional)</span>
            </label>

            <textarea
              id="membership-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Let us know if you have any questions."
              rows={4}
              disabled={submitting}
            />
          </div>

          <div className="membership-request-notice">
            <strong>What happens next?</strong>

            <p>
              We will contact you with payment
              instructions. Membership will only be
              activated after payment is confirmed.
            </p>
          </div>

          <button
            type="submit"
            className="membership-request-submit-button"
            disabled={
              submitting ||
              plans.length === 0
            }
          >
            {submitting
              ? "Submitting Request..."
              : "Submit Membership Request"}
          </button>
        </form>

        <Link
          to="/membership"
          className="membership-request-text-link"
        >
          Return to Membership Options
        </Link>
      </section>
    </MembershipRequestLayout>
  );
}

