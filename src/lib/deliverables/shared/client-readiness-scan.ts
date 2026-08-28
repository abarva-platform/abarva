import { listVendorPlatformProfiles } from "@/lib/programs/vendor-platform-intelligence";

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
// Extraction is separated from scanning so binary Office files, HTML errors,
// and unreadable downloads cannot be treated as clean text. Every rule is
// tested in both directions, because a scanner that cannot distinguish
// `human_approval` in a sentence about approval flows from `engagement_id`
// leaking out of the schema is not usable on real prose.

export type FindingSeverity = "blocker" | "review";

export type FindingKind =
  | "uuid"
  | "content_hash"
  | "model_name"
  | "schema_identifier"
  | "internal_enum_pair"
  | "internal_type_key"
  | "pipeline_vocabulary"
  | "internal_reference_code"
  | "vendor_claim_without_state"
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
 * Registry/deliverable enum keys that describe our artifact model. These must
 * be mapped to display labels before reaching client-visible prose or tables.
 */
const INTERNAL_TYPE_KEYS = [
  "business_case",
  "current_state_assessment",
  "dependencies_risks",
  "exec_summary",
  "execution_roadmap",
  "financial_model",
  "handoff_package",
  "operating_model_design",
  "readiness_and_change_plan",
  "requirements_traceability",
  "solution_design_specification",
  "sourcing_strategy",
  "target_state_architecture",
  "tower_metrics_plan",
  "value_measurement_contract",
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
  "client_judgment",
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

const VENDOR_STATE_BOUNDARY_PATTERN =
  /\b(?:vendor[-\s]published|public[-\s]hypothesis|public vendor|vendor materials?|public materials?|not proof of (?:a )?client deployment|not client truth|contract[-\s]confirmed|implementation[-\s]confirmed|client[-\s]observed|client evidence|client-side assertion|client[-\s]confirmed)\b/i;

const BRACE_PLACEHOLDER_PATTERN = String.raw`\{\{[^}\n]{1,60}\}\}`;
const BRACKET_PLACEHOLDER_WORDS = [
  "TB" + "D",
  "TO" + "DO",
  "PLACE" + "HOLDER",
  String.raw`IN` + String.raw`SERT[^\]\n]{0,40}`,
].join("|");
const LOREM_PLACEHOLDER_PATTERN = String.raw`Lorem` + String.raw` ipsum`;

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
    // The middle segment must allow multiple hyphenated version segments. A
    // digit is still required so "the Claude approach" does not match.
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
    kind: "internal_enum_pair",
    severity: "blocker",
    // e.g. generated_artifact:financial_model. Requires lower snake-ish
    // identifiers on both sides, so ordinary prose labels ("Owner: Finance")
    // and URLs (`https://...`) do not match.
    pattern: /\b[a-z][a-z0-9_]{2,}:[a-z][a-z0-9_]{2,}\b/g,
    why: "A colon-separated enum key exposes our internal object model instead of a reader-facing label.",
  },
  {
    kind: "internal_type_key",
    severity: "blocker",
    pattern: new RegExp(
      `(?<!:)\\b(?:${alternation(INTERNAL_TYPE_KEYS)})\\b`,
      "gi",
    ),
    why: "An artifact or section key must be rendered as a plain-English label before a client reads it.",
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
    pattern: new RegExp(
      `${BRACE_PLACEHOLDER_PATTERN}|\\[(?:${BRACKET_PLACEHOLDER_WORDS})\\]|\\b${LOREM_PLACEHOLDER_PATTERN}\\b`,
      "gi",
    ),
    why: "An unfilled placeholder in a client-facing document is the most visible possible defect.",
    exempt: (match) =>
      // Governed uncertainty markers are deliberate and reader-facing: they
      // say plainly that a fact needs evidence, validation, or client input
      // rather than inventing one.
      /^\[(?:EVIDENCE MISSING|ASSUMPTION TO VALIDATE|CLIENT TO COMPLETE)/i.test(
        match,
      ),
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

function sentenceOrParagraphAround(
  text: string,
  index: number,
  length: number,
): string {
  const beforeBreak = Math.max(
    text.lastIndexOf("\n\n", index),
    text.lastIndexOf(". ", index),
    text.lastIndexOf("; ", index),
  );
  const afterParagraph = text.indexOf("\n\n", index + length);
  const afterSentence = text.indexOf(". ", index + length);
  const positiveEnds = [afterParagraph, afterSentence].filter(
    (end) => end >= 0,
  );
  const end =
    positiveEnds.length > 0 ? Math.min(...positiveEnds) + 1 : text.length;
  return text
    .slice(beforeBreak >= 0 ? beforeBreak + 1 : 0, end)
    .replace(/\s+/g, " ")
    .trim();
}

function capabilityTermsForProfile(
  profile: ReturnType<typeof listVendorPlatformProfiles>[number],
): string[] {
  const terms = new Set<string>();
  const vendorName = profile.vendorName.toLowerCase();

  function addTerm(term: string) {
    const normalized = term.toLowerCase();
    if (normalized === vendorName) return;
    if (normalized.startsWith(`${vendorName} `)) return;
    if (normalized.length < 8) return;
    terms.add(term);
  }

  for (const value of [
    profile.platformFamily,
    ...profile.sourceRefs.map((ref) => ref.title),
  ]) {
    for (const token of value.match(/\b[A-Z][A-Za-z]+(?:[A-Z][A-Za-z]+)+\b/g) ??
      []) {
      addTerm(token);
    }
    for (const phrase of value.match(
      /\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4}\b/g,
    ) ?? []) {
      addTerm(phrase);
    }
  }

  for (const capability of profile.capabilityFamilies) {
    for (const value of [
      capability.name,
      capability.publicDescription,
      ...capability.commonProcessing,
      ...capability.commonOutputs,
    ]) {
      for (const phrase of value.match(
        /\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4}\b/g,
      ) ?? []) {
        addTerm(phrase);
      }
      for (const productName of value.match(
        /\b[A-Z][A-Za-z]+(?:[A-Z][A-Za-z]+)+\b/g,
      ) ?? []) {
        addTerm(productName);
      }
    }
  }

  return [...terms].sort((a, b) => b.length - a.length);
}

function findVendorClaimWithoutState(text: string): ScanFinding[] {
  const findings: ScanFinding[] = [];

  for (const profile of listVendorPlatformProfiles()) {
    const vendorPattern = new RegExp(
      `\\b${escapeForRegex(profile.vendorName)}\\b`,
      "gi",
    );
    const terms = capabilityTermsForProfile(profile);
    if (terms.length === 0) continue;
    const capabilityPattern = new RegExp(
      `\\b(?:${alternation(terms)})\\b`,
      "i",
    );

    let match: RegExpExecArray | null;
    while ((match = vendorPattern.exec(text)) !== null) {
      const localClaim = sentenceOrParagraphAround(
        text,
        match.index,
        match[0].length,
      );
      if (!capabilityPattern.test(localClaim)) continue;
      if (VENDOR_STATE_BOUNDARY_PATTERN.test(localClaim)) continue;

      const capabilityMatch = localClaim.match(capabilityPattern)?.[0];
      findings.push({
        kind: "vendor_claim_without_state",
        severity: "blocker",
        match: capabilityMatch ? `${match[0]} ${capabilityMatch}` : match[0],
        context: contextAround(text, match.index, match[0].length),
        why: "A named vendor capability claim must say whether it is vendor-published context, contract-confirmed, implementation-confirmed, or client-observed before it can be signed off.",
      });
    }
  }

  return findings;
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

  for (const finding of findVendorClaimWithoutState(text)) {
    const dedupeKey = `${finding.kind}:${finding.match.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    findings.push(finding);
  }

  const blockers = findings.filter((f) => f.severity === "blocker").length;
  return {
    findings,
    blockers,
    reviewItems: findings.length - blockers,
    clean: findings.length === 0,
  };
}
