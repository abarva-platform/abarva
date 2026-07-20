import "server-only";

// ── Design Session Pack generator (PR-6) ──────────────────────────────────────
// Renders a MovePhasePlaybook (its facilitated sessions, discussion guides,
// frameworks, capture templates, homework, and gates) into a styled HTML pack a
// consulting team can hand to a client to run the phase — then stores it in the
// Artifact Vault (family: session_artifact) so it lives in the File Cabinet
// like any other Move artifact. This is the "give them a framework + homework +
// templates + sessions, capture alignment, THEN compose the deliverable" spine.

import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import {
  WORKSHOP_TEMPLATES,
  type MovePhasePlaybook,
  type MovePhaseSession,
  type WorkshopTemplateKind,
} from "./move-phase-playbook";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  APPROVAL_ROLE_LABELS,
  getRoleApprovalSummary,
  requiredApprovalRolesFor,
  type RoleApprovalSummary,
} from "@/lib/programs/deliverable-role-approvals";
import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";

/** Real per-role approval status, keyed by deliverableTypeKey — only present
 *  for the types that both (a) require role approvals and (b) already have a
 *  real `deliverables_v2` row for this program. Absent/empty for everything
 *  else, in which case the appendix falls back to its original blank
 *  fill-in-the-blank template — this is purely additive. */
export type ApprovalPageRenderData = Record<string, RoleApprovalSummary>;

/**
 * Resolve real tracked role-approval status for whichever of the playbook's
 * `feedsDeliverables` type keys require role approval AND already have a
 * real deliverable row for this program. A type with no required roles, or
 * with no deliverable generated yet, is simply absent from the result — the
 * appendix renders its blank template for those, exactly as before.
 */
export async function fetchApprovalPageData(
  ctx: TenancyCtx,
  programId: string,
  deliverableTypeKeys: string[],
  opts: { supabase?: SupabaseClient } = {},
): Promise<ApprovalPageRenderData> {
  const covered = deliverableTypeKeys.filter((k) => requiredApprovalRolesFor(k).length > 0);
  if (covered.length === 0) return {};

  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("deliverables_v2")
    .select("id, deliverable_type_key")
    .eq("engagement_id", programId)
    .in("deliverable_type_key", covered);
  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: string; deliverable_type_key: string }>;
  const result: ApprovalPageRenderData = {};
  for (const row of rows) {
    result[row.deliverable_type_key] = await getRoleApprovalSummary(
      ctx,
      programId,
      row.id,
      row.deliverable_type_key,
      { supabase: sb },
    );
  }
  return result;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ol(items: string[]): string {
  return `<ol>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
}
function ul(items: string[]): string {
  return `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
}

function renderAlignmentPoints(session: MovePhaseSession): string {
  if (!session.alignmentPoints?.length) return "";
  const rows = session.alignmentPoints
    .map(
      (a) =>
        `<tr><td><strong>${esc(a.betweenRoles[0])}</strong> ↔ <strong>${esc(a.betweenRoles[1])}</strong></td><td>${esc(a.question)}</td></tr>`,
    )
    .join("");
  return `<h4>Alignment needed</h4>
    <table><tr><th>Between</th><th>Must agree on</th></tr>${rows}</table>`;
}

function renderFacilitationNotes(session: MovePhaseSession): string {
  const f = session.facilitation;
  if (!f) return "";
  return `<h4>Facilitator notes</h4>
    <div class="facilitation">
      <div><strong>Open with:</strong> ${esc(f.opening)}</div>
      <div><strong>Close by confirming:</strong> ${esc(f.closing)}</div>
      ${f.probeIfWeak.length ? `<div><strong>If the room gives a weak answer, probe:</strong>${ul(f.probeIfWeak)}</div>` : ""}
      ${f.disagreementSignals.length ? `<div><strong>Watch for real disagreement:</strong>${ul(f.disagreementSignals)}</div>` : ""}
      <div><strong>Parking lot rule:</strong> ${esc(f.parkingLotRule)}</div>
    </div>`;
}

function renderSessionWorkshopTemplateRefs(session: MovePhaseSession): string {
  if (!session.workshopTemplates?.length) return "";
  const labels = session.workshopTemplates
    .map((k) => WORKSHOP_TEMPLATES[k]?.label ?? k)
    .join(", ");
  return `<div class="muted">Workshop templates used: ${esc(labels)} — see appendix.</div>`;
}

function formatDecidedAt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  approved: "Approved",
  rejected: "Rejected",
};

/** Real per-role rows for the approval_page kind, one row per required role
 *  across every deliverable type this data covers — real approver name,
 *  status, and decided date instead of the blank template row. */
function realApprovalPageRows(approvalData: ApprovalPageRenderData): string {
  const rows = Object.entries(approvalData).flatMap(([deliverableTypeKey, summary]) =>
    summary.records
      .filter((r) => summary.requiredRoles.includes(r.role))
      .map(
        (r) =>
          `<tr><td>${esc(APPROVAL_ROLE_LABELS[r.role])} <span class="muted">(${esc(deliverableTypeKey.replace(/_/g, " "))})</span></td><td>${esc(r.approverName ?? "—")}</td><td>${esc(STATUS_LABEL[r.status] ?? r.status)}</td><td>${esc(formatDecidedAt(r.decidedAt))}</td></tr>`,
      ),
  );
  return rows.join("");
}

/** Standalone, reusable workshop-template appendix — one instance per kind used
 *  across the whole pack, not repeated per session. `approvalData`, when
 *  non-empty, replaces the approval_page kind's blank row with the real
 *  tracked per-role status for whichever deliverables already have one —
 *  every other kind, and approval_page itself when there's no real data yet,
 *  keeps rendering its original blank fill-in-the-blank row unchanged. */
function renderWorkshopTemplateAppendix(
  kinds: WorkshopTemplateKind[],
  approvalData: ApprovalPageRenderData = {},
): string {
  if (kinds.length === 0) return "";
  const hasRealApprovalData = Object.keys(approvalData).length > 0;
  const sections = kinds
    .map((k) => {
      const spec = WORKSHOP_TEMPLATES[k];
      const body =
        k === "approval_page" && hasRealApprovalData
          ? realApprovalPageRows(approvalData)
          : `<tr>${spec.columns.map(() => "<td>&nbsp;</td>").join("")}</tr>`;
      return `<div class="wt"><h3>${esc(spec.label)}</h3>
        <table><tr>${spec.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>
        ${body}</table></div>`;
    })
    .join("");
  return `<h2>Workshop Template Appendix</h2>
    <p class="muted">Blank, reusable templates referenced by the sessions above — print or copy one per session as needed.</p>
    ${sections}`;
}

export function renderDesignSessionPackHtml(
  playbook: MovePhasePlaybook,
  moveName: string,
  approvalData: ApprovalPageRenderData = {},
): string {
  const sessions = playbook.sessions
    .map((s, i) => {
      const frameworks = s.frameworks
        .map(
          (f) =>
            `<div class="fw"><div class="fw-h">${esc(f.label)}</div>
             <div class="muted">${esc(f.purpose)}</div>
             <table><tr>${f.dimensions.map((d) => `<th>${esc(d)}</th>`).join("")}</tr>
             <tr>${f.dimensions.map(() => "<td>&nbsp;</td>").join("")}</tr></table></div>`,
        )
        .join("");
      const gateTone = s.gate.severity === "hard" ? "hard" : "soft";
      return `<section class="session">
        <h3>${esc(s.label)}</h3>
        <p class="obj">${esc(s.objective)}</p>
        <div class="kv"><strong>In the room:</strong> ${s.participants.map(esc).join(" · ")}</div>
        <h4>Pre-session homework</h4>${ul(s.homework)}
        ${renderFacilitationNotes(s)}
        <h4>Discussion guide</h4>${ol(s.discussionGuide)}
        <h4>Frameworks to apply</h4>${frameworks}
        <h4>Capture template</h4>${ul(s.captureTemplate)}
        ${renderAlignmentPoints(s)}
        <div class="gate ${gateTone}"><strong>Alignment gate (${esc(s.gate.severity)}):</strong>
          ${esc(s.gate.criterion)} <span class="muted">— signed by ${esc(s.gate.alignedBy)}</span></div>
        <div class="muted feeds">Feeds: ${s.feedsDeliverables.map((d) => esc(d.replace(/_/g, " "))).join(", ")}</div>
        ${renderSessionWorkshopTemplateRefs(s)}
        ${i < playbook.sessions.length - 1 ? '<hr class="soft"/>' : ""}
      </section>`;
    })
    .join("");
  const allTemplateKinds = Array.from(
    new Set(playbook.sessions.flatMap((s) => s.workshopTemplates ?? [])),
  );
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>${esc(moveName)} — ${esc(playbook.label)} Design Session Pack</title>
<style>
  body{font-family:"DM Sans",system-ui,sans-serif;color:#1a1a18;max-width:840px;margin:40px auto;padding:0 28px;line-height:1.55;background:#f8f7f4}
  h1{font-family:Georgia,serif;font-weight:400;font-size:30px;margin-bottom:2px}
  h2{font-family:Georgia,serif;font-weight:400;font-size:19px;border-bottom:1px solid #e3e6eb;padding-bottom:6px;margin-top:32px}
  h3{font-family:Georgia,serif;font-weight:400;font-size:17px;margin:24px 0 4px}
  h4{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#5a6472;margin:16px 0 4px}
  .sub{color:#5a6472;font-size:14px;margin-bottom:8px}
  .obj{font-size:15px;margin:4px 0 10px}
  .kv{font-size:13.5px;color:#37414f}
  table{border-collapse:collapse;width:100%;font-size:12.5px;margin:6px 0}
  th,td{border:1px solid #e3e6eb;padding:6px 9px;text-align:left}
  th{background:#f1f2f4}
  ul,ol{margin:6px 0;padding-left:22px}
  li{margin:3px 0}
  .fw{margin:8px 0 12px}.fw-h{font-weight:600;font-size:13.5px}
  .muted{color:#9aa3b2;font-size:12.5px}
  .gate{margin:12px 0;padding:9px 13px;border-radius:6px;font-size:13.5px}
  .gate.hard{background:#fdecea;color:#7a1d12}.gate.soft{background:#fff4e5;color:#7a4d00}
  .feeds{margin-top:6px}
  hr.soft{border:none;border-top:1px dashed #d5dae2;margin:22px 0}
  .session{margin-bottom:6px}
  .facilitation{background:#eef2f7;border-radius:6px;padding:10px 14px;margin:6px 0 12px;font-size:13px}
  .facilitation>div{margin:5px 0}
  .facilitation ul{margin:2px 0 4px 20px}
  .wt{margin:14px 0 20px}
</style></head><body>
<h1>${esc(moveName)}</h1>
<div class="sub">${esc(playbook.label)} — Design Session Pack</div>
<h2>How to use this pack</h2>
<p>${esc(playbook.intent)} Run the sessions in order. Each has homework to do
beforehand, a discussion guide to facilitate, frameworks to fill in the room,
a capture template to complete, and an alignment gate that closes it. The
captured outputs become the attested inputs for the deliverables named under
each session — nothing in the final documents is invented.</p>
${sessions}
<hr/>
${renderWorkshopTemplateAppendix(allTemplateKinds, approvalData)}
<hr/>
<p class="muted">Governed session pack — generated by AbarVa Nexus and stored in
the Move Artifact Vault. Complete the capture templates and upload them to feed
the phase deliverables.</p>
</body></html>`;
}

/** Render the Design Session Pack and store it in the vault (session_artifact). */
export async function generateDesignSessionPack(
  ctx: TenancyCtx,
  input: { moveId: string; moveName: string; playbook: MovePhasePlaybook },
): Promise<{ artifactId: string; blobStored: boolean }> {
  const feedsDeliverableTypeKeys = Array.from(
    new Set(input.playbook.sessions.flatMap((s) => s.feedsDeliverables)),
  );
  const approvalData = await fetchApprovalPageData(
    ctx,
    input.moveId,
    feedsDeliverableTypeKeys,
  );
  const html = renderDesignSessionPackHtml(input.playbook, input.moveName, approvalData);
  const fileName = `${input.moveName.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 60)}_P${input.playbook.phase}_Design_Session_Pack.html`;
  const saved = await saveMoveArtifact(ctx, {
    moveId: input.moveId,
    phase: input.playbook.phase,
    artifactType: "design_session_pack",
    artifactFamily: "session_artifact",
    title: `${input.playbook.label} — Design Session Pack`,
    description: `${input.playbook.sessions.length} facilitated sessions with discussion guides, frameworks, capture templates, and alignment gates.`,
    fileName,
    fileFormat: "html",
    body: html,
    status: "aligned",
    sourceBasis: "facilitated_session_framework",
    confidence: "high",
    citationReady: false,
    generatedBy: "move-phase-playbook",
    metadata: {
      phase: input.playbook.phase,
      sessionCount: input.playbook.sessions.length,
      sessionIds: input.playbook.sessions.map((s) => s.id),
    },
  });
  return { artifactId: saved.artifactId, blobStored: saved.blobStored };
}
