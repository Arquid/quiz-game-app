import axios from "axios";
import he from "he";

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export async function fetchQuizQuestions(settings) {
  const params = new URLSearchParams({
    amount: settings.amount,
    ...(settings.category && { category: settings.category }),
    ...(settings.difficulty && { difficulty: settings.difficulty }),
    ...(settings.type && { type: settings.type }),
  });

  const url = `https://opentdb.com/api.php?${params}`;
  const response = await axios.get(url);
  const results = response.data.results;

  if (results.length === 0) {
    throw new Error("NO_QUESTIONS");
  }

  return results.map(question => ({
    question: he.decode(question.question),
    options: shuffle([...question.incorrect_answers, question.correct_answer].map(ans => he.decode(ans))),
    correctAnswer: he.decode(question.correct_answer)
  }));
}