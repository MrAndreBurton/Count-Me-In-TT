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

const GRID_CARD_NAMES = {
  "5x5": "Starter",
  "5x12": "Builder",
  "12x12": "Classic",
  "15x15": "Extended",
};

function GridPreview({ rows, cols }) {
  return (
    <svg
      className="cmi-grid-choice-preview"
      viewBox={`0 0 ${cols * 7} ${rows * 7}`}
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: rows * cols }, (_, index) => (
        <rect
          key={index}
          x={(index % cols) * 7}
          y={Math.floor(index / cols) * 7}
          width="5.5"
          height="5.5"
          rx="1"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function GridChoiceCard({ gridPreset, selected, locked, onSelect }) {
  const name = GRID_CARD_NAMES[gridPreset.id] || "Multiplication";
  const tableDescription = gridPreset.rows === gridPreset.cols
    ? `Tables 1–${gridPreset.rows}`
    : `Tables 1–${gridPreset.rows}, up to ×${gridPreset.cols}`;

  const contents = (
    <>
      <span className="cmi-grid-choice-top">
        <span className="cmi-grid-choice-name">{name}</span>
        <span className="cmi-grid-choice-check" aria-hidden="true">
          {selected ? "✓" : ""}
        </span>
      </span>
      <span className="cmi-grid-choice-visual">
        <span className="cmi-grid-choice-size">
          {gridPreset.rows} <span>×</span> {gridPreset.cols}
        </span>
        <GridPreview rows={gridPreset.rows} cols={gridPreset.cols} />
      </span>
      <span className="cmi-grid-choice-description">{tableDescription}</span>
      <span className="cmi-grid-choice-count">
        {gridPreset.rows * gridPreset.cols} answers
      </span>
    </>
  );

  if (locked) {
    return <div className="cmi-grid-choice is-selected">{contents}</div>;
  }

  return (
    <button
      type="button"
      className={`cmi-grid-choice${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      aria-label={`${name}, ${gridPreset.rows} by ${gridPreset.cols}, ${tableDescription}, ${gridPreset.rows * gridPreset.cols} answers`}
      onClick={onSelect}
    >
      {contents}
    </button>
  );
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

        const playerData = {
          userId: user.id,
          profileId: profile.id,
          email: user.email || "",
          name: getProfileName(profile),
          category: category || "",
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

  const gridPresentation =
    cols <= 5
      ? {
          maxWidth: "56rem",
          cellHeight: "44px",
          cellFontSize: "0.95rem",
          promptFontSize: "clamp(10px, 1.5vw, 15px)",
          mobileGap: "4px",
        }
      : cols <= 12
        ? {
            maxWidth: "80rem",
            cellHeight: "40px",
            cellFontSize: "0.82rem",
            promptFontSize: "11px",
            mobileGap: "2px",
          }
        : {
            maxWidth: "88rem",
            cellHeight: "38px",
            cellFontSize: "0.78rem",
            promptFontSize: "10px",
            mobileGap: "2px",
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
        .cmi-grid-picker-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(5px);
          box-sizing: border-box;
        }
        .cmi-grid-picker,
        .cmi-grid-picker * { box-sizing: border-box; }
        .cmi-grid-picker {
          width: 100%;
          max-width: 540px;
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 26px;
          background: linear-gradient(155deg, #fffbd6 0%, #fff 48%);
          color: #111827;
          text-align: left;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
          font-family: inherit;
        }
        .cmi-grid-picker-heading { margin-bottom: 18px; }
        .cmi-grid-picker-eyebrow {
          margin: 0 0 8px;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }
        .cmi-grid-picker-heading h2 {
          margin: 0;
          max-width: 440px;
          font-size: 30px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -1px;
        }
        .cmi-grid-picker-heading > p:last-child {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }
        .cmi-grid-choices {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cmi-grid-choices.is-fixed { grid-template-columns: minmax(0, 1fr); }
        .cmi-grid-choice {
          display: flex;
          min-width: 0;
          flex-direction: column;
          padding: 12px;
          border: 2px solid #f3d64a;
          border-radius: 15px;
          background: #fff8bd;
          color: #111827;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
          transition: border-color 160ms, background 160ms, box-shadow 160ms;
        }
        .cmi-grid-choice:hover { border-color: #2563eb; background: #fff19b; }
        .cmi-grid-choice.is-selected {
          border-color: #2563eb;
          background: #2563eb;
          color: #fff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .cmi-grid-choices.is-fixed .cmi-grid-choice { cursor: default; }
        .cmi-grid-choice-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .cmi-grid-choice-name { color: #1e40af; font-size: 12px; font-weight: 800; }
        .is-selected .cmi-grid-choice-name { color: #fff38a; }
        .cmi-grid-choice-check {
          display: flex;
          width: 18px;
          height: 18px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1.5px solid #d5b92f;
          border-radius: 50%;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }
        .is-selected .cmi-grid-choice-check { border-color: #fce500; background: #fce500; color: #1e40af; }
        .cmi-grid-choice-visual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin: 7px 0 6px;
          min-height: 34px;
        }
        .cmi-grid-choice-size { white-space: nowrap; font-size: 25px; font-weight: 900; letter-spacing: -1px; }
        .cmi-grid-choice-size > span { color: #2563eb; font-size: 20px; }
        .is-selected .cmi-grid-choice-size > span { color: #fce500; }
        .cmi-grid-choice-preview { width: 55px; height: 34px; flex-shrink: 0; color: #6690db; }
        .is-selected .cmi-grid-choice-preview { color: #ffec4d; }
        .cmi-grid-choice-description { min-height: 0; font-size: 12px; line-height: 1.3; color: #334155; }
        .is-selected .cmi-grid-choice-description { color: #eff6ff; }
        .cmi-grid-choice-count {
          align-self: flex-start;
          margin-top: 6px;
          padding: 3px 7px;
          border-radius: 7px;
          background: #fce500;
          color: #1e3a8a;
          font-size: 11px;
          font-weight: 800;
        }
        .cmi-grid-picker-start {
          display: flex;
          width: 100%;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-top: 18px;
          padding: 13px 15px;
          border: 0;
          border-radius: 13px;
          background: #2563eb;
          color: #fff;
          font-family: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
        }
        .cmi-grid-picker-start:hover { background: #1d4ed8; }
        .cmi-grid-choice:focus-visible,
        .cmi-grid-picker-start:focus-visible,
        .cmi-grid-picker-help summary:focus-visible,
        .cmi-grid-picker-practice a:focus-visible {
          outline: 3px solid #1d4ed8;
          outline-offset: 3px;
        }
        .cmi-grid-picker-timer { margin: 10px 0 18px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5; }
        .cmi-grid-picker-help { border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .cmi-grid-picker-help summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
          list-style: none;
          cursor: pointer;
        }
        .cmi-grid-picker-help summary::-webkit-details-marker { display: none; }
        .cmi-grid-picker-help summary > span { font-size: 20px; line-height: 1; transition: transform 160ms; }
        .cmi-grid-picker-help[open] summary > span { transform: rotate(45deg); }
        .cmi-grid-picker-help-content { padding: 0 0 14px; color: #475569; font-size: 12px; line-height: 1.6; }
        .cmi-grid-picker-help-content p { margin: 0 0 8px; }
        .cmi-grid-picker-help-content ul { margin: 8px 0 0; padding-left: 18px; list-style: disc; }
        .cmi-grid-picker-help-content li + li { margin-top: 5px; }
        .cmi-grid-picker-practice { padding-top: 14px; text-align: center; }
        .cmi-grid-picker-practice p { margin: 0 0 8px; color: #64748b; font-size: 12px; }
        .cmi-grid-picker-practice a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid #e1c600;
          border-radius: 10px;
          background: #fce500;
          color: #1e3a8a;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }
        .cmi-grid-picker-practice a:hover { background: #ffef57; border-color: #2563eb; }
        @media (max-width: 420px) {
          .cmi-grid-picker-overlay { padding: 12px; }
          .cmi-grid-picker { padding: 20px; max-height: calc(100dvh - 24px); border-radius: 22px; }
          .cmi-grid-picker-heading { margin-bottom: 16px; }
          .cmi-grid-picker-heading h2 { font-size: 27px; }
          .cmi-grid-choices { gap: 10px; }
          .cmi-grid-choice { padding: 10px; }
          .cmi-grid-choice-size { font-size: 23px; }
          .cmi-grid-choice-size > span { font-size: 18px; }
          .cmi-grid-choice-preview { width: 43px; height: 30px; }
          .cmi-grid-choice-visual { gap: 4px; min-height: 30px; margin: 6px 0; }
        }
        @media (max-width: 350px) {
          .cmi-grid-picker { padding: 16px; }
          .cmi-grid-choice { padding: 9px; }
          .cmi-grid-choice-preview { width: 34px; }
          .cmi-grid-choice-size { font-size: 21px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cmi-grid-choice,
          .cmi-grid-picker-help summary > span { transition: none; }
        }

        .multiplication-grid-board {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          gap: var(--multiplication-mobile-gap);
        }

        .multiplication-grid-header,
        .multiplication-grid-input {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          height: var(--multiplication-cell-height);
          font-size: var(--multiplication-cell-font-size);
        }

        .multiplication-grid-header {
          overflow: hidden;
        }

        .multiplication-cell {
          position: relative;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .multiplication-cell input {
          position: relative;
          z-index: 1;
        }

        .multiplication-cell input::placeholder {
          color: transparent;
          opacity: 0;
        }

        .multiplication-cell input:focus::placeholder {
          color: rgba(107, 114, 128, 0.72);
          opacity: 1;
          font-size: var(--multiplication-prompt-font-size);
          font-weight: 600;
        }

        .multiplication-hide-native-caret:focus {
          caret-color: transparent;
        }

        .multiplication-desktop-caret {
          position: absolute;
          left: 50%;
          bottom: 5px;
          z-index: 2;
          display: block;
          width: 10px;
          height: 1.5px;
          background-color: rgba(75, 85, 99, 0.9);
          transform: translateX(-50%);
          animation: multiplicationCaretBlink 1s step-end infinite;
          pointer-events: none;
        }

        .multiplication-mobile-prompt {
          display: none;
        }

        @media (min-width: 641px) {
          .multiplication-grid-board {
            gap: 4px;
          }
        }

        @media (max-width: 640px) {
          .multiplication-cell input:focus::placeholder {
            color: transparent;
            opacity: 0;
          }

          .multiplication-desktop-caret {
            display: none;
          }

          .multiplication-mobile-prompt {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: rgba(107, 114, 128, 0.76);
            font-size: 8px;
            font-weight: 600;
            line-height: 0.8;
            pointer-events: none;
          }

          .multiplication-mobile-caret {
            display: block;
            width: 8px;
            height: 1.5px;
            margin-top: 2px;
            background-color: rgba(75, 85, 99, 0.9);
            animation: multiplicationCaretBlink 1s step-end infinite;
          }
        }

        @keyframes multiplicationCaretBlink {
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
        <div className="cmi-grid-picker-overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cmi-grid-picker-title"
            aria-describedby="cmi-grid-picker-description"
            className="cmi-grid-picker"
          >
            <header className="cmi-grid-picker-heading">
              <p className="cmi-grid-picker-eyebrow">COUNT ME IN TT · MULTIPLICATION</p>
              <h2 id="cmi-grid-picker-title">Your multiplication challenge</h2>
              <p id="cmi-grid-picker-description">
                {lockPreset
                  ? "Complete every answer and beat your own time."
                  : "Choose your grid. Complete every answer and beat your own time."}
              </p>
            </header>

            <div
              className={`cmi-grid-choices${lockPreset ? " is-fixed" : ""}`}
              role="group"
              aria-label={lockPreset ? "Your challenge grid" : "Choose a challenge grid"}
            >
              {(lockPreset ? [preset] : GRID_PRESETS).map((gridPreset) => (
                <GridChoiceCard
                  key={gridPreset.id}
                  gridPreset={gridPreset}
                  selected={gridPreset.id === preset.id}
                  locked={lockPreset}
                  onSelect={() => setGridPresetId(gridPreset.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="cmi-grid-picker-start"
            >
              Start {rows} × {cols} Challenge
              <span aria-hidden="true">→</span>
            </button>
            <p className="cmi-grid-picker-timer">
              Your timer starts when you enter your first answer.
            </p>

            <details className="cmi-grid-picker-help">
              <summary>How to play <span aria-hidden="true">+</span></summary>
              <div className="cmi-grid-picker-help-content">
                <p>Fill every cell with the product of its row and column numbers.</p>
                <p>On a phone or tablet, tap a cell and use the number keyboard.</p>
                <ul>
                  <li><strong>Enter</strong> — Move to the next cell.</li>
                  <li><strong>Arrow keys</strong> — Move around the grid.</li>
                  <li><strong>Backspace</strong> — Clear the current cell.</li>
                </ul>
              </div>
            </details>

            <div className="cmi-grid-picker-practice">
              <p>Want to practise one table?</p>
              <Link to="/games/multiplication/practice">
                Try Times Table Practice <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
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
            <p className="text-sm font-black uppercase tracking-wide text-gray-700">
              Your Timer
            </p>
            <p className="inline-block rounded-xl bg-yellow-300 px-7 py-3 font-mono text-3xl font-black shadow-md">
              ⏱️ {displayTime}
            </p>
          </div>

          <div
            className="mx-auto w-full"
            style={{ maxWidth: gridPresentation.maxWidth }}
          >
            <div className="mt-8 overflow-hidden rounded-2xl border border-yellow-300 bg-yellow-50/95 p-2 shadow-lg sm:p-6">
              <div
                className="multiplication-grid-board grid"
                style={{
                  gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))`,
                  "--multiplication-cell-height":
                    gridPresentation.cellHeight,
                  "--multiplication-cell-font-size":
                    gridPresentation.cellFontSize,
                  "--multiplication-prompt-font-size":
                    gridPresentation.promptFontSize,
                  "--multiplication-mobile-gap":
                    gridPresentation.mobileGap,
                }}
              >
                <div className="multiplication-grid-header flex min-w-0 items-center justify-center rounded-md bg-blue-500 text-lg font-black text-white">
                  ×
                </div>

                {Array.from(
                  { length: cols },
                  (_, index) => (
                    <div
                      key={`column-header-${index}`}
                      className={[
                        "multiplication-grid-header col-header flex min-w-0 w-full items-center justify-center rounded-md bg-yellow-300 text-center font-black",
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
                          "multiplication-grid-header row-header flex min-w-0 w-full items-center justify-center rounded-md bg-yellow-300 text-center font-black",
                          rowSwept[rowIndex]
                            ? "sweep-row"
                            : "",
                        ].join(" ")}
                      >
                        {rowIndex + 1}
                      </div>

                      {row.map(
                        (cell, columnIndex) => {
                          const cellKey = `{columnIndex}`;
                          const celebrated =
                            Boolean(
                              celebratedMap[
                                cellKey
                              ]
                            );
                          const showPrompt =
                            focusedCell ===
                              cellKey &&
                            cell.value === "";

                          return (
                            <div
                              key={`cell-wrap-{columnIndex}`}
                              className="multiplication-cell min-w-0"
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
                                  "multiplication-grid-input min-w-0 w-full rounded-md border text-center font-bold outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200",
                                  cell.correct ===
                                  null
                                    ? "border-gray-400 bg-white"
                                    : cell.correct
                                      ? "border-green-400 bg-green-200"
                                      : "border-red-400 bg-red-200",
                                  celebrated
                                    ? "pop-once font-bold text-yellow-700 ring-2 ring-yellow-400"
                                    : "",
                                  showPrompt
                                    ? "multiplication-hide-native-caret"
                                    : "",
                                ].join(" ")}
                              />

                              {showPrompt && (
                                <span
                                  className="multiplication-desktop-caret"
                                  aria-hidden="true"
                                />
                              )}

                              {showPrompt && (
                                <span
                                  className="multiplication-mobile-prompt"
                                  aria-hidden="true"
                                >
                                  <span>{rowIndex + 1}</span>
                                  <span>×</span>
                                  <span>{columnIndex + 1}</span>
                                  <span className="multiplication-mobile-caret" />
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
