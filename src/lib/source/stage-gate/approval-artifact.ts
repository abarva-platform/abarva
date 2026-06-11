// Approval artifact — render a Maestro ApprovalRecord to HTML and persist it durably in
// the Source File Cabinet (group 'approval'), so every gate decision is recoverable with
// its rationale, gaps, risks, follow-ups, and readiness snapshot.

import 'server-only';

import { persistSourceArtifact as defaultPersist } from '@/lib/source/file-cabinet/service';
import type { SourceArtifactRecord } from '@/lib/source/file-cabinet/types';
import type { ApprovalRecord } from './types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderApprovalRecordHtml(rec: ApprovalRecord): string {
  const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '<p style="color:#9a9a9a">(none)</p>');
  const follow = rec.followUpItems.length
    ? `<ul>${rec.followUpItems.map((f) => `<li>${esc(f.item)} — <b>${esc(f.owner)}</b></li>`).join('')}</ul>`
    : '<p style="color:#9a9a9a">(none)</p>';
  const snap = rec.readinessSnapshot;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Gate Approval — ${esc(rec.stageName)}</title><style>
  body{background:#F8F7F4;color:#1a1a1a;font-family:'DM Sans',Inter,sans-serif;line-height:1.55}
  .wrap{max-width:820px;margin:0 auto;padding:36px 26px 70px}
  h1,h2{font-family:Georgia,serif;font-weight:400;color:#0C1A3A}h1{font-size:26px}h2{font-size:18px;border-bottom:1px solid #e4e1da;padding-bottom:5px;margin-top:26px}
  .meta{background:#fff;border:1px solid #e4e1da;border-radius:8px;padding:12px 16px;font-size:13px}
  .meta div{margin:3px 0}.tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#0C1A3A;color:#fff}
  ul{padding-left:18px;font-size:13px}</style></head><body><div class="wrap">
  <h1>Gate Approval Record</h1>
  <p style="color:#706D66">${esc(rec.archetype)} · ${esc(rec.stageName)}</p>
  <div class="meta">
    <div><b>Decision:</b> <span class="tag">${esc(rec.decision)}</span></div>
    <div><b>Approver:</b> ${esc(rec.approver)}</div>
    <div><b>Approved at:</b> ${esc(rec.approvedAt)}</div>
    <div><b>Artifact label:</b> ${esc(rec.artifactLabel)} · <b>Issue-ready allowed:</b> ${rec.allowIssueReady ? 'yes' : 'no'}</div>
    <div><b>Readiness at decision:</b> ${Math.round(snap.currentCompletion * 100)}% · minimum-viable ${snap.minimumViableMet ? 'met' : 'NOT met'} · ${snap.gapCount} gap(s) · prior status ${esc(snap.gateStatusBeforeDecision)}</div>
  </div>
  <h2>Rationale</h2><p>${rec.rationale ? esc(rec.rationale) : '<span style="color:#9a9a9a">(none provided)</span>'}</p>
  <h2>Gaps acknowledged</h2>${list(rec.gapsAcknowledged)}
  <h2>Risks accepted</h2>${list(rec.risksAccepted)}
  <h2>Downstream impacts (stay preliminary)</h2>${list(rec.downstreamImpacts)}
  <h2>Follow-up items</h2>${follow}
  </div></body></html>`;
}

export interface PersistApprovalDeps {
  persist?: typeof defaultPersist;
}

export async function persistApprovalArtifact(
  rec: ApprovalRecord,
  opts: { clientId: string; tenantKey: string; sourceEventId: string; generatedBy?: string },
  deps: PersistApprovalDeps = {},
): Promise<SourceArtifactRecord> {
  const persist = deps.persist ?? defaultPersist;
  const html = renderApprovalRecordHtml(rec);
  return persist({
    clientId: opts.clientId,
    tenantKey: opts.tenantKey,
    sourceEventId: opts.sourceEventId,
    artifactGroup: 'approval',
    artifactType: `gate_approval__${rec.stageKey}`,
    sourcingStage: rec.stageKey,
    title: `Gate Approval — ${rec.stageName}`,
    fileName: `gate_approval_${rec.stageKey}.html`,
    fileFormat: 'html',
    bytes: Buffer.from(html, 'utf8'),
    status: 'approved',
    generatedBy: opts.generatedBy,
  });
}
