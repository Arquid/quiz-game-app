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

  it('no longer shows a "Clear History" button (it lives on the result screen)', () => {
    localStorage.setItem('quizHistory', JSON.stringify([{ date: '2026-01-01', score: 3, totalQuestions: 5 }]));
    render(<Settings onStart={() => {}} />);

    expect(screen.queryByRole('button', { name: /Clear History/i })).not.toBeInTheDocument();
  });
});
