# 🧠 Quiz App (React)

![CI](https://github.com/Arquid/quiz-game-app/actions/workflows/ci.yml/badge.svg)

A modern quiz application built with React. Users can customize quiz settings, answer timed questions, and see their results at the end.

---

## 🚀 Features

* 🎯 Custom quiz settings (amount, category, difficulty, type)
* ⏱ Custom timer per question
* 💾 Settings saved automatically (localStorage)
* 🌙 Dark mode toggle
* 🔊 Sound effects with mute toggle
* 🎨 Animations (transitions, answer feedback, loading spinner)
* 📊 Progress bar (questions + time)
* ✅ Instant answer feedback (correct / wrong)
* 📈 Detailed results (accuracy % and best streak)
* 🔍 Review of wrong answers at the end (your answer vs. the correct one)
* 🛑 Cancel quiz anytime and return to settings
* 🔁 Restart quiz anytime
* ⚠️ Error handling for API issues (questions & categories)
* 🎲 Randomized answer order

---

## 🛠️ Tech Stack

* **React (Hooks)**
* **Axios**
* **SCSS**
* **Open Trivia DB API**
* **Vitest + React Testing Library** (unit & component tests)
* **GitHub Actions** (CI: lint, test, and build on every push/PR)

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/Arquid/quiz-game-app.git
cd quiz-game-app
```

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run the tests:

```bash
npm test
```

---

## 🌐 API

This project uses:

👉 https://opentdb.com/

---

## 📁 Project Structure

```
src/
│
├── api/
│   ├── trivia.js
│   └── trivia.test.js
│
├── components/
│   ├── Quiz.jsx
│   ├── Quiz.test.jsx
│   ├── Question.jsx
│   ├── Question.test.jsx
│   ├── Progress.jsx
│   ├── Progress.test.jsx
│   ├── Result.jsx
│   ├── Result.test.jsx
│   ├── Settings.jsx
│   └── Settings.test.jsx
│
├── hooks/
│   ├── useQuiz.js
│   └── useQuiz.test.js
│
├── stylesheets/
│   ├── quiz.scss
│   ├── question.scss
│   ├── progress.scss
│   ├── result.scss
│   ├── settings.scss
│   └── app.scss
│
├── test/
│   └── setup.js
│
├── utils/
│   ├── sound.js
│   └── sound.test.js
│
└── App.jsx
```

Tests live next to the files they cover (e.g. `Progress.jsx` + `Progress.test.jsx`), which is the standard convention for Vitest/React projects — it keeps a test in sync automatically when its file is moved or renamed.

---

## 🧠 How It Works

1. User selects quiz settings (including time per question) — settings are remembered for next time
2. Questions are fetched from the API
3. Answers are shuffled randomly
4. Timer starts for each question
5. User selects an answer (or the quiz can be cancelled at any time)
6. Correct answer is shown, with sound feedback (unless muted)
7. Score, accuracy, and best streak are calculated at the end
8. Any wrong answers are listed for review, alongside the correct answer

---

## 🤝 Contributing

Pull requests are welcome!
If you have ideas for improvements, feel free to open an issue.

---

## 📄 License

MIT License

---

## 👤 Author

Arto Kujala
GitHub: https://github.com/Arquid
