import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Result from './Result';

describe('Result', () => {
  it('shows the score, accuracy, and best streak for a mixed answer log', () => {
    render(
      <Result
        score={3}
        totalQuestions={5}
        answerLog={[true, true, false, true, false]}
        onRestart={() => {}}
      />
    );

    expect(screen.getByText('Your score: 3 / 5')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('reports a best streak that spans the whole log when never missed', () => {
    render(
      <Result
        score={4}
        totalQuestions={4}
        answerLog={[true, true, true, true]}
        onRestart={() => {}}
      />
    );

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
    render(<Result score={1} totalQuestions={2} answerLog={[true, false]} onRestart={onRestart} />);

    await user.click(screen.getByRole('button', { name: /Play Again/i }));

    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
