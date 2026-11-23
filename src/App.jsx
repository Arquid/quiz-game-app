import React, { useState } from "react";
import Quiz from "./components/Quiz";
import { setMuted } from "./utils/sound";
import "./stylesheets/app.scss";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  };

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <header className="app-controls">
        <h1 className="visually-hidden">Quiz App</h1>
        <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button className={`mute-toggle ${isMuted ? "muted" : ""}`} onClick={toggleMute}>
          {isMuted ? "🔇 Muted" : "🔊 Sound On"}
        </button>
      </header>
      <main>
        <Quiz />
      </main>
    </div>
  );
}

export default App;