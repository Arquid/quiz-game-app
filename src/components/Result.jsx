import React from "react";
import "../stylesheets/result.scss";

function Result({ score, totalQuestions, onRestart }) {
  return (
    <div className="result">
      <h2>Quiz Completed!</h2>
      <p>Your score: {score} / {totalQuestions}</p>
      <button onClick={onRestart}>Play Again</button>
    </div>
  );
}

export default Result;