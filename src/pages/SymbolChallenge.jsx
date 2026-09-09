import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import SymbolBankShell from "../components/symbolBank/SymbolBankShell";

import SymbolChallengeSetup from "../components/symbolChallenge/SymbolChallengeSetup";

import SymbolChallengeQuestion from "../components/symbolChallenge/SymbolChallengeQuestion";

import SymbolChallengeResults from "../components/symbolChallenge/SymbolChallengeResults";

import {
  getActiveSymbolBankRecords,
} from "../lib/symbolBank";

import {
  getPlayableProfileMembership,
} from "../lib/membership";

import {
  isPaidMembership,
} from "../lib/membershipAccess";

import {
  generateSymbolChallengeRound,
} from "../lib/symbolChallenge";

import {
  EXPERIENCE_MODES,
} from "../lib/symbolChallenge/constants";

function newRoundSeed() {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto
      .randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

export default function SymbolChallenge() {
  const [
    release,
    setRelease,
  ] = useState(null);

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    bankLoading,
    setBankLoading,
  ] = useState(true);

  const [
    membershipResolved,
    setMembershipResolved,
  ] = useState(false);

  const [
    memberAccess,
    setMemberAccess,
  ] = useState(false);

  const [
    experienceMode,
    setExperienceMode,
  ] = useState(
    EXPERIENCE_MODES.CHALLENGE
  );

  const [
    level,
    setLevel,
  ] = useState("all");

  const [
    difficulty,
    setDifficulty,
  ] = useState("D1");

  const [
    round,
    setRound,
  ] = useState(null);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    responses,
    setResponses,
  ] = useState([]);

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState(null);

  const [
    firstSelectedOptionId,
    setFirstSelectedOptionId,
  ] = useState(null);

  const [
    feedbackStage,
    setFeedbackStage,
  ] = useState("OPEN");

  const [
    firstResponseCorrect,
    setFirstResponseCorrect,
  ] = useState(null);

  const [
    finalResponseCorrect,
    setFinalResponseCorrect,
  ] = useState(null);

  const [
    screen,
    setScreen,
  ] = useState("SETUP");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let live = true;

    setBankLoading(true);
    setError("");

    /*
     * Symbol Bank data is required.
     * Membership is not.
     *
     * This preserves public Focus access
     * even if there is no session/profile.
     */
    getActiveSymbolBankRecords()
      .then((bank) => {
        if (!live) return;

        setRelease(
          bank.release
        );

        setRecords(
          bank.records || []
        );

        setBankLoading(false);
      })
      .catch((err) => {
        if (!live) return;

        setError(
          err?.message ||
            "Could not load the Mathematics Symbol Bank."
        );

        setBankLoading(false);
      });

    getPlayableProfileMembership()
      .then((access) => {
        if (!live) return;

        setMemberAccess(
          isPaidMembership(
            access.membership
          )
        );

        setMembershipResolved(
          true
        );
      })
      .catch((err) => {
        /*
         * Membership lookup must never
         * block public play.
         */
        console.warn(
          "Symbol Challenge membership could not be resolved:",
          err
        );

        if (!live) return;

        setMemberAccess(false);

        setMembershipResolved(
          true
        );
      });

    return () => {
      live = false;
    };
  }, []);

  const recordMap =
    useMemo(
      () =>
        new Map(
          records.map(
            (record) => [
              String(
                record.symbol_id
              ),
              record,
            ]
          )
        ),
      [records]
    );

  const resetEncounterState =
    useCallback(() => {
      setSelectedOptionId(
        null
      );

      setFirstSelectedOptionId(
        null
      );

      setFeedbackStage(
        "OPEN"
      );

      setFirstResponseCorrect(
        null
      );

      setFinalResponseCorrect(
        null
      );
    }, []);

  const generateRound =
    useCallback(() => {
      if (
        !release ||
        !records.length
      ) {
        setError(
          "The active Symbol Bank is not ready yet."
        );

        return false;
      }

      setError("");

      try {
        const generated =
          generateSymbolChallengeRound({
            release,
            records,
            config: {
              experienceMode,
              level,
              difficulty,
              memberAccess,
              seed:
                newRoundSeed(),
            },
          });

        setRound(
          generated
        );

        setCurrentIndex(0);

        setResponses([]);

        resetEncounterState();

        setScreen("PLAY");

        return true;
      } catch (err) {
        setError(
          err?.message ||
            "Could not prepare this Symbol Challenge round."
        );

        return false;
      }
    }, [
      release,
      records,
      experienceMode,
      level,
      difficulty,
      memberAccess,
      resetEncounterState,
    ]);

  function handleStart() {
    generateRound();
  }

  function recordResolvedResponse({
    encounter,
    selectedIds,
    firstCorrect,
    finalCorrect,
    attemptCount,
    supportUsed,
  }) {
    setResponses(
      (current) => [
        ...current,
        {
          encounterId:
            encounter
              .encounterId,
          symbolId:
            encounter
              .symbolId,
          questionBehaviour:
            encounter
              .questionBehaviour,
          firstResponseCorrect:
            firstCorrect,
          finalResponseCorrect:
            finalCorrect,
          attemptCount,
          supportUsed,
          selectedOptionIds:
            selectedIds,
        },
      ]
    );
  }

  function handleAnswer(
    optionId
  ) {
    if (
      !round ||
      feedbackStage ===
        "RESOLVED"
    ) {
      return;
    }

    const encounter =
      round.encounters[
        currentIndex
      ];

    const correct =
      optionId ===
      encounter.correctOptionId;

    const isFocus =
      round.config
        .experienceMode ===
      EXPERIENCE_MODES.FOCUS;

    /*
     * First response
     */
    if (
      feedbackStage ===
      "OPEN"
    ) {
      setSelectedOptionId(
        optionId
      );

      setFirstSelectedOptionId(
        optionId
      );

      setFirstResponseCorrect(
        correct
      );

      if (
        isFocus &&
        !correct
      ) {
        setFeedbackStage(
          "RETRY"
        );

        return;
      }

      setFinalResponseCorrect(
        correct
      );

      setFeedbackStage(
        "RESOLVED"
      );

      recordResolvedResponse({
        encounter,
        selectedIds: [
          optionId,
        ],
        firstCorrect:
          correct,
        finalCorrect:
          correct,
        attemptCount: 1,
        supportUsed: false,
      });

      return;
    }

    /*
     * Focus supported retry
     */
    if (
      feedbackStage ===
      "RETRY"
    ) {
      setSelectedOptionId(
        optionId
      );

      setFinalResponseCorrect(
        correct
      );

      setFeedbackStage(
        "RESOLVED"
      );

      recordResolvedResponse({
        encounter,
        selectedIds: [
          firstSelectedOptionId,
          optionId,
        ],
        firstCorrect: false,
        finalCorrect:
          correct,
        attemptCount: 2,
        supportUsed: true,
      });
    }
  }

  function handleNext() {
    if (!round) return;

    const nextIndex =
      currentIndex + 1;

    if (
      nextIndex >=
      round.encounters.length
    ) {
      setScreen(
        "RESULTS"
      );

      return;
    }

    setCurrentIndex(
      nextIndex
    );

    resetEncounterState();
  }

  function handlePlayAgain() {
    generateRound();
  }

  function handleChangeSettings() {
    setRound(null);

    setResponses([]);

    setCurrentIndex(0);

    resetEncounterState();

    setError("");

    setScreen(
      "SETUP"
    );
  }

  const currentEncounter =
    round?.encounters?.[
      currentIndex
    ] || null;

  return (
    <SymbolBankShell>
      {screen ===
      "SETUP" ? (
        <SymbolChallengeSetup
          experienceMode={
            experienceMode
          }
          level={level}
          difficulty={
            difficulty
          }
          memberAccess={
            memberAccess
          }
          membershipResolved={
            membershipResolved
          }
          loading={
            bankLoading
          }
          error={error}
          onExperienceModeChange={
            setExperienceMode
          }
          onLevelChange={
            setLevel
          }
          onDifficultyChange={
            setDifficulty
          }
          onStart={
            handleStart
          }
        />
      ) : null}

      {screen === "PLAY" &&
      round &&
      currentEncounter ? (
        <SymbolChallengeQuestion
          encounter={
            currentEncounter
          }
          recordMap={
            recordMap
          }
          currentIndex={
            currentIndex
          }
          total={
            round.encounters
              .length
          }
          experienceMode={
            round.config
              .experienceMode
          }
          selectedOptionId={
            selectedOptionId
          }
          firstSelectedOptionId={
            firstSelectedOptionId
          }
          feedbackStage={
            feedbackStage
          }
          firstResponseCorrect={
            firstResponseCorrect
          }
          finalResponseCorrect={
            finalResponseCorrect
          }
          onAnswer={
            handleAnswer
          }
          onNext={
            handleNext
          }
        />
      ) : null}

      {screen ===
        "RESULTS" &&
      round ? (
        <SymbolChallengeResults
          experienceMode={
            round.config
              .experienceMode
          }
          responses={
            responses
          }
          total={
            round.encounters
              .length
          }
          onPlayAgain={
            handlePlayAgain
          }
          onChangeSettings={
            handleChangeSettings
          }
        />
      ) : null}
    </SymbolBankShell>
  );
}
