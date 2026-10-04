import { useState } from "react";

import {
  startChallenge,
  submitResponse,
} from "../numberverse/api/numberverseClient";

import {
  NUMBERVERSE_INDEPENDENCE_STATES,
  NUMBERVERSE_TEMPLATES,
} from "../numberverse/contracts/numberverseContract";

export default function NumberverseDev() {
  const [challenge, setChallenge] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleStart() {
    setError("");
    setResult(null);

    try {
      const data = await startChallenge({
        templateCode:
          NUMBERVERSE_TEMPLATES.FACTOR_COMPLETE_PAIR,
        learningNodeId: "LN-00133",
        levelId: "STD5",
        target: 36,
      });

      setChallenge(data);
    } catch (startError) {
      setError(startError.message);
    }
  }

  async function handleCorrectSubmit() {
    if (!challenge) {
      return;
    }

    setError("");

    try {
      const data = await submitResponse({
        challengeEpisodeId:
          challenge.challengeEpisodeId,
        independenceState:
          NUMBERVERSE_INDEPENDENCE_STATES.INDEPENDENT,
        response: {
          factorSet: [
            1, 2, 3, 4, 6, 9, 12, 18, 36,
          ],
          factorPairs: [
            [1, 36],
            [2, 18],
            [3, 12],
            [4, 9],
            [6, 6],
          ],
          completionClaim: true,
        },
      });

      setResult(data);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleIncorrectSubmit() {
    if (!challenge) {
      return;
    }

    setError("");

    try {
      const data = await submitResponse({
        challengeEpisodeId:
          challenge.challengeEpisodeId,
        independenceState:
          NUMBERVERSE_INDEPENDENCE_STATES.INDEPENDENT,
        response: {
          factorSet: [1, 2, 3, 6, 12, 36],
          factorPairs: [
            [1, 36],
            [2, 18],
          ],
          completionClaim: true,
        },
      });

      setResult(data);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1>Numberverse Runtime Dev</h1>

      <p>
        Development contract test for the Numberverse
        frontend.
      </p>

      <button type="button" onClick={handleStart}>
        Start Factor Bench Challenge
      </button>

      {challenge && (
        <>
          <h2>START response</h2>

          <pre>
            {JSON.stringify(challenge, null, 2)}
          </pre>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={handleCorrectSubmit}
            >
              Submit Correct Response
            </button>

            <button
              type="button"
              onClick={handleIncorrectSubmit}
            >
              Submit Incorrect Response
            </button>
          </div>
        </>
      )}

      {result && (
        <>
          <h2>SUBMIT response</h2>

          <pre>
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}

      {error && (
        <p style={{ marginTop: "20px" }}>
          Error: {error}
        </p>
      )}
    </main>
  );
}


