import React from "react";
import "../stylesheets/question.scss";

function Question({ data, onAnswer, showAnswer, selectedAnswer }) {
  return (
    <div className="question">
      <h2>{data.question}</h2>
      <div className="options">
        {data.options.map((option) => {
          let className = "";
          if (showAnswer) {
            if (option === data.correctAnswer) {
              className = "correct";
            } else if (option === selectedAnswer) {
              className = "wrong";
            }
          }

          return (
            <button
              key={option}
              className={className}
              onClick={() => !showAnswer && onAnswer(option)}
              disabled={showAnswer}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Question;