/**
 * Item C-403 — the aVa Source answer router is 19 first-match-wins regexes, and
 * until this suite existed nothing measured what that ordering actually does.
 *
 * What this suite is, and what it deliberately is not.
 *
 * It is the acceptance's measurement, made executable and repeatable, and it
 * changes NO routing: `RULES` is not touched, nothing is added, removed or
 * reordered, and no route is edited. A routing change on top of a measured
 * baseline is a separate item, and the baseline is what makes that change
 * reviewable. Three things are recorded as data in
 * `docs/architecture/c403-answer-mode-routing.json`:
 *
 *   1. `general_advisory` is reachable ONLY by fallback. This is asserted by
 *      exhausting the declared mode union — every member of the union is read
 *      off the `SourceAnswerMode` type alias, every rule's declared mode is read
 *      off the `RULES` table, and the difference is computed — rather than by
 *      naming the two `return` sites, which would re-state the source instead of
 *      testing it. A third rule emitting `general_advisory` would fail this
 *      suite; so would a `general_advisory` result carrying `isFallback: false`.
 *   2. First-match shadowing, for each ordered pair of rules. The probes are
 *      generated from each rule's OWN alternations — parsed out of the rule's
 *      regex literal and expanded — not invented sentences, so a pair listed
 *      here is shadowed on the rule's own vocabulary rather than on a sentence
 *      chosen to make a point. Every shadowed pair is listed.
 *   3. The 16 acceptance rows of `SPEC_lever_basis_provenance.md` §12.11 (cited
 *      by `B9`), plus authored paraphrases, run through the classifier with the
 *      matched rule id and fallback flag recorded per question — so the size of
 *      `B6`'s "general contract question path" is a number rather than an
 *      impression. 11 of those 16 rows are literal quoted questions and 5 are
 *      described actions; the described ones are instantiated here as authored
 *      questions and are labelled `described_row_instantiated`, because a
 *      sentence this suite wrote is not a sentence the spec wrote.
 *
 * ONE PREMISE OF THE FILING IS WRONG, and it is corrected here rather than
 * inherited. The item states that `classifySourceAnswerMode` has exactly one
 * caller in `src/`, which discards `.matchedRule` and `.isFallback`, and that a
 * repo-wide grep finds those fields on no consumer of this classifier's result.
 * There are TWO non-test callers, and they disagree with each other:
 *
 *   - `src/app/api/chat/agent/route.ts` assigns `.mode` and drops both fields,
 *     exactly as filed. That caller is the reason the defect is real.
 *   - `src/lib/source/ava/module-expert.ts` does NOT drop them: it carries
 *     `classification.matchedRule` and `classification.isFallback` into the chat
 *     packet, and renders the rule id into the text handed to the model.
 *
 * Both call sites are asserted below, from their own bytes, so the correction
 * cannot rot back into the filing's version. The measurement clauses are
 * unaffected by that error: what the router does is the same either way.
 *
 * The rules are extracted through the TypeScript AST, not by a regex over the
 * file. A text scan cannot answer a syntax question, and the subject here IS
 * syntax — regex literals nested inside arrow functions inside object literals.
 *
 * Regenerate the committed record with:
 *   ABARVA_UPDATE_C403_ROUTING=1 npx jest --runTestsByPath \
 *     src/__tests__/behaviors/c403-answer-mode-routing.test.ts
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import {
  classifySourceAnswerMode,
  type SourceAnswerMode,
} from "@/lib/source/ava/answer-mode";

const REPO_ROOT = process.cwd();
const SUBJECT_REL = "src/lib/source/ava/answer-mode.ts";
const SUBJECT_PATH = path.join(REPO_ROOT, SUBJECT_REL);
const RECORD_REL = "docs/architecture/c403-answer-mode-routing.json";
const RECORD_PATH = path.join(REPO_ROOT, RECORD_REL);
const ROUTE_CALLER_REL = "src/app/api/chat/agent/route.ts";
const PACKET_CALLER_REL = "src/lib/source/ava/module-expert.ts";

const UPDATE = process.env.ABARVA_UPDATE_C403_ROUTING === "1";

// ───────────────────────────────────────────────────────────────────────────────
// 1. Extract the rule table through the TypeScript AST.
// ───────────────────────────────────────────────────────────────────────────────

interface ExtractedRule {
  index: number;
  id: string;
  mode: string;
  /** The rule's regex literal sources, in source order, WITHOUT delimiters. */
  regexes: string[];
}

function parseSubject(): ts.SourceFile {
  const text = fs.readFileSync(SUBJECT_PATH, "utf8");
  return ts.createSourceFile(SUBJECT_REL, text, ts.ScriptTarget.Latest, true);
}

function findRulesArray(sourceFile: ts.SourceFile): ts.ArrayLiteralExpression {
  let found: ts.ArrayLiteralExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "RULES" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      found = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!found) {
    throw new Error(`RULES array literal not found in ${SUBJECT_REL}`);
  }
  return found;
}

function stringPropertyOf(
  object: ts.ObjectLiteralExpression,
  name: string,
): string {
  for (const property of object.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === name &&
      ts.isStringLiteral(property.initializer)
    ) {
      return property.initializer.text;
    }
  }
  throw new Error(`property "${name}" not found as a string literal`);
}

function regexLiteralsWithin(node: ts.Node): string[] {
  const out: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isRegularExpressionLiteral(child)) {
      const raw = child.getText();
      const lastSlash = raw.lastIndexOf("/");
      out.push(raw.slice(1, lastSlash));
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return out;
}

function extractRules(): {
  rules: ExtractedRule[];
  regexLiteralsInTable: number;
} {
  const sourceFile = parseSubject();
  const array = findRulesArray(sourceFile);
  const rules: ExtractedRule[] = [];
  array.elements.forEach((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`RULES[${index}] is not an object literal`);
    }
    rules.push({
      index,
      id: stringPropertyOf(element, "id"),
      mode: stringPropertyOf(element, "mode"),
      regexes: regexLiteralsWithin(element),
    });
  });
  return { rules, regexLiteralsInTable: regexLiteralsWithin(array).length };
}

function extractModeUnion(): string[] {
  const sourceFile = parseSubject();
  let members: string[] | null = null;
  const visit = (node: ts.Node): void => {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === "SourceAnswerMode" &&
      ts.isUnionTypeNode(node.type)
    ) {
      members = node.type.types.map((member) => {
        if (
          ts.isLiteralTypeNode(member) &&
          ts.isStringLiteral(member.literal)
        ) {
          return member.literal.text;
        }
        throw new Error("SourceAnswerMode member is not a string literal type");
      });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!members) {
    throw new Error("SourceAnswerMode union not found");
  }
  return members;
}

// ───────────────────────────────────────────────────────────────────────────────
// 2. Expand a rule's own alternations into probe strings.
//
// A deliberately small regex subset — exactly what these 19 rules use. Anything
// outside it throws rather than guessing, because a silently mis-expanded probe
// would turn a shadowing measurement into a measurement of this parser.
// ───────────────────────────────────────────────────────────────────────────────

type Node =
  | { kind: "alt"; options: Node[] }
  | { kind: "seq"; items: Node[] }
  | { kind: "literal"; value: string }
  | { kind: "class"; members: string[] }
  | { kind: "optional"; inner: Node }
  | { kind: "repeat"; inner: Node; allowEmpty: boolean };

/** One sample string per unbounded escape. Deterministic on purpose. */
const ESCAPE_SAMPLES: Record<string, string> = {
  w: "x",
  d: "3",
  s: " ",
};

function parseRegex(source: string): Node {
  let position = 0;

  const parseAlternation = (): Node => {
    const options: Node[] = [parseSequence()];
    while (position < source.length && source[position] === "|") {
      position += 1;
      options.push(parseSequence());
    }
    return options.length === 1 ? options[0] : { kind: "alt", options };
  };

  const parseSequence = (): Node => {
    const items: Node[] = [];
    while (
      position < source.length &&
      source[position] !== "|" &&
      source[position] !== ")"
    ) {
      items.push(parseQuantified());
    }
    return { kind: "seq", items };
  };

  const parseQuantified = (): Node => {
    const atom = parseAtom();
    const next = source[position];
    if (next === "?") {
      position += 1;
      return { kind: "optional", inner: atom };
    }
    if (next === "+") {
      position += 1;
      return { kind: "repeat", inner: atom, allowEmpty: false };
    }
    if (next === "*") {
      position += 1;
      return { kind: "repeat", inner: atom, allowEmpty: true };
    }
    return atom;
  };

  const parseAtom = (): Node => {
    const char = source[position];
    if (char === "(") {
      position += 1;
      if (source.startsWith("?:", position)) {
        position += 2;
      }
      const inner = parseAlternation();
      if (source[position] !== ")") {
        throw new Error(`unbalanced group at ${position} in /${source}/`);
      }
      position += 1;
      return inner;
    }
    if (char === "[") {
      position += 1;
      const members: string[] = [];
      while (position < source.length && source[position] !== "]") {
        if (source[position] === "\\") {
          position += 1;
          members.push(source[position]);
        } else {
          members.push(source[position]);
        }
        position += 1;
      }
      if (source[position] !== "]") {
        throw new Error(`unterminated class in /${source}/`);
      }
      position += 1;
      return { kind: "class", members };
    }
    if (char === "\\") {
      const escaped = source[position + 1];
      position += 2;
      if (escaped === "b" || escaped === "B") {
        // A boundary contributes no characters.
        return { kind: "literal", value: "" };
      }
      if (escaped in ESCAPE_SAMPLES) {
        return { kind: "literal", value: ESCAPE_SAMPLES[escaped] };
      }
      return { kind: "literal", value: escaped };
    }
    if (char === "^" || char === "$") {
      position += 1;
      return { kind: "literal", value: "" };
    }
    if (char === "." ) {
      position += 1;
      return { kind: "literal", value: "a" };
    }
    position += 1;
    return { kind: "literal", value: char };
  };

  const parsed = parseAlternation();
  if (position !== source.length) {
    throw new Error(
      `regex /${source}/ not fully consumed — stopped at ${position}`,
    );
  }
  return parsed;
}

const EXPANSION_CAP = 5000;

function expand(node: Node): string[] {
  switch (node.kind) {
    case "literal":
      return [node.value];
    case "class":
      return node.members.slice();
    case "optional":
      return dedupe(["", ...expand(node.inner)]);
    case "repeat": {
      const inner = expand(node.inner);
      return dedupe(node.allowEmpty ? ["", ...inner] : inner);
    }
    case "alt": {
      const out: string[] = [];
      for (const option of node.options) {
        out.push(...expand(option));
      }
      return dedupe(out);
    }
    case "seq": {
      let acc: string[] = [""];
      for (const item of node.items) {
        const next = expand(item);
        const combined: string[] = [];
        for (const prefix of acc) {
          for (const suffix of next) {
            combined.push(prefix + suffix);
            if (combined.length > EXPANSION_CAP) {
              throw new Error("expansion cap exceeded");
            }
          }
        }
        acc = dedupe(combined);
      }
      return acc;
    }
  }
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function probesFor(rule: ExtractedRule): string[] {
  const out: string[] = [];
  for (const source of rule.regexes) {
    for (const probe of expand(parseRegex(source))) {
      const trimmed = probe.trim();
      if (trimmed.length > 0) {
        out.push(trimmed);
      }
    }
  }
  return dedupe(out).sort();
}

/** Does the rule's own regex set actually match this probe? */
function ruleMatches(rule: ExtractedRule, probe: string): boolean {
  return rule.regexes.some((source) => new RegExp(source).test(probe));
}

// ───────────────────────────────────────────────────────────────────────────────
// 3. The §12.11 acceptance set.
// ───────────────────────────────────────────────────────────────────────────────

interface SpecRow {
  row: number;
  /** `quoted` = the spec's own sentence. `described_row_instantiated` = ours. */
  kind: "quoted" | "described_row_instantiated";
  /** The spec's cell text, verbatim, for the described rows. */
  specCell: string;
  question: string;
  paraphrases: string[];
}

const SPEC_ROWS: SpecRow[] = [
  {
    row: 1,
    kind: "quoted",
    specCell: '"What are we buying under this agreement?"',
    question: "What are we buying under this agreement?",
    paraphrases: [
      "What scope does this agreement actually cover?",
      "Tell me what is in scope and what is excluded here.",
    ],
  },
  {
    row: 2,
    kind: "quoted",
    specCell: '"Why do you say support should be 15%?"',
    question: "Why do you say support should be 15%?",
    paraphrases: [
      "Where does the 15% support figure come from?",
      "What backs the 15% support target?",
    ],
  },
  {
    row: 3,
    kind: "quoted",
    specCell: '"Are we paying too much?"',
    question: "Are we paying too much?",
    paraphrases: [
      "Is this contract overpriced?",
      "Are our fees out of line for what we use?",
    ],
  },
  {
    row: 4,
    kind: "quoted",
    specCell: '"Have we actually paid $1.89M?"',
    question: "Have we actually paid $1.89M?",
    paraphrases: [
      "Did we really pay 1.89 million on this?",
      "What has actually been billed and settled here?",
    ],
  },
  {
    row: 5,
    kind: "quoted",
    specCell: '"How much commitment is unused?"',
    question: "How much commitment is unused?",
    paraphrases: [
      "What portion of the commitment is still unconsumed?",
      "How much headroom is left before forfeiture?",
    ],
  },
  {
    row: 6,
    kind: "quoted",
    specCell: '"Can we exit at the next anniversary?"',
    question: "Can we exit at the next anniversary?",
    paraphrases: [
      "Are we able to terminate at the next anniversary date?",
      "What are our exit rights at the anniversary?",
    ],
  },
  {
    row: 7,
    kind: "quoted",
    specCell: '"Did we really have four tickets last quarter?"',
    question: "Did we really have four tickets last quarter?",
    paraphrases: [
      "Was the ticket volume last quarter really four?",
      "Recount the support tickets for last quarter.",
    ],
  },
  {
    row: 8,
    kind: "quoted",
    specCell: '"How much SLA credit have we earned?"',
    question: "How much SLA credit have we earned?",
    paraphrases: [
      "What SLA credits are we owed so far?",
      "How much service credit has accrued to date?",
    ],
  },
  {
    row: 9,
    kind: "quoted",
    specCell: '"What would $950K and 15% mean?"',
    question: "What would $950K and 15% mean?",
    paraphrases: [
      "Model this at 950K with 15% support.",
      "If we landed 950K and 15%, what changes?",
    ],
  },
  {
    row: 10,
    kind: "quoted",
    specCell: '"Can we add all the opportunities?"',
    question: "Can we add all the opportunities?",
    paraphrases: [
      "Can the opportunities simply be summed?",
      "Is it valid to total every opportunity together?",
    ],
  },
  {
    row: 11,
    kind: "quoted",
    specCell: '"Where did the 40% threshold come from?"',
    question: "Where did the 40% threshold come from?",
    paraphrases: [
      "What is the origin of the 40% threshold rule?",
      "Who set the 40% threshold and on what basis?",
    ],
  },
  {
    row: 12,
    kind: "described_row_instantiated",
    specCell:
      "Ask about another named contract while Databricks is open",
    question: "What is the term length on the ServiceNow agreement?",
    paraphrases: [
      "Switch to the ServiceNow contract and tell me its renewal date.",
      "Answer this about ServiceNow instead, not the contract on screen.",
    ],
  },
  {
    row: 13,
    kind: "described_row_instantiated",
    specCell:
      "A factual question outside the insight catalog but present in the agreement",
    question: "Which entity is named as the contracting party?",
    paraphrases: [
      "What governing law does the agreement specify?",
      "What notice address is written into the agreement?",
    ],
  },
  {
    row: 14,
    kind: "described_row_instantiated",
    specCell: "A question about a register-only contract",
    question: "What are the payment terms on the Cotiviti contract?",
    paraphrases: [
      "Summarise the Inovalon agreement for me.",
      "What do we know about the NCQA HEDIS contract?",
    ],
  },
  {
    row: 15,
    kind: "described_row_instantiated",
    specCell: "Same question from portfolio and Contract 360",
    question: "What is the total annual value of this contract?",
    paraphrases: [
      "What does this contract cost us each year?",
      "State the annual contract value.",
    ],
  },
  {
    row: 16,
    kind: "described_row_instantiated",
    specCell: "Same question after a signed amendment takes effect",
    question: "What are the current pricing terms after the amendment?",
    paraphrases: [
      "Which terms apply now that the amendment is signed?",
      "Do the amended rates supersede the original schedule?",
    ],
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// 4. Build the measurement.
// ───────────────────────────────────────────────────────────────────────────────

interface ShadowedPair {
  shadowerIndex: number;
  shadower: string;
  shadowedIndex: number;
  shadowed: string;
  probeCount: number;
  sampleProbes: string[];
}

interface Measurement {
  item: string;
  generatedBy: string;
  subject: {
    file: string;
    ruleCount: number;
    regexLiteralCount: number;
    /** Rule ids in declaration order — a reorder changes this file. */
    ruleOrder: string[];
  };
  modeUnion: {
    declared: string[];
    declaredCount: number;
    ruleReachable: string[];
    fallbackOnly: string[];
  };
  rules: Array<{
    index: number;
    id: string;
    mode: string;
    regexes: string[];
    probeCount: number;
    ownProbesShadowed: number;
  }>;
  shadowing: {
    orderedPairsPossible: number;
    shadowedPairCount: number;
    shadowedPairs: ShadowedPair[];
    totalProbes: number;
    totalShadowedProbes: number;
  };
  specAcceptance: {
    source: string;
    rowCount: number;
    quotedRows: number;
    describedRowsInstantiated: number;
    totalQuestionsRun: number;
    fallbackCount: number;
    nonFallbackCount: number;
    modeHistogram: Record<string, number>;
    questions: Array<{
      row: number;
      kind: SpecRow["kind"];
      variant: "spec_question" | "authored_paraphrase";
      question: string;
      mode: string;
      matchedRule: string;
      isFallback: boolean;
    }>;
  };
}

function buildMeasurement(): Measurement {
  const { rules, regexLiteralsInTable } = extractRules();
  const declaredModes = extractModeUnion();
  const ruleReachable = Array.from(new Set(rules.map((rule) => rule.mode)));
  const fallbackOnly = declaredModes.filter(
    (mode) => !ruleReachable.includes(mode),
  );

  const probesByRule = new Map<string, string[]>();
  for (const rule of rules) {
    probesByRule.set(rule.id, probesFor(rule));
  }

  const pairCounts = new Map<string, { pair: ShadowedPair; probes: string[] }>();
  const shadowedPerRule = new Map<string, number>();
  let totalProbes = 0;
  let totalShadowedProbes = 0;

  for (const rule of rules) {
    const probes = probesByRule.get(rule.id) ?? [];
    totalProbes += probes.length;
    let shadowedHere = 0;
    for (const probe of probes) {
      const result = classifySourceAnswerMode({ question: probe });
      if (result.matchedRule === rule.id) {
        continue;
      }
      shadowedHere += 1;
      totalShadowedProbes += 1;
      const shadower = rules.find((other) => other.id === result.matchedRule);
      if (!shadower) {
        throw new Error(
          `probe "${probe}" from ${rule.id} resolved to unknown rule ${result.matchedRule}`,
        );
      }
      const key = `${shadower.id}<-${rule.id}`;
      const existing = pairCounts.get(key);
      if (existing) {
        existing.probes.push(probe);
      } else {
        pairCounts.set(key, {
          pair: {
            shadowerIndex: shadower.index,
            shadower: shadower.id,
            shadowedIndex: rule.index,
            shadowed: rule.id,
            probeCount: 0,
            sampleProbes: [],
          },
          probes: [probe],
        });
      }
    }
    shadowedPerRule.set(rule.id, shadowedHere);
  }

  const shadowedPairs = Array.from(pairCounts.values())
    .map(({ pair, probes }) => ({
      ...pair,
      probeCount: probes.length,
      sampleProbes: probes.slice().sort().slice(0, 3),
    }))
    .sort((a, b) =>
      a.shadowedIndex === b.shadowedIndex
        ? a.shadowerIndex - b.shadowerIndex
        : a.shadowedIndex - b.shadowedIndex,
    );

  const questions: Measurement["specAcceptance"]["questions"] = [];
  const modeHistogram: Record<string, number> = {};
  for (const row of SPEC_ROWS) {
    const variants: Array<{
      variant: "spec_question" | "authored_paraphrase";
      text: string;
    }> = [
      { variant: "spec_question", text: row.question },
      ...row.paraphrases.map((text) => ({
        variant: "authored_paraphrase" as const,
        text,
      })),
    ];
    for (const { variant, text } of variants) {
      const result = classifySourceAnswerMode({ question: text });
      questions.push({
        row: row.row,
        kind: row.kind,
        variant,
        question: text,
        mode: result.mode,
        matchedRule: result.matchedRule,
        isFallback: result.isFallback,
      });
      modeHistogram[result.mode] = (modeHistogram[result.mode] ?? 0) + 1;
    }
  }

  return {
    item: "C-403",
    generatedBy: "src/__tests__/behaviors/c403-answer-mode-routing.test.ts",
    subject: {
      file: SUBJECT_REL,
      ruleCount: rules.length,
      regexLiteralCount: regexLiteralsInTable,
      ruleOrder: rules.map((rule) => rule.id),
    },
    modeUnion: {
      declared: declaredModes,
      declaredCount: declaredModes.length,
      ruleReachable: ruleReachable.slice().sort(),
      fallbackOnly,
    },
    rules: rules.map((rule) => ({
      index: rule.index,
      id: rule.id,
      mode: rule.mode,
      regexes: rule.regexes,
      probeCount: (probesByRule.get(rule.id) ?? []).length,
      ownProbesShadowed: shadowedPerRule.get(rule.id) ?? 0,
    })),
    shadowing: {
      orderedPairsPossible: (rules.length * (rules.length - 1)) / 2,
      shadowedPairCount: shadowedPairs.length,
      shadowedPairs,
      totalProbes,
      totalShadowedProbes,
    },
    specAcceptance: {
      source: "SPEC_lever_basis_provenance.md §12.11",
      rowCount: SPEC_ROWS.length,
      quotedRows: SPEC_ROWS.filter((row) => row.kind === "quoted").length,
      describedRowsInstantiated: SPEC_ROWS.filter(
        (row) => row.kind === "described_row_instantiated",
      ).length,
      totalQuestionsRun: questions.length,
      fallbackCount: questions.filter((entry) => entry.isFallback).length,
      nonFallbackCount: questions.filter((entry) => !entry.isFallback).length,
      modeHistogram,
      questions,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// 5. The suite.
// ───────────────────────────────────────────────────────────────────────────────

const measurement = buildMeasurement();

if (UPDATE) {
  fs.writeFileSync(
    RECORD_PATH,
    `${JSON.stringify(measurement, null, 2)}\n`,
    "utf8",
  );
}

describe("C-403 — the suite runs where a CI job already looks", () => {
  it("sits inside the directory `npm run test:behaviors` names", () => {
    const relative = path
      .relative(REPO_ROOT, __filename)
      .split(path.sep)
      .join("/");
    expect(relative.startsWith("src/__tests__/behaviors/")).toBe(true);

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(packageJson.scripts["test:behaviors"]).toContain(
      "src/__tests__/behaviors",
    );
  });
});

describe("C-403 — the probe generator is not the thing under test", () => {
  it("expands every rule's own alternations into at least one probe", () => {
    const { rules } = extractRules();
    for (const rule of rules) {
      expect({ id: rule.id, probes: probesFor(rule).length }).toEqual({
        id: rule.id,
        probes: expect.any(Number),
      });
      expect(probesFor(rule).length).toBeGreaterThan(0);
    }
  });

  it("generates only probes the originating rule's own regex matches", () => {
    const { rules } = extractRules();
    const unmatched: Array<{ id: string; probe: string }> = [];
    for (const rule of rules) {
      for (const probe of probesFor(rule)) {
        if (!ruleMatches(rule, probe)) {
          unmatched.push({ id: rule.id, probe });
        }
      }
    }
    // A probe its own rule does not match is a generator defect, and would make
    // every shadowing verdict below meaningless.
    expect(unmatched).toEqual([]);
  });
});

describe("C-403 (1) — `general_advisory` is reachable only by fallback", () => {
  it("is the only declared mode no rule emits", () => {
    // Asserted by exhausting the union, not by naming the two return sites.
    const declared = new Set(measurement.modeUnion.declared);
    const reachable = new Set(measurement.modeUnion.ruleReachable);
    const unreachable = [...declared].filter((mode) => !reachable.has(mode));
    expect(unreachable).toEqual(["general_advisory"]);
    expect(measurement.modeUnion.fallbackOnly).toEqual(["general_advisory"]);
    for (const mode of reachable) {
      expect(declared.has(mode as SourceAnswerMode)).toBe(true);
    }
  });

  it("never returns `general_advisory` with `isFallback: false`", () => {
    const corpus: string[] = [
      "",
      "   ",
      ...measurement.specAcceptance.questions.map((entry) => entry.question),
    ];
    for (const rule of extractRules().rules) {
      corpus.push(...probesFor(rule));
    }
    const offenders = corpus
      .map((question) => ({
        question,
        ...classifySourceAnswerMode({ question }),
      }))
      .filter((entry) => entry.mode === "general_advisory" && !entry.isFallback);
    expect(offenders).toEqual([]);
  });

  it("marks both `general_advisory` return sites as fallback", () => {
    expect(classifySourceAnswerMode({ question: "" })).toEqual({
      mode: "general_advisory",
      matchedRule: "empty_question",
      isFallback: true,
    });
    const noMatch = classifySourceAnswerMode({
      question: "zzzz qqqq no rule in this table matches this string",
    });
    expect(noMatch).toEqual({
      mode: "general_advisory",
      matchedRule: "no_match",
      isFallback: true,
    });
  });
});

describe("C-403 (2) — first-match shadowing, measured on the rules' own words", () => {
  it("only ever loses a probe to an EARLIER rule", () => {
    for (const pair of measurement.shadowing.shadowedPairs) {
      expect(pair.shadowerIndex).toBeLessThan(pair.shadowedIndex);
    }
  });

  it("matches the committed pair list exactly", () => {
    const committed = readCommitted();
    expect(measurement.shadowing.shadowedPairs).toEqual(
      committed.shadowing.shadowedPairs,
    );
    expect(measurement.shadowing.shadowedPairCount).toBe(
      committed.shadowing.shadowedPairCount,
    );
  });
});

describe("C-403 (3) — the §12.11 acceptance set, as a number", () => {
  it("runs all 16 rows and labels the 5 the spec describes rather than quotes", () => {
    expect(measurement.specAcceptance.rowCount).toBe(16);
    expect(measurement.specAcceptance.quotedRows).toBe(11);
    expect(measurement.specAcceptance.describedRowsInstantiated).toBe(5);
    expect(measurement.specAcceptance.totalQuestionsRun).toBe(48);
  });

  it("matches the committed per-question routing exactly", () => {
    const committed = readCommitted();
    expect(measurement.specAcceptance.questions).toEqual(
      committed.specAcceptance.questions,
    );
    expect(measurement.specAcceptance.fallbackCount).toBe(
      committed.specAcceptance.fallbackCount,
    );
  });
});

describe("C-403 — the committed record is the whole measurement", () => {
  it("equals what this suite recomputes", () => {
    expect(measurement).toEqual(readCommitted());
  });

  it("pins rule order and regex text, so a reorder or edit fails here", () => {
    const committed = readCommitted();
    expect(measurement.subject.ruleOrder).toEqual(committed.subject.ruleOrder);
    expect(measurement.rules.map((rule) => rule.regexes)).toEqual(
      committed.rules.map((rule) => rule.regexes),
    );
    expect(measurement.subject.ruleCount).toBe(19);
  });
});

describe("C-403 — the two callers, and what each one keeps", () => {
  const nonTestCallers = (): string[] => {
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "__tests__" || entry.name === "node_modules") {
            continue;
          }
          walk(full);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        const relative = path.relative(REPO_ROOT, full).split(path.sep).join("/");
        if (relative === SUBJECT_REL) continue;
        if (/\.test\.tsx?$/.test(entry.name)) continue;
        const text = fs.readFileSync(full, "utf8");
        if (text.includes("classifySourceAnswerMode(")) {
          hits.push(relative);
        }
      }
    };
    walk(path.join(REPO_ROOT, "src"));
    return hits.sort();
  };

  it("finds exactly two non-test call sites, not one", () => {
    // The filing says one. Correcting it here, from the tree's own bytes.
    expect(nonTestCallers()).toEqual([ROUTE_CALLER_REL, PACKET_CALLER_REL].sort());
  });

  it("the chat route keeps only `.mode` — this is the defect the item names", () => {
    const text = fs.readFileSync(path.join(REPO_ROOT, ROUTE_CALLER_REL), "utf8");
    expect(text).toContain("sourceAvaAnswerMode = modeClassification.mode;");
    expect(text).not.toContain("modeClassification.matchedRule");
    expect(text).not.toContain("modeClassification.isFallback");
  });

  it("the module-expert packet keeps BOTH fields and shows the rule to the model", () => {
    const text = fs.readFileSync(path.join(REPO_ROOT, PACKET_CALLER_REL), "utf8");
    expect(text).toContain("matchedRule: classification.matchedRule");
    expect(text).toContain("isFallbackMode: classification.isFallback");
    expect(text).toContain("`Answer mode: ${mode} (${packet.matchedRule})`");
  });
});

function readCommitted(): Measurement {
  return JSON.parse(fs.readFileSync(RECORD_PATH, "utf8")) as Measurement;
}
