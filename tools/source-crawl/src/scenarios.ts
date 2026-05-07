// Write-mode scenarios. Unlike the read-only crawler, these drive real
// mutations on the AbarVa surface: creating events, promoting stages,
// walking the canvas. Each scenario writes to its own per-run audit
// log so we can replay what happened.
//
// Scope today reflects what the surface actually supports:
//   • createEvent     — fills /source/new intake, submits, captures
//                       the resulting eventId
//   • walkCanvas      — visits every artifact card on the canvas and
//                       saves a screenshot per stage (read-heavy but
//                       tied to canvas navigation, not the inventory
//                       crawler)
//   • promoteStage    — opens the Gate tab on a given event and
//                       clicks "Promote stage". Records the URL
//                       before/after.
//
// As submit-deliverable / mark-complete buttons appear on the canvas
// (currently the Document / Evidence tabs are read-only), add their
// scenarios here. The write gate intentionally permits non-GETs in
// scenario mode — this is AbarVa-on-AbarVa, not auditing a foreign
// platform.

import type { BrowserContext, Page } from 'playwright';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CrawlConfig } from './config.js';

export type ScenarioName =
  | 'create-event'
  | 'walk-canvas'
  | 'promote-stage';

export interface ScenarioContext {
  page: Page;
  context: BrowserContext;
  cfg: CrawlConfig;
  runDir: string;
  log: (line: string) => void;
}

export function makeRunDir(cfg: CrawlConfig, name: ScenarioName): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = join(cfg.outputDir, '..', '..', 'runs', `${ts}-${name}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'audit.log'), `# ${name} · ${ts}\n\n`);
  return dir;
}

export function makeLogger(runDir: string): (line: string) => void {
  const path = join(runDir, 'audit.log');
  return (line) => {
    const stamped = `[${new Date().toISOString()}] ${line}\n`;
    appendFileSync(path, stamped);
    process.stdout.write(stamped);
  };
}

// ── Scenario 1: create event ────────────────────────────────────────────────

export interface CreateEventOptions {
  trigger: string;                 // required
  decisionOwner?: string;
  scopeBoundary?: string;
  valueTarget?: string;
  baselineOwner?: string;
  category?: 'managed_services' | 'cloud_infrastructure' | 'data_ai' | 'enterprise_software' | 'custom';
}

const DEFAULT_CREATE_EVENT: CreateEventOptions = {
  trigger:
    'AMS contract auto-renews in 60 days; CFO wants 12-15% TCO reduction with no service degradation.',
  decisionOwner: 'CIO + VP Apps',
  scopeBoundary: 'L2/L3 incident management for SAP S/4HANA + custom Java apps; excludes data engineering.',
  valueTarget: '$10M-$12M run-rate; 12-15% TCO down vs incumbent baseline.',
  baselineOwner: 'IT Procurement Lead — has 3-year incumbent invoices.',
  category: 'managed_services',
};

export async function createEvent(
  ctx: ScenarioContext,
  opts: CreateEventOptions = DEFAULT_CREATE_EVENT,
): Promise<{ eventUrl: string; eventId: string | null }> {
  const { page, cfg, log } = ctx;
  const newUrl = `${baseTenantUrl(cfg)}/source/new`;
  log(`navigate → ${newUrl}`);
  await page.goto(newUrl, { waitUntil: 'domcontentloaded' });

  // Sign-in safety check.
  if (page.url().includes('/sign-in')) {
    throw new Error(
      'Hit Clerk sign-in — saved session is missing or expired. Run `npm run save-session`.',
    );
  }

  // 1. Optional category — click first matching card by visible text.
  const categoryLabel = categoryLabelFor(opts.category);
  if (categoryLabel) {
    const card = page.locator(`text="${categoryLabel}"`).first();
    if ((await card.count()) > 0) {
      log(`click category → ${categoryLabel}`);
      await card.click({ trial: false });
    } else {
      log(`category card not found: ${categoryLabel} (skipping)`);
    }
  }

  // 2. Fill the intake textareas. We match by placeholder substring
  // because the testarea elements don't have stable testids today.
  const fields: Array<{ key: keyof CreateEventOptions; placeholderSubstr: string }> = [
    { key: 'trigger', placeholderSubstr: 'Renewal date, spend pressure' },
    { key: 'decisionOwner', placeholderSubstr: 'Decision owner' },
    { key: 'scopeBoundary', placeholderSubstr: 'Scope boundary' },
    { key: 'valueTarget', placeholderSubstr: 'Value target' },
    { key: 'baselineOwner', placeholderSubstr: 'Baseline owner' },
  ];

  for (const { key, placeholderSubstr } of fields) {
    const value = (opts as unknown as Record<string, string | undefined>)[key];
    if (!value) continue;
    const ta = page.locator(`textarea[placeholder*="${placeholderSubstr}" i]`).first();
    if ((await ta.count()) === 0) {
      // Fallback by aria-label or label text.
      log(`textarea not found by placeholder "${placeholderSubstr}" (skipping ${key})`);
      continue;
    }
    log(`fill ${key} (${value.length} chars)`);
    await ta.fill(value);
  }

  // 3. Click submit.
  const submit = page.getByRole('button', { name: /open sourcing event/i }).first();
  if ((await submit.count()) === 0) {
    throw new Error('Submit button "Open sourcing event →" not found.');
  }
  if (!(await submit.isEnabled())) {
    throw new Error('Submit button is disabled — required field (trigger) not filled?');
  }
  log('click submit');
  await Promise.all([
    page.waitForURL(/\/source\/events\/[^/]+/, { timeout: 30_000 }),
    submit.click(),
  ]);

  const eventUrl = page.url();
  const eventId = eventUrl.match(/\/source\/events\/([^/?#]+)/)?.[1] ?? null;
  log(`event created → ${eventUrl}`);
  return { eventUrl, eventId };
}

// ── Scenario 2: walk canvas ─────────────────────────────────────────────────

export async function walkCanvas(
  ctx: ScenarioContext,
  eventUrl: string,
): Promise<{ artifactCodes: string[] }> {
  const { page, log, runDir } = ctx;
  log(`navigate → ${eventUrl}`);
  await page.goto(eventUrl, { waitUntil: 'domcontentloaded' });

  // Find every artifact button on the canvas.
  const artifactButtons = page.locator(
    '[data-testid^="source-canvas-artifact-"]',
  );
  const count = await artifactButtons.count();
  log(`found ${count} artifact card${count === 1 ? '' : 's'}`);

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const btn = artifactButtons.nth(i);
    const testid = await btn.getAttribute('data-testid');
    const code = testid?.replace(/^source-canvas-artifact-/, '') ?? `unknown-${i}`;
    codes.push(code);

    log(`click artifact → ${code}`);
    await btn.click();
    await page.waitForTimeout(400);

    const screenshotPath = join(runDir, `artifact-${code}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    log(`screenshot → ${screenshotPath}`);
  }

  return { artifactCodes: codes };
}

// ── Scenario 3: promote stage ───────────────────────────────────────────────

export async function promoteStage(
  ctx: ScenarioContext,
  eventUrl: string,
): Promise<{ before: string; after: string; promoted: boolean }> {
  const { page, log, runDir } = ctx;
  log(`navigate → ${eventUrl}`);
  await page.goto(eventUrl, { waitUntil: 'domcontentloaded' });

  // Switch to gate tab — the tab strip has role=tab elements; click
  // the one whose label contains "Gate".
  const gateTab = page.getByRole('tab', { name: /gate/i }).first();
  if ((await gateTab.count()) > 0) {
    log('click gate tab');
    await gateTab.click();
    await page.waitForSelector('[data-testid="source-canvas-gate-tab"]', {
      timeout: 5000,
    });
  } else {
    log('gate tab not found by role=tab — assuming visible already');
  }

  await page.screenshot({ path: join(runDir, 'gate-before.png'), fullPage: false });

  const promote = page.locator('[data-testid="source-canvas-gate-promote"]').first();
  if ((await promote.count()) === 0) {
    throw new Error('Promote button not found on Gate tab.');
  }
  const before = page.url();
  if (!(await promote.isEnabled())) {
    log('promote button disabled — gate criteria not yet met');
    return { before, after: before, promoted: false };
  }

  log('click promote stage');
  await promote.click();
  await page.waitForTimeout(1500);
  const after = page.url();
  await page.screenshot({ path: join(runDir, 'gate-after.png'), fullPage: false });

  log(`promote result → ${before === after ? 'no URL change' : `${before} → ${after}`}`);
  return { before, after, promoted: true };
}

// ── helpers ─────────────────────────────────────────────────────────────────

function baseTenantUrl(cfg: CrawlConfig): string {
  const u = new URL(cfg.tenantUrl);
  return `${u.protocol}//${u.host}`;
}

function categoryLabelFor(
  category: CreateEventOptions['category'],
): string | null {
  switch (category) {
    case 'managed_services':
      return 'Application Managed Services';
    case 'cloud_infrastructure':
      return 'Cloud & Infrastructure';
    case 'data_ai':
      return 'Data, Analytics & AI';
    case 'enterprise_software':
      return 'Enterprise Software';
    case 'custom':
      return 'Custom / Multi-tower';
    default:
      return null;
  }
}
