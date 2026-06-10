// Event-specific RFP canon.
//
// Renders an archetype's rfpDocumentStructure into a real, structured RFP. Each
// section is bound to the evidence families it depends on; when those families
// are not agent_ready, the section is marked evidence_blocked with the exact
// missing inputs — NEVER silently fabricated. This is what separates a
// decision-grade RFP from a generic template: an AMS RFP has service towers,
// SLA schedules, resource-unit pricing; an ERP/SI RFP has process scope, rollout
// waves, data migration. They are structurally different by construction.

import type { RfpSection, SourceEventArchetype } from './types';
import type { SourceEvidenceReadiness } from './evidence-readiness';

export type SectionStatus = 'ready' | 'evidence_blocked' | 'optional_omitted';

export interface RenderedRfpSection {
  key: string;
  title: string;
  required: boolean;
  status: SectionStatus;
  /** Evidence families this section needs. */
  evidenceDependencies: string[];
  /** Of those, the ones NOT yet agent_ready (the reason it is blocked). */
  blockingEvidence: string[];
  /** Human note shown in the document where a section is weak. */
  note?: string;
}

export interface RenderedRfp {
  archetypeId: string;
  archetypeName: string;
  eventResolved: string | null;
  sections: RenderedRfpSection[];
  /** Required sections that cannot be completed because evidence is missing. */
  blockedSections: string[];
  /** True when every required section's evidence is agent_ready. */
  complete: boolean;
}

function agentReadySet(readiness?: SourceEvidenceReadiness): Set<string> {
  if (!readiness) return new Set();
  return new Set(readiness.families.filter((f) => f.agentUsable).map((f) => f.family));
}

function statusFor(
  section: RfpSection,
  ready: Set<string>,
  haveReadiness: boolean,
): { status: SectionStatus; blocking: string[]; note?: string } {
  const blocking = section.evidenceDependencies.filter((d) => !ready.has(d));
  if (!haveReadiness) {
    // No readiness snapshot supplied → structure only; flag dependencies as TBD.
    return blocking.length
      ? { status: 'evidence_blocked', blocking, note: `Requires evidence: ${blocking.join(', ')} (readiness not evaluated)` }
      : { status: 'ready', blocking: [] };
  }
  if (blocking.length === 0) return { status: 'ready', blocking: [] };
  if (!section.required) {
    return { status: 'optional_omitted', blocking, note: `Optional — omitted pending ${blocking.join(', ')}` };
  }
  return {
    status: 'evidence_blocked',
    blocking,
    note: `Cannot be completed: ${blocking.join(', ')} not yet agent-ready. Upload + governed promotion required — do NOT fabricate.`,
  };
}

/**
 * Build the event-specific RFP for an archetype. When a readiness snapshot is
 * supplied, sections whose evidence is not agent_ready are marked
 * evidence_blocked (required) or optional_omitted (optional) — never fabricated.
 */
export function buildArchetypeRfp(
  archetype: SourceEventArchetype,
  readiness?: SourceEvidenceReadiness,
): RenderedRfp {
  const ready = agentReadySet(readiness);
  const haveReadiness = Boolean(readiness);

  const sections: RenderedRfpSection[] = archetype.rfpDocumentStructure.map((s) => {
    const { status, blocking, note } = statusFor(s, ready, haveReadiness);
    return {
      key: s.key,
      title: s.title,
      required: s.required,
      status,
      evidenceDependencies: s.evidenceDependencies,
      blockingEvidence: blocking,
      note,
    };
  });

  const blockedSections = sections
    .filter((s) => s.status === 'evidence_blocked')
    .map((s) => s.key);

  return {
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    eventResolved: readiness?.eventResolved ?? null,
    sections,
    blockedSections,
    complete: haveReadiness && blockedSections.length === 0,
  };
}

/** Render the RFP outline to markdown, surfacing evidence-blocked sections honestly. */
export function renderRfpMarkdown(rfp: RenderedRfp): string {
  const lines: string[] = [];
  lines.push(`# RFP — ${rfp.archetypeName}`);
  if (rfp.eventResolved) lines.push(`_Event: ${rfp.eventResolved}_`);
  lines.push('');
  if (!rfp.complete) {
    lines.push(`> **Evidence status:** ${rfp.blockedSections.length} required section(s) blocked pending agent-ready evidence. Blocked sections are flagged, not filled in.`);
    lines.push('');
  }
  rfp.sections.forEach((s, i) => {
    const flag =
      s.status === 'evidence_blocked' ? ' — ⛔ EVIDENCE BLOCKED'
      : s.status === 'optional_omitted' ? ' — (optional, omitted)'
      : '';
    lines.push(`## ${i + 1}. ${s.title}${flag}`);
    if (s.note) lines.push(`_${s.note}_`);
    else if (s.evidenceDependencies.length) lines.push(`_Grounded in: ${s.evidenceDependencies.join(', ')}_`);
    lines.push('');
  });
  return lines.join('\n');
}
