import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { quizReducer, initialState, useQuiz } from './useQuiz';
import * as trivia from '../api/trivia';
import * as history from '../utils/history';

vi.mock('../utils/sound', () => ({
  playCorrectSound: vi.fn(),
  playWrongSound: vi.fn(),
}));

describe('quizReducer', () => {
  it('START_QUIZ resets state and sets timeLeft from settings', () => {
    const dirtyState = { ...initialState, score: 5, currentQuestionIndex: 3, answerLog: [true, false] };
    const settings = { amount: 5, timePerQuestion: 25 };

    const result = quizReducer(dirtyState, { type: 'START_QUIZ', settings });

    expect(result.settings).toEqual(settings);
    expect(result.timeLeft).toBe(25);
    expect(result.score).toBe(0);
    expect(result.currentQuestionIndex).toBe(0);
    expect(result.answerLog).toEqual([]);
  });

  it('START_QUIZ falls back to 15s when timePerQuestion is missing', () => {
    const result = quizReducer(initialState, { type: 'START_QUIZ', settings: { amount: 5 } });
    expect(result.timeLeft).toBe(15);
  });

  it('QUESTIONS_LOADED stores questions and resets the timer', () => {
    const state = { ...initialState, settings: { timePerQuestion: 20 }, timeLeft: 3 };
    const questions = [{ question: 'Q1', options: ['a', 'b'], correctAnswer: 'a' }];

    const result = quizReducer(state, { type: 'QUESTIONS_LOADED', questions });

    expect(result.questions).toEqual(questions);
    expect(result.timeLeft).toBe(20);
  });

  it('ANSWER increments score on a correct answer and logs the full entry', () => {
    const priorEntry = { question: 'Q0', selectedAnswer: 'x', correctAnswer: 'x', isCorrect: true };
    const state = { ...initialState, score: 2, answerLog: [priorEntry] };
    const entry = { question: 'Q1', selectedAnswer: 'a', correctAnswer: 'a', isCorrect: true };

    const result = quizReducer(state, { type: 'ANSWER', entry });

    expect(result.score).toBe(3);
    expect(result.answerLog).toEqual([priorEntry, entry]);
    expect(result.showAnswer).toBe(true);
    expect(result.isPaused).toBe(true);
    expect(result.selectedAnswer).toBe('a');
  });

  it('ANSWER does not increment score on a wrong answer but still logs it', () => {
    const entry = { question: 'Q1', selectedAnswer: 'b', correctAnswer: 'a', isCorrect: false };
    const result = quizReducer(initialState, { type: 'ANSWER', entry });

    expect(result.score).toBe(0);
    expect(result.answerLog).toEqual([entry]);
  });

  it('NEXT_QUESTION advances to the next question and resets per-question state', () => {
    const state = {
      ...initialState,
      settings: { timePerQuestion: 15 },
      questions: [{}, {}, {}],
      currentQuestionIndex: 0,
      showAnswer: true,
      selectedAnswer: 'a',
    };

    const result = quizReducer(state, { type: 'NEXT_QUESTION' });

    expect(result.currentQuestionIndex).toBe(1);
    expect(result.showAnswer).toBe(false);
    expect(result.isPaused).toBe(false);
    expect(result.selectedAnswer).toBeNull();
    expect(result.timeLeft).toBe(15);
    expect(result.showResult).toBe(false);
  });

  it('NEXT_QUESTION shows the result screen after the last question', () => {
    const state = {
      ...initialState,
      settings: { timePerQuestion: 15 },
      questions: [{}, {}],
      currentQuestionIndex: 1,
    };

    const result = quizReducer(state, { type: 'NEXT_QUESTION' });

    expect(result.showResult).toBe(true);
  });

  it('TICK decrements timeLeft by one', () => {
    const result = quizReducer({ ...initialState, timeLeft: 10 }, { type: 'TICK' });
    expect(result.timeLeft).toBe(9);
  });

  it('TICK never goes below zero (regression: avoids negative timer display)', () => {
    const result = quizReducer({ ...initialState, timeLeft: 0 }, { type: 'TICK' });
    expect(result.timeLeft).toBe(0);
  });

  it('RESET returns to the initial state regardless of current state', () => {
    const dirtyState = { ...initialState, score: 10, settings: { amount: 5 }, showResult: true };
    const result = quizReducer(dirtyState, { type: 'RESET' });
    expect(result).toEqual(initialState);
  });

  it('RETRY_WRONG loads the given questions, keeps settings, and resets quiz progress', () => {
    const settings = { timePerQuestion: 20 };
    const state = {
      ...initialState,
      settings,
      score: 3,
      currentQuestionIndex: 2,
      showResult: true,
      answerLog: [{ question: 'Q1', isCorrect: false }],
    };
    const wrongQuestions = [{ question: 'Q1', options: ['a', 'b'], correctAnswer: 'a' }];

    const result = quizReducer(state, { type: 'RETRY_WRONG', questions: wrongQuestions });

    expect(result.settings).toBe(settings);
    expect(result.questions).toEqual(wrongQuestions);
    expect(result.timeLeft).toBe(20);
    expect(result.score).toBe(0);
    expect(result.currentQuestionIndex).toBe(0);
    expect(result.showResult).toBe(false);
    expect(result.answerLog).toEqual([]);
  });
});

describe('useQuiz', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves a history entry only once the quiz is actually finished', async () => {
    vi.spyOn(trivia, 'fetchQuizQuestions').mockResolvedValue([
      { question: 'Q1', options: ['a', 'b'], correctAnswer: 'a' },
      { question: 'Q2', options: ['a', 'b'], correctAnswer: 'a' },
    ]);
    const addHistorySpy = vi.spyOn(history, 'addHistoryEntry');

    const { result } = renderHook(() => useQuiz());

    act(() => {
      result.current.handleStart({ amount: 2, timePerQuestion: 15 });
    });
    await waitFor(() => expect(result.current.state.questions).toHaveLength(2));

    act(() => result.current.handleAnswer('a'));
    act(() => result.current.handleNext());

    expect(addHistorySpy).not.toHaveBeenCalled();

    act(() => result.current.handleAnswer('a'));
    act(() => result.current.handleNext());

    expect(addHistorySpy).toHaveBeenCalledTimes(1);
    expect(addHistorySpy).toHaveBeenCalledWith(expect.objectContaining({ score: 2, totalQuestions: 2 }));
  });

  it('handleRetryWrong starts a new round using only the wrong questions', async () => {
    vi.spyOn(trivia, 'fetchQuizQuestions').mockResolvedValue([
      { question: 'Q1', options: ['a', 'b'], correctAnswer: 'a' },
      { question: 'Q2', options: ['c', 'd'], correctAnswer: 'c' },
    ]);

    const { result } = renderHook(() => useQuiz());

    act(() => {
      result.current.handleStart({ amount: 2, timePerQuestion: 15 });
    });
    await waitFor(() => expect(result.current.state.questions).toHaveLength(2));

    act(() => result.current.handleAnswer('a'));
    act(() => result.current.handleNext());
    act(() => result.current.handleAnswer('d'));
    act(() => result.current.handleNext());

    expect(result.current.state.showResult).toBe(true);

    act(() => result.current.handleRetryWrong());

    expect(result.current.state.questions).toEqual([
      { question: 'Q2', options: ['c', 'd'], correctAnswer: 'c' },
    ]);
    expect(result.current.state.showResult).toBe(false);
    expect(result.current.state.score).toBe(0);
  });

  it('handleRetryWrong does nothing when there were no wrong answers', async () => {
    vi.spyOn(trivia, 'fetchQuizQuestions').mockResolvedValue([
      { question: 'Q1', options: ['a', 'b'], correctAnswer: 'a' },
    ]);

    const { result } = renderHook(() => useQuiz());

    act(() => {
      result.current.handleStart({ amount: 1, timePerQuestion: 15 });
    });
    await waitFor(() => expect(result.current.state.questions).toHaveLength(1));

    act(() => result.current.handleAnswer('a'));
    act(() => result.current.handleNext());

    const stateBefore = result.current.state;

    act(() => result.current.handleRetryWrong());

    expect(result.current.state).toBe(stateBefore);
  });
});
