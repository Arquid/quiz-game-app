import { test, expect } from '@playwright/test';

const questions = [1, 2].map((n) => ({
  type: 'multiple',
  difficulty: 'easy',
  category: 'x',
  question: `Question ${n}?`,
  correct_answer: 'Right',
  incorrect_answers: ['W1', 'W2', 'W3'],
}));

const viewports = [
  { name: 'phone 375', width: 375, height: 667 },
  { name: 'tablet 700', width: 700, height: 900 },
  { name: 'narrow laptop 800', width: 800, height: 600 },
  { name: 'desktop 1280', width: 1280, height: 720 },
];

const CONTENT =
  'h2, h3, p, label, select, input, .stat, .history li, .review li, .options button, .cancel-button, .next-button, .progress-bar, .settings > button, .result > button';

async function mockApi(page) {
  await page.route('https://opentdb.com/api_category.php', (route) =>
    route.fulfill({ json: { trivia_categories: [{ id: 9, name: 'General Knowledge' }] } })
  );
  await page.route('https://opentdb.com/api.php**', (route) =>
    route.fulfill({ json: { response_code: 0, results: questions } })
  );
  await page.addInitScript(() =>
    localStorage.setItem('quizSettings', JSON.stringify({ amount: 2, timePerQuestion: 60 }))
  );
}

async function measureLayout(page) {
  await page.waitForTimeout(700); // let the fade-in / slide-in animations finish
  return page.evaluate((selector) => {
    const controls = document.querySelector('.app-controls').getBoundingClientRect();
    const view = document.querySelector('.settings, .quiz-container, .result');
    const overlapping = [];

    for (const el of view.querySelectorAll(selector)) {
      let rect;
      if (el.matches('select, input, button, .progress-bar')) {
        rect = el.getBoundingClientRect();
      } else {
        const range = document.createRange();
        range.selectNodeContents(el);
        rect = range.getBoundingClientRect();
      }
      if (rect.width === 0 || rect.height === 0) continue;

      const overlaps = !(
        rect.right <= controls.left ||
        controls.right <= rect.left ||
        rect.bottom <= controls.top ||
        controls.bottom <= rect.top
      );
      if (overlaps) overlapping.push(`${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 24)}`);
    }

    const viewRect = view.getBoundingClientRect();
    return {
      overlapping,
      gutterLeft: Math.round(viewRect.left),
      gutterRight: Math.round(window.innerWidth - viewRect.right),
      horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, CONTENT);
}

for (const viewport of viewports) {
  test.describe(`layout at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('fixed controls never cover content and cards keep a side gutter', async ({ page }) => {
      await mockApi(page);
      await page.goto('./');

      const settings = await measureLayout(page);

      await page.getByRole('button', { name: 'Start Quiz' }).click();
      await expect(page.locator('.options button').first()).toBeVisible();
      const quiz = await measureLayout(page);

      await page.keyboard.press('1');
      await page.keyboard.press('Enter');
      await page.keyboard.press('1');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Quiz Completed!')).toBeVisible();
      const result = await measureLayout(page);

      for (const [view, layout] of [['settings', settings], ['quiz', quiz], ['result', result]]) {
        expect(layout.overlapping, `${view}: content under the Dark Mode / Sound On buttons`).toEqual([]);
        expect(layout.horizontalScroll, `${view}: horizontal scroll`).toBe(false);
        if (viewport.width <= 430) {
          expect(layout.gutterLeft, `${view}: left gutter`).toBeGreaterThanOrEqual(16);
          expect(layout.gutterRight, `${view}: right gutter`).toBeGreaterThanOrEqual(16);
        }
      }
    });
  });
}
