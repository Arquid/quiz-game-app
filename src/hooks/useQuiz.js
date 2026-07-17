import { useEffect, useReducer, useCallback } from "react";
import { fetchQuizQuestions } from "../api/trivia";
import { playCorrectSound, playWrongSound } from "../utils/sound";

export const initialState = {
  settings: null,
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  showResult: false,
  error: null,
  timeLeft: 0,
  isPaused: false,
  showAnswer: false,
  selectedAnswer: null,
  answerLog: [],
};

export function quizReducer(state, action) {
  switch (action.type) {
    case "START_QUIZ":
      return {
        ...initialState,
        settings: action.settings,
        timeLeft: action.settings.timePerQuestion || 15,
      };

    case "QUESTIONS_LOADED":
      return {
        ...state,
        questions: action.questions,
        timeLeft: state.settings.timePerQuestion || 15,
      };

    case "FETCH_ERROR":
      return { ...state, error: action.message };

    case "ANSWER":
      return {
        ...state,
        selectedAnswer: action.answer,
        showAnswer: true,
        isPaused: true,
        score: action.isCorrect ? state.score + 1 : state.score,
        answerLog: [...state.answerLog, action.isCorrect],
      };

    case "NEXT_QUESTION": {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < state.questions.length) {
        return {
          ...state,
          currentQuestionIndex: nextIndex,
          showAnswer: false,
          isPaused: false,
          selectedAnswer: null,
          timeLeft: state.settings.timePerQuestion || 15,
        };
      }
      return { ...state, showResult: true };
    }

    case "TICK":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { questions, currentQuestionIndex, showResult, settings, isPaused, timeLeft, showAnswer } = state;

  const handleAnswer = useCallback((answer) => {
    const correct = questions[currentQuestionIndex].correctAnswer;
    const isCorrect = answer === correct;

    if (answer === null) {
      console.log("Time's up!");
    }

    isCorrect ? playCorrectSound() : playWrongSound();

    dispatch({ type: "ANSWER", answer, isCorrect });
  }, [questions, currentQuestionIndex]);

  const handleNext = () => {
    dispatch({ type: "NEXT_QUESTION" });
  };

  const handleStart = (newSettings) => {
    dispatch({ type: "START_QUIZ", settings: newSettings });
  };

  const handleRestart = () => {
    dispatch({ type: "RESET" });
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel the quiz?")) {
      handleRestart();
    }
  };

  useEffect(() => {
    if (!settings) return;

    fetchQuizQuestions(settings)
      .then(formattedQuestions => {
        dispatch({ type: "QUESTIONS_LOADED", questions: formattedQuestions });
      })
      .catch(err => {
        console.error("Error fetching questions:", err);

        if (err.message === "NO_QUESTIONS") {
          dispatch({ type: "FETCH_ERROR", message: "No questions found for the selected settings. Please try different options." });
        } else if (err.response?.status === 429) {
          dispatch({ type: "FETCH_ERROR", message: "Too many requests. Please try again later." });
        } else {
          dispatch({ type: "FETCH_ERROR", message: "Failed to load questions. Please check your settings and try again." });
        }
      });
  }, [settings]);

  useEffect(() => {
    if (!settings || showResult || questions.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult, questions.length, settings, isPaused]);

  useEffect(() => {
    if (timeLeft <= 0 && !showAnswer && questions.length > 0 && !showResult) {
      handleAnswer(null);
    }
  }, [timeLeft, showAnswer, questions.length, showResult, handleAnswer]);

  return { state, handleAnswer, handleNext, handleStart, handleRestart, handleCancel };
}