import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Result from './Result';

const makeEntry = (isCorrect, overrides = {}) => ({
  question: 'Sample question?',
  selectedAnswer: isCorrect ? 'Right' : 'Wrong',
  correctAnswer: 'Right',
  isCorrect,
  ...overrides,
});

describe('Result', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the score, accuracy, and best streak for a mixed answer log', () => {
    const answerLog = [makeEntry(true), makeEntry(true), makeEntry(false), makeEntry(true), makeEntry(false)];
    render(<Result score={3} totalQuestions={5} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.getByText('Your score: 3 / 5')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('reports a best streak that spans the whole log when never missed', () => {
    const answerLog = [makeEntry(true), makeEntry(true), makeEntry(true), makeEntry(true)];
    render(<Result score={4} totalQuestions={4} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('regression: does not render NaN% when totalQuestions is 0', () => {
    render(<Result score={0} totalQuestions={0} answerLog={[]} onRestart={() => {}} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('calls onRestart when "Play Again" is clicked', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    const answerLog = [makeEntry(true), makeEntry(false)];
    render(<Result score={1} totalQuestions={2} answerLog={answerLog} onRestart={onRestart} />);

    await user.click(screen.getByRole('button', { name: /Play Again/i }));

    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('lists only the wrong answers in the review section, with question and correct answer', () => {
    const answerLog = [
      makeEntry(true, { question: 'Q1' }),
      makeEntry(false, { question: 'Q2', selectedAnswer: 'Maybe', correctAnswer: 'Definitely' }),
    ];
    render(<Result score={1} totalQuestions={2} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.queryByText('Q1')).not.toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
    expect(screen.getByText(/Your answer: Maybe/)).toBeInTheDocument();
    expect(screen.getByText(/Correct answer: Definitely/)).toBeInTheDocument();
  });

  it('does not render a review section when every answer was correct', () => {
    const answerLog = [makeEntry(true), makeEntry(true)];
    render(<Result score={2} totalQuestions={2} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.queryByText(/Review your wrong answers/i)).not.toBeInTheDocument();
  });

  it('shows a fallback message when time ran out instead of an answer', () => {
    const answerLog = [makeEntry(false, { question: 'Q1', selectedAnswer: null, correctAnswer: 'X' })];
    render(<Result score={0} totalQuestions={1} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.getByText(/Your answer: No answer \(time ran out\)/)).toBeInTheDocument();
  });

  it('shows a "Retry Wrong Answers" button when there are wrong answers, and calls onRetryWrong', async () => {
    const user = userEvent.setup();
    const onRetryWrong = vi.fn();
    const answerLog = [makeEntry(true), makeEntry(false)];
    render(<Result score={1} totalQuestions={2} answerLog={answerLog} onRestart={() => {}} onRetryWrong={onRetryWrong} />);

    await user.click(screen.getByRole('button', { name: /Retry Wrong Answers/i }));

    expect(onRetryWrong).toHaveBeenCalledTimes(1);
  });

  it('does not show a "Retry Wrong Answers" button when every answer was correct', () => {
    const answerLog = [makeEntry(true), makeEntry(true)];
    render(<Result score={2} totalQuestions={2} answerLog={answerLog} onRestart={() => {}} onRetryWrong={() => {}} />);

    expect(screen.queryByRole('button', { name: /Retry Wrong Answers/i })).not.toBeInTheDocument();
  });

  it('shows past results from history when available', () => {
    localStorage.setItem(
      'quizHistory',
      JSON.stringify([{ date: '2026-01-01T00:00:00.000Z', score: 4, totalQuestions: 5 }])
    );
    const answerLog = [makeEntry(true)];
    render(<Result score={1} totalQuestions={1} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.getByText('Recent Results')).toBeInTheDocument();
    expect(screen.getByText('4 / 5')).toBeInTheDocument();
  });

  it('does not show a history section when there is no saved history', () => {
    const answerLog = [makeEntry(true)];
    render(<Result score={1} totalQuestions={1} answerLog={answerLog} onRestart={() => {}} />);

    expect(screen.queryByText('Recent Results')).not.toBeInTheDocument();
  });
});