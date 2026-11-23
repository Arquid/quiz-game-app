import React from "react";
import "../stylesheets/progress.scss";

function Progress({ current, total, timeLeft, timePerQuestion }) {
  const questionPercentage = total > 0 ? (current / total) * 100 : 0;
  const timePercentage = timePerQuestion > 0 ? (timeLeft / timePerQuestion) * 100 : 0;
  const isLowTime = timeLeft > 0 && timeLeft <= 5;

  return (
    <div className="progress-container">
      <div
        className="progress question-progress"
        role="progressbar"
        aria-label="Question progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Question ${current} of ${total}`}
      >
        <div className="progress-bar" style={{ width: `${questionPercentage}%` }}>
          {current} / {total}
        </div>
      </div>
      <div
        className={`progress time-progress ${isLowTime ? "low-time" : ""}`}
        role="timer"
        aria-label={`Time left: ${timeLeft} seconds`}
      >
        <div className="progress-bar" style={{ width: `${timePercentage}%` }}>
          {timeLeft}s
        </div>
      </div>
    </div>
  );
}

export default Progress;