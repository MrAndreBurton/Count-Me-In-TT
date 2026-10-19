// Evidence is recorded at explicit checks, never while the learner is typing.
export function createPracticeEvidence(facts) {
  const items = facts.map((fact, index) => ({
    factor: fact.factor,
    position: index + 1,
    firstTryCorrect: null,
    incorrectSubmissions: 0,
    eventuallyCorrect: false,
    value: "",
    revision: 0,
    submittedRevision: -1,
  }));

  function edit(index, value) {
    const item = items[index];
    if (!item || item.eventuallyCorrect || item.value === value) return;
    item.value = value;
    item.revision += 1;
  }

  function submit(index, value) {
    const item = items[index];
    if (!item || !value || item.eventuallyCorrect) return null;
    edit(index, value);
    if (item.submittedRevision === item.revision) return null;
    item.submittedRevision = item.revision;
    const correct = Number(value) === facts[index].answer;
    if (item.firstTryCorrect === null) item.firstTryCorrect = correct;
    if (correct) item.eventuallyCorrect = true;
    else item.incorrectSubmissions += 1;
    return { correct };
  }

  function snapshot() {
    return items.map(({ factor, position, firstTryCorrect, incorrectSubmissions, eventuallyCorrect }) => ({
      factor, position, firstTryCorrect, incorrectSubmissions, eventuallyCorrect,
    }));
  }

  function summary() {
    return {
      incorrectAttempts: items.reduce((total, item) => total + item.incorrectSubmissions, 0),
      factsMissedFirstTry: items.filter(item => item.firstTryCorrect === false).length,
    };
  }

  return { edit, submit, snapshot, summary };
}
