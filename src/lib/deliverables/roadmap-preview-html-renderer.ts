import "server-only";

// PR7 — the in-product HTML PREVIEW renderer.
//
// HTML is NOT the client deliverable — it is the in-product preview / review /
// QA / evidence-inspection surface. It renders from the SAME shared
// RoadmapPresentationContract (PR4) as the PPTX (PR5) and DOCX (PR6), so all
// three carry the same executive conclusion, horizons, gates, milestones,
// dependencies, evidence statuses, governance (lifecycle) state, caveats and
// the contract version/hash — proving they derive from one source.

import {
  roadmapContractStamp,
  type RoadmapEvidenceStatus,
  type RoadmapPresentationContract,
} from "./roadmap-presentation-contract";
import {
  roadmapLifecycleSentence,
  roadmapLifecycleTag,
  type RoadmapLifecycle,
} from "./roadmap-lifecycle";

const EVIDENCE_TEXT: Record<RoadmapEvidenceStatus, string> = {
  approved: "Approved",
  recommended: "Recommended",
  illustrative: "Illustrative",
  client_decision_required: "Client decision required",
  evidence_required: "Evidence required",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lifecycleFromContract(
  contract: RoadmapPresentationContract,
): RoadmapLifecycle {
  const state = contract.lifecycleState;
  return {
    state,
    isEntered: true,
    isFinal: state === "exit_approved_final",
    isReviewDraft: state === "review_draft",
  };
}

/** Render the in-product HTML preview of the roadmap from the shared contract. */
export function renderRoadmapPreviewHtml(
  contract: RoadmapPresentationContract,
): string {
  const lc = lifecycleFromContract(contract);
  const horizons = contract.horizons
    .map(
      (h) =>
        `<tr><td class="hz">${esc(h.name)}</td><td>${esc(h.outcome)}</td></tr>`,
    )
    .join("");
  const gates = contract.decisionGates
    .map(
      (g) =>
        `<li>${esc(g.name)}${g.betweenHorizons ? ` — ${esc(g.betweenHorizons)}` : ""}</li>`,
    )
    .join("");
  const milestones = contract.valueMilestones
    .map(
      (m) =>
        `<li>${esc(m.name)}${m.horizon ? ` — ${esc(m.horizon)}` : ""}</li>`,
    )
    .join("");
  const deps = contract.dependencies
    .map(
      (d) =>
        `<tr><td>${esc(d.item)}</td><td class="ev">${esc(EVIDENCE_TEXT[d.evidenceStatus])}</td><td>${esc(d.note ?? "")}</td></tr>`,
    )
    .join("");
  const risks = contract.risks.map((r) => `<li>${esc(r)}</li>`).join("");
  const caveats = contract.caveats.map((c) => `<li>${esc(c)}</li>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(contract.executiveConclusion.slice(0, 90))}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;color:#1B1A17;background:#F8F7F4;max-width:1120px;margin:0 auto;padding:28px}
  h1{font-size:24px;line-height:1.25}
  .banner{border:2px solid #f59e0b;background:#fffbeb;border-radius:12px;padding:14px 16px;margin:16px 0;font-size:13px;color:#3f2f05}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}
  td,th{border:1px solid #D8D0C1;padding:8px 10px;text-align:left}
  .hz{font-weight:700;width:28%}
  .ev{font-weight:700;color:#BD7B12}
  .stamp{font-size:11px;color:#6F6A61;margin-top:24px;border-top:1px dashed #D8D0C1;padding-top:8px}
  h2{font-size:15px;margin-top:22px}
</style></head><body>
<div class="preview-role" data-role="in-product-preview" style="font-size:11px;color:#6F6A61;text-transform:uppercase;letter-spacing:.08em">In-product preview · review &amp; QA — not the client deliverable</div>
<h1>${esc(contract.executiveConclusion)}</h1>
<p><strong>Decision required:</strong> ${esc(contract.sponsorDecision)}</p>
<div class="banner" data-lifecycle="${esc(lc.state)}"><strong>${esc(roadmapLifecycleTag(lc))}.</strong> ${esc(roadmapLifecycleSentence(lc, contract.phase))}</div>
<h2>Horizons and the outcome each achieves</h2>
<table><thead><tr><th>Horizon</th><th>Outcome achieved</th></tr></thead><tbody>${horizons}</tbody></table>
<h2>Decision gates</h2><ul>${gates}</ul>
<h2>Value milestones</h2><ul>${milestones}</ul>
<h2>Dependencies and evidence status</h2>
<table><thead><tr><th>Dependency</th><th>Evidence status</th><th>Note</th></tr></thead><tbody>${deps}</tbody></table>
<h2>Risks</h2><ul>${risks}</ul>
<h2>Caveats</h2><ul>${caveats}</ul>
<div class="stamp">${esc(roadmapContractStamp(contract))} · Move ${esc(contract.lineage.moveId)} · tenant ${esc(contract.lineage.tenantKey)}</div>
</body></html>`;
}
