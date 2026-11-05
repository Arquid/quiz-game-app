import React, { useEffect, useMemo, useState} from "react";
import axios from "axios";
import "../stylesheets/settings.scss";

const STORAGE_KEY = "quizSettings";

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? sanitizeSettings(JSON.parse(saved)) : {};
  } catch {
    return {};
  }
}

const AMOUNT_LIMITS = { min: 1, max: 50 };
const TIME_LIMITS = { min: 5, max: 60 };

const clampToLimits = (raw, { min, max }) => {
  const value = parseInt(raw, 10);
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const DIFFICULTIES = ["", "easy", "medium", "hard"];
const QUESTION_TYPES = ["", "multiple", "boolean"];

const isInRange = (value, { min, max }) => Number.isInteger(value) && value >= min && value <= max;

function sanitizeSettings(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};

  const clean = {};
  if (isInRange(raw.amount, AMOUNT_LIMITS)) clean.amount = raw.amount;
  if (isInRange(raw.timePerQuestion, TIME_LIMITS)) clean.timePerQuestion = raw.timePerQuestion;
  if (typeof raw.category === "string" && /^\d*$/.test(raw.category)) clean.category = raw.category;
  if (DIFFICULTIES.includes(raw.difficulty)) clean.difficulty = raw.difficulty;
  if (QUESTION_TYPES.includes(raw.type)) clean.type = raw.type;
  return clean;
}

function Settings({ onStart }) {
  const savedSettings = useMemo(() => getSavedSettings(), []);

  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(null);
  const [category, setCategory] = useState(savedSettings.category ?? "");
  const [difficulty, setDifficulty] = useState(savedSettings.difficulty ?? "");
  const [type, setType] = useState(savedSettings.type ?? "");
  const [amountInput, setAmountInput] = useState(String(savedSettings.amount ?? 10));
  const [timeInput, setTimeInput] = useState(String(savedSettings.timePerQuestion ?? 15));

  useEffect(() => {
    axios.get("https://opentdb.com/api_category.php")
      .then(response => setCategories(response.data.trivia_categories))
      .catch(error => {
        console.error("Error fetching categories:", error);
        setCategoryError("Category loading failed. You can start with all categories.");
      });
  }, []);

  const startQuiz = () => {
    const amount = clampToLimits(amountInput, AMOUNT_LIMITS);
    const timePerQuestion = clampToLimits(timeInput, TIME_LIMITS);
    const newSettings = { amount, category, difficulty, type, timePerQuestion };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    onStart(newSettings);
  };

  return (
    <div className="settings">
      <h2>Quiz Settings</h2>
      <label>
        Number of Questions:
        <input
          type="number"
          min="1"
          max="50"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          onBlur={() => setAmountInput(String(clampToLimits(amountInput, AMOUNT_LIMITS)))}
        />
      </label>
      <label>
        Time per Question (seconds):
        <input
          type="number"
          min="5"
          max="60"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onBlur={() => setTimeInput(String(clampToLimits(timeInput, TIME_LIMITS)))}
        />
      </label>
      <label>
        Category:
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Difficulty:
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <label>
        Question Type:
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="multiple">Multiple Choice</option>
          <option value="boolean">True/False</option>
        </select>
      </label>
      {categoryError && <p className="category-error">{categoryError}</p>}
      <button onClick={startQuiz}>Start Quiz</button>
    </div>
  );
}

export default Settings;