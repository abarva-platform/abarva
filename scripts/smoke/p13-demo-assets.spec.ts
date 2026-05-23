import { expect, test } from '@playwright/test';

test('P13 public IT-productivity comparison loads with both answer columns and egress copy', async ({ page }) => {
  await page.goto('/how-it-works/it-productivity-comparison/');

  await expect(page.getByRole('heading', { name: 'Same CTO question. Different operating answer.' })).toBeVisible();
  await expect(page.getByText('Cached generic LLM baseline')).toBeVisible();
  await expect(page.locator('.p13-column--sentinel .p13-eyebrow')).toHaveText('AbarVa Sentinel answer');
  await expect(page.getByText('Citation density')).toBeVisible();
  await expect(page.getByText('Dissent presence')).toBeVisible();
  await expect(page.getByText('Move workflow')).toBeVisible();
  await expect(page.getByText('Version-pinned audit')).toBeVisible();
  await expect(
    page.getByText(
      'Every model call governed by tenant policy, classified by data sensitivity, redacted as needed, logged for audit',
    ),
  ).toBeVisible();
});

test('P13 public framework teaser exposes six patterns and login CTA', async ({ page }) => {
  await page.goto('/how-it-works/frameworks/ai-it-productivity/');

  await expect(page.getByRole('heading', { name: 'AI IT productivity is a portfolio decision, not a seat rollout.' })).toBeVisible();
  await expect(page.locator('.p13-pattern-card')).toHaveCount(6);
  await expect(page.getByText('P-IT-01')).toBeVisible();
  await expect(page.getByText('P-SRC-01')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Full corpus - login required' })).toBeVisible();
});
