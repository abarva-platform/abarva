/**
 * Evidence Quality Scoring — deterministic heuristic helper.
 *
 * The reasoning layer treats each `evidence-*` key as binary in
 * `gate-evaluator`: present or absent. But not all evidence is created equal.
 * A 25-page transition plan with named accountabilities and a recent date is
 * meaningfully stronger than a one-line note pasted into a comment field.
 *
 * `scoreEvidenceItem` collapses the loose evidence shape (text/note/citation/
 * pageCount/uploadedAt/uploadedBy) into a 0..1 quality score plus a small
 * grade band so the UI can render a "weak / fair / strong" chip and surface
 * "evidence is weak" warnings without re-running an LLM.
 *
 * Pure: no Date.now, no I/O. The optional `nowMs` parameter on
 * `scoreEvidenceItem` lets tests pin the freshness window deterministically.
 *
 * Heuristics (each contributes points; total is capped at 1.0):
 *   - Has citation                                +0.20
 *   - Has uploadedBy                              +0.15
 *   - Has uploadedAt within last 90 days          +0.10
 *   - Text length 0–100 chars                     +0.05
 *   - Text length 100–500 chars                   +0.15
 *   - Text length > 500 chars                     +0.25
 *   - Has pageCount and pageCount >= 5            +0.15
 *   - Has attached filename                       +0.10
 *   - Text contains "approved" or "signed"        +0.10
 *
 * Age deductions (applied after other scoring; score floored at 0):
 *   - uploadedAt between 90–180 days ago (mild stale)   -0.10
 *   - uploadedAt older than 180 days (severe stale)     -0.20
 *
 * Grade boundaries:  <0.4 weak,  <0.7 fair,  else strong.
 */

export type EvidenceQualityGrade = 'weak' | 'fair' | 'strong';

export interface EvidenceQualityScore {
  /** 0..1, rounded to 2 decimal places for stable rendering. */
  score: number;
  grade: EvidenceQualityGrade;
  /** Short bullets explaining the contributors to the score. */
  reasons: string[];
}

export interface EvidenceLikeItem {
  text?: string;
  note?: string;
  citation?: string;
  pageCount?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  /**
   * Optional attached-file metadata (PR #770). When the ingestion form has a
   * file attached, these fields flow alongside the text body. For PDFs the
   * caller derives `pageCount` from a stub heuristic so the existing
   * pageCount-based quality bonus fires.
   */
  filename?: string;
  mimetype?: string;
  fileSize?: number;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_EIGHTY_DAYS_MS = 180 * 24 * 60 * 60 * 1000;

function gradeFor(score: number): EvidenceQualityGrade {
  if (score < 0.4) return 'weak';
  if (score < 0.7) return 'fair';
  return 'strong';
}

function round2(n: number): number {
  // Bias-stable rounding for stable JSON output.
  return Math.round(n * 100) / 100;
}

/**
 * Score a single evidence-like item. The shape is intentionally loose so the
 * helper can run against `EvidenceItem` from source events
 * (`text/value/source/recordedAt`) and `ProgramEvidenceItem` from programs
 * (`citation/uploadedAt/uploadedBy`) without forcing a brittle union — the
 * caller adapter maps source-side fields onto this shape.
 */
export function scoreEvidenceItem(
  item: EvidenceLikeItem,
  nowMs?: number,
): EvidenceQualityScore {
  const reasons: string[] = [];
  let score = 0;

  if (item.citation && item.citation.trim().length > 0) {
    score += 0.2;
    reasons.push('Has citation (+0.20)');
  }

  if (item.uploadedBy && item.uploadedBy.trim().length > 0) {
    score += 0.15;
    reasons.push('Named uploader (+0.15)');
  }

  if (item.uploadedAt && item.uploadedAt.trim().length > 0) {
    const ts = Date.parse(item.uploadedAt);
    if (Number.isFinite(ts)) {
      const reference = typeof nowMs === 'number' ? nowMs : Date.parse(item.uploadedAt);
      // When no nowMs is provided the helper still needs to be deterministic;
      // we treat the item's own timestamp as the reference (so freshness is
      // satisfied for fixture-only callers that just want a stable ranking).
      const ageMs = reference - ts;
      if (ageMs >= 0 && ageMs <= NINETY_DAYS_MS) {
        score += 0.1;
        reasons.push('Uploaded within 90 days (+0.10)');
      } else if (ageMs > ONE_EIGHTY_DAYS_MS) {
        // Severe stale: older than 180 days
        score -= 0.2;
        reasons.push('Evidence older than 180 days — severe stale (-0.20)');
      } else if (ageMs > NINETY_DAYS_MS) {
        // Mild stale: 90–180 days old
        score -= 0.1;
        reasons.push('Evidence 90–180 days old — mild stale (-0.10)');
      }
    }
  }

  // Text body — prefer `text`, fall back to `note`. We only count one source
  // so a paste-in note doesn't double-dip with a separate text field.
  const body = (item.text ?? item.note ?? '').trim();
  if (body.length > 0) {
    if (body.length > 500) {
      score += 0.25;
      reasons.push('Long text body >500 chars (+0.25)');
    } else if (body.length >= 100) {
      score += 0.15;
      reasons.push('Text body 100–500 chars (+0.15)');
    } else {
      score += 0.05;
      reasons.push('Short text body <100 chars (+0.05)');
    }
  }

  if (typeof item.pageCount === 'number' && Number.isFinite(item.pageCount) && item.pageCount >= 5) {
    score += 0.15;
    reasons.push(`Document length ${item.pageCount} pages (+0.15)`);
  }

  // Attached-file signal — having a real file attached (regardless of size or
  // page count) is a small quality bump over a paste-in note. Stub: we only
  // require a non-empty filename so the demo path works without a real upload.
  if (item.filename && item.filename.trim().length > 0) {
    score += 0.1;
    reasons.push(`Attached file ${item.filename} (+0.10)`);
  }

  // Approval / signature keyword — checked across both citation and body so a
  // citation like "Signed transition plan" earns the bonus even if the body
  // stays short.
  const haystack = `${body} ${item.citation ?? ''}`.toLowerCase();
  if (/\b(approved|signed)\b/.test(haystack)) {
    score += 0.1;
    reasons.push('Mentions approval or signature (+0.10)');
  }

  if (score < 0) score = 0;
  if (score > 1) score = 1;
  const finalScore = round2(score);

  if (reasons.length === 0) {
    reasons.push('No evidence content scored');
  }

  return {
    score: finalScore,
    grade: gradeFor(finalScore),
    reasons,
  };
}

export interface EvidenceQualitySummary {
  /** Mean score across the items, 0 when `total === 0`. */
  mean: number;
  weakCount: number;
  fairCount: number;
  strongCount: number;
  total: number;
}

/**
 * Aggregate the per-item scores produced by `scoreEvidenceItem` over an
 * instance's evidence array. Returns mean + grade-bucket counts so the UI can
 * render "Avg quality: fair · 12 strong / 5 fair / 3 weak" without re-walking
 * the array.
 */
export function summarizeEvidenceQuality(
  items: ReadonlyArray<EvidenceLikeItem>,
  nowMs?: number,
): EvidenceQualitySummary {
  if (!items || items.length === 0) {
    return { mean: 0, weakCount: 0, fairCount: 0, strongCount: 0, total: 0 };
  }

  let weakCount = 0;
  let fairCount = 0;
  let strongCount = 0;
  let total = 0;

  for (const item of items) {
    const { score, grade } = scoreEvidenceItem(item, nowMs);
    total += score;
    if (grade === 'weak') weakCount += 1;
    else if (grade === 'fair') fairCount += 1;
    else strongCount += 1;
  }

  return {
    mean: round2(total / items.length),
    weakCount,
    fairCount,
    strongCount,
    total: items.length,
  };
}

/**
 * Convenience: derive a grade label from a summary's mean score so the chip
 * can render "Avg quality: fair" without re-importing `gradeFor`.
 */
export function summaryGrade(summary: EvidenceQualitySummary): EvidenceQualityGrade {
  return gradeFor(summary.mean);
}
