import { test, expect } from '@playwright/test';

const questions = [1, 2].map((n) => ({
  type: 'multiple',
  difficulty: 'easy',
  category: 'x',
  question: `Question ${n}?`,
  correct_answer: 'Right',
  incorrect_answers: ['W1', 'W2', 'W3'],
}));

async function mockApi(page, { categoriesStatus = 200, apiStatus = 200, timePerQuestion = 60 } = {}) {
  await page.route('https://opentdb.com/api_category.php', (route) =>
    categoriesStatus === 200
      ? route.fulfill({ json: { trivia_categories: [{ id: 9, name: 'General Knowledge' }] } })
      : route.fulfill({ status: categoriesStatus, json: {} })
  );
  await page.route('https://opentdb.com/api.php**', (route) =>
    apiStatus === 200
      ? route.fulfill({ json: { response_code: 0, results: questions } })
      : route.fulfill({ status: apiStatus, json: { response_code: 5, results: [] } })
  );
  await page.addInitScript(
    (seconds) => localStorage.setItem('quizSettings', JSON.stringify({ amount: 2, timePerQuestion: seconds })),
    timePerQuestion
  );
}

// Finds visible text whose contrast against its real background is below WCAG AA (4.5:1, or 3:1 for large text).
// Disabled controls are exempt under WCAG, except the revealed correct / wrong answers, which must stay readable.
async function findContrastFailures(page) {
  await page.waitForTimeout(700); // let fade-in / slide-in animations finish
  return page.evaluate(() => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1,
    });
    const luminance = ({ r, g, b }) => {
      const [R, G, B] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const backgroundOf = (el) => {
      const chain = [];
      for (let node = el; node; node = node.parentElement) chain.unshift(node);
      return chain.reduce((base, node) => {
        const bg = parse(getComputedStyle(node).backgroundColor);
        return bg && bg.a > 0 ? over(bg, base) : base;
      }, { r: 255, g: 255, b: 255, a: 1 });
    };
    const opacityOf = (el) => {
      let opacity = 1;
      for (let node = el; node; node = node.parentElement) opacity *= parseFloat(getComputedStyle(node).opacity);
      return opacity;
    };

    const failures = [];
    for (const el of document.querySelectorAll('.app *')) {
      const hasOwnText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (!hasOwnText) continue;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) continue;
      if (el.closest(':disabled') && !el.closest('.correct, .wrong')) continue;

      const fgRaw = parse(style.color);
      if (!fgRaw) {
        failures.push(`${el.tagName.toLowerCase()}: could not parse color "${style.color}"`);
        continue;
      }
      const bg = backgroundOf(el);
      const opacity = opacityOf(el);
      const fgSolid = over(fgRaw, bg);
      const fg = opacity < 1 ? over({ ...fgSolid, a: opacity }, bg) : fgSolid;

      const [lighter, darker] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
      const ratio = (lighter + 0.05) / (darker + 0.05);
      const size = parseFloat(style.fontSize);
      const bold = parseInt(style.fontWeight, 10) >= 700;
      const required = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (ratio < required) {
        const label = `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().replace(/\s+/g, '.') : ''}`;
        failures.push(`${label} "${el.textContent.trim().slice(0, 22)}" ${ratio.toFixed(2)}:1 (needs ${required}:1)`);
      }
    }
    return [...new Set(failures)];
  });
}

for (const theme of ['light', 'dark']) {
  test.describe(`${theme} theme`, () => {
    test('quiz screens meet WCAG AA text contrast', async ({ page }) => {
      await mockApi(page);
      await page.goto('./');
      if (theme === 'dark') await page.locator('.theme-toggle').click();

      const settings = await findContrastFailures(page);

      await page.getByRole('button', { name: 'Start Quiz' }).click();
      await expect(page.locator('.options button').first()).toBeVisible();
      const question = await findContrastFailures(page);

      await page.getByRole('button', { name: 'W1' }).click(); // a wrong answer shows both .wrong and .correct
      await expect(page.locator('.options button.wrong')).toBeVisible();
      const answered = await findContrastFailures(page);

      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'W1' }).click();
      await page.keyboard.press('Enter');
      await expect(page.getByText('Quiz Completed!')).toBeVisible();
      const result = await findContrastFailures(page);

      expect.soft(settings, 'settings').toEqual([]);
      expect.soft(question, 'question').toEqual([]);
      expect.soft(answered, 'answered question').toEqual([]);
      expect.soft(result, 'result (review, history, buttons)').toEqual([]);
    });

    test('low-time warning keeps the seconds readable', async ({ page }) => {
      await mockApi(page, { timePerQuestion: 5 });
      await page.goto('./');
      if (theme === 'dark') await page.locator('.theme-toggle').click();

      await page.getByRole('button', { name: 'Start Quiz' }).click();
      await expect(page.locator('.time-progress.low-time')).toBeVisible();

      expect(await findContrastFailures(page), 'question while the low-time pulse runs').toEqual([]);
    });

    test('error messages meet WCAG AA text contrast', async ({ page }) => {
      await mockApi(page, { categoriesStatus: 500, apiStatus: 429 });
      await page.goto('./');
      if (theme === 'dark') await page.locator('.theme-toggle').click();
      await expect(page.locator('.category-error')).toBeVisible();
      const categoryError = await findContrastFailures(page);

      await page.getByRole('button', { name: 'Start Quiz' }).click();
      await expect(page.locator('.error')).toBeVisible();
      const quizError = await findContrastFailures(page);

      expect.soft(categoryError, 'category error').toEqual([]);
      expect.soft(quizError, 'quiz error').toEqual([]);
    });
  });
}
