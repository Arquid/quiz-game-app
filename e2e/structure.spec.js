import { test, expect } from '@playwright/test';

const questions = [1, 2].map((n) => ({
  type: 'multiple',
  difficulty: 'easy',
  category: 'x',
  question: `Question ${n}?`,
  correct_answer: 'Right',
  incorrect_answers: ['W1', 'W2', 'W3'],
}));

async function mockApi(page, { apiStatus = 200 } = {}) {
  await page.route('https://opentdb.com/api_category.php', (route) =>
    route.fulfill({ json: { trivia_categories: [{ id: 9, name: 'General Knowledge' }] } })
  );
  await page.route('https://opentdb.com/api.php**', (route) =>
    apiStatus === 200
      ? route.fulfill({ json: { response_code: 0, results: questions } })
      : route.fulfill({ status: apiStatus, json: { response_code: 5, results: [] } })
  );
  await page.addInitScript(() =>
    localStorage.setItem('quizSettings', JSON.stringify({ amount: 2, timePerQuestion: 60 }))
  );
}

// Checks the page structure that screen reader users navigate by: one banner, one main, one h1,
// no skipped heading levels, and no visible text outside a landmark.
async function structureProblems(page) {
  await page.waitForTimeout(700); // let fade-in / slide-in animations finish
  return page.evaluate(() => {
    const problems = [];

    const count = (selector) => document.querySelectorAll(selector).length;
    if (count('header') !== 1) problems.push(`expected 1 <header> banner, found ${count('header')}`);
    if (count('main') !== 1) problems.push(`expected 1 <main>, found ${count('main')}`);
    if (count('h1') !== 1) problems.push(`expected 1 <h1>, found ${count('h1')}`);

    const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
    if (levels[0] !== 1) problems.push(`first heading is h${levels[0]}, expected h1`);
    levels.forEach((level, i) => {
      if (i > 0 && level > levels[i - 1] + 1) problems.push(`heading level jumps from h${levels[i - 1]} to h${level}`);
    });

    for (const el of document.body.querySelectorAll('*')) {
      const hasOwnText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (!hasOwnText) continue;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      if (style.display === 'none' || style.visibility === 'hidden' || (rect.width === 0 && rect.height === 0)) continue;
      if (!el.closest('header, main')) problems.push(`text outside a landmark: <${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 24)}"`);
    }

    return [...new Set(problems)];
  });
}

test('every screen has a banner, one main landmark, one h1 and logical headings', async ({ page }) => {
  await mockApi(page);
  await page.goto('./');
  await expect(page.getByRole('main').getByRole('heading', { level: 2, name: 'Quiz Settings' })).toBeVisible();
  const settings = await structureProblems(page);

  await page.getByRole('button', { name: 'Start Quiz' }).click();
  await expect(page.locator('.options button').first()).toBeVisible();
  const question = await structureProblems(page);

  await page.getByRole('button', { name: 'W1' }).click();
  await expect(page.locator('.options button.wrong')).toBeVisible();
  const answered = await structureProblems(page);

  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'W1' }).click();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Quiz Completed!')).toBeVisible();
  const result = await structureProblems(page);

  expect.soft(settings, 'settings').toEqual([]);
  expect.soft(question, 'question').toEqual([]);
  expect.soft(answered, 'answered question').toEqual([]);
  expect.soft(result, 'result').toEqual([]);
});

test('the error screen also stays inside the landmarks', async ({ page }) => {
  await mockApi(page, { apiStatus: 429 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Quiz' }).click();
  await expect(page.locator('.error')).toBeVisible();

  expect(await structureProblems(page), 'error screen').toEqual([]);
});
