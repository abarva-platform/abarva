import type { GovernedEvidenceItem } from "./types";
import { purposeCitationIds } from "./purpose-citations";

export type PurposeClaimClass =
  | "draft_status"
  | "decision_condition"
  | "evidence_gap"
  | "factual_claim";
export type PurposeClaimEvidence = Pick<
  GovernedEvidenceItem,
  "citationNumber" | "statement"
> &
  Partial<Pick<GovernedEvidenceItem, "approvalState" | "label">>;
export interface PurposeClaimContext {
  /** Complete supplied input bundle, never a claim about all enterprise evidence. */
  completeInputBundle?: boolean;
  /** Native document role, assigned by the renderer/parser, never inferred from prose. */
  textRole?: "body" | "scope" | "source" | "disclosure";
  syntheticInputBundle?: boolean;
  /** Citations attached to this structured paragraph, table row or slide. */
  sourceIds?: readonly number[];
}
export interface PurposeClaimVerdict {
  sentence: string;
  classification: PurposeClaimClass;
  supported: boolean;
  reason: string;
  sourceIds: number[];
}

const purposeNegativeClaim =
  /\b(?:no(?!-double-count)|none|missing|absent|unavailable|unrecorded|uncollected|lacks?|cannot|never\s+(?:been\s+)?(?:collected|received|provided|recorded|approved)|not\s+(?:yet\s+)?(?:collected|received|available|recorded|provided|loaded|supplied|established|approved|confirmed))\b/i;
const clean = (s: string) =>
  s
    .replace(/\[(?:\d+)(?:\s*[-–,]\s*\d+)*\]|[*"“”]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "")
    .trim()
    .toLowerCase();
const request =
  /^(?:(?:confirm|check|test|review|validate|determine) )?whether\b/i;
const bounded =
  /\b(?:in|from|across|against|within) (?:the |these |this |our )?(?:(?:supplied|provided|loaded|current|available|p[01](?: or p[01])?) )?(?:inputs|evidence|sources|context bundle|source bundle|bundle|records|brief|package)\b/i;
const status =
  /\b(?:this|the) (?:(?:revised|current) )?(?:draft|document|charter|readout|page|slide|inventory)\b|\b(?:here|on this page|proposed decision|draft decision|(?:in|at) p[01])\b/i;
const authority =
  /\b(?:approval|approved|signature|access grant|authoriz\w*|selected|route|funding|build|spend|implementation|benefit|value|savings|statement|cause|baseline|target|roadmap|business case|operating.model|execution plan|role reduction|role elimination|role accountability|accountability assumptions|connection is proven)\b/i;
const historical =
  /\b(?:ever|historically|previously|collected|received|arrived|exists?|existed|missing|absent|unavailable)\b/i;
const conditional =
  /\b(?:if|once|when|until|unless|subject to|hypothesis|hypotheses|proposed|assumed|assumes|assumption|conditions? for|counting conditions)\b/i;

function tokens(s: string): Set<string> {
  const aliases: Record<string, string> = {
    no: "missing",
    none: "missing",
    transcripts: "transcript",
    timestamps: "timestamp",
    samples: "sample",
    sampled: "sample",
    claims: "claim",
    cannot: "not",
    lacks: "missing",
    lack: "missing",
    absent: "missing",
    missing: "missing",
    unrecorded: "recorded",
    approved: "approval",
    approvals: "approval",
    reliably: "reliable",
    individuals: "individual",
    names: "name",
    granted: "approval",
    receives: "receive",
    recorded: "record",
    records: "record",
    submitted: "submission",
    teams: "team",
    sources: "source",
    inputs: "input",
    monetary: "financial",
    savings: "benefit",
    ranked: "ranking",
  };
  const ignored = new Set(
    "a an the is are was were be been being have has had and or of in on at by to from for with as that this these those it its there their yet source states says statement row recorded record input evidence no none not reporting".split(
      " ",
    ),
  );
  return new Set(
    (
      clean(s)
        .replace(/-/g, " ")
        .match(/[a-z][a-z]+|\d+(?:\.\d+)?/g) || []
    )
      .map((t) => aliases[t] || t)
      .filter((t) => !ignored.has(t)),
  );
}

function structuredProposalSupports(claim: string, statement: string): boolean {
  const attributed = claim.match(
    /^(?:the )?(?:origination|initial change hypothesis) hypothesi[sz]es no ([a-z -]+?)(?:, to confirm or correct)?$/,
  )?.[1];
  if (attributed)
    return statement.split(/\n|(?<=[.!?])\s+/).some((line) => {
      const assumed = clean(line).match(/\bno assumed (.+?)(?:[.;]|$)/)?.[1];
      return Boolean(
        assumed
          ?.split(/\s+or\s+|,\s*/)
          .some((subject) => subject === attributed),
      );
    });
  const explicitHypothesis = claim.match(
    /(?:^|,\s*)([^,]+?) (?:hypothesised|hypothesized|proposed) as none$/,
  )?.[1];
  const subject =
    claim.match(/^no (.+?) is proposed$/)?.[1] || explicitHypothesis;
  if (!subject) return false;
  const rows: string[][] = [];
  for (const line of statement.split("\n")) {
    const json = line.match(/^row \d+: (\[.*\])$/)?.[1];
    if (!json) continue;
    try {
      const cells: unknown = JSON.parse(json);
      if (Array.isArray(cells) && cells.every((c) => typeof c === "string"))
        rows.push(cells);
    } catch {
      // Malformed extracts cannot substantiate a claim.
    }
  }
  const header = rows[0]?.map(clean);
  if (!header) return false;
  const subjectColumn = header.findIndex((h) =>
    /^(?:question|subject)$/.test(h),
  );
  const valueColumn = header.findIndex((h) =>
    /^(?:(?:synthetic|proposed) )?hypothesis$|^proposed value$/.test(h),
  );
  const statusColumn = header.indexOf("status");
  if ([subjectColumn, valueColumn, statusColumn].some((index) => index < 0))
    return false;
  const wanted = tokens(subject);
  if (wanted.size < 2) return false;
  return rows
    .slice(1)
    .some(
      (row) =>
        (explicitHypothesis
          ? [...wanted].every((term) =>
              tokens(row[subjectColumn] || "").has(term),
            )
          : [...tokens(row[subjectColumn] || "")].sort().join(" ") ===
            [...wanted].sort().join(" ")) &&
        clean(row[valueColumn] || "") === "none" &&
        /^proposed(?: not confirmed| not approved)?$/.test(
          clean(row[statusColumn] || ""),
        ),
    );
}

function citedHypothesisSupports(
  claim: string,
  evidence: readonly PurposeClaimEvidence[],
  ids: readonly number[],
): boolean {
  const normalize = (text: string) =>
    tokens(
      text
        .replace(/\b(?:may|might|could)\b/gi, "")
        .replace(/\bwithout\b/gi, "missing"),
    );
  const terms = normalize(claim);
  return (
    terms.size >= 2 &&
    evidence.some(
      (entry) =>
        ids.includes(entry.citationNumber) &&
        entry.statement
          .split(/\n|(?<=[.!?])\s+/)
          .some(
            (line) =>
              (purposeNegativeClaim.test(line) || /\bwithout\b/i.test(line)) &&
              [...terms].every((term) => normalize(line).has(term)),
          ),
    )
  );
}

function labelledEvidenceRows(statement: string): string[] {
  let header: string[] | null = null;
  const rows: string[] = [];
  for (const line of statement.split("\n")) {
    const match = line.match(/^row (\d+): (\[.*\])$/);
    if (!match) continue;
    try {
      const cells: unknown = JSON.parse(match[2]!);
      if (
        !Array.isArray(cells) ||
        !cells.every((cell) => typeof cell === "string")
      )
        continue;
      if (match[1] === "1") {
        header = cells;
        continue;
      }
      if (
        !header ||
        header.length !== cells.length ||
        !cells.some((cell) => purposeNegativeClaim.test(cell))
      )
        continue;
      // Column labels describe these values only; never borrow a different row's status.
      const fields = Object.fromEntries(
        header
          .map((label, i) => [label, cells[i]])
          .filter(([, value]) => value.trim()),
      );
      rows.push(`row ${match[1]}: ${JSON.stringify(fields)}`);
    } catch {
      header = null;
    }
  }
  return rows;
}

/** Textual support is local to a cited sentence or extract row, not a whole file. */
function purposeClaimHasSupport(
  claim: string,
  sources: readonly PurposeClaimEvidence[],
  ids: number[],
): boolean {
  const unlabelled = clean(claim).match(/^([^:]{1,50}):\s*(.+)$/);
  const factualText =
    unlabelled &&
    !purposeNegativeClaim.test(unlabelled[1]!) &&
    unlabelled[1]!.split(/\s+/).length <= 6
      ? unlabelled[2]!
      : clean(claim);
  const normalized = factualText.replace(
    /^(?:source states|recorded change position):\s*/,
    "",
  );
  const terms = tokens(normalized);
  const absentSubject = normalized.match(
    /\bno (.+?) (?:exists?|is|are|was|were|has|have)\b/,
  )?.[1];
  const negativeTargets = (value: string) =>
    [
      ...clean(value).matchAll(
        /\b(?:no|none|not|cannot|lacks?|missing|absent)\s+((?:(?:is|are|yet|a|an|the|any)\s+)*[a-z][a-z-]*)/g,
      ),
    ]
      .map((match) => [...tokens(match[1]!)][0])
      .filter((term): term is string => Boolean(term));
  const targets = negativeTargets(claim);
  const unapproved = normalized.match(
    /^no approved (target|benefit|baseline)(?:\b|$)/,
  )?.[1];
  const qualifiedGap = /\b(?:may|might|could) (?:lack\b|be missing\b)/i;
  const permitsStrength = (line: string) =>
    (!qualifiedGap.test(line) || qualifiedGap.test(normalized)) &&
    (!/\b(?:hypothesis:|no assumed)\b/.test(clean(line)) ||
      /\b(?:hypothes\w*|assum\w*)\b/.test(normalized)) &&
    (!(
      /^row \d+:/.test(line) &&
      /"none"/i.test(line) &&
      /proposed/i.test(line)
    ) ||
      /\b(?:hypothesised|hypothesized|proposed|assumed)\b/.test(normalized));
  return sources.some(
    (source) =>
      ids.includes(source.citationNumber) &&
      (source.statement
        .split(/\n|(?<=[.!?])\s+/)
        .some(
          (line) => permitsStrength(line) && clean(line).includes(normalized),
        ) ||
        structuredProposalSupports(normalized, source.statement) ||
        (unapproved !== undefined &&
          source.statement
            .split(/\n|(?<=[.!?])\s+/)
            .some(
              (line) =>
                new RegExp(
                  `^no (?:target|benefit|baseline)(?: (?:or|and) (?:target|benefit|baseline))* (?:is|are) approved\\b`,
                ).test(clean(line)) &&
                new RegExp(`\\b${unapproved}\\b`).test(
                  clean(line).split(/ (?:is|are) approved/)[0]!,
                ),
            )) ||
        [
          ...source.statement.split(/\n|(?<=[.!?])\s+|;\s+|\s+but\s+/),
          ...labelledEvidenceRows(source.statement),
        ].some((line) => {
          if (
            !permitsStrength(line) ||
            !purposeNegativeClaim.test(line) ||
            terms.size < 2
          )
            return false;
          const available = tokens(line);
          const localTargets = negativeTargets(line);
          if (absentSubject && !clean(line).includes(`no ${absentSubject}`))
            return false;
          return (
            (!/^no\b/.test(normalized) ||
              (targets.length > 0 &&
                targets.every((target) => localTargets.includes(target)))) &&
            [...terms].every((term) => available.has(term))
          );
        })),
  );
}

function gapSubjects(sentence: string): string[] {
  const value = clean(sentence);
  const lead =
    value.match(
      /^(?:(?:the|this|supplied) )?(?:brief|input bundle|source bundle|context bundle|package) (?:records?|states?|contains?|provides?) no (.+?)(?:,|;|$)/,
    )?.[1] ||
    value.match(
      /^no\s+(.+?)\s+(?:(?:is|are) )?(?:stated|recorded|provided|supplied)\s+(?:in|from)\b/,
    )?.[1] ||
    value.match(
      /\bno\s+(.+?)(?:\s+(?:is|are|exists?|has been|have been)\s+|\s+(?:in|from)\s+)/,
    )?.[1] ||
    value.match(
      /^(.+?) (?:is|are) (?:missing|absent|unavailable|not (?:recorded|provided|established)) (?:in|from)\b/,
    )?.[1];
  return lead
    ? lead
        .split(/,|\bor\b|\band\b/)
        .map((s) => s.trim().replace(/^any /, ""))
        .filter(Boolean)
    : [];
}

function bundleHasSubject(
  subject: string,
  evidence: readonly PurposeClaimEvidence[],
): boolean {
  if (/approval/.test(subject))
    return evidence.some((e) => e.approvalState === "approved");
  const aliases = /meeting rhythm|cadence/.test(subject)
    ? /\b(?:cadence|meeting rhythm)\s*[:=-]\s*\S|\b(?:weekly|monthly|fortnightly|daily|quarterly)\b.{0,60}\b(?:review|meeting|forum|checkpoint|governance)\b|\b(?:review|meeting|forum|checkpoint|governance|cadence)\b.{0,60}\b(?:weekly|monthly|fortnightly|daily|quarterly)\b/i
    : /individual names|named individuals/.test(subject)
      ? /\b(?:name|named individual|attendee|participant)\s*[:=,]\s*[A-Z][a-z]+/
      : /funding amount/.test(subject)
        ? /\b(?:funding|budget|ceiling|allowance)\b.{0,100}(?:[$£€]|\d)/i
        : null;
  const wanted = tokens(subject);
  return evidence.some((e) =>
    e.statement
      .split(/\n|(?<=[.!?])\s+/)
      .flatMap((line) => {
        const cells = line.match(/^row \d+: (\[.*\])$/)?.[1];
        if (!cells) return [line];
        try {
          const parsed: unknown = JSON.parse(cells);
          // A role column cannot turn a prohibited behavior in another cell into evidence.
          return Array.isArray(parsed) &&
            parsed.every((v) => typeof v === "string")
            ? parsed
            : [];
        } catch {
          return [];
        }
      })
      .some((line) => {
        if (
          /\b(?:planned|to collect|not recorded|not provided|pending|not named|none|no|missing|not approved)\b/i.test(
            line,
          )
        )
          return false;
        return aliases
          ? aliases.test(line)
          : wanted.size > 0 && [...wanted].every((t) => tokens(line).has(t));
      }),
  );
}

function splitOutsideQuotes(text: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let start = 0,
    cursor = 0,
    quoted = false;
  for (const match of text.matchAll(
    new RegExp(separator.source, `${separator.flags.replace(/g/g, "")}g`),
  )) {
    for (; cursor < match.index!; cursor++) {
      if (text[cursor] === '"') quoted = !quoted;
      else if (text[cursor] === "“") quoted = true;
      else if (text[cursor] === "”") quoted = false;
    }
    if (!quoted) {
      parts.push(text.slice(start, match.index));
      start = match.index! + match[0].length;
    }
  }
  return [...parts, text.slice(start)];
}

/** Classify each clause so a harmless disclosure cannot excuse an attached factual claim. */
export function classifyPurposeClaims(
  text: string,
  evidence: readonly PurposeClaimEvidence[],
  context: PurposeClaimContext = {},
): PurposeClaimVerdict[] {
  const sentences = splitOutsideQuotes(text, /\n|(?<=[.!?])\s+(?!\s*\[)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.flatMap((sentence) => {
    const ids = [
      ...new Set([
        ...purposeCitationIds(sentence),
        ...(context.sourceIds || []),
      ]),
    ];
    const decisionLimit =
      /\b(?:this (?:draft|charter|document|decision|readout|page)|it) (?:commits?|approves?|authori[sz]es?|grants?|seeks?|states?|asserts?|selects?) no\b/.test(
        clean(sentence),
      );
    const causalParts = splitOutsideQuotes(
      sentence,
      /,?\s+(?:because|so|whereas)\s+/i,
    );
    // A permitted negative rule must not detach from an unsupported negative premise.
    const independentParts =
      causalParts.filter((part) => purposeNegativeClaim.test(part)).length <= 1
        ? causalParts
        : [sentence];
    const clauses = independentParts.flatMap((part) =>
      splitOutsideQuotes(
        part,
        /;|,\s+and\s+(?=(?:that\s+)?[\w -]{1,60}\b(?:cannot|lacks?|has no|have no|is not|are not)\b)|(?:,\s+(?:with\s+)?|\s+and\s+)(?=(?:and )?(?:no|none|missing|absent)\b)/i,
      ),
    );
    return clauses
      .flatMap((clause) => {
        const quotes = [...clause.matchAll(/["“]([^"”]+)["”]/g)]
          .map((m) => m[1]!)
          .filter((q) => purposeNegativeClaim.test(q));
        if (!quotes.length) return [clause];
        const outer = clause.replace(/["“][^"”]+["”]/g, "");
        // Classify the assertion inside the quote, not its attribution's scope.
        return [
          ...quotes,
          ...(purposeNegativeClaim.test(outer) ? [outer] : []),
        ];
      })
      .filter((clause) => purposeNegativeClaim.test(clean(clause)))
      .map((clause) => {
        const value = clean(clause).replace(/^that /, "");
        const result = (
          classification: PurposeClaimClass,
          supported: boolean,
          reason: string,
        ): PurposeClaimVerdict => ({
          sentence: clause.trim(),
          classification,
          supported,
          reason,
          sourceIds: ids,
        });
        const conditionalRisk = value.match(
          /\b(?:could|may|might) (?:make|render)\b.{1,120}\b(?:wrong|unreliable|unavailable|missing)\b/,
        );
        const ifFirst = value.match(/^if ([^,;]+)(?:, (.*))?$/);
        const ifLast = value.match(
          /^(?:proceed|hold|stop|pause|revise|request|return|reconsider)\b([^;.!?]*?) if (.+)$/,
        );
        const conditionalPremise = value.match(/^(.+?)\s+if\s+(.+)$/);
        if (
          conditionalPremise &&
          !purposeNegativeClaim.test(conditionalPremise[1]!) &&
          purposeNegativeClaim.test(conditionalPremise[2]!)
        )
          return result(
            "decision_condition",
            true,
            "The negative premise is explicitly conditional, not asserted as a fact",
          );
        if (
          (ifFirst &&
            purposeNegativeClaim.test(ifFirst[1]!) &&
            !purposeNegativeClaim.test(ifFirst[2] || "")) ||
          (ifLast && !purposeNegativeClaim.test(ifLast[1]!))
        )
          return result(
            "decision_condition",
            true,
            "An explicit if-condition or conditional instruction does not assert its premise",
          );
        if (
          /^no (?:benefit|savings|value) (?:counts|may be counted|can be claimed) (?:until|unless)\b/.test(
            value,
          )
        )
          return result(
            "decision_condition",
            true,
            "Prospective counting rule; the subordinate clause names its required evidence",
          );
        if (
          /^no [a-z -]+ (?:is|may be|can be) (?:confirmed|accepted|approved|selected|verified) (?:until|unless)\b/.test(
            value,
          ) &&
          !historical.test(value) &&
          [...value.matchAll(new RegExp(purposeNegativeClaim.source, "gi"))]
            .length === 1
        )
          return result(
            "decision_condition",
            true,
            "A present-tense acceptance rule names the evidence required before confirmation",
          );
        if (
          /^this (?:draft|document|readout)\b/.test(value) &&
          /\bcredits? no (?:benefit|savings|value) (?:before|until)\b/.test(
            value,
          ) &&
          !/\b(?:ever|historically|previously)\b/.test(value) &&
          [...value.matchAll(new RegExp(purposeNegativeClaim.source, "gi"))]
            .length === 1
        )
          return result(
            "decision_condition",
            true,
            "This document conditions value recognition on later evidence; it does not assert that collection occurred",
          );
        if (
          conditionalRisk &&
          !purposeNegativeClaim.test(value.slice(0, conditionalRisk.index))
        )
          return result(
            "decision_condition",
            true,
            "Hypothetical consequence, with no independent absence claim in the premise",
          );
        if (request.test(value))
          return result(
            "decision_condition",
            true,
            "Question to validate, not an asserted absence",
          );
        if (/\b(?:may|might|could) (?:lack\b|be missing\b)/.test(value))
          return result(
            "decision_condition",
            citedHypothesisSupports(value, evidence, ids),
            "A proposed gap hypothesis requires local support in its cited source",
          );
        if (
          /^(?:report|claim|publish|count|state) no\b/.test(value) &&
          /\b(?:until|unless|without)\b/.test(value) &&
          !historical.test(value)
        )
          return result(
            "decision_condition",
            true,
            "Imperative reporting condition, not a historical assertion of absence",
          );
        if (
          !historical.test(value) &&
          /^(?:(?:proposed|decision|action|knowledge|data|financial) )?(?:restriction|condition|boundary|rule): no\b/.test(
            value,
          ) &&
          /\b(?:without|until|unless|permitted|presented as|treated as)\b/.test(
            value,
          )
        )
          return result(
            "decision_condition",
            true,
            "Explicit prescriptive limit, not an assertion about past behavior",
          );
        if (
          /^all inputs in (?:this|the supplied) bundle\b/.test(value) &&
          /\b(?:pending owner review|proposed)\b/.test(value) &&
          /\bnot approved$/.test(value)
        )
          return result(
            "draft_status",
            Boolean(
              context.completeInputBundle &&
              evidence.length &&
              evidence.every(
                (entry) =>
                  entry.approvalState === "pending" ||
                  entry.approvalState === "proposed",
              ),
            ),
            "A bundle-wide approval disclosure requires every input's explicit state",
          );
        if (
          !historical.test(value) &&
          /\b(?:measures?|definitions?|baselines?)\b/.test(value) &&
          /\bcannot (?:be (?:blended|combined|averaged|compared)|form (?:one|a single) baseline)\b/.test(
            value,
          )
        )
          return result(
            "decision_condition",
            true,
            "Restriction on combining measures, not a claim about evidence availability",
          );
        if (
          !historical.test(value) &&
          /\b(?:receipts|benefits|savings|revenue|value)\b/.test(value) &&
          /\bcannot be counted again\b/.test(value)
        )
          return result(
            "decision_condition",
            true,
            "A prohibition on double counting, not a claim that double counting occurred",
          );
        if (
          context.textRole === "scope" &&
          /^shows\b/.test(clean(sentence)) &&
          /^not (?:(?:yet|independently) )?(?:confirmed|validated|verified|approved|accepted|selected|measured|established) [a-z -]+$/.test(
            value,
          ) &&
          !historical.test(value)
        )
          return result(
            "draft_status",
            true,
            "A noun-phrase scope contrast limits this page, not the business's evidence history",
          );
        if (
          context.textRole === "scope" &&
          !historical.test(value) &&
          (/^(?:and )?none is (?:yet )?confirmed (?:here|by this page)$/.test(
            value,
          ) ||
            /^(?:this (?:page|readout|document)|it) (?:isolates no cause|measures no intervention)\b/.test(
              value,
            ) ||
            /^(?:this (?:page|readout|document)|it) (?:(?:selects|costs|approves)(?:, | and ))*(?:selects|costs|approves) none of them$/.test(
              value,
            ))
        )
          return result(
            "draft_status",
            true,
            "Explicit limit on the current page's conclusion or decision, not on the enterprise's history",
          );
        if (
          context.textRole === "scope" &&
          /^none is (?:yet )?confirmed in (?:this|the supplied) evidence base$/.test(
            value,
          )
        )
          return result(
            "draft_status",
            true,
            "This page declines to confirm its candidates",
          );
        if (
          /^none (?:is )?selected$/.test(value) &&
          /^(?:routes compared,? none selected|(?:[a-z]+ )?routes are offered for comparison and none is selected)$/.test(
            clean(sentence),
          )
        )
          return result(
            "draft_status",
            true,
            "Comparison heading does not select a route",
          );
        if (
          !historical.test(value) &&
          authority.test(value) &&
          /^no .+ (?:is )?(?:asserted|claimed|sought)\b/.test(value)
        )
          return result(
            "draft_status",
            true,
            "Explicit limit on this document's assertion",
          );
        if (
          context.textRole === "scope" &&
          /^none is (?:accepted|ranked)(?: or (?:accepted|ranked))?$/.test(
            value,
          )
        )
          return result(
            "draft_status",
            true,
            "Declared page scope does not accept or rank candidates",
          );
        if (
          !historical.test(value) &&
          decisionLimit &&
          /\bno (?:implementation |production )?(?:funding|spend|spending|build|execution|baseline|target|benefit|blended value|pilot cohort|interface access|priced estimate|architecture)\b/.test(
            value,
          )
        )
          return result(
            "draft_status",
            true,
            "Scope of this decision, including coordinated limits",
          );
        if (
          !historical.test(value) &&
          /\bno (?:benefit|value|savings|roi|workforce)\b/.test(value) &&
          /\b(?:may|shall|must|without|until|unless)\b/.test(value)
        )
          return result(
            "decision_condition",
            true,
            "A restriction on claiming value, not a statement that evidence was never collected",
          );
        if (
          !historical.test(value) &&
          /\b(?:this (?:draft|charter|document|decision)|it) (?:commits?|authori[sz]es?|grants?) no (?:implementation |production )?(?:funding|spending|build|execution)\b/.test(
            value,
          )
        )
          return result(
            "draft_status",
            true,
            "This decision instrument does not grant spending or execution authority",
          );
        if (
          /^no approval has (?:yet )?been recorded against the inputs supplied\b/.test(
            value,
          )
        )
          return result(
            "evidence_gap",
            Boolean(
              context.completeInputBundle &&
              evidence.length &&
              evidence.every(
                (e) =>
                  e.approvalState === "pending" ||
                  e.approvalState === "proposed",
              ),
            ),
            "Input approval absence must agree with the supplied bundle's explicit states",
          );
        if (
          context.textRole === "scope" &&
          !historical.test(value) &&
          /\b(?:(?:records?|reports?|establishes?|asserts?|proves?|demonstrates?|attributes?|validates?|evidences?|scores?|confirms?) no|no .+ (?:is|are) (?:sought|claimed|asserted))\b/.test(
            value,
          )
        )
          return result(
            "draft_status",
            true,
            "Declared scope note limits what this page establishes",
          );
        if (
          context.textRole === "scope" &&
          /\b(?:this (?:page|readout|document|draft)|it) (?:records?|reports?|asserts?) no\b/.test(
            clean(sentence),
          ) &&
          /^no (?:selected route|approved architecture|priced estimate|access grant|selection)$/.test(
            value,
          )
        )
          return result(
            "draft_status",
            true,
            "Coordinated decision limit inherits the page subject, not an enterprise-wide absence",
          );
        if (
          !historical.test(value) &&
          /\b(?:proposed|proposal),? (?:and )?not (?:yet )?confirmed\b/.test(
            value,
          )
        )
          return result(
            "draft_status",
            ids.length > 0 &&
              ids.every((id) => {
                const state = evidence.find(
                  (e) => e.citationNumber === id,
                )?.approvalState;
                return state === "pending" || state === "proposed";
              }),
            "Pending status must match each cited input's approval state",
          );
        if (
          !historical.test(value) &&
          /\bno role[ -]elimination assumption\b/.test(value) &&
          /^(?:required:|(?:proposed|keep|retain)\b)/.test(value) &&
          [...value.matchAll(new RegExp(purposeNegativeClaim.source, "gi"))]
            .length === 1
        )
          return result(
            "decision_condition",
            true,
            "A proposed planning constraint, not an assertion about workforce history",
          );
        if (
          /\bno (?:savings|benefit) commitment exists until\b/.test(value) &&
          !/\b(?:ever|historically|previously)\b/.test(value)
        )
          return result(
            "decision_condition",
            true,
            "A value commitment is conditional on later validation",
          );
        if (/^no value claim issued\b/.test(value))
          return result(
            "decision_condition",
            true,
            "Value-claim boundary of this decision",
          );
        if (/^avoid committing to unavailable\b/.test(value))
          return result(
            "decision_condition",
            true,
            "Precaution against unconfirmed access, not an accomplished finding",
          );
        if (
          !historical.test(value) &&
          /\bno (?:automatic save|production writeback|raw .* in (?:model )?prompts)|\bno .+ without (?:explicit )?human (?:confirmation|approval)/.test(
            value,
          )
        )
          return result(
            "decision_condition",
            true,
            "Prohibited action or required human confirmation",
          );
        if (
          /\b(?:may|might|could|can) be (?:wrong|unavailable|missing)\b/.test(
            value,
          )
        )
          return result(
            "decision_condition",
            true,
            "Conditional risk to test, not an asserted absence",
          );
        if (/^(?:sessions and |review )?missing context$/.test(value))
          return result(
            "evidence_gap",
            true,
            "Topic heading, not a specific missing-fact assertion",
          );
        if (
          /\bnone of these is yet confirmed by a (?:product )?reviewer\b/.test(
            value,
          )
        )
          return result(
            "evidence_gap",
            Boolean(
              context.completeInputBundle &&
              evidence.length &&
              evidence.every(
                (e) =>
                  e.approvalState === "pending" ||
                  e.approvalState === "proposed",
              ),
            ),
            "Review status must be explicit for every supplied input",
          );
        if (
          bounded.test(value) ||
          /^(?:(?:the|this|supplied) )?(?:brief|input bundle|source bundle|context bundle|package) (?:records?|states?|contains?|provides?) no\b/.test(
            value,
          )
        ) {
          const subjects = gapSubjects(value);
          const contradicted = subjects.some((subject) =>
            bundleHasSubject(subject, evidence),
          );
          const cited = purposeClaimHasSupport(value, evidence, ids);
          return result(
            "evidence_gap",
            !contradicted &&
              (cited ||
                Boolean(context.completeInputBundle && subjects.length)),
            contradicted
              ? "The supplied bundle contains the item"
              : cited
                ? "Explicit cited gap"
                : context.completeInputBundle && subjects.length
                  ? "Absent from the complete supplied input bundle only"
                  : "Completeness or gap subject not established",
          );
        }
        if (
          !historical.test(value) &&
          authority.test(value) &&
          (status.test(value) ||
            /\bno (?:value, savings or staffing statement|blended baseline|benefit|savings) (?:is made|is asserted|is claimed)\b/.test(
              value,
            ) ||
            (status.test(clean(sentence)) &&
              /^(?:no approval|no signature|no benefit|no solution|no operating model)/.test(
                value,
              )))
        )
          return result(
            "draft_status",
            true,
            "This instrument does not record or grant the decision",
          );
        if (
          /^no blended baseline\b/.test(value) &&
          /kept separate/.test(clean(sentence))
        )
          return result(
            "decision_condition",
            true,
            "Boundary of this comparison, not a claim about available records",
          );
        if (
          !historical.test(value) &&
          authority.test(value) &&
          conditional.test(clean(sentence)) &&
          !/\b(?:cannot|lacks?)\b/.test(value)
        )
          return result(
            "decision_condition",
            true,
            "Conditional scope or proposed assumption, not an accomplished outcome",
          );
        const quoted = [...clause.matchAll(/["“]([^"”]+)["”]/g)]
          .map((m) => m[1]!)
          .filter((q) => purposeNegativeClaim.test(q));
        const outer = clause.replace(/["“][^"”]+["”]/g, "");
        const claims = quoted.length
          ? [...quoted, ...(purposeNegativeClaim.test(outer) ? [outer] : [])]
          : [value];
        return result(
          "factual_claim",
          claims.every((c) => purposeClaimHasSupport(c, evidence, ids)),
          "Factual negative needs local support in its cited source",
        );
      });
  });
}
