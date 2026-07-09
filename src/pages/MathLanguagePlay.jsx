import { useState } from "react";
import { mathLanguageTerms } from "../data/mathLanguageTerms";
import { getPlayableQuestions } from "../utils/mathLanguage/getPlayableQuestions";
import { getBadgeResult } from "../utils/mathLanguage/getBadgeResult";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import MathLanguageNav from "../components/mathLanguage/MathLanguageNav";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

export default function MathLanguagePlay() {
  const [gameState, setGameState] = useState({
    status: "intro",
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    hasAnswered: false,
    score: 0,
    answersLog: [],
    missedQuestions: [],
  });

  const startRound = () => {
    const questions = getPlayableQuestions(mathLanguageTerms, 10);

    if (!questions.length) {
      setGameState((prev) => ({
        ...prev,
        status: "error",
      }));
      return;
    }

    setGameState({
      status: "active",
      questions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      hasAnswered: false,
      score: 0,
      answersLog: [],
      missedQuestions: [],
    });
  };

  const handleAnswerSelect = (answer) => {
    if (gameState.hasAnswered) return;

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
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

    setGameState((prev) => ({
      ...prev,
      selectedAnswer: answer.label,
      hasAnswered: true,
      status: "feedback",
      score: isCorrect ? prev.score + 1 : prev.score,
      answersLog: [...prev.answersLog, answerLog],
      missedQuestions: isCorrect
        ? prev.missedQuestions
        : [...prev.missedQuestions, currentQuestion],
    }));
  };

  const handleNextQuestion = () => {
    const isLastQuestion =
      gameState.currentQuestionIndex === gameState.questions.length - 1;

    if (isLastQuestion) {
      setGameState((prev) => ({
        ...prev,
        status: "complete",
      }));
      return;
    }

    setGameState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      selectedAnswer: null,
      hasAnswered: false,
      status: "active",
    }));
  };

  const UtilityNav = () => {
    return (
      <nav className="mx-auto mb-4 flex max-w-2xl items-center justify-between gap-3">
        <a
          href="/math-language"
          className="text-sm font-bold text-gray-600 hover:text-gray-900"
        >
          ← Math Language Home
        </a>

        <a
          href="/math-language/dictionary"
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          View Dictionary
        </a>
      </nav>
    );
  };

  if (gameState.status === "intro") {
    return (
      <>
      <main className="min-h-screen bg-white px-4 py-8">
        <MathLanguageNav />

        <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <MathLanguageBrand />

          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Welcome to the Math Language Challenge.
          </h1>

          <p className="mb-4 text-gray-700">
            In this round, you will answer 10 questions about SEA math words and
            phrases.
          </p>

          <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-gray-800">
            <p>
              Some words tell you to add. Some tell you to subtract. Some tell
              you to compare, measure, estimate, or explain.
            </p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Round Type</p>
              <p className="font-bold text-gray-900">Free Top 50</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Questions</p>
              <p className="font-bold text-gray-900">10</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Feedback</p>
              <p className="font-bold text-gray-900">On</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startRound}
            className="w-full rounded-xl bg-yellow-400 px-5 py-4 text-lg font-bold text-gray-950 hover:bg-yellow-300"
          >
            Start Round
          </button>
        </section>
      </main>

     <MathLanguageFooter />
    </>
    );
  }

  if (gameState.status === "error") {
    return (
      <main className="min-h-screen bg-white px-4 py-8">
        <MathLanguageNav />

        <section className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-6 text-left">
            <MathLanguageBrand />
          </div>

          <h1 className="mb-3 text-2xl font-bold text-gray-900">
            No questions found.
          </h1>

          <p className="mb-6 text-gray-700">
            Please check that the Math Language data has Free questions
            available.
          </p>

          <button
            type="button"
            onClick={startRound}
            className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-950 hover:bg-yellow-300"
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (gameState.status === "complete") {
    const totalQuestions = gameState.questions.length;
    const badgeResult = getBadgeResult(gameState.score, totalQuestions);

    return (
      <main className="min-h-screen bg-white px-4 py-8">
        <MathLanguageNav />

        <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-6 text-left">
            <MathLanguageBrand />
          </div>

          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Great work!
          </h1>

          <div className="mb-6 rounded-2xl bg-yellow-50 p-6">
            <p className="text-sm font-semibold text-gray-600">Your Score</p>
            <p className="text-5xl font-black text-gray-950">
              {gameState.score} / {totalQuestions}
            </p>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-gray-600">
              Badge Earned
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {badgeResult.badge}
            </p>

            <p className="mt-2 text-gray-700">{badgeResult.message}</p>
          </div>

          {gameState.missedQuestions.length > 0 ? (
            <div className="mb-6 text-left">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                Words to Review
              </h2>

              <div className="space-y-3">
                {gameState.missedQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <p className="font-bold text-gray-900">{question.term}</p>

                    <p className="text-gray-700">
                      {question.simpleMeaning || question.feedback}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      Correct answer: {question.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mb-6 rounded-xl bg-green-50 p-4 font-semibold text-green-800">
              No words to review this time. Excellent work.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startRound}
              className="rounded-xl bg-yellow-400 px-5 py-4 font-bold text-gray-950 hover:bg-yellow-300"
            >
              Practise Again
            </button>

            <a
              href="/math-language/dictionary"
              className="rounded-xl border border-gray-300 px-5 py-4 font-bold text-gray-900 hover:bg-gray-50"
            >
              View Dictionary
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-left">
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Unlock the Full 200-Word SEA Math Language Game
            </h2>

            <p className="text-gray-700">
              The full version will unlock trap word challenges, SEA question
              decoder practice, category mastery, and boss levels.
            </p>

            <button
              type="button"
              disabled
              className="mt-4 rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-600"
            >
              Unlock Full Version — Coming Soon
            </button>
          </div>
        </section>
      </main>
    );
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const questionNumber = gameState.currentQuestionIndex + 1;
  const totalQuestions = gameState.questions.length;
  const progressPercentage = (questionNumber / totalQuestions) * 100;

  return (
    <>
    <main className="min-h-screen bg-white px-4 py-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <MathLanguageBrand />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-600">
              Math Language Challenge
            </p>

            <p className="text-sm text-gray-600">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>

          <div className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-bold text-gray-900">
            Score: {gameState.score}/{totalQuestions}
          </div>
        </div>

        <div className="mb-6 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-yellow-400"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="mb-4">
          <p className="mb-2 inline-flex rounded-full bg-yellow-50 px-3 py-1 text-sm font-semibold text-gray-700">
            {currentQuestion.category}
          </p>

          <h1 className="text-2xl font-bold leading-snug text-gray-900">
            {currentQuestion.gameQuestion}
          </h1>
        </div>

        <div className="space-y-3">
          {currentQuestion.answerOptions.map((answer) => {
            const isSelected = gameState.selectedAnswer === answer.label;
            const showCorrect =
              gameState.hasAnswered &&
              answer.label === currentQuestion.correctAnswer;
            const showWrongSelected =
              gameState.hasAnswered && isSelected && !answer.isCorrect;

            let buttonClass =
              "w-full rounded-xl border px-5 py-4 text-left text-lg font-bold transition ";

            if (showCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-900";
            } else if (showWrongSelected) {
              buttonClass += "border-red-500 bg-red-50 text-red-900";
            } else if (isSelected) {
              buttonClass += "border-yellow-400 bg-yellow-50 text-gray-950";
            } else {
              buttonClass +=
                "border-gray-200 bg-white text-gray-900 hover:border-yellow-400 hover:bg-yellow-50";
            }

            return (
              <button
                key={answer.label}
                type="button"
                onClick={() => handleAnswerSelect(answer)}
                disabled={gameState.hasAnswered}
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
          })}
        </div>

        {gameState.hasAnswered && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {gameState.answersLog[gameState.answersLog.length - 1]?.isCorrect
                ? "Correct!"
                : "Not quite."}
            </h2>

            <p className="mb-4 text-gray-700">{currentQuestion.feedback}</p>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-gray-950 hover:bg-yellow-300"
            >
              {questionNumber === totalQuestions
                ? "See Results"
                : "Next Question"}
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-between">
          <a
            href="/math-language/dictionary"
            className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            View Dictionary
          </a>

          <button
            type="button"
            onClick={startRound}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            Restart Round
          </button>
        </div>
      </section>
    </main>

   <ScrollToTopButton />
   <MathLanguageFooter />
    </>
  );
}

