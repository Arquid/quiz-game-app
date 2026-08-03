import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Quiz from './Quiz';

vi.mock('axios');
vi.mock('../utils/sound', () => ({
  playCorrectSound: vi.fn(),
  playWrongSound: vi.fn(),
  setMuted: vi.fn(),
}));

function mockApi({ questions = [], categories = [] } = {}) {
  axios.get.mockImplementation((url) => {
    if (url.includes('api_category.php')) {
      return Promise.resolve({ data: { trivia_categories: categories } });
    }
    return Promise.resolve({ data: { results: questions } });
  });
}

describe('Quiz (integration)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('shows the settings screen first', () => {
    mockApi();
    render(<Quiz />);

    expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
  });

  it('walks through a full quiz to the result screen', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));

    const rightButton = await screen.findByRole('button', { name: 'Right' });
    await user.click(rightButton);
    expect(rightButton).toHaveClass('correct');

    await user.click(screen.getByRole('button', { name: /Next Question/i }));

    expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
    expect(screen.getByText('Your score: 1 / 1')).toBeInTheDocument();
  });

  it('shows an error message when the API returns no questions', async () => {
    mockApi({ questions: [] });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));

    expect(await screen.findByText(/No questions found/i)).toBeInTheDocument();
  });

  it('cancels an in-progress quiz and returns to settings', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await screen.findByRole('button', { name: 'Right' });

    await user.click(screen.getByRole('button', { name: /Cancel Quiz/i }));

    expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
  });

  it('starts a fresh quiz after finishing, via "Play Again"', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Wrong' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));
    expect(await screen.findByText('Your score: 0 / 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Play Again/i }));

    expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
  });
});
