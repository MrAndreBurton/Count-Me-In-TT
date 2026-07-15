import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

export default function ResultTest() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [createdResult, setCreatedResult] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      setIsLoading(true);
      setLoadError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            "You must be logged in to test a game result."
          );
        }

        const { data, error } = await supabase
          .from("student_profiles")
          .select(
            `
              id,
              public_display_name,
              first_name,
              last_name,
              current_school,
              current_level
            `
          )
          .eq("account_id", user.id)
          .eq("profile_status", "active")
          .order("created_at", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        if (!active) return;

        setStudents(data || []);

        if (data?.length) {
          setSelectedStudentId(data[0].id);
        }
      } catch (error) {
        console.error("Student loading error:", error);

        if (active) {
          setLoadError(
            error?.message ||
              "The student profiles could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      active = false;
    };
  }, []);

  const insertTestResult = async () => {
    if (isSubmitting) return;

    setSubmitError("");
    setCreatedResult(null);

    if (!selectedStudentId) {
      setSubmitError("Please choose a student.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "You must be logged in to save a result."
        );
      }

      const { data, error } = await supabase
        .from("game_results")
        .insert({
          student_id: selectedStudentId,
          account_id: user.id,

          game_type: "multiplication",
          game_mode: "5x5",
          mode_label: "5 × 5 Quick",

          duration_ms: 18420,

          score: null,
          max_score: null,
          correct_answers: 25,
          incorrect_answers: 0,
          accuracy_percent: 100,

          submission_type: "practice",
          challenge_key: null,
          event_name: null,

          public_eligible: true,

          /*
           * Temporary controlled test.
           * Later, your real game logic will decide whether
           * a result is pending, verified, rejected or flagged.
           */
          verification_status: "verified",

          anti_cheat_data: {
            moves: 25,
            trusted: 25,
            untrusted: 0,
            paste: false,
            vkPresses: 0,
            durationMs: 18420,
          },

          rejection_reason: null,
          is_personal_best: false,
          played_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCreatedResult(data);
    } catch (error) {
      console.error("Result creation error:", error);

      const message =
        error?.message ||
        "The test result could not be saved.";

      if (message.toLowerCase().includes("row-level security")) {
        setSubmitError(
          "Your account does not have permission to save a result for this student."
        );
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Development Test
            </p>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Test Game Result Insertion
            </h1>

            <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
              This temporary page inserts a controlled 5 × 5 result into
              Supabase before the real multiplication game is connected.
            </p>
          </div>
        </section>

        <section className="px-5 py-14">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {isLoading ? (
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <p className="mt-4 font-bold text-gray-600">
                  Loading students…
                </p>
              </div>
            ) : loadError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700"
              >
                {loadError}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center">
                <h2 className="text-2xl font-black">
                  No student profiles found.
                </h2>

                <p className="mt-3 text-gray-600">
                  Add a student before testing result insertion.
                </p>

                <Link
                  to="/students/add"
                  className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white"
                >
                  Add Student
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="student"
                    className="mb-2 block text-sm font-black text-gray-800"
                  >
                    Student
                  </label>

                  <select
                    id="student"
                    value={selectedStudentId}
                    onChange={(event) => {
                      setSelectedStudentId(event.target.value);
                      setCreatedResult(null);
                      setSubmitError("");
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.public_display_name ||
                          student.first_name}
                        {student.current_level
                          ? ` — ${student.current_level}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                    Test result
                  </p>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-bold text-gray-500">
                        Game
                      </dt>
                      <dd className="mt-1 font-black">
                        Multiplication
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold text-gray-500">
                        Mode
                      </dt>
                      <dd className="mt-1 font-black">
                        5 × 5 Quick
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold text-gray-500">
                        Time
                      </dt>
                      <dd className="mt-1 font-black">
                        18.42 seconds
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold text-gray-500">
                        Verification
                      </dt>
                      <dd className="mt-1 font-black">
                        Verified test
                      </dd>
                    </div>
                  </dl>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {submitError}
                  </div>
                )}

                {createdResult && (
                  <div
                    role="status"
                    className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5"
                  >
                    <h2 className="font-black text-gray-950">
                      Test result saved.
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      The result was inserted into the
                      <code className="mx-1 font-black">
                        game_results
                      </code>
                      table.
                    </p>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-bold text-gray-500">
                          Mode
                        </dt>
                        <dd className="mt-1 font-black">
                          {createdResult.mode_label}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-bold text-gray-500">
                          Duration
                        </dt>
                        <dd className="mt-1 font-black">
                          {createdResult.duration_ms} ms
                        </dd>
                      </div>

                      <div>
                        <dt className="font-bold text-gray-500">
                          Status
                        </dt>
                        <dd className="mt-1 font-black capitalize">
                          {createdResult.verification_status}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-bold text-gray-500">
                          Personal Best
                        </dt>
                        <dd className="mt-1 font-black">
                          {createdResult.is_personal_best
                            ? "Yes"
                            : "No"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                <button
                  type="button"
                  onClick={insertTestResult}
                  disabled={isSubmitting}
                  className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Saving Test Result..."
                    : "Insert Test Result"}
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

