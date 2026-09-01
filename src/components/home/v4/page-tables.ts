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

/**
 * The leading figure in a claim, so it can be set at the weight it deserves.
 *
 * A claim's number is the thing a reader takes away, and rendering it at sentence size makes the
 * most important quantity on the page look like the word next to it. Returns null where the claim
 * does not open on a figure, in which case the claim reads as an ordinary sentence.
 */
export function splitLeadingFigure(
  claim: string,
): { figure: string; rest: string } | null {
  const match = /^(\$?[\d][\d,.]*(?:[MBk%]|\s*of\s*\d[\d,]*)?)\s+(.+)$/.exec(
    claim,
  );
  if (!match) return null;
  return { figure: match[1], rest: match[2] };
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
  owner: string;
  because: string;
  /** The file, the rule and the grain behind the figure in the claim. A finding a reader cannot
   * reproduce is an assertion, and an assertion with an owner's name on it is worse than none. */
  trace?: { file: string; grain: string; rule: string };
  /** The rows behind the finding, openable in the record browser with a filter already applied. */
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
      owner: "Chief Information Security Officer",
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
      return {
        caption: "When the contracts end",
        section: "Commercial exposure",
        columns: ["Term ends", "Contracts", "Annual spend", "Auto-renewing"],
        rows: years.map(([year, e]) => [year, e.count, usd(e.spend), e.auto]),
        total: [
          "Total",
          contracts.length,
          usd(spend(contracts)),
          contracts.filter((c) =>
            /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
          ).length,
        ],
        note: "An auto-renewing contract passes its term end without a decision unless notice is served inside its declared window.",
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
        /^yes/i.test(str(c, "benchmarkClause")),
      );
      const without = contracts.length - withClause.length;
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
          [
            "No benchmark clause",
            without,
            usd(
              spend(
                contracts.filter(
                  (c) => !/^yes/i.test(str(c, "benchmarkClause")),
                ),
              ),
            ),
          ],
        ],
        total: ["Total", contracts.length, usd(spend(contracts))],
        note: "A benchmark clause is the contractual right to test a price against the market mid-term. Without one, the only leverage point is the renewal date.",
      };
    })(),
  ];
}

/** Year a date column falls in, or null when it does not parse. Renewal is a calendar, not a state. */
function yearOf(value: string): string | null {
  const match = /^(\d{4})-/.exec(value.trim());
  return match ? match[1] : null;
}

export function vendorFindings(
  contracts: EstateRow[],
  /** The record's own as-of date, so "already expired" is measured against the record and not the
   * clock. Omitted, the expiry finding does not fire rather than guessing a reference point. */
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
      claim: `${auto} of ${contracts.length} contracts renew without a decision being taken.`,
      owner: "Chief Procurement Officer",
      because:
        "Each carries a declared notice period, and those windows are the only points at which the commercial terms are open.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "autoRenewFlag is yes",
      },
      openRows: { objectType: "vendor_contract", filter: "yes" },
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

  const noBenchmark = contracts.filter(
    (c) => !/^yes/i.test(str(c, "benchmarkClause")),
  );
  if (noBenchmark.length > 0) {
    const spendAtRisk = noBenchmark.reduce(
      (n, c) => n + num(c, "annualSpendUsd"),
      0,
    );
    findings.push({
      kind: "absence",
      claim: `${noBenchmark.length} contracts carry no right to test their price against the market, covering ${usd(spendAtRisk)} a year.`,
      owner: "Chief Procurement Officer",
      because:
        "A benchmark clause is the only mid-term leverage there is. Without one the price stands until the renewal date, whatever the market does in between.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: "benchmarkClause does not start with yes",
      },
    });
  }

  // Contracts whose declared term has already passed against the record's own as-of date. Either
  // they renewed without a decision or the record is stale, and both are worth knowing -- but the
  // record cannot tell you which, so the finding says so rather than picking one.
  const expired = asOf
    ? contracts.filter((c) => {
        const end = str(c, "termEnd");
        return end && end < asOf;
      })
    : [];
  if (expired.length > 0) {
    const auto = expired.filter((c) =>
      /^(yes|true|y)$/i.test(str(c, "autoRenewFlag")),
    ).length;
    findings.push({
      kind: "exposure",
      claim: `${expired.length} contracts show a term end that has already passed, ${auto} of them auto-renewing.`,
      owner: "Chief Procurement Officer",
      because:
        "An auto-renewing contract past its term renewed without anyone deciding. One that is not auto-renewing and still past its term means the record has not been maintained. The dates are declared; which of the two happened is not.",
      trace: {
        file: "07_vendors_contracts.csv",
        grain: "one contract",
        rule: `termEnd is earlier than ${asOf}`,
      },
    });
  }

  // The nearest cluster of decisions still ahead. A count of contracts says nothing about when.
  const byTermYear = new Map<string, number>();
  for (const contract of contracts) {
    const year = yearOf(str(contract, "termEnd"));
    if (year && (!asOf || year >= asOf.slice(0, 4)))
      byTermYear.set(year, (byTermYear.get(year) ?? 0) + 1);
  }
  const soonest = [...byTermYear.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )[0];
  if (soonest && soonest[1] >= 5) {
    findings.push({
      kind: "absence",
      claim: `${soonest[1]} contracts reach their term end in ${soonest[0]} — the nearest cluster of renewal decisions.`,
      owner: "Chief Procurement Officer",
      because:
        "Notice periods are declared per contract and are short. A cluster of term ends in one year is a quarter of work that has to start before the earliest notice window closes.",
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
      section: "Where it runs",
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
      section: "Where it runs",
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
      section: "Where it runs",
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
      section: "Lifecycle & exposure",
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

  const criticalOnBackup = platforms.filter(
    (p) =>
      /tier1/.test(str(p, "criticality")) && /tier3/.test(str(p, "drTier")),
  ).length;
  if (criticalOnBackup > 0) {
    findings.push({
      kind: "exposure",
      claim: `${criticalOnBackup} tier-1 platforms recover from backup alone.`,
      owner: "VP Infrastructure",
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
      owner: "Chief Data Officer",
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

export function metricTables(metrics: EstateRow[]): TableSpec[] {
  if (metrics.length === 0) return [];
  const byReadiness = countBy(
    metrics.filter((m) => str(m, "claimReadiness")),
    "claimReadiness",
  );
  const blocked = metrics.filter((m) => str(m, "claimBlockedReason"));
  const withAction = blocked.filter((m) => str(m, "unblockAction"));
  const tables: TableSpec[] = [
    {
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
    },
  ];
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
  const claimable = metrics.filter((m) =>
    /claimable|ready/i.test(str(m, "claimReadiness")),
  ).length;
  const blocked = metrics.filter((m) => str(m, "claimBlockedReason"));
  const withAction = blocked.filter((m) => str(m, "unblockAction")).length;
  if (blocked.length > claimable) {
    findings.push({
      kind: "absence",
      claim: `${blocked.length} of ${metrics.length} value claims are blocked, and ${withAction} already state what would unblock them.`,
      owner: "Chief Financial Officer",
      because:
        "A finished agenda sitting in the record. Each blocked claim names its own action and target period, so the work is enumerated rather than needing to be scoped.",
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
      owner: "Chief Financial Officer",
      because:
        "An action with no date is a intention. The record distinguishes the two and nothing downstream reads that column.",
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
        risks.filter(
          (r) =>
            str(r, "riskDomain") === d.value &&
            /^(yes|true|y)$/i.test(str(r, "regulatoryDriver")),
        ).length,
      ]),
      total: [
        "Declared",
        byDomain.reduce((n, d) => n + d.count, 0),
        risks.filter((r) => /^(yes|true|y)$/i.test(str(r, "regulatoryDriver")))
          .length,
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
      owner: "Chief Risk Officer",
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
      owner: "Chief Risk Officer",
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
  // Reported status against declared progress. A programme calling itself on track at single-digit
  // completion is not a delivery fact, it is a governance one -- and it is only visible by crossing
  // two columns the record keeps apart.
  const onTrackButEarly = programs.filter(
    (p) =>
      /on_track|on track/i.test(str(p, "status")) &&
      str(p, "pctComplete") &&
      num(p, "pctComplete") < 10,
  );
  if (onTrackButEarly.length > 0) {
    findings.push({
      kind: "exposure",
      claim: `${onTrackButEarly.length} programmes report on track at under 10% complete, including ${str(onTrackButEarly[0], "programName")}.`,
      owner: "Transformation Office",
      because:
        "Status and completion are declared on the same row and disagree. Nothing in the record explains how the assessment was reached, so the judgement behind it is not written down anywhere.",
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
      owner: "Chief Strategy Officer",
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
      owner: "Transformation Office",
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
      owner: "Chief Financial Officer",
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
      owner: "Chief Financial Officer",
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
        owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
      owner: "Chief HR Officer",
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
