/**
 * W4-PR-6 · Template · `program.gate_decision`
 *
 * Fires when a Maestro or governance review closes a phase gate —
 * either advancing the program to the next phase or blocking it
 * pending revisions. The program owner and configured stakeholders
 * receive this email.
 *
 * Severity: warn for `approved`, critical for `blocked`. Channel:
 * email_now + in_app. Body color shifts ink-only — no new palette.
 */

import {
  renderCtaButton,
  renderEmailShell,
  renderHeadline,
  renderMetaBlock,
  renderParagraph,
  renderTextFooter,
} from './_shared/EmailShell';
import { escapeHtml, formatTs, truncate, type TenantBrand } from './_shared/utils';

export type ProgramGateDecisionVerdict = 'approved' | 'blocked';

/** Payload shape for the program.gate_decision event. */
export interface ProgramGateDecisionPayload {
  eventId: string;
  /** Stable program id; powers the CTA. */
  programId: string;
  /** Display name of the program. */
  programName: string;
  /** Verdict the gate returned. */
  decision: ProgramGateDecisionVerdict;
  /** Phase identifier the program is now in (after decision). */
  newPhase: string;
  /** Free-text rationale from the reviewer. Truncated for body. */
  rationale: string;
  /** Display name of the deciding reviewer. */
  deciderName: string;
  /** ISO timestamp the event was produced. */
  producedAtIso: string;
  /** Optional CTA override. Defaults to admin program deep link. */
  ctaHref?: string;
}

const REASON =
  'you are subscribed to program.gate_decision events for programs you own or follow';

function decisionLabel(verdict: ProgramGateDecisionVerdict): string {
  return verdict === 'approved' ? 'approved' : 'blocked';
}

export function subject(payload: ProgramGateDecisionPayload, tenant: TenantBrand): string {
  return `[${tenant.name}] Gate ${decisionLabel(payload.decision)}: ${payload.programName} → Phase ${payload.newPhase}`;
}

export function html(payload: ProgramGateDecisionPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? `/admin/programs/${encodeURIComponent(payload.programId)}`;
  const headline =
    payload.decision === 'approved'
      ? 'Your program advanced'
      : 'Your program was blocked';
  const intro =
    payload.decision === 'approved'
      ? `<strong>${escapeHtml(payload.programName)}</strong> passed its gate review and is now in Phase ${escapeHtml(payload.newPhase)}.`
      : `<strong>${escapeHtml(payload.programName)}</strong> did not pass its gate review and remains in Phase ${escapeHtml(payload.newPhase)} pending revisions.`;

  const bodyHtml = [
    renderHeadline(headline),
    renderParagraph(intro),
    renderMetaBlock([
      { label: 'Program', value: payload.programName },
      { label: 'Decision', value: decisionLabel(payload.decision) },
      { label: 'Phase', value: payload.newPhase },
      { label: 'Decided by', value: payload.deciderName },
      { label: 'Decided', value: formatTs(payload.producedAtIso) },
      { label: 'Rationale', value: truncate(payload.rationale, 400) },
    ]),
    renderCtaButton('Open program', cta),
    renderParagraph(
      payload.decision === 'approved'
        ? 'Next-phase tasks are now active in Moves. Phase deliverables and gate criteria are visible on the program page.'
        : 'Address the rationale above, then re-submit for gate review. The audit trail records this decision.',
    ),
  ].join('');

  return renderEmailShell({
    tenant,
    bodyHtml,
    reason: REASON,
    producedAtIso: payload.producedAtIso,
    eventId: payload.eventId,
  });
}

export function text(payload: ProgramGateDecisionPayload, tenant: TenantBrand): string {
  const cta = payload.ctaHref ?? `/admin/programs/${payload.programId}`;
  const headline =
    payload.decision === 'approved' ? 'Your program advanced' : 'Your program was blocked';
  return [
    `${tenant.name} · ${tenant.industryTag}`,
    headline,
    '',
    payload.decision === 'approved'
      ? `${payload.programName} passed its gate review and is now in Phase ${payload.newPhase}.`
      : `${payload.programName} did not pass its gate review and remains in Phase ${payload.newPhase} pending revisions.`,
    '',
    `Decision: ${decisionLabel(payload.decision)}`,
    `Phase: ${payload.newPhase}`,
    `Decided by: ${payload.deciderName}`,
    `Decided: ${formatTs(payload.producedAtIso)}`,
    `Rationale: ${truncate(payload.rationale, 400)}`,
    '',
    `Open program: ${cta}`,
    renderTextFooter({
      reason: REASON,
      producedAtIso: payload.producedAtIso,
      eventId: payload.eventId,
    }),
  ].join('\n');
}
