import React from "react";
import "../stylesheets/progress.scss";

function Progress({ current, total, timeLeft, timePerQuestion }) {
  const questionPercentage = total > 0 ? (current / total) * 100 : 0;
  const timePercentage = timePerQuestion > 0 ? (timeLeft / timePerQuestion) * 100 : 0;

  return (
    <div className="progress-container">
      <div className="progress question-progress">
        <div className="progress-bar" style={{ width: `${questionPercentage}%` }}>
          {current} / {total}
        </div>
      </div>
      <div className="progress time-progress">
        <div className="progress-bar" style={{ width: `${timePercentage}%` }}>
          {timeLeft}s
        </div>
      </div>
    </div>
  );
}

export default Progress;