/**
 * Audit-evidence harness for Source E2E tests.
 *
 * Wraps Playwright's `test` to capture, per test, a self-contained packet of
 * audit evidence under:
 *
 *   reports/source-golden-event/<run-stamp>/<test-slug>/
 *     ├── screenshots/<NN>-<step>-<phase>.png
 *     ├── console.log    (line-delimited JSON of console + pageerror events)
 *     ├── network.har    (full HAR recording, embedded content)
 *     └── audit.json     (structured per-step record: name, timestamps,
 *                         page URL, screenshot paths, assertions, gate-block
 *                         evidence, approval records)
 *
 * At process shutdown, a top-level INDEX.md is written that summarises every
 * test's audit.json into a single readable packet — the same convention used
 * for the IaC golden-event reports under reports/2026-05-30-atlas-iac-*.
 *
 * Built with plain Playwright + node:fs only — no new npm deps. Mirrors the
 * existing reports/<YYYY-MM-DD>-<purpose>/ naming so downstream tooling that
 * already consumes raw.json continues to find evidence at a predictable path.
 */

import {
  test as base,
  expect,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { promises as fsp } from "node:fs";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Run-level paths
// ---------------------------------------------------------------------------

/**
 * Per-run stamp (UTC, second precision). Shared across every test in the same
 * Playwright invocation so the suite produces a single audit packet.
 */
const RUN_STAMP = formatRunStamp(new Date());
const RUN_ROOT = path.resolve(
  process.cwd(),
  "reports",
  "source-golden-event",
  RUN_STAMP,
);
const SUITE_INDEX_PATH = path.join(RUN_ROOT, "INDEX.md");
const SUITE_MANIFEST_PATH = path.join(RUN_ROOT, "suite-manifest.json");

fs.mkdirSync(RUN_ROOT, { recursive: true });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepPhase =
  | "before"
  | "after"
  | "error"
  | "gate-block"
  | "approval";

export interface StepRecord {
  index: number;
  name: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  pageUrl: string;
  screenshots: Partial<Record<StepPhase, string>>;
  assertions: string[];
  status: "passed" | "failed" | "gate-blocked" | "approval" | "note";
  gateBlocked?: boolean;
  gateBlockReason?: string;
  gateCriteria?: string[];
  approval?: ApprovalEvidence;
  artifact?: ArtifactEvidence;
  notes?: string;
  error?: string;
}

export interface ApprovalEvidence {
  /** Approver identity (display name or email). */
  approver?: string;
  /** Back-compat alias for `approver`. */
  who?: string;
  when?: string;
  what?: string;
  reason?: string;
  decisionId?: string;
  rawText?: string;
  screenshot?: string;
}

export interface ArtifactEvidence {
  label: string;
  stage?: string;
  downloadUrl?: string | null;
  contentType?: string | null;
  byteSize?: number | null;
  aiDraftLabelPresent?: boolean | null;
  navigationTrace?: string[];
}

export interface NetworkRecord {
  url: string;
  method: string;
  status: number;
  capturedAt: string;
}

export interface AuditPacket {
  testTitle: string;
  testSlug: string;
  startedAt: string;
  finishedAt?: string;
  status?:
    | "passed"
    | "failed"
    | "timedOut"
    | "interrupted"
    | "skipped"
    | "unknown";
  outputDir: string;
  steps: StepRecord[];
  consoleErrors: string[];
  consoleEventsTotal: number;
  network: NetworkRecord[];
  networkHarPath?: string;
}

// ---------------------------------------------------------------------------
// Worker-local registry
// ---------------------------------------------------------------------------

const PACKETS_BY_SLUG = new Map<string, AuditPacket>();
const PACKET_BY_PAGE = new WeakMap<Page, AuditPacket>();

// ---------------------------------------------------------------------------
// Public fixture
// ---------------------------------------------------------------------------

interface AuditFixtures {
  audit: AuditContext;
}

export interface AuditContext {
  readonly packet: AuditPacket;
  readonly outputDir: string;
  /** Attach a note to the most recent step, or create a stand-alone note step. */
  note(text: string): void;
  /** Record an assertion description against the most recent step. */
  recordAssertion(text: string): void;
  /** Record a non-DOCX/PDF artifact reference against the current test. */
  recordArtifact(artifact: ArtifactEvidence): void;
}

/**
 * `auditedTest` wraps Playwright's `test`. It overrides the `context` fixture
 * so every test records a HAR, and the `page` fixture so console/pageerror
 * events stream into a per-test console.log. The `audit` fixture exposes
 * helpers for free-form notes and assertion descriptions.
 *
 * Existing test bodies that use `({ page })` work without changes; tests that
 * want richer evidence destructure `audit` as well.
 */
export const auditedTest = base.extend<AuditFixtures>({
  context: async ({ browser }, fixtureUse, testInfo) => {
    const slug = slugify(testInfo.titlePath.join(" "));
    const outputDir = path.join(RUN_ROOT, slug);
    ensureDir(outputDir);
    ensureDir(path.join(outputDir, "screenshots"));

    const harPath = path.join(outputDir, "network.har");

    const context = await browser.newContext({
      recordHar: { path: harPath, content: "embed" },
    });

    const packet: AuditPacket = {
      testTitle: testInfo.title,
      testSlug: slug,
      startedAt: new Date().toISOString(),
      outputDir,
      steps: [],
      consoleErrors: [],
      consoleEventsTotal: 0,
      network: [],
      networkHarPath: harPath,
    };
    PACKETS_BY_SLUG.set(slug, packet);

    await fixtureUse(context);

    packet.finishedAt = new Date().toISOString();
    packet.status = mapStatus(testInfo.status);
    await context.close(); // flush HAR
    writePacketSync(packet);
  },

  page: async ({ context }, fixtureUse, testInfo) => {
    const slug = slugify(testInfo.titlePath.join(" "));
    const packet = PACKETS_BY_SLUG.get(slug);
    if (!packet) {
      throw new Error(
        `Audit packet missing for "${testInfo.title}" — context fixture did not run first`,
      );
    }

    const consoleLogPath = path.join(packet.outputDir, "console.log");
    const consoleStream = fs.createWriteStream(consoleLogPath, { flags: "a" });

    const page = await context.newPage();
    PACKET_BY_PAGE.set(page, packet);

    page.on("console", (msg) => {
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
      consoleStream.write(line + "\n");
      packet.consoleEventsTotal += 1;
      if (msg.type() === "error") {
        packet.consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleStream.write(
        JSON.stringify({
          ts: new Date().toISOString(),
          type: "pageerror",
          text: err.message,
          stack: err.stack,
        }) + "\n",
      );
      packet.consoleEventsTotal += 1;
      packet.consoleErrors.push(err.message);
    });
    page.on("response", (resp) => {
      const url = resp.url();
      // Keep the network footprint small: only app + API traffic, not assets.
      if (/\/(api|source|programs|moves|intelligence)\//.test(url)) {
        packet.network.push({
          url,
          method: resp.request().method(),
          status: resp.status(),
          capturedAt: new Date().toISOString(),
        });
      }
    });

    await fixtureUse(page);

    await new Promise<void>((resolve) => consoleStream.end(() => resolve()));
    writePacketSync(packet);
  },

  audit: async ({}, fixtureUse, testInfo) => {
    const slug = slugify(testInfo.titlePath.join(" "));
    const packet = PACKETS_BY_SLUG.get(slug);
    if (!packet) {
      throw new Error(`Audit packet missing for "${testInfo.title}"`);
    }

    const ctx: AuditContext = {
      packet,
      outputDir: packet.outputDir,
      note(text: string) {
        const last = packet.steps[packet.steps.length - 1];
        if (last) {
          last.notes = last.notes ? `${last.notes}\n${text}` : text;
        } else {
          const meta = makeMetaStep(packet, "note", text);
          packet.steps.push(meta);
        }
        writePacketSync(packet);
      },
      recordAssertion(text: string) {
        const last = packet.steps[packet.steps.length - 1];
        if (last) {
          last.assertions.push(text);
        } else {
          const meta = makeMetaStep(packet, "note", text);
          meta.assertions.push(text);
          packet.steps.push(meta);
        }
        writePacketSync(packet);
      },
      recordArtifact(artifact: ArtifactEvidence) {
        const last = packet.steps[packet.steps.length - 1];
        if (last) {
          last.artifact = artifact;
        } else {
          const meta = makeMetaStep(
            packet,
            "note",
            `artifact:${artifact.label}`,
          );
          meta.artifact = artifact;
          packet.steps.push(meta);
        }
        writePacketSync(packet);
      },
    };

    await fixtureUse(ctx);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// step() — instrumented action wrapper
// ---------------------------------------------------------------------------

/**
 * Run `body` as a recorded step. Captures a "before" and "after" screenshot
 * automatically and appends a `StepRecord` entry to the test's audit.json.
 * Errors are recorded and re-thrown so Playwright still fails the test.
 */
export async function step<T>(
  page: Page,
  name: string,
  body: () => Promise<T>,
): Promise<T> {
  const packet = packetForPage(page);
  const index = packet.steps.length + 1;
  const record: StepRecord = {
    index,
    name,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    durationMs: 0,
    pageUrl: safeUrl(page),
    screenshots: {},
    assertions: [],
    status: "passed",
  };
  packet.steps.push(record);

  record.screenshots.before = await captureScreenshot(
    page,
    packet,
    index,
    name,
    "before",
  );

  const t0 = Date.now();
  try {
    const result = await body();
    record.screenshots.after = await captureScreenshot(
      page,
      packet,
      index,
      name,
      "after",
    );
    record.pageUrl = safeUrl(page);
    return result;
  } catch (err) {
    record.status = "failed";
    record.error =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    record.screenshots.error = await captureScreenshot(
      page,
      packet,
      index,
      name,
      "error",
    );
    throw err;
  } finally {
    record.finishedAt = new Date().toISOString();
    record.durationMs = Date.now() - t0;
    writePacketSync(packet);
  }
}

// ---------------------------------------------------------------------------
// captureGateBlock()
// ---------------------------------------------------------------------------

export interface GateBlockOptions {
  /** Logical stage name (e.g. "strategy", "bafo"). */
  stage?: string;
  /** Selectors searched in order for the rejection reason. */
  reasonSelectors?: string[];
  /** Selectors for visible gate criteria (renders as list items). */
  criteriaSelectors?: string[];
  /** Override the step name. Defaults to "Gate block · <stage>". */
  stepName?: string;
}

/**
 * Capture evidence that an advance attempt was blocked. Asserts a visible
 * alert exists (Playwright soft assertion) and records the rejection reason +
 * any visible gate-criteria list items into the audit packet.
 *
 * Accepts either a bare stage name (e.g. `'strategy'`) or a `GateBlockOptions`
 * object — both forms are used across the Source specs.
 */
export interface GateBlockRecord extends StepRecord {
  /** Always-present array (empty when no criteria were rendered). */
  gateCriteria: string[];
  gateBlocked: true;
  gateBlockReason: string;
  /** Alias for `gateBlockReason` — kept for spec ergonomics. */
  blockMessage: string;
}

export async function captureGateBlock(
  page: Page,
  optionsOrStage: GateBlockOptions | string = {},
): Promise<GateBlockRecord> {
  const options: GateBlockOptions =
    typeof optionsOrStage === "string"
      ? { stage: optionsOrStage }
      : optionsOrStage;
  const packet = packetForPage(page);
  const stage = options.stage ?? "(unspecified)";

  const reasonSelectors = options.reasonSelectors ?? [
    '[data-testid="source-canvas-gate-blockers"]',
    '[data-testid="source-canvas-gate-tab"] [role="status"]',
    '[role="alert"]',
    '[data-testid$="-error"]',
    '[data-testid*="toast"]',
    '[data-testid*="gate-block"]',
  ];

  let reason = "";
  for (const sel of reasonSelectors) {
    try {
      const locator = page.locator(sel).first();
      if (await locator.count()) {
        const text = (await locator.innerText({ timeout: 1500 })).trim();
        if (text) {
          reason = text;
          break;
        }
      }
    } catch {
      // try next selector
    }
  }

  const criteriaSelectors = options.criteriaSelectors ?? [
    '[data-testid="source-canvas-gate-blockers"] li',
    '[data-testid="source-canvas-gate-criteria"] li',
    '[data-testid="source-canvas-gate-current"] li',
  ];
  const criteria: string[] = [];
  for (const sel of criteriaSelectors) {
    try {
      const nodes = page.locator(sel);
      const count = await nodes.count();
      for (let i = 0; i < count; i++) {
        const txt = (await nodes.nth(i).innerText({ timeout: 800 })).trim();
        if (txt) criteria.push(txt);
      }
      if (criteria.length) break;
    } catch {
      // try next
    }
  }

  const index = packet.steps.length + 1;
  const blockReason = reason || "(no reason text found in known selectors)";
  const record: GateBlockRecord = {
    index,
    name: options.stepName ?? `Gate block · ${stage}`,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 0,
    pageUrl: safeUrl(page),
    screenshots: {},
    assertions: [],
    status: "gate-blocked",
    gateBlocked: true,
    gateBlockReason: blockReason,
    blockMessage: blockReason,
    gateCriteria: criteria,
  };
  packet.steps.push(record);

  record.screenshots["gate-block"] = await captureScreenshot(
    page,
    packet,
    index,
    record.name,
    "gate-block",
  );
  writePacketSync(packet);
  return record;
}

// ---------------------------------------------------------------------------
// captureApprovalRecord()
// ---------------------------------------------------------------------------

export interface ApprovalOptions {
  /** Logical stage name. */
  stage?: string;
  /** Root selector for the approval modal/drawer/record panel. */
  rootSelector?: string;
  /** Field-level overrides; each selector is relative to `rootSelector`. */
  fieldSelectors?: {
    who?: string;
    when?: string;
    what?: string;
    reason?: string;
    decisionId?: string;
  };
  stepName?: string;
}

/**
 * Scrape the approval modal/drawer for who/when/what/reason and append an
 * approval entry to audit.json. Default selectors target the existing Source
 * canvas approval panels; callers should override for non-canvas surfaces.
 *
 * Returns the underlying StepRecord enriched with the captured approval
 * fields hoisted to the top level (`approver`, `reason`, `when`, `what`,
 * `decisionId`) so call sites can `expect(record.reason).toContain(...)` and
 * `expect(record.approver).toBeTruthy()` without drilling into `.approval`.
 *
 * Accepts either a bare stage name or an `ApprovalOptions` object.
 */
export interface ApprovalRecord extends StepRecord {
  approver?: string;
  when?: string;
  what?: string;
  reason?: string;
  decisionId?: string;
}

export async function captureApprovalRecord(
  page: Page,
  optionsOrStage: ApprovalOptions | string = {},
): Promise<ApprovalRecord> {
  const options: ApprovalOptions =
    typeof optionsOrStage === "string"
      ? { stage: optionsOrStage }
      : optionsOrStage;
  const packet = packetForPage(page);
  const stage = options.stage ?? "(unspecified)";

  const rootSel =
    options.rootSelector ??
    '[data-testid="source-canvas-approval-record"], [data-testid="source-canvas-exec-decision-record"], [role="dialog"]';
  const root = page.locator(rootSel).first();

  const fieldSelectors = {
    who:
      options.fieldSelectors?.who ??
      '[data-testid="approval-approver"], [data-testid*="approver"], [data-field="who"], [data-field="approver"]',
    when:
      options.fieldSelectors?.when ??
      '[data-testid="approval-timestamp"], [data-testid*="timestamp"], [data-field="when"]',
    what:
      options.fieldSelectors?.what ??
      '[data-testid="approval-decision"], [data-testid*="decision-label"], [data-field="what"]',
    reason:
      options.fieldSelectors?.reason ??
      '[data-testid="approval-reason"], [data-testid*="justification"], [data-field="reason"]',
    decisionId:
      options.fieldSelectors?.decisionId ??
      '[data-testid="approval-decision-id"], [data-testid*="decision-id"]',
  };

  const approval: ApprovalEvidence = {};
  try {
    if (await root.count()) {
      approval.rawText = (await root.innerText({ timeout: 1500 })).trim();
      approval.approver = await tryReadText(root, fieldSelectors.who);
      approval.who = approval.approver; // back-compat alias
      approval.when = await tryReadText(root, fieldSelectors.when);
      approval.what = await tryReadText(root, fieldSelectors.what);
      approval.reason = await tryReadText(root, fieldSelectors.reason);
      approval.decisionId = await tryReadText(root, fieldSelectors.decisionId);
    }
  } catch (err) {
    approval.rawText = `(scrape error: ${err instanceof Error ? err.message : String(err)})`;
  }

  const index = packet.steps.length + 1;
  const record: ApprovalRecord = {
    index,
    name: options.stepName ?? `Approval · ${stage}`,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 0,
    pageUrl: safeUrl(page),
    screenshots: {},
    assertions: [],
    status: "approval",
    approval,
    approver: approval.approver,
    when: approval.when,
    what: approval.what,
    reason: approval.reason,
    decisionId: approval.decisionId,
  };
  packet.steps.push(record);

  const shot = await captureScreenshot(
    page,
    packet,
    index,
    record.name,
    "approval",
  );
  approval.screenshot = shot;
  record.screenshots.approval = shot;
  writePacketSync(packet);
  return record;
}

// ---------------------------------------------------------------------------
// captureArtifact() — free-function variant of audit.recordArtifact()
// ---------------------------------------------------------------------------

/**
 * Record an artifact-evidence entry against the current test's audit packet.
 *
 * Free-function counterpart to the `audit.recordArtifact()` fixture method,
 * for spec sites that destructure only `{ page }`. Captures a screenshot of
 * the current page state alongside the artifact metadata so the audit packet
 * shows what the user saw when the artifact was emitted.
 */
export async function captureArtifact(
  page: Page,
  stage: string,
  label: string,
  details: Omit<ArtifactEvidence, "label" | "stage"> = {},
): Promise<StepRecord> {
  const packet = packetForPage(page);
  const index = packet.steps.length + 1;
  const artifact: ArtifactEvidence = { label, stage, ...details };
  const record: StepRecord = {
    index,
    name: `Artifact · ${stage} · ${label}`,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 0,
    pageUrl: safeUrl(page),
    screenshots: {},
    assertions: [],
    status: "note",
    artifact,
  };
  packet.steps.push(record);
  record.screenshots.after = await captureScreenshot(
    page,
    packet,
    index,
    record.name,
    "after",
  );
  writePacketSync(packet);
  return record;
}

// ---------------------------------------------------------------------------
// finalizePacket() — write INDEX.md across all tests in the run
// ---------------------------------------------------------------------------

/**
 * Assemble `INDEX.md` summarising every test captured during the current run.
 * Reads each test's `audit.json` from disk so it works regardless of which
 * worker recorded which test. Safe to call multiple times.
 */
export async function finalizePacket(): Promise<string> {
  const packets = await loadAllPacketsFromDisk();
  const lines: string[] = [];

  lines.push(`# Source Golden Event — Audit Packet`);
  lines.push("");
  lines.push(`Run stamp: \`${RUN_STAMP}\``);
  lines.push(`Output root: \`${RUN_ROOT}\``);
  lines.push(`Tests captured: ${packets.length}`);
  lines.push(`Status mix: ${summariseStatuses(packets)}`);
  lines.push("");

  lines.push("## Tests");
  lines.push("");

  for (const p of packets) {
    const status = p.status ?? "unknown";
    lines.push(`### ${p.testTitle}`);
    lines.push("");
    lines.push(`- Slug: \`${p.testSlug}\``);
    lines.push(`- Status: **${status}**`);
    lines.push(`- Started: ${p.startedAt}`);
    if (p.finishedAt) lines.push(`- Finished: ${p.finishedAt}`);
    lines.push(`- Steps: ${p.steps.length}`);
    lines.push(
      `- Console events: ${p.consoleEventsTotal} (errors: ${p.consoleErrors.length})`,
    );
    lines.push(`- Network records: ${p.network.length}`);
    lines.push(`- Output: \`${path.relative(RUN_ROOT, p.outputDir) || "."}\``);
    if (p.networkHarPath) {
      lines.push(`- HAR: \`${path.relative(RUN_ROOT, p.networkHarPath)}\``);
    }
    lines.push("");

    if (p.steps.length) {
      lines.push(`| # | Step | Status | Duration (ms) | URL |`);
      lines.push(`| - | ---- | ------ | ------------- | --- |`);
      for (const s of p.steps) {
        lines.push(
          `| ${s.index} | ${escapeMd(s.name)} | ${s.status} | ${s.durationMs} | ${escapeMd(s.pageUrl)} |`,
        );
      }
      lines.push("");

      const blocks = p.steps.filter((s) => s.gateBlocked);
      if (blocks.length) {
        lines.push("**Gate blocks:**");
        for (const b of blocks) {
          lines.push(
            `- Step ${b.index} "${escapeMd(b.name)}" — ${escapeMd(b.gateBlockReason ?? "(no reason)")}`,
          );
          for (const c of b.gateCriteria ?? []) {
            lines.push(`  - criterion: ${escapeMd(c)}`);
          }
        }
        lines.push("");
      }

      const approvals = p.steps.filter((s) => s.approval);
      if (approvals.length) {
        lines.push("**Approvals:**");
        for (const a of approvals) {
          const who = a.approval?.who ?? "?";
          const when = a.approval?.when ?? "?";
          const what = a.approval?.what ?? "?";
          const reason = a.approval?.reason ?? "?";
          lines.push(
            `- Step ${a.index}: who=${escapeMd(who)} · when=${escapeMd(when)} · what=${escapeMd(what)} · reason=${escapeMd(reason)}`,
          );
        }
        lines.push("");
      }

      const errors = p.steps.filter((s) => s.error);
      if (errors.length) {
        lines.push("**Step errors:**");
        for (const e of errors) {
          lines.push(
            `- Step ${e.index} "${escapeMd(e.name)}": ${escapeMd(e.error ?? "")}`,
          );
        }
        lines.push("");
      }
    }
  }

  await fsp.writeFile(SUITE_INDEX_PATH, lines.join("\n"), "utf8");
  return SUITE_INDEX_PATH;
}

// Best-effort: finalise on worker shutdown so callers don't have to wire an
// `afterAll`. Idempotent — safe to call multiple times.
process.on("beforeExit", () => {
  try {
    // We deliberately use the sync variant of the writer where possible; the
    // INDEX rollup is async but small. Fire-and-forget is acceptable during
    // shutdown.
    void finalizePacket();
  } catch {
    // never throw at shutdown
  }
});

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function packetForPage(page: Page): AuditPacket {
  const direct = PACKET_BY_PAGE.get(page);
  if (direct) return direct;

  // Fallback: pick the most-recently-created live packet. Works for the
  // common single-page-per-test case even if WeakMap missed (e.g. popup).
  const live = Array.from(PACKETS_BY_SLUG.values()).filter(
    (p) => !p.finishedAt,
  );
  if (live.length) return live[live.length - 1]!;
  const all = Array.from(PACKETS_BY_SLUG.values());
  if (all.length) return all[all.length - 1]!;
  throw new Error(
    "No audit packet has been initialised — is auditedTest in use?",
  );
}

async function captureScreenshot(
  page: Page,
  packet: AuditPacket,
  index: number,
  stepName: string,
  phase: StepPhase,
): Promise<string> {
  const fileName = `${String(index).padStart(2, "0")}-${slugify(stepName)}-${phase}.png`;
  const absPath = path.join(packet.outputDir, "screenshots", fileName);
  try {
    await page.screenshot({ path: absPath, fullPage: false });
  } catch {
    // page may already be closed (e.g. error captured after navigation away)
  }
  return path.relative(packet.outputDir, absPath);
}

function writePacketSync(packet: AuditPacket): void {
  const auditJsonPath = path.join(packet.outputDir, "audit.json");
  fs.writeFileSync(
    auditJsonPath,
    JSON.stringify(packet, null, 2) + "\n",
    "utf8",
  );
  upsertManifestEntry(packet);
}

function upsertManifestEntry(packet: AuditPacket): void {
  type Manifest = {
    runStamp: string;
    tests: Array<{ slug: string; dir: string }>;
  };
  let manifest: Manifest = { runStamp: RUN_STAMP, tests: [] };
  if (fs.existsSync(SUITE_MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(
        fs.readFileSync(SUITE_MANIFEST_PATH, "utf8"),
      ) as Manifest;
      if (!Array.isArray(manifest.tests)) manifest.tests = [];
    } catch {
      manifest = { runStamp: RUN_STAMP, tests: [] };
    }
  }
  if (!manifest.tests.some((t) => t.slug === packet.testSlug)) {
    manifest.tests.push({ slug: packet.testSlug, dir: packet.outputDir });
    fs.writeFileSync(
      SUITE_MANIFEST_PATH,
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8",
    );
  }
}

async function loadAllPacketsFromDisk(): Promise<AuditPacket[]> {
  if (!fs.existsSync(SUITE_MANIFEST_PATH)) {
    return Array.from(PACKETS_BY_SLUG.values());
  }
  try {
    const manifest = JSON.parse(
      await fsp.readFile(SUITE_MANIFEST_PATH, "utf8"),
    ) as {
      tests: Array<{ slug: string; dir: string }>;
    };
    const out: AuditPacket[] = [];
    for (const entry of manifest.tests) {
      const auditPath = path.join(entry.dir, "audit.json");
      try {
        const raw = await fsp.readFile(auditPath, "utf8");
        out.push(JSON.parse(raw) as AuditPacket);
      } catch {
        // skip malformed packets — finalise is best-effort
      }
    }
    return out;
  } catch {
    return Array.from(PACKETS_BY_SLUG.values());
  }
}

function makeMetaStep(
  packet: AuditPacket,
  kind: "note",
  text: string,
): StepRecord {
  return {
    index: packet.steps.length + 1,
    name: `[${kind}] ${text.slice(0, 80)}`,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 0,
    pageUrl: "",
    screenshots: {},
    assertions: [],
    status: "note",
    notes: text,
  };
}

async function tryReadText(
  root: ReturnType<Page["locator"]>,
  selector: string,
): Promise<string | undefined> {
  try {
    const locator = root.locator(selector).first();
    if (await locator.count()) {
      const text = (await locator.innerText({ timeout: 800 })).trim();
      return text || undefined;
    }
  } catch {
    // selector did not resolve in time
  }
  return undefined;
}

function safeUrl(page: Page): string {
  try {
    return page.url();
  } catch {
    return "";
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "unnamed"
  );
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function formatRunStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `-${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`
  );
}

function mapStatus(status: TestInfo["status"]): AuditPacket["status"] {
  switch (status) {
    case "passed":
    case "failed":
    case "timedOut":
    case "interrupted":
    case "skipped":
      return status;
    default:
      return "unknown";
  }
}

function summariseStatuses(packets: AuditPacket[]): string {
  if (!packets.length) return "(none)";
  const counts = new Map<string, number>();
  for (const p of packets) {
    const key = p.status ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");
}

function escapeMd(input: string): string {
  return input.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
