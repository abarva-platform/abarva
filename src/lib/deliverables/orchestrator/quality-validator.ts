// Deliverable quality gate — runs before export.
//
// BLOCKS (export refused) when the artifact would embarrass a senior team:
//   raw internal tags / source ids in body · weak-prose-dominated · missing expected
//   tables · no source register · no client-to-complete despite gaps · unsupported
//   claims · too short for the artifact type · no decision section · no recommendation.
// WARNS (advisory) when the artifact is mechanical/thin/generic/under-using evidence.

import type {
  DeliverableIntelligenceRequest,
  QualityValidationResult,
  RenderableDeliverable,
} from './types';
import { scanForInternalLeaks } from './source-register';

const DECISION_RE = /\b(decision|recommend|we recommend|the ask|approval sought|go\/no-go)\b/i;
const GENERIC_PHRASES = [
  'in today\'s fast-paced',
  'leverage synergies',
  'best-in-class solution',
  'world-class',
  'cutting-edge',
  'it is important to note that',
  'in conclusion,',
  'holistic approach',
  'paradigm shift',
];

function wordCount(s: string): number {
  return (s.trim().match(/\S+/g) ?? []).length;
}

/** Count client-fact-looking claims that lack a [n] citation, assumption, or placeholder. */
function countUnsupportedClaims(body: string): number {
  // sentences asserting numbers/dollars/dates/percentages are client-fact candidates
  const sentences = body.split(/(?<=[.!?])\s+/);
  const factLike = /(\$\s?\d|\b\d{1,3}(?:,\d{3})+\b|\b\d+%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/;
  const supported = /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING/;
  let n = 0;
  for (const s of sentences) {
    if (factLike.test(s) && !supported.test(s)) n++;
  }
  return n;
}

export function validateDeliverableQuality(
  doc: RenderableDeliverable,
  req: DeliverableIntelligenceRequest,
): QualityValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const qb = req.qualityBar;

  const body = doc.generatedSections.map((s) => `${s.title}\n${s.bodyMarkdown}`).join('\n\n');
  const bodyWordCount = wordCount(body);
  const sectionCount = doc.generatedSections.length;
  const tableCount = doc.tables.length;
  const leakedInternalTags = scanForInternalLeaks(body);
  const unsupportedClaimCount = countUnsupportedClaims(body);

  const hasSourceRegister = doc.sourceRegister.length > 0;
  const hasDecisionSection = doc.generatedSections.some((s) => DECISION_RE.test(`${s.title} ${s.bodyMarkdown}`));
  const hasRecommendation = wordCount(doc.recommendation) >= 12;
  const hasRiskTable = doc.tables.some((t) => /risk|issue|dependenc/i.test(t.title));
  const clientCompleteCount = doc.clientCompleteChecklist.length;

  // ── BLOCKERS ──
  if (leakedInternalTags.length > 0) blockers.push(`internal tags/ids leaked into body: ${leakedInternalTags.join(', ')}`);
  if (unsupportedClaimCount > 0) blockers.push(`${unsupportedClaimCount} unsupported client-fact claim(s) (number/date/$/% with no [n], assumption, or placeholder)`);
  if (sectionCount < qb.minSections) blockers.push(`only ${sectionCount} sections; minimum ${qb.minSections}`);
  if (bodyWordCount < qb.minBodyWords) blockers.push(`document too short: ${bodyWordCount} words; minimum ${qb.minBodyWords}`);
  if (qb.requiresSourceRegister && !hasSourceRegister) blockers.push('no source register');
  if (qb.requiresDecisionSection && !hasDecisionSection) blockers.push('no executive decision section');
  if (qb.requiresRecommendation && !hasRecommendation) blockers.push('no clear recommendation');
  if (qb.requiresRiskTable && !hasRiskTable) blockers.push('no risk/issues/dependencies table');
  if (qb.requiresCitations && hasSourceRegister && !/\[\d+\]/.test(body)) blockers.push('source register present but body cites nothing [n]');
  if (qb.requiresClientCompleteChecklistWhenGaps && req.missingEvidence.length + req.clientCompleteItems.length > 0 && clientCompleteCount === 0) {
    blockers.push('evidence gaps/client-complete items exist but the document has no client-to-complete checklist');
  }
  // expected-tables-but-none guard (mechanical/empty)
  if (tableCount === 0 && req.qualityBar.requiresRiskTable) blockers.push('no tables where tables are expected');
  // tiny/unreadable formatting
  if (req.formattingProfile.bodyPointSize < 10) blockers.push(`body point size ${req.formattingProfile.bodyPointSize} is too small to read`);

  // ── WARNINGS ──
  const genericHits = GENERIC_PHRASES.filter((p) => body.toLowerCase().includes(p));
  if (genericHits.length >= 2) warnings.push(`generic/weak prose detected: ${genericHits.slice(0, 4).join('; ')}`);
  if (doc.exhibits.length === 0) warnings.push('document lacks exhibits — consider decision/architecture/roadmap visuals');
  const avgSectionWords = sectionCount ? Math.round(bodyWordCount / sectionCount) : 0;
  if (avgSectionWords > 0 && avgSectionWords < 90) warnings.push(`thin sections (avg ${avgSectionWords} words) — synthesis may be weak`);
  const citedNumbers = new Set((body.match(/\[(\d+)\]/g) ?? []).map((m) => Number(m.replace(/\D/g, ''))));
  const evidenceUsedRatio = req.governedEvidenceBundle.length ? citedNumbers.size / req.governedEvidenceBundle.length : 1;
  if (req.governedEvidenceBundle.length >= 3 && evidenceUsedRatio < 0.5) {
    warnings.push(`only ${citedNumbers.size}/${req.governedEvidenceBundle.length} evidence items used — evidence underused`);
  }
  if (doc.recommendation && wordCount(doc.recommendation) < 40) warnings.push('recommendation is brief — may be too generic for a board artifact');

  return {
    pass: blockers.length === 0,
    blockers,
    warnings,
    metrics: {
      sectionCount,
      bodyWordCount,
      tableCount,
      hasSourceRegister,
      hasDecisionSection,
      hasRecommendation,
      hasRiskTable,
      clientCompleteCount,
      unsupportedClaimCount,
      leakedInternalTags,
    },
  };
}
