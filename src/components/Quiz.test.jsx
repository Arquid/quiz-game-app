import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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

  it('moves focus to the "Next Question" button once an answer is shown', async () => {
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

    expect(screen.getByRole('button', { name: /Next Question/i })).toHaveFocus();
  });

  it('regression: extra Enter presses on the result screen do not duplicate history entries', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));
    await user.keyboard('{Enter}');
    await screen.findByText('Quiz Completed!');

    await user.keyboard('{Enter}{Enter}');

    expect(JSON.parse(localStorage.getItem('quizHistory'))).toHaveLength(1);
  });

  it('regression: Enter on "Play Again" restarts without adding a history entry', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));
    await user.keyboard('{Enter}');
    await screen.findByText('Quiz Completed!');

    screen.getByRole('button', { name: /Play Again/i }).focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('quizHistory'))).toHaveLength(1);
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

  it('clears the results history from the result screen', async () => {
    mockApi({
      questions: [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }],
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<Quiz />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: /Next Question/i }));
    expect(await screen.findByText('Recent Results')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Clear History/i }));

    expect(screen.queryByText('Recent Results')).not.toBeInTheDocument();
    expect(localStorage.getItem('quizHistory')).toBeNull();
  });

  describe('screen reader announcements', () => {
    const oneQuestion = [{ question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] }];

    it('has a polite status region that starts empty and announces a correct answer', async () => {
      mockApi({ questions: oneQuestion });
      const user = userEvent.setup();
      render(<Quiz />);

      await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
      await screen.findByRole('button', { name: 'Right' });
      const status = screen.getByRole('status');
      expect(status).toBeEmptyDOMElement();

      await user.click(screen.getByRole('button', { name: 'Right' }));

      expect(status).toHaveTextContent('Correct!');
    });

    it('announces a wrong answer with the correct one, and clears the message for the next question', async () => {
      mockApi({
        questions: [
          { question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
          { question: 'Q2', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
        ],
      });
      const user = userEvent.setup();
      render(<Quiz />);

      await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
      await user.click(await screen.findByRole('button', { name: 'Wrong' }));
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Wrong. The correct answer is Right.');

      await user.click(screen.getByRole('button', { name: /Next Question/i }));

      expect(await screen.findByText('Q2')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    describe('with a ticking clock', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      it('announces the time left only at 10 and 5 seconds, not every second', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        localStorage.setItem('quizSettings', JSON.stringify({ amount: 1, timePerQuestion: 15 }));
        mockApi({ questions: oneQuestion });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Quiz />);

        await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
        await screen.findByRole('button', { name: 'Right' });
        const status = screen.getByRole('status');
        expect(status).toBeEmptyDOMElement();

        for (let second = 1; second <= 5; second++) await act(async () => vi.advanceTimersByTime(1000));
        expect(status).toHaveTextContent('10 seconds left');

        await act(async () => vi.advanceTimersByTime(1000));
        expect(status).toBeEmptyDOMElement();

        for (let second = 1; second <= 4; second++) await act(async () => vi.advanceTimersByTime(1000));
        expect(status).toHaveTextContent('5 seconds left');
      });

      it('announces that time is up together with the correct answer', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        localStorage.setItem('quizSettings', JSON.stringify({ amount: 1, timePerQuestion: 5 }));
        mockApi({ questions: oneQuestion });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<Quiz />);

        await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
        await screen.findByRole('button', { name: 'Right' });

        for (let second = 1; second <= 6; second++) await act(async () => vi.advanceTimersByTime(1000));

        expect(screen.getByRole('status')).toHaveTextContent('Time is up. The correct answer is Right.');
      });
    });
  });
});
