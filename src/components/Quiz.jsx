import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import he from "he";
import Question from "./Question";
import Result from "./Result";
import Settings from "./Settings";
import Progress from "./Progress";
import "../stylesheets/quiz.scss";

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const timePerQuestion = settings?.timePerQuestion || 15;

  const handleAnswer = useCallback((answer) => {
    setSelectedAnswer(answer);
    const correct = questions[currentQuestionIndex].correctAnswer;

    if (answer === null) {
      console.log("Time's up!");
    } else if (answer === correct) {
      setScore((prev) => prev + 1);
    }

    setShowAnswer(true); 
    setIsPaused(true);

  }, [questions, currentQuestionIndex]);

  const handleNext = () => {
    setShowAnswer(false);
    setIsPaused(false);
    setTimeLeft(timePerQuestion);
    setSelectedAnswer(null);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) setCurrentQuestionIndex(nextIndex);
    else setShowResult(true);
  };

  useEffect(() => {
    if (!settings) return;

    const params = new URLSearchParams({
      amount: settings.amount,
      ...(settings.category && { category: settings.category }),
      ...(settings.difficulty && { difficulty: settings.difficulty }),
      ...(settings.type && { type: settings.type }),
    });

    const url = `https://opentdb.com/api.php?${params}`;

    axios.get(url)
      .then(response => {
        const results = response.data.results;

        if (results.length === 0) {
          setError("No questions found for the selected settings. Please try different options.");
          return;
        }

        const formattedQuestions = results.map(question => ({
          question: he.decode(question.question),
          options: shuffle([...question.incorrect_answers, question.correct_answer].map(ans => he.decode(ans))),
          correctAnswer: he.decode(question.correct_answer)
        }));

        setQuestions(formattedQuestions);
        setTimeLeft(timePerQuestion);
      })
      .catch(error => {
        console.error("Error fetching questions:", error);

        if (error.response?.status === 429) {
          setError("Too many requests. Please try again later.");
        } else {
          setError("Failed to load questions. Please check your settings and try again.");
        }
      });
  }, [settings, timePerQuestion]);

  useEffect(() => {
    if (!settings || showResult || questions.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null);
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult, questions.length, settings, isPaused, handleAnswer]);

  const handleStart = (newSettings) => {
    setSettings(newSettings);
    setShowResult(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuestions([]);
    setError(null);
    setTimeLeft(newSettings.timePerQuestion || 15);
    setShowAnswer(false);
    setIsPaused(false);
  };

  const handleRestart = () => {
    setSettings(null);
    setShowResult(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuestions([]);
    setError(null);
    setTimeLeft(timePerQuestion);
    setShowAnswer(false);
    setIsPaused(false);
  };

  const isLoading = settings && questions.length === 0 && !error;

  if (!settings) return <Settings onStart={handleStart} />;

  if (isLoading) return <div className="loading">Loading questions...</div>;

  if (error) return (
    <div className="error">
      <p>{error}</p>
      <button onClick={handleRestart}>Back to Settings</button>
    </div>
  );

  return showResult ? (
    <Result score={score} totalQuestions={questions.length} onRestart={handleRestart} />
  ) : (
    <div className="quiz-container">
      <Progress
        current={currentQuestionIndex + 1}
        total={questions.length}
        timeLeft={timeLeft}
        timePerQuestion={timePerQuestion}
      />
      { !questions[currentQuestionIndex] ? (
        <div className="loading">Loading questions...</div>
      ) : (
        <Question
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