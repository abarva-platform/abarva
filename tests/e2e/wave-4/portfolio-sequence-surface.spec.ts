import { expect, test } from '@playwright/test';

import {
  buildPortfolioSequenceView,
  type PortfolioSequenceViewModel,
} from '../../../src/lib/tower/portfolio-sequence-view';

function renderSurface(clientKey: string, clientName: string): string {
  const model = buildPortfolioSequenceView({ clientKey, clientName });
  return `<!doctype html><html><body><main>${renderSequenceHtml(model)}</main></body></html>`;
}

function renderSequenceHtml(model: PortfolioSequenceViewModel): string {
  if (model.dataBasis === 'empty') {
    return `
      <section data-testid="portfolio-sequence-view" aria-label="Portfolio sequencing">
        <h2>No sequence is available for ${escapeHtml(model.clientName)} yet.</h2>
        <p>${escapeHtml(model.disclosure)}</p>
      </section>
    `;
  }

  const quarters = model.quarters.map((quarter) => `
    <article data-testid="portfolio-sequence-quarter-${escapeHtml(quarter.quarterId)}">
      <h3>${escapeHtml(quarter.quarterId)}</h3>
      <p>${escapeHtml(quarter.totalValueLabel)}</p>
      ${quarter.moves.map((move) => `<p>${escapeHtml(move.name)} ${escapeHtml(move.phase)} ${escapeHtml(move.reasoning)}</p>`).join('')}
      ${quarter.blockedMoves.map((move) => `<p>${escapeHtml(move.name)} blocked by ${escapeHtml(move.blockedBy.join(', '))}. ${escapeHtml(move.recommendedAction)}</p>`).join('')}
    </article>
  `).join('');
  const overlaps = model.overlaps.map((overlap) => `
    <p>${escapeHtml(overlap.moveA)} and ${escapeHtml(overlap.moveB)} overlap on ${escapeHtml(overlap.overlapKpi)}. ${escapeHtml(overlap.recommendation)}</p>
  `).join('');

  return `
    <section data-testid="portfolio-sequence-view" aria-label="Portfolio sequencing">
      <h2>What to run next, and what not to run together.</h2>
      <p>${escapeHtml(model.clientName)}</p>
      <p>${escapeHtml(model.disclosure)}</p>
      <p>scheduled moves ${model.scheduledMoves}</p>
      <p>blocked moves ${model.blockedMoves}</p>
      <h3>Value overlaps to clean up</h3>
      ${quarters}
      ${overlaps}
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

test.describe('Wave 4 portfolio sequencing surface', () => {
  test('renders the primary Tower sequence workflow without page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.setContent(renderSurface('apexretail', 'Apex Retail Group'), {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByTestId('portfolio-sequence-view')).toBeVisible();
    await expect(page.getByRole('heading', { name: /What to run next/ })).toBeVisible();
    await expect(page.getByText('scheduled moves')).toBeVisible();
    await expect(page.getByText('blocked moves')).toBeVisible();
    await expect(page.getByText('Value overlaps to clean up')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/signal:[0-9a-f-]{8,}/i);
    expect(errors).toEqual([]);
  });

  test('keeps Meridian content scoped away from Apex and SkyHarbor terms', async ({ page }) => {
    await page.setContent(renderSurface('meridian', 'Meridian Health System'), {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Meridian Health System')).toBeVisible();
    await expect(page.locator('body')).toContainText('Ambient Clinical Documentation');
    await expect(page.locator('body')).not.toContainText(/Store Associate Productivity AI|Crew Recovery AI|SkyHarbor|Apex Retail/i);
    await expect(page.locator('body')).not.toContainText(/\bMER-[A-Z-]+\b|tenant_id|client_id|signal:/i);
  });

  test('keeps SkyHarbor content scoped away from Apex and Meridian terms', async ({ page }) => {
    await page.setContent(renderSurface('skyharbor', 'SkyHarbor Air'), {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('SkyHarbor Air')).toBeVisible();
    await expect(page.locator('body')).toContainText('Crew Recovery AI');
    await expect(page.locator('body')).not.toContainText(/Ambient Clinical Documentation|Store Associate Productivity AI|Meridian|Apex Retail/i);
    await expect(page.locator('body')).not.toContainText(/\bSKY-[A-Z-]+\b|tenant_id|client_id|signal:/i);
  });

  test('renders an honest empty state for unsupported clients', async ({ page }) => {
    await page.setContent(renderSurface('unknown-client', 'Unknown Client'), {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('heading', { name: /No sequence is available/ })).toBeVisible();
    await expect(page.getByText('No portfolio-sequencing substrate is available')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Apex Retail|Meridian|SkyHarbor|signal:|tenant_id|client_id/i);
  });
});
