import React from "react";
import "../stylesheets/result.scss";

function getBestStreak(log) {
  let best = 0;
  let current = 0;
  for (const isCorrect of log) {
    current = isCorrect ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

function Result({ score, totalQuestions, answerLog, onRestart }) {
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const bestStreak = getBestStreak(answerLog);

  return (
    <div className="result">
      <h2>Quiz Completed!</h2>
      <p>Your score: {score} / {totalQuestions}</p>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value">{bestStreak}</span>
          <span className="stat-label">Best Streak</span>
        </div>
      </div>
      <button onClick={onRestart}>Play Again</button>
    </div>
  );
}

export default Result;