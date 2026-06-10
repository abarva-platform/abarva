// PR-4 — Nexus intake queue.
//
// Turns section readiness gaps into a prioritized list of TARGETED questions (never
// "please provide more information"). Each item carries why-it-matters, the section it
// affects, accepted formats, a downloadable template, and the full set of completion
// options (chat / upload / template / client-complete / assumption / skip).

import type { NexusIntakeItem, RfpSectionDefinition, RfpSectionReadiness } from './types';
import { getIntakeTemplate } from './intake-template-registry';

interface QueueInput {
  readiness: RfpSectionReadiness[];
  definitions: Record<string, RfpSectionDefinition>;
}

const STATUS_NEEDS_INTAKE = new Set([
  'evidence_missing', 'client_to_complete', 'legal_review_required',
  'procurement_review_required', 'pricing_review_required', 'blocked',
]);

function inputLabel(def: RfpSectionDefinition, key: string): string {
  const all = [...def.requiredInputs, ...def.optionalInputs];
  return all.find((i) => i.key === key)?.label ?? key;
}

function questionFor(def: RfpSectionDefinition, key: string, label: string, tmplName?: string): string {
  // targeted, advisor-grade phrasing tied to the section's purpose
  if (def.clientCompleteAllowed && [...def.requiredInputs, ...def.optionalInputs].find((i) => i.key === key)?.clientDecision) {
    return `For "${def.title}", we need your decision on ${label.toLowerCase()}. Can you confirm it, or should this stay marked client-to-complete?`;
  }
  return `To make "${def.title}" defensible, I need ${label.toLowerCase()}.` +
    (tmplName ? ` Do you have an export, or should I provide the ${tmplName}?` : ' Can you provide it or confirm the value?');
}

export function buildNexusIntakeQueue(input: QueueInput): NexusIntakeItem[] {
  const items: NexusIntakeItem[] = [];
  let seq = 0;
  for (const r of input.readiness) {
    if (!STATUS_NEEDS_INTAKE.has(r.readinessStatus)) continue;
    const def = input.definitions[r.sectionId];
    if (!def) continue;
    // missing required inputs drive the questions; if none (e.g. review-only), one review item
    const missing = r.missingInputs.length ? r.missingInputs : [];
    if (missing.length === 0 && r.reviewsRequired.length) {
      items.push(reviewItem(def, r, ++seq));
      continue;
    }
    for (const key of missing) {
      const tmpl = getIntakeTemplate(key);
      const label = inputLabel(def, key);
      const inputDef = [...def.requiredInputs, ...def.optionalInputs].find((i) => i.key === key);
      const isClientDecision = !!inputDef?.clientDecision;
      // priority: more sections unblocked + lower section number = higher (1 best)
      const unblocks = tmpl?.affectedRfpSections.length ?? 1;
      const priority = Math.max(1, def.sectionNumber - Math.min(unblocks, 4));
      items.push({
        questionId: `iq-${def.id}-${key}-${++seq}`,
        sectionId: def.id, evidenceFamily: tmpl ? key : undefined, priority,
        questionText: questionFor(def, key, label, tmpl?.templateName),
        whyItMatters: tmpl?.readinessImpact ?? `Required to finalize ${def.title}.`,
        acceptableAnswerFormats: isClientDecision ? ['short text / value', 'attested decision'] : (tmpl?.acceptedFileTypes ?? ['csv', 'xlsx', 'text']),
        acceptedUploadTypes: tmpl?.acceptedFileTypes ?? [],
        downloadableTemplate: tmpl?.templateId,
        canAnswerInChat: isClientDecision || !tmpl,
        canUploadFile: !!tmpl,
        canMarkClientComplete: def.clientCompleteAllowed || isClientDecision,
        canMarkAssumption: def.preliminaryDraftAllowed,
        canSkipForPreliminaryDraft: def.preliminaryDraftAllowed,
        impactIfMissing: def.preliminaryDraftAllowed
          ? `Section stays PRELIMINARY until provided (${def.title}).`
          : `Section stays ${r.readinessStatus.toUpperCase()} until provided.`,
        ownerRoleSuggestion: ownerFor(def.id),
        targetContextDimension: tmpl?.targetContextDimension,
        targetRecordType: tmpl?.targetRecordType,
      });
    }
  }
  return items.sort((a, b) => a.priority - b.priority || a.sectionId.localeCompare(b.sectionId));
}

function reviewItem(def: RfpSectionDefinition, r: RfpSectionReadiness, seq: number): NexusIntakeItem {
  const kind = r.reviewsRequired[0];
  return {
    questionId: `iq-${def.id}-review-${seq}`, sectionId: def.id, priority: def.sectionNumber,
    questionText: `"${def.title}" is drafted but requires ${kind} sign-off before issuance. Who owns ${kind} approval, and can they confirm?`,
    whyItMatters: `${kind} review is mandatory before this section can be marked issue-ready.`,
    acceptableAnswerFormats: ['attested approval'], acceptedUploadTypes: [],
    canAnswerInChat: true, canUploadFile: false, canMarkClientComplete: true,
    canMarkAssumption: false, canSkipForPreliminaryDraft: def.preliminaryDraftAllowed,
    impactIfMissing: `Section stays ${kind}_review_required.`, ownerRoleSuggestion: kind,
  };
}

function ownerFor(sectionId: string): string {
  if (/pricing|cost/.test(sectionId)) return 'CFO / Procurement';
  if (/security/.test(sectionId)) return 'CISO / Security';
  if (/contracting|legal/.test(sectionId)) return 'Legal';
  if (/procurement|evaluation|response/.test(sectionId)) return 'Procurement / Sourcing';
  if (/org|governance|transition/.test(sectionId)) return 'CIO / IT Ops';
  return 'CIO / Sourcing Lead';
}
