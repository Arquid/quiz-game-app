import { useEffect } from "react";
import Question from "./Question";
import Result from "./Result";
import Settings from "./Settings";
import Progress from "./Progress";
import "../stylesheets/quiz.scss";
import { useQuiz } from "../hooks/useQuiz";

function Quiz() {
  const { state, handleAnswer, handleNext, handleStart, handleRestart, handleCancel, handleRetryWrong } = useQuiz();
  const {
    questions,
    currentQuestionIndex,
    score,
    showResult,
    settings,
    error,
    timeLeft,
    showAnswer,
    selectedAnswer,
    answerLog,
  } = state;

  const timePerQuestion = settings?.timePerQuestion || 15;
  const isLoading = settings && questions.length === 0 && !error;

  useEffect(() => {
    if (!showAnswer) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, handleNext]);

  if (!settings) return <Settings onStart={handleStart} />;

  if (isLoading) return (
    <div className="loading">
      <div className="spinner"></div>
      Loading questions...
    </div>
  );

  if (error) return (
    <div className="error">
      <p>{error}</p>
      <button onClick={handleRestart}>Back to Settings</button>
    </div>
  );

  return showResult ? (
    <Result
      score={score}
      totalQuestions={questions.length}
      onRestart={handleRestart}
      onRetryWrong={handleRetryWrong}
      answerLog={answerLog}
    />
  ) : (
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="cancel-button" onClick={handleCancel}>
          Cancel Quiz
        </button>
      </div>
      <Progress
        current={currentQuestionIndex + 1}
        total={questions.length}
        timeLeft={timeLeft}
        timePerQuestion={timePerQuestion}
      />
      { !questions[currentQuestionIndex] ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading questions...
        </div>
      ) : (
        <Question
          key={currentQuestionIndex}
          data={questions[currentQuestionIndex]}
          onAnswer={handleAnswer}
          showAnswer={showAnswer}
          selectedAnswer={selectedAnswer}
        />
      )}
      {showAnswer && (
        <button className="next-button" onClick={handleNext}>
          Next Question
        </button>
      )}
    </div>
  );
}

export default Quiz;