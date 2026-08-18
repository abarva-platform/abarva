#!/usr/bin/env npx tsx
/**
 * Home's orientation pack: deterministic aggregate, bounded narrative, stored with its provenance.
 *
 * The question this answers is the one a new executive actually has. Someone joins as CIO or strategy
 * lead, is told "Nexus has our context loaded, go and learn who we are", and needs — in this order —
 * how the organization is arranged, what the strategy is, what is measured and how, what is run, what
 * the people here think, and where they stand. Home today answers roughly one of those.
 *
 * Two decisions shape this file, and both are about where the model sits.
 *
 * **The aggregate is computed, the sentence is generated.** Every figure in every block comes from a
 * SQL-equivalent aggregation over canonical. Claude receives that aggregate and writes prose about
 * it. It never sees the corpus, so it cannot generalise past the evidence, and it never produces a
 * number, so a figure on screen is always traceable to a row.
 *
 * **The pack is stored, not rendered live.** Generating at request time would cost seconds of
 * latency, drift between Home, Intelligence and aVa as each generated its own wording, and — the part
 * that actually matters — put text in front of a client that no human had read. `home_knowledge_packs`
 * already carries `status`, `validation_status`, `approved_by` and `claude_prompt_hash`: it was
 * designed for generated-and-reviewed content, and this uses that design rather than working around
 * it. Regeneration is keyed on a content hash of the aggregate, so identical data produces identical
 * words and the page stops rewording itself on every refresh.
 *
 * Usage:
 *   npx tsx scripts/data-build/build-home-orientation-pack.ts [--tenant <key>]... [--out-dir <dir>]
 *
 * Dry-run by default. Writes only with HOME_PACK_WRITE=true and HOME_PACK_WRITE_APPROVED=true.
 * Narrative generation additionally requires ANTHROPIC_API_KEY; without it the pack is still built
 * and stored with its structured facts and no prose, which is a usable degraded state rather than a
 * failure.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import { LANDSCAPE_DIMENSIONS } from "./landscape-dimensions";

const args = (name: string): string[] => {
  const out: string[] = [];
  process.argv.forEach((a, i) => { if (a === `--${name}`) out.push(process.argv[i + 1]); });
  return out;
};
const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const TENANTS = args("tenant").length ? args("tenant") : ["meridian-health", "skyharbor-air"];
const OUT_DIR = arg("out-dir") ?? "/tmp/home-orientation-pack";
const BUILD_VERSION = process.env.HOME_PACK_BUILD_VERSION ?? arg("build-version") ?? "local";
const WRITE = process.env.HOME_PACK_WRITE === "true" && process.env.HOME_PACK_WRITE_APPROVED === "true";

const GENERATOR_VERSION = "home-orientation-pack/v1";
const PROMPT_VERSION = "home-orientation/v1";
const ARTIFACT_TYPE = "NexusHomeOrientationPackV1";
const CLAUDE_MODEL = "claude-sonnet-5";

type Value = { value?: unknown } | undefined;

/**
 * Read an attribute as text.
 *
 * Multi-value attributes arrive as arrays, not delimited strings. An earlier version of this only
 * accepted `typeof raw === "string"`, and every array-valued attribute silently returned null — which
 * is how a pack built from a client with six declared strategic priorities, six customer segments,
 * five operating regions and eleven named leaders reported "Stated priorities: not supplied" and
 * described the organization entirely through its application estate.
 *
 * The tech dimensions survived that bug because they are row-per-thing: 503 applications are 503
 * records with scalar attributes. The business is described in a single record whose interesting
 * fields are all lists. So a defect that only dropped arrays read, on screen, as a company that is
 * nothing but its IT.
 */
const str = (v: Value): string | null => {
  const raw = v?.value;
  if (Array.isArray(raw)) {
    const parts = raw.map((x) => String(x ?? "").trim()).filter(Boolean);
    return parts.length ? parts.join("; ") : null;
  }
  if (typeof raw === "number") return Number.isFinite(raw) ? String(raw) : null;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
};

/**
 * Read a metric value as a measurement.
 *
 * `numeric()` deliberately refuses anything with characters left over, which is right for money and
 * counts and wrong here: metric sheets are written by people, and a target arrives as "76.9% by
 * MY2028" — a quantity, a unit and a period in one cell. Refusing that made every metric on both
 * tenants incomparable and the standing block reported nothing.
 *
 * So this takes the leading quantity and reports the notation alongside it, rather than discarding
 * the row or quietly normalising it. Notation drift within one metric — a baseline written "69.1%"
 * against an actual written "71.8" — is real and is surfaced as a finding, not smoothed over.
 */
function measurement(v: Value): { quantity: number; notation: "percent" | "bare" } | null {
  const raw = v?.value;
  if (typeof raw === "number") return Number.isFinite(raw) ? { quantity: raw, notation: "bare" } : null;
  if (typeof raw !== "string") return null;
  const match = raw.trim().match(/^-?[\d,]+(?:\.\d+)?/);
  if (!match) return null;
  const quantity = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(quantity)) return null;
  const rest = raw.trim().slice(match[0].length);
  return { quantity, notation: rest.trimStart().startsWith("%") ? "percent" : "bare" };
}

/** Read an attribute as a list, preserving the items rather than flattening them into a sentence. */
const list = (v: Value): string[] => {
  const raw = v?.value;
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? "").trim()).filter(Boolean);
  const single = str(v);
  return single ? [single] : [];
};
/**
 * Parse a value as a number only when it genuinely is one.
 *
 * The obvious implementation — strip everything that is not a digit and parse what remains — turns a
 * hex source fingerprint into a forty-digit integer and a sentence containing "2019" into 2019. Both
 * happened: the first profiling run reported a sum of applications' `sourceFingerprint` in the
 * undecillions and summed a free-text volumetric narrative to 84 trillion.
 *
 * So this strips only the notation a human puts around a number — currency, thousands separators,
 * percent, whitespace — and refuses anything with alphabetic characters left over.
 */
const numeric = (v: Value): number | null => {
  const raw = v?.value;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/[$,\s%]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};
const hash = (parts: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex");
const usd = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString()}`;

/** One orientation block: what it asserts, and the facts it may assert from. */
interface Block {
  id: string;
  heading: string;
  /** The question a new executive is asking when they read this block. */
  question: string;
  /** Deterministic. Every value here came from an aggregation, never from a model. */
  facts: Array<{ label: string; value: string; detail?: string }>;
  /** Named entities the narrative is permitted to mention. */
  entities: string[];
  /** Generated. Null when no key was available or validation rejected it. */
  narrative: string | null;
  narrativeRejectedBecause?: string;
}

/**
 * Build the deterministic aggregate — the whole factual content of the pack.
 *
 * Ordered as a new executive would ask, and the order is the point. An earlier version opened with
 * the application estate and closed by benchmarking technology spend as a share of revenue, which
 * described a $81.4B airline as though it were an IT department with some planes attached. That was
 * partly a bug (every array-valued business attribute was being dropped) and partly this: the
 * canonical model holds 503 application records and exactly one record describing the business, so
 * ranking anything by volume buries the company under its own tooling.
 *
 * Volume is therefore not what decides prominence here. The single enterprise-profile record leads,
 * the estate is one section of seven, and metrics are grouped by whether they measure the business or
 * the technology — because on both tenants most of them measure the business, and presenting airline
 * on-time performance as an IT benefits claim gets the subject of the sentence wrong.
 */
function buildBlocks(
  tenantKey: string,
  records: Array<{ objectType: string; attributes: Record<string, Value> }>,
): Block[] {
  const of = (t: string) => records.filter((r) => r.objectType === t);
  const names = (t: string, attr: string) => [
    ...new Set(of(t).map((r) => str(r.attributes[attr])).filter((v): v is string => Boolean(v))),
  ];
  const sum = (t: string, attr: string) =>
    of(t).reduce((n, r) => n + (numeric(r.attributes[attr]) ?? 0), 0);

  const profile = of("tenant_profile")[0]?.attributes ?? {};
  const revenue = numeric(profile.revenueUsd);
  const employees = numeric(profile.employeeCount);
  const priorities = list(profile.strategicPriorities);
  const segmentsServed = list(profile.customerSegments);
  const regions = list(profile.operatingRegions);
  const leaders = list(profile.leadershipTeam);

  const functions = of("business_function");
  const segments = [
    ...new Set(functions.map((f) => str(f.attributes.businessSegment)).filter(Boolean)),
  ] as string[];
  const offices = functions.reduce<Record<string, number>>((acc, f) => {
    const lens = str(f.attributes.officeLensAbarva) ?? "unclassified";
    acc[lens] = (acc[lens] ?? 0) + 1;
    return acc;
  }, {});

  // Metrics carry a declared domain. Grouping on it separates "how is the business performing" from
  // "how is the technology performing" — two questions with different audiences that were previously
  // answered as one list.
  const metrics = of("metric_outcome");
  const TECH_DOMAINS = /^(technology|cyber|data_|integration|ai_|platform)/i;
  const techMetrics = metrics.filter((m) => TECH_DOMAINS.test(str(m.attributes.metricDomain) ?? ""));
  const bizMetrics = metrics.filter((m) => !TECH_DOMAINS.test(str(m.attributes.metricDomain) ?? ""));
  const domainCounts = metrics.reduce<Record<string, number>>((acc, m) => {
    const d = str(m.attributes.metricDomain) ?? "unclassified";
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d, c]) => `${d} ${c}`)
    .join(" · ");
  const withActual = metrics.filter((m) => numeric(m.attributes.actualValue) !== null);

  /**
   * Has a metric moved toward its target?
   *
   * The intake captures baseline, target and actual, but never which direction counts as good — and
   * it differs per metric: on-time performance should rise, mishandled baggage rate should fall.
   * Comparing actual against target without that would call roughly half of them backwards.
   *
   * It does not need to be captured, because it is implied: the client put the target somewhere
   * relative to the baseline, and that placement *is* the declared direction. So improvement is
   * movement whose sign matches the sign of (target − baseline). No new column, no assumption.
   *
   * Metrics whose three values are not all numeric are excluded and counted separately rather than
   * defaulted either way.
   */
  const trend = metrics.reduce(
    (acc, m) => {
      const base = measurement(m.attributes.baselineValue);
      const target = measurement(m.attributes.targetValue);
      const actual = measurement(m.attributes.actualValue);
      if (!base || !target || !actual || target.quantity === base.quantity) {
        acc.notComparable += 1;
        return acc;
      }
      if (new Set([base.notation, target.notation, actual.notation]).size > 1) {
        acc.notationDrift += 1;
      }
      const intended = Math.sign(target.quantity - base.quantity);
      const moved = Math.sign(actual.quantity - base.quantity);
      if (moved === 0) acc.flat += 1;
      else if (moved === intended) acc.improving += 1;
      else acc.worsening += 1;
      return acc;
    },
    { improving: 0, worsening: 0, flat: 0, notComparable: 0, notationDrift: 0 },
  );
  const comparable = trend.improving + trend.worsening + trend.flat;
  const claimable = metrics.filter((m) => str(m.attributes.claimReadiness) === "claimable");
  const notReady = metrics.filter((m) => str(m.attributes.claimReadiness) === "not_ready");

  const apps = of("application_system");
  const replaceable = apps.filter((a) => str(a.attributes.replacementCandidate) === "yes");
  const replaceableCost = replaceable.reduce((n, a) => n + (numeric(a.attributes.annualCostUsd) ?? 0), 0);

  const interviews = of("ai_value_interview_evidence");
  const interviewed = new Set(interviews.map((i) => str(i.attributes.stakeholderRole)).filter(Boolean));
  const themeLeaders = new Map<string, Set<string>>();
  for (const row of interviews) {
    const theme = str(row.attributes.themeTags);
    const role = str(row.attributes.stakeholderRole);
    if (!theme || !role) continue;
    if (!themeLeaders.has(theme)) themeLeaders.set(theme, new Set());
    themeLeaders.get(theme)!.add(role);
  }
  const rankedThemes = [...themeLeaders.entries()].sort((a, b) => b[1].size - a[1].size);
  const contradictions = interviews.filter(
    (i) => (str(i.attributes.contradictsRecord) ?? "").startsWith("yes"),
  ).length;

  const itSpend = sum("spend_value_fact", "annualSpendUsd");
  const vendorBook = sum("vendor_contract", "annualSpendUsd");
  const evidenced = records.filter((r) => str(r.attributes.sourceFile)).length;

  return [
    {
      id: "identity",
      heading: "Who this organization is",
      question: "What business are we actually in?",
      facts: [
        { label: "Business model", value: str(profile.businessModel) ?? "Not supplied" },
        { label: "Industry", value: [str(profile.industry), str(profile.subIndustry)].filter(Boolean).join(" — ") || "Not supplied" },
        { label: "Revenue", value: revenue ? usd(revenue) : "Not supplied" },
        { label: "People", value: employees ? employees.toLocaleString() : "Not supplied" },
        { label: "Headquarters", value: str(profile.headquarters) ?? "Not supplied" },
        { label: "Where we operate", value: regions.join("; ") || "Not supplied", detail: `${regions.length} declared regions` },
        { label: "Who we serve", value: segmentsServed.join("; ") || "Not supplied", detail: `${segmentsServed.length} declared customer segments` },
      ],
      entities: [str(profile.entityName), ...segmentsServed, ...regions].filter((v): v is string => Boolean(v)),
      narrative: null,
    },
    {
      id: "strategy",
      heading: "What this organization is trying to do",
      question: "What is our strategy, and what is funded against it?",
      facts: [
        { label: "Mission", value: str(profile.mission) ?? "Not supplied" },
        {
          label: "Stated priorities",
          value: priorities.length ? priorities.join(" · ") : "Not supplied",
          detail: `${priorities.length} declared by the client`,
        },
        { label: "Programmes in flight", value: String(of("program_initiative").length) },
        { label: "Programme budget", value: usd(sum("program_initiative", "budgetUsd")) },
        {
          label: "Expected value",
          value: usd(sum("program_initiative", "expectedValueUsd")),
          detail: "declared by the client, not independently verified",
        },
      ],
      entities: priorities.concat(names("program_initiative", "programName").slice(0, 8)),
      narrative: null,
    },
    {
      id: "organization",
      heading: "How the organization is arranged",
      question: "How are we organised, and who owns what?",
      facts: [
        { label: "Operating segments", value: String(segments.length), detail: segments.join(" · ") },
        { label: "Business functions", value: String(functions.length) },
        { label: "Organizational units", value: String(of("org_owner").length) },
        { label: "Leadership team", value: leaders.join(" · ") || "Not supplied", detail: `${leaders.length} declared roles` },
        {
          label: "Function mix",
          value: Object.entries(offices).map(([k, v]) => `${v} ${k}`).join(" · "),
          detail: "front / middle / back is an AbarVa analytical lens, not the client's own classification",
        },
      ],
      entities: segments.concat(leaders, names("business_function", "functionName").slice(0, 6)),
      narrative: null,
    },
    {
      id: "measurement",
      heading: "How performance is measured",
      question: "What KPIs matter, and can we prove movement on them?",
      facts: [
        {
          label: "Business and operating metrics",
          value: String(bizMetrics.length),
          detail: names("metric_outcome", "metricName").slice(0, 4).join(" · "),
        },
        { label: "Technology metrics", value: String(techMetrics.length) },
        { label: "By domain", value: topDomains || "Not classified" },
        { label: "Measured since baseline", value: `${withActual.length} of ${metrics.length}` },
        {
          label: "Value claimable today",
          value: `${claimable.length} claimable · ${notReady.length} blocked`,
          detail: "readiness is the client's own assessment, and applies to value claims — not to whether the metric itself is tracked",
        },
      ],
      entities: names("metric_outcome", "metricName").slice(0, 8),
      narrative: null,
    },
    {
      id: "estate",
      heading: "What is actually run",
      question: "What systems and platforms do we have?",
      facts: [
        { label: "Applications", value: String(apps.length) },
        { label: "Infrastructure platforms", value: String(of("infrastructure_platform").length) },
        { label: "Data assets and integrations", value: String(of("data_asset_or_integration").length) },
        { label: "Technology budget", value: usd(itSpend), detail: revenue ? `${((itSpend / revenue) * 100).toFixed(2)}% of revenue` : undefined },
        { label: "Third-party contracted", value: usd(vendorBook), detail: itSpend ? `${((vendorBook / itSpend) * 100).toFixed(0)}% of technology spend` : undefined },
      ],
      entities: names("application_system", "systemName").slice(0, 8),
      narrative: null,
    },
    {
      id: "voice",
      heading: "What the people here say",
      question: "What do leaders actually think is going on?",
      facts: [
        { label: "Leaders interviewed", value: String(interviewed.size) },
        { label: "Responses captured", value: String(interviews.length) },
        {
          label: "Most widely raised",
          value: rankedThemes[0] ? `${rankedThemes[0][0]} — ${rankedThemes[0][1].size} leaders` : "None",
        },
        {
          label: "Raised by one leader only",
          value: String(rankedThemes.filter(([, s]) => s.size === 1).length),
          detail: "a single credible voice nobody else can see",
        },
        {
          label: "Contradicting the system record",
          value: String(contradictions),
          detail: "where what leaders believe and what the data shows disagree",
        },
      ],
      entities: rankedThemes.slice(0, 6).map(([t]) => t),
      narrative: null,
    },
    {
      id: "standing",
      heading: "Where this organization stands",
      question: "How do we compare — to our own targets, and to the industry?",
      facts: [
        {
          label: "Moving toward target",
          value: comparable
            ? `${trend.improving} of ${comparable} comparable metrics`
            : "No metric has a comparable baseline, target and actual",
          detail: "direction of good is inferred from where the client placed the target relative to the baseline",
        },
        {
          label: "Moving away from target",
          value: String(trend.worsening),
          detail: trend.flat ? `${trend.flat} unchanged since baseline` : undefined,
        },
        {
          label: "Not comparable",
          value: String(trend.notComparable),
          detail: "missing a baseline, target or actual, so no direction can be established",
        },
        {
          label: "Inconsistent notation",
          value: String(trend.notationDrift),
          detail: "baseline, target and actual written in different notation on the same metric — a data-quality defect in the source sheet, not a measurement",
        },
        {
          label: "Measured since baseline",
          value: `${withActual.filter((m) => !TECH_DOMAINS.test(str(m.attributes.metricDomain) ?? "")).length} of ${bizMetrics.length} business · ` +
            `${withActual.filter((m) => TECH_DOMAINS.test(str(m.attributes.metricDomain) ?? "")).length} of ${techMetrics.length} technology`,
        },
        {
          label: "Technology spend against industry",
          value: revenue ? `${((itSpend / revenue) * 100).toFixed(2)}% of revenue` : "Revenue not supplied",
          detail: "published bands: airlines ~4%, health providers 5–8%, payers 3–5%",
        },
        {
          label: "Estate rationalisation candidates",
          value: `${replaceable.length} applications`,
          detail: usd(replaceableCost),
        },
        {
          label: "Evidence coverage",
          value: `${evidenced.toLocaleString()} of ${records.length.toLocaleString()} records carry a source`,
        },
      ],
      entities: [],
      narrative: null,
    },
  ];
}

/* ------------------------------------------------------------------------------------------------
 * Dimension profiling
 *
 * The orientation blocks above answer six executive questions. They are not the whole picture: the
 * canonical model carries twenty-six dimensions, and a reader who opens Applications or Vendors or
 * Risks deserves the same treatment — a statement of what is actually in there, derived from the
 * rows rather than written once and left to rot.
 *
 * Writing twenty-six bespoke aggregators would guarantee that the six someone cared about were good
 * and the other twenty were stubs. So this profiles *generically*: for any canonical object type it
 * derives shape (how many, how many distinct), concentration (does the top item dominate),
 * distribution across the categorical attributes that exist, magnitude across the numeric ones, and
 * completeness (which attributes are mostly empty). Every one of those is computable without knowing
 * what the dimension means, which is exactly why it works on all twenty-six and will work on the
 * twenty-seventh.
 *
 * The profile is the ceiling on what may be said about a dimension. Claude gets the profile and
 * nothing else.
 * ---------------------------------------------------------------------------------------------- */

interface CategoryBreakdown {
  attribute: string;
  distinctValues: number;
  /** Descending by count. Truncated — the tail is summarised, not dropped silently. */
  top: Array<{ value: string; count: number; share: number }>;
  tailCount: number;
  /** Share held by the single largest value. High concentration is usually the story. */
  topShare: number;
}

interface NumericBreakdown {
  attribute: string;
  populated: number;
  sum: number;
  min: number;
  median: number;
  max: number;
  /** Share of the total held by the largest ten rows. */
  topTenShare: number;
}

interface DimensionProfile {
  key: string;
  objectType: string;
  label: string;
  recordCount: number;
  distinctNameCount: number;
  /** Records carrying a source file reference. */
  evidencedCount: number;
  sampleEntities: string[];
  categories: CategoryBreakdown[];
  numerics: NumericBreakdown[];
  /** Attributes present on the type but empty on most rows. Absence is a finding. */
  sparseAttributes: Array<{ attribute: string; populatedShare: number }>;
  /** Largest rows by the dominant money attribute, named. */
  notable: Array<{ name: string; attribute: string; value: number }>;
  insight: string | null;
  insightRejectedBecause?: string;
}

/** Values that carry no information and would otherwise dominate every breakdown. */
const NULLISH = new Set(["", "n/a", "na", "none", "null", "unknown", "not supplied", "tbd", "-"]);

/** Attributes that are identifiers or free text — never useful as a category. */
const NOT_CATEGORICAL =
  /(id|_id|Id|uuid|key|name|description|notes?|comment|summary|narrative|url|link|file|hash|fingerprint|date|timestamp|createdAt|updatedAt)$/i;

/**
 * Pipeline provenance, not client content.
 *
 * These attributes describe how a row got here — which intake packet, which loader, what the
 * adapter's confidence was. They are legitimately on every record and they are uniformly valued,
 * which is exactly why they crowd out the fields a reader cares about: ranked by distribution,
 * "originalPacket: universal-standard-v3, 100%" beats "lifecycle status" every time and says nothing.
 *
 * Excluded from profiling, not from the record. The provenance still travels with the data; it just
 * does not get narrated as though it were a fact about the client's organization.
 */
const PROVENANCE_ATTRIBUTES = new Set([
  "originalPacket",
  "originalRowId",
  "originalRowNumber",
  "sourceClassification",
  "sourceFingerprint",
  "sourceFile",
  "sourceSheet",
  "confidence",
  "inheritedLineOfBusiness",
  "inheritedSegmentHops",
  "ingestBuildVersion",
  "adapterVersion",
  "knownGaps",
  "sourcePath",
  "sourceRowNumber",
  "consolidationRuleUsed",
  "sourceMentions",
  "sourcePaths",
]);

function profileDimension(
  key: string,
  objectType: string,
  label: string,
  nameAttribute: string,
  records: Array<{ attributes: Record<string, Value> }>,
): DimensionProfile {
  const n = records.length;
  const attributeNames = [...new Set(records.flatMap((r) => Object.keys(r.attributes)))];

  const names = records.map((r) => str(r.attributes[nameAttribute])).filter((v): v is string => Boolean(v));
  const distinctNames = new Set(names);

  const categories: CategoryBreakdown[] = [];
  const numerics: NumericBreakdown[] = [];
  const sparse: Array<{ attribute: string; populatedShare: number }> = [];

  for (const attr of attributeNames) {
    if (PROVENANCE_ATTRIBUTES.has(attr)) continue;
    const raw = records.map((r) => r.attributes[attr]);
    const strings = raw
      .map((v) => str(v))
      .filter((v): v is string => Boolean(v) && !NULLISH.has(v!.toLowerCase()));
    const nums = raw.map((v) => numeric(v)).filter((v): v is number => v !== null && v !== 0);

    // Populated means "has a value", whichever type it is. Counting only the string-typed values
    // reported `annualCostUsd` as 0% populated on the same dimension where it summed to $1.5B —
    // a contradiction on one screen, and the kind a reader notices immediately.
    const populated = records.filter((r) => {
      const v = r.attributes[attr]?.value;
      if (typeof v === "number") return Number.isFinite(v);
      const t = typeof v === "string" ? v.trim().toLowerCase() : "";
      return t.length > 0 && !NULLISH.has(t);
    }).length;
    const populatedShare = n > 0 ? populated / n : 0;
    if (n >= 10 && populatedShare < 0.25 && attr !== nameAttribute) {
      sparse.push({ attribute: attr, populatedShare: Number(populatedShare.toFixed(3)) });
    }

    // Numeric: worth summarising only when nearly every populated value is genuinely a number.
    // The 0.9 threshold is deliberate — a field where a tenth of the values are prose is prose.
    if (nums.length >= 3 && nums.length >= strings.length * 0.9) {
      const sorted = [...nums].sort((a, b) => a - b);
      const total = sorted.reduce((s, v) => s + v, 0);
      const topTen = [...sorted].reverse().slice(0, 10).reduce((s, v) => s + v, 0);
      if (total > 0 && sorted[0] !== sorted[sorted.length - 1]) {
        numerics.push({
          attribute: attr,
          populated: nums.length,
          sum: total,
          min: sorted[0],
          median: sorted[Math.floor(sorted.length / 2)],
          max: sorted[sorted.length - 1],
          topTenShare: topTen / total,
        });
      }
      continue;
    }

    if (NOT_CATEGORICAL.test(attr) || strings.length < 3) continue;

    const counts = new Map<string, number>();
    for (const v of strings) counts.set(v, (counts.get(v) ?? 0) + 1);
    // A field where nearly every row differs is free text wearing a category's clothes.
    if (counts.size > Math.max(12, strings.length * 0.5)) continue;

    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = ordered.slice(0, 6).map(([value, count]) => ({
      value,
      count,
      share: count / strings.length,
    }));
    categories.push({
      attribute: attr,
      distinctValues: counts.size,
      top,
      tailCount: Math.max(0, counts.size - top.length),
      topShare: ordered.length ? ordered[0][1] / strings.length : 0,
    });
  }

  // Rank categories by how much they actually say. A field where one value holds 98% is either the
  // most important fact about the dimension or a data-quality defect; either way it should surface.
  categories.sort((a, b) => Math.abs(b.topShare - 0.5) - Math.abs(a.topShare - 0.5));
  numerics.sort((a, b) => b.sum - a.sum);

  const dominantMoney = numerics.find((x) =>
    /usd|cost|spend|budget|amount|price|annualValue|contractValue/i.test(x.attribute),
  );
  const notable = dominantMoney
    ? records
        .map((r) => ({
          name: str(r.attributes[nameAttribute]) ?? "(unnamed)",
          attribute: dominantMoney.attribute,
          value: numeric(r.attributes[dominantMoney.attribute]) ?? 0,
        }))
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : [];

  return {
    key,
    objectType,
    label,
    recordCount: n,
    distinctNameCount: distinctNames.size,
    evidencedCount: records.filter((r) => str(r.attributes.sourceFile)).length,
    sampleEntities: [...distinctNames].slice(0, 8),
    categories: categories.slice(0, 5),
    numerics: numerics.slice(0, 4),
    sparseAttributes: sparse.slice(0, 6),
    notable,
    insight: null,
  };
}

/* ------------------------------------------------------------------------------------------------
 * Generation and the validation gate
 * ---------------------------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You write short factual summaries for an enterprise data platform.

You are given a JSON aggregate computed from a client's own records. Write prose that helps a new
executive understand what the aggregate shows.

Absolute rules — output violating any of these is discarded:
1. Every number you write must appear in the aggregate. Never compute, round, estimate, or infer a
   number. If you want to express a proportion, use one already present.
2. Every organization, system, vendor, programme, metric or person you name must appear in the
   aggregate. Never name anything else — no industry examples, no comparable companies, no vendors
   you happen to know.
3. Never state a cause, a risk, a recommendation, or a prediction. Describe what the data shows and
   what it does not show. "Forty percent of applications have no owner recorded" is allowed.
   "This creates governance risk" is not.
4. If the aggregate is thin, say so plainly and stop. A short honest summary beats a padded one.
5. No preamble, no headings, no bullet points, no markdown. Plain sentences only.
6. Always write numbers as digits. Never spell one out ("26", not "twenty-six").
7. When a field ending in "Percent" is present, quote it exactly as given. Never compute your own
   percentage or round a raw fraction yourself.
8. When you name a programme, priority, metric or role drawn from the aggregate, quote it exactly
   as it appears there. Do not abbreviate, compress, or drop a word from it -- "Medicare Advantage
   overall Star Rating" must not become "Medicare Advantage Star Rating".`;

/**
 * Numbers that need no evidence: small counting words and years read as prose, not as claims.
 *
 * The allowance is narrow on purpose. An earlier version accepted any value up to twelve, which let
 * "$6.8M per application" through — a fabricated unit cost, wearing the shape of a small ordinal.
 * So a number only qualifies when it is a bare whole number written without currency, percentage or
 * magnitude: "three of the four" is prose, "6.8" attached to a dollar sign is a claim.
 */
export function isFreeNumber(token: string, following = ""): boolean {
  if (/[$%]/.test(token)) return false;
  if (/^\s*(m|bn?|k|million|billion|thousand|trillion)\b/i.test(following)) return false;
  const bare = token.replace(/[,]/g, "");
  if (!/^\d+$/.test(bare)) return false;
  const n = Number(bare);
  return n <= 12 || (n >= 1900 && n <= 2100);
}

/**
 * The gate.
 *
 * A generated sentence is only worth storing if every factual token in it traces to the aggregate it
 * was given. This checks both directions of the failure mode that matters: numbers the model produced
 * rather than quoted, and entities it knew about rather than read.
 *
 * It is deliberately strict and deliberately dumb. A clever validator that "understands" a rephrasing
 * is a validator that can be talked around. When this rejects good prose, the cost is a block that
 * shows its facts without narration — which is the state Home is in today and is survivable. When a
 * loose validator accepts bad prose, the cost is a fabricated number in front of a client.
 */
/**
 * Remove the thousands-separator commas from a string, without touching any other comma.
 *
 * Applied to both sides of every numeric comparison. The first real run of this gate against real
 * data rejected "68,000" — a figure copied verbatim from the aggregate's own "People" fact — because
 * the candidate token had its commas stripped before comparison and the haystack never did. The
 * aggregate contained "68,000"; the search term was "68000"; neither side was wrong, the comparison
 * was. Every comma-formatted fact value (population counts, evidence-coverage counts) failed
 * identically. This was a defect in the gate, not evidence of fabrication, and it silently withheld
 * real, correct narration.
 */
function stripThousandsCommas(value: string): string {
  let previous: string;
  let current = value;
  do {
    previous = current;
    current = current.replace(/(\d),(\d{3})/g, "$1$2");
  } while (current !== previous);
  return current;
}

export function validateNarrative(
  text: string,
  aggregate: unknown,
  allowedEntities: string[],
): { ok: true } | { ok: false; reason: string } {
  const haystack = stripThousandsCommas(JSON.stringify(aggregate).toLowerCase());

  // Numbers. Compare on digits so "1,204" in prose matches 1204 in JSON, and percentages match a
  // stored share of 0.42 written as 42%.
  //
  // The decimal group only consumes a "." when at least one digit follows it. The live run found
  // the bug in the obvious way: a figure at the end of a sentence -- "...totalling $482,030,000."
  // -- had the sentence-ending period swallowed into the token, because the old pattern's `\.?\d*`
  // allowed a bare trailing dot with zero digits after it. The aggregate held "482030000"; the
  // search term became "482030000." with a dot nothing could strip.
  const numberPattern = /\$?\d[\d,]*(?:\.\d+)?%?/g;
  for (const match of text.matchAll(numberPattern)) {
    const token = match[0];
    const following = text.slice(match.index + token.length, match.index + token.length + 12);
    const bare = token.replace(/[,%]/g, "");
    if (isFreeNumber(token, following)) continue;
    const digits = bare.replace(/[$,]/g, "");
    const asShare = token.includes("%") ? (Number(digits) / 100).toString() : null;
    const candidates = [digits, digits.replace(/\.0+$/, ""), asShare, asShare?.slice(0, 6)].filter(
      (c): c is string => Boolean(c),
    );
    if (!candidates.some((c) => haystack.includes(c.toLowerCase()))) {
      return { ok: false, reason: `number not in aggregate: ${token}` };
    }
  }

  // Entities. Capitalised multi-word runs are the shape of a proper noun; each must be quotable.
  //
  // The interior character class no longer allows a bare period. It used to, so a real entity
  // could carry an abbreviation like "U.S." -- but the same allowance let the match run straight
  // through a sentence-ending period into the next sentence's capitalised opener: "...across
  // Illinois, Indiana and Wisconsin. Revenue splits..." was captured as one candidate,
  // "Wisconsin. Revenue", which is not an entity at all and could never be found anywhere. Losing
  // embedded abbreviation periods is the acceptable side of that trade; gluing two sentences
  // together was not.
  const allowed = allowedEntities.map((e) => e.toLowerCase());
  for (const match of text.matchAll(/\b[A-Z][A-Za-z0-9&'-]+(?:\s+[A-Z][A-Za-z0-9&'-]+)*/g)) {
    const raw = match[0];
    if (raw.length < 6) continue;
    // Strip the grammatical scaffolding around a candidate before judging its core token.
    // "The Enterprise profile shows..." glues the sentence-initial "The" onto the next
    // capitalised word into one candidate, "The Enterprise" -- and "The Enterprise" is not an
    // entity anyone supplied, even though "Enterprise" is the client's own dimension label sitting
    // right there in the aggregate. Every one of these was a real, grounded reference wearing a
    // determiner it never needed checked. Stripping "The"/"This"/"A"/etc. from the front, the same
    // way a trailing possessive is already stripped, does not weaken what the check requires of
    // the word underneath it -- "Northgate" in "The Northgate deal" still has to be found.
    const determinerMatch = raw.match(/^(The|This|These|Those|A|An|Our|Their|Its)\s+/);
    const candidate = raw
      .replace(/^(The|This|These|Those|A|An|Our|Their|Its)\s+/, "")
      .replace(/[''`]s$/, "");
    const lower = candidate.toLowerCase();
    if (haystack.includes(lower)) continue;
    if (allowed.some((e) => e.includes(lower) || lower.includes(e))) continue;
    // A single capitalised word opening a sentence is ordinary English grammar, not a claim about
    // an entity -- "However, spend rose" and "Progress has been steady" capitalise "However" and
    // "Progress" for no reason connected to the aggregate. A hardcoded list of exempt words chases
    // the model's vocabulary forever; checking the actual grammatical position does not. Multi-word
    // phrases at a sentence's start are still checked, because a real name can legitimately open a
    // sentence.
    //
    // The exemption must not fire when a determiner was stripped off the front. "However" is
    // capitalised by nothing but its position; "Northgate" in "The Northgate deal" is capitalised
    // because it is a name, and the "The" in front of it says nothing about whether the name
    // underneath is real. Letting the strip feed the exemption would have quietly reopened the
    // exact hole the possessive- and determiner-stripping was built to close.
    const precedingText = text.slice(0, match.index).replace(/\s+$/, "");
    const atSentenceStart = precedingText === "" || /[.!?]$/.test(precedingText);
    if (atSentenceStart && !determinerMatch && !candidate.includes(" ")) continue;
    return { ok: false, reason: `entity not in aggregate: ${candidate}` };
  }

  if (/\b(should|must|recommend|we suggest|risk of|likely to|could lead|indicates that|suggests that)\b/i.test(text)) {
    return { ok: false, reason: "narrative asserts judgement or causation" };
  }

  // A narrative that describes its own input rather than the client's business. Found live: a
  // dimension with an empty category/numeric breakdown produced "The Enterprise profile aggregate
  // contains a single record... with no categories, numerics, sparse attributes, or notable
  // entries populated" -- fully grounded (no invented number, no invented name) and completely
  // wrong to show a reader, because it narrates this file's own field names back as if they were
  // a fact about the company. Grounding was never the problem here; every one of these checks
  // grounding. This is the one check in the gate that is not about truth, it is about audience --
  // an executive reading Home does not know or care what an "aggregate" or a "sparse attribute" is,
  // and a sentence that uses those words was written for a developer, not for them.
  if (/\b(aggregate|the json|sparse attribute|notable entr|the data (provided|shown|given)|this dataset|data structure)\b/i.test(text)) {
    return { ok: false, reason: "narrative describes its own input rather than the client's business" };
  }
  return { ok: true };
}

interface GenerationOutcome {
  text: string | null;
  rejectedBecause?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

async function generate(
  client: { messages: { create: (p: Record<string, unknown>) => Promise<unknown> } } | null,
  instruction: string,
  aggregate: unknown,
  allowedEntities: string[],
): Promise<GenerationOutcome> {
  const empty: GenerationOutcome = { text: null, model: "none", inputTokens: 0, outputTokens: 0 };
  if (!client) return { ...empty, rejectedBecause: "no ANTHROPIC_API_KEY in this environment" };

  const response = (await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${instruction}\n\nAggregate:\n${JSON.stringify(aggregate, null, 2)}`,
      },
    ],
  })) as {
    model: string;
    usage?: { input_tokens?: number; output_tokens?: number };
    content: Array<{ type: string; text?: string }>;
  };

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();

  const usage = {
    model: response.model,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  };
  if (!text) return { text: null, rejectedBecause: "model returned no text", ...usage };

  const verdict = validateNarrative(text, aggregate, allowedEntities);
  if (!verdict.ok) return { text: null, rejectedBecause: verdict.reason, ...usage };
  return { text, ...usage };
}

/* ------------------------------------------------------------------------------------------------
 * Build
 * ---------------------------------------------------------------------------------------------- */

interface RenderPack {
  packKind: "orientation";
  tenantKey: string;
  buildVersion: string;
  generatedAt: string;
  /** The six-question executive arc. */
  blocks: Block[];
  /** One profile per populated canonical dimension. */
  dimensions: DimensionProfile[];
  coverage: {
    dimensionsPopulated: number;
    dimensionsTotal: number;
    recordsProfiled: number;
    narrativesGenerated: number;
    narrativesRejected: number;
  };
}

async function buildTenant(
  tenantKey: string,
  client: Parameters<typeof generate>[0],
): Promise<{ pack: RenderPack; issues: string[]; usage: { input: number; output: number } }> {
  const report = await buildCanonicalTenantDataReport({
    repoRoot: process.cwd(),
    tenantKeys: [tenantKey],
  });
  const records = report.canonicalRecords.filter((r) => r.tenantKey === tenantKey) as Array<{
    objectType: string;
    attributes: Record<string, Value>;
  }>;
  if (records.length === 0) throw new Error(`no canonical records for ${tenantKey}`);

  const blocks = buildBlocks(tenantKey, records);
  const profiles: DimensionProfile[] = [];
  for (const dim of LANDSCAPE_DIMENSIONS) {
    const rows = records.filter((r) => r.objectType === dim.objectType);
    if (rows.length === 0) continue;
    profiles.push(profileDimension(dim.key, dim.objectType, dim.label, dim.nameAttribute, rows));
  }

  const issues: string[] = [];
  const usage = { input: 0, output: 0 };

  for (const block of blocks) {
    const aggregate = { heading: block.heading, question: block.question, facts: block.facts };
    const out = await generate(
      client,
      `Answer this question in two to four sentences for someone who has just joined this organization: "${block.question}"`,
      aggregate,
      block.entities,
    );
    usage.input += out.inputTokens;
    usage.output += out.outputTokens;
    block.narrative = out.text;
    if (out.rejectedBecause) {
      block.narrativeRejectedBecause = out.rejectedBecause;
      issues.push(`block:${block.id} — ${out.rejectedBecause}`);
    }
  }

  for (const profile of profiles) {
    // A dimension with nothing to profile gets no narration attempt.
    //
    // "Enterprise profile" is exactly one record, every tenant, always -- the profiler requires at
    // least three populated values before it will compute a category or a numeric summary, so for
    // this dimension categories, numerics, sparseAttributes and notable are permanently empty. Asked
    // to "describe the shape, any concentration, and what is missing" of an object whose only content
    // is four empty arrays, a literal-minded model does exactly that: it describes the shape of the
    // empty arrays, using their own field names as vocabulary because those names are the only
    // labels in what it was handed. The result reads back this file's own TypeScript interface --
    // "the aggregate contains... with no categories, numerics, sparse attributes, or notable entries
    // populated" -- as though it were a sentence about a company. It is fully grounded (no invented
    // number, no invented name) and completely useless, because grounding was never the problem.
    //
    // The header already shows the record count and the sample name. A sentence about the absence of
    // fields adds nothing a reader doesn't already see, so the fix is not a better prompt for
    // describing nothing -- it is not asking for a sentence about nothing at all.
    if (
      profile.categories.length === 0 &&
      profile.numerics.length === 0 &&
      profile.sparseAttributes.length === 0 &&
      profile.notable.length === 0
    ) {
      profile.insight = null;
      profile.insightRejectedBecause = "aggregate too thin to narrate -- no categories, quantities or notable entries beyond the record count";
      issues.push(`dimension:${profile.key} — ${profile.insightRejectedBecause}`);
      continue;
    }

    // Send the profile minus the fields the model must not narrate from, and with every share
    // pre-rounded and pre-formatted as a percentage string.
    //
    // The stored profile carries raw fractions -- 0.6283185840707965 -- because that is what a
    // consumer computing further from it needs. A model asked to narrate that number does what any
    // person would: it rounds to "62.8%". The unrounded float can never appear verbatim in prose, so
    // every dimension with a concentration or coverage figure failed validation on the first real
    // run, not because the figure was wrong but because the aggregate never contained a quotable
    // form of it. Rounding here, once, and handing the model the same string a human would write,
    // removes the mismatch instead of loosening what counts as a match.
    const { insight: _i, insightRejectedBecause: _r, ...rest } = profile;
    const aggregate = {
      ...rest,
      categories: rest.categories.map((category) => ({
        ...category,
        topSharePercent: `${(category.topShare * 100).toFixed(1)}%`,
        top: category.top.map((entry) => ({
          ...entry,
          sharePercent: `${(entry.share * 100).toFixed(1)}%`,
        })),
      })),
      numerics: rest.numerics.map((numeric) => ({
        ...numeric,
        sum: Math.round(numeric.sum),
        min: Math.round(numeric.min),
        median: Math.round(numeric.median),
        max: Math.round(numeric.max),
        topTenSharePercent: `${(numeric.topTenShare * 100).toFixed(1)}%`,
      })),
      sparseAttributes: rest.sparseAttributes.map((sparse) => ({
        ...sparse,
        populatedSharePercent: `${(sparse.populatedShare * 100).toFixed(1)}%`,
      })),
    };
    const out = await generate(
      client,
      `In two or three sentences, describe what this client's "${profile.label}" data actually shows -- ` +
        `its shape, any concentration, and what is missing. Do not evaluate it. Quote the *Percent ` +
        `fields exactly as given rather than rounding a raw share yourself.`,
      aggregate,
      profile.sampleEntities.concat(profile.notable.map((x) => x.name)),
    );
    usage.input += out.inputTokens;
    usage.output += out.outputTokens;
    profile.insight = out.text;
    if (out.rejectedBecause) {
      profile.insightRejectedBecause = out.rejectedBecause;
      issues.push(`dimension:${profile.key} — ${out.rejectedBecause}`);
    }
  }

  const generated =
    blocks.filter((b) => b.narrative).length + profiles.filter((p) => p.insight).length;
  const attempted = blocks.length + profiles.length;

  return {
    pack: {
      packKind: "orientation",
      tenantKey,
      buildVersion: BUILD_VERSION,
      generatedAt: new Date().toISOString(),
      blocks,
      dimensions: profiles,
      coverage: {
        dimensionsPopulated: profiles.length,
        dimensionsTotal: LANDSCAPE_DIMENSIONS.length,
        recordsProfiled: records.length,
        narrativesGenerated: generated,
        narrativesRejected: attempted - generated,
      },
    },
    issues,
    usage,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  let client: Parameters<typeof generate>[0] = null;
  if (hasKey) {
    const { getAnthropicDirectClient } = await import(
      "../../src/lib/integrations/ai-egress/anthropic-direct"
    );
    client = getAnthropicDirectClient({ workload: "home_orientation_pack" }) as never;
  } else {
    console.log("! ANTHROPIC_API_KEY absent — building structured facts with no narrative\n");
  }

  const summaries: Array<Record<string, unknown>> = [];

  for (const tenantKey of TENANTS) {
    console.log(`\n=== ${tenantKey} ===`);
    const { pack, issues, usage } = await buildTenant(tenantKey, client);

    // Regeneration is keyed on the facts, never on the prose. Identical data must produce an
    // identical hash so a nightly run does not rewrite the page with differently-worded sentences.
    const factsOnly = {
      blocks: pack.blocks.map((b) => ({ id: b.id, facts: b.facts })),
      dimensions: pack.dimensions.map(({ insight: _i, insightRejectedBecause: _r, ...rest }) => rest),
    };
    const contentHash = hash(factsOnly);

    const generatedShare =
      pack.coverage.narrativesGenerated /
      Math.max(1, pack.coverage.narrativesGenerated + pack.coverage.narrativesRejected);
    // A pack whose prose was mostly rejected is still publishable — the facts stand on their own —
    // but it must not pass silently, because a rejection rate that high means the prompt or the
    // validator is wrong and someone needs to look.
    const validationStatus = !hasKey
      ? "warn"
      : generatedShare >= 0.9
        ? "pass"
        : generatedShare >= 0.6
          ? "warn"
          : "fail";

    const packFile = path.join(OUT_DIR, `${tenantKey}-orientation-pack.json`);
    fs.writeFileSync(packFile, JSON.stringify(pack, null, 2));

    console.log(
      `  ${pack.coverage.recordsProfiled.toLocaleString()} records · ` +
        `${pack.coverage.dimensionsPopulated}/${pack.coverage.dimensionsTotal} dimensions profiled`,
    );
    console.log(
      `  narrative ${pack.coverage.narrativesGenerated} generated, ` +
        `${pack.coverage.narrativesRejected} rejected → validation ${validationStatus}`,
    );
    if (usage.output) console.log(`  tokens in ${usage.input} / out ${usage.output}`);
    for (const issue of issues.slice(0, 8)) console.log(`    - ${issue}`);
    if (issues.length > 8) console.log(`    - ...${issues.length - 8} more`);
    console.log(`  → ${packFile}`);

    summaries.push({
      tenantKey,
      contentHash,
      validationStatus,
      qualityScore: Number(generatedShare.toFixed(4)),
      coverage: pack.coverage,
      issues,
    });

    if (!WRITE) continue;

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      await db.query("BEGIN");
      const existing = await db.query<{ content_hash: string }>(
        `SELECT content_hash FROM public.home_knowledge_packs
          WHERE tenant_key = $1 AND artifact_type = $2 AND status <> 'retired'
          ORDER BY created_at DESC LIMIT 1`,
        [tenantKey, ARTIFACT_TYPE],
      );
      if (existing.rows[0]?.content_hash === contentHash) {
        console.log("  = unchanged since last build, not rewritten");
        await db.query("ROLLBACK");
        continue;
      }

      // Supersede rather than delete. The previous pack is what a client may have been reading, and
      // an approval history that vanishes on every refresh is not an approval history.
      await db.query(
        `UPDATE public.home_knowledge_packs
            SET status = 'retired', effective_to = now(), updated_at = now()
          WHERE tenant_key = $1 AND artifact_type = $2 AND status <> 'retired'`,
        [tenantKey, ARTIFACT_TYPE],
      );

      const inserted = await db.query<{ id: string }>(
        `INSERT INTO public.home_knowledge_packs (
           tenant_key, tenant_name, pack_version, status, artifact_type,
           source_pack_hash, source_dataset_version, source_context,
           generator_version, generated_by, generated_model,
           claude_model, claude_prompt_version, claude_prompt_hash,
           content_hash, render_pack, quality_score, quality_report,
           validation_status, validation_issues, effective_from
         ) VALUES ($1,$2,$3,'candidate',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now())
         RETURNING id`,
        [
          tenantKey,
          tenantKey,
          `${ARTIFACT_TYPE}:${BUILD_VERSION}:${contentHash.slice(0, 12)}`,
          ARTIFACT_TYPE,
          contentHash,
          BUILD_VERSION,
          JSON.stringify({ tenantKey, buildVersion: BUILD_VERSION, dimensions: pack.dimensions.length }),
          GENERATOR_VERSION,
          "build-home-orientation-pack",
          hasKey ? CLAUDE_MODEL : null,
          hasKey ? CLAUDE_MODEL : null,
          PROMPT_VERSION,
          hash(SYSTEM_PROMPT),
          contentHash,
          JSON.stringify(pack),
          Number(generatedShare.toFixed(4)),
          JSON.stringify({ coverage: pack.coverage, rejected: issues.length }),
          validationStatus,
          JSON.stringify(issues),
        ],
      );

      // Read back inside the transaction. A write that reports success and lands nothing is the
      // failure this codebase has hit most often; the only defence is asking the database.
      const readback = await db.query<{ blocks: number; dims: number; vs: string }>(
        `SELECT jsonb_array_length(render_pack->'blocks') AS blocks,
                jsonb_array_length(render_pack->'dimensions') AS dims,
                validation_status AS vs
           FROM public.home_knowledge_packs WHERE id = $1`,
        [inserted.rows[0].id],
      );
      const row = readback.rows[0];
      if (!row || Number(row.blocks) !== pack.blocks.length || Number(row.dims) !== pack.dimensions.length) {
        throw new Error(
          `readback mismatch: stored ${row?.blocks}/${row?.dims}, built ${pack.blocks.length}/${pack.dimensions.length}`,
        );
      }
      await db.query("COMMIT");
      console.log(`  ✓ stored ${inserted.rows[0].id} (${row.blocks} blocks, ${row.dims} dimensions, ${row.vs})`);
    } catch (error) {
      await db.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      await db.end();
    }
  }

  const summaryFile = path.join(OUT_DIR, "summary.json");
  fs.writeFileSync(summaryFile, JSON.stringify({ buildVersion: BUILD_VERSION, wrote: WRITE, summaries }, null, 2));
  console.log(`\n${WRITE ? "WROTE" : "DRY RUN"} · summary → ${summaryFile}`);
}

// Only run when invoked directly. Importing this module — from a test, or from another build —
// must not execute a build; that side effect is precisely what forced the dimension registry out
// into its own file.
if (process.argv[1] && process.argv[1].includes("build-home-orientation-pack")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
