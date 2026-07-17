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

  it('regression: entering 0 in "Number of Questions" clamps to 1, not silently to 10', () => {
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Number of Questions/i);
    fireEvent.change(input, { target: { value: '0' } });

    expect(input).toHaveValue(1);
  });

  it('clamps "Number of Questions" to the 50 maximum', async () => {
    const user = userEvent.setup();
    render(<Settings onStart={() => {}} />);

    const input = screen.getByLabelText(/Number of Questions/i);
    await user.clear(input);
    await user.type(input, '999');

    expect(input).toHaveValue(50);
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
});
