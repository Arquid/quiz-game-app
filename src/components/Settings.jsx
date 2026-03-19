import React, { useEffect, useState} from "react";
import axios from "axios";
import "../stylesheets/settings.scss";

function Settings({ onStart }) {
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState(10);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    axios.get("https://opentdb.com/api_category.php")
      .then(response => setCategories(response.data.trivia_categories))
      .catch(error => console.error("Error fetching categories:", error));
  }, []);

  const startQuiz = () => {
    onStart({ amount, category, difficulty, type });
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
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value) || 10)}
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
      <button onClick={startQuiz}>Start Quiz</button>
    </div>
  );
}

export default Settings;