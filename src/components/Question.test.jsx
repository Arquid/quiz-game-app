import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Question from './Question';

const data = {
  question: 'What is 2 + 2?',
  options: ['3', '4', '5'],
  correctAnswer: '4',
};

describe('Question', () => {
  it('calls onAnswer with the clicked option before an answer is shown', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<Question data={data} onAnswer={onAnswer} showAnswer={false} selectedAnswer={null} />);

    await user.click(screen.getByRole('button', { name: '4' }));

    expect(onAnswer).toHaveBeenCalledWith('4');
  });

  it('highlights the correct answer in green once revealed', () => {
    render(<Question data={data} onAnswer={() => {}} showAnswer={true} selectedAnswer="3" />);

    expect(screen.getByRole('button', { name: '4' })).toHaveClass('correct');
  });

  it('highlights the selected wrong answer in red once revealed', () => {
    render(<Question data={data} onAnswer={() => {}} showAnswer={true} selectedAnswer="3" />);

    expect(screen.getByRole('button', { name: '3' })).toHaveClass('wrong');
  });

  it('disables all options once the answer is shown', () => {
    render(<Question data={data} onAnswer={() => {}} showAnswer={true} selectedAnswer="4" />);

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('ignores clicks after the answer is already shown', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<Question data={data} onAnswer={onAnswer} showAnswer={true} selectedAnswer="4" />);

    await user.click(screen.getByRole('button', { name: '3' }));

    expect(onAnswer).not.toHaveBeenCalled();
  });
});
