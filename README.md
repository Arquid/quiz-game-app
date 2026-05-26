# 🧠 Quiz App (React)

A modern quiz application built with React. Users can customize quiz settings, answer timed questions, and see their results at the end.

---

## 🚀 Features

* 🎯 Custom quiz settings (amount, category, difficulty, type)
* ⏱ Timer for each question
* 📊 Progress bar (questions + time)
* ✅ Instant answer feedback (correct / wrong)
* 🔁 Restart quiz anytime
* ⚠️ Error handling for API issues
* 🎲 Randomized answer order

---

## 🛠️ Tech Stack

* **React (Hooks)**
* **Axios**
* **SCSS**
* **Open Trivia DB API**

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

---

## 🌐 API

This project uses:

👉 https://opentdb.com/

---

## 📁 Project Structure

```
src/
│
├── components/
│   ├── Quiz.jsx
│   ├── Question.jsx
│   ├── Progress.jsx
│   ├── Result.jsx
│   └── Settings.jsx
│
├── stylesheets/
│   ├── quiz.scss
│   ├── question.scss
│   ├── progress.scss
│   ├── result.scss
│   └── settings.scss
│
└── App.jsx
```

---

## 🧠 How It Works

1. User selects quiz settings
2. Questions are fetched from the API
3. Answers are shuffled randomly
4. Timer starts for each question
5. User selects an answer
6. Correct answer is shown
7. Score is calculated at the end

---

## ⚠️ Known Limitations

* Timer is currently fixed (default 15s)
* No persistent storage (settings reset on refresh)
* No animations yet

---

## 💡 Future Improvements

* 🌙 Dark mode
* 💾 Save settings (localStorage)
* 📊 Detailed statistics (accuracy, streaks)
* 🔊 Sound effects
* 🎨 Animations & UI polish
* ⏱ Custom time per question

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
