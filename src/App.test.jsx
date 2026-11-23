import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from './App';
import { setMuted } from './utils/sound';

vi.mock('axios');
vi.mock('./utils/sound', () => ({
  playCorrectSound: vi.fn(),
  playWrongSound: vi.fn(),
  setMuted: vi.fn(),
}));

function mockApi(questions) {
  axios.get.mockImplementation((url) =>
    url.includes('api_category.php')
      ? Promise.resolve({ data: { trivia_categories: [] } })
      : Promise.resolve({ data: { results: questions } })
  );
}

const twoQuestions = [
  { question: 'Q1', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
  { question: 'Q2', correct_answer: 'Right', incorrect_answers: ['Wrong'] },
];

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockApi(twoQuestions);
  });

  it('has exactly one level-1 heading, and it comes before every other heading', () => {
    render(<App />);

    const level1 = screen.getAllByRole('heading', { level: 1 });

    expect(level1).toHaveLength(1);
    expect(level1[0]).toHaveTextContent('Quiz App');
    expect(screen.getAllByRole('heading')[0]).toBe(level1[0]);
  });

  it('puts the display controls in the banner and the quiz in the main landmark', () => {
    render(<App />);

    const banner = screen.getByRole('banner');
    const main = screen.getByRole('main');

    expect(within(banner).getByRole('button', { name: /Dark Mode/i })).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: /Sound On/i })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { level: 2, name: 'Quiz Settings' })).toBeInTheDocument();
    expect(within(main).getByRole('button', { name: /Start Quiz/i })).toBeInTheDocument();
  });

  it('keeps every quiz screen inside the main landmark', async () => {
    const user = userEvent.setup();
    render(<App />);
    const main = screen.getByRole('main');

    await user.click(within(main).getByRole('button', { name: /Start Quiz/i }));
    await user.click(await within(main).findByRole('button', { name: 'Right' }));
    expect(within(main).getByRole('button', { name: /Next Question/i })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    await user.click(await within(main).findByRole('button', { name: 'Right' }));
    await user.keyboard('{Enter}');

    expect(within(main).getByRole('heading', { level: 2, name: 'Quiz Completed!' })).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('toggles dark mode on the app wrapper', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const app = container.querySelector('.app');

    expect(app).not.toHaveClass('dark');

    await user.click(screen.getByRole('button', { name: /Dark Mode/i }));
    expect(app).toHaveClass('dark');
    expect(screen.getByRole('button', { name: /Light Mode/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Light Mode/i }));
    expect(app).not.toHaveClass('dark');
  });

  it('toggles mute and tells the sound module', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Sound On/i }));
    expect(setMuted).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: /Muted/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Muted/i }));
    expect(setMuted).toHaveBeenLastCalledWith(false);
  });

  it('regression: Enter on the focused Dark Mode button only toggles the theme and does not advance the quiz', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));
    await user.click(await screen.findByRole('button', { name: 'Right' }));
    expect(screen.getByText('Q1')).toBeInTheDocument();

    screen.getByRole('button', { name: /Dark Mode/i }).focus();
    await user.keyboard('{Enter}');

    expect(container.querySelector('.app')).toHaveClass('dark');
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.queryByText('Q2')).not.toBeInTheDocument();
  });
});
