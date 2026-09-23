import { test, expect } from '@playwright/test';

test.describe('Production deployment smoke test', () => {
  test('serves the built app, not raw source files', async ({ page }) => {
    const failedRequests = [];
    page.on('response', (response) => {
      if (!response.ok() && response.request().resourceType() !== 'document') {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('./');

    expect(failedRequests).toEqual([]);

    const scriptSrcs = await page.$$eval('script[src]', (els) => els.map((el) => el.src));
    expect(scriptSrcs.length).toBeGreaterThan(0);
    for (const src of scriptSrcs) {
      expect(src).not.toContain('/src/');
    }
  });

  test('loads the quiz settings screen and can start a quiz', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('heading', { name: 'Quiz Settings' })).toBeVisible();

    await page.getByRole('button', { name: 'Start Quiz' }).click();

    await expect(page.getByRole('button', { name: 'Cancel Quiz' })).toBeVisible();
    await expect(page.locator('.options button').first()).toBeVisible();
  });
});
