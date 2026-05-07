// Per-page extractor. We classify the page into one of the entity
// types from the spec, pull the visible structured data, and find any
// agent touchpoints on the surface.
//
// AbarVa-specific shortcut: when a known data-testid is present we
// trust it; otherwise we fall back to heuristic DOM walking so this
// same extractor works against any sourcing platform.

import type { Page } from 'playwright';
import type { AgentTouchpoint, EntityType, SnapshotRow } from './types.js';
import { applyPiiRedaction, isWriteLabel } from './safety.js';

const STAGE_HINTS = [
  'strategy',
  'scope',
  'rfp',
  'response',
  'evaluation',
  'pricing',
  'bafo',
  'decision',
  'selection',
  'transition',
  'value',
];

export async function extractPage(
  page: Page,
  url: string,
  parent: string | null,
  capturedAt: string,
): Promise<{
  snapshot: SnapshotRow;
  touchpoints: AgentTouchpoint[];
  pageBytes: number;
  bodyText: string;
}> {
  const html = await page.content();
  const bodyText = (await page.textContent('body').catch(() => '')) ?? '';
  const pageBytes = Buffer.byteLength(html, 'utf8');

  const entityType = await classifyPage(page, url);
  const payload = await extractEntityPayload(page, entityType);
  const outboundLinks = await extractIntraTenantLinks(page, url);
  const touchpoints = await extractTouchpoints(page, url);

  const snapshot: SnapshotRow = {
    url,
    captured_at: capturedAt,
    entity_type: entityType,
    entity_payload: applyPiiRedaction(payload) as Record<string, unknown>,
    outbound_intra_links: outboundLinks,
  };

  return { snapshot, touchpoints, pageBytes, bodyText };
}

async function classifyPage(page: Page, url: string): Promise<EntityType> {
  // AbarVa-specific data-testid checks first — fast path for our app.
  const testid =
    (await page.getAttribute('main', 'data-testid').catch(() => null)) ?? '';

  if (testid === 'source-portfolio-page') return 'events';
  if (testid.startsWith('source-canvas')) return 'events';
  if (/\/source\/events\/[^/]+(?:\/|$)/.test(url)) return 'events';
  if (/\/source\/?$/.test(url)) return 'events';
  if (/\/source\/new(?:\/|$)/.test(url)) return 'events';

  // Generic platform fallbacks.
  if (/\/(suppliers?|vendors?)\b/i.test(url)) return 'suppliers';
  if (/\/categor(y|ies)\b/i.test(url)) return 'categories';
  if (/\/templates?\b/i.test(url)) return 'templates';
  if (/\/(question|library)\b/i.test(url)) return 'question_library';
  if (/\/(clauses?|playbook)\b/i.test(url)) return 'clause_library';
  if (/\/contracts?\b/i.test(url)) return 'contracts';
  if (/\/(licenses?|entitlements?)\b/i.test(url)) return 'license_baseline';
  if (/\/(pocs?|pilots?)\b/i.test(url)) return 'poc_pilots';
  if (/\/(arb|architecture-review)\b/i.test(url)) return 'arb_decisions';
  if (/\/(analytics|dashboards?|reports?)\b/i.test(url)) return 'analytics_widgets';

  return 'unclassified';
}

async function extractEntityPayload(
  page: Page,
  entity: EntityType,
): Promise<Record<string, unknown>> {
  const title =
    (await page.title().catch(() => '')) ?? '';
  const h1 =
    (await page.locator('h1').first().textContent().catch(() => '')) ?? '';
  const breadcrumbs = await page
    .locator('[aria-label="Breadcrumb"] a, nav.breadcrumb a, [data-testid*="breadcrumb"] a')
    .allTextContents()
    .catch(() => [] as string[]);

  const base: Record<string, unknown> = {
    page_title: title.trim(),
    h1: h1.trim(),
    breadcrumbs: breadcrumbs.map((c) => c.trim()).filter(Boolean),
  };

  if (entity === 'events') {
    return { ...base, ...(await extractEventsPayload(page)) };
  }
  if (entity === 'suppliers') {
    return { ...base, ...(await extractTablePayload(page, 'suppliers')) };
  }
  if (entity === 'analytics_widgets') {
    return { ...base, ...(await extractAnalyticsWidgets(page)) };
  }
  // For other entity types we fall back to the generic table grab —
  // good enough for slice 1 inventory.
  return { ...base, ...(await extractTablePayload(page, entity)) };
}

async function extractEventsPayload(
  page: Page,
): Promise<Record<string, unknown>> {
  // Detail page heuristics — look for a stage indicator and code.
  const visibleText = (await page.textContent('main').catch(() => '')) ?? '';
  const stageMatch = visibleText
    .toLowerCase()
    .match(new RegExp(`\\b(${STAGE_HINTS.join('|')})\\b`));

  // Portfolio table: capture column headers + first 3 rows of data.
  const headers = await page
    .locator('table thead th, [role="columnheader"]')
    .allTextContents()
    .catch(() => [] as string[]);
  const rows: string[][] = [];
  const rowLocator = page.locator(
    '[data-testid^="source-portfolio-row-"], table tbody tr',
  );
  const rowCount = Math.min(await rowLocator.count().catch(() => 0), 3);
  for (let i = 0; i < rowCount; i++) {
    const cells = await rowLocator
      .nth(i)
      .locator('td, [role="cell"]')
      .allTextContents()
      .catch(() => [] as string[]);
    rows.push(cells.map((c) => c.trim()).slice(0, 12));
  }

  // Detail-page sections — look for the universal canvas tabs.
  const tabs = await page
    .locator('[role="tab"], [data-testid*="-tab"]')
    .allTextContents()
    .catch(() => [] as string[]);

  return {
    visible_columns: headers.map((c) => c.trim()).filter(Boolean),
    sample_rows: rows,
    detected_stage: stageMatch?.[1] ?? null,
    workspace_tabs: tabs.map((t) => t.trim()).filter(Boolean),
    has_security_section: /\bsecurity\b/i.test(visibleText),
    has_dpa_section: /\bdpa\b|data\s+processing/i.test(visibleText),
    has_ai_addendum: /\bai\s+(addendum|risk|governance)\b/i.test(visibleText),
  };
}

async function extractTablePayload(
  page: Page,
  _entity: EntityType,
): Promise<Record<string, unknown>> {
  const headers = await page
    .locator('table thead th')
    .allTextContents()
    .catch(() => [] as string[]);
  const rowCount = await page
    .locator('table tbody tr')
    .count()
    .catch(() => 0);
  return {
    visible_columns: headers.map((c) => c.trim()).filter(Boolean),
    visible_row_count: rowCount,
  };
}

async function extractAnalyticsWidgets(
  page: Page,
): Promise<Record<string, unknown>> {
  const widgets = await page
    .locator('[data-testid*="widget"], [class*="kpi"], [class*="metric"]')
    .allTextContents()
    .catch(() => [] as string[]);
  return {
    widget_count: widgets.length,
    widget_titles_sample: widgets
      .slice(0, 6)
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

async function extractIntraTenantLinks(
  page: Page,
  currentUrl: string,
): Promise<string[]> {
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href') ?? '',
        text: (el.textContent ?? '').trim().slice(0, 120),
      })),
    )
    .catch(() => [] as Array<{ href: string; text: string }>);

  const out: string[] = [];
  const current = new URL(currentUrl);
  for (const { href, text } of hrefs) {
    if (!href) continue;
    if (href.startsWith('#')) continue;
    if (isWriteLabel(text)) continue; // never queue a "Create new" link
    let target: URL;
    try {
      target = new URL(href, currentUrl);
    } catch {
      continue;
    }
    if (target.hostname !== current.hostname) continue;
    if (target.protocol !== 'http:' && target.protocol !== 'https:') continue;
    out.push(target.toString().split('#')[0] ?? target.toString());
  }
  return Array.from(new Set(out));
}

async function extractTouchpoints(
  page: Page,
  url: string,
): Promise<AgentTouchpoint[]> {
  const touchpoints: AgentTouchpoint[] = [];

  // Pattern 1: textareas / inputs whose placeholder mentions an agent
  // name or "Ask …" / "ask anything" — that's the chat lane.
  const inputs = await page
    .locator('input, textarea')
    .evaluateAll((els) =>
      els.map((el) => ({
        placeholder: el.getAttribute('placeholder') ?? '',
        ariaLabel: el.getAttribute('aria-label') ?? '',
        testid: el.getAttribute('data-testid') ?? '',
      })),
    )
    .catch(() => [] as Array<{ placeholder: string; ariaLabel: string; testid: string }>);

  for (const i of inputs) {
    const label = i.placeholder || i.ariaLabel;
    if (!label) continue;
    if (
      /ask\s+\w+|sentinel|nexus|atlas|steward|chat\s+with/i.test(label) ||
      /^ask\b|talk\s+to\s+the\s+agent/i.test(label)
    ) {
      touchpoints.push({
        id: `${url}::input::${i.testid || label.slice(0, 32)}`,
        url,
        control_label: label,
        agent_invocation_method: 'chat',
        prompt_visible_to_user: true,
        produces_artifact: false,
        screenshot_path: null,
      });
    }
  }

  // Pattern 2: buttons whose label invokes an agent action.
  const buttons = await page
    .locator('button, [role="button"]')
    .evaluateAll((els) =>
      els.map((el) => ({
        text: (el.textContent ?? '').trim(),
        testid: el.getAttribute('data-testid') ?? '',
      })),
    )
    .catch(() => [] as Array<{ text: string; testid: string }>);

  for (const b of buttons) {
    if (!b.text) continue;
    if (isWriteLabel(b.text)) continue; // skip create/submit/etc.
    if (
      /\b(ask|run)\s+(sentinel|nexus|atlas|steward)\b/i.test(b.text) ||
      /\bgenerate\b.*\bbrief\b/i.test(b.text) ||
      /\bdraft\s+with\b/i.test(b.text)
    ) {
      touchpoints.push({
        id: `${url}::button::${b.testid || b.text.slice(0, 32)}`,
        url,
        control_label: b.text,
        agent_invocation_method: 'button',
        prompt_visible_to_user: false,
        produces_artifact: true,
        screenshot_path: null,
      });
    }
  }

  return touchpoints;
}
