/** Write-enabled synthetic walk. Every mutation uses the dedicated identity. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { stepPageHref } from "../../src/lib/programs/step-page-views";
import { DEMO_SAFE_CLIENT_NAMES } from "../../src/lib/client-config";
import { captureWalkDomSnapshot } from "./_helpers/moves-walk-ux-capture";
import { scoreWalkUx, type WalkUxInput, type UxVariant } from "./_helpers/moves-walk-ux-score";
import { assertDedicatedOperator, prepareDedicatedOperator, signInDedicatedOperator, type DedicatedOperator } from "./_helpers/moves-dedicated-operator";

const BASE = "https://app.abarva.ai";
const PACK = path.resolve("datasets/tenant-inputs/meridian-health/moves/denials-pack-v1");
const FORBIDDEN_MOVE = "1557f032-5a5c-4475-abe5-b1a841576649";
const forbiddenControl = /rebuild|sign off anyway|acknowledg.*block|delete|archive|reset|impersonat/i;
const sha = (value: string | Buffer) => crypto.createHash("sha256").update(value).digest("hex");
const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
type Action = { kind: "click" | "check" | "uncheck" | "fill" | "select" | "upload" | "download"; label: string; value?: string; file?: string; scopeId?: string; reviewedArtifact?: string };
interface Review {
  runId: string; operatorId: string; moveId: string | null; stepId: string;
  pageHash: string; actions: Action[]; complete: boolean;
  followability: { instructionClarity: number; controlDiscoverability: number; inputDesignFit: number; comment: string };
  draftReview: { accepted: number; edited: number; rejected: number; comment: string };
  artifactReviews?: Array<{ filename: string; sha256: string; accepted: boolean; findings: string[] }>;
}

test.use({ baseURL: BASE, storageState: { cookies: [], origins: [] }, trace: "off", video: "off" });
test.describe("dedicated synthetic denials walk", () => {
  test.describe.configure({ retries: 0 });

  test("walk all 29 steps under the operator and save honest review evidence", async ({ page }, info) => {
    test.skip(process.env.MOVES_E2E_WRITE_RUN !== "brief-p-approved", "Requires the named Brief P operator approval and private credentials.");
    test.setTimeout(10 * 60 * 60 * 1000);
    const out = process.env.MOVES_E2E_REPORT_DIR;
    if (!out || !path.isAbsolute(out)) throw new Error("private_absolute_report_directory_required");
    fs.mkdirSync(out, { recursive: true, mode: 0o700 });
    const runId = `denials-${new Date().toISOString().replace(/[^0-9]/g, "")}`;
    const steps = JSON.parse(fs.readFileSync(path.join(PACK, "walk-notes.json"), "utf8")).steps as Array<{ stepId: string; phase: number; title: string; uploads: string[]; pasteBlock: string; manualFields: Record<string, string>; humanClicks: string[] }>;
    expect(steps).toHaveLength(29);
    const manifest = JSON.parse(fs.readFileSync(path.join(PACK, "reconciliation-proof.json"), "utf8"));
    const report: Record<string, unknown> = { runId, startedAt: new Date().toISOString(), status: "preparing", operator: null, moveId: null, steps: [], artifacts: [], findings: [], actionLog: [], acceptance: false };
    const persist = () => {
      fs.writeFileSync(path.join(out, "e2e-report.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
      const completedSteps = report.steps as Array<{ stepId: string; title: string; clicks: number; elapsedSeconds: number; followability: Review["followability"] }>;
      const rows = completedSteps.map((step) => `<tr><th>${escape(step.stepId)}</th><td>${escape(step.title)}</td><td>${step.followability.instructionClarity}/5</td><td>${step.followability.controlDiscoverability}/5</td><td>${step.followability.inputDesignFit}/5</td><td>${step.clicks}</td><td>${Math.round(step.elapsedSeconds)}s</td></tr>`).join("");
      const screenshots = fs.readdirSync(out).filter((file) => /\.png$/.test(file)).map((file) => `<details><summary>${escape(file)}</summary><img loading="lazy" src="${encodeURIComponent(file)}" alt="${escape(file)}"></details>`).join("");
      fs.writeFileSync(path.join(out, "e2e-report.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic automated Moves walk</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:0 16px}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc;text-align:left}details{margin:12px 0}</style><h1>Synthetic automated Moves walk</h1><p>Run ${escape(runId)}. Status: ${escape(String(report.status))}. Acceptance: ${report.acceptance === true ? "passed" : "not established"}.</p><p>Operator: ${escape(JSON.stringify(report.operator))}. New Move: ${escape(String(report.moveId ?? "not created"))}. Steps reviewed: ${completedSteps.length}/29.</p><h2>Step reviews</h2><table><thead><tr><th>Step</th><th>Title</th><th>Instructions</th><th>Controls</th><th>Inputs</th><th>Clicks</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table><h2>Screenshots</h2>${screenshots}<h2>Evidence and findings</h2><pre>${escape(JSON.stringify(report, null, 2))}</pre></html>`, { mode: 0o600 });
    };
    persist();
    let operator: DedicatedOperator;
    let moveId: string | null = null;
    let clicks = 0;
    let actionsPerformed = 0;
    const artifacts: Array<{ filename: string; sha256: string; status: string }> = [];
    const uploadHashes = new Map<string, string>();
    // The shipped reconciliation proof declares the eight exact file bytes.
    const manifestText = JSON.stringify(manifest);
    for (const step of steps) for (const filename of step.uploads) {
      if (!/^0[1-8]-[^/\\]+\.(?:docx|xlsx|md|pdf)$/.test(filename)) throw new Error("upload_outside_approved_pack_refused");
      const digest = sha(fs.readFileSync(path.join(PACK, filename)));
      if (!manifestText.includes(digest)) throw new Error("approved_pack_byte_mismatch");
      uploadHashes.set(filename, digest);
    }

    const assertScope = async () => {
      await assertDedicatedOperator(page, operator);
      const url = new URL(page.url());
      if (url.origin !== BASE || url.href.includes(FORBIDDEN_MOVE) ||
        !(url.pathname === "/strategic-moves/new" || moveId && url.pathname.startsWith(`/strategic-moves/${moveId}`))) {
        throw new Error("run_move_scope_refused");
      }
    };
    const checkpoint = async (stepId: string, round: number, notes: unknown): Promise<Review> => {
      await assertScope();
      const body = await page.locator("body").innerText();
      const pageHash = sha(`${page.url()}\n${body}`);
      const prefix = `${stepId.replace(/[^A-Za-z0-9]/g, "-")}-${round}`;
      await page.screenshot({ path: path.join(out, `${prefix}.png`), fullPage: true });
      const controls = await page.locator("button,a,input,textarea,select").evaluateAll((elements) => elements.map((e) => ({ tag: e.tagName, text: e.textContent?.trim(), id: e.id,
        label: e.getAttribute("aria-label") || (e as HTMLInputElement).labels?.[0]?.textContent?.trim(), disabled: (e as HTMLButtonElement).disabled }))).catch(() => []);
      fs.writeFileSync(path.join(out, "pending-review.json"), JSON.stringify({ runId, operatorId: operator.userId, moveId, stepId, pageUrl: page.url(), pageHash, screenshot: `${prefix}.png`, body, controls, notes, artifacts }, null, 2), { mode: 0o600 });
      report.status = "awaiting_agent_visual_review"; persist();
      const reviewFile = path.join(out, "reviewed-actions.json");
      // The supervising Codex reviews the actual screenshot, drafts and
      // downloaded bytes. This is a review checkpoint, not a guessed score.
      const deadline = Date.now() + 30 * 60 * 1000;
      while (Date.now() < deadline) {
        if (fs.existsSync(reviewFile)) {
          const review = JSON.parse(fs.readFileSync(reviewFile, "utf8")) as Review;
          fs.unlinkSync(reviewFile);
          if (review.runId !== runId || review.operatorId !== operator.userId || review.moveId !== moveId ||
            review.stepId !== stepId || review.pageHash !== pageHash) throw new Error("stale_or_wrong_scope_review_refused");
          for (const key of ["instructionClarity", "controlDiscoverability", "inputDesignFit"] as const) {
            const value = review.followability?.[key];
            if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error("followability_review_invalid");
          }
          if (!Array.isArray(review.actions) || typeof review.complete !== "boolean" ||
              !review.followability.comment?.trim() || !review.draftReview?.comment?.trim() ||
              ![review.draftReview.accepted, review.draftReview.edited, review.draftReview.rejected].every((n) => Number.isInteger(n) && n >= 0)) {
            throw new Error("agent_review_incomplete");
          }
          if (sha(`${page.url()}\n${await page.locator("body").innerText()}`) !== pageHash) {
            throw new Error("page_changed_since_agent_review");
          }
          for (const artifact of review.artifactReviews ?? []) {
            const downloaded = artifacts.find((a) => a.filename === artifact.filename);
            if (!downloaded || artifact.sha256 !== downloaded.sha256 || artifact.sha256 !== sha(fs.readFileSync(path.join(out, downloaded.filename)))) throw new Error("artifact_review_scope_or_bytes_mismatch");
            downloaded.status = artifact.accepted ? "reviewed_accepted" : "reviewed_rejected";
          }
          fs.writeFileSync(path.join(out, `${prefix}-review.json`), JSON.stringify(review, null, 2), { mode: 0o600 });
          return review;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error("agent_visual_review_checkpoint_timeout");
    };
    const act = async (action: Action) => {
      await assertScope();
      if (!action.label?.trim() || forbiddenControl.test(action.label)) throw new Error("unsafe_or_unlabelled_control_refused");
      if (/^Sign off(?: v\d+)?$/.test(action.label) && !artifacts.some((a) => a.filename === action.reviewedArtifact && a.status === "reviewed_accepted")) throw new Error("unreviewed_document_signoff_refused");
      if (action.scopeId && !/^[A-Za-z0-9:_-]{1,128}$/.test(action.scopeId)) throw new Error("invalid_visible_control_scope");
      const root = action.scopeId ? page.locator(`[id="${action.scopeId}"]`) : page;
      if (action.kind === "fill") await root.getByLabel(action.label, { exact: true }).fill(action.value ?? "");
      else if (action.kind === "check" || action.kind === "uncheck") {
        if (action.kind === "check" && /notify|email|updates|subscription/i.test(action.label)) throw new Error("external_notification_not_authorized");
        await root.getByLabel(action.label, { exact: true }).setChecked(action.kind === "check");
      }
      else if (action.kind === "select") await root.getByLabel(action.label, { exact: true }).selectOption({ label: action.value! });
      else if (action.kind === "upload") {
        if (!action.file || !uploadHashes.has(action.file) || sha(fs.readFileSync(path.join(PACK, action.file))) !== uploadHashes.get(action.file)) throw new Error("unapproved_upload_refused");
        await root.getByLabel(action.label, { exact: true }).setInputFiles(path.join(PACK, action.file));
      } else if (action.kind === "download") {
        const wait = page.waitForEvent("download");
        const link = root.getByRole("link", { name: action.label, exact: true });
        if (await link.count() === 1) await link.click();
        else await root.getByRole("button", { name: action.label, exact: true }).click();
        const download = await wait;
        const filename = `${artifacts.length + 1}-${path.basename(download.suggestedFilename())}`;
        const target = path.join(out!, filename);
        await download.saveAs(target);
        artifacts.push({ filename, sha256: sha(fs.readFileSync(target)), status: "downloaded_not_reviewed" });
      } else {
        const control = root.getByRole("button", { name: action.label, exact: true });
        const link = root.getByRole("link", { name: action.label, exact: true });
        if (await control.count() === 1) await control.click();
        else if (await link.count() === 1) await link.click();
        else throw new Error("visible_control_ambiguous_or_missing");
      }
      actionsPerformed += 1;
      if (action.kind === "click" || action.kind === "download") clicks += 1;
      (report.actionLog as unknown[]).push({ stepId: (JSON.parse(fs.readFileSync(path.join(out, "pending-review.json"), "utf8")) as {stepId: string}).stepId,
        kind: action.kind, label: action.label, actorId: operator.userId, moveId, afterUrl: page.url(), at: new Date().toISOString() });
      report.artifacts = artifacts; persist();
    };
    try {
      operator = await prepareDedicatedOperator();
      report.operator = operator;
      await signInDedicatedOperator(page, operator);
      const creation = page.waitForResponse((response) => response.url().endsWith("/api/programs/origination-submit") && response.request().method() === "POST", { timeout: 30 * 60 * 1000 });
      await page.goto(`${BASE}/strategic-moves/new`, { waitUntil: "domcontentloaded" });
      report.status = "creating_new_move"; persist();
      for (let round = 0; round < 40 && !moveId; round += 1) {
        const review = await checkpoint("create", round, { title: "Claims Denial Prevention Intelligence", p0: steps.filter((s) => s.phase === 0), scope: "Dedicated automated operator; synthetic only; no sponsor emails" });
        for (const action of review.actions) await act(action);
        if (review.complete) {
          const response = await creation;
          const body = await response.json();
          if (!response.ok()) throw new Error(body.detail || body.error || `origination_http_${response.status()}`);
          const url = new URL(page.url());
          const candidate = body.programId || body.moveId || body.program?.id || url.pathname.match(/\/strategic-moves\/([0-9a-f-]{36})/)?.[1];
          if (typeof candidate !== "string" || !/^[0-9a-f-]{36}$/i.test(candidate) || candidate === FORBIDDEN_MOVE) throw new Error("new_move_id_unverified");
          moveId = candidate; report.moveId = moveId;
        }
      }
      if (!moveId) throw new Error("origination_not_completed");
      for (const step of steps) {
        const started = Date.now(); const clicksBefore = clicks; const actionsBefore = actionsPerformed;
        const stepPath = stepPageHref(moveId, step.phase, step.stepId);
        // The forward journey uses actual navigation controls. Direct URLs
        // below are separate persisted-page readbacks after the reviewed step.
        for (let round = 0; new URL(page.url()).pathname + new URL(page.url()).search !== stepPath && round < 10; round += 1) {
          const navigation = await checkpoint(`navigate:${step.stepId}`, round, { target: step.title, expectedPath: stepPath, allowed: "Visible phase, step and continuation links only." });
          for (const action of navigation.actions) {
            if (action.kind !== "click") throw new Error("navigation_review_must_use_visible_links");
            await act(action);
          }
        }
        if (new URL(page.url()).pathname + new URL(page.url()).search !== stepPath) throw new Error(`${step.stepId}_click_navigation_failed`);
        await expect(page.locator("#step-panel-title")).toBeVisible();
        let final: Review | null = null;
        for (let round = 0; round < 40; round += 1) {
          const review = await checkpoint(step.stepId, round, step);
          for (const action of review.actions) await act(action);
          if (review.complete) { final = review; break; }
        }
        if (!final) throw new Error(`${step.stepId}_not_completed`);
        const settleStarted = Date.now();
        await page.goto(`${BASE}${stepPageHref(moveId, step.phase, step.stepId)}`, { waitUntil: "domcontentloaded" });
        await expect(page.locator("#step-panel-title")).toBeVisible();
        const uxInput: WalkUxInput = { expectedTenantName: DEMO_SAFE_CLIENT_NAMES.meridian, settledHeadMs: Date.now() - settleStarted, variants: {} as WalkUxInput["variants"] };
        for (const variant of [{ key: "desktopLight", width: 1440, dark: false }, { key: "phoneLight", width: 390, dark: false }, { key: "desktopDark", width: 1440, dark: true }, { key: "phoneDark", width: 390, dark: true }]) {
          await page.setViewportSize({ width: variant.width, height: 900 });
          await page.emulateMedia({ colorScheme: variant.dark ? "dark" : "light" });
          const theme = page.getByRole("button", { name: variant.dark ? "Dark mode" : "Light mode", exact: true });
          if (await theme.count()) await theme.click();
          const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze() as { violations: Array<{ id: string; impact?: string | null }> };
          uxInput.variants[variant.key as UxVariant] = { snapshot: await captureWalkDomSnapshot(page, Number(step.stepId.split(".")[1]) - 1),
            seriousCriticalAxeIds: axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => v.id),
            contrastAxeIds: axe.violations.filter((v) => v.id === "color-contrast").map((v) => v.id) };
          await page.screenshot({ path: path.join(out, `${step.stepId}-${variant.key}.png`), fullPage: true });
        }
        (report.steps as unknown[]).push({ stepId: step.stepId, title: step.title, followability: final.followability, drafts: final.draftReview,
          clicks: clicks - clicksBefore, actionsPerformed: actionsPerformed - actionsBefore, elapsedSeconds: (Date.now() - started) / 1000, ux: scoreWalkUx(uxInput), completed: true });
        report.artifacts = artifacts; persist();
      }
      report.status = "29_steps_walked_final_artifact_and_tower_readback_pending";
      // Step execution is separate from acceptance. The final signed-in
      // read-only walk and artifact visual reviews must supply that proof.
    } catch (error) {
      report.status = "blocked";
      (report.findings as unknown[]).push({ rank: 1, kind: "refusal", sentence: error instanceof Error ? error.message : "Run refused without an error sentence.", pageUrl: page.url(), clicks, actionsPerformed });
      if (page.url().startsWith(BASE) && !page.url().includes(FORBIDDEN_MOVE)) await page.screenshot({ path: path.join(out, "refusal.png"), fullPage: true }).catch(() => {});
      throw error;
    } finally {
      report.finishedAt = new Date().toISOString(); report.artifacts = artifacts; persist();
      await info.attach("e2e-report", { path: path.join(out, "e2e-report.json"), contentType: "application/json" });
    }
  });
});
