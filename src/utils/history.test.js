import { describe, it, expect, beforeEach } from 'vitest';
import { getHistory, addHistoryEntry } from './history';

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
      addHistoryEntry({ date: `entry-${i}`, score: i, totalQuestions: 5 });
    }

    const history = getHistory();

    expect(history).toHaveLength(10);
    expect(history[0].date).toBe('entry-11');
    expect(history[9].date).toBe('entry-2');
  });
});
