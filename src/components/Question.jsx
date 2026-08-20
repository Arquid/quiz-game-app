import React, { useEffect, useRef } from "react";
import "../stylesheets/question.scss";

function Question({ data, onAnswer, showAnswer, selectedAnswer }) {
  const buttonRefs = useRef([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAnswer) return;

      const index = Number(e.key) - 1;
      if (index >= 0 && index < data.options.length) {
        onAnswer(data.options[index]);
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = buttonRefs.current.findIndex((btn) => btn === document.activeElement);
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (currentIndex + direction + data.options.length) % data.options.length;
        buttonRefs.current[nextIndex]?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data.options, showAnswer, onAnswer]);

  return (
    <div className="question">
      <h2>{data.question}</h2>
      <div className="options">
        {data.options.map((option, index) => {
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
              ref={(el) => (buttonRefs.current[index] = el)}
              className={className}
              onClick={() => !showAnswer && onAnswer(option)}
              disabled={showAnswer}
            >
              <span className="option-number" aria-hidden="true">{index + 1}</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Question;