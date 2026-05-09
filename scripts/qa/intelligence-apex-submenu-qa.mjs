#!/usr/bin/env node

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3007';
const CLIENT_QUERY = 'client=apexretail';
const LEAK_RE =
  /\b(Epic(?: Systems)?|Innovaccer|Abridge|IDN|AMC|EHR|HIPAA|Meridian|MH-\d|P-HC|Population Health)\b/i;

const IGNORED_CONSOLE_RE = [
  /Clerk has been loaded with development keys/i,
  /Refreshing the session token resulted in an infinite redirect loop/i,
  /\[404\] path=unknown/i,
];

const STAGES = [
  {
    stage: 'brief',
    hash: '',
    anchors: ['Sentinel sees three Apex Retail priorities', 'Supabase', 'retail Genome patterns'],
  },
  {
    stage: 'map',
    hash: '#map',
    anchors: ['The retail AI landscape', 'Apex Retail', 'use cases'],
    views: ['Kanban', 'Landscape', 'Heatmap', 'List'],
  },
  {
    stage: 'art-of-possible',
    hash: '#art-of-possible',
    anchors: ['Customer growth', 'Data + platform'],
    views: ['Bands', 'Donut', 'Stacked', 'Kanban'],
  },
  {
    stage: 'today',
    hash: '#today',
    anchors: ['Apex Retail Intelligence is live', 'open contradictions'],
  },
  {
    stage: 'by-function',
    hash: '#by-function',
    anchors: ['Customer + loyalty', 'Store operations', 'Data foundation'],
    views: ['Matrix', 'Maturity bars', 'Radar'],
  },
  {
    stage: 'patterns',
    hash: '#patterns',
    anchors: ['F200', 'Apex use cases', 'Knowledge sources'],
    views: ['List', 'Quantified bars'],
    filters: ['All', 'Front office', 'Middle office', 'Back office'],
  },
  {
    stage: 'vendors',
    hash: '#vendors',
    anchors: ['Salesforce Commerce', 'Adobe Experience Platform', 'Accenture Retail'],
    views: ['By category', 'Renewal calendar', 'Risk quadrant'],
  },
  {
    stage: 'peer-activity',
    hash: '#peer-activity',
    anchors: ['specialty retail peers', 'marketplace-first retailers'],
    views: ['List', 'Heatmap'],
  },
  {
    stage: 'my-strategy',
    hash: '#my-strategy',
    anchors: ['Resolve CDP ownership', 'Sequence demand sensing'],
  },
  {
    stage: 'sessions',
    hash: '#sessions',
    anchors: ['CDP ownership', 'Vendor integration hub'],
    views: ['Threaded', 'Timeline'],
  },
];

function isIgnoredConsole(message) {
  return IGNORED_CONSOLE_RE.some((pattern) => pattern.test(message));
}

async function bodyText(page) {
  return page.locator('body').innerText({ timeout: 15_000 });
}

function assertNoLeak(stage, text, detail = '') {
  const match = text.match(LEAK_RE);
  if (match) {
    throw new Error(`${stage}${detail}: healthcare fixture leak found: "${match[0]}"`);
  }
}

function assertAnchors(stage, text, anchors, detail = '') {
  const missing = anchors.filter((anchor) => !text.toLowerCase().includes(anchor.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(`${stage}${detail}: missing retail anchors: ${missing.join(', ')}`);
  }
}

async function clickView(page, label) {
  const tab = page.getByRole('tab', { name: new RegExp(`^${escapeRegex(label)}$`, 'i') });
  const button = page.getByRole('button', { name: new RegExp(`^${escapeRegex(label)}\\b`, 'i') });
  if (await tab.count()) {
    await tab.first().click();
  } else if (await button.count()) {
    await button.first().click();
  } else {
    throw new Error(`missing view control: ${label}`);
  }
  await page.waitForTimeout(300);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function verifyMapLandscape(page) {
  const mapSvg = page.locator('svg[viewBox="0 0 760 480"]').first();
  const svgBox = await mapSvg.boundingBox();
  if (!svgBox || svgBox.height < 300 || svgBox.width < 500) {
    throw new Error(`map landscape svg collapsed: ${JSON.stringify(svgBox)}`);
  }
  const circles = await mapSvg.locator('circle').count();
  if (circles < 10) {
    throw new Error(`map landscape has too few rendered nodes: ${circles}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleIssues = [];
  const pageErrors = [];

  page.on('console', (message) => {
    const text = message.text();
    if (isIgnoredConsole(text)) return;
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleIssues.push(`${message.type()}: ${text}`);
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const rows = [];

  for (const check of STAGES) {
    const url = `${BASE_URL}/intelligence?${CLIENT_QUERY}${check.hash}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    let text = await bodyText(page);
    assertNoLeak(check.stage, text);
    assertAnchors(check.stage, text, check.anchors);
    rows.push(`${check.stage}: base OK`);

    for (const filter of check.filters ?? []) {
      await page.getByRole('button', { name: new RegExp(`^${escapeRegex(filter)}$`, 'i') }).first().click();
      await page.waitForTimeout(250);
      text = await bodyText(page);
      assertNoLeak(check.stage, text, ` filter=${filter}`);
      assertAnchors(check.stage, text, check.commonAnchors ?? ['Apex Retail'], ` filter=${filter}`);
      rows.push(`${check.stage}: filter ${filter} OK`);
    }

    for (const view of check.views ?? []) {
      await clickView(page, view);
      if (check.stage === 'map' && view === 'Landscape') {
        await verifyMapLandscape(page);
      }
      text = await bodyText(page);
      assertNoLeak(check.stage, text, ` view=${view}`);
      assertAnchors(check.stage, text, check.commonAnchors ?? ['Apex Retail'], ` view=${view}`);
      rows.push(`${check.stage}: view ${view} OK`);
    }
  }

  await browser.close();

  if (pageErrors.length > 0 || consoleIssues.length > 0) {
    const details = [...pageErrors.map((e) => `pageerror: ${e}`), ...consoleIssues];
    throw new Error(`runtime issues:\n${details.join('\n')}`);
  }

  console.log(`Apex Retail Intelligence submenu QA passed against ${BASE_URL}`);
  for (const row of rows) console.log(`- ${row}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
