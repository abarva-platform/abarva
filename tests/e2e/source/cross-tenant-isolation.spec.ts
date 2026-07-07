/**
 * Cross-tenant isolation regression gate · Source module.
 *
 * Proves that Apex Retail sourcing data is invisible to a Meridian CDIO user.
 * Every assertion is HARD: status must be exactly 404 (Not Found) — never 403
 * (Forbidden), never any other 4xx — because the spec from the security audit
 * requires that we not leak the existence of an out-of-tenant resource via the
 * 403-vs-404 distinction. A 403 would tell an attacker "this ID exists, you
 * just cannot read it" — that is ID enumeration. We deny enumeration entirely.
 *
 * Coverage (6 assertions):
 *   1. UI route: GET /source/events/<apex-event-id>  → 404
 *   2. API event detail: GET /api/v1/source/events/<apex-event-id> → 404
 *   3. API artifact body: GET /api/v1/source/<apex-event-id>/artifacts/<code>/body → 404
 *   4. Registry-backed artifact drawer route:
 *      GET /source/events/<apex-event-id>/artifacts/<artifact-id> → 404
 *      even when the artifact id is arbitrary. This protects the
 *      Stored Documents surface added via source_artifacts.
 *   5. List leak: GET /source (and /api/v1/source/events) MUST NOT contain
 *      the Apex event id or display name anywhere in the response body.
 *   6. Render trigger: POST /api/v1/source/<apex-event-id>/artifacts/<code>/render
 *      → 404 even though the artifact code is valid in the Apex tenant.
 *
 * Each test captures an audit packet (URL, method, status, response snippet
 * + screenshot for UI routes) into reports/<YYYY-MM-DD>-source-xtenant-isolation/
 * as raw.json. The harness appends per-test entries — the file is written
 * incrementally so a partial run still produces evidence.
 *
 * Auth: signs in as the Meridian CDIO persona (cdio@meridian-health.example.com),
 * mapped to the 'meridian' clientKey via the canonical CXO persona fixture.
 *
 * Skip condition: missing Clerk credentials. Like the rest of tests/e2e, this
 * spec needs CLERK_SESSION_TOKEN or CLERK_SECRET_KEY to drive a real Clerk
 * session. Without those it skips cleanly — it does not fail CI.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { expect, test, type APIResponse, type Page } from '@playwright/test';
import { findPersonaByEmail } from '../../../src/lib/auth/cxo-personas';
import {
  BASE_URL,
  clerkUserExists,
  missingAuthPrereqs,
  withClerkAuth,
} from '../_helpers/auth';

// ─── Fixtures ─────────────────────────────────────────────────────────────
// The Apex AMS deterministic seed anchor. This event lives in the Apex tenant
// and MUST NOT be accessible to a Meridian user.
const APEX_EVENT_ID = 'apex-retail-ams-outsourcing-2026';
// Common Apex artifact code from the AMS seed (RFP package). The exact code
// doesn't matter for the 404 contract — the point is the event/tenant guard
// fires before code lookup happens.
const APEX_ARTIFACT_CODE = 'RFP-PACKAGE';
const APEX_REGISTRY_ARTIFACT_ID = 'generated-memo-regression-probe';
// Leak-detection literals: if any of these surface in a Meridian list response,
// it is a tenancy breach.
const APEX_LEAK_LITERALS: ReadonlyArray<string> = [
  APEX_EVENT_ID,
  'apex-retail-ams',
  'Apex Retail',
  'apexretail',
];

const MERIDIAN_CDIO_EMAIL = 'cdio@meridian-health.example.com';

// ─── Audit packet plumbing ────────────────────────────────────────────────
type AuditEntry = {
  test: string;
  startedAt: string;
  finishedAt: string;
  request: {
    method: string;
    url: string;
  };
  response: {
    status: number;
    statusText?: string;
    bodySnippet?: string;
    contentType?: string | null;
  };
  screenshot?: string | null;
  assertion: {
    expectedStatus: number;
    actualStatus: number;
    pass: boolean;
    note?: string;
  };
};

const REPORT_DIR = path.resolve(
  process.cwd(),
  'reports',
  `${new Date().toISOString().slice(0, 10)}-source-xtenant-isolation`,
);

async function ensureReportDir(): Promise<void> {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  await ensureReportDir();
  const file = path.join(REPORT_DIR, 'raw.json');
  let current: { entries: AuditEntry[] } = { entries: [] };
  try {
    const raw = await fs.readFile(file, 'utf-8');
    current = JSON.parse(raw);
    if (!Array.isArray(current.entries)) current.entries = [];
  } catch {
    // first write
  }
  current.entries.push(entry);
  await fs.writeFile(file, JSON.stringify(current, null, 2), 'utf-8');
}

function snippet(body: string, max = 600): string {
  return body.length > max ? `${body.slice(0, max)}…[truncated ${body.length - max}b]` : body;
}

async function captureApi(
  testName: string,
  response: APIResponse,
  expectedStatus: number,
  method = 'GET',
): Promise<{ status: number; body: string }> {
  const startedAt = new Date().toISOString();
  const status = response.status();
  const body = await response.text().catch(() => '');
  const contentType = response.headers()['content-type'] ?? null;
  await appendAuditEntry({
    test: testName,
    startedAt,
    finishedAt: new Date().toISOString(),
    request: {
      method,
      url: response.url(),
    },
    response: {
      status,
      statusText: status === 404 ? 'Not Found' : undefined,
      bodySnippet: snippet(body),
      contentType,
    },
    assertion: {
      expectedStatus,
      actualStatus: status,
      pass: status === expectedStatus,
      note:
        status === 403
          ? 'SECURITY: must return 404 to prevent ID enumeration, observed 403.'
          : undefined,
    },
  });
  return { status, body };
}

async function capturePageNavigation(
  page: Page,
  testName: string,
  url: string,
  expectedStatus: number,
): Promise<{ status: number; screenshotPath: string }> {
  await ensureReportDir();
  const startedAt = new Date().toISOString();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const status = response?.status() ?? 0;
  const screenshotPath = path.join(
    REPORT_DIR,
    `${testName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
  );
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {
    // screenshot failures must not break the assertion
  });
  await appendAuditEntry({
    test: testName,
    startedAt,
    finishedAt: new Date().toISOString(),
    request: { method: 'GET', url },
    response: {
      status,
      statusText: status === 404 ? 'Not Found' : undefined,
      contentType: response?.headers()['content-type'] ?? null,
      bodySnippet: snippet((await page.content().catch(() => '')) ?? ''),
    },
    screenshot: screenshotPath,
    assertion: {
      expectedStatus,
      actualStatus: status,
      pass: status === expectedStatus,
      note:
        status === 403
          ? 'SECURITY: must return 404 to prevent ID enumeration, observed 403.'
          : undefined,
    },
  });
  return { status, screenshotPath };
}

// ─── Suite ────────────────────────────────────────────────────────────────
test.describe('source · cross-tenant isolation (Meridian CDIO cannot see Apex)', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    missingAuthPrereqs.length > 0,
    `Missing required env: ${missingAuthPrereqs.join(', ')} — cross-tenant isolation e2e gate skipped.`,
  );

  const persona = findPersonaByEmail(MERIDIAN_CDIO_EMAIL);

  test.skip(
    !persona,
    `No CXO persona fixture for ${MERIDIAN_CDIO_EMAIL} — provision via scripts/provision-cxo-personas.ts before enabling this gate.`,
  );

  if (!persona) {
    return;
  }

  test.beforeAll(async () => {
    // Reset the audit file at suite start so each run produces a clean packet.
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'raw.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          persona: { email: persona.email, clientKey: persona.clientKey },
          target: { tenant: 'apex-retail', eventId: APEX_EVENT_ID },
          entries: [],
        },
        null,
        2,
      ),
      'utf-8',
    );
  });

  test.beforeEach(async ({ page }) => {
    test.skip(
      !(await clerkUserExists(persona.email)),
      `No Clerk user found for ${persona.email} — provision via scripts/provision-cxo-personas.ts.`,
    );

    await withClerkAuth(page, {
      activeClient: persona.clientKey,
      email: persona.email,
    });
  });

  // ─── 1. UI route 404 (no ID enumeration via page navigation) ──────────
  test('UI · GET /source/events/<apex-event-id> returns exactly 404', async ({ page }) => {
    const testName = 'ui-event-detail-404';
    const url = `/source/events/${APEX_EVENT_ID}`;
    const { status } = await capturePageNavigation(page, testName, url, 404);

    // Hard assertion: MUST be exactly 404. Never 403, never 200, never anything else.
    expect(status, 'Apex event UI URL must return 404 to prevent ID enumeration').toBe(404);

    // Also assert the rendered page does not leak the event id or Apex literals.
    const rendered = await page.content();
    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        rendered.toLowerCase().includes(literal.toLowerCase()),
        `404 page leaked Apex literal "${literal}" — must render a generic not-found surface`,
      ).toBe(false);
    }
  });

  // ─── 2. API event detail 404 ─────────────────────────────────────────
  test('API · GET /api/v1/source/events/<apex-event-id> returns exactly 404', async ({
    page,
  }) => {
    const testName = 'api-event-detail-404';
    const url = `${BASE_URL}/api/v1/source/events/${APEX_EVENT_ID}`;
    const response = await page.request.get(url);
    const { status, body } = await captureApi(testName, response, 404);

    expect(status, 'Apex event API must return 404, not 403, to prevent enumeration').toBe(404);

    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        body.toLowerCase().includes(literal.toLowerCase()),
        `404 response body leaked Apex literal "${literal}"`,
      ).toBe(false);
    }
  });

  // ─── 3. API artifact body 404 ────────────────────────────────────────
  test('API · GET /api/v1/source/<apex-event-id>/artifacts/<code>/body returns exactly 404', async ({
    page,
  }) => {
    const testName = 'api-artifact-body-404';
    const url = `${BASE_URL}/api/v1/source/${APEX_EVENT_ID}/artifacts/${APEX_ARTIFACT_CODE}/body`;
    const response = await page.request.get(url);
    const { status, body } = await captureApi(testName, response, 404);

    expect(
      status,
      'Apex artifact body must return 404 — tenant guard must fire before artifact-code lookup',
    ).toBe(404);

    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        body.toLowerCase().includes(literal.toLowerCase()),
        `404 artifact-body response leaked Apex literal "${literal}"`,
      ).toBe(false);
    }
  });

  // ─── 4. Registry-backed artifact drawer route 404 ────────────────────
  test('UI · GET /source/events/<apex-event-id>/artifacts/<artifact-id> returns exactly 404', async ({
    page,
  }) => {
    const testName = 'ui-registry-artifact-drawer-404';
    const url = `/source/events/${APEX_EVENT_ID}/artifacts/${APEX_REGISTRY_ARTIFACT_ID}`;
    const { status } = await capturePageNavigation(page, testName, url, 404);

    expect(
      status,
      'Apex registry-backed artifact drawer URL must return 404 to prevent Stored Documents enumeration',
    ).toBe(404);

    const rendered = await page.content();
    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        rendered.toLowerCase().includes(literal.toLowerCase()),
        `Artifact drawer 404 page leaked Apex literal "${literal}" — must render a generic not-found surface`,
      ).toBe(false);
    }
  });

  // ─── 5. List endpoints MUST NOT contain Apex events ──────────────────
  test('UI · /source list page contains no Apex event id or display literal', async ({
    page,
  }) => {
    const testName = 'ui-source-list-no-apex-leak';
    const url = `${BASE_URL}/source`;
    const response = await page.goto('/source', { waitUntil: 'domcontentloaded' });
    const status = response?.status() ?? 0;
    const body = (await page.content().catch(() => '')) ?? '';

    const screenshotPath = path.join(REPORT_DIR, `${testName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    await appendAuditEntry({
      test: testName,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      request: { method: 'GET', url },
      response: {
        status,
        contentType: response?.headers()['content-type'] ?? null,
        bodySnippet: snippet(body),
      },
      screenshot: screenshotPath,
      assertion: {
        expectedStatus: 200,
        actualStatus: status,
        pass:
          status === 200 &&
          !APEX_LEAK_LITERALS.some((l) =>
            body.toLowerCase().includes(l.toLowerCase()),
          ),
      },
    });

    expect(status, 'Meridian /source list must render successfully').toBe(200);
    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        body.toLowerCase().includes(literal.toLowerCase()),
        `Meridian /source list leaked Apex literal "${literal}" — cross-tenant data exposed`,
      ).toBe(false);
    }

    // Also check the API the list page consumes.
    const apiUrl = `${BASE_URL}/api/v1/source/events`;
    const apiResponse = await page.request.get(apiUrl);
    const apiBody = await apiResponse.text().catch(() => '');
    await appendAuditEntry({
      test: `${testName}-api`,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      request: { method: 'GET', url: apiUrl },
      response: {
        status: apiResponse.status(),
        contentType: apiResponse.headers()['content-type'] ?? null,
        bodySnippet: snippet(apiBody),
      },
      assertion: {
        expectedStatus: 200,
        actualStatus: apiResponse.status(),
        pass:
          apiResponse.status() === 200 &&
          !APEX_LEAK_LITERALS.some((l) =>
            apiBody.toLowerCase().includes(l.toLowerCase()),
          ),
      },
    });

    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        apiBody.toLowerCase().includes(literal.toLowerCase()),
        `Meridian /api/v1/source/events leaked Apex literal "${literal}"`,
      ).toBe(false);
    }
  });

  // ─── 6. Render trigger 404 (no enumeration via artifact codes) ───────
  test('API · POST /api/v1/source/<apex-event-id>/artifacts/<code>/render returns exactly 404', async ({
    page,
  }) => {
    const testName = 'api-artifact-render-404';
    const url = `${BASE_URL}/api/v1/source/${APEX_EVENT_ID}/artifacts/${APEX_ARTIFACT_CODE}/render`;
    const response = await page.request.post(url, {
      data: { format: 'pdf' },
      headers: { 'content-type': 'application/json' },
    });
    const { status, body } = await captureApi(testName, response, 404, 'POST');

    expect(
      status,
      'Render trigger for Apex artifact must return 404 even when code is valid in Apex tenant',
    ).toBe(404);

    for (const literal of APEX_LEAK_LITERALS) {
      expect(
        body.toLowerCase().includes(literal.toLowerCase()),
        `Render 404 response leaked Apex literal "${literal}"`,
      ).toBe(false);
    }
  });
});
