import React, { useState } from "react";
import Quiz from "./components/Quiz";
import "./stylesheets/app.scss";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <button
        className="theme-toggle"
        onClick={() => setDarkMode((prev) => !prev)}
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
      <Quiz />
    </div>
  );
}

export default App;