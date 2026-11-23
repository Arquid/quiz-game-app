import { test, expect } from '@playwright/test';

const questions = [1, 2].map((n) => ({
  type: 'multiple',
  difficulty: 'easy',
  category: 'x',
  question: `Question ${n}?`,
  correct_answer: 'Right',
  incorrect_answers: ['W1', 'W2', 'W3'],
}));

async function startQuiz(page, timePerQuestion) {
  await page.clock.install();
  await page.route('https://opentdb.com/api_category.php', (route) =>
    route.fulfill({ json: { trivia_categories: [{ id: 9, name: 'General Knowledge' }] } })
  );
  await page.route('https://opentdb.com/api.php**', (route) =>
    route.fulfill({ json: { response_code: 0, results: questions } })
  );
  await page.addInitScript(
    (seconds) => localStorage.setItem('quizSettings', JSON.stringify({ amount: 2, timePerQuestion: seconds })),
    timePerQuestion
  );
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Quiz' }).click();
  await expect(page.locator('.options button').first()).toBeVisible();
}

const tick = async (page, seconds) => {
  for (let i = 0; i < seconds; i++) await page.clock.runFor(1000);
};

test('the countdown is a timer and the question progress is a progressbar', async ({ page }) => {
  await startQuiz(page, 15);

  await expect(page.getByRole('timer')).toHaveAccessibleName(/^Time left: \d+ seconds$/);
  const progress = page.getByRole('progressbar', { name: 'Question progress' });
  await expect(progress).toHaveAttribute('aria-valuetext', 'Question 1 of 2');
  await expect(progress).toHaveAttribute('aria-valuemax', '2');
});

test('time warnings are announced at 10 and 5 seconds only, and answers are announced politely', async ({ page }) => {
  await startQuiz(page, 15);
  const status = page.getByRole('status');
  await expect(status).toHaveText('');

  await tick(page, 5);
  await expect(status).toHaveText('10 seconds left');
  await tick(page, 1);
  await expect(status).toHaveText('');
  await tick(page, 4);
  await expect(status).toHaveText('5 seconds left');

  await page.getByRole('button', { name: 'W1' }).click();
  await expect(status).toHaveText('Wrong. The correct answer is Right.');

  await page.keyboard.press('Enter');
  await expect(page.getByText('Question 2?')).toBeVisible();
  await expect(status).toHaveText('');

  await page.getByRole('button', { name: 'Right' }).click();
  await expect(status).toHaveText('Correct!');
});

test('running out of time is announced together with the correct answer', async ({ page }) => {
  await startQuiz(page, 5);

  await tick(page, 6);

  await expect(page.getByRole('status')).toHaveText('Time is up. The correct answer is Right.');
});
