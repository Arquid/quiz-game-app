import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Settings from './Settings';

vi.mock('axios');

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    axios.get.mockResolvedValue({ data: { trivia_categories: [] } });
  });

  it('regression: entering 0 in "Number of Questions" clamps to 1 on blur, not silently to 10', () => {
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Number of Questions/i);
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(1);
  });

  it('clamps "Number of Questions" to the 50 maximum on blur', async () => {
    const user = userEvent.setup();
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Number of Questions/i);
    await user.clear(input);
    await user.type(input, '999');
    await user.tab();

    expect(input).toHaveValue(50);
  });

  it('regression: typing "20" into "Time per Question" stays 20 instead of becoming 50', async () => {
    const user = userEvent.setup();
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Time per Question/i);
    await user.clear(input);
    await user.type(input, '20');
    expect(input).toHaveValue(20);

    await user.tab();
    expect(input).toHaveValue(20);
  });

  it.each([
    ['2', 5],
    ['99', 60],
    ['', 5],
  ])('clamps "Time per Question" input %j to %i on blur', async (typed, expected) => {
    const user = userEvent.setup();
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Time per Question/i);
    await user.clear(input);
    if (typed) await user.type(input, typed);
    await user.tab();

    expect(input).toHaveValue(expected);
  });

  it('regression: clearing "Number of Questions" and typing 5 gives 5, not 15', async () => {
    const user = userEvent.setup();
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Number of Questions/i);
    await user.clear(input);
    await user.type(input, '5');

    expect(input).toHaveValue(5);
  });

  it('sends clamped numbers to onStart even if the field was never blurred', async () => {
    const onStart = vi.fn();
    render(<Settings onStart={onStart} />);

    fireEvent.change(screen.getByLabelText(/Number of Questions/i), { target: { value: '999' } });
    fireEvent.change(screen.getByLabelText(/Time per Question/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ amount: 50, timePerQuestion: 5 }));
    expect(JSON.parse(localStorage.getItem('quizSettings'))).toMatchObject({ amount: 50, timePerQuestion: 5 });
  });

  it('saves settings to localStorage and calls onStart when starting the quiz', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<Settings onStart={onStart} />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('quizSettings'))).toMatchObject({ amount: 10, timePerQuestion: 15 });
  });

  it('restores previously saved settings on mount', () => {
    localStorage.setItem('quizSettings', JSON.stringify({ amount: 7, timePerQuestion: 25, difficulty: 'easy' }));

    render(<Settings onStart={() => {}} />);

    expect(screen.getByLabelText(/Number of Questions/i)).toHaveValue(7);
    expect(screen.getByLabelText(/Time per Question/i)).toHaveValue(25);
  });

  it.each([
    ['amount is not a number', { amount: 'abc' }, /Number of Questions/i, 10],
    ['amount is too large', { amount: 9999 }, /Number of Questions/i, 10],
    ['amount is zero', { amount: 0 }, /Number of Questions/i, 10],
    ['amount is a fraction', { amount: 7.5 }, /Number of Questions/i, 10],
    ['amount is a numeric string', { amount: '7' }, /Number of Questions/i, 10],
    ['time is too large', { timePerQuestion: 9999 }, /Time per Question/i, 15],
    ['time is below the minimum', { timePerQuestion: 2 }, /Time per Question/i, 15],
    ['time is a numeric string', { timePerQuestion: '20' }, /Time per Question/i, 15],
  ])('regression: falls back to the default when saved %s', (_name, saved, label, expected) => {
    localStorage.setItem('quizSettings', JSON.stringify(saved));

    render(<Settings onStart={() => {}} />);

    expect(screen.getByLabelText(label)).toHaveValue(expected);
  });

  it.each([
    ['difficulty', { difficulty: 'zzz' }, /Difficulty/i],
    ['type', { type: 'zzz' }, /Question Type/i],
    ['category (not an id)', { category: 'abc' }, /Category/i],
    ['category (a number instead of a string)', { category: 42 }, /Category/i],
  ])('regression: ignores an invalid saved %s', (_name, saved, label) => {
    localStorage.setItem('quizSettings', JSON.stringify(saved));

    render(<Settings onStart={() => {}} />);

    expect(screen.getByLabelText(label)).toHaveValue('');
  });

  it.each([['null'], ['[]'], ['"text"'], ['42'], ['not json']])(
    'regression: does not crash and uses defaults when the saved settings are %s',
    (stored) => {
      localStorage.setItem('quizSettings', stored);

      render(<Settings onStart={() => {}} />);

      expect(screen.getByLabelText(/Number of Questions/i)).toHaveValue(10);
      expect(screen.getByLabelText(/Time per Question/i)).toHaveValue(15);
    }
  );

  it('keeps the valid saved fields when other saved fields are invalid', async () => {
    axios.get.mockResolvedValue({ data: { trivia_categories: [{ id: 9, name: 'General Knowledge' }] } });
    localStorage.setItem(
      'quizSettings',
      JSON.stringify({ amount: 7, timePerQuestion: 9999, category: '9', difficulty: 'hard', type: 'zzz' })
    );

    render(<Settings onStart={() => {}} />);
    await screen.findByRole('option', { name: 'General Knowledge' });

    expect(screen.getByLabelText(/Number of Questions/i)).toHaveValue(7);
    expect(screen.getByLabelText(/Time per Question/i)).toHaveValue(15);
    expect(screen.getByLabelText(/Category/i)).toHaveValue('9');
    expect(screen.getByLabelText(/Difficulty/i)).toHaveValue('hard');
    expect(screen.getByLabelText(/Question Type/i)).toHaveValue('');
  });

  it('regression: starting with corrupted saved settings sends valid values to the API layer', () => {
    localStorage.setItem(
      'quizSettings',
      JSON.stringify({ amount: 'abc', timePerQuestion: 9999, category: 42, difficulty: 'zzz' })
    );
    const onStart = vi.fn();
    render(<Settings onStart={onStart} />);

    fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

    expect(onStart).toHaveBeenCalledWith({ amount: 10, category: '', difficulty: '', type: '', timePerQuestion: 15 });
  });

  it('no longer shows a "Clear History" button (it lives on the result screen)', () => {
    localStorage.setItem('quizHistory', JSON.stringify([{ date: '2026-01-01', score: 3, totalQuestions: 5 }]));
    render(<Settings onStart={() => {}} />);

    expect(screen.queryByRole('button', { name: /Clear History/i })).not.toBeInTheDocument();
  });
});
