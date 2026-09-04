import React from "react";
import "../stylesheets/result.scss";
import { getHistory } from "../utils/history";

function getBestStreak(log) {
  let best = 0;
  let current = 0;
  for (const entry of log) {
    current = entry.isCorrect ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

function Result({ score, totalQuestions, answerLog, onRestart, onRetryWrong }) {
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const bestStreak = getBestStreak(answerLog);
  const wrongAnswers = answerLog.filter((entry) => !entry.isCorrect);
  const history = getHistory();

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

      {wrongAnswers.length > 0 && (
        <div className="review">
          <h3>Review your wrong answers</h3>
          <ul>
            {wrongAnswers.map((entry, index) => (
              <li key={index}>
                <p className="review-question">{entry.question}</p>
                <p className="review-answer wrong">
                  Your answer: {entry.selectedAnswer ?? "No answer (time ran out)"}
                </p>
                <p className="review-answer correct">Correct answer: {entry.correctAnswer}</p>
              </li>
            ))}
          </ul>
          <button className="retry-button" onClick={onRetryWrong}>
            Retry Wrong Answers
          </button>
        </div>
      )}

      <button onClick={onRestart}>Play Again</button>

      {history.length > 0 && (
        <div className="history">
          <h3>Recent Results</h3>
          <ul>
            {history.map((entry, index) => (
              <li key={index}>
                <span className="history-date">{new Date(entry.date).toLocaleDateString()}</span>
                <span className="history-score">{entry.score} / {entry.totalQuestions}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Result;