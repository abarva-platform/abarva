// Whether a deliverable is fit to be signed off, judged on what a client
// would actually read.
//
// `scanClientReadiness` says what is in a document. This says what that means
// for promotion. Keeping the two apart matters: the rules are about text, the
// policy is about governance, and they change for different reasons.
//
// THE POLICY
//
//   - Blockers stop sign-off. A UUID, content hash, model name, schema
//     identifier or unfilled placeholder in a document about to be signed is
//     not a matter of taste.
//   - Review items never stop sign-off. They are surfaced and ignored at the
//     reviewer's discretion.
//   - Blockers CAN be signed off over, but only deliberately, and the exact
//     findings accepted are recorded on the sign-off.
//
// WHY AN OVERRIDE EXISTS AT ALL
//
// Because the scanner is heuristic and I have already watched it be wrong. An
// earlier ad-hoc version of these rules reported internal hashes in eight
// documents that contained none. A gate with no way past it converts every
// future false positive into a hard stop on real work, and the predictable
// response is that someone disables the gate entirely.
//
// So the override is deliberate rather than absent — and it is not a bypass.
// The reviewer must acknowledge the specific findings, and what they accepted
// is written into the approval record. A later reader can see that a document
// was signed off with three known leaks and who accepted them. That is a
// different fact from "it was clean", and the two must never be confused.

import { scanClientReadiness, type ScanFinding } from "./client-readiness-scan";

export type ReadinessVerdict =
  /** No blockers. Sign-off may proceed. */
  | "clear"
  /** Blockers present and not acknowledged. Sign-off must be refused. */
  | "blocked"
  /** Blockers present but explicitly acknowledged. Proceed, and record them. */
  | "acknowledged"
  /** Nothing to judge — no content was supplied to scan. */
  | "not_scanned";

export interface ReadinessGateResult {
  verdict: ReadinessVerdict;
  /** True when sign-off may proceed. */
  allowed: boolean;
  blockers: ScanFinding[];
  reviewItems: ScanFinding[];
  /** One line a reviewer can act on. */
  summary: string;
  /**
   * What to persist on the approval record when the verdict is
   * `acknowledged`. Empty otherwise.
   */
  acknowledgedFindings: string[];
}

export interface ReadinessGateInput {
  /** Rendered deliverable content. HTML or plain text/markdown. */
  content: string | null | undefined;
  /** True when the reviewer has explicitly accepted the known blockers. */
  acknowledgeBlockers?: boolean;
}

/**
 * Reduce HTML to readable text.
 *
 * Block-level tags become newlines first. Without that, "…evolving</p><p>In
 * today's…" collapses into one run and the phrase-level rules stop matching —
 * a silent loss of coverage rather than a visible failure.
 */
export function htmlToScannableText(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, "\n")
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeHtml(content: string): boolean {
  return /<\/?(?:p|div|h[1-6]|table|section|html|body)\b/i.test(content);
}

/** Short, plain description of one finding for the audit record. */
function describeFinding(finding: ScanFinding): string {
  return `${finding.kind}: ${finding.match}`;
}

export function evaluateClientReadinessForSignOff(
  input: ReadinessGateInput,
): ReadinessGateResult {
  const raw = String(input.content ?? "").trim();

  if (raw.length === 0) {
    // Deliberately not "clear". Nothing was examined, and a gate that reports
    // an unexamined document as passing is the failure this whole check
    // exists to prevent. Other guards decide whether empty content is
    // signable at all; this one only refuses to vouch for it.
    return {
      verdict: "not_scanned",
      allowed: true,
      blockers: [],
      reviewItems: [],
      summary:
        "No content was available to scan, so client-readiness was not assessed.",
      acknowledgedFindings: [],
    };
  }

  const text = looksLikeHtml(raw) ? htmlToScannableText(raw) : raw;
  const scan = scanClientReadiness(text);
  const blockers = scan.findings.filter((f) => f.severity === "blocker");
  const reviewItems = scan.findings.filter((f) => f.severity === "review");

  if (blockers.length === 0) {
    return {
      verdict: "clear",
      allowed: true,
      blockers: [],
      reviewItems,
      summary:
        reviewItems.length === 0
          ? "No client-readiness issues found."
          : `No blockers. ${reviewItems.length} item(s) flagged for review.`,
      acknowledgedFindings: [],
    };
  }

  const listed = blockers.map((f) => f.match).join(", ");

  if (input.acknowledgeBlockers) {
    return {
      verdict: "acknowledged",
      allowed: true,
      blockers,
      reviewItems,
      summary: `Signed off with ${blockers.length} acknowledged client-readiness blocker(s): ${listed}.`,
      acknowledgedFindings: blockers.map(describeFinding),
    };
  }

  return {
    verdict: "blocked",
    allowed: false,
    blockers,
    reviewItems,
    summary:
      `${blockers.length} item(s) would be visible to a client and must be removed before sign-off: ` +
      `${listed}. Fix the document, or re-submit acknowledging these findings if they are acceptable.`,
    acknowledgedFindings: [],
  };
}
