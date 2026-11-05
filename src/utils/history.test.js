import { describe, it, expect, beforeEach } from 'vitest';
import { getHistory, addHistoryEntry, clearHistory } from './history';

describe('history', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty array when nothing has been saved yet', () => {
    expect(getHistory()).toEqual([]);
  });

  it('returns an empty array when the stored value is corrupted JSON', () => {
    localStorage.setItem('quizHistory', 'not-json');
    expect(getHistory()).toEqual([]);
  });

  it('adds a new entry to the front of the list', () => {
    addHistoryEntry({ date: '2026-01-01', score: 3, totalQuestions: 5 });
    addHistoryEntry({ date: '2026-01-02', score: 4, totalQuestions: 5 });

    const history = getHistory();

    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({ date: '2026-01-02', score: 4, totalQuestions: 5 });
    expect(history[1]).toEqual({ date: '2026-01-01', score: 3, totalQuestions: 5 });
  });

  it('caps stored history at 10 entries, dropping the oldest', () => {
    for (let i = 0; i < 12; i++) {
      addHistoryEntry({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, score: i % 6, totalQuestions: 5 });
    }

    const history = getHistory();

    expect(history).toHaveLength(10);
    expect(history[0].date).toBe('2026-01-12');
    expect(history[9].date).toBe('2026-01-03');
  });

  it.each([['{}'], ['"text"'], ['42'], ['null'], ['not json']])(
    'regression: returns an empty list when the stored value is %s',
    (stored) => {
      localStorage.setItem('quizHistory', stored);
      expect(getHistory()).toEqual([]);
    }
  );

  it('regression: drops malformed entries and keeps the valid ones in order', () => {
    const good1 = { date: '2026-02-02T10:00:00.000Z', score: 3, totalQuestions: 5 };
    const good2 = { date: '2026-02-01', score: 0, totalQuestions: 1 };
    localStorage.setItem(
      'quizHistory',
      JSON.stringify([
        null,
        5,
        'x',
        good1,
        { date: 'not a date', score: 1, totalQuestions: 2 },
        { date: '2026-01-01', score: '3', totalQuestions: 5 },
        { date: '2026-01-01', score: 6, totalQuestions: 5 },
        { date: '2026-01-01', score: -1, totalQuestions: 5 },
        { date: '2026-01-01', score: 0, totalQuestions: 0 },
        { date: '2026-01-01', score: 1.5, totalQuestions: 5 },
        { score: 1, totalQuestions: 2 },
        good2,
      ])
    );

    expect(getHistory()).toEqual([good1, good2]);
  });

  it('never returns more than 10 entries even if more were stored', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ date: `2026-03-${String(i + 1).padStart(2, '0')}`, score: 1, totalQuestions: 2 }));
    localStorage.setItem('quizHistory', JSON.stringify(many));

    expect(getHistory()).toHaveLength(10);
  });

  it('regression: addHistoryEntry does not throw when the stored value is corrupted', () => {
    localStorage.setItem('quizHistory', '{"not":"a list"}');
    const entry = { date: '2026-04-01', score: 2, totalQuestions: 3 };

    expect(() => addHistoryEntry(entry)).not.toThrow();
    expect(getHistory()).toEqual([entry]);
  });

  it('clearHistory removes all saved entries', () => {
    addHistoryEntry({ date: '2026-01-01', score: 3, totalQuestions: 5 });

    clearHistory();

    expect(getHistory()).toEqual([]);
  });

  it('clearHistory does not throw when there is nothing to clear', () => {
    expect(() => clearHistory()).not.toThrow();
  });
});
