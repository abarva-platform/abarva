/**
 * Intake-family coverage for the enterprise signal packet.
 *
 * The question this answers is "did every input workbook actually reach Claude", and the reason it
 * exists is that the obvious ways of answering it are all wrong in the same way.
 *
 * `00_enterprise_profile.csv` loaded, parsed, and appeared in the packet's `sourceSummaries` for
 * the entire time the Home executive story was opening on a cross-domain operating-risk sentence
 * instead of who the enterprise is. A file-level coverage check would have reported 100%. What had
 * actually happened is that the packet builder hard-coded `enterpriseIdentity`, `businessEconomics`
 * and `strategicPriorities` to null/empty before assembling anything, so the writer never saw the
 * industry, the revenue, the business model or a single declared priority.
 *
 * So there are two distinct states this module keeps apart:
 *
 *   SUMMARIZED  the packet tells Claude the file exists, its domain, and its row count
 *   FACTS       the packet carries something from inside the file that a claim could rest on
 *
 * A summary is a description of a file, not its contents. "00_enterprise_profile.csv, 1 record,
 * domain enterprise_profile" does not tell a model that revenue is $25B. Only the second state is
 * evidence, and only the second state is what "provided to Claude as input context" can honestly
 * mean.
 *
 * Absence is allowed. Silent absence is not: a family is either contributing or declared absent
 * with a reason and an owner, and anything else fails.
 */

/* ------------------------------------------------------------------------------------------------
 * Declared families -- from the template manifest, never a hand-typed list
 * ---------------------------------------------------------------------------------------------- */

export interface TemplateManifest {
  templates: Array<{ file: string; required?: boolean }>;
}

export interface IntakeFamily {
  /** Canonical manifest filename, e.g. "00_enterprise_profile.csv". */
  file: string;
  /** Numeric family prefix, e.g. "00". Matching is by prefix so a tenant that names its own file
   * slightly differently is still recognised as the same family rather than reported missing. */
  index: string;
  required: boolean;
}

export function declaredIntakeFamilies(manifest: TemplateManifest): IntakeFamily[] {
  return manifest.templates.map((template) => {
    const match = /^(\d+)_/.exec(template.file);
    if (!match) {
      throw new Error(`template manifest entry ${template.file} does not start with a family index`);
    }
    return { file: template.file, index: match[1], required: template.required !== false };
  });
}

/* ------------------------------------------------------------------------------------------------
 * Fact bindings
 *
 * A family's facts are considered present if EITHER a structured packet field it owns carries
 * content, OR at least one signal/context item declares a domain that this family's own source
 * summary declares. The second path is deliberately derived from the packet's own declarations
 * rather than a hand-maintained family-to-domain table -- the summary declares the file's domain,
 * the signal declares its domains, and the join is on what they each declared.
 * ---------------------------------------------------------------------------------------------- */

/** Structured packet fields a family owns outright. Absent from this map means the family is
 * evidenced only through signals/context, which is normal for the row-shaped workbooks. */
export const FAMILY_FACT_PATHS: Record<string, string[]> = {
  "00": [
    "enterpriseIdentity.industry",
    "enterpriseIdentity.businessModel",
    "enterpriseIdentity.revenue",
    "enterpriseIdentity.employeeCount",
    "businessEconomics.operatingSegments",
    "businessEconomics.customerSegments",
    "strategicPriorities",
  ],
};

/**
 * Family -> canonical dimension key, as carried in `coverageManifest.dimensionCoverage`.
 *
 * Declared here rather than derived from a filename or a directory, for the same reason tenancy is:
 * a mapping that is inferred is a mapping nobody has to keep true. The two packet builders in this
 * repo do not agree on shape -- the chapters packet emits `sourceSummaries` keyed by source path,
 * the ECL packet emits `coverageManifest.dimensionCoverage` keyed by dimension -- so coverage has
 * to be answerable from either, and this is the join. A family missing from this map can still be
 * matched through `sourceSummaries`; it simply cannot be matched through a dimension manifest.
 */
export const FAMILY_DIMENSION_KEYS: Record<string, string> = {
  "00": "tenant_profile",
  "01": "business_function",
  "02": "org_owner",
  "03": "workforce_role",
  "04": "application_system",
  "05": "data_asset_or_integration",
  "06": "infrastructure_platform",
  "07": "vendor_contract",
  "08": "spend_value_fact",
  "09": "program_initiative",
  "10": "ai_automation_use_case",
  "11": "risk_or_control",
  "12": "relationship_source_row",
  "13": "evidence_source",
  "14": "metric_outcome",
  "15": "industry_context_pattern",
  "16": "expert_lens",
  "17": "managed_service_scope",
  "18": "operational_process_evidence",
};

/** Rejects present-but-empty. `{ businessModel: null }` is a populated key and an absent fact. */
export function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some((entry) => isNonEmpty(entry));
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(isNonEmpty);
  return true;
}

function readPath(root: unknown, dottedPath: string): unknown {
  let cursor: unknown = root;
  for (const segment of dottedPath.split(".")) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

/* ------------------------------------------------------------------------------------------------
 * Evaluation
 * ---------------------------------------------------------------------------------------------- */

export interface CoveragePacket {
  sourceSummaries?: Array<{ sourcePath: string; domain?: string; recordCount?: number }>;
  coverageManifest?: { dimensionCoverage?: Array<{ key: string; recordCount?: number; evidencedShare?: number }> };
  signals?: Array<{ domains?: string[] }>;
  contextItems?: Array<{ domains?: string[] }>;
  [key: string]: unknown;
}

export interface DeclaredAbsence {
  family: string;
  reason: string;
  owner: string;
}

export type FamilyState =
  /** Facts from inside the file reached the packet. */
  | "contributing"
  /** The file is described to Claude but nothing from inside it can be cited. This is the state
   * that was invisible: a file-level coverage report calls it covered. */
  | "summarized_only"
  /** No summary and no facts. */
  | "absent"
  /** Absent or fact-less, and someone signed for it. */
  | "declared_absent";

export interface FamilyCoverage {
  family: string;
  index: string;
  required: boolean;
  state: FamilyState;
  summarized: boolean;
  factsPresent: boolean;
  /** Which structured paths carried content, and which signal/context domains matched. */
  evidence: { factPaths: string[]; domains: string[]; recordCount: number };
  declaredAbsence?: DeclaredAbsence;
}

export interface CoverageReport {
  families: FamilyCoverage[];
  contributing: number;
  summarizedOnly: string[];
  absent: string[];
  declaredAbsent: string[];
  /** A family that is neither contributing nor signed for. Non-empty means the build must fail. */
  failures: string[];
  /** Declared absences naming a family that is in fact contributing -- a stale exception. */
  staleAbsences: string[];
}

export function evaluateIntakeFamilyCoverage(
  manifest: TemplateManifest,
  packet: CoveragePacket,
  declaredAbsences: DeclaredAbsence[] = [],
): CoverageReport {
  const families = declaredIntakeFamilies(manifest);
  const summaries = packet.sourceSummaries ?? [];
  const signalDomains = new Set(
    [...(packet.signals ?? []), ...(packet.contextItems ?? [])].flatMap((item) => item.domains ?? []),
  );
  const absenceByFamily = new Map(declaredAbsences.map((absence) => [absence.family, absence]));

  const evaluated: FamilyCoverage[] = families.map((family) => {
    const familySummaries = summaries.filter((summary) => fileNameOf(summary.sourcePath).startsWith(`${family.index}_`));
    const dimensionKey = FAMILY_DIMENSION_KEYS[family.index];
    const dimension = dimensionKey
      ? (packet.coverageManifest?.dimensionCoverage ?? []).find((entry) => entry.key === dimensionKey)
      : undefined;
    const summarized = familySummaries.length > 0 || (dimension?.recordCount ?? 0) > 0;
    const recordCount = familySummaries.reduce((sum, summary) => sum + (summary.recordCount ?? 0), 0)
      || (dimension?.recordCount ?? 0);

    const factPaths = (FAMILY_FACT_PATHS[family.index] ?? []).filter((path) => isNonEmpty(readPath(packet, path)));
    // A family's own declared domains, joined against what the signals and context items declare.
    const declaredDomains = familySummaries.length
      ? familySummaries.flatMap((summary) => splitDomains(summary.domain))
      : dimensionKey ? [dimensionKey] : [];
    const domains = [...new Set(declaredDomains)].filter((domain) => signalDomains.has(domain));
    const factsPresent = factPaths.length > 0 || domains.length > 0;

    const declaredAbsence = absenceByFamily.get(family.file);
    const state: FamilyState = factsPresent
      ? "contributing"
      : declaredAbsence
        ? "declared_absent"
        : summarized
          ? "summarized_only"
          : "absent";

    return {
      family: family.file,
      index: family.index,
      required: family.required,
      state,
      summarized,
      factsPresent,
      evidence: { factPaths, domains, recordCount },
      declaredAbsence,
    };
  });

  return {
    families: evaluated,
    contributing: evaluated.filter((entry) => entry.state === "contributing").length,
    summarizedOnly: evaluated.filter((entry) => entry.state === "summarized_only").map((entry) => entry.family),
    absent: evaluated.filter((entry) => entry.state === "absent").map((entry) => entry.family),
    declaredAbsent: evaluated.filter((entry) => entry.state === "declared_absent").map((entry) => entry.family),
    // Required and neither contributing nor signed for. Summarized-only counts as a failure on
    // purpose: it is precisely the state that used to read as covered.
    failures: evaluated
      .filter((entry) => entry.required && (entry.state === "summarized_only" || entry.state === "absent"))
      .map((entry) => entry.family),
    staleAbsences: evaluated
      .filter((entry) => entry.declaredAbsence && entry.factsPresent)
      .map((entry) => entry.family),
  };
}

function fileNameOf(sourcePath: string): string {
  return sourcePath.split("/").pop() ?? sourcePath;
}

function splitDomains(domain: string | undefined): string[] {
  return (domain ?? "").split(",").map((part) => part.trim()).filter((part) => part && part !== "domain not declared");
}

/* ------------------------------------------------------------------------------------------------
 * Reserved slots
 *
 * `buildSourceSummaries` sorts by record count descending and then caps. `00_enterprise_profile.csv`
 * is a single row, so it sorts last and is structurally the first thing dropped if that cap ever
 * tightens -- the identity of the enterprise, evicted by volume. This keeps one slot per declared
 * family before the remainder is filled by the existing ordering.
 * ---------------------------------------------------------------------------------------------- */

export function reserveOnePerFamily<T extends { sourcePath: string }>(
  summaries: T[],
  manifest: TemplateManifest,
  limit: number,
): T[] {
  if (!Number.isFinite(limit) || summaries.length <= limit) return summaries;
  const families = declaredIntakeFamilies(manifest);
  const reserved: T[] = [];
  const taken = new Set<T>();
  for (const family of families) {
    const first = summaries.find(
      (summary) => !taken.has(summary) && fileNameOf(summary.sourcePath).startsWith(`${family.index}_`),
    );
    if (first) { reserved.push(first); taken.add(first); }
  }
  const remainder = summaries.filter((summary) => !taken.has(summary));
  return [...reserved, ...remainder].slice(0, Math.max(limit, reserved.length));
}
