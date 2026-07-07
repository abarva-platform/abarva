import type { SourceTransitionReadinessModel } from "@/lib/source/transition/readiness-scoring";
import { escapeHtml } from "../inline-renderers";

export function renderTransitionSectionHtml(
  model: SourceTransitionReadinessModel,
): string {
  const milestoneRows = model.milestones
    .map(
      (milestone) => `
        <tr>
          <td>${escapeHtml(milestone.phase)}</td>
          <td>${escapeHtml(milestone.window)}</td>
          <td>${escapeHtml(statusLabel(milestone.status))}</td>
          <td>${escapeHtml(milestone.owner)}</td>
          <td>${escapeHtml(milestone.nextAction)}</td>
        </tr>`,
    )
    .join("");
  const readinessRows = model.workstreams
    .map(
      (workstream) => `
        <tr>
          <td>${escapeHtml(workstream.label)}</td>
          <td>${escapeHtml(workstream.status.toUpperCase())}</td>
          <td>${escapeHtml(workstream.owner)}</td>
          <td>${escapeHtml(workstream.blocker ?? workstream.signal)}</td>
        </tr>`,
    )
    .join("");
  const riskRows = model.risks
    .map(
      (risk) => `
        <li>
          <strong>${escapeHtml(risk.severity.toUpperCase())} · ${escapeHtml(risk.label)}</strong>
          — ${escapeHtml(risk.mitigationNote)}
        </li>`,
    )
    .join("");
  const signerRows = model.signers
    .map(
      (signer) => `
        <li>
          <strong>${escapeHtml(signer.role)}:</strong> ${escapeHtml(signer.name)}
          — ${escapeHtml(signer.requirement)}
          <em>(${escapeHtml(signer.status)})</em>
        </li>`,
    )
    .join("");

  return `
    <div class="dp-body">
      <p><strong>Readiness:</strong> ${escapeHtml(String(model.readinessPercent))}% ready for cutover. ${escapeHtml(model.apxDependency)}</p>
      <p><strong>Active blocker:</strong> ${escapeHtml(model.activeBlocker)}</p>

      <h4>KT milestone plan</h4>
      <table class="dp-table">
        <thead><tr><th>Phase</th><th>Window</th><th>Status</th><th>Owner</th><th>Next action</th></tr></thead>
        <tbody>${milestoneRows}</tbody>
      </table>

      <h4>Go-live readiness scorecard</h4>
      <table class="dp-table">
        <thead><tr><th>Workstream</th><th>R/A/G</th><th>Owner</th><th>Signal</th></tr></thead>
        <tbody>${readinessRows}</tbody>
      </table>

      <h4>Cutover sign-offs</h4>
      <ul>${signerRows}</ul>

      <h4>Risk register</h4>
      <ul>${riskRows}</ul>

      <p><strong>Governance:</strong> AbarVa tracks readiness and produces the handoff pack; the client and selected vendor approve cutover outside this generated artifact.</p>
    </div>
  `;
}

function statusLabel(status: SourceTransitionReadinessModel["milestones"][number]["status"]): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "active":
      return "Active";
    case "at_risk":
      return "At risk";
    case "blocked":
      return "Blocked";
    case "next":
      return "Next";
  }
}
