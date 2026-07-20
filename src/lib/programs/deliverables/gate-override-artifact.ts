import "server-only";

// ── Phase Gate Decision Record (PR-4: Phase Gate Flexibility) ─────────────────
// When a Move advances a phase, a durable decision record is written to the
// Artifact Vault (family: approval_artifact). It captures the transition, the
// approver, the rationale, the disposition, and crucially the CARRIED-FORWARD
// GAPS (the soft-fail checks that were not satisfied) so they remain visible
// downstream rather than disappearing the moment the gate is crossed.
//
// INCIDENT 2026-07-20 correction: this record used to collapse two distinct
// situations into one `override: boolean` field, labeled "(override)" in the
// artifact title whenever ANY soft (non-blocking) criterion was unmet. That
// is a normal, hard-gate-clean pass with an optional gap acknowledged and
// carried forward — nobody bypassed anything. A real Move (MEMBER AI ASSIST)
// advanced P3->P4 with zero real deliverables ever generated and the record
// read "Phase Gate Decision — P3 → P4 (override)", which read as if a human
// had explicitly bypassed a gate. No such bypass occurred or was even
// possible through that route (see phase-gate-approval/route.ts) — hard
// checks always block there; the "(override)" label was simply wrong for
// what a soft-carry pass actually is.
//
// `softGapsCarried` and `hardGateOverride` are now tracked separately so the
// word "override" is reserved exclusively for a genuine, explicit, authorized
// hard-gate bypass — a capability neither phase-gate-approval/route.ts nor
// advance/route.ts currently implements (both unconditionally block on any
// hard-severity check regardless of any bypass flag sent). `hardGateOverride`
// is therefore always `null` today; it exists so a future, deliberately
// designed governed hard-override capability (explicit role, mandatory
// reason, named approver, timestamp, immutable audit record, optional second
// approval) has an honest place to record itself without resurrecting this
// mislabeling.

import { saveMoveArtifact } from "./move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";

export interface GateCheckLike {
  check: string;
  reason?: string | null;
  severity: "hard" | "soft";
}

/**
 * A genuine, explicit, authorized bypass of a HARD gate check. This is a
 * distinct, higher-severity event from a soft-gap carry — it means a human
 * with override authority chose to advance despite an unmet blocking
 * criterion. No code path can produce a non-null value here today (hard
 * checks always block); this shape exists so that capability, if ever built,
 * has a governed, honestly-labeled place to land.
 */
export interface HardGateOverrideRecord {
  authorizedByName: string;
  authorizedByRole: string;
  reason: string;
  overriddenChecks: GateCheckLike[];
  secondApproverName?: string | null;
  timestampIso: string;
}

export interface GateDecisionInput {
  moveId: string;
  moveName?: string;
  fromPhase: number;
  toPhase: number;
  approverName: string;
  approverRole: string;
  rationale: string;
  /**
   * True when the phase advanced with unmet SOFT (non-blocking) checks
   * carried forward — a normal, hard-gate-clean pass. This is NOT an
   * override: nobody bypassed anything, and every hard check passed for
   * real. Never render this as "override" in any label or UI.
   */
  softGapsCarried: boolean;
  /**
   * Present only when a genuine hard-gate bypass was explicitly authorized.
   * Always null today — see the module comment above.
   */
  hardGateOverride?: HardGateOverrideRecord | null;
  /** soft-fail checks not satisfied at advance time — the carried-forward gaps. */
  carriedGaps: GateCheckLike[];
  assumptions?: readonly string[];
  missingInputs?: readonly string[];
  approvalId?: string | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderRecordHtml(i: GateDecisionInput, generatedAt: string): string {
  const disposition = i.hardGateOverride
    ? "Hard-gate override — advanced despite an unmet blocking criterion"
    : i.softGapsCarried
      ? "Advanced with carried-forward gap(s) — every hard check passed"
      : "Clean advance — gate criteria satisfied";
  const isOverride = Boolean(i.hardGateOverride);
  const gapRows =
    i.carriedGaps.length === 0
      ? `<tr><td colspan="2" style="color:#1E7E34">None — all gate criteria were satisfied.</td></tr>`
      : i.carriedGaps
          .map(
            (g) =>
              `<tr><td><code>${esc(g.check)}</code></td><td>${esc(
                g.reason ?? "Not satisfied at advance time",
              )}</td></tr>`,
          )
          .join("");
  const li = (arr?: readonly string[]) =>
    arr && arr.length
      ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
      : `<p class="muted">None recorded.</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Phase Gate Decision Record</title>
<style>
  body{font-family:Georgia,serif;color:#1A1A18;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.5}
  h1{font-size:24px;font-weight:400}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#5A6472;margin-top:28px;font-family:Arial,sans-serif}
  table{border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px}
  td,th{border:1px solid #E3E6EB;padding:7px 10px;text-align:left;vertical-align:top}
  th{background:#F4F5F7}
  code{font-family:Menlo,monospace;font-size:12px;background:#F4F5F7;padding:1px 5px;border-radius:3px}
  .muted{color:#9AA3B2;font-family:Arial,sans-serif;font-size:13px}
  .meta{font-family:Arial,sans-serif;font-size:13px;color:#5A6472}
  .banner{padding:10px 14px;border-radius:6px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;margin:14px 0}
  .ovr{background:#FDE8E8;color:#B3261E}
  .soft{background:#FFF4E5;color:#B26A00}
  .clean{background:#E6F4EA;color:#1E7E34}
</style></head><body>
<h1>Phase Gate Decision Record</h1>
<div class="meta">${esc(i.moveName ?? "Strategic Move")} &middot; Phase ${i.fromPhase} &rarr; ${i.toPhase} &middot; ${esc(generatedAt)}</div>
<div class="banner ${isOverride ? "ovr" : i.softGapsCarried ? "soft" : "clean"}">${esc(disposition)}</div>
<h2>Decision</h2>
<table>
  <tr><th>Transition</th><td>Phase ${i.fromPhase} &rarr; Phase ${i.toPhase}</td></tr>
  <tr><th>Approver</th><td>${esc(i.approverName)} (${esc(i.approverRole)})</td></tr>
  <tr><th>Disposition</th><td>${esc(disposition)}</td></tr>
  ${i.approvalId ? `<tr><th>Approval ID</th><td><code>${esc(i.approvalId)}</code></td></tr>` : ""}
</table>
${
  i.hardGateOverride
    ? `<h2>Hard-gate override</h2>
<p class="muted">A blocking (hard) gate criterion was explicitly bypassed by an authorized approver. This is a governed exception, not a normal pass.</p>
<table>
  <tr><th>Authorized by</th><td>${esc(i.hardGateOverride.authorizedByName)} (${esc(i.hardGateOverride.authorizedByRole)})</td></tr>
  <tr><th>Reason</th><td>${esc(i.hardGateOverride.reason)}</td></tr>
  <tr><th>Second approver</th><td>${i.hardGateOverride.secondApproverName ? esc(i.hardGateOverride.secondApproverName) : `<span class="muted">None recorded</span>`}</td></tr>
  <tr><th>Timestamp</th><td>${esc(i.hardGateOverride.timestampIso)}</td></tr>
</table>
<table><tr><th>Overridden hard criterion</th><th>Reason it was unmet</th></tr>${i.hardGateOverride.overriddenChecks
        .map(
          (g) =>
            `<tr><td><code>${esc(g.check)}</code></td><td>${esc(g.reason ?? "Not satisfied at advance time")}</td></tr>`,
        )
        .join("")}</table>`
    : ""
}
<h2>Rationale</h2>
<p>${esc(i.rationale)}</p>
<h2>Carried-forward gaps (soft, non-blocking)</h2>
<p class="muted">These criteria were not satisfied at advance time. They remain
open obligations; downstream deliverables resting on them stay preliminary
until the gaps are closed and committed. Every HARD (blocking) criterion
passed for real — this is not an override.</p>
<table><tr><th>Gate criterion</th><th>Why it remains open</th></tr>${gapRows}</table>
<h2>Stated assumptions</h2>
${li(i.assumptions)}
<h2>Missing inputs acknowledged</h2>
${li(i.missingInputs)}
<hr/>
<p class="muted">Governed record — generated by AbarVa Nexus and stored in the
Move Artifact Vault. Audit evidence for the phase advance.</p>
</body></html>`;
}

/**
 * Persist a Phase Gate Decision Record to the vault. Best-effort: never throws
 * (an advance must not fail because the record could not be written), but
 * returns the result so the caller can surface storage state honestly.
 */
export async function saveGateDecisionArtifact(
  ctx: TenancyCtx,
  input: GateDecisionInput,
): Promise<{ artifactId: string; blobStored: boolean } | null> {
  try {
    const generatedAt = new Date().toISOString();
    const html = renderRecordHtml(input, generatedAt.slice(0, 16));
    const fileName = `Phase_Gate_Decision_P${input.fromPhase}_to_P${input.toPhase}.html`;
    const isHardOverride = Boolean(input.hardGateOverride);
    // A soft-carry pass is a normal, hard-gate-clean advance — status stays
    // "approved" (flagged for follow-up on the carried gaps, not blocked). A
    // hard-gate override is the only status that means a human bypassed a
    // blocking criterion; it always requires review.
    const status = isHardOverride ? "review_required" : "approved";
    const titleSuffix = isHardOverride
      ? " (hard-gate override)"
      : input.softGapsCarried
        ? " (soft gaps carried)"
        : "";
    const saved = await saveMoveArtifact(ctx, {
      moveId: input.moveId,
      phase: input.toPhase,
      artifactType: "phase_gate_decision",
      artifactFamily: "approval_artifact",
      title: `Phase Gate Decision — P${input.fromPhase} → P${input.toPhase}${titleSuffix}`,
      description: isHardOverride
        ? `Hard-gate override authorized by ${input.hardGateOverride?.authorizedByName ?? "an approver"}: ${input.hardGateOverride?.reason ?? ""}`.trim()
        : input.softGapsCarried
          ? `Advanced with ${input.carriedGaps.length} carried-forward (soft) gap(s); every hard check passed.`
          : "Gate criteria satisfied.",
      fileName,
      fileFormat: "html",
      body: html,
      status,
      sourceBasis: "governed_gate_evaluation",
      confidence: "high",
      citationReady: true,
      generatedBy: input.approverName,
      metadata: {
        softGapsCarried: input.softGapsCarried,
        hardGateOverride: input.hardGateOverride ?? null,
        carriedGaps: input.carriedGaps,
        assumptions: input.assumptions ?? [],
        missingInputs: input.missingInputs ?? [],
        approvalId: input.approvalId ?? null,
        fromPhase: input.fromPhase,
        toPhase: input.toPhase,
      },
    });
    return { artifactId: saved.artifactId, blobStored: saved.blobStored };
  } catch {
    return null;
  }
}
