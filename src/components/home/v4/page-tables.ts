import { cellText } from "./cxo-language";
/**
 * Deterministic table sets and findings for the Home surfaces.
 *
 * The estate rows ship inside the bundle -- 306 applications, 72 contracts, 66 platforms, 540 data
 * assets, every column the intake declared -- so every table and every number below is computed
 * from those rows at render time. No model call, no packet claim, no generator dependency: a figure
 * here is a filter over rows the reader can open in the record browser.
 *
 * Findings are RULES, not authored sentences. Each rule computes its own number and fills a stable
 * template, so a finding cannot go stale when the record changes: it either still fires with a new
 * number, or it stops firing and the block gets shorter. That is why the block's header states a
 * count rather than the design assuming one.
 */

export interface EstateRow {
  [key: string]: string | number | boolean | null;
}

export interface TableSpec {
  /** Section label above the table. */
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  total?: Array<string | number>;
  /** One line under the table. Absence is stated here, never left to the reader. */
  note?: string;
  /**
   * The column whose numbers should carry a bar behind them.
   *
   * A count column read as three figures is three facts; read as three lengths it is one shape, at
   * no cost to the precision -- the number stays exactly where it was. Only set this where the
   * column is a count of the same thing down the rows, never where the rows measure different
   * units, because a bar implies they are comparable.
   */
  barColumn?: string;
  /**
   * Spans the full width of the table set rather than sharing a row.
   *
   * A crosstab put in a half-width cell forces a reader sideways to reach the totals column, and
   * the totals column is where the reconciliation is -- the whole reason the table is trustworthy
   * sits in the part they have to go looking for.
   */
  wide?: boolean;
  /**
   * The named part of the chapter this table belongs to.
   *
   * Eight ungrouped tables is ten screens with no landmarks: a reader cannot say where they are or
   * which table matters. Grouping is declared here, at the table, rather than inferred from the
   * estate family -- Technology & Data draws from two families and reads as four parts, and the
   * split that matters to a reader does not follow the split that matters to the loader.
   */
  section?: string;
}

export type FindingKind = "exposure" | "absence" | "established";

/**
 * Reading order for a findings block.
 *
 * A block where every finding looks equally important makes the reader do the triage. Exposure is
 * something the record says is wrong now; absence is something it cannot tell you; established is
 * something it confirms. That is descending order of what a reader has to act on, so it is the
 * order they arrive in.
 */
const FINDING_RANK: Record<FindingKind, number> = {
  exposure: 0,
  absence: 1,
  established: 2,
};

/** Sorts a findings list into reading order, keeping the original order within each kind. */
const RATED_RANK: Record<string, number> = { high: 0, moderate: 1 };

export function rankFindings(findings: Finding[]): Finding[] {
  return findings
    .map((finding, index) => ({ finding, index }))
    .sort(
      (a, b) =>
        FINDING_RANK[a.finding.kind] - FINDING_RANK[b.finding.kind] ||
        // Within a kind, the record's own rating orders the list. An unrated finding is not
        // demoted below a moderate one -- absence of a rating is not a low rating, and treating it
        // as one would let a gap in the register quietly reorder a queue a leader reads top-down.
        (RATED_RANK[a.finding.rated ?? ""] ?? 0.5) -
          (RATED_RANK[b.finding.rated ?? ""] ?? 0.5) ||
        a.index - b.index,
    )
    .map((entry) => entry.finding);
}

export interface Finding {
  kind: FindingKind;
  /**
   * The severity the record itself rates, where it rates one.
   *
   * Only set from a declared severity field, never inferred from how serious a finding sounds. It
   * is what lets a queue be ordered by the record's own judgement rather than by ours, and it is
   * the only thing red is spent on.
   */
  rated?: "high" | "moderate";
  claim: string;
  /** Display label distinguishes suggested review roles from owners or sponsors recorded on rows. */
  owner: string;
  because: string;
  /** Legacy file hint plus deterministic rule and grain. The file is not verified source lineage. */
  trace?: { file: string; grain: string; rule: string };
  /** Record family for inspection; an empty filter opens the whole family. */
  openRows?: { objectType: string; filter: string };
}

export interface PageContent {
  tables: TableSpec[];
  findings: Finding[];
}

/**
 * A view the rows could not support, named rather than left out.
 *
 * A table that cannot render because its source column is absent used to disappear silently, which
 * reads to a reader as "this enterprise has nothing here". That is the difference between a gap in
 * the record and a gap in the plumbing, and only one of them is the reader's problem. It also hid a
 * real defect for a while: the same tables rendered from one read path and vanished on another
 * because that path's mapper dropped four columns.
 */
export interface UnsupportedView {
  caption: string;
  missingColumn: string;
  why: string;
}

/* ---------------------------------------------------------------------------------------------- */

const str = (row: EstateRow, key: string): string =>
  String(row[key] ?? "").trim();
const num = (row: EstateRow, key: string): number => {
  const value = Number(String(row[key] ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? value : 0;
};

/**
 * How a money column was arrived at, read from the record rather than assumed.
 *
 * The application estate declares `annualCostBasis` on every row, and on the current record every
 * row says `synthetic_modeled` — so every cost figure the product renders is modelled, not booked.
 * A reader takes an unqualified money figure as actual spend, so the basis travels with the number
 * wherever it appears. Where a record declares several bases, that is said too: a column summing
 * modelled and actual figures together is a different kind of number again.
 */
export function costBasis(
  rows: EstateRow[],
  field = "annualCostBasis",
): string | null {
  const declared = new Set(rows.map((row) => str(row, field)).filter(Boolean));
  if (declared.size === 0) return null;
  if (declared.size > 1) {
    return `Costs mix ${declared.size} declared bases (${[...declared].map(label).join(", ")}); the column sums figures arrived at differently.`;
  }
  const only = [...declared][0];
  if (/synthetic|model/i.test(only)) {
    return `Every cost here is modelled, not booked: all ${rows.length.toLocaleString()} rows declare a cost basis of "${cellText(only)}".`;
  }
  return `Cost basis declared on all ${rows.length.toLocaleString()} rows: "${only}".`;
}

function withCostBasis(
  note: string | undefined,
  basis: string | null,
): string | undefined {
  return [note, basis].filter(Boolean).join(" ") || undefined;
}

export function usd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value > 0) return `$${Math.round(value / 1e3)}k`;
  return "—";
}

function countBy(
  rows: EstateRow[],
  key: string,
): Array<{ value: string; count: number; cost: number }> {
  const map = new Map<string, { count: number; cost: number }>();
  for (const row of rows) {
    const value = str(row, key) || "not declared";
    const entry = map.get(value) ?? { count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += num(row, "annualCostUsd");
    map.set(value, entry);
  }
  return [...map.entries()]
    .map(([value, e]) => ({ value, ...e }))
    .sort((a, b) => b.count - a.count);
}

function crossTab(
  rows: EstateRow[],
  rowKey: string,
  colKey: string,
  colOrder: string[],
) {
  const table = new Map<string, Map<string, number>>();
  const rowTotals = new Map<string, number>();
  for (const row of rows) {
    const r = str(row, rowKey) || "not declared";
    const c = str(row, colKey) || "not declared";
    if (!table.has(r)) table.set(r, new Map());
    const inner = table.get(r)!;
    inner.set(c, (inner.get(c) ?? 0) + 1);
    rowTotals.set(r, (rowTotals.get(r) ?? 0) + 1);
  }
  const ordered = [...rowTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([r]) => r);
  return { table, rowTotals, ordered, colOrder };
}

/** Title-cases a declared enum value for display without inventing a label for it. */
/** One or many, said correctly. A count reading "1 units" reads as a machine wrote the sentence. */
const plural = (count: number, one: string, many: string): string =>
  count === 1 ? one : many;

export function label(value: string): string {
  if (!value) return "not declared";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

type CrossFamilyEstate = {
  applications?: EstateRow[];
  vendors?: EstateRow[];
  infrastructure?: EstateRow[];
  data?: EstateRow[];
  risks?: EstateRow[];
  programs?: EstateRow[];
  relationships?: EstateRow[];
};

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitValues(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function containsDeclaredName(value: string, name: string): boolean {
  if (!value || !name) return false;
  const wanted = norm(name);
  return splitValues(value).some((item) => norm(item) === wanted);
}

function isHigh(value: string): boolean {
  return /^(critical|high|tier\s*1|mission critical)$/i.test(value.trim());
}

function isTruthish(value: string): boolean {
  return /^(true|yes|y|1)$/i.test(value.trim());
}

function benchmarkClauseState(row: EstateRow): "declared" | "absent" | "unknown" {
  const value = str(row, "benchmarkClause");
  if (/^yes/i.test(value) || isTruthish(value)) return "declared";
  if (/^(no|false|n|0)$/i.test(value)) return "absent";
  return "unknown";
}

type RelationshipEndpoint = {
  name: string;
  type: string;
  row?: EstateRow;
  posture:
    | "rated exposure"
    | "critical system"
    | "regulated data"
    | "program"
    | "declared only";
};

type RelationshipPath = {
  left: RelationshipEndpoint;
  verb: string;
  right: RelationshipEndpoint;
  strength: string;
  confidence: string;
  evidenceBasis: string;
  gap: string;
};

function rowName(row: EstateRow, keys: string[]): string {
  for (const key of keys) {
    const value = str(row, key);
    if (value) return value;
  }
  return "";
}

function indexRows(
  rows: EstateRow[] | undefined,
  keys: string[],
): Map<string, EstateRow> {
  const index = new Map<string, EstateRow>();
  for (const row of rows ?? []) {
    const name = rowName(row, keys);
    if (name) index.set(norm(name), row);
  }
  return index;
}

function endpointPosture(row: EstateRow | undefined, fallbackType: string) {
  if (!row) return "declared only" as const;
  if (isHigh(str(row, "severity")) || isHigh(str(row, "riskRating"))) {
    return "rated exposure" as const;
  }
  if (isHigh(str(row, "criticality"))) return "critical system" as const;
  if (isTruthish(str(row, "regulatedDataFlag")))
    return "regulated data" as const;
  if (
    /program|initiative/i.test(fallbackType) ||
    str(row, "programName") ||
    str(row, "status")
  ) {
    return "program" as const;
  }
  return "declared only" as const;
}

function relationshipEndpoint(
  name: string,
  type: string,
  indexes: ReadonlyArray<Map<string, EstateRow>>,
): RelationshipEndpoint {
  const key = norm(name);
  const row = indexes.map((index) => index.get(key)).find(Boolean);
  return {
    name,
    type,
    row,
    posture: endpointPosture(row, type),
  };
}

function relationshipPaths(estate: CrossFamilyEstate): RelationshipPath[] {
  const indexes = [
    indexRows(estate.risks, ["riskOrControlName"]),
    indexRows(estate.programs, ["programName"]),
    indexRows(estate.applications, ["systemName"]),
    indexRows(estate.vendors, ["vendorName", "contractName"]),
    indexRows(estate.data, ["dataAssetName", "sourceSystem", "targetSystem"]),
    indexRows(estate.infrastructure, ["platformName"]),
  ];
  const rows = estate.relationships ?? [];
  const paths: RelationshipPath[] = [];

  for (const edge of rows) {
    const from = str(edge, "fromObjectName");
    const to = str(edge, "toObjectName");
    const verb = str(edge, "relationshipType");
    if (!from || !to || !verb) continue;

    const left = relationshipEndpoint(
      from,
      str(edge, "fromObjectType"),
      indexes,
    );
    const right = relationshipEndpoint(to, str(edge, "toObjectType"), indexes);
    const touchesAttention =
      left.posture !== "declared only" ||
      right.posture !== "declared only" ||
      /risk|control|program|initiative|vendor|contract|application|system|data/i.test(
        `${left.type} ${right.type}`,
      );
    if (!touchesAttention) continue;

    paths.push({
      left,
      verb,
      right,
      strength: str(edge, "relationshipStrength") || "declared",
      confidence: str(edge, "confidence") || "not declared",
      evidenceBasis: str(edge, "evidenceBasis") || "relationship row",
      gap: str(edge, "knownGaps") || "No additional gap declared on the edge.",
    });
  }

  return paths
    .sort((a, b) => {
      const score = (path: RelationshipPath) =>
        [path.left, path.right].filter(
          (endpoint) => endpoint.posture !== "declared only",
        ).length;
      return (
        score(b) - score(a) ||
        a.left.name.localeCompare(b.left.name) ||
        a.right.name.localeCompare(b.right.name)
      );
    })
    .slice(0, 8);
}

export function relationshipPathTables(estate: CrossFamilyEstate): TableSpec[] {
  const paths = relationshipPaths(estate);
  if (paths.length === 0) return [];
  return [
    {
      caption: "Relationship-backed exposure paths",
      section: "Cross-family executive findings",
      columns: ["Declared path", "Why it matters", "Evidence state"],
      rows: paths.map((path) => [
        `${cellText(path.left.name)} → ${cellText(path.verb)} → ${cellText(path.right.name)}`,
        [path.left, path.right]
          .map((endpoint) =>
            endpoint.posture === "declared only"
              ? `${cellText(endpoint.name)} is relationship-declared`
              : `${cellText(endpoint.name)} is ${endpoint.posture}`,
          )
          .join("; "),
        `${cellText(path.strength)} · ${cellText(path.confidence)} · ${cellText(path.evidenceBasis)} · ${cellText(path.gap)}`,
      ]),
      note: "Built only from served relationship rows and exact endpoint matches to served estate rows. Declared-only endpoints remain labelled as declared-only rather than resolved by inference.",
      wide: true,
    },
  ];
}

function relationshipGraphFinding(estate: CrossFamilyEstate): Finding | null {
  const paths = relationshipPaths(estate);
  const material = paths.filter((path) =>
    [path.left, path.right].some(
      (endpoint) => endpoint.posture !== "declared only",
    ),
  );
  if (material.length === 0) return null;
  const declaredOnly = paths.filter(
    (path) =>
      path.left.posture === "declared only" ||
      path.right.posture === "declared only",
  ).length;
  return {
    kind: "exposure",
    claim: `${material.length} relationship-backed ${plural(material.length, "path crosses", "paths cross")} a rated exposure, critical system, regulated data asset, or program; ${declaredOnly} still carry at least one declared-only endpoint.`,
    owner: "Suggested review owner: Enterprise Architecture",
    because:
      "This is a graph-backed synthesis over served relationship rows. It keeps unresolved endpoints visible and does not create near-match relationships.",
    trace: {
      file: "12_relationships.csv + served Home estate rows",
      grain:
        "one declared relationship edge and any exact matched endpoint rows",
      rule: "relationship endpoint is declared, then exact-matched to high-risk, critical, regulated-data or program rows where possible",
    },
    openRows: {
      objectType: "relationship_edge",
      filter: material[0]?.left.name ?? "",
    },
  };
}

function riskProgramFinding(
  risks: EstateRow[],
  programs: EstateRow[],
  relationships: EstateRow[],
): Finding | null {
  const riskByName = new Map(
    risks
      .filter((row) => isHigh(str(row, "severity")))
      .map((row) => [norm(str(row, "riskOrControlName")), row]),
  );
  const programByName = new Map(
    programs.map((row) => [norm(str(row, "programName")), row]),
  );
  const joined: Array<{ risk: EstateRow; program: EstateRow }> = [];

  for (const edge of relationships) {
    const verb = str(edge, "relationshipType");
    if (!/impact|depend|remediat|mitigat|address|block/i.test(verb)) continue;
    const from = norm(str(edge, "fromObjectName"));
    const to = norm(str(edge, "toObjectName"));
    const leftRisk = riskByName.get(from);
    const rightRisk = riskByName.get(to);
    const leftProgram = programByName.get(from);
    const rightProgram = programByName.get(to);
    const risk = leftRisk ?? rightRisk;
    const program = leftProgram ?? rightProgram;
    if (!risk || !program) continue;

    const percent = num(program, "pctComplete");
    const status = str(program, "status");
    if (percent >= 80 || /complete|closed|done/i.test(status)) continue;
    joined.push({ risk, program });
  }

  if (joined.length === 0) return null;
  const first = joined[0];
  const riskName = str(first.risk, "riskOrControlName");
  const programName = str(first.program, "programName");
  const percent = num(first.program, "pctComplete");
  const progress =
    percent > 0
      ? ` and that program is ${percent}% complete`
      : str(first.program, "phase")
        ? ` and that program is in ${cellText(str(first.program, "phase"))}`
        : "";

  return {
    kind: "exposure",
    rated: "high",
    claim:
      joined.length === 1
        ? `${riskName} is a high-severity risk tied to ${programName}${progress}.`
        : `${joined.length} high-severity risks are tied to named remediation programs that are not complete.`,
    owner: str(first.risk, "controlOwner")
      ? `Recorded control owner${joined.length > 1 ? " (first matched risk)" : ""}: ${str(first.risk, "controlOwner")}`
      : str(first.program, "businessSponsor")
        ? `Recorded program sponsor${joined.length > 1 ? " (first matched program)" : ""}: ${str(first.program, "businessSponsor")}`
        : "Suggested review owner: Chief Risk Officer",
    because:
      "This finding crosses the risk register, program register and declared relationship edges. It only fires where the relationship endpoint names match served rows exactly.",
    trace: {
      file: "07_risks_controls.csv + 08_programs_initiatives.csv + 12_relationships.csv",
      grain: "one declared risk-program relationship",
      rule: "high severity risk endpoint joins to a program endpoint whose status is not complete",
    },
    openRows: {
      objectType: "relationship_edge",
      filter: riskName,
    },
  };
}

function regulatedDataResilienceFinding(
  dataRows: EstateRow[],
  platforms: EstateRow[],
): Finding | null {
  const platformByName = new Map(
    platforms.map((row) => [norm(str(row, "platformName")), row]),
  );
  const affected = dataRows.filter((row) => {
    if (!isTruthish(str(row, "regulatedDataFlag"))) return false;
    const platform =
      platformByName.get(norm(str(row, "platformName"))) ??
      platformByName.get(norm(str(row, "platformOrDatabase")));
    if (!platform) return false;
    return /backup|restore only|manual/i.test(str(platform, "drTier"));
  });
  if (affected.length === 0) return null;
  const platformsNamed = new Set(
    affected
      .map((row) => str(row, "platformName") || str(row, "platformOrDatabase"))
      .filter(Boolean)
      .map(cellText),
  );
  const platformPhrase =
    platformsNamed.size === 1
      ? [...platformsNamed][0]
      : `${platformsNamed.size} platforms`;
  return {
    kind: "exposure",
    claim: `${affected.length} regulated data ${plural(affected.length, "asset sits", "assets sit")} on ${platformPhrase} whose recovery is declared as backup or manual restore.`,
    owner: "Suggested review owner: Chief Data Officer",
    because:
      "This joins regulated-data flags from the data estate to named infrastructure recovery posture. It does not infer platform identity beyond exact served names.",
    trace: {
      file: "09_data_assets_integrations.csv + 06_infrastructure_platforms.csv",
      grain: "one regulated data asset on a named platform",
      rule: "regulatedDataFlag is true and platformName/platformOrDatabase matches a platform with backup/manual DR tier",
    },
    openRows: {
      objectType: "data_asset_or_integration",
      filter: "regulated",
    },
  };
}

function vendorCriticalSystemsFinding(
  applications: EstateRow[],
  vendors: EstateRow[],
): Finding | null {
  const exposedVendors = vendors.filter(
    (row) =>
      isHigh(str(row, "riskRating")) || isTruthish(str(row, "autoRenewFlag")),
  );
  if (exposedVendors.length === 0) return null;
  const exposedApps = new Map<string, EstateRow>();

  for (const contract of exposedVendors) {
    const vendorName = str(contract, "vendorName");
    const supportedSystems = str(contract, "supportedSystems");
    for (const app of applications) {
      if (!isHigh(str(app, "criticality"))) continue;
      const systemName = str(app, "systemName");
      const sameVendor =
        vendorName && norm(str(app, "vendor")) === norm(vendorName);
      const scopedSystem = containsDeclaredName(supportedSystems, systemName);
      if (sameVendor || scopedSystem) {
        exposedApps.set(systemName || `${vendorName}-${exposedApps.size}`, app);
      }
    }
  }

  if (exposedApps.size === 0) return null;
  const firstVendor = exposedVendors[0];
  return {
    kind: "exposure",
    rated: isHigh(str(firstVendor, "riskRating")) ? "high" : undefined,
    claim: `${exposedApps.size} critical ${plural(exposedApps.size, "system is", "systems are")} tied to vendor contracts that are high-risk or auto-renewing.`,
    owner: "Suggested review owner: Chief Procurement Officer",
    because:
      "This joins critical systems to contract rows through exact vendor names or declared supported-system lists. It is a sourcing exposure, not a legal conclusion.",
    trace: {
      file: "03_applications_systems.csv + 10_vendor_contracts.csv",
      grain: "one critical application matched to one contract row",
      rule: "application criticality is high/critical and vendor name or supportedSystems matches a high-risk or auto-renewing contract",
    },
    openRows: {
      objectType: "vendor_contract",
      filter: str(firstVendor, "vendorName") || "high",
    },
  };
}

export function crossFamilyFindings(estate: CrossFamilyEstate): Finding[] {
  const findings: Finding[] = [];
  const graph = relationshipGraphFinding(estate);
  if (graph) findings.push(graph);

  const riskProgram = riskProgramFinding(
    estate.risks ?? [],
    estate.programs ?? [],
    estate.relationships ?? [],
  );
  if (riskProgram) findings.push(riskProgram);

  const regulatedResilience = regulatedDataResilienceFinding(
    estate.data ?? [],
    estate.infrastructure ?? [],
  );
  if (regulatedResilience) findings.push(regulatedResilience);

  const vendorSystems = vendorCriticalSystemsFinding(
    estate.applications ?? [],
    estate.vendors ?? [],
  );
  if (vendorSystems) findings.push(vendorSystems);

  return findings;
}

/* ------------------------------------------------------------------------------------------------
 * Applications — the estate page
 * ---------------------------------------------------------------------------------------------- */

const HOSTING_ORDER = [
  "on_premise",
  "hosted_by_vendor",
  "saas",
  "cloud",
  "on_premise_appliance",
];

/** Which AI views the rows cannot support. The value fields live in the benefits ledger. */
export function unsupportedAiViews(useCases: EstateRow[]): UnsupportedView[] {
  if (useCases.length === 0) return [];
  const out: UnsupportedView[] = [];
  const has = (field: string) => useCases.some((row) => str(row, field));
  for (const [field, caption] of [
    ["financeValidatedValueUsd", "Validated value against promised"],
    ["realizedValueAllowed", "Which use cases may book value"],
  ] as const) {
    if (!has(field)) {
      out.push({
        caption,
        missingColumn: field,
        why: `No use-case record carries ${field}. It is declared in the AI benefits ledger, which this surface does not yet read — a gap in what reached the page rather than a gap in the record.`,
      });
    }
  }
  return out;
}

/** Which application views the rows cannot support, and the column each one needs. */
export function unsupportedApplicationViews(
  apps: EstateRow[],
): UnsupportedView[] {
  if (apps.length === 0) return [];
  const out: UnsupportedView[] = [];
  const has = (field: string) => apps.some((row) => str(row, field));
  for (const [field, caption] of [
    ["cloudReadiness", "Cloud readiness"],
    ["authenticationMethod", "Authentication × data classification"],
    ["endOfSupportDate", "End-of-support exposure"],
    ["annualCostBasis", "How each cost was arrived at"],
  ] as const) {
    if (!has(field)) {
      out.push({
        caption,
        missingColumn: field,
        why: `No application record on this read path carries ${field}. The intake declares it, so this is a gap in what reached the page rather than a gap in the record.`,
      });
    }
  }
  return out;
}

export function applicationTables(apps: EstateRow[]): TableSpec[] {
  if (apps.length === 0) return [];
  const tables: TableSpec[] = [];

  // Category x hosting. The category column carries 79 free-text values, so this rolls up to the
  // vendor-or-platform family the category names rather than inventing an archetype taxonomy here.
  const cross = crossTab(
    apps,
    "businessFunction",
    "deploymentModel",
    HOSTING_ORDER,
  );
  const present = HOSTING_ORDER.filter((c) =>
    apps.some((a) => str(a, "deploymentModel") === c),
  );
  const topFunctions = cross.ordered.slice(0, 8);
  const rowsOut: Array<Array<string | number>> = topFunctions.map((fn) => [
    fn,
    ...present.map((c) => cross.table.get(fn)?.get(c) ?? 0),
    cross.rowTotals.get(fn) ?? 0,
  ]);
  const shown = topFunctions.reduce(
    (n, fn) => n + (cross.rowTotals.get(fn) ?? 0),
    0,
  );
  tables.push({
    wide: true,
    caption: "Business function × hosting",
    section: "The estate",
    columns: ["Business function", ...present.map(label), "Apps"],
    rows: rowsOut,
    total: [
      "All functions",
      ...present.map(
        (c) => apps.filter((a) => str(a, "deploymentModel") === c).length,
      ),
      apps.length,
    ],
    note:
      cross.ordered.length > topFunctions.length
        ? `Top ${topFunctions.length} of ${cross.ordered.length} functions shown — ${shown} of ${apps.length} applications. The total row counts all of them.`
        : undefined,
  });

  const basis = costBasis(apps);
  for (const [key, caption, section] of [
    ["cloudReadiness", "Cloud readiness", "The estate"],
    ["lifecycleState", "Lifecycle state", "Lifecycle & exposure"],
  ] as const) {
    const counts = countBy(
      apps.filter((a) => str(a, key)),
      key,
    );
    if (counts.length < 2) continue;
    const declared = counts.reduce((n, c) => n + c.count, 0);
    tables.push({
      caption,
      section,
      barColumn: "Apps",
      columns: [caption, "Apps", "Annual cost"],
      rows: counts.map((c) => [label(c.value), c.count, usd(c.cost)]),
      total: [
        "Declared",
        declared,
        usd(counts.reduce((n, c) => n + c.cost, 0)),
      ],
      note: withCostBasis(
        declared < apps.length
          ? `${apps.length - declared} applications carry no ${caption.toLowerCase()}. They are counted as unassessed, not as a value.`
          : undefined,
        basis,
      ),
    });
  }

  // Authentication against data classification. Neither column alone carries the population this
  // produces, and that population is the finding.
  const withAuth = apps.filter((a) => str(a, "authenticationMethod"));
  if (withAuth.length > 0) {
    const classes = ["phi", "internal", "pci", "pii"].filter((k) =>
      withAuth.some((a) => str(a, "dataClassification").toLowerCase() === k),
    );
    const methods = countBy(withAuth, "authenticationMethod").map(
      (m) => m.value,
    );
    tables.push({
      caption: "Authentication × data classification",
      section: "Access & classification",
      columns: ["Method", ...classes.map((c) => c.toUpperCase()), "Apps"],
      rows: methods.map((m) => {
        const rows = withAuth.filter(
          (a) => str(a, "authenticationMethod") === m,
        );
        return [
          label(m),
          ...classes.map(
            (c) =>
              rows.filter(
                (a) => str(a, "dataClassification").toLowerCase() === c,
              ).length,
          ),
          rows.length,
        ];
      }),
      total: [
        "Declared",
        ...classes.map(
          (c) =>
            withAuth.filter(
              (a) => str(a, "dataClassification").toLowerCase() === c,
            ).length,
        ),
        withAuth.length,
      ],
      note:
        withAuth.length < apps.length
          ? `${apps.length - withAuth.length} applications declare no authentication method.`
          : undefined,
    });
  }

  return tables;
}

export function applicationFindings(apps: EstateRow[]): Finding[] {
  const findings: Finding[] = [];
  if (apps.length === 0) return findings;

  const localPhi = apps.filter(
    (a) =>
      str(a, "authenticationMethod") === "local_accounts" &&
      str(a, "dataClassification").toLowerCase() === "phi",
  ).length;
  if (localPhi > 0) {
    findings.push({
      kind: "exposure",
      claim: `${localPhi} applications holding PHI authenticate on local accounts.`,
      owner: "Suggested review owner: Chief Information Security Officer",
      because:
        "Not federated and not centrally revocable. Both facts come from the same row, so the population is exactly enumerable — and neither column alone shows it.",
      trace: {
        file: "04_applications_systems.csv",
        grain: "one application record",
        rule: "authenticationMethod is local_accounts AND dataClassification is phi",
      },
      openRows: { objectType: "application_system", filter: "local_accounts" },
    });
  }

  const eol = apps.filter((a) => str(a, "endOfSupportDate")).length;
  if (eol > 0) {
    findings.push({
      kind: "absence",
      claim: `${eol} applications carry a declared end-of-support date.`,
      owner: "Suggested review owner: Transformation Office",
      because:
        "The dates identify lifecycle milestones for review. Without an as-of basis and recorded action status, they do not establish whether support has ended or remediation is overdue.",
      trace: {
        file: "04_applications_systems.csv",
        grain: "one application record",
        rule: "endOfSupportDate is not empty",
      },
    });
  }

  const basis = costBasis(apps);
  if (basis && /modelled, not booked/.test(basis)) {
    findings.push({
      kind: "absence",
      claim: "Every cost figure on this estate is modelled, not booked.",
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "The cost basis column declares the same modelled source on every row, so no figure here has been reconciled to the ledger. They are usable for relative scale and not for a spend statement.",
      trace: {
        file: "04_applications_systems.csv",
        grain: "one application record",
        rule: "annualCostBasis has one declared value across all rows",
      },
    });
  }

  const selfHosted = apps.filter((a) =>
    str(a, "deploymentModel").startsWith("on_premise"),
  ).length;
  const share = Math.round((100 * selfHosted) / apps.length);
  if (share >= 50) {
    findings.push({
      kind: "established",
      claim: `${share}% of the estate is self-hosted.`,
      owner: "Suggested review owner: Chief Information Officer",
      because:
        "Hosting is the current state rather than a transition in progress. Cloud readiness is scored per application, but the estate underneath has not moved.",
      trace: {
        file: "04_applications_systems.csv",
        grain: "one application record",
        rule: `deploymentModel starts with on_premise — ${selfHosted} of ${apps.length}`,
      },
    });
  }

  return findings;
}

/* ------------------------------------------------------------------------------------------------
 * Vendors, infrastructure, data — the same shape, driven by their own declared columns
 * ---------------------------------------------------------------------------------------------- */

export function vendorTables(contracts: EstateRow[]): TableSpec[] {
  if (contracts.length === 0) return [];
  const byRating = countBy(contracts, "riskRating");
  const spend = (rows: EstateRow[]) =>
    rows.reduce((n, r) => n + num(r, "annualSpendUsd"), 0);
  return [
    {
      caption: "Contract risk rating",
      section: "Commercial exposure",
      barColumn: "Contracts",
      columns: ["Rating", "Contracts", "Annual spend"],
      rows: byRating.map((r) => [
        label(r.value),
        r.count,
        usd(spend(contracts.filter((c) => str(c, "riskRating") === r.value))),
      ]),
      total: ["Total", contracts.length, usd(spend(contracts))],
      note: costBasis(contracts, "annualSpendBasis") ?? undefined,
    },
    {
      caption: "Renewal exposure",
      section: "Commercial exposure",
      columns: ["Commitment", "Contracts", "Share"],
      rows: (() => {
        const auto = contracts.filter((c) =>
          /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
        ).length;
        return [
          [
            "Eligible for automatic renewal",
            auto,
            `${Math.round((100 * auto) / contracts.length)}%`,
          ],
          [
            "Not flagged for automatic renewal",
            contracts.length - auto,
            `${Math.round((100 * (contracts.length - auto)) / contracts.length)}%`,
          ],
        ];
      })(),
      total: ["Total", contracts.length, "100%"],
      note: `Declared exit cost across the base: ${usd(contracts.reduce((n, c) => n + num(c, "exitCostUsd"), 0))}. Rows not flagged include undeclared flags; the flag does not establish a renewal decision or completed renewal.`,
    },
    // Renewal is a calendar, and a calendar is the only form that shows the wall. A table of
    // contracts sorted by risk tells a reader nothing about when they lose the right to renegotiate.
    (() => {
      const byYear = new Map<
        string,
        { count: number; spend: number; auto: number }
      >();
      for (const contract of contracts) {
        const year = yearOf(str(contract, "termEnd")) ?? "not declared";
        const entry = byYear.get(year) ?? { count: 0, spend: 0, auto: 0 };
        entry.count += 1;
        entry.spend += num(contract, "annualSpendUsd");
        if (/^(yes|true|y)$/i.test(str(contract, "autoRenewFlag")))
          entry.auto += 1;
        byYear.set(year, entry);
      }
      const years = [...byYear.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      );
      const declaresAutoRenew = contracts.some((c) => str(c, "autoRenewFlag"));
      return {
        caption: "When the contracts end",
        section: "Commercial exposure",
        columns: ["Term ends", "Contracts", "Annual spend", "Auto-renewing"],
        rows: years.map(([year, e]) => [
          year,
          e.count,
          usd(e.spend),
          declaresAutoRenew ? e.auto : ABSENT,
        ]),
        total: [
          "Total",
          contracts.length,
          usd(spend(contracts)),
          countedWhereDeclared(contracts, "autoRenewFlag", (c) =>
            /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
          ),
        ],
        note: "Automatic-renewal flags describe eligibility. Review notice periods where declared; these flags and term-end dates do not establish whether a decision, notice or renewal occurred.",
      };
    })(),
    (() => {
      const models = countBy(
        contracts.filter((c) => str(c, "commercialModel")),
        "commercialModel",
      );
      return {
        caption: "Commercial model",
        section: "Commercial terms",
        columns: ["Model", "Contracts", "Annual spend"],
        rows: models.map((m) => [
          label(m.value),
          m.count,
          usd(
            spend(
              contracts.filter((c) => str(c, "commercialModel") === m.value),
            ),
          ),
        ]),
        total: [
          "Declared",
          models.reduce((n, m) => n + m.count, 0),
          usd(spend(contracts)),
        ],
        note: "Each model prices a different thing, so a total across them is a sum of unlike units.",
      };
    })(),
    (() => {
      const withClause = contracts.filter((c) =>
        benchmarkClauseState(c) === "declared",
      );
      const withoutClause = contracts.filter((c) =>
        benchmarkClauseState(c) === "absent",
      );
      const unknownClause = contracts.filter((c) =>
        benchmarkClauseState(c) === "unknown",
      );
      return {
        caption: "Right to test the price",
        section: "Commercial terms",
        columns: ["Benchmark clause", "Contracts", "Annual spend"],
        rows: [
          ...countBy(withClause, "benchmarkClause").map((b) => [
            label(b.value),
            b.count,
            usd(
              spend(
                withClause.filter((c) => str(c, "benchmarkClause") === b.value),
              ),
            ),
          ]),
          ...(withoutClause.length > 0
            ? [["Recorded no benchmark clause", withoutClause.length, usd(spend(withoutClause))]]
            : []),
          ...(unknownClause.length > 0
            ? [["Unknown benchmark-clause coverage", unknownClause.length, usd(spend(unknownClause))]]
            : []),
        ],
        total: ["Total", contracts.length, usd(spend(contracts))],
        note: "Recorded clause status, not a legal review. Unknown includes blank, absent and unrecognized values; the clause field does not establish all contractual rights or commercial leverage.",
      };
    })(),
  ];
}

/** Year a date column falls in, or null when it does not parse. Renewal is a calendar, not a state. */
function yearOf(value: string): string | null {
  const match = /^(\d{4})-/.exec(value.trim());
  return match ? match[1] : null;
}

function calendarDate(value: string): string | null {
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
    ? date
    : null;
}

export function vendorFindings(
  contracts: EstateRow[],
  /** Only a valid record as-of date supports time-relative findings; the clock is not a basis. */
  asOf?: string,
): Finding[] {
  if (contracts.length === 0) return [];
  const findings: Finding[] = [];
  const auto = contracts.filter((c) =>
    /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
  ).length;
  if (auto > contracts.length / 2) {
    findings.push({
      kind: "exposure",
      claim: `${auto} of ${contracts.length} contracts are eligible for automatic renewal.`,
      owner: "Suggested review owner: Chief Procurement Officer",
      because:
        "The count uses declared yes, true or y automatic-renewal flags. Eligibility does not establish whether a renewal decision, notice or renewal occurred; review the terms and notice period where declared. Inspection opens the full contract register.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "autoRenewFlag is yes, true or y (case-insensitive)",
      },
      openRows: { objectType: "vendor_contract", filter: "" },
    });
  }
  const noSystems = contracts.filter((c) => !str(c, "supportedSystems")).length;
  if (noSystems > 0) {
    findings.push({
      kind: "absence",
      claim: `${noSystems} contracts name no system they support.`,
      owner: "Suggested review owner: Chief Procurement Officer",
      because:
        "Without that link the contract cannot be traced to what it pays for, so its renewal cannot be assessed against use.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "supportedSystems is empty",
      },
    });
  }

  const noBenchmark = contracts.filter(
    (c) => benchmarkClauseState(c) === "absent",
  );
  if (noBenchmark.length > 0) {
    findings.push({
      kind: "absence",
      claim: `${noBenchmark.length} ${plural(noBenchmark.length, "contract records", "contracts record")} no benchmark clause.`,
      owner: "Suggested review owner: Chief Procurement Officer",
      because:
        "This count covers only explicit negative clause values. It describes the recorded clause field, not a review of all contractual rights or commercial leverage.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "benchmarkClause is no, false, n or 0 (case-insensitive)",
      },
    });
  }
  const unknownBenchmark = contracts.filter(
    (c) => benchmarkClauseState(c) === "unknown",
  );
  if (unknownBenchmark.length > 0) {
    findings.push({
      kind: "absence",
      claim: `${unknownBenchmark.length} ${plural(unknownBenchmark.length, "contract has", "contracts have")} unknown benchmark-clause coverage.`,
      owner: "Suggested review owner: Chief Procurement Officer",
      because:
        "The clause field is blank, absent or unrecognized on these rows. Unknown is not declared absence; review of the contract terms is needed to establish clause coverage.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "benchmarkClause is blank, absent or unrecognized",
      },
    });
  }

  // Compare valid calendar dates; neither date nor flag establishes a completed or overdue action.
  const basisDate = calendarDate(asOf ?? "");
  const pastTerm = basisDate
    ? contracts.filter((c) => {
        const end = calendarDate(str(c, "termEnd"));
        return end && end < basisDate;
      })
    : [];
  if (pastTerm.length > 0) {
    const auto = pastTerm.filter((c) =>
      /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
    ).length;
    findings.push({
      kind: "exposure",
      claim: `${pastTerm.length} contracts show a term end that has already passed as of ${basisDate}, ${auto} of them auto-renewing.`,
      owner: "Suggested review owner: Chief Procurement Officer",
      because:
        "The declared term-end dates precede the record's as-of date. These dates and flags do not establish whether a decision was taken, notice was served, renewal occurred, or the record needs updating. They do not establish an overdue action.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: `valid termEnd calendar date is earlier than record as-of ${basisDate}`,
      },
    });
  }

  // A calendar group does not establish whether renewal decisions are outstanding.
  const byTermYear = new Map<string, number>();
  for (const contract of contracts) {
    const year = yearOf(str(contract, "termEnd"));
    if (year && (!basisDate || year >= basisDate.slice(0, 4)))
      byTermYear.set(year, (byTermYear.get(year) ?? 0) + 1);
  }
  const soonest = [...byTermYear.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )[0];
  if (soonest && soonest[1] >= 5) {
    findings.push({
      kind: "absence",
      claim: `${soonest[1]} contracts declare term ends in ${soonest[0]}.`,
      owner: "Suggested review owner: Chief Procurement Officer",
      because:
        `${basisDate ? `The year group is filtered against the record's as-of year (${basisDate.slice(0, 4)}).` : "The record has no valid as-of date, so this is a calendar grouping rather than an upcoming deadline."} Review individual dates and notice periods where declared; this group does not establish outstanding or overdue renewal decisions.`,
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: `termEnd falls in ${soonest[0]}`,
      },
    });
  }

  return findings;
}

export function infrastructureTables(platforms: EstateRow[]): TableSpec[] {
  if (platforms.length === 0) return [];
  const byDr = countBy(
    platforms.filter((p) => str(p, "drTier")),
    "drTier",
  );
  const byHosting = countBy(platforms, "hostingModel");
  const tight = platforms.filter(
    (p) => str(p, "capacityHeadroomPct") && num(p, "capacityHeadroomPct") < 20,
  ).length;
  return [
    {
      caption: "Recovery posture",
      section: "Operational resilience",
      barColumn: "Platforms",
      columns: ["Recovery tier", "Platforms", "Share"],
      rows: byDr.map((d) => [
        label(d.value),
        d.count,
        `${Math.round((100 * d.count) / platforms.length)}%`,
      ]),
      total: ["Declared", byDr.reduce((n, d) => n + d.count, 0), ""],
      note: "Tier 3 means recovery from backup: hours to days, not minutes.",
    },
    {
      caption: "Hosting and headroom",
      section: "Operational resilience",
      columns: ["Hosting", "Platforms", "Annual cost"],
      rows: byHosting.map((h) => [
        label(h.value),
        h.count,
        usd(
          platforms
            .filter((p) => str(p, "hostingModel") === h.value)
            .reduce((n, p) => n + num(p, "annualCostUsd"), 0),
        ),
      ]),
      total: [
        "Total",
        platforms.length,
        usd(platforms.reduce((n, p) => n + num(p, "annualCostUsd"), 0)),
      ],
      note: withCostBasis(
        tight > 0
          ? `${tight} platforms run under 20% capacity headroom.`
          : undefined,
        costBasis(platforms),
      ),
    },
    ...infrastructureCrossings(platforms),
  ];
}

/** Criticality against recovery tier, and the end-of-life calendar. */
function infrastructureCrossings(platforms: EstateRow[]): TableSpec[] {
  const out: TableSpec[] = [];
  const tiers = countBy(
    platforms.filter((p) => str(p, "drTier")),
    "drTier",
  ).map((d) => d.value);
  const crits = countBy(
    platforms.filter((p) => str(p, "criticality")),
    "criticality",
  ).map((c) => c.value);
  if (tiers.length > 1 && crits.length > 1) {
    out.push({
      wide: true,
      // Neither column alone shows the exposure: a tier-1 platform recovering from backup is the
      // finding, and it exists only where the two are put against each other.
      caption: "Criticality × recovery tier",
      section: "Operational resilience",
      columns: ["Criticality", ...tiers.map(label), "Platforms"],
      rows: crits.map((c) => {
        const rows = platforms.filter((p) => str(p, "criticality") === c);
        return [
          label(c),
          ...tiers.map(
            (t) => rows.filter((p) => str(p, "drTier") === t).length,
          ),
          rows.length,
        ];
      }),
      total: [
        "Declared",
        ...tiers.map(
          (t) => platforms.filter((p) => str(p, "drTier") === t).length,
        ),
        platforms.filter((p) => str(p, "criticality")).length,
      ],
    });
  }
  const withEol = platforms.filter((p) => str(p, "endOfLifeDate"));
  if (withEol.length > 0) {
    const byYear = new Map<string, { count: number; cost: number }>();
    for (const platform of withEol) {
      const year = yearOf(str(platform, "endOfLifeDate")) ?? "not declared";
      const entry = byYear.get(year) ?? { count: 0, cost: 0 };
      entry.count += 1;
      entry.cost += num(platform, "annualCostUsd");
      byYear.set(year, entry);
    }
    out.push({
      caption: "When platforms reach end of life",
      section: "Platform lifecycle",
      columns: ["Year", "Platforms", "Annual cost"],
      rows: [...byYear.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([y, e]) => [y, e.count, usd(e.cost)]),
      total: [
        "Declared",
        withEol.length,
        usd(withEol.reduce((n, p) => n + num(p, "annualCostUsd"), 0)),
      ],
      note: `${platforms.length - withEol.length} platforms declare no end-of-life date. That is unassessed, not indefinite.`,
    });
  }
  return out;
}

export function infrastructureFindings(platforms: EstateRow[]): Finding[] {
  if (platforms.length === 0) return [];
  const findings: Finding[] = [];
  const hot = platforms.filter((p) => /tier1/.test(str(p, "drTier"))).length;
  const backupOnly = platforms.filter((p) =>
    /tier3/.test(str(p, "drTier")),
  ).length;
  if (backupOnly > hot) {
    findings.push({
      kind: "exposure",
      claim: `${hot} platforms can fail over hot. ${backupOnly} recover from backup alone.`,
      owner: "Suggested review owner: VP Infrastructure",
      because:
        "The recovery posture is declared per platform. Nothing in the record sets it against the criticality of what runs on top of it.",
      trace: {
        file: "06_infrastructure_platforms.csv",
        grain: "one platform",
        rule: "drTier contains tier1 versus tier3",
      },
    });
  }
  const eol = platforms.filter((p) => str(p, "endOfLifeDate")).length;
  if (eol > 0) {
    findings.push({
      kind: "absence",
      claim: `${eol} platforms carry a declared end-of-life date.`,
      owner: "Suggested review owner: VP Infrastructure",
      because:
        "The dates identify lifecycle milestones for review. Without an as-of basis and recorded action status, they do not establish whether a platform has reached end of life or remediation is overdue.",
      trace: {
        file: "06_infrastructure_platforms.csv",
        grain: "one platform",
        rule: "endOfLifeDate is not empty",
      },
    });
  }

  const criticalOnBackup = platforms.filter(
    (p) =>
      /tier1/.test(str(p, "criticality")) && /tier3/.test(str(p, "drTier")),
  ).length;
  if (criticalOnBackup > 0) {
    findings.push({
      kind: "exposure",
      claim: `${criticalOnBackup} tier-1 platforms recover from backup alone.`,
      owner: "Suggested review owner: VP Infrastructure",
      because:
        "Tier 1 is the enterprise's own word for what cannot be down; tier 3 is its own word for hours-to-days recovery. The record states both about the same platform, and neither column alone shows it.",
      trace: {
        file: "06_infrastructure_platforms.csv",
        grain: "one platform",
        rule: "criticality is tier1 AND drTier is tier3_backup_only",
      },
    });
  }

  return findings;
}

export function dataTables(assets: EstateRow[]): TableSpec[] {
  if (assets.length === 0) return [];
  const byPattern = countBy(assets, "integrationType").slice(0, 7);
  const shown = byPattern.reduce((n, p) => n + p.count, 0);
  const byQuality = countBy(
    assets.filter((a) => str(a, "qualityStatus")),
    "qualityStatus",
  );
  const regulated = (rows: EstateRow[]) =>
    rows.filter((a) => /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")))
      .length;
  return [
    {
      caption: "Integration pattern",
      section: "Data & integration",
      barColumn: "Assets",
      columns: ["Pattern", "Assets", "Share"],
      rows: byPattern.map((p) => [
        p.value,
        p.count,
        `${Math.round((100 * p.count) / assets.length)}%`,
      ]),
      total: ["Total", assets.length, "100%"],
      note:
        shown < assets.length
          ? `Top ${byPattern.length} patterns shown — ${shown} of ${assets.length} assets.`
          : undefined,
    },
    {
      caption: "Governance state",
      section: "Access & classification",
      columns: ["State", "Assets", "Regulated"],
      rows: byQuality.map((q) => [
        label(q.value),
        q.count,
        regulated(assets.filter((a) => str(a, "qualityStatus") === q.value)),
      ]),
      total: [
        "Declared",
        byQuality.reduce((n, q) => n + q.count, 0),
        regulated(assets),
      ],
    },
    ...dataCrossings(assets),
  ];
}

function dataCrossings(assets: EstateRow[]): TableSpec[] {
  const out: TableSpec[] = [];
  const platforms = countBy(
    assets.filter((a) => str(a, "platformOrDatabase")),
    "platformOrDatabase",
  );
  if (platforms.length > 1) {
    out.push({
      caption: "Where the data actually sits",
      section: "Data & integration",
      barColumn: "Assets",
      columns: ["Platform", "Assets", "Regulated"],
      rows: platforms
        .slice(0, 7)
        .map((p) => [
          p.value,
          p.count,
          assets.filter(
            (a) =>
              str(a, "platformOrDatabase") === p.value &&
              /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")),
          ).length,
        ]),
      total: [
        "Total",
        assets.length,
        assets.filter((a) =>
          /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")),
        ).length,
      ],
    });
  }
  const refreshes = countBy(
    assets.filter((a) => str(a, "refreshFrequency")),
    "refreshFrequency",
  );
  if (refreshes.length > 1) {
    out.push({
      caption: "How current the data is",
      section: "Data & integration",
      columns: ["Refresh", "Assets", "Regulated"],
      rows: refreshes.map((r) => [
        label(r.value),
        r.count,
        assets.filter(
          (a) =>
            str(a, "refreshFrequency") === r.value &&
            /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")),
        ).length,
      ]),
      total: [
        "Declared",
        refreshes.reduce((n, r) => n + r.count, 0),
        assets.filter((a) =>
          /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")),
        ).length,
      ],
      note: "Refresh frequency is the ceiling on how current any decision made from an asset can be.",
    });
  }
  return out;
}

export function dataFindings(assets: EstateRow[]): Finding[] {
  if (assets.length === 0) return [];
  const findings: Finding[] = [];
  const regulatedUngoverned = assets.filter(
    (a) =>
      /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")) &&
      str(a, "qualityStatus") !== "governed_production_grade",
  ).length;
  if (regulatedUngoverned > 0) {
    findings.push({
      kind: "exposure",
      claim: `${regulatedUngoverned} regulated data assets are not yet production-governed.`,
      owner: "Suggested review owner: Chief Data Officer",
      because:
        "Both the regulation flag and the governance state come from the same row, so the population is exactly enumerable rather than estimated.",
      trace: {
        file: "05_data_assets_integrations.csv",
        grain: "one data asset or integration",
        rule: "regulatedDataFlag is true AND qualityStatus is not governed_production_grade",
      },
    });
  }
  const top = countBy(assets, "integrationType")[0];
  if (top) {
    findings.push({
      kind: "established",
      claim: `${top.value} is the largest single integration pattern, at ${top.count} of ${assets.length} assets.`,
      owner: "Suggested review owner: VP Data & AI Platforms",
      because:
        "A modernization sequence that starts anywhere else leaves the largest population untouched.",
      trace: {
        file: "05_data_assets_integrations.csv",
        grain: "one data asset or integration",
        rule: "grouped by integrationType",
      },
    });
  }

  const topPlatform = countBy(
    assets.filter((a) => str(a, "platformOrDatabase")),
    "platformOrDatabase",
  )[0];
  if (topPlatform && topPlatform.count / assets.length >= 0.15) {
    const regulatedThere = assets.filter(
      (a) =>
        str(a, "platformOrDatabase") === topPlatform.value &&
        /^(true|yes|y)$/i.test(str(a, "regulatedDataFlag")),
    ).length;
    findings.push({
      kind: "exposure",
      claim: `${topPlatform.count} data assets sit on ${topPlatform.value}, ${regulatedThere} of them regulated.`,
      owner: "Suggested review owner: Chief Data Officer",
      because:
        "Concentration on one platform is a single point of both dependency and remediation: it is where a migration costs most and where a control change reaches furthest.",
      trace: {
        file: "05_data_assets_integrations.csv",
        grain: "one data asset or integration",
        rule: `platformOrDatabase is ${topPlatform.value}`,
      },
    });
  }

  return findings;
}

/* ------------------------------------------------------------------------------------------------
 * Constant-column detection — a column with one value is a default, never a result
 * ---------------------------------------------------------------------------------------------- */

export function constantColumns(
  rows: EstateRow[],
  columns: string[],
): Array<{ column: string; value: string }> {
  if (rows.length < 2) return [];
  const out: Array<{ column: string; value: string }> = [];
  for (const column of columns) {
    const values = new Set(rows.map((r) => str(r, column)));
    values.delete("");
    if (values.size === 1 && rows.every((r) => str(r, column))) {
      out.push({ column, value: [...values][0] });
    }
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Metrics, risks, programs, organisation and AI — the intake families the projection now carries
 * ---------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------
 * Undeclared columns — a column of dashes is a field the intake never collected
 * ---------------------------------------------------------------------------------------------- */

/** What every formatter here emits for a value the record does not carry. Never for a zero. */
const ABSENT = "\u2014";

/**
 * Drops a data column whose every cell is the absent mark, and says so under the table.
 *
 * A money column built from a field no row declares comes out as a dash in every cell and a dash in
 * the total. That is not a result. It is a column-width advertisement for a field the intake never
 * collected, and a reader scanning across for the number finds a shape where one should be.
 *
 * The dash is what makes this safe to do without the builder's help: the formatters emit it only
 * for absent, never for zero, so a column made entirely of them is carrying no value by
 * construction. An all-ZERO column is a different case and deliberately not touched here -- zero
 * can be a real count, and only the builder knows whether it is.
 *
 * The dropped column is named beneath the table. Silently vanishing it would be the same mistake as
 * printing it: a column the record cannot fill is a fact about the record.
 */
/**
 * A count of matching rows, or the absent mark when no row declares the field at all.
 *
 * Zero and absent are different answers and they render identically. Where the field exists and
 * nothing matches, zero is a result worth showing. Where no row carries the field, zero is a
 * statement about the intake wearing the clothes of a finding -- and it is always the reassuring
 * reading: no regulatory drivers, no auto-renewals, nothing to worry about.
 *
 * Returning the absent mark hands the column to dropUndeclaredColumns, which removes it and names
 * it underneath, so the two mechanisms compose into one rule: a column the record cannot fill is
 * never drawn and never silent.
 */
export function countedWhereDeclared(
  rows: EstateRow[],
  field: string,
  matches: (row: EstateRow) => boolean,
): number | string {
  if (!rows.some((row) => str(row, field))) return ABSENT;
  return rows.filter(matches).length;
}

export function dropUndeclaredColumns(table: TableSpec): TableSpec {
  if (table.rows.length === 0) return table;
  const dropped: number[] = [];
  // Column 0 labels the rows; it is never a measure and never dropped.
  for (let column = 1; column < table.columns.length; column += 1) {
    if (table.rows.every((row) => String(row[column] ?? "") === ABSENT)) {
      dropped.push(column);
    }
  }
  if (dropped.length === 0) return table;
  const keep = <T>(values: T[]) =>
    values.filter((_, i) => !dropped.includes(i));
  const names = dropped.map((i) => table.columns[i]);
  const droppedNote = `No row declares ${names.map((n) => n.toLowerCase()).join(" or ")}, so ${names.length === 1 ? "that column is" : "those columns are"} not drawn.`;
  return {
    ...table,
    columns: keep(table.columns),
    rows: table.rows.map((row) => keep(row)),
    total: table.total ? keep(table.total) : undefined,
    barColumn:
      table.barColumn && names.includes(table.barColumn)
        ? undefined
        : table.barColumn,
    note: [table.note, droppedNote].filter(Boolean).join(" "),
  };
}

/* ------------------------------------------------------------------------------------------------
 * Leadership interviews — what the people running the enterprise say about it
 * ---------------------------------------------------------------------------------------------- */

/** Distinct executive areas that raise a given value of a field. Agreement is a count of areas,
 *  never a count of rows: one area asked eight questions is not eight people agreeing. */
function areasRaising(
  rows: EstateRow[],
  field: string,
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const row of rows) {
    const value = str(row, field);
    const area = str(row, "executiveArea");
    if (!value || !area) continue;
    if (!out.has(value)) out.set(value, new Set());
    out.get(value)!.add(area);
  }
  return out;
}

export function interviewTables(interviews: EstateRow[]): TableSpec[] {
  if (interviews.length === 0) return [];
  const areas = new Set(
    interviews.map((row) => str(row, "executiveArea")).filter(Boolean),
  );
  const tables: TableSpec[] = [];

  // Count distinct areas mentioning a theme, not agreement. Least-shared themes come first.
  const byTheme = [...areasRaising(interviews, "priorityTheme")].sort(
    (a, b) => a[1].size - b[1].size || a[0].localeCompare(b[0]),
  );
  if (byTheme.length > 0 && areas.size > 1) {
    const listed = byTheme.slice(0, 10);
    tables.push({
      caption: "Where leadership diverges",
      section: "Where leadership stands",
      barColumn: "Areas raising it",
      columns: ["Theme", "Areas raising it", "Of", "Mentions"],
      rows: listed.map(([theme, raisingAreas]) => [
        label(theme),
        raisingAreas.size,
        areas.size,
        interviews.filter((row) => str(row, "priorityTheme") === theme).length,
      ]),
      total: [
        `${byTheme.length} themes`,
        "\u2014",
        areas.size,
        interviews.length,
      ],
      note: [
        "Counted by executive area, not by answer: one area asked eight questions is not eight people agreeing. Least-shared themes first, because a theme everyone raises is one line and a theme one area raises is a question.",
        byTheme.length > listed.length
          ? `${byTheme.length - listed.length} further themes are raised more widely and are not listed; the total counts every answer.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  // A system several areas name unprompted is a different object from one that merely appears in
  // the estate. This is the only table on the page where leadership and the estate meet by name.
  const bySystem = [...areasRaising(interviews, "systemOrVendorMentioned")]
    .filter(([, raisingAreas]) => raisingAreas.size > 1)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  if (bySystem.length > 0) {
    const listed = bySystem.slice(0, 10);
    tables.push({
      wide: true,
      caption: "Systems leadership keeps returning to",
      section: "Where leadership stands",
      barColumn: "Areas naming it",
      columns: ["System named", "Areas naming it", "Mentions", "Themes"],
      rows: listed.map(([system, raisingAreas]) => {
        const named = interviews.filter(
          (row) => str(row, "systemOrVendorMentioned") === system,
        );
        return [
          system,
          raisingAreas.size,
          named.length,
          new Set(named.map((row) => str(row, "priorityTheme")).filter(Boolean))
            .size,
        ];
      }),
      note: [
        "Named by the interviewee, not matched from the estate, so a system here is one leadership brought up rather than one we asked about.",
        bySystem.length > listed.length
          ? `${bySystem.length - listed.length} further systems are named by more than one area and not listed.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }
  return tables;
}

export function interviewFindings(interviews: EstateRow[]): Finding[] {
  if (interviews.length === 0) return [];
  const findings: Finding[] = [];
  const areas = new Set(
    interviews.map((row) => str(row, "executiveArea")).filter(Boolean),
  );

  // Before anything this record says is read as testimony, what KIND of statement it is. A modelled
  // answer rendered under a named role is the most damaging thing this page could do: a reader
  // takes it for something a person said.
  const modelled = interviews.filter((row) =>
    /modelled/i.test(str(row, "responseBasis")),
  ).length;
  if (modelled === interviews.length) {
    findings.push({
      kind: "absence",
      claim: `All ${interviews.length} interview responses are modelled, not transcribed.`,
      owner: "Suggested review owner: Chief Executive Officer",
      because:
        "The pattern of what is raised, and by how many parts of the business, is still the record's own. What a named role is quoted as saying is not, and nothing on this page should be read as testimony.",
      trace: {
        file: "executive_interviews.csv",
        grain: "one question to one role",
        rule: "responseBasis is modelled on every row",
      },
    });
  } else if (modelled > 0) {
    findings.push({
      kind: "absence",
      claim: `${modelled} of ${interviews.length} interview responses are modelled rather than transcribed.`,
      owner: "Suggested review owner: Chief Executive Officer",
      because:
        "The two kinds of statement sit side by side in this record, so any quotation has to carry which one it is.",
      trace: {
        file: "executive_interviews.csv",
        grain: "one question to one role",
        rule: "responseBasis is modelled",
      },
    });
  }

  const byTheme = areasRaising(interviews, "priorityTheme");
  const universal = [...byTheme].filter(
    ([, raisingAreas]) => raisingAreas.size === areas.size,
  );
  if (areas.size > 2 && universal.length > 0) {
    findings.push({
      kind: "established",
      claim: `${universal.length} themes are raised by every one of the ${areas.size} executive areas: ${universal
        .slice(0, 3)
        .map(([theme]) => cellText(theme))
        .join("; ")}${universal.length > 3 ? "…" : "."}`,
      owner: "Suggested review owner: Chief Executive Officer",
      because:
        "The count measures breadth of recorded mentions. It does not establish agreement on a problem or solution, consensus, or attestation. Modelled responses remain modelled rather than testimony.",
      trace: {
        file: "executive_interviews.csv",
        grain: "one question to one role",
        rule: "every executive area raises the theme at least once",
      },
    });
  }

  const isolated = [...byTheme].filter(
    ([, raisingAreas]) => raisingAreas.size === 1,
  );
  if (areas.size > 2 && isolated.length > 0) {
    findings.push({
      kind: "exposure",
      claim: `${isolated.length} themes are raised by a single area: ${isolated
        .slice(0, 3)
        .map(([theme]) => cellText(theme))
        .join("; ")}${isolated.length > 3 ? "…" : "."}`,
      owner: "Suggested review owner: Chief Executive Officer",
      because:
        "One area alone raising something is either a local problem or the only part of the business that can see it, and those readings point opposite ways. The record does not distinguish them.",
      trace: {
        file: "executive_interviews.csv",
        grain: "one question to one role",
        rule: "exactly one executive area raises the theme",
      },
    });
  }

  const bySystem = [
    ...areasRaising(interviews, "systemOrVendorMentioned"),
  ].sort((a, b) => b[1].size - a[1].size);
  const [mostNamed] = bySystem;
  if (mostNamed && mostNamed[1].size > 2) {
    findings.push({
      kind: "exposure",
      claim: `${mostNamed[0]} is named by ${mostNamed[1].size} of the ${areas.size} executive areas.`,
      owner: "Suggested review owner: Chief Information Officer",
      because:
        "A system raised across most of the leadership is carrying more of the business's attention than any single function's roadmap accounts for.",
      trace: {
        file: "executive_interviews.csv",
        grain: "one question to one role",
        rule: "distinct executiveArea count for systemOrVendorMentioned",
      },
    });
  }

  const namedRisks = new Set(
    interviews.map((row) => str(row, "riskOrControlMentioned")).filter(Boolean),
  );
  if (namedRisks.size > 0) {
    findings.push({
      kind: "established",
      claim: `Leadership names ${namedRisks.size} distinct risks or controls unprompted.`,
      owner: "Suggested review owner: Chief Risk Officer",
      because:
        "Each is a risk somebody running the business raised on their own, which is a different signal from one that only appears in the register.",
      trace: {
        file: "executive_interviews.csv",
        grain: "one question to one role",
        rule: "distinct non-empty riskOrControlMentioned",
      },
    });
  }
  return findings;
}

export function metricTables(metrics: EstateRow[]): TableSpec[] {
  if (metrics.length === 0) return [];
  const tables: TableSpec[] = [];

  // What is measured and who answers for it. The chapter's opening question, and the part of it
  // this record can answer -- a measure set is first a statement about coverage and ownership.
  const byDomain = countBy(
    metrics.filter((m) => str(m, "metricDomain")),
    "metricDomain",
  );
  const owners = (rows: EstateRow[]) =>
    new Set(rows.map((m) => str(m, "owner")).filter(Boolean)).size;
  if (byDomain.length > 0) {
    const listed = byDomain.slice(0, 8);
    tables.push({
      caption: "What is measured, and who owns it",
      section: "What is measured",
      barColumn: "Measures",
      columns: ["Domain", "Measures", "With a target", "Named owners"],
      rows: listed.map((d) => {
        const rows = metrics.filter((m) => str(m, "metricDomain") === d.value);
        return [
          label(d.value),
          d.count,
          rows.filter((m) => str(m, "targetValue")).length,
          owners(rows),
        ];
      }),
      total: [
        "Declared",
        metrics.length,
        metrics.filter((m) => str(m, "targetValue")).length,
        owners(metrics),
      ],
      note:
        [
          "Measures are counted, never summed: they are declared in different units and an aggregate across them would mean nothing.",
          byDomain.length > listed.length
            ? `${byDomain.length - listed.length} further domains are not listed; the total counts every measure.`
            : null,
          metrics.length > byDomain.reduce((n, d) => n + d.count, 0)
            ? `${metrics.length - byDomain.reduce((n, d) => n + d.count, 0)} measures declare no domain and appear only in the total.`
            : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
    });
  }

  // The claim tables exist only where the record carries a readiness column at all. Rendered
  // against a record without one they said "0 blocked claims" over an empty body -- which reads as
  // nothing is blocked when it means nothing is recorded, the most flattering possible misreading
  // of an absent column.
  const byReadiness = countBy(
    metrics.filter((m) => str(m, "claimReadiness")),
    "claimReadiness",
  );
  const blocked = metrics.filter((m) => str(m, "claimBlockedReason"));
  const withAction = blocked.filter((m) => str(m, "unblockAction"));
  if (byReadiness.length > 0) {
    tables.push({
      caption: "Can this value be claimed",
      section: "What is measured",
      barColumn: "Metrics",
      columns: ["Readiness", "Metrics", "With a blocked reason"],
      rows: byReadiness.map((r) => [
        label(r.value),
        r.count,
        metrics.filter(
          (m) =>
            str(m, "claimReadiness") === r.value &&
            str(m, "claimBlockedReason"),
        ).length,
      ]),
      total: [
        "Declared",
        byReadiness.reduce((n, r) => n + r.count, 0),
        blocked.length,
      ],
      note: `${withAction.length} of the ${blocked.length} blocked claims already state the action that would unblock them.`,
    });
  }
  // The unblock list itself, because it is the agenda -- a count of blocked claims is not actionable
  // and a named action against a named period is.
  if (withAction.length > 0) {
    tables.push({
      wide: true,
      caption: "What would unblock each claim",
      section: "What is measured",
      columns: ["Metric", "Blocked because", "Unblock action", "By"],
      rows: withAction
        .slice(0, 10)
        .map((m) => [
          str(m, "metricName"),
          str(m, "claimBlockedReason"),
          str(m, "unblockAction"),
          str(m, "unblockTargetPeriod") || "not stated",
        ]),
      note:
        withAction.length > 10
          ? `First 10 of ${withAction.length}. Every one names its own action; the full list is in the record browser.`
          : undefined,
    });
  }
  return tables;
}

export function metricFindings(metrics: EstateRow[]): Finding[] {
  if (metrics.length === 0) return [];
  const findings: Finding[] = [];

  // The chapter asks whether the enterprise is moving toward its outcomes. That takes three numbers
  // per measure and this record carries two. Said plainly, because the distance chart above reads
  // like progress unless the reader is told what it is measuring.
  const withActual = metrics.filter((m) => str(m, "actualValue")).length;
  if (withActual === 0) {
    findings.push({
      kind: "absence",
      claim: `No measure declares a current value, across all ${metrics.length}.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "Baseline and target say where a measure started and where it is meant to reach. Whether it has moved needs a third number the record does not carry, so the distance shown on this page is the size of the ambition rather than progress against it.",
      trace: {
        file: "14_metrics_outcomes.csv",
        grain: "one tracked metric",
        rule: "actualValue is empty on every row",
      },
    });
  } else if (withActual < metrics.length) {
    findings.push({
      kind: "absence",
      claim: `${metrics.length - withActual} of ${metrics.length} measures declare no current value.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "Progress can be stated for the rest and not for these, so any figure covering the whole set is covering two different things.",
      trace: {
        file: "14_metrics_outcomes.csv",
        grain: "one tracked metric",
        rule: "actualValue is empty",
      },
    });
  }

  // The other half of the chapter's question. A record that says nothing about attestation cannot
  // be read as saying the value is unproven OR proven -- only that it was never asked.
  const withClaim = metrics.filter(
    (m) =>
      str(m, "claimReadiness") ||
      str(m, "valueClaimStatus") ||
      num(m, "financeAttestedValueUsd") > 0,
  ).length;
  if (withClaim === 0) {
    findings.push({
      kind: "absence",
      claim: `No measure declares whether its value has been attested, across all ${metrics.length}.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "Nothing here states a claim readiness, a claim status or a finance-attested amount. Whether these outcomes can be claimed is not answered by this record either way, which is different from the answer being no.",
      trace: {
        file: "14_metrics_outcomes.csv",
        grain: "one tracked metric",
        rule: "claimReadiness, valueClaimStatus and financeAttestedValueUsd are all empty on every row",
      },
    });
  }

  const claimable = metrics.filter((m) =>
    /claimable|ready/i.test(str(m, "claimReadiness")),
  ).length;
  const blocked = metrics.filter((m) => str(m, "claimBlockedReason"));
  const withAction = blocked.filter((m) => str(m, "unblockAction")).length;
  if (blocked.length > claimable) {
    findings.push({
      kind: "absence",
      claim: `${blocked.length} of ${metrics.length} value claims are blocked, and ${withAction} already state what would unblock them.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "The blocked rows record reasons, and the counted actions describe proposed work. Target periods must be checked where declared; neither an action nor a target period proves assignment, completion or overdue status.",
      trace: {
        file: "14_metrics_outcomes.csv",
        grain: "one tracked metric",
        rule: "claimBlockedReason is not empty",
      },
    });
  }
  const noPeriod = blocked.filter(
    (m) => str(m, "unblockAction") && !str(m, "unblockTargetPeriod"),
  ).length;
  if (noPeriod > 0) {
    findings.push({
      kind: "absence",
      claim: `${noPeriod} unblock actions carry no target period.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "These actions have no declared target period. Their schedule is unknown; the missing period does not establish that work is overdue or that the suggested review owner has been assigned.",
      trace: {
        file: "14_metrics_outcomes.csv",
        grain: "one tracked metric",
        rule: "unblockAction present AND unblockTargetPeriod empty",
      },
    });
  }
  return findings;
}

export function riskTables(risks: EstateRow[]): TableSpec[] {
  if (risks.length === 0) return [];
  const severities = countBy(
    risks.filter((r) => str(r, "severity")),
    "severity",
  ).map((x) => x.value);
  const states = countBy(
    risks.filter((r) => str(r, "controlStatus")),
    "controlStatus",
  ).map((x) => x.value);
  const tables: TableSpec[] = [];
  if (severities.length > 1 && states.length > 1) {
    tables.push({
      wide: true,
      caption: "Severity against control state",
      section: "The risk register",
      columns: ["Severity", ...states.map(label), "Risks", "Remediation"],
      rows: severities.map((s) => {
        const rows = risks.filter((r) => str(r, "severity") === s);
        return [
          label(s),
          ...states.map(
            (st) => rows.filter((r) => str(r, "controlStatus") === st).length,
          ),
          rows.length,
          usd(rows.reduce((n, r) => n + num(r, "remediationCostUsd"), 0)),
        ];
      }),
      total: [
        "Declared",
        ...states.map(
          (st) => risks.filter((r) => str(r, "controlStatus") === st).length,
        ),
        risks.length,
        usd(risks.reduce((n, r) => n + num(r, "remediationCostUsd"), 0)),
      ],
    });
  }
  const byDomain = countBy(
    risks.filter((r) => str(r, "riskDomain")),
    "riskDomain",
  );
  if (byDomain.length > 1) {
    tables.push({
      caption: "Risk domain",
      section: "The risk register",
      columns: ["Domain", "Risks", "Regulatory driver"],
      rows: byDomain.map((d) => [
        label(d.value),
        d.count,
        countedWhereDeclared(
          risks,
          "regulatoryDriver",
          (r) =>
            str(r, "riskDomain") === d.value &&
            /^(yes|true|y)$/i.test(str(r, "regulatoryDriver")),
        ),
      ]),
      total: [
        "Declared",
        byDomain.reduce((n, d) => n + d.count, 0),
        countedWhereDeclared(risks, "regulatoryDriver", (r) =>
          /^(yes|true|y)$/i.test(str(r, "regulatoryDriver")),
        ),
      ],
      note: "A risk without a regulatory driver is the enterprise's own assessment rather than an external requirement.",
    });
  }
  return tables;
}

export function riskFindings(risks: EstateRow[]): Finding[] {
  if (risks.length === 0) return [];
  const findings: Finding[] = [];
  const highOpen = risks.filter(
    (r) =>
      /high/i.test(str(r, "severity")) && /open/i.test(str(r, "controlStatus")),
  );
  if (highOpen.length > 0) {
    findings.push({
      kind: "exposure",
      rated: "high",
      claim:
        highOpen.length === 1
          ? `One high-severity risk has no operating control: ${str(highOpen[0], "riskOrControlName")}.`
          : `${highOpen.length} high-severity risks have no operating control: ${highOpen
              .slice(0, 2)
              .map((r) => str(r, "riskOrControlName"))
              .join("; ")}${highOpen.length > 2 ? "…" : "."}`,
      owner: "Suggested review owner: Chief Risk Officer",
      because:
        "Severity and control state are declared on the same row, so this is the register's own reading of itself rather than an interpretation of it.",
      trace: {
        file: "11_risks_controls.csv",
        grain: "one risk or control",
        rule: "severity is high AND controlStatus is open",
      },
      openRows: { objectType: "risk_control", filter: "high" },
    });
  }
  const cost = risks.reduce((n, r) => n + num(r, "remediationCostUsd"), 0);
  if (cost > 0) {
    findings.push({
      kind: "established",
      claim: `${usd(cost)} would remediate the whole register.`,
      owner: "Suggested review owner: Chief Risk Officer",
      because:
        "Declared per risk and summed. The ratio to what the estate costs to run each year is the argument, not the absolute figure.",
      trace: {
        file: "11_risks_controls.csv",
        grain: "one risk or control",
        rule: "sum of remediationCostUsd",
      },
    });
  }
  return findings;
}

export function programTables(programs: EstateRow[]): TableSpec[] {
  if (programs.length === 0) return [];
  const byStatus = countBy(
    programs.filter((p) => str(p, "status")),
    "status",
  );
  const budget = (rows: EstateRow[]) =>
    rows.reduce((n, p) => n + num(p, "budgetUsd"), 0);
  const value = (rows: EstateRow[]) =>
    rows.reduce((n, p) => n + num(p, "expectedValueUsd"), 0);
  const withPct = programs.filter((p) => str(p, "pctComplete"));
  const tables: TableSpec[] = [
    {
      wide: true,
      caption: "Status against money and progress",
      section: "The portfolio",
      columns: [
        "Status",
        "Programs",
        "Budget",
        "Expected value",
        "Median complete",
      ],
      rows: byStatus.map((s) => {
        const rows = programs.filter((p) => str(p, "status") === s.value);
        const pcts = rows
          .map((p) => num(p, "pctComplete"))
          .filter((n) => n > 0)
          .sort((a, b) => a - b);
        return [
          label(s.value),
          s.count,
          usd(budget(rows)),
          usd(value(rows)),
          pcts.length ? `${pcts[Math.floor(pcts.length / 2)]}%` : "—",
        ];
      }),
      total: [
        "Total",
        programs.length,
        usd(budget(programs)),
        usd(value(programs)),
        "",
      ],
      note: "Reported status and actual progress are declared separately, so the two columns can disagree — and where they do, that is the finding.",
    },
  ];
  const blocked = programs.filter((p) => str(p, "blockedReason"));
  if (blocked.length > 0) {
    tables.push({
      wide: true,
      caption: "What is holding a programme up",
      section: "The portfolio",
      columns: ["Program", "Status", "Complete", "Blocked because"],
      rows: blocked
        .slice(0, 8)
        .map((p) => [
          str(p, "programName"),
          label(str(p, "status")),
          str(p, "pctComplete") ? `${num(p, "pctComplete")}%` : "—",
          str(p, "blockedReason"),
        ]),
      note: blocked.length > 8 ? `First 8 of ${blocked.length}.` : undefined,
    });
  }
  if (withPct.length === 0) {
    tables[0].note =
      `${tables[0].note ?? ""} No programme declares a completion percentage.`.trim();
  }
  return tables;
}

export function programFindings(programs: EstateRow[]): Finding[] {
  if (programs.length === 0) return [];
  const findings: Finding[] = [];
  // These fields describe early reported progress; this rule does not assess schedule variance.
  const onTrackButEarly = programs.filter(
    (p) =>
      /on_track|on track/i.test(str(p, "status")) &&
      str(p, "pctComplete") &&
      num(p, "pctComplete") < 10,
  );
  if (onTrackButEarly.length > 0) {
    findings.push({
      kind: "established",
      claim: `${onTrackButEarly.length} programmes report on track at under 10% complete, including ${str(onTrackButEarly[0], "programName")}.`,
      owner: "Suggested review owner: Transformation Office",
      because:
        "The recorded on-track status and completion percentage can both be true early in delivery. Completion alone is not schedule variance; a planned milestone or schedule baseline is needed to assess whether the status is supported. This rule does not establish a schedule comparison.",
      trace: {
        file: "09_programs_initiatives.csv",
        grain: "one programme",
        rule: "status is on_track AND pctComplete is under 10",
      },
      openRows: { objectType: "program_initiative", filter: "on_track" },
    });
  }
  const budget = programs.reduce((n, p) => n + num(p, "budgetUsd"), 0);
  const value = programs.reduce((n, p) => n + num(p, "expectedValueUsd"), 0);
  if (budget > 0 && value > 0) {
    const ratio = value / budget;
    findings.push({
      kind: ratio < 1.25 ? "exposure" : "established",
      claim: `${usd(budget)} of programme budget carries ${usd(value)} of expected value — a ratio of ${ratio.toFixed(2)}.`,
      owner: "Suggested review owner: Chief Strategy Officer",
      because:
        "Expected value is a forecast and budget is a commitment, so this ratio is not a return. Set against how much value has actually been attested, it is the portfolio's whole case.",
      trace: {
        file: "09_programs_initiatives.csv",
        grain: "one programme",
        rule: "sum of expectedValueUsd over sum of budgetUsd",
      },
    });
  }
  const blocked = programs.filter((p) => str(p, "blockedReason")).length;
  if (blocked > 0) {
    findings.push({
      kind: "absence",
      claim: `${blocked} programmes state a blocking reason in the portfolio.`,
      owner: "Suggested review owner: Transformation Office",
      because:
        "Each names its own blocker. Whether any of them also appears on the risk register is not something this file records.",
      trace: {
        file: "09_programs_initiatives.csv",
        grain: "one programme",
        rule: "blockedReason is not empty",
      },
    });
  }
  return findings;
}

export function aiTables(useCases: EstateRow[]): TableSpec[] {
  if (useCases.length === 0) return [];
  const byStatus = countBy(
    useCases.filter((u) => str(u, "currentStatus")),
    "currentStatus",
  );
  const validated = (rows: EstateRow[]) =>
    rows.reduce((n, u) => n + num(u, "financeValidatedValueUsd"), 0);
  const mayBook = useCases.filter((u) =>
    /^(true|yes|y)$/i.test(str(u, "realizedValueAllowed")),
  ).length;
  return [
    {
      caption: "Where each use case has got to",
      section: "AI use cases",
      columns: ["Status", "Use cases", "Validated value"],
      rows: byStatus.map((s) => [
        label(s.value),
        s.count,
        usd(
          validated(
            useCases.filter((u) => str(u, "currentStatus") === s.value),
          ),
        ),
      ]),
      total: [
        "Declared",
        byStatus.reduce((n, s) => n + s.count, 0),
        usd(validated(useCases)),
      ],
      note: useCases.some((u) => str(u, "realizedValueAllowed"))
        ? `${mayBook} of ${useCases.length} are permitted to book realized value at all; the record carries that as an explicit gate.`
        : "Whether a use case may book realized value is declared in the benefits ledger, which this view does not read.",
    },
    {
      caption: "What each is aimed at",
      section: "AI use cases",
      columns: ["Value archetype", "Use cases", "Validated value"],
      rows: countBy(
        useCases.filter((u) => str(u, "expectedValueArchetype")),
        "expectedValueArchetype",
      ).map((a) => [
        label(a.value),
        a.count,
        usd(
          validated(
            useCases.filter(
              (u) => str(u, "expectedValueArchetype") === a.value,
            ),
          ),
        ),
      ]),
      total: [
        "Declared",
        useCases.filter((u) => str(u, "expectedValueArchetype")).length,
        usd(validated(useCases)),
      ],
    },
  ];
}

export function aiFindings(useCases: EstateRow[]): Finding[] {
  if (useCases.length === 0) return [];
  const findings: Finding[] = [];
  // The booking gate and the validated value live in the benefits ledger, not the use-case file.
  // Without the column, "none may book value" and "the column is absent" are the same rows and
  // opposite claims -- so the finding only fires where the gate is actually declared.
  const gateDeclared = useCases.some((u) => str(u, "realizedValueAllowed"));
  const blockedFromBooking = gateDeclared
    ? useCases.filter(
        (u) => !/^(true|yes|y)$/i.test(str(u, "realizedValueAllowed")),
      )
    : [];
  if (blockedFromBooking.length > 0) {
    findings.push({
      kind: "absence",
      claim: `${blockedFromBooking.length} of ${useCases.length} AI use cases may not book realized value.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "The record carries an explicit gate on whether value may be claimed, and it is closed on these. That is a stated position rather than an omission, and nothing downstream reads it.",
      trace: {
        file: "10_ai_automation_use_cases.csv",
        grain: "one use case",
        rule: "realizedValueAllowed is not true",
      },
    });
  }
  const disputed = useCases.filter((u) =>
    /disput/i.test(str(u, "valueClaimStatus")),
  );
  if (disputed.length > 0) {
    findings.push({
      kind: "exposure",
      claim: `${disputed.length} use cases carry a disputed value claim.`,
      owner: "Suggested review owner: Chief Financial Officer",
      because:
        "Disputed is a stronger state than pending: someone looked and disagreed. The record names the dispute and does not name who settles it.",
      trace: {
        file: "10_ai_automation_use_cases.csv",
        grain: "one use case",
        rule: "valueClaimStatus contains disputed",
      },
    });
  }
  return findings;
}

/**
 * Reporting lines counted from the parent named on each unit.
 *
 * The record carries no span-of-control field, but it carries a parent on nearly every unit, and a
 * parent link is a structural fact rather than a reading of one. Counting them is arithmetic on the
 * record; calling the result a span of control would not be, so nothing here does.
 */
function reportingLines(units: EstateRow[]) {
  const named = new Set(units.map((u) => str(u, "orgUnit")).filter(Boolean));
  const childrenOf = new Map<string, string[]>();
  let dangling = 0;
  let parented = 0;
  for (const unit of units) {
    const child = str(unit, "orgUnit");
    const parent = str(unit, "parentOrgUnit");
    if (!child || !parent) continue;
    parented += 1;
    if (!named.has(parent)) {
      dangling += 1;
      continue;
    }
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), child]);
  }
  // A record can name a unit somewhere in its own ancestry, and a walk that trusts it never
  // returns. Carrying the path taken bounds the walk where the cycle closes instead of hanging the
  // render; a copy per branch keeps siblings from shortening one another.
  const depthBelow = (unit: string, path = new Set<string>()): number => {
    if (path.has(unit)) return 0;
    const kids = childrenOf.get(unit) ?? [];
    if (kids.length === 0) return 0;
    const walked = new Set(path).add(unit);
    return 1 + Math.max(...kids.map((kid) => depthBelow(kid, walked)));
  };
  return { childrenOf, depthBelow, dangling, parented };
}

export function organizationTables(units: EstateRow[]): TableSpec[] {
  if (units.length === 0) return [];
  const byLevel = countBy(
    units.filter((u) => str(u, "roleLevel")),
    "roleLevel",
  );

  // A measure the record does not carry must not be summed. Headcount missing on every unit sums to
  // zero, and a column printing 0 against every level says the enterprise employs nobody -- two
  // true facts, that the field is read and that every value is absent, making a false one. So a
  // measure is drawn only where some unit declares it, and the ones dropped are named underneath.
  const measures = [
    {
      field: "budgetAuthorityUsd",
      column: "Budget authority",
      name: "budget authority",
      cell: (rows: EstateRow[]) =>
        usd(rows.reduce((n, u) => n + num(u, "budgetAuthorityUsd"), 0)),
    },
    {
      field: "headcount",
      column: "Headcount",
      name: "headcount",
      cell: (rows: EstateRow[]) =>
        rows.reduce((n, u) => n + num(u, "headcount"), 0).toLocaleString(),
    },
  ];
  const shown = measures.filter((m) => units.some((u) => num(u, m.field) > 0));
  const dropped = measures.filter((m) => !shown.includes(m)).map((m) => m.name);

  const listedLevels = byLevel.slice(0, 8);
  const tables: TableSpec[] = [
    {
      caption: "Where authority sits",
      section: "Ownership",
      columns: ["Level", "Units", ...shown.map((m) => m.column)],
      barColumn: "Units",
      rows: listedLevels.map((l) => {
        const rows = units.filter((u) => str(u, "roleLevel") === l.value);
        return [label(l.value), l.count, ...shown.map((m) => m.cell(rows))];
      }),
      total: ["Declared", units.length, ...shown.map((m) => m.cell(units))],
      note:
        [
          shown.some((m) => m.field === "budgetAuthorityUsd")
            ? "Budget authority is what a unit may commit, not what it spends. The two are different numbers and the record carries only the one."
            : null,
          dropped.length > 0
            ? `No unit declares ${dropped.join(" or ")}, so ${dropped.length === 1 ? "that column is" : "those columns are"} not drawn: an absent measure summed across levels would print as zero.`
            : null,
          byLevel.length > listedLevels.length
            ? `${byLevel.length - listedLevels.length} further levels are not listed; the total counts every unit.`
            : null,
          units.length > byLevel.reduce((n, l) => n + l.count, 0)
            ? `${units.length - byLevel.reduce((n, l) => n + l.count, 0)} ${plural(units.length - byLevel.reduce((n, l) => n + l.count, 0), "unit declares", "units declare")} no level and appear only in the total.`
            : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
    },
  ];

  // How the enterprise is organised is a shape, and where the parent links are populated the shape
  // is in the record. This is the one table in the chapter that answers its first question rather
  // than describing how complete the answer is.
  const lines = reportingLines(units);
  const parents = [...lines.childrenOf.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  if (parents.length > 0) {
    const levelOf = new Map(
      units.map((u) => [str(u, "orgUnit"), str(u, "roleLevel")]),
    );
    const listed = parents.slice(0, 8);
    tables.push({
      caption: "Who reports to whom",
      section: "Ownership",
      columns: ["Unit", "Level", "Units reporting", "Levels below"],
      barColumn: "Units reporting",
      rows: listed.map(([parent, kids]) => [
        parent,
        label(levelOf.get(parent) ?? ""),
        kids.length,
        lines.depthBelow(parent),
      ]),
      total: [
        `${parents.length} ${plural(parents.length, "unit has", "units have")} reports`,
        "\u2014",
        parents.reduce((n, [, kids]) => n + kids.length, 0),
        Math.max(...parents.map(([parent]) => lines.depthBelow(parent))),
      ],
      note:
        [
          "Reporting lines are counted from the parent each unit names. The record carries no span-of-control field, so no figure here is a declared span.",
          lines.dangling > 0
            ? `${lines.dangling} ${plural(lines.dangling, "unit names", "units name")} a parent that is not itself a unit in this record.`
            : "Every parent named resolves to a unit in this record.",
          units.length - lines.parented > 0
            ? `${units.length - lines.parented} ${plural(units.length - lines.parented, "unit names", "units name")} no parent.`
            : null,
          parents.length > listed.length
            ? `${parents.length - listed.length} further units have reports and are not listed; the total counts all of them.`
            : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
    });
  }

  // What a unit is recorded as deciding, and what it owns, is the join that makes any finding
  // assignable to a person. Reporting how complete that join is matters more than listing units.
  const completeness = [
    [
      "Decision rights declared",
      units.filter((u) => str(u, "decisionRights")).length,
    ],
    [
      "Owned systems declared",
      units.filter((u) => str(u, "ownedSystems")).length,
    ],
    [
      "Owned data domains declared",
      units.filter((u) => str(u, "ownedDataDomains")).length,
    ],
    [
      "Budget authority declared",
      units.filter((u) => num(u, "budgetAuthorityUsd") > 0).length,
    ],
  ] as const;
  tables.push({
    caption: "How complete the ownership record is",
    section: "Ownership",
    columns: ["Attribute", "Units", "Share"],
    rows: completeness.map(([labelText, count]) => [
      labelText,
      count,
      `${Math.round((100 * count) / units.length)}%`,
    ]),
    total: ["All units", units.length, "100%"],
  });
  return tables;
}

export function organizationFindings(units: EstateRow[]): Finding[] {
  if (units.length === 0) return [];
  const findings: Finding[] = [];
  // A column with one value across every row is a default, not an assessment. Rendering it as a
  // clean result is two true facts -- the column exists, the value is low -- making a false one.
  for (const { field, label: fieldLabel } of [
    { field: "successionRisk", label: "succession risk" },
    { field: "spanOfControl", label: "span of control" },
  ]) {
    const values = new Set(units.map((u) => str(u, field)).filter(Boolean));
    if (values.size === 1 && units.every((u) => str(u, field))) {
      findings.push({
        kind: "absence",
        claim: `${fieldLabel} reads "${cellText([...values][0])}" for all ${units.length} org units — that is unassessed, not clean.`,
        owner: "Suggested review owner: Chief HR Officer",
        because:
          "A value that never varies carries no information. Rendering it as a result would let a reader take a form nobody completed for an assessment that came back well.",
        trace: {
          file: "02_org_ownership.csv",
          grain: "one org unit",
          rule: `${field} has one distinct value across every row`,
        },
      });
    }
  }
  // Decision rights are declared everywhere and system ownership almost nowhere, so the join that
  // would let a finding about a system reach a person mostly is not there. Declaring authority in
  // the abstract and declaring what it covers are different completions of the same record.
  const withSystems = units.filter((u) => str(u, "ownedSystems")).length;
  if (withSystems === 0) {
    // Zero is the loudest reading of this column and it was the one the rule could not reach: the
    // guard below starts at one, so a record where nobody owns anything said nothing at all.
    findings.push({
      kind: "absence",
      claim: `No org unit names a system it owns, across all ${units.length} units.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "Every unit declares what it decides and none declares which systems that covers, so no finding about a system reaches a named owner from this record alone. Ownership on this page stops at the function.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: "ownedSystems is empty on every row",
      },
    });
  } else if (withSystems < units.length / 2) {
    findings.push({
      kind: "absence",
      claim: `${withSystems} of ${units.length} org units name a system they own.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "Every unit declares what it decides, but only these say which systems that covers. A finding about a system can only reach a named owner where both halves are present.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: "ownedSystems is not empty",
      },
    });
  }

  // Authority named but never sized. A level with nine units under it and no headcount or budget
  // beside it cannot be weighed against any other, which is the comparison an operating model is
  // read for -- so the missing measure is stated rather than left as a column that is simply absent.
  const unsized = [
    { field: "headcount", name: "headcount" },
    { field: "budgetAuthorityUsd", name: "budget authority" },
  ]
    .filter((measure) => !units.some((u) => num(u, measure.field) > 0))
    .map((measure) => measure.name);
  if (unsized.length > 0) {
    findings.push({
      kind: "absence",
      claim: `No org unit declares ${unsized.join(" or ")} — authority is named here but never sized.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "Levels can be counted and compared; what sits under them cannot. Any question about where the organisation is heavy or thin has to be answered somewhere other than this record.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: `${unsized.length === 2 ? "neither field carries" : "the field carries no"} a value above zero on any row`,
      },
    });
  }

  // The reporting structure, checked as a structure. A unit reporting to a parent the record does
  // not carry is a break in the accountability chain, not a cosmetic gap: nothing above that unit
  // can be reached by walking the record.
  const lines = reportingLines(units);
  if (lines.dangling > 0) {
    findings.push({
      kind: "exposure",
      claim: `${lines.dangling} org ${plural(lines.dangling, "unit reports", "units report")} to a parent this record does not carry.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "The chain from that unit upward cannot be walked, so a finding there escalates to nobody the record can name.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: "parentOrgUnit names a unit that is not an org_unit on any row",
      },
    });
  } else if (lines.parented > 0) {
    const deepest = Math.max(
      0,
      ...[...lines.childrenOf.keys()].map((unit) => lines.depthBelow(unit)),
    );
    findings.push({
      kind: "established",
      claim: `All ${lines.parented} reporting lines resolve, ${deepest} levels deep.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "Every unit that names a parent names one the record also carries, so any unit on this page can be walked upward to whoever it answers to.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: "every parentOrgUnit matches an orgUnit; depth is the longest chain of those links",
      },
    });
  }

  const withRights = units.filter((u) => str(u, "decisionRights")).length;
  if (withRights === units.length) {
    findings.push({
      kind: "established",
      claim: `All ${units.length} org units declare what they decide.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "Named authority and owned functions on every unit. Whether that reaches a specific system depends on the ownership column above, which is a separate and much thinner record.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: "decisionRights is not empty on every row",
      },
    });
  } else if (withRights > 0) {
    findings.push({
      kind: "absence",
      claim: `${units.length - withRights} org units declare no decision rights.`,
      owner: "Suggested review owner: Chief HR Officer",
      because:
        "Without them a finding in that part of the business cannot be assigned to anyone from the record alone.",
      trace: {
        file: "02_org_ownership.csv",
        grain: "one org unit",
        rule: "decisionRights is empty",
      },
    });
  }
  return findings;
}
