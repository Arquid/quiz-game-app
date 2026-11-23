const TIME_WARNINGS = [10, 5];

export function getAnnouncement({ showAnswer, answerLog, timeLeft, timePerQuestion }) {
  if (showAnswer) {
    const last = answerLog[answerLog.length - 1];
    if (!last) return "";
    if (last.isCorrect) return "Correct!";
    if (last.selectedAnswer === null) return `Time is up. The correct answer is ${last.correctAnswer}.`;
    return `Wrong. The correct answer is ${last.correctAnswer}.`;
  }

  if (timeLeft < timePerQuestion && TIME_WARNINGS.includes(timeLeft)) {
    return `${timeLeft} seconds left`;
  }

  return "";
}