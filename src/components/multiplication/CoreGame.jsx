import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import GameHeader from "../layout/GameHeader.jsx";
import {
  ENABLE_TOP_PLAYERS,
  GRID_PRESETS,
  WEBHOOKS,
  formatTime,
  generateGrid,
  getCategoryOptions,
  getClassOptions,
  getSheetUrls,
  isSmallGrid,
  timeToMilliseconds,
} from "./gameConfig";
import {
  getPlayableProfile,
  saveMultiplicationResult,
} from "../../lib/gameResults";

import {
  getLeaderboardCategory,
  getLearningCategoryLabel,
} from "../../lib/learningCategory";

function createAntiCheat(gridId) {
  const perfNow = () =>
    typeof performance !== "undefined"
      ? performance.now()
      : Date.now();

  const startedAt = Date.now();
  let last = perfNow();

  const deltas = [];

  let trusted = 0;
  let untrusted = 0;
  let moves = 0;
  let paste = false;
  let vkPresses = 0;

  const bump = (isTrusted) => {
    const now = perfNow();

    deltas.push(Math.max(0, now - last));
    last = now;
    moves += 1;

    if (isTrusted) {
      trusted += 1;
    } else {
      untrusted += 1;
    }
  };

  const onKeyDown = (event) => {
    const key = event.key || "";

    if (
      /^\d$/.test(key) ||
      key === "Backspace" ||
      key === "Delete" ||
      key === "Enter" ||
      key === "Tab"
    ) {
      bump(Boolean(event.isTrusted));
    }
  };

  const onInput = (nativeEvent) => {
    const isTrusted =
      nativeEvent &&
      typeof nativeEvent.isTrusted === "boolean"
        ? nativeEvent.isTrusted
        : false;

    bump(isTrusted);
  };

  const onPaste = (event) => {
    paste = true;
    event.preventDefault();
  };

  const finish = () => {
    const durationMs = Date.now() - startedAt;
    const count = deltas.length || 1;

    const average =
      deltas.reduce((sum, value) => sum + value, 0) / count;

    const standardDeviation = Math.sqrt(
      deltas.reduce(
        (sum, value) =>
          sum + Math.pow(value - average, 2),
        0
      ) / count
    );

    return {
      gridId,
      durationMs: String(Math.round(durationMs)),
      moves: String(moves),
      trusted: String(trusted),
      untrusted: String(untrusted),
      avgDeltaMs: String(Math.round(average || 0)),
      stdDeltaMs: String(
        Math.round(standardDeviation || 0)
      ),
      paste: paste ? "1" : "0",
      vkPresses: String(vkPresses),
    };
  };

  return {
    onKeyDown,
    onInput,
    onPaste,
    finish,
  };
}

function parseCsv(text) {
  try {
    if (!text || typeof text !== "string") {
      return [];
    }

    let [headers, ...rows] = text
      .trim()
      .split(/\r?\n/)
      .map((row) => row.split(","));

    if (!headers || headers.length === 0) {
      return [];
    }

    headers = headers.map((header) =>
      String(header || "")
        .trim()
        .replace(/['"]+/g, "")
    );

    return rows.map((row) =>
      Object.fromEntries(
        row.map((value, index) => [
          headers[index],
          String(value || "")
            .trim()
            .replace(/['"]+/g, ""),
        ])
      )
    );
  } catch {
    return [];
  }
}

function getProfileName(profile) {
  if (profile.public_display_name) {
    return profile.public_display_name;
  }

  const firstName = profile.first_name || "";
  const lastInitial =
    profile.last_name?.charAt(0)?.toUpperCase() || "";

  return `${firstName} ${lastInitial}.`.trim();
}

export default function CoreGame({
  initialPreset = "12x12",
  lockPreset = false,
}) {
  useEffect(() => {
    document.title =
      "CountMeInTT | Building Math Confidence Through Competition";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "CountMeInTT helps students build multiplication fluency, speed, and confidence through fun, competitive math challenges, leaderboards, and community events across Trinidad and Tobago.";
  }, []);

  const [gridPresetId, setGridPresetId] =
    useState(initialPreset);

  const preset =
    GRID_PRESETS.find(
      (item) => item.id === gridPresetId
    ) || GRID_PRESETS[2];

  const rows = preset.rows;
  const cols = preset.cols;

  const [grid, setGrid] = useState(() =>
    generateGrid(rows, cols)
  );

  const [startTime, setStartTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [profileSaveStatus, setProfileSaveStatus] =
    useState("idle");

  const [profileSaveMessage, setProfileSaveMessage] =
    useState("");

  const [loggedInPlayer, setLoggedInPlayer] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    school: "",
    email: "",
    category: "Primary",
    classLevel: "",
  });

  const [topPlayers, setTopPlayers] = useState({
    Primary: null,
    Secondary: null,
    NoSchool: null,
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showCustomSchool, setShowCustomSchool] =
    useState(false);

  const [
    primarySchoolOptions,
    setPrimarySchoolOptions,
  ] = useState([
    "Select a School...",
    "School not listed",
  ]);

  const [
    secondarySchoolOptions,
    setSecondarySchoolOptions,
  ] = useState([
    "Select a School...",
    "School not listed",
  ]);

  const [celebratedMap, setCelebratedMap] =
    useState({});

  const [focusedCell, setFocusedCell] =
    useState(null);

  const [rowSwept, setRowSwept] = useState(
    Array(rows).fill(false)
  );

  const [colSwept, setColSwept] = useState(
    Array(cols).fill(false)
  );

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const inputRefs = useRef([]);
  const antiRef = useRef(null);

  if (
    inputRefs.current.length !== rows ||
    inputRefs.current.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== cols
    )
  ) {
    inputRefs.current = Array.from(
      { length: rows },
      () => Array(cols).fill(null)
    );
  }

  useEffect(() => {
    antiRef.current = createAntiCheat(gridPresetId);
  }, [gridPresetId]);

  useEffect(() => {
    let isMounted = true;

    const loadSchoolList = async (filePath) => {
      const response = await fetch(filePath, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const base = Array.isArray(data?.schools)
        ? data.schools
        : [];

      const cleaned = [
        ...new Set(
          base
            .map((school) =>
              String(school || "").trim()
            )
            .filter(Boolean)
        ),
      ];

      return cleaned.sort((a, b) =>
        a.localeCompare(b, "en", {
          sensitivity: "base",
        })
      );
    };

    const loadSchools = async () => {
      try {
        const [primarySchools, secondarySchools] =
          await Promise.all([
            loadSchoolList(
              "/primary-schools.json"
            ),
            loadSchoolList(
              "/secondary-schools.json"
            ),
          ]);

        if (!isMounted) return;

        setPrimarySchoolOptions([
          "Select a School...",
          ...primarySchools,
          "School not listed",
        ]);

        setSecondarySchoolOptions([
          "Select a School...",
          ...secondarySchools,
          "School not listed",
        ]);
      } catch (error) {
        console.error(
          "Unable to load school lists:",
          error
        );

        if (!isMounted) return;

        setPrimarySchoolOptions([
          "Select a School...",
          "School not listed",
        ]);

        setSecondarySchoolOptions([
          "Select a School...",
          "School not listed",
        ]);
      }
    };

    loadSchools();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLoggedInPlayer() {
      try {
        const playable =
          await getPlayableProfile();

        if (!active) return;

        if (!playable) {
          setLoggedInPlayer(null);
          return;
        }

        const { user, profile, link } = playable;

        const isParentProfile =
          profile.profile_type === "account_holder" ||
          link.relationship_role === "self";

     const category = isParentProfile
  ? "NoSchool"
  : getLeaderboardCategory(profile);

if (!category) {
  throw new Error(
    `Unsupported learning category: ${
      profile?.school_type || "missing"
    }`
  );
}

        const playerData = {
          userId: user.id,
          profileId: profile.id,
          email: user.email || "",
          name: getProfileName(profile),
          category,
          school: isParentProfile
            ? "N/A"
            : profile.current_school || "",
          classLevel: isParentProfile
            ? "N/A"
            : profile.current_level || "",
          accountType: isParentProfile
            ? "Parent"
            : "Student",
        };

        setLoggedInPlayer(playerData);
    
        setFormData((current) => ({
          ...current,
          name: playerData.name,
          email: playerData.email,
          category: playerData.category,
          school: playerData.school,
          classLevel: playerData.classLevel,
        }));

        setShowCustomSchool(false);
      } catch (error) {
        console.error(
          "Unable to load playable profile:",
          error
        );

        if (active) {
          setLoggedInPlayer(null);
        }
      }
    }

    loadLoggedInPlayer();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setGrid(generateGrid(rows, cols));
    setFocusedCell(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setStartTime(null);
    setCompleted(false);
    setElapsed(0);
    setShowForm(false);

    setProfileSaveStatus("idle");
    setProfileSaveMessage("");

    timerStartedRef.current = false;
    antiRef.current = createAntiCheat(gridPresetId);

    setCelebratedMap({});
    setRowSwept(Array(rows).fill(false));
    setColSwept(Array(cols).fill(false));
  }, [rows, cols, gridPresetId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_TOP_PLAYERS) return;

    const urls = getSheetUrls(gridPresetId);

    const loadTopPlayers = async () => {
      try {
        if (isSmallGrid(gridPresetId)) {
          if (!urls.SmallTop) {
            setTopPlayers({
              Primary: null,
              Secondary: null,
              NoSchool: null,
            });
            return;
          }

          const response = await fetch(
            urls.SmallTop
          );

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const parsed = parseCsv(
            await response.text()
          );

          const best = parsed
            .map((row) => ({
              Name: row.Name || row.name || "",
              Time: row.Time || row.time || "",
              milliseconds: timeToMilliseconds(
                row.Time || row.time
              ),
            }))
            .filter(
              (entry) =>
                entry.Name &&
                Number.isFinite(
                  entry.milliseconds
                )
            )
            .sort(
              (first, second) =>
                first.milliseconds -
                second.milliseconds
            )[0];

          setTopPlayers({
            Primary: best
              ? {
                  Name: best.Name,
                  Time: best.Time,
                }
              : null,
            Secondary: null,
            NoSchool: null,
          });

          return;
        }

        const pairs = await Promise.all(
          ["Primary", "Secondary", "NoSchool"].map(
            async (category) => {
              try {
                const url = urls[category];

                if (!url) {
                  return [category, null];
                }

                const response = await fetch(url);

                if (!response.ok) {
                  throw new Error(
                    `HTTP ${response.status}`
                  );
                }

                const parsed = parseCsv(
                  await response.text()
                );

                const best = parsed
                  .map((row) => ({
                    Name: row.Name || row.name || "",
                    Time: row.Time || row.time || "",
                    milliseconds:
                      timeToMilliseconds(
                        row.Time || row.time
                      ),
                  }))
                  .filter(
                    (entry) =>
                      entry.Name &&
                      Number.isFinite(
                        entry.milliseconds
                      )
                  )
                  .sort(
                    (first, second) =>
                      first.milliseconds -
                      second.milliseconds
                  )[0];

                return [
                  category,
                  best
                    ? {
                        Name: best.Name,
                        Time: best.Time,
                      }
                    : null,
                ];
              } catch (error) {
                console.warn(
                  `Unable to load ${category} top player:`,
                  error
                );

                return [category, null];
              }
            }
          )
        );

        setTopPlayers(Object.fromEntries(pairs));
      } catch (error) {
        console.error(
          "Unable to load top players:",
          error
        );

        setTopPlayers({
          Primary: null,
          Secondary: null,
          NoSchool: null,
        });
      }
    };

    loadTopPlayers();
  }, [gridPresetId]);

  const schoolOptionsForCategory =
    formData.category === "Secondary"
      ? secondarySchoolOptions
      : primarySchoolOptions;

  const displayTime = formatTime(elapsed);

  const resetCurrentRun = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setGrid(generateGrid(rows, cols));
    setStartTime(null);
    setCompleted(false);
    setElapsed(0);
    setShowForm(false);
    setFocusedCell(null);

    setProfileSaveStatus("idle");
    setProfileSaveMessage("");

    timerStartedRef.current = false;
    antiRef.current =
      createAntiCheat(gridPresetId);

    setCelebratedMap({});
    setRowSwept(Array(rows).fill(false));
    setColSwept(Array(cols).fill(false));
  };

  const isSuspiciousRun = (antiCheatData) => {
    const minimumCells = rows * cols;

    return (
      Number(
        antiCheatData?.untrusted || 0
      ) > 0 ||
      Number(antiCheatData?.moves || 0) <
        Math.max(
          5,
          Math.floor(minimumCells * 0.4)
        ) ||
      Number(
        antiCheatData?.durationMs || 0
      ) <
        Math.max(rows * cols * 8, 2500)
    );
  };

  const checkCompletion = async (newGrid) => {
    const allCorrect = newGrid.every((row) =>
      row.every(
        (cell) => cell.correct === true
      )
    );

    if (!allCorrect || completed) return;

    const antiCheatData =
      antiRef.current?.finish?.();

    if (isSuspiciousRun(antiCheatData)) {
      alert(
        "This run looks irregular and cannot be submitted. Please play again normally (no scripts or paste)."
      );

      resetCurrentRun();
      return;
    }

    const stopTime = Date.now();

    const finalDurationMs = startTime
      ? stopTime - startTime
      : Number(
          antiCheatData?.durationMs || 0
        );

    setCompleted(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setElapsed(finalDurationMs);

    setProfileSaveStatus("saving");
    setProfileSaveMessage(
      "Saving result to your learning profile…"
    );

    try {
      const saveOutcome =
        await saveMultiplicationResult({
          gameMode: gridPresetId,
          durationMs: finalDurationMs,
          correctAnswers: rows * cols,
          incorrectAnswers: 0,
          antiCheatData: {
            moves: Number(
              antiCheatData?.moves || 0
            ),
            trusted: Number(
              antiCheatData?.trusted || 0
            ),
            untrusted: Number(
              antiCheatData?.untrusted || 0
            ),
            avgDeltaMs: Number(
              antiCheatData?.avgDeltaMs || 0
            ),
            stdDeltaMs: Number(
              antiCheatData?.stdDeltaMs || 0
            ),
            paste:
              String(
                antiCheatData?.paste || "0"
              ) === "1",
            vkPresses: Number(
              antiCheatData?.vkPresses || 0
            ),
          },
          verificationStatus: "verified",
          publicEligible: true,
          submissionType: "practice",
        });

      if (saveOutcome.guest) {
        setProfileSaveStatus("guest");
        setProfileSaveMessage(
          "You played as a guest. This result was not saved to a learning profile."
        );
      } else if (
        saveOutcome.isPersonalBest
      ) {
        setProfileSaveStatus(
          "personal-best"
        );
        setProfileSaveMessage(
          `New personal best saved for ${
            saveOutcome.profile
              .public_display_name ||
            saveOutcome.profile.first_name ||
            "your profile"
          }!`
        );
      } else {
        setProfileSaveStatus("saved");
        setProfileSaveMessage(
          `Result saved to ${
            saveOutcome.profile
              .public_display_name ||
            saveOutcome.profile.first_name ||
            "your learning profile"
          }.`
        );
      }
   } catch (error) {
  const errorMessage = String(
    error?.message || ""
  ).toLowerCase();

  const isMissingSession =
    errorMessage.includes("auth session missing") ||
    errorMessage.includes("session missing") ||
    errorMessage.includes("not authenticated");

  if (isMissingSession) {
    setProfileSaveStatus("guest");
    setProfileSaveMessage(
      "You played as a guest. Submit your details below to appear on the public leaderboard."
    );
  } else {
    console.error(
      "Profile result save error:",
      error
    );

    setProfileSaveStatus("error");
    setProfileSaveMessage(
      error?.message ||
        "The game was completed, but the profile result could not be saved."
    );
  }
}

    window.setTimeout(() => {
      setShowForm(true);
    }, 500);
  };

  const handleKeyDown = (
    event,
    rowIndex,
    columnIndex
  ) => {
    antiRef.current?.onKeyDown(event);

    const lastRow = rows - 1;
    const lastColumn = cols - 1;

    if (event.repeat) return;

    if (
      event.key === "Enter" ||
      event.key === "NumpadEnter"
    ) {
      event.preventDefault();

      const nextGrid = grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

      const cell =
        nextGrid[rowIndex][columnIndex];

      const raw = String(cell.value || "")
        .replace(/\D+/g, "")
        .slice(0, 3);

      cell.value = raw;
      cell.correct =
        Number(raw) === cell.answer;

      if (cell.correct) {
        if (
          !rowSwept[rowIndex] &&
          nextGrid[rowIndex].every(
            (item) => item.correct === true
          )
        ) {
          setRowSwept((current) =>
            current.map((value, index) =>
              index === rowIndex
                ? true
                : value
            )
          );
        }

        if (
          !colSwept[columnIndex] &&
          nextGrid.every(
            (row) =>
              row[columnIndex].correct ===
              true
          )
        ) {
          setColSwept((current) =>
            current.map((value, index) =>
              index === columnIndex
                ? true
                : value
            )
          );
        }
      }

      setGrid(nextGrid);
      checkCompletion(nextGrid);

      if (cell.correct) {
        if (columnIndex < lastColumn) {
          inputRefs.current[rowIndex][
            columnIndex + 1
          ]?.focus();
        } else if (rowIndex < lastRow) {
          inputRefs.current[
            rowIndex + 1
          ][0]?.focus();
        }
      } else {
        inputRefs.current[rowIndex][
          columnIndex
        ]?.select();
      }

      return;
    }

    if (
      event.key === "ArrowRight" &&
      columnIndex < lastColumn
    ) {
      event.preventDefault();
      inputRefs.current[rowIndex][
        columnIndex + 1
      ]?.focus();
    } else if (
      event.key === "ArrowLeft" &&
      columnIndex > 0
    ) {
      event.preventDefault();
      inputRefs.current[rowIndex][
        columnIndex - 1
      ]?.focus();
    } else if (
      event.key === "ArrowDown" &&
      rowIndex < lastRow
    ) {
      event.preventDefault();
      inputRefs.current[
        rowIndex + 1
      ][columnIndex]?.focus();
    } else if (
      event.key === "ArrowUp" &&
      rowIndex > 0
    ) {
      event.preventDefault();
      inputRefs.current[
        rowIndex - 1
      ][columnIndex]?.focus();
    } else if (
      event.key === "Backspace"
    ) {
      event.preventDefault();

      const nextGrid = grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

      nextGrid[rowIndex][columnIndex].value =
        "";
      nextGrid[rowIndex][columnIndex].correct =
        null;

      setGrid(nextGrid);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    const url = WEBHOOKS[gridPresetId];

    if (!url) {
      console.error(
        "[CMI] Missing webhook URL for grid:",
        gridPresetId
      );

      alert(
        "No webhook is configured for this grid."
      );

      setIsSubmitting(false);
      return;
    }

    const antiCheatData =
      antiRef.current?.finish?.();

    if (isSuspiciousRun(antiCheatData)) {
      alert(
        "This run looks irregular and cannot be submitted. Please play again normally."
      );

      setIsSubmitting(false);
      return;
    }

    const submissionName =
      loggedInPlayer?.name ||
      formData.name.trim() ||
      "N/A";

    const submissionCategory =
      loggedInPlayer?.category ||
      formData.category ||
      "Primary";

    const submissionSchool =
      submissionCategory === "NoSchool"
        ? "N/A"
        : loggedInPlayer?.school ||
          formData.school.trim() ||
          "N/A";

     const submissionClass =
       loggedInPlayer?.classLevel ||
       formData.classLevel.trim() ||
       "N/A";

    const submissionEmail =
      loggedInPlayer?.email ||
      formData.email.trim() ||
      "N/A";

    const payload = new URLSearchParams();

    payload.append("name", submissionName);
    payload.append("email", submissionEmail);
    payload.append("school", submissionSchool);
    payload.append(
      "category",
      submissionCategory
    );
    payload.append("time", displayTime);
    payload.append(
      "classLevel",
      submissionClass
    );
    payload.append(
      "durationMs",
      String(
        elapsed ||
          antiCheatData?.durationMs ||
          ""
      )
    );
    payload.append(
      "accountType",
      loggedInPlayer?.accountType ||
        "Guest"
    );
    payload.append(
      "loggedIn",
      loggedInPlayer ? "Yes" : "No"
    );
    payload.append(
      "verificationStatus",
      "verified"
    );
    payload.append(
      "profileId",
      loggedInPlayer?.profileId || ""
    );
    payload.append(
      "accountId",
      loggedInPlayer?.userId || ""
    );
    payload.append(
      "playedAt",
      new Date().toISOString()
    );
    payload.append(
      "submissionType",
      "leaderboard"
    );
    payload.append(
      "gameVersion",
      "platform-v1"
    );
    payload.append(
      "ac_moves",
      String(antiCheatData?.moves ?? "")
    );
    payload.append(
      "ac_trusted",
      String(
        antiCheatData?.trusted ?? ""
      )
    );
    payload.append(
      "ac_untrusted",
      String(
        antiCheatData?.untrusted ?? ""
      )
    );
    payload.append(
      "ac_avgDeltaMs",
      String(
        antiCheatData?.avgDeltaMs ?? ""
      )
    );
    payload.append(
      "ac_stdDeltaMs",
      String(
        antiCheatData?.stdDeltaMs ?? ""
      )
    );
    payload.append(
      "ac_paste",
      String(antiCheatData?.paste ?? "")
    );
    payload.append(
      "ac_vkPresses",
      String(
        antiCheatData?.vkPresses ?? ""
      )
    );
    payload.append(
      "ac_durationMs",
      String(
        antiCheatData?.durationMs ?? ""
      )
    );

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      alert(
        "✅ Time submitted successfully!"
      );

      setShowForm(false);
    } catch (error) {
      console.error(
        "Leaderboard submission error:",
        error
      );

      alert(
        "There was an error submitting your time."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-black"
      style={{
        backgroundColor: "#fff058",
        backgroundImage: 'url("/my-bg.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "800px",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        color: "#000",
        overflow: "hidden",
        position: "relative",
        zIndex: 0,
      }}
    >
       <GameHeader />
<div className="px-4 py-6 sm:px-5">
      <style>{`
        .cell-wrap {
          position: relative;
        }

        .cell-wrap input {
          position: relative;
          z-index: 1;
        }

        .cell-wrap {
  position: relative;
}

.cell-wrap input {
  position: relative;
  z-index: 1;
}

.cell-wrap input::placeholder {
  color: transparent;
  opacity: 0;
}

/* Horizontal prompt on tablets and desktop */
.cell-wrap input:focus::placeholder {
  color: rgba(107, 114, 128, 0.65);
  opacity: 1;
  font-size: clamp(9px, 1.5vw, 12px);
  font-weight: 500;
}

/* Hidden on tablets and desktop */
.mobile-cell-prompt {
  display: none;
}

 /* Hide the normal vertical cursor */
  .mobile-hide-native-caret:focus {
    caret-color: transparent;
  }

/* Horizontal cursor for tablets and desktop */
.desktop-horizontal-caret {
  position: absolute;
  left: 50%;
  bottom: 5px;
  z-index: 2;
  display: block;
  width: 10px;
  height: 1.5px;
  background-color: rgba(75, 85, 99, 0.9);
  transform: translateX(-50%);
  animation: mobileCaretBlink 1s step-end infinite;
  pointer-events: none;
}

@media (max-width: 640px) {
  /* Hide the horizontal placeholder on mobile */
  .cell-wrap input:focus::placeholder {
    color: transparent;
    opacity: 0;
  }

  /* Hide the desktop cursor on mobile */
  .desktop-horizontal-caret {
    display: none;
  }

  /* Show the vertical prompt on mobile */
  .mobile-cell-prompt {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(107, 114, 128, 0.72);
    font-size: 8px;
    font-weight: 600;
    line-height: 0.8;
    pointer-events: none;
  }

  /* Custom horizontal blinking cursor */
  .mobile-horizontal-caret {
    display: block;
    width: 8px;
    height: 1.5px;
    margin-top: 2px;
    background-color: rgba(75, 85, 99, 0.9);
    animation: mobileCaretBlink 1s step-end infinite;
  }
}

@keyframes mobileCaretBlink {
  0%,
  49% {
    opacity: 1;
  }

  50%,
  100% {
    opacity: 0;
  }
}
        .row-header,
        .col-header {
          position: relative;
          overflow: hidden;
        }

        @keyframes sweepX {
          0% {
            transform: translateX(-110%);
          }

          100% {
            transform: translateX(110%);
          }
        }

        @keyframes sweepY {
          0% {
            transform: translateY(-110%);
          }

          100% {
            transform: translateY(110%);
          }
        }

        .row-header.sweep-row::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.75),
            transparent
          );
          transform: translateX(-110%);
          animation: sweepX 900ms ease-out 1;
        }

        .col-header.sweep-col::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(255, 255, 255, 0.75),
            transparent
          );
          transform: translateY(-110%);
          animation: sweepY 900ms ease-out 1;
        }

        @keyframes pop {
          0% {
            transform: scale(0.96);
          }

          70% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(1);
          }
        }

        .pop-once {
          animation: pop 160ms
            cubic-bezier(0.2, 0.8, 0.2, 1)
            1;
          will-change: transform;
        }
      `}</style>

      {showIntro ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="max-w-md space-y-4 rounded bg-white p-6 text-center text-black shadow">
            <h2 className="text-xl font-bold">
              👋 Welcome to Count Me In TT!
            </h2>

            <p>
              Fill in the times tables as fast as
              you can!
            </p>

            {!lockPreset && (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-center text-sm">
                <label className="mb-1 block text-center font-semibold">
                  Pick a Grid Size
                </label>

                <select
                  className="mx-auto w-full rounded border px-3 py-2"
                  value={gridPresetId}
                  onChange={(event) =>
                    setGridPresetId(
                      event.target.value
                    )
                  }
                >
                  {GRID_PRESETS.map(
                    (gridPreset) => (
                      <option
                        key={gridPreset.id}
                        value={gridPreset.id}
                      >
                        {gridPreset.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="mx-auto block rounded bg-blue-600 px-4 py-2 text-white"
            >
              Start Game
            </button>

            <div className="rounded border border-blue-200 bg-blue-50 p-4 text-left text-sm">
              <h3 className="mb-2 font-semibold text-blue-700">
                🔑 Keyboard Tips
              </h3>

              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong>Enter</strong> – Move
                  to next cell
                </li>
                <li>
                  <strong>← ↑ → ↓</strong> –
                  Move around the grid
                </li>
                <li>
                  <strong>Backspace</strong> –
                  Clear current cell
                </li>
                <li>
                  Timer starts with your first
                  input.
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
       <div className="space-y-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
    <button
  type="button"
  onClick={() => {
    resetCurrentRun();
    setShowIntro(true);
  }}
  className="rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-center text-sm font-black text-blue-600 shadow-sm transition hover:bg-blue-50"
>
  Pick a Grid
</button>

    <button
      type="button"
      onClick={resetCurrentRun}
      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-red-600"
    >
      Reset Game
    </button>
  </div>

          <div className="mx-auto max-w-screen-md">
            <div className="rounded-lg border border-yellow-300 bg-white p-4 shadow">
              <h2 className="mb-2 text-center text-xl font-bold text-blue-600">
                🏆 Top{" "}
                {isSmallGrid(gridPresetId)
                  ? "Player"
                  : "Players"}
              </h2>

              {isSmallGrid(gridPresetId) ? (
                <div className="grid grid-cols-1 gap-4 text-center text-sm">
                  <div className="rounded bg-blue-100 px-4 py-2 shadow">
                    <strong>
                      Top Player:
                    </strong>{" "}
                    {topPlayers.Primary?.Name ||
                      "---"}{" "}
                    –{" "}
                    <span className="font-mono">
                      {topPlayers.Primary?.Time ||
                        "--:--.--"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 text-center text-sm sm:grid-cols-3">
                  {[
                    "Primary",
                    "Secondary",
                    "NoSchool",
                  ].map((category) => (
                    <div
                      key={category}
                      className="rounded bg-blue-100 px-4 py-2 shadow"
                    >
                      <strong>
                        {getLearningCategoryLabel(category)}
                        :
                      </strong>{" "}
                      {topPlayers[category]?.Name ||
                        "---"}{" "}
                      –{" "}
                      <span className="font-mono">
                        {topPlayers[category]?.Time ||
                          "--:--.--"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm font-bold">
              Your Timer
            </p>
            <p className="inline-block rounded bg-yellow-300 px-6 py-2 font-mono text-2xl shadow">
              ⏱️ {displayTime}
            </p>
          </div>

          <div className="mx-auto w-full max-w-screen-xl overflow-x-auto px-2">
            <div className="inline-block w-full">
              <div
                className="grid w-full gap-1"
                style={{
                  gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))`,
                }}
              >
                <div className="h-10" />

                {Array.from(
                  { length: cols },
                  (_, index) => (
                    <div
                      key={`column-header-${index}`}
                      className={[
                        "col-header flex h-10 w-full items-center justify-center bg-yellow-300 text-center text-xs font-bold sm:text-sm",
                        colSwept[index]
                          ? "sweep-col"
                          : "",
                      ].join(" ")}
                    >
                      {index + 1}
                    </div>
                  )
                )}

                {grid.map(
                  (row, rowIndex) => (
                    <React.Fragment
                      key={`row-${rowIndex}`}
                    >
                      <div
                        className={[
                          "row-header flex h-10 w-full items-center justify-center bg-yellow-300 text-center text-xs font-bold sm:text-sm",
                          rowSwept[rowIndex]
                            ? "sweep-row"
                            : "",
                        ].join(" ")}
                      >
                        {rowIndex + 1}
                      </div>

                      {row.map(
                        (cell, columnIndex) => {
                          const cellKey = `${rowIndex}-${columnIndex}`;
                          const celebrated =
                            Boolean(
                              celebratedMap[
                                cellKey
                              ]
                            );

                          return (
                            <div
                              key={`cell-wrap-${rowIndex}-${columnIndex}`}
                              className="cell-wrap"
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={cell.value}
                                placeholder={`${rowIndex + 1} × ${columnIndex + 1}`}
                                aria-label={`${rowIndex + 1} times ${columnIndex + 1}`}
                                onFocus={() => setFocusedCell(cellKey)}
                                onBlur={() =>
                                  setFocusedCell((current) =>
                                     current === cellKey ? null : current
                                 )
                               }

                                onChange={(
                                  event
                                ) => {
                                  const wasCorrect =
                                    Boolean(
                                      grid[
                                        rowIndex
                                      ][
                                        columnIndex
                                      ].correct
                                    );

                                  const nextGrid =
                                    grid.map(
                                      (
                                        gridRow
                                      ) =>
                                        gridRow.map(
                                          (
                                            gridCell
                                          ) => ({
                                            ...gridCell,
                                          })
                                        )
                                    );

                                  const nextCell =
                                    nextGrid[
                                      rowIndex
                                    ][
                                      columnIndex
                                    ];

                                  const newValue =
                                    event.target.value
                                      .replace(
                                        /\D+/g,
                                        ""
                                      )
                                      .slice(0, 3);

                                  nextCell.value =
                                    newValue;

                                  nextCell.correct =
                                    newValue !==
                                      "" &&
                                    Number(
                                      newValue
                                    ) ===
                                      nextCell.answer;

                                  if (
                                    !wasCorrect &&
                                    nextCell.correct &&
                                    rowIndex ===
                                      columnIndex &&
                                    !celebratedMap[
                                      cellKey
                                    ]
                                  ) {
                                    setCelebratedMap(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        [cellKey]:
                                          true,
                                      })
                                    );
                                  }

                                  if (
                                    nextCell.correct
                                  ) {
                                    if (
                                      !rowSwept[
                                        rowIndex
                                      ] &&
                                      nextGrid[
                                        rowIndex
                                      ].every(
                                        (
                                          item
                                        ) =>
                                          item.correct ===
                                          true
                                      )
                                    ) {
                                      setRowSwept(
                                        (
                                          current
                                        ) =>
                                          current.map(
                                            (
                                              value,
                                              index
                                            ) =>
                                              index ===
                                              rowIndex
                                                ? true
                                                : value
                                          )
                                      );
                                    }

                                    if (
                                      !colSwept[
                                        columnIndex
                                      ] &&
                                      nextGrid.every(
                                        (
                                          gridRow
                                        ) =>
                                          gridRow[
                                            columnIndex
                                          ].correct ===
                                          true
                                      )
                                    ) {
                                      setColSwept(
                                        (
                                          current
                                        ) =>
                                          current.map(
                                            (
                                              value,
                                              index
                                            ) =>
                                              index ===
                                              columnIndex
                                                ? true
                                                : value
                                          )
                                      );
                                    }
                                  }

                                  setGrid(
                                    nextGrid
                                  );

                                  checkCompletion(
                                    nextGrid
                                  );

                                  if (
                                    !timerStartedRef.current &&
                                    newValue !== ""
                                  ) {
                                    const now =
                                      Date.now();

                                    setStartTime(
                                      now
                                    );

                                    timerRef.current =
                                      setInterval(
                                        () =>
                                          setElapsed(
                                            Date.now() -
                                              now
                                          ),
                                        10
                                      );

                                    timerStartedRef.current =
                                      true;
                                  }
                                }}
                                onKeyDown={(
                                  event
                                ) =>
                                  handleKeyDown(
                                    event,
                                    rowIndex,
                                    columnIndex
                                  )
                                }
                                onInput={(
                                  event
                                ) =>
                                  antiRef.current?.onInput(
                                    event.nativeEvent
                                  )
                                }
                                onPaste={(
                                  event
                                ) =>
                                  antiRef.current?.onPaste(
                                    event
                                  )
                                }
                                onDrop={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                onDragOver={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                ref={(element) => {
                                  if (
                                    !inputRefs
                                      .current[
                                      rowIndex
                                    ]
                                  ) {
                                    inputRefs.current[
                                      rowIndex
                                    ] = [];
                                  }

                                  inputRefs.current[
                                    rowIndex
                                  ][
                                    columnIndex
                                  ] = element;
                                }}
                                className={[
                                  "h-10 w-full border text-center",
                                  cell.correct ===
                                  null
                                    ? "border-gray-400"
                                    : cell.correct
                                      ? "bg-green-200"
                                      : "bg-red-200",
                                  celebrated
                                    ? "pop-once font-bold text-yellow-700 ring-2 ring-yellow-400"
                                    : "",
                                  focusedCell === cellKey &&
                                  cell.value === ""
                                    ? "mobile-hide-native-caret"
                                    : "",
                                ].join(" ")}
                              />
{/* Desktop and tablet horizontal cursor */}
{focusedCell === cellKey &&
  cell.value === "" && (
    <span
      className="desktop-horizontal-caret"
      aria-hidden="true"
    />
  )}

{/* Mobile vertical prompt and cursor */}
{focusedCell === cellKey &&
  cell.value === "" && (
    <span
      className="mobile-cell-prompt"
      aria-hidden="true"
    >
      <span>{rowIndex + 1}</span>
      <span>×</span>
      <span>{columnIndex + 1}</span>
      <span className="mobile-horizontal-caret" />
    </span>
  )}

                            </div>
                          );
                        }
                      )}
                    </React.Fragment>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          marginBottom: "20px",
        }}
      >
        <a
          href="/about-us-contact.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#000",
            fontWeight: "bold",
            textDecoration: "underline",
            fontSize: "16px",
          }}
        >
          About Us/Contact
        </a>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-70 p-4">
          <form
            onSubmit={handleSubmit}
            className="my-8 w-full max-w-md space-y-4 rounded bg-white p-6 text-black shadow"
          >
            <h2 className="text-center text-xl font-bold">
              🎉 Game Complete!
            </h2>

            <p className="text-center">
              Well done! Your time:{" "}
              <span className="font-mono font-semibold">
                {displayTime}
              </span>
            </p>

            {profileSaveStatus !== "idle" && (
              <div
                className={[
                  "rounded border p-3 text-center text-sm font-semibold",
                  profileSaveStatus ===
                  "personal-best"
                    ? "border-yellow-300 bg-yellow-100 text-yellow-900"
                    : profileSaveStatus ===
                        "saved"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : profileSaveStatus ===
                          "guest"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : profileSaveStatus ===
                            "error"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-gray-200 bg-gray-50 text-gray-700",
                ].join(" ")}
              >
                {profileSaveStatus ===
                  "saving" && "⏳ "}
                {profileSaveStatus ===
                  "personal-best" && "🏆 "}
                {profileSaveStatus ===
                  "saved" && "✅ "}
                {profileSaveStatus ===
                  "guest" && "👤 "}
                {profileSaveStatus ===
                  "error" && "⚠️ "}
                {profileSaveMessage}
              </div>
            )}

            <p className="text-center text-sm text-gray-600">
              {loggedInPlayer
                ? "Review your profile details and submit your time to the public leaderboard."
                : "Enter your information and submit your time to appear on the leaderboard."}
            </p>

            {loggedInPlayer ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Public leaderboard submission
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    {loggedInPlayer.name}
                  </h3>

                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="font-semibold text-gray-500">
                        Category
                      </dt>
                      <dd className="font-bold">
                        {getLearningCategoryLabel(
                          loggedInPlayer.category
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-500">
                        School
                      </dt>
                      <dd className="font-bold">
                        {loggedInPlayer.school ||
                          "N/A"}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-500">
                        Class / Level
                      </dt>
                      <dd className="font-bold">
                        {loggedInPlayer.classLevel ||
                          "N/A"}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-500">
                        Email
                      </dt>
                      <dd className="break-all font-bold">
                        {loggedInPlayer.email ||
                          "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Player Name"
                  className="w-full rounded border px-3 py-2"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        name: event.target.value,
                      })
                    )
                  }
                  required
                />

                <select
                  className="w-full rounded border px-3 py-2"
                  value={formData.category}
                  onChange={(event) => {
                    const nextCategory =
                      event.target.value;

                    setShowCustomSchool(false);

                    setFormData((current) => ({
                      ...current,
                      category: nextCategory,
                      school: "",
                      classLevel: "",
                    }));
                  }}
                  required
                >
                  {getCategoryOptions().map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category ===
                        "NoSchool"
                          ? "No School"
                          : category}
                      </option>
                    )
                  )}
                </select>

                {formData.category !==
                  "NoSchool" && (
                  <>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={
                        showCustomSchool
                          ? "School not listed"
                          : formData.school ||
                            "Select a School..."
                      }
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        if (
                          value ===
                          "School not listed"
                        ) {
                          setShowCustomSchool(
                            true
                          );
                          setFormData(
                            (current) => ({
                              ...current,
                              school: "",
                            })
                          );
                        } else if (
                          value ===
                          "Select a School..."
                        ) {
                          setShowCustomSchool(
                            false
                          );
                          setFormData(
                            (current) => ({
                              ...current,
                              school: "",
                            })
                          );
                        } else {
                          setShowCustomSchool(
                            false
                          );
                          setFormData(
                            (current) => ({
                              ...current,
                              school: value,
                            })
                          );
                        }
                      }}
                      required
                    >
                      {schoolOptionsForCategory.map(
                        (school) => (
                          <option
                            key={school}
                            value={school}
                          >
                            {school}
                          </option>
                        )
                      )}
                    </select>

                    {showCustomSchool && (
                      <input
                        type="text"
                        placeholder="Enter school name"
                        className="w-full rounded border px-3 py-2"
                        value={
                          formData.school
                        }
                        onChange={(event) =>
                          setFormData(
                            (current) => ({
                              ...current,
                              school:
                                event.target
                                  .value,
                            })
                          )
                        }
                        required
                      />
                    )}

                    <select
                      className="w-full rounded border px-3 py-2"
                      value={
                        formData.classLevel
                      }
                      onChange={(event) =>
                        setFormData(
                          (current) => ({
                            ...current,
                            classLevel:
                              event.target
                                .value,
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        {formData.category ===
                        "Secondary"
                          ? "Select Form / Level..."
                          : "Select Class..."}
                      </option>

                      {getClassOptions(
                        formData.category
                      ).map((level) => (
                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {formData.category ===
                  "NoSchool" && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
                    <p className="font-bold">
                      No School category
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      School and class information
                      are not required.
                    </p>
                  </div>
                )}

                <input
                  type="email"
                  placeholder="Email (Optional)"
                  className="w-full rounded border px-3 py-2"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        email:
                          event.target.value,
                      })
                    )
                  }
                />
              </>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={[
                  "flex-1 rounded px-4 py-2 text-white",
                  isSubmitting
                    ? "cursor-not-allowed bg-green-400"
                    : "bg-green-600 hover:bg-green-700",
                ].join(" ")}
              >
                {isSubmitting
                  ? "Submitting..."
                  : loggedInPlayer
                    ? "✅ Submit My Time"
                    : "✅ Submit Time"}
              </button>

              <button
                type="button"
                onClick={resetCurrentRun}
                className="flex-1 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                🔁 Reset Game
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
</div>
  );
}


