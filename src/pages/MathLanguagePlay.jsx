import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import GameHeader from "../components/layout/GameHeader";
import { saveMathLanguageResult } from "../lib/mathLanguageResults";
import { mathLanguageTerms } from "../data/mathLanguageTerms";
import { getPlayableQuestions } from "../utils/mathLanguage/getPlayableQuestions";
import { getBadgeResult } from "../utils/mathLanguage/getBadgeResult";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";
import {
  getPlayableProfileMembership,
} from "../lib/membership";

import {
  canPlayMathLanguageLevel,
  getMathLanguageWordBank,
  getMembershipPlanName,
} from "../lib/membershipAccess";



const ROUND_LEVELS = [
  {
    id: "quick",
    name: "Quick Check",
    questionCount: 10,
    description: "A short practice round to review key math words.",
    accent: "border-yellow-300 bg-yellow-50",
  },
  {
    id: "challenge",
    name: "Word Challenge",
    questionCount: 25,
    description: "A longer round to build stronger math-language recall.",
    accent: "border-blue-300 bg-blue-50",
  },
  {
    id: "mastery",
    name: "Mastery Round",
    questionCount: 40,
    description: "A full challenge for students ready to test broad understanding.",
    accent: "border-purple-300 bg-purple-50",
  },
];

function getAllowedMathLanguageTerms(wordBank) {
  if (wordBank === "full_200") {
    return mathLanguageTerms;
  }

  return mathLanguageTerms.filter(
    (term) =>
      String(term.accessLevel || "")
        .trim()
        .toLowerCase() === "free"
  );
}

function createInitialGameState() {
  return {
    status: "intro",
    selectedLevelId: "quick",
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    hasAnswered: false,
    score: 0,
    answersLog: [],
    missedQuestions: [],
  };
}

export default function MathLanguagePlay() {
  const [gameState, setGameState] = useState(createInitialGameState);

  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const [membershipState, setMembershipState] =
  useState({
    loading: true,
    guest: false,
    profile: null,
    membership: null,
    error: "",
  });

useEffect(() => {
  let isMounted = true;

  async function loadMembershipAccess() {
    try {
      const outcome =
        await getPlayableProfileMembership();

      if (!isMounted) return;

      setMembershipState({
        loading: false,
        guest: outcome.guest,
        profile: outcome.profile,
        membership: outcome.membership,
        error: "",
      });
    } catch (error) {
      console.error(
        "Math Language membership loading error:",
        error
      );

      if (!isMounted) return;

      setMembershipState({
        loading: false,
        guest: false,
        profile: null,
        membership: null,
        error:
          error?.message ||
          "Your membership access could not be loaded.",
      });
    }
  }

  loadMembershipAccess();

  return () => {
    isMounted = false;
  };
}, []);

const membership = membershipState.membership;

const membershipPlanName =
  membershipState.guest
    ? "Guest Access"
    : getMembershipPlanName(membership);

const playerName =
  membershipState.profile?.public_display_name ||
  membershipState.profile?.first_name ||
  (membershipState.guest
    ? "Guest Player"
    : "Player");

  const selectedLevel = useMemo(
    () =>
      ROUND_LEVELS.find(
        (level) => level.id === gameState.selectedLevelId
      ) || ROUND_LEVELS[0],
    [gameState.selectedLevelId]
  );

  const startRound = (
  levelId = gameState.selectedLevelId
) => {
  if (membershipState.loading) {
    return;
  }

  if (membershipState.error) {
    setSaveStatus("error");
    setSaveMessage(membershipState.error);
    return;
  }

  const level =
    ROUND_LEVELS.find(
      (option) => option.id === levelId
    ) || ROUND_LEVELS[0];

  const hasLevelAccess =
    canPlayMathLanguageLevel(
      membership,
      level.questionCount
    );

  if (!hasLevelAccess) {
    setSaveStatus("locked");
    setSaveMessage(
      `${level.name} requires a full CountMeInTT membership.`
    );
    return;
  }

  const wordBank =
    getMathLanguageWordBank(
      membership,
      level.questionCount
    );

  const allowedTerms =
    getAllowedMathLanguageTerms(wordBank);

  const questions = getPlayableQuestions(
    allowedTerms,
    level.questionCount
  );

  if (!questions.length) {
    setGameState((previous) => ({
      ...previous,
      selectedLevelId: level.id,
      status: "error",
    }));

    return;
  }

  setSaveStatus("idle");
  setSaveMessage("");

  setGameState({
    status: "active",
    selectedLevelId: level.id,
    questions,
    currentQuestionIndex: 0,
    selectedAnswer: null,
    hasAnswered: false,
    score: 0,
    answersLog: [],
    missedQuestions: [],
  });
};

  const chooseLevel = (levelId) => {
  const level = ROUND_LEVELS.find(
    (option) => option.id === levelId
  );

  if (!level || membershipState.loading) {
    return;
  }

  const hasLevelAccess =
    canPlayMathLanguageLevel(
      membership,
      level.questionCount
    );

  if (!hasLevelAccess) {
    setSaveStatus("locked");
    setSaveMessage(
      `${level.name} is available with a full CountMeInTT membership.`
    );
    return;
  }

  setSaveStatus("idle");
  setSaveMessage("");

  setGameState((previous) => ({
    ...previous,
    selectedLevelId: levelId,
  }));
};

 const returnToLevelSelection = () => {
  setSaveStatus("idle");
  setSaveMessage("");

  setGameState((previous) => ({
    ...createInitialGameState(),
    selectedLevelId: previous.selectedLevelId,
  }));
};

  const handleAnswerSelect = (answer) => {
    if (gameState.hasAnswered) return;

    const currentQuestion =
      gameState.questions[gameState.currentQuestionIndex];

    const isCorrect = answer.isCorrect;

    const answerLog = {
      questionId: currentQuestion.id,
      term: currentQuestion.term,
      category: currentQuestion.category,
      gameQuestion: currentQuestion.gameQuestion,
      selectedAnswer: answer.label,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      feedback: currentQuestion.feedback,
      simpleMeaning: currentQuestion.simpleMeaning,
    };

if (!membershipState.loading && membershipState.guest) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <section className="rounded-3xl border border-yellow-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-wider text-yellow-700">
          Free Account Required
        </p>

        <h1 className="mt-3 text-3xl font-black text-gray-950">
          Sign in to play the Math Language Challenge
        </h1>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
          Create a free CountMeInTT account to access the
          10-word and 25-word rounds and save your results.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/login"
            className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-gray-950 hover:bg-yellow-300"
          >
            Sign In
          </a>

          <a
            href="/register"
            className="rounded-xl border-2 border-gray-900 px-6 py-3 font-black text-gray-950 hover:bg-gray-50"
          >
            Create Free Account
          </a>
        </div>
      </section>
    </main>
  );
}

    setGameState((previous) => ({
      ...previous,
      selectedAnswer: answer.label,
      hasAnswered: true,
      status: "feedback",
      score: isCorrect
        ? previous.score + 1
        : previous.score,
      answersLog: [
        ...previous.answersLog,
        answerLog,
      ],
      missedQuestions: isCorrect
        ? previous.missedQuestions
        : [
            ...previous.missedQuestions,
            currentQuestion,
          ],
    }));
  };

  const handleNextQuestion = async () => {
  const isLastQuestion =
    gameState.currentQuestionIndex ===
    gameState.questions.length - 1;

  if (isLastQuestion) {
  const finalScore = gameState.answersLog.filter(
    (answer) => answer.isCorrect
  ).length;

  setGameState((previous) => ({
    ...previous,
    status: "complete",
  }));

  setSaveStatus("saving");
  setSaveMessage(
    "Saving this round to your learning profile…"
  );

  try {
    const saveOutcome =
      await saveMathLanguageResult({
        gameMode: gameState.selectedLevelId,
        score: finalScore,
      });

    if (saveOutcome.guest) {
      setSaveStatus("guest");
      setSaveMessage(
        "You completed this round as a guest. The result was not saved to a learning profile."
      );
    } else {
      setSaveStatus("saved");
      setSaveMessage(
        "Round saved to your learning profile."
      );
    }
  } catch (error) {
    console.error(
      "Math Language result save error:",
      error
    );

    setSaveStatus("error");
    setSaveMessage(
      error?.message ||
        "The round was completed, but the result could not be saved."
    );
  }

  return;
}

  setGameState((previous) => ({
    ...previous,
    currentQuestionIndex:
      previous.currentQuestionIndex + 1,
    selectedAnswer: null,
    hasAnswered: false,
    status: "active",
  }));
};

  const UtilityLinks = () => (
    <nav className="mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3">
      <Link
        to="/math-language"
        className="text-sm font-black text-gray-600 transition hover:text-blue-700"
      >
        ← Math Language Home
      </Link>

      <Link
        to="/math-language/dictionary"
        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 transition hover:border-yellow-300 hover:bg-yellow-50"
      >
        View Dictionary
      </Link>
    </nav>
  );

  if (gameState.status === "intro") {
    return (
      <div className="min-h-screen bg-white text-gray-950">
        <GameHeader />

        <main className="px-4 py-8 sm:py-12">
          <UtilityLinks />

          <section className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <MathLanguageBrand />

            <p className="text-sm font-black uppercase tracking-wider text-yellow-700">
              Choose Your Challenge
            </p>

            <h1 className="mt-2 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">
              Math Language Challenge
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-gray-700">
              Choose how many words you want to test. Each completed
              level counts as one Math Language round.
            </p>
            <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <p className="text-xs font-black uppercase tracking-wider text-gray-500">
      Playing As
    </p>

    <p className="mt-1 font-black text-gray-950">
      {membershipState.loading
        ? "Loading player…"
        : playerName}
    </p>
  </div>

  <div className="sm:text-right">
    <p className="text-xs font-black uppercase tracking-wider text-gray-500">
      Access
    </p>

    <p className="mt-1 font-black text-blue-700">
      {membershipState.loading
        ? "Checking membership…"
        : membershipPlanName}
    </p>
  </div>
</div>

            <div className="mt-6 rounded-2xl bg-yellow-50 p-5 text-gray-800">
              Some words tell you to add. Others tell you to subtract,
              compare, measure, estimate or explain. Learn the words
              and decode the question.
            </div>

            <div className="mt-7 grid gap-4">
              {ROUND_LEVELS.map((level) => {
  const selected =
    gameState.selectedLevelId === level.id;

  const hasAccess =
    !membershipState.loading &&
    !membershipState.error &&
    canPlayMathLanguageLevel(
      membership,
      level.questionCount
    );

  const isLocked =
    !membershipState.loading &&
    !hasAccess;

  return (
    <button
      key={level.id}
      type="button"
      onClick={() => chooseLevel(level.id)}
      disabled={
        membershipState.loading ||
        Boolean(membershipState.error) ||
        isLocked
      }
      className={[
        "rounded-2xl border-2 p-5 text-left transition",
        isLocked
          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-75"
          : selected
            ? `${level.accent} ring-4 ring-yellow-100`
            : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-black text-gray-950">
              {level.name}
            </p>

            {isLocked && (
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-700">
                Locked
              </span>
            )}
          </div>

          <p className="mt-2 leading-6 text-gray-600">
            {level.description}
          </p>

          {isLocked && (
            <p className="mt-2 text-sm font-black text-purple-700">
              Full Membership Required
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
          {membershipState.loading
            ? "Checking…"
            : `${level.questionCount} Words`}
        </div>
      </div>
    </button>
  );
})}
            </div>

{saveMessage && (
  <div
    className={[
      "mt-4 rounded-xl border p-4 text-sm font-bold",
      saveStatus === "locked"
        ? "border-purple-200 bg-purple-50 text-purple-800"
        : saveStatus === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-gray-200 bg-gray-50 text-gray-700",
    ].join(" ")}
  >
    {saveStatus === "locked" && "🔒 "}
    {saveStatus === "error" && "⚠️ "}
    {saveMessage}
  </div>
)}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">
                  Selected Level
                </p>

                <p className="mt-1 font-black text-gray-950">
                  {selectedLevel.name}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">
                  Questions
                </p>

                <p className="mt-1 font-black text-gray-950">
                  {selectedLevel.questionCount}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">
                  Feedback
                </p>

                <p className="mt-1 font-black text-gray-950">
                  After Every Answer
                </p>
              </div>
            </div>

           <button
  type="button"
  onClick={() =>
    startRound(gameState.selectedLevelId)
  }
  disabled={
    membershipState.loading ||
    Boolean(membershipState.error) ||
    !canPlayMathLanguageLevel(
      membership,
      selectedLevel.questionCount
    )
  }
  className={[
    "mt-7 w-full rounded-xl px-5 py-4 text-lg font-black transition",
    membershipState.loading ||
    membershipState.error ||
    !canPlayMathLanguageLevel(
      membership,
      selectedLevel.questionCount
    )
      ? "cursor-not-allowed bg-gray-200 text-gray-500"
      : "bg-yellow-400 text-gray-950 hover:bg-yellow-300",
  ].join(" ")}
>
  {membershipState.loading
    ? "Checking Access…"
    : canPlayMathLanguageLevel(
          membership,
          selectedLevel.questionCount
        )
      ? `Start ${selectedLevel.name}`
      : "Full Membership Required"}
</button>


          </section>
        </main>

        <MathLanguageFooter />
      </div>
    );
  }

  if (gameState.status === "error") {
    return (
      <div className="min-h-screen bg-white text-gray-950">
        <GameHeader />

        <main className="px-4 py-8">
          <UtilityLinks />

          <section className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-6 text-left">
              <MathLanguageBrand />
            </div>

            <h1 className="mb-3 text-2xl font-black text-gray-950">
              No questions found.
            </h1>

            <p className="mb-6 text-gray-700">
              There are not enough playable questions available for
              this level yet. Choose another level or check the Math
              Language data.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  startRound(gameState.selectedLevelId)
                }
                className="rounded-xl bg-yellow-400 px-5 py-3 font-black text-gray-950 hover:bg-yellow-300"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={returnToLevelSelection}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-black text-gray-700 hover:bg-gray-50"
              >
                Choose Another Level
              </button>
            </div>
          </section>
        </main>

        <MathLanguageFooter />
      </div>
    );
  }

  if (gameState.status === "complete") {
    const totalQuestions = gameState.questions.length;
    const incorrectAnswers =
      totalQuestions - gameState.score;

    const accuracy =
      totalQuestions > 0
        ? Math.round(
            (gameState.score / totalQuestions) * 100
          )
        : 0;

    const badgeResult = getBadgeResult(
      gameState.score,
      totalQuestions
    );

    return (
      <div className="min-h-screen bg-white text-gray-950">
        <GameHeader />

        <main className="px-4 py-8 sm:py-12">
          <UtilityLinks />

          <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mb-6 text-left">
              <MathLanguageBrand />
            </div>

            <p className="text-sm font-black uppercase tracking-wider text-yellow-700">
              {selectedLevel.name} Complete
            </p>

            <h1 className="mt-2 text-3xl font-black text-gray-950">
              Great work!
            </h1>

            <div className="mt-6 rounded-2xl bg-yellow-50 p-6">
              <p className="text-sm font-semibold text-gray-600">
                Your Score
              </p>

              <p className="mt-1 text-5xl font-black text-gray-950">
                {gameState.score} / {totalQuestions}
              </p>

              <p className="mt-3 font-black text-blue-700">
                {accuracy}% Accuracy
              </p>
            </div>

{saveStatus !== "idle" && (
  <div
    className={[
      "mt-5 rounded-xl border p-4 text-sm font-bold",
      saveStatus === "saved"
        ? "border-green-200 bg-green-50 text-green-800"
        : saveStatus === "guest"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : saveStatus === "error"
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-gray-200 bg-gray-50 text-gray-700",
    ].join(" ")}
  >
    {saveStatus === "saving" && "⏳ "}
    {saveStatus === "saved" && "✅ "}
    {saveStatus === "guest" && "👤 "}
    {saveStatus === "error" && "⚠️ "}

    {saveMessage}
  </div>
)}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-700">
                  Correct
                </p>

                <p className="mt-1 text-3xl font-black text-green-900">
                  {gameState.score}
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  Incorrect
                </p>

                <p className="mt-1 text-3xl font-black text-red-900">
                  {incorrectAnswers}
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-700">
                  Round Size
                </p>

                <p className="mt-1 text-3xl font-black text-blue-900">
                  {totalQuestions}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <p className="mb-2 text-sm font-semibold text-gray-600">
                Round Award
              </p>

              <p className="text-2xl font-black text-gray-950">
                {badgeResult.badge}
              </p>

              <p className="mt-2 text-gray-700">
                {badgeResult.message}
              </p>
            </div>

            {gameState.missedQuestions.length > 0 ? (
              <div className="mt-7 text-left">
                <h2 className="mb-3 text-xl font-black text-gray-950">
                  Words to Review
                </h2>

                <div className="space-y-3">
                  {gameState.missedQuestions.map(
                    (question) => (
                      <div
                        key={question.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <p className="font-black text-gray-950">
                          {question.term}
                        </p>

                        <p className="mt-1 text-gray-700">
                          {question.simpleMeaning ||
                            question.feedback}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-600">
                          Correct answer:{" "}
                          {question.correctAnswer}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-7 rounded-xl bg-green-50 p-4 font-semibold text-green-800">
                No words to review this time. Excellent work.
              </p>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  startRound(gameState.selectedLevelId)
                }
                className="rounded-xl bg-yellow-400 px-5 py-4 font-black text-gray-950 hover:bg-yellow-300"
              >
                Practise Again
              </button>

              <button
                type="button"
                onClick={returnToLevelSelection}
                className="rounded-xl border border-blue-600 bg-white px-5 py-4 font-black text-blue-600 hover:bg-blue-50"
              >
                Choose Level
              </button>

              <Link
                to="/math-language/dictionary"
                className="rounded-xl border border-gray-300 px-5 py-4 font-black text-gray-900 hover:bg-gray-50"
              >
                View Dictionary
              </Link>
            </div>

            <div className="mt-7 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-left">
              <h2 className="mb-2 text-xl font-black text-gray-950">
                Unlock the Full 200-Word SEA Math Language Game
              </h2>

              <p className="text-gray-700">
                The full version will unlock trap-word challenges,
                SEA question-decoder practice, category mastery and
                boss levels.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 rounded-xl bg-gray-200 px-5 py-3 font-black text-gray-600"
              >
                Unlock Full Version — Coming Soon
              </button>
            </div>
          </section>
        </main>

        <ScrollToTopButton />
        <MathLanguageFooter />
      </div>
    );
  }

  const currentQuestion =
    gameState.questions[
      gameState.currentQuestionIndex
    ];

  const questionNumber =
    gameState.currentQuestionIndex + 1;

  const totalQuestions =
    gameState.questions.length;

  const progressPercentage =
    (questionNumber / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <GameHeader />

      <main className="px-4 py-8">
        <UtilityLinks />

        <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <MathLanguageBrand />

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-yellow-700">
                {selectedLevel.name}
              </p>

              <p className="text-sm text-gray-600">
                Question {questionNumber} of{" "}
                {totalQuestions}
              </p>
            </div>

            <div className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-black text-gray-950">
              Score: {gameState.score}/
              {totalQuestions}
            </div>
          </div>

          <div className="mb-6 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-yellow-400"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

          <div className="mb-4">
            <p className="mb-2 inline-flex rounded-full bg-yellow-50 px-3 py-1 text-sm font-semibold text-gray-700">
              {currentQuestion.category}
            </p>

            <h1 className="text-2xl font-black leading-snug text-gray-950">
              {currentQuestion.gameQuestion}
            </h1>
          </div>

          <div className="space-y-3">
            {currentQuestion.answerOptions.map(
              (answer) => {
                const isSelected =
                  gameState.selectedAnswer ===
                  answer.label;

                const showCorrect =
                  gameState.hasAnswered &&
                  answer.label ===
                    currentQuestion.correctAnswer;

                const showWrongSelected =
                  gameState.hasAnswered &&
                  isSelected &&
                  !answer.isCorrect;

                let buttonClass =
                  "w-full rounded-xl border px-5 py-4 text-left text-lg font-black transition ";

                if (showCorrect) {
                  buttonClass +=
                    "border-green-500 bg-green-50 text-green-900";
                } else if (showWrongSelected) {
                  buttonClass +=
                    "border-red-500 bg-red-50 text-red-900";
                } else if (isSelected) {
                  buttonClass +=
                    "border-yellow-400 bg-yellow-50 text-gray-950";
                } else {
                  buttonClass +=
                    "border-gray-200 bg-white text-gray-900 hover:border-yellow-400 hover:bg-yellow-50";
                }

                return (
                  <button
                    key={answer.label}
                    type="button"
                    onClick={() =>
                      handleAnswerSelect(answer)
                    }
                    disabled={
                      gameState.hasAnswered
                    }
                    className={buttonClass}
                  >
                    <span>{answer.label}</span>

                    {showCorrect && (
                      <span className="ml-2 text-sm font-semibold">
                        Correct Answer
                      </span>
                    )}

                    {showWrongSelected && (
                      <span className="ml-2 text-sm font-semibold">
                        Your Answer
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {gameState.hasAnswered && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="mb-2 text-xl font-black text-gray-950">
                {gameState.answersLog[
                  gameState.answersLog.length - 1
                ]?.isCorrect
                  ? "Correct!"
                  : "Not quite."}
              </h2>

              <p className="mb-4 text-gray-700">
                {currentQuestion.feedback}
              </p>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full rounded-xl bg-yellow-400 px-5 py-4 font-black text-gray-950 hover:bg-yellow-300"
              >
                {questionNumber === totalQuestions
                  ? "See Results"
                  : "Next Question"}
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-between">
            <Link
              to="/math-language/dictionary"
              className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-black text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            >
              View Dictionary
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  startRound(gameState.selectedLevelId)
                }
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 hover:text-gray-950"
              >
                Restart Round
              </button>

              <button
                type="button"
                onClick={returnToLevelSelection}
                className="rounded-xl border border-blue-600 px-4 py-3 text-sm font-black text-blue-600 hover:bg-blue-50"
              >
                Change Level
              </button>
            </div>
          </div>
        </section>
      </main>

      <ScrollToTopButton />
      <MathLanguageFooter />
    </div>
  );
}


