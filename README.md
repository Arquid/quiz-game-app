# 🧠 Quiz App (React)

A modern quiz application built with React. Users can customize quiz settings, answer timed questions, and see their results at the end.

---

## 🚀 Features

* 🎯 Custom quiz settings (amount, category, difficulty, type)
* ⏱ Custom timer per question
* 📊 Progress bar (questions + time)
* ✅ Instant answer feedback (correct / wrong)
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

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/your-username/quiz-app.git
cd quiz-app
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

1. User selects quiz settings (including time per question)
2. Questions are fetched from the API
3. Answers are shuffled randomly
4. Timer starts for each question
5. User selects an answer (or the quiz can be cancelled at any time)
6. Correct answer is shown
7. Score is calculated at the end

---

## ⚠️ Known Limitations

* No persistent storage (settings reset on refresh)
* No animations yet

---

## 💡 Future Improvements

* 🌙 Dark mode
* 💾 Save settings (localStorage)
* 📊 Detailed statistics (accuracy, streaks)
* 🔊 Sound effects
* 🎨 Animations & UI polish

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
