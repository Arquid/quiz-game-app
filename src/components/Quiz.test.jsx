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

  it('advances to the next question when Enter is pressed after answering', async () => {
    mockApi({
      questions: [
        { question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
        { question: 'Q2', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
      ],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));

    await user.keyboard('{Enter}');

    expect(await screen.findByText('Q2')).toBeInTheDocument();
  });

  it('lists a wrong answer in the result screen review section, end to end', async () => {
    mockApi({
      questions: [{ question: 'What is 2 + 2?', correct_answer: '4', incorrect_answers: ['5'] }],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));

    expect(await screen.findByText('Review your wrong answers')).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText(/Your answer: 5/)).toBeInTheDocument();
    expect(screen.getByText(/Correct answer: 4/)).toBeInTheDocument();
  });

  it('retries only the wrong questions without calling the API again', async () => {
    mockApi({
      questions: [
        { question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
        { question: 'Q2', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
      ],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));
    await user.click(await screen.findByRole('button', { name: 'Wrong' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));

    await screen.findByText('Quiz Completed!');
    const callsBeforeRetry = axios.get.mock.calls.length;

    await user.click(screen.getByRole('button', { name: /Retry Wrong Answers/i }));

    expect(await screen.findByText('Q2')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(axios.get.mock.calls.length).toBe(callsBeforeRetry);
  });

  it('shows the previous run in "Recent Results" the second time the quiz finishes', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));
    await screen.findByText('Quiz Completed!');

    await user.click(screen.getByRole('button', { name: /Play Again/i }));
    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Wrong' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));

    expect(await screen.findByText('Recent Results')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });
});
