import { describe, it, expect } from 'vitest';
import { getAnnouncement } from './announcements';

const base = { showAnswer: false, answerLog: [], timeLeft: 15, timePerQuestion: 15 };
const entry = (overrides) => ({ question: 'Q', selectedAnswer: 'x', correctAnswer: 'Right', isCorrect: false, ...overrides });

describe('getAnnouncement', () => {
  it('says nothing while a question is open and no warning threshold is reached', () => {
    expect(getAnnouncement(base)).toBe('');
    expect(getAnnouncement({ ...base, timeLeft: 11 })).toBe('');
    expect(getAnnouncement({ ...base, timeLeft: 9 })).toBe('');
    expect(getAnnouncement({ ...base, timeLeft: 1 })).toBe('');
  });

  it.each([10, 5])('warns when %i seconds are left', (timeLeft) => {
    expect(getAnnouncement({ ...base, timeLeft })).toBe(`${timeLeft} seconds left`);
  });

  it('does not warn right at the start of a question that is as short as the threshold', () => {
    expect(getAnnouncement({ ...base, timeLeft: 10, timePerQuestion: 10 })).toBe('');
    expect(getAnnouncement({ ...base, timeLeft: 5, timePerQuestion: 5 })).toBe('');
  });

  it('announces a correct answer', () => {
    const answerLog = [entry({ isCorrect: true, selectedAnswer: 'Right' })];
    expect(getAnnouncement({ ...base, showAnswer: true, answerLog })).toBe('Correct!');
  });

  it('announces a wrong answer together with the correct one', () => {
    const answerLog = [entry({ selectedAnswer: 'Wrong', correctAnswer: 'Paris' })];
    expect(getAnnouncement({ ...base, showAnswer: true, answerLog })).toBe('Wrong. The correct answer is Paris.');
  });

  it('announces that time ran out together with the correct answer', () => {
    const answerLog = [entry({ selectedAnswer: null, correctAnswer: 'Paris' })];
    expect(getAnnouncement({ ...base, showAnswer: true, answerLog })).toBe('Time is up. The correct answer is Paris.');
  });

  it('uses the latest answer and prefers the answer feedback over a time warning', () => {
    const answerLog = [entry({ isCorrect: true, selectedAnswer: 'Right' }), entry({ selectedAnswer: 'Wrong', correctAnswer: 'Paris' })];
    expect(getAnnouncement({ ...base, showAnswer: true, answerLog, timeLeft: 10 })).toBe('Wrong. The correct answer is Paris.');
  });

  it('says nothing when an answer is shown but nothing has been logged yet', () => {
    expect(getAnnouncement({ ...base, showAnswer: true })).toBe('');
  });
});
