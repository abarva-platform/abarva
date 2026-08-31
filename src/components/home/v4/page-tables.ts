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
   * Spans the full width of the table set rather than sharing a row.
   *
   * A crosstab put in a half-width cell forces a reader sideways to reach the totals column, and
   * the totals column is where the reconciliation is -- the whole reason the table is trustworthy
   * sits in the part they have to go looking for.
   */
  wide?: boolean;
}

export type FindingKind = "exposure" | "absence" | "established";

export interface Finding {
  kind: FindingKind;
  claim: string;
  owner: string;
  because: string;
  /** The file, the rule and the grain behind the figure in the claim. A finding a reader cannot
   * reproduce is an assertion, and an assertion with an owner's name on it is worse than none. */
  trace?: { file: string; grain: string; rule: string };
}

export interface PageContent {
  tables: TableSpec[];
  findings: Finding[];
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
    return `Every cost here is modelled, not booked: all ${rows.length.toLocaleString()} rows declare a cost basis of "${only}".`;
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
export function label(value: string): string {
  if (!value) return "not declared";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
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
  for (const [key, caption] of [
    ["cloudReadiness", "Cloud readiness"],
    ["lifecycleState", "Lifecycle state"],
  ] as const) {
    const counts = countBy(
      apps.filter((a) => str(a, key)),
      key,
    );
    if (counts.length < 2) continue;
    const declared = counts.reduce((n, c) => n + c.count, 0);
    tables.push({
      caption,
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
      owner: "Chief Information Security Officer",
      because:
        "Not federated and not centrally revocable. Both facts come from the same row, so the population is exactly enumerable — and neither column alone shows it.",
      trace: {
        file: "04_applications_systems.csv",
        grain: "one application record",
        rule: "authenticationMethod is local_accounts AND dataClassification is phi",
      },
    });
  }

  const eol = apps.filter((a) => str(a, "endOfSupportDate")).length;
  if (eol > 0) {
    findings.push({
      kind: "absence",
      claim: `${eol} applications carry a declared end-of-support date.`,
      owner: "Transformation Office",
      because:
        "The record states the dates and the record states the portfolio. Nothing in either connects them, which is a gap in the plan rather than in the evidence.",
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
      owner: "Chief Financial Officer",
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
      owner: "Chief Information Officer",
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
      columns: ["Commitment", "Contracts", "Share"],
      rows: (() => {
        const auto = contracts.filter((c) =>
          /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
        ).length;
        return [
          [
            "Renews automatically",
            auto,
            `${Math.round((100 * auto) / contracts.length)}%`,
          ],
          [
            "Requires a decision",
            contracts.length - auto,
            `${Math.round((100 * (contracts.length - auto)) / contracts.length)}%`,
          ],
        ];
      })(),
      total: ["Total", contracts.length, "100%"],
      note: `Declared exit cost across the base: ${usd(contracts.reduce((n, c) => n + num(c, "exitCostUsd"), 0))}.`,
    },
  ];
}

export function vendorFindings(contracts: EstateRow[]): Finding[] {
  if (contracts.length === 0) return [];
  const findings: Finding[] = [];
  const auto = contracts.filter((c) =>
    /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
  ).length;
  if (auto > contracts.length / 2) {
    findings.push({
      kind: "exposure",
      claim: `${auto} of ${contracts.length} contracts renew without a decision being taken.`,
      owner: "Chief Procurement Officer",
      because:
        "Each carries a declared notice period, and those windows are the only points at which the commercial terms are open.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "autoRenewFlag is yes",
      },
    });
  }
  const noSystems = contracts.filter((c) => !str(c, "supportedSystems")).length;
  if (noSystems > 0) {
    findings.push({
      kind: "absence",
      claim: `${noSystems} contracts name no system they support.`,
      owner: "Chief Procurement Officer",
      because:
        "Without that link the contract cannot be traced to what it pays for, so its renewal cannot be assessed against use.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "supportedSystems is empty",
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
  ];
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
      owner: "VP Infrastructure",
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
      owner: "VP Infrastructure",
      because:
        "Declared in the record and absent from the portfolio. That is a gap in the plan, not in the evidence.",
      trace: {
        file: "06_infrastructure_platforms.csv",
        grain: "one platform",
        rule: "endOfLifeDate is not empty",
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
  ];
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
      owner: "Chief Data Officer",
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
      owner: "VP Data & AI Platforms",
      because:
        "A modernization sequence that starts anywhere else leaves the largest population untouched.",
      trace: {
        file: "05_data_assets_integrations.csv",
        grain: "one data asset or integration",
        rule: "grouped by integrationType",
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
