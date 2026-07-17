import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchQuizQuestions } from './trivia';

vi.mock('axios');

describe('fetchQuizQuestions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('builds the request URL from the given settings', async () => {
    axios.get.mockResolvedValue({
      data: { results: [{ question: 'Q', correct_answer: 'A', incorrect_answers: ['B'] }] },
    });

    await fetchQuizQuestions({ amount: 5, category: '9', difficulty: 'easy', type: 'multiple' });

    const calledUrl = axios.get.mock.calls[0][0];
    expect(calledUrl).toContain('https://opentdb.com/api.php?');
    expect(calledUrl).toContain('amount=5');
    expect(calledUrl).toContain('category=9');
    expect(calledUrl).toContain('difficulty=easy');
    expect(calledUrl).toContain('type=multiple');
  });

  it('omits empty optional filters from the URL', async () => {
    axios.get.mockResolvedValue({
      data: { results: [{ question: 'Q', correct_answer: 'A', incorrect_answers: ['B'] }] },
    });

    await fetchQuizQuestions({ amount: 5, category: '', difficulty: '', type: '' });

    const calledUrl = axios.get.mock.calls[0][0];
    expect(calledUrl).not.toContain('category=');
    expect(calledUrl).not.toContain('difficulty=');
    expect(calledUrl).not.toContain('type=');
  });

  it('decodes HTML entities and includes the correct answer among the options', async () => {
    axios.get.mockResolvedValue({
      data: {
        results: [
          {
            question: 'What&#039;s 2 + 2?',
            correct_answer: 'Four',
            incorrect_answers: ['Three', 'Five', 'Six'],
          },
        ],
      },
    });

    const questions = await fetchQuizQuestions({ amount: 1 });

    expect(questions).toHaveLength(1);
    expect(questions[0].question).toBe("What's 2 + 2?");
    expect(questions[0].correctAnswer).toBe('Four');
    expect(questions[0].options).toContain('Four');
    expect(questions[0].options).toHaveLength(4);
  });

  it('throws a NO_QUESTIONS error when the API returns no results', async () => {
    axios.get.mockResolvedValue({ data: { results: [] } });

    await expect(fetchQuizQuestions({ amount: 5 })).rejects.toThrow('NO_QUESTIONS');
  });

  it('propagates network/HTTP errors from axios (e.g. 429) unchanged', async () => {
    const rateLimitError = { response: { status: 429 } };
    axios.get.mockRejectedValue(rateLimitError);

    await expect(fetchQuizQuestions({ amount: 5 })).rejects.toBe(rateLimitError);
  });
});
