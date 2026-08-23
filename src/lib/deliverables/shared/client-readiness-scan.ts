// Client-readiness scan — the "would this survive a client expert reading it"
// pass, expressed as code.
//
// The bar this encodes, stated by the reviewer it exists to serve:
//
//   Not "artifact generated", not "quality score 100", not "gate green". Read
//   it as if a client executive, procurement lead, architecture reviewer, or
//   finance sponsor were about to see it.
//
// Concretely that means no internal source-family codes, hashes, UUIDs, model
// names or pipeline labels; evidence a reviewer can follow; and substance
// rather than consultant filler.
//
// WHY THIS IS A MODULE AND NOT A REGEX IN A SCRIPT
//
// A first attempt at this ran ad hoc against the live artifacts and reported
// internal hashes in 8 of 15 documents. Every one was a false positive: the
// fetch returned DOCX binaries, they were parsed as if they were HTML, and the
// resulting byte noise matched a hex pattern. The finding would have sent
// someone hunting a leak that did not exist.
//
// Two lessons are built in here. First, extraction is separated from scanning,
// so a document that could not be read as text is reported as UNREADABLE
// rather than silently scanned as garbage. Second, every rule is tested
// against both a positive and a negative case, because a scanner that cannot
// distinguish `human_approval` in a sentence about approval flows from
// `engagement_id` leaking out of the schema is not usable on real prose.

export type FindingSeverity = "blocker" | "review";

export type FindingKind =
  | "uuid"
  | "content_hash"
  | "model_name"
  | "schema_identifier"
  | "pipeline_vocabulary"
  | "internal_reference_code"
  | "unresolved_placeholder"
  | "filler_language";

export interface ScanFinding {
  kind: FindingKind;
  severity: FindingSeverity;
  /** The matched text, verbatim. */
  match: string;
  /** Surrounding prose so a reviewer can judge it without opening the file. */
  context: string;
  /** Why this matters to the reader, in plain language. */
  why: string;
}

export interface ScanResult {
  findings: ScanFinding[];
  blockers: number;
  reviewItems: number;
  /** True when nothing at all was found. */
  clean: boolean;
}

interface Rule {
  kind: FindingKind;
  severity: FindingSeverity;
  pattern: RegExp;
  why: string;
  /** Return true to discard a match as a false positive. */
  exempt?: (match: string, context: string) => boolean;
}

/**
 * Schema and infrastructure identifiers that would be meaningless — or
 * alarming — to a client reader. Matched as whole words.
 */
const SCHEMA_IDENTIFIERS = [
  "intelligence_v6",
  "business_records",
  "relationship_edges",
  "graph_nodes",
  "tenant_key",
  "client_key",
  "engagement_id",
  "module_key",
  "deliverable_type_key",
  "state_jsonb",
  "program_modules",
  "deliverables_v2",
];

/**
 * Words that describe how we build things, not what the client is buying.
 * `quality score` and `golden bar` are ours; a reader seeing them learns
 * about our pipeline rather than their business.
 */
const PIPELINE_VOCABULARY = [
  "canonical build",
  "golden bar",
  "quality score",
  "read model",
  "source adapter",
  "data plane",
  "passthrough",
  "context bundle",
  "agent_ready",
  "not_reviewed",
];

/**
 * Filler that signals padding rather than argument. Deliberately short and
 * high-precision: this is advisory, and a noisy filler rule trains people to
 * ignore the whole report.
 */
const FILLER_PHRASES = [
  "in today's fast-paced",
  "in today's rapidly evolving",
  "it is important to note that",
  "at the end of the day",
  "leverage synergies",
  "best-in-class solution",
  "world-class capabilities",
  "holistic approach to",
  "paradigm shift",
  "move the needle",
];

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function alternation(values: readonly string[]): string {
  return values.map(escapeForRegex).join("|");
}

const RULES: readonly Rule[] = [
  {
    kind: "uuid",
    severity: "blocker",
    pattern:
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    why: "A database identifier tells the reader nothing and looks like a leak of internal plumbing.",
  },
  {
    kind: "content_hash",
    severity: "blocker",
    // 16+ hex characters. Below that, ordinary content (a hex colour, a part
    // number, a year range) produces noise.
    pattern: /\b[0-9a-f]{16,64}\b/gi,
    why: "A content hash or run identifier is internal bookkeeping, not evidence a reviewer can follow.",
    exempt: (match) => {
      // Requiring both a digit and a letter avoids matching a long run of
      // digits (an account number, a large figure with no separators) or a
      // word that happens to use only the letters a-f.
      return !(/\d/.test(match) && /[a-f]/i.test(match));
    },
  },
  {
    kind: "model_name",
    severity: "blocker",
    // The middle segment must allow hyphens: "claude-sonnet-5" carries the
    // version two hyphens deep, and an earlier pattern that stopped at the
    // first hyphen missed the exact string found leaking on a live page.
    // A digit is still required so "the Claude approach" does not match.
    pattern:
      /\b(?:claude|gpt|gemini|llama|mistral)[-\s]?[a-z0-9.-]*\d[a-z0-9.-]*\b/gi,
    why: "Naming the model exposes an implementation choice the client did not buy and may not keep.",
  },
  {
    kind: "schema_identifier",
    severity: "blocker",
    pattern: new RegExp(`\\b(?:${alternation(SCHEMA_IDENTIFIERS)})\\b`, "gi"),
    why: "A table or column name is internal structure leaking into a client document.",
  },
  {
    kind: "internal_reference_code",
    severity: "review",
    // e.g. SRC-4F2A1B, RUN_9d8c, DLV-00123. Requires a digit so ordinary
    // hyphenated capitals ("AI-DRIVEN", "END-TO-END") do not match.
    pattern:
      /\b(?:SRC|EVD|RUN|JOB|ART|DLV|FAM|PKG|SNP)[-_][A-Za-z0-9]*\d[A-Za-z0-9]*\b/g,
    why: "An internal reference code is only resolvable inside our systems, so it reads as an unexplained citation.",
  },
  {
    kind: "pipeline_vocabulary",
    severity: "review",
    pattern: new RegExp(`(?:${alternation(PIPELINE_VOCABULARY)})`, "gi"),
    why: "This describes how the document was produced rather than what the client should decide.",
  },
  {
    kind: "unresolved_placeholder",
    severity: "blocker",
    // The repo's DOM integrity linter scans source for these same tokens, so
    // the one place that must contain them — the rule defining them — trips
    // it. Suppressed on this line only, using that linter's own escape hatch,
    // rather than narrowing either check: both are doing their job.
    pattern:
      // dom-integrity-ignore-line
      /\{\{[^}\n]{1,60}\}\}|\[(?:TBD|TODO|PLACEHOLDER|INSERT[^\]\n]{0,40})\]|\bLorem ipsum\b/gi,
    why: "An unfilled placeholder in a client-facing document is the most visible possible defect.",
    exempt: (match) =>
      // Our own evidence-gap marker is deliberate and reader-facing: it says
      // plainly that a fact is missing rather than inventing one.
      /^\[EVIDENCE MISSING/i.test(match),
  },
  {
    kind: "filler_language",
    severity: "review",
    pattern: new RegExp(`(?:${alternation(FILLER_PHRASES)})`, "gi"),
    why: "Filler signals padding where a client expects an argument.",
  },
];

/** Pull a readable window around a match. */
function contextAround(text: string, index: number, length: number): string {
  const before = text.slice(Math.max(0, index - 90), index);
  const after = text.slice(index + length, index + length + 90);
  return `${before}«${text.slice(index, index + length)}»${after}`
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scan already-extracted document text.
 *
 * Takes text, never a file or a buffer — extraction failures must be handled
 * by the caller and reported as unreadable, not scanned as noise.
 */
export function scanClientReadiness(documentText: string): ScanResult {
  const text = String(documentText ?? "");
  const findings: ScanFinding[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    // Fresh regex per rule so `lastIndex` never leaks between calls.
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
        continue;
      }
      const context = contextAround(text, match.index, match[0].length);
      if (rule.exempt?.(match[0], context)) continue;

      // One finding per (kind, matched text): repeating the same leak fifty
      // times buries the other findings.
      const dedupeKey = `${rule.kind}:${match[0].toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      findings.push({
        kind: rule.kind,
        severity: rule.severity,
        match: match[0],
        context,
        why: rule.why,
      });
    }
  }

  const blockers = findings.filter((f) => f.severity === "blocker").length;
  return {
    findings,
    blockers,
    reviewItems: findings.length - blockers,
    clean: findings.length === 0,
  };
}
