const STORAGE_KEY = "quizHistory";
const MAX_ENTRIES = 10;

const isValidEntry = (entry) =>
  entry !== null &&
  typeof entry === "object" &&
  typeof entry.date === "string" &&
  !Number.isNaN(Date.parse(entry.date)) &&
  Number.isInteger(entry.totalQuestions) &&
  entry.totalQuestions > 0 &&
  Number.isInteger(entry.score) &&
  entry.score >= 0 &&
  entry.score <= entry.totalQuestions;

export function getHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter(isValidEntry).slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry) {
  const history = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable (e.g. private browsing) - skip silently
  }
  return history;
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable - nothing to clear
  }
}
