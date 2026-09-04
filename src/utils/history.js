const STORAGE_KEY = "quizHistory";
const MAX_ENTRIES = 10;

export function getHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
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
