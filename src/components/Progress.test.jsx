import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Progress from './Progress';

describe('Progress', () => {
  it('renders normal percentages without issue', () => {
    render(<Progress current={2} total={5} timeLeft={10} timePerQuestion={15} />);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('regression: does not render NaN% when total is 0', () => {
    const { container } = render(<Progress current={0} total={0} timeLeft={0} timePerQuestion={15} />);
    const bars = container.querySelectorAll('.progress-bar');
    bars.forEach((bar) => {
      expect(bar.style.width).not.toContain('NaN');
    });
  });

  it('regression: does not render NaN% when timePerQuestion is 0', () => {
    const { container } = render(<Progress current={1} total={5} timeLeft={0} timePerQuestion={0} />);
    const bars = container.querySelectorAll('.progress-bar');
    bars.forEach((bar) => {
      expect(bar.style.width).not.toContain('NaN');
    });
  });

  it('exposes the question progress as a progressbar with readable values', () => {
    render(<Progress current={2} total={5} timeLeft={10} timePerQuestion={15} />);

    const bar = screen.getByRole('progressbar', { name: 'Question progress' });

    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuetext', 'Question 2 of 5');
  });

  it('exposes the countdown as a timer that is not announced every second', () => {
    render(<Progress current={1} total={5} timeLeft={13} timePerQuestion={15} />);

    const timer = screen.getByRole('timer', { name: 'Time left: 13 seconds' });

    expect(timer).toBeInTheDocument();
    expect(timer).not.toHaveAttribute('aria-live');
  });

  it('adds a low-time warning class when 5 seconds or less remain', () => {
    const { container } = render(<Progress current={1} total={5} timeLeft={5} timePerQuestion={15} />);
    expect(container.querySelector('.time-progress')).toHaveClass('low-time');
  });

  it('does not add the low-time warning class above the 5 second threshold', () => {
    const { container } = render(<Progress current={1} total={5} timeLeft={6} timePerQuestion={15} />);
    expect(container.querySelector('.time-progress')).not.toHaveClass('low-time');
  });

  it('does not add the low-time warning class once time has fully run out', () => {
    const { container } = render(<Progress current={1} total={5} timeLeft={0} timePerQuestion={15} />);
    expect(container.querySelector('.time-progress')).not.toHaveClass('low-time');
  });
});
