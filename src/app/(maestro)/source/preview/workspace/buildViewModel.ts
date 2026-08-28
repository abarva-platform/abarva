import { COL, money, pct, fmtDate } from "./viewModel";
import type {
  WorkspaceViewModel,
  EnrichedContract,
  Urgency,
} from "./viewModel";
import type { DataTableRow, DataTableColumn } from "./DataTable";
import {
  numberFromDb,
  type LeverageSignal,
} from "@/lib/source/data-model/vendor-contract-portfolio";
import { buildContractOptimizationLedger } from "@/lib/source/data-model/contract-optimization-ledger";
import { buildContractOptimizationSpine } from "@/lib/source/data-model/contract-optimization-spine";
import type { SourcingOpportunityReason } from "@/lib/source/data-model/sourcing-opportunities";
import { isReviewableContractScope } from "@/lib/source/contract-optimization-intake";

/**
 * `node-postgres` returns NUMERIC/DECIMAL columns as strings; a lone value
 * coerces fine through `money()`'s Math.abs/division, but `t + value` across
 * two or more rows silently does string concatenation instead of addition
 * (see 2026-08-03-source-numeric-string-aggregation-fix). Every raw `+`
 * accumulation in this file over a governed row's numeric field must read
 * through one of these, not `?? 0` alone.
 */
const addRowAnnualValue = (
  t: number,
  c: { row: { annual_value: number | null } },
): number => t + (numberFromDb(c.row.annual_value) ?? 0);
const addAnnualValue = (
  t: number,
  r: { annual_value: number | null },
): number => t + (numberFromDb(r.annual_value) ?? 0);
const whole = (value: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const param = (
  key: string,
  value: string | number | null | undefined,
): string => {
  if (value == null) return "";
  const text = String(value).trim();
  return text.length > 0 ? "&" + key + "=" + encodeURIComponent(text) : "";
};
const textOrNull = (value: unknown): string | null => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};
const splitList = (value: string | null | undefined): string[] =>
  (value ?? "")
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
const contractOptimizationIntakeHref = (
  contract: EnrichedContract,
  opportunityId?: string | null,
): string => {
  const query =
    param("contractId", contract.row.contract_id).replace(/^&/, "?") +
    param("opportunityId", opportunityId);
  return `/source/optimize${query}`;
};

const REASON_LABEL: Record<SourcingOpportunityReason, string> = {
  high_priority_leverage: "Weak leverage",
  notice_deadline_passed: "Notice deadline passed",
  top_concentration_vendor: "Top concentration vendor",
};
const REASON_COLOR: Record<SourcingOpportunityReason, string> = {
  high_priority_leverage: COL.amber,
  notice_deadline_passed: COL.red,
  top_concentration_vendor: COL.ink,
};

const clientFacingOpportunityText = (
  value: string | null | undefined,
): string | null => {
  if (value == null) return null;
  return value
    .replace(
      /\bfinance-confirmed realized value\b/gi,
      "Finance-confirmed outcome",
    )
    .replace(
      /\bfinance confirmed realized value\b/gi,
      "Finance-confirmed outcome",
    )
    .replace(/\brecoverable leakage\b/gi, "recoverable opportunity")
    .replace(/\brealized value\b/gi, "finance-confirmed outcome")
    .replace(/\bfinance realization\b/gi, "finance-confirmed outcome")
    .replace(/\bvalue proof\b/gi, "finance confirmation")
    .replace(/\bvalue ledgers?\b/gi, "opportunity evidence")
    .replace(/\bfour-ledger\b/gi, "opportunity evidence");
};

/**
 * Turns current UI state + the governed portfolio bundle into everything the
 * page renders. Mirrors renderVals() from the earlier illustrative build in
 * shape only — every value below traces to a real column or a real pure
 * function (vm.concentration/renewal/leverage/opportunities/scopeTiers),
 * never a recomputation of business facts in this file.
 */
export function buildViewModel(vm: WorkspaceViewModel) {
  const S = vm.state;
  const rows = vm.enrich();
  const summary = vm.summary();
  const conc = vm.concentration();
  const rec90 = vm.renewal(90);
  const rec180Fixed = vm.renewal(180);
  const opportunities = vm.opportunities();
  const scopeAll = vm.scopeTiers();
  const sel = S.sel,
    kind = sel.kind;

  const byId = new Map(rows.map((r) => [r.row.contract_id, r]));
  const selectedContractMissing =
    sel.kind === "contract" && Boolean(sel.id) && !byId.has(String(sel.id));
  const contract =
    sel.kind === "contract"
      ? sel.id
        ? (byId.get(sel.id) ?? null)
        : null
      : (rows[0] ?? null);
  const isContractMode =
    kind === "contract" && (Boolean(contract) || selectedContractMissing);
  const vendorRef =
    sel.kind === "vendor" ? sel.id : (contract?.row.vendor_ref ?? null);
  const vendorContracts = vendorRef
    ? rows.filter((c) => c.row.vendor_ref === vendorRef)
    : [];
  const vendorPortfolioRow = vendorRef ? vm.vendorRow(vendorRef) : undefined;
  const vendorConcentration = vendorRef
    ? conc.byVendor.find((r) => r.vendorRef === vendorRef)
    : undefined;
  const vendorAnnualValue =
    vendorConcentration?.annualValue ??
    numberFromDb(vendorPortfolioRow?.annual_value) ??
    vendorContracts.reduce(addRowAnnualValue, 0);
  const vendorName =
    vendorPortfolioRow?.vendor_name ??
    vendorConcentration?.vendorName ??
    vendorContracts[0]?.row.vendor_name ??
    vendorRef ??
    "";
  const vendorCat =
    vendorPortfolioRow?.vendor_category ??
    vendorContracts[0]?.row.vendor_category ??
    null;
  const vendorMaterialContractCount = vendorContracts.length;
  const vendorRollupContractCount =
    vendorPortfolioRow?.contract_count ?? vendorMaterialContractCount;
  const vendorRollupDiffers =
    vendorPortfolioRow?.contract_count != null &&
    vendorPortfolioRow.contract_count !== vendorMaterialContractCount;

  const opp =
    kind === "opportunity"
      ? (opportunities.find((o) => o.contractId === sel.id) ??
        opportunities[0] ??
        null)
      : (opportunities[0] ?? null);
  const oppContract = opp ? (byId.get(opp.contractId) ?? null) : null;

  const contractDetail = contract
    ? S.contractDetail[contract.row.contract_id]
    : undefined;
  const detail =
    contractDetail && contractDetail !== "loading" && contractDetail !== "error"
      ? contractDetail
      : null;
  const detailState: "idle" | "loading" | "ready" | "error" = !contract
    ? "idle"
    : contractDetail === "loading"
      ? "loading"
      : contractDetail === "error"
        ? "error"
        : detail
          ? "ready"
          : "idle";
  const detailSpendMonths = detail?.spendMonths ?? [];
  const detailActualAnnualSpend = detailSpendMonths.reduce(
    (sum, row) => sum + (numberFromDb(row.actual_spend) ?? 0),
    0,
  );
  const effectiveActualAnnualSpend =
    numberFromDb(contract?.row.actual_annual_spend) ??
    (detailActualAnnualSpend > 0 ? detailActualAnnualSpend : null);

  // ── explorer tree ──
  interface TreeNode {
    id: string;
    label: string;
    depth: number;
    caret: string;
    badgeCount: string;
    badgeVal: string;
    size: string;
    weight: number;
    fg: string;
    badgeColor: string;
    active: boolean;
    onClick?: () => void;
  }
  const node = (
    o: Partial<TreeNode> & { id: string; label: string },
  ): TreeNode =>
    Object.assign(
      {
        depth: 0,
        caret: "",
        badgeCount: "",
        badgeVal: "",
        size: "12.5px",
        weight: 500,
        fg: "#2c2c2a",
        badgeColor: "#888780",
        active: false,
      },
      o,
    );
  const grp = (id: string, label: string, count: string) =>
    node({
      id,
      label,
      caret: S.open[id] ? "▾" : "▸",
      size: "9.5px",
      weight: 600,
      fg: "#888780",
      badgeCount: count,
      onClick: () => vm.toggle(id),
    });
  const T: TreeNode[] = [];
  T.push(grp("vendors", "Vendors", String(summary.vendorCount)));
  if (S.open.vendors) {
    conc.byVendor.slice(0, 10).forEach((r) =>
      T.push(
        node({
          id: "vv." + r.vendorRef,
          label: r.vendorName,
          depth: 1,
          size: "12px",
          badgeVal: money(r.annualValue),
          active: kind === "vendor" && sel.id === r.vendorRef,
          onClick: () => vm.select("vendor", r.vendorRef),
        }),
      ),
    );
    T.push(
      node({
        id: "allVendors",
        label: "All supplier entities",
        depth: 1,
        caret: S.open.allVendors ? "▾" : "▸",
        badgeCount: String(vm.portfolio.vendors.length),
        onClick: () => vm.toggle("allVendors"),
      }),
    );
    if (S.open.allVendors) {
      conc.byVendor.slice(10, 30).forEach((r) =>
        T.push(
          node({
            id: "vv." + r.vendorRef,
            label: r.vendorName,
            depth: 2,
            size: "12px",
            badgeVal: money(r.annualValue),
            active: kind === "vendor" && sel.id === r.vendorRef,
            onClick: () => vm.select("vendor", r.vendorRef),
          }),
        ),
      );
    }
  }
  T.push(grp("contracts", "Contracts", String(summary.contractCount)));
  if (S.open.contracts) {
    (
      [
        [
          "Notice decisions due in 90 days",
          "win90",
          rec90.expiringWithinWindow,
        ],
        [
          "Contracts expiring in 180 days",
          "win180",
          rec180Fixed.expiringWithinWindow,
        ],
        ["Notice deadline passed", "passed", rec180Fixed.noticeDeadlinePassed],
        [
          "Weak leverage",
          "weak",
          rows.filter((c) => c.leverage.weakSignalCount >= 2).map((c) => c.row),
        ],
      ] as [
        string,
        string,
        readonly { contract_id: string; annual_value: number | null }[],
      ][]
    )
      .filter((x) => x[2].length > 0)
      .forEach((x) =>
        T.push(
          node({
            id: "c." + x[1],
            label: x[0],
            depth: 1,
            badgeCount: String(x[2].length),
            badgeVal: money(x[2].reduce(addAnnualValue, 0)),
            badgeColor: x[1] === "passed" ? COL.red : "#888780",
            active: kind === "contractList" && sel.id === x[1],
            onClick: () => vm.select("contractList", x[1]),
          }),
        ),
      );
    T.push(
      node({
        id: "allContracts",
        label: "All contract records",
        depth: 1,
        caret: S.open.allContracts ? "▾" : "▸",
        badgeCount: String(summary.contractCount),
        onClick: () => vm.toggle("allContracts"),
      }),
    );
    if (S.open.allContracts) {
      rows
        .slice()
        .sort((a, b) => (b.row.annual_value ?? 0) - (a.row.annual_value ?? 0))
        .slice(0, 10)
        .forEach((c) =>
          T.push(
            node({
              id: "cc." + c.row.contract_id,
              label: c.row.vendor_name + " · " + c.row.contract_name,
              depth: 2,
              size: "12px",
              badgeVal: money(c.row.annual_value),
              active: kind === "contract" && sel.id === c.row.contract_id,
              onClick: () => vm.select("contract", c.row.contract_id),
            }),
          ),
        );
    }
  }
  T.push(grp("ev", "Evidence", ""));
  if (S.open.ev) {
    (
      [
        ["Coverage"],
        ["Source systems"],
        ["Contract documents"],
        ["Conflicts"],
        ["Missing evidence"],
      ] as [string][]
    ).forEach((x) =>
      T.push(
        node({
          id: "ev." + x[0],
          label: x[0],
          depth: 1,
          active: kind === "evidence" && S.tabs.evidence === x[0],
          onClick: () => vm.select("evidence", null, x[0]),
        }),
      ),
    );
  }

  // Sourcing events live on their own page tree (event workflow, intake) —
  // this Workspace stays an analysis/explorer surface, not a rebuild of
  // that flow. These two entries are external navigations, not vm.select().
  T.push(grp("events", "Sourcing events", ""));
  if (S.open.events) {
    T.push(
      node({
        id: "events.dashboard",
        label: "Events dashboard",
        depth: 1,
        onClick: () => {
          window.location.href = "/source/preview/workspace";
        },
      }),
    );
    T.push(
      node({
        id: "events.new",
        label: "New event",
        depth: 1,
        onClick: () => {
          window.location.href = "/source/new";
        },
      }),
    );
    T.push(
      node({
        id: "events.optimize",
        label: "Optimize a contract",
        depth: 1,
        onClick: () => {
          window.location.href = "/source/optimize";
        },
      }),
    );
  }

  const q = S.q.trim().toLowerCase();
  const tree = T.filter((n) => !q || n.label.toLowerCase().indexOf(q) >= 0).map(
    (n) =>
      Object.assign({}, n, {
        pad: "6px 8px 6px " + (8 + n.depth * 14) + "px",
        bg: n.active ? "rgba(0,102,204,.09)" : "transparent",
        fg: n.active ? "#0a3d70" : n.fg,
        weight: n.active ? 600 : n.weight,
      }),
  );

  // ── header, tabs ──
  const TABS: Record<string, string[]> = {
    portfolio: ["Portfolio", "Explore", "Concentration & Leverage", "Renewals"],
    vendor: ["Overview", "Contracts", "Dependencies", "Opportunities"],
    contract: [
      "Story",
      "Scope",
      "Economics",
      "Performance",
      "Relationship",
      "Evidence",
      "Optimize",
    ],
    evidence: [
      "Coverage",
      "Source systems",
      "Contract documents",
      "Conflicts",
      "Missing evidence",
    ],
  };
  const tabList = TABS[kind] || [];
  const activeTab = S.tabs[kind];
  const tabs = tabList.map((t) => ({
    label: t,
    onClick: () => vm.setTab(kind, t),
    fg: activeTab === t ? "#0a0a0b" : "#5f5e5a",
    weight: activeTab === t ? 600 : 500,
    line: activeTab === t ? "#0a0a0b" : "transparent",
  }));

  const listDef: Record<string, [string, EnrichedContract[]]> = {
    win90: [
      "Notice decisions due in 90 days",
      rows.filter((c) => c.expiringWithin90),
    ],
    win180: [
      "Contracts expiring in 180 days",
      rows.filter((c) => c.expiringWithin180),
    ],
    passed: [
      "Notice deadline passed while active",
      rows.filter((c) => c.noticePassed),
    ],
    weak: [
      "Two or more weak leverage signals",
      rows.filter((c) => c.leverage.weakSignalCount >= 2),
    ],
  };
  const listRows = (listDef[sel.id || ""] || listDef.passed)[1];

  let title = "",
    thesis = "",
    crumbLabels: string[] = [];
  const v4Snapshot = vm.portfolio.v4Snapshot;
  const diagnostics = vm.portfolio.workspaceDiagnostics;
  const categoryQuality = vm.portfolio.categoryQuality;
  const v4HasPortfolio =
    v4Snapshot.executivePortfolio.contractCount > 0 ||
    v4Snapshot.contextCoverage.contracts > 0;

  if (kind === "portfolio") {
    title = (
      {
        Portfolio: "Vendor 360 cockpit: decide what moves first",
        Explore: "Explore the evidence behind the executive story",
        "Concentration & Leverage":
          "Which contracts should leadership act on first?",
        Renewals: "Which decisions are already live?",
      } as Record<string, string>
    )[activeTab];
    thesis = (
      {
        Portfolio: v4HasPortfolio
          ? "AbarVa turns the governed Source workspace into one executive decision view: verdict, action queue, top contracts, and proof layers stay visibly separated."
          : "AbarVa frames " +
            summary.vendorCount +
            " vendors and " +
            summary.contractCount +
            " contracts into a leadership agenda as of " +
            fmtDate(vm.portfolio.asOfDateIso) +
            ". Missing values stay named as missing rather than treated as zero.",
        Explore:
          "Use associative filters to reconcile contract line items, evidence state, renewal, leverage, and source-system provenance. The lower table shows the contracts in the current slice; click a row for Contract 360.",
        "Concentration & Leverage":
          "Use the spend lens to understand dependency, then the leverage lens to choose where to act. Rank alone is not a recommendation.",
        Renewals:
          rec180Fixed.noticeDeadlinePassed.length +
          " active contracts (" +
          money(rec180Fixed.noticeDeadlinePassedAnnualValue) +
          ") are past their notice deadline. " +
          rec180Fixed.expiringWithinWindow.length +
          " contracts (" +
          money(rec180Fixed.expiringWithinWindowAnnualValue) +
          ") expire inside 180 days.",
      } as Record<string, string>
    )[activeTab];
    crumbLabels = ["Source", vm.tenantName, "Executive portfolio", activeTab];
  } else if (kind === "vendor") {
    title = vendorName;
    const rank = conc.byVendor.findIndex((r) => r.vendorRef === vendorRef) + 1;
    thesis =
      money(vendorAnnualValue) +
      " of annual contract value across " +
      vendorMaterialContractCount +
      " material contract" +
      (vendorMaterialContractCount === 1 ? "" : "s") +
      " shown" +
      (rank ? " · rank " + rank + " of " + conc.byVendor.length : "") +
      ".";
    crumbLabels = [
      "Source",
      "Vendors",
      vendorCat ?? "Unresolved",
      vendorName,
      activeTab,
    ];
  } else if (kind === "contract" && contract) {
    title = contract.row.vendor_name + " · " + contract.row.contract_name;
    thesis = contract.noticePassed
      ? "Notice deadline passed while the contract remains active" +
        (contract.row.auto_renew ? " and auto-renews" : "") +
        ". Expiry " +
        fmtDate(contract.row.end_date) +
        ". " +
        money(contract.row.annual_value) +
        " annual contract value, " +
        money(effectiveActualAnnualSpend) +
        " actual spend."
      : money(contract.row.annual_value) +
        " annual contract value, " +
        money(effectiveActualAnnualSpend) +
        " actual spend. Expiry " +
        fmtDate(contract.row.end_date) +
        ".";
    crumbLabels = ["Source", "Contracts", contract.row.contract_id, activeTab];
  } else if (kind === "contract" && selectedContractMissing) {
    title = "Contract not found in governed Source rows";
    thesis =
      "The requested contract " +
      (sel.id ?? "unknown") +
      " was not returned by the active Source provider for this tenant. The workspace is withholding the contract view rather than substituting another contract.";
    crumbLabels = ["Source", "Contracts", sel.id ?? "Requested contract", "Not found"];
  } else if (kind === "opportunity" && opp) {
    title = REASON_LABEL[opp.reasons[0]] + " · " + opp.vendorName;
    thesis = opp.rationale.join(" ");
    crumbLabels = ["Source", "Opportunities", opp.contractId];
  } else if (kind === "evidence") {
    title = "Evidence and coverage";
    thesis =
      "What the read adapter actually returned for this tenant, and what it did not. Every figure elsewhere in Source resolves to a row here.";
    crumbLabels = ["Source", "Evidence", activeTab];
  } else {
    title = (listDef[sel.id || ""] || listDef.passed)[0];
    thesis =
      listRows.length +
      " contracts · " +
      money(listRows.reduce(addRowAnnualValue, 0)) +
      " annual contract value.";
    crumbLabels = ["Source", "Contracts", title];
    if (kind === "vendorList") {
      const vs = vm.portfolio.vendors.filter(
        (v) => (v.vendor_category ?? "Unresolved") === sel.id,
      );
      title = (sel.id ?? "Unresolved") + " vendors";
      thesis =
        vs.length +
        " vendors · " +
        money(vs.reduce(addAnnualValue, 0)) +
        " annual contract value.";
      crumbLabels = ["Source", "Vendors", sel.id ?? "Unresolved"];
    }
  }
  const crumbs = crumbLabels.map((l, i) => ({
    label: l,
    sep: i < crumbLabels.length - 1 ? "›" : "",
    color: i === crumbLabels.length - 1 ? "#2c2c2a" : "#888780",
  }));

  // ── value strip ──
  const vsItem = (
    label: string,
    value: string | null,
    sub: string,
    tone?: string,
  ) => ({
    label,
    value: value == null ? "Not established" : value,
    sub,
    missing: value == null,
    color: tone || "#0a0a0b",
    size: "24px",
  });
  let valueStrip: ReturnType<typeof vsItem>[] = [];
  if (kind === "contract" && selectedContractMissing) {
    valueStrip = [
      vsItem("Requested contract", sel.id ?? null, "Query parameter contractId"),
      vsItem("Governed contract rows", String(rows.length), "Rows returned by the active Source provider"),
      vsItem("Evidence state", "Withheld", "No matching contract row; no substitute row rendered", COL.red),
    ];
  } else if (kind === "contract" && contract) {
    const c = contract.row;
    valueStrip = [
      vsItem(
        "Annual contract value",
        money(c.annual_value),
        c.vendor_category ?? "",
        "annual_value",
      ),
      vsItem(
        "Actual annual spend",
        money(c.actual_annual_spend),
        c.actual_annual_spend != null && c.annual_value != null
          ? money(c.annual_value - c.actual_annual_spend) +
              " contracted-to-actual variance · cause not yet established"
          : "Not established",
      ),
      vsItem(
        "Total committed value",
        money(c.total_committed_value),
        "Across remaining term",
      ),
      vsItem(
        "Weak leverage signals",
        contract.leverage.weakSignalCount + " of 4",
        contract.leverage.isHighPriority
          ? "High priority: high spend + 2+ signals"
          : "Not flagged high priority",
        contract.leverage.weakSignalCount >= 2 ? COL.red : undefined,
      ),
      vsItem(
        "Source confidence",
        c.source_confidence != null && Number.isFinite(c.source_confidence)
          ? pct(c.source_confidence)
          : null,
        "sem.extraction_resolved",
      ),
      vsItem(
        "Scoped applications",
        c.scoped_application_count != null
          ? String(c.scoped_application_count)
          : null,
        c.critical_application_count != null
          ? String(c.critical_application_count) + " business-critical"
          : "",
      ),
      vsItem(
        "Value conflict flags",
        c.annual_value_conflict_flag || c.total_committed_value_conflict_flag
          ? "Yes"
          : "No",
        c.annual_value_conflict_flag || c.total_committed_value_conflict_flag
          ? "Resolved value differs from raw extraction"
          : "No conflict recorded",
        c.annual_value_conflict_flag || c.total_committed_value_conflict_flag
          ? COL.amber
          : undefined,
      ),
    ];
  } else if (kind === "opportunity" && opp && oppContract) {
    valueStrip = [
      vsItem(
        "Annual value exposed",
        money(opp.annualValue),
        oppContract.row.contract_id,
      ),
      vsItem(
        "Actual spend exposed",
        money(oppContract.row.actual_annual_spend),
        "From actual_annual_spend",
      ),
      vsItem(
        "Weak leverage signals",
        oppContract.leverage.weakSignalCount + " of 4",
        "computeContractLeverageSignals",
      ),
      vsItem(
        "Reasons",
        String(opp.reasons.length),
        opp.reasons.map((r) => REASON_LABEL[r]).join(", "),
      ),
    ];
  } else if (kind === "vendor") {
    const vRen = vendorContracts.filter((c) => c.expiringWithin180);
    valueStrip = [
      vsItem(
        "Annual contract value",
        money(vendorAnnualValue),
        vendorMaterialContractCount +
          " material contract" +
          (vendorMaterialContractCount === 1 ? "" : "s") +
          " shown",
      ),
      vsItem(
        "Total committed value",
        money(vendorPortfolioRow?.total_committed_value ?? null),
        "Across remaining terms",
      ),
      vsItem(
        "Auto-renewing contracts",
        String(
          vendorPortfolioRow?.auto_renew_contracts ??
            vendorContracts.filter((c) => c.row.auto_renew).length,
        ),
        "source.vendor_contract_portfolio",
      ),
      vsItem(
        "Renewal exposure",
        vRen.length ? money(vRen.reduce(addRowAnnualValue, 0)) : null,
        vRen.length
          ? vRen.length + " contracts inside 180 days"
          : "No decision inside 180 days",
        vRen.length ? COL.red : undefined,
      ),
      vsItem(
        "Weak leverage signals",
        String(
          Math.max(
            0,
            ...vendorContracts.map((c) => c.leverage.weakSignalCount),
          ),
        ),
        "Highest on any material contract",
      ),
    ];
  } else {
    valueStrip = [
      vsItem(
        "Annual contract value",
        money(
          v4HasPortfolio
            ? v4Snapshot.executivePortfolio.annualValue
            : summary.totalAnnualValue,
        ),
        (v4HasPortfolio
          ? v4Snapshot.executivePortfolio.contractCount
          : summary.contractCount) +
          " contract families · " +
          (v4HasPortfolio
            ? v4Snapshot.contextCoverage.vendors
            : summary.vendorCount) +
          " vendors",
      ),
      vsItem(
        v4HasPortfolio ? "Actual spend — 24 months" : "Actual annual spend",
        money(
          v4HasPortfolio
            ? v4Snapshot.spendConsumption.actualSpend
            : summary.totalActualAnnualSpend,
        ),
        v4HasPortfolio
          ? whole(v4Snapshot.spendConsumption.invoiceLines) +
              " invoice lines · not an annual variance"
          : summary.totalActualAnnualSpend != null &&
              summary.totalAnnualValue != null
            ? money(summary.totalAnnualValue - summary.totalActualAnnualSpend) +
              " contracted-to-actual variance · cause not yet established"
            : "Not established",
      ),
      vsItem(
        "Total committed value",
        money(
          v4HasPortfolio
            ? v4Snapshot.executivePortfolio.totalCommittedValue
            : summary.totalCommittedValue,
        ),
        v4HasPortfolio
          ? "Across V4 contract-family terms"
          : "Across all governed contracts",
      ),
      vsItem(
        "Renewal exposure ≤180d",
        money(rec180Fixed.expiringWithinWindowAnnualValue),
        rec180Fixed.expiringWithinWindow.length +
          " contracts in an open decision window",
        COL.red,
      ),
      vsItem(
        "Auto-renewing",
        String(
          v4HasPortfolio
            ? v4Snapshot.executivePortfolio.autoRenewCount
            : summary.autoRenewCount,
        ),
        "of " +
          (v4HasPortfolio
            ? v4Snapshot.executivePortfolio.contractCount
            : summary.contractCount) +
          " contracts",
      ),
    ];
  }

  const sourceV4ProofCards = [
    {
      label: "Material vendors",
      value: whole(v4Snapshot.contextCoverage.vendors),
      note: "V4 context coverage",
      source: "consumption.sourcing_context_coverage_v1",
    },
    {
      label: "Contract families",
      value: whole(v4Snapshot.executivePortfolio.contractCount),
      note: "Annual value " + money(v4Snapshot.executivePortfolio.annualValue),
      source: "source_v4_executive_portfolio",
    },
    {
      label: "Scope relationships",
      value: whole(v4Snapshot.scopeConfidence.rowCount),
      note:
        whole(v4Snapshot.scopeConfidence.explicitScopeCount) +
        " explicit · " +
        whole(v4Snapshot.scopeConfidence.inferredScopeCount) +
        " inferred",
      source: "source_v4_scope_confidence",
    },
    {
      label: "Invoice lines",
      value: whole(v4Snapshot.spendConsumption.invoiceLines),
      note:
        "24-month actual spend " +
        money(v4Snapshot.spendConsumption.actualSpend),
      source: "source_v4_spend_consumption",
    },
    {
      label: "Performance rows",
      value: whole(v4Snapshot.performanceCredits.rowCount),
      note:
        "Unclaimed credits " +
        money(v4Snapshot.performanceCredits.unclaimedCredit),
      source: "source_v4_performance_credits",
    },
    {
      label: "SaaS observations",
      value: whole(v4Snapshot.aiUsageValueProof.rowCount),
      note:
        whole(v4Snapshot.aiUsageValueProof.assignedSeats) +
        " assigned-seat observations",
      source: "source_v4_ai_usage_value_proof",
    },
    {
      label: "Cloud observations",
      value: whole(v4Snapshot.cloudOptimization.rowCount),
      note:
        "Observed overage " + money(v4Snapshot.cloudOptimization.overageAmount),
      source: "source_v4_cloud_optimization",
    },
    {
      label: "Rate-card rows",
      value: whole(v4Snapshot.workforceRateCards.rowCount),
      note:
        whole(v4Snapshot.workforceRateCards.unapprovedVarianceCount) +
        " unapproved variance exceptions",
      source: "source_v4_workforce_rate_card",
    },
    {
      label: "Sourcing-event rows",
      value: whole(v4Snapshot.sourcingEvents.rowCount),
      note:
        "Normalized response cost basis " +
        money(v4Snapshot.sourcingEvents.normalizedCost),
      source: "source_v4_sourcing_event_bafo",
    },
    {
      label: "Off-contract exposure",
      value: money(v4Snapshot.spendConsumption.offContractSpend),
      note: "Exposure, not savings",
      source: "source_v4_spend_consumption",
    },
  ];

  // ── context lens ──
  const passedN = rec180Fixed.noticeDeadlinePassed.length,
    autoN = rec180Fixed.noticeDeadlinePassedAutoRenew.length;
  const leadershipPosition = {
    whatWeKnow:
      passedN +
      " active contract" +
      (passedN === 1 ? "" : "s") +
      " — " +
      money(rec180Fixed.noticeDeadlinePassedAnnualValue) +
      " of annual value — " +
      (passedN === 1 ? "has" : "have") +
      " passed " +
      (passedN === 1 ? "its" : "their") +
      " notice window, " +
      autoN +
      " of them auto-renewing (" +
      money(rec180Fixed.noticeDeadlinePassedAutoRenewAnnualValue) +
      ").",
    whatItMeans:
      "Commercial optionality may already be reduced on these contracts for the current term.",
    valueAtStake: money(rec180Fixed.noticeDeadlinePassedAnnualValue),
    recommendedAction:
      "Confirm whether each contract rolled, identify standstill or amendment options, and prioritise the " +
      autoN +
      " auto-renewing contract" +
      (autoN === 1 ? "" : "s") +
      ".",
    evidenceRequired:
      "Notice-deadline status is derived from end_date and notice_period_days on source.contract_360; it is not asserted by a downstream narrative table.",
  };

  const coverage = (
    [
      [
        "Source V4 semantic snapshot",
        v4HasPortfolio ? ("available" as const) : ("missing" as const),
        diagnostics.datasetLabel +
          " · " +
          diagnostics.analyticsProvider +
          " · " +
          whole(diagnostics.v4ContractCount) +
          " contracts / " +
          whole(diagnostics.v4VendorCount) +
          " vendors.",
        "consumption.*",
      ],
      [
        "Vendor register",
        vm.portfolio.reads.vendors,
        summary.vendorCount + " vendors reconciled to canonical vendor_ref.",
        "source.vendor_contract_portfolio",
      ],
      [
        "Contract register",
        vm.portfolio.reads.contracts,
        summary.contractCount +
          " contracts with term, notice and renewal posture.",
        "source.contract_360",
      ],
      [
        "Category semantic quality",
        categoryQuality.qualityState === "available"
          ? ("available" as const)
          : ("missing" as const),
        categoryQuality.qualityState === "available"
          ? "effective_category can be used for grouping."
          : categoryQuality.qualityMessage,
        "semantic contract_category_quality",
      ],
      [
        "Application scope",
        vm.portfolio.reads.applicationScope,
        scopeAll.totalCount +
          " scope rows; " +
          scopeAll.explicit.length +
          " explicit, " +
          scopeAll.unresolved.length +
          " unresolved (no reference set loaded).",
        "source.contract_application_scope",
      ],
      [
        "Initiative dependencies",
        vm.portfolio.reads.initiativeDependencies,
        vm.portfolio.initiativeDependencies.length + " rows.",
        "source.contract_initiative_dependency",
      ],
      [
        "Financial exposure / operational performance / documents",
        "available" as const,
        "Fetched per contract on selection, not pre-loaded for the whole portfolio — open a contract’s Performance or Evidence tab.",
        "source.contract_financial_exposure, source.contract_operational_performance, doc.extraction",
      ],
    ] as [string, "available" | "missing", string, string][]
  ).map((x) => ({
    name: x[0],
    state: x[1] === "available" ? "Available" : "Missing",
    note: x[2],
    system: x[3],
    dot: x[1] === "available" ? COL.teal : COL.gray,
  }));

  const contextTableCols: DataTableColumn[] = [
    { label: "Layer" },
    { label: "Amount", align: "right" },
    { label: "Source" },
  ];
  const contextTableRows: DataTableRow[] = [
    {
      cells: [
        vm.cell("Active dataset", { weight: 600 }),
        vm.cell(diagnostics.datasetLabel, {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell(diagnostics.datasetId, { color: "#5f5e5a", mono: true }),
      ],
    },
    {
      cells: [
        vm.cell("Analytics provider", { weight: 600 }),
        vm.cell(diagnostics.analyticsProvider, {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell("Source V4 Cube semantic snapshot", { color: "#5f5e5a" }),
      ],
    },
    {
      cells: [
        vm.cell("Active load run", { weight: 600 }),
        vm.cell(diagnostics.activeLoadRunId ?? "Not exposed", {
          align: "right",
          mono: true,
          weight: 600,
          color: diagnostics.activeLoadRunId ? COL.ink : COL.amber,
        }),
        vm.cell("source.contract.load_run_id", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("V4 contract families / vendors", { weight: 600 }),
        vm.cell(
          whole(diagnostics.v4ContractCount) +
            " / " +
            whole(diagnostics.v4VendorCount),
          { align: "right", mono: true, weight: 600 },
        ),
        vm.cell("CubeSourceProvider", { color: "#5f5e5a", mono: true }),
      ],
    },
    {
      cells: [
        vm.cell("Explore projection contracts / vendors", { weight: 600 }),
        vm.cell(
          whole(diagnostics.legacyContractCount) +
            " / " +
            whole(diagnostics.legacyVendorCount),
          {
            align: "right",
            mono: true,
            weight: 600,
            color: diagnostics.exploreMatchesV4 ? COL.teal : COL.amber,
          },
        ),
        vm.cell(diagnostics.exploreProvider, { color: "#5f5e5a", mono: true }),
      ],
    },
    {
      cells: [
        vm.cell("Category quality gate", { weight: 600 }),
        vm.cell(
          categoryQuality.qualityState === "available"
            ? "Available"
            : "Withheld",
          {
            align: "right",
            mono: true,
            weight: 600,
            color:
              categoryQuality.qualityState === "available"
                ? COL.teal
                : COL.amber,
          },
        ),
        vm.cell(
          whole(categoryQuality.affectedRows) +
            " affected rows · " +
            money(categoryQuality.affectedAnnualValue),
          { color: "#5f5e5a" },
        ),
      ],
    },
    {
      cells: [
        vm.cell("Vendors under contract", { weight: 600 }),
        vm.cell(String(summary.vendorCount), {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell("source.vendor_contract_portfolio", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Contracts and SOWs", { weight: 600 }),
        vm.cell(String(summary.contractCount), {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell("source.contract_360", { color: "#5f5e5a", mono: true }),
      ],
    },
    {
      cells: [
        vm.cell("Annual contract value", { weight: 600 }),
        vm.cell(money(summary.totalAnnualValue), {
          align: "right",
          mono: true,
          weight: 600,
          color: COL.ink,
        }),
        vm.cell("source.contract_360.annual_value", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Actual annual spend", { weight: 600 }),
        vm.cell(money(summary.totalActualAnnualSpend), {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell("source.contract_360.actual_annual_spend", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Application scope rows", { weight: 600 }),
        vm.cell(String(scopeAll.totalCount), {
          align: "right",
          mono: true,
          weight: 600,
          color: COL.amber,
        }),
        vm.cell("source.contract_application_scope", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Auto-renewing contracts", { weight: 600 }),
        vm.cell(String(summary.autoRenewCount), {
          align: "right",
          mono: true,
          weight: 600,
          color: COL.amber,
        }),
        vm.cell("source.contract_360.auto_renew", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Decisions inside 180 days", { weight: 600 }),
        vm.cell(money(rec180Fixed.expiringWithinWindowAnnualValue), {
          align: "right",
          mono: true,
          weight: 600,
          color: COL.red,
        }),
        vm.cell("computeRenewalExposure(180)", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Notice deadlines passed", { weight: 600 }),
        vm.cell(money(rec180Fixed.noticeDeadlinePassedAnnualValue), {
          align: "right",
          mono: true,
          weight: 600,
          color: COL.red,
        }),
        vm.cell("computeRenewalExposure(180)", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Deterministic sourcing opportunities", { weight: 600 }),
        vm.cell(String(opportunities.length), {
          align: "right",
          mono: true,
          weight: 600,
          color: COL.blue,
        }),
        vm.cell("computeSourcingOpportunities", {
          color: "#5f5e5a",
          mono: true,
        }),
      ],
    },
  ];

  // ── concentration lens (annual_value only — the sole governed
  // concentration measure; no measure toggle, see fixture audit) ──────────
  const pareto = vm.pareto();
  const topCols: DataTableColumn[] = [
    { label: "Rank" },
    { label: "Vendor" },
    { label: "Category" },
    { label: "Contracts", align: "right" },
    { label: "Annual value", align: "right" },
    { label: "Share", align: "right" },
    { label: "Cumulative", align: "right" },
  ];
  const topRows: DataTableRow[] = conc.byVendor.slice(0, 10).map((r, i) => {
    const vp = vm.vendorRow(r.vendorRef);
    return {
      onClick: () => vm.select("vendor", r.vendorRef),
      cells: [
        vm.cell(String(i + 1), { mono: true, color: "#888780" }),
        vm.cell(r.vendorName, { weight: 600 }),
        vm.cell(vp?.vendor_category ?? "Unresolved", { color: "#5f5e5a" }),
        vm.cell(String(vp?.contract_count ?? "—"), {
          align: "right",
          mono: true,
        }),
        vm.cell(money(r.annualValue), {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell(pct(r.shareOfTotal), {
          align: "right",
          mono: true,
          color: "#5f5e5a",
        }),
        vm.cell(pct(r.cumulativeShare), {
          align: "right",
          mono: true,
          color: COL.blue,
        }),
      ],
    };
  });
  const concStrips = (() => {
    const top10 = new Set(conc.byVendor.slice(0, 10).map((r) => r.vendorRef));
    const defs: {
      id: string;
      label: string;
      note: string;
      match: (c: EnrichedContract) => boolean;
    }[] = [
      {
        id: "weak",
        label: "High concentration + weak leverage",
        note: "Top-ten vendor with 2+ weak leverage signals.",
        match: (c) => c.leverage.weakSignalCount >= 2,
      },
      {
        id: "renewal",
        label: "High concentration + approaching renewal",
        note: "Top-ten vendor with a contract inside 180 days.",
        match: (c) => c.expiringWithin180,
      },
      {
        id: "passed",
        label: "High concentration + notice passed",
        note: "Top-ten vendor with a notice deadline already passed.",
        match: (c) => c.noticePassed,
      },
    ];
    return defs.map((def) => {
      const matches = rows.filter(
        (c) => top10.has(c.row.vendor_ref) && def.match(c),
      );
      const seen = new Set<string>();
      const vendors = matches
        .filter((c) =>
          seen.has(c.row.vendor_ref)
            ? false
            : (seen.add(c.row.vendor_ref), true),
        )
        .map((c) => ({
          name: c.row.vendor_name,
          ref: c.row.vendor_ref,
          onClick: () => vm.select("vendor", c.row.vendor_ref),
        }));
      const isSel = S.concStrip === def.id;
      return {
        id: def.id,
        label: def.label,
        note: def.note,
        vendors,
        vendorCount: vendors.length,
        contractCount: matches.length,
        value: money(matches.reduce(addRowAnnualValue, 0)),
        selected: isSel,
        bg: isSel ? "#0a0a0b" : "#fff",
        fg: isSel ? "#fff" : "#0a0a0b",
        onClick: () => vm.setState({ concStrip: isSel ? null : def.id }),
      };
    });
  })();

  // ── renewals lens ──
  const windowBtns = (
    [
      [90, "90 days"],
      [180, "180 days"],
      [365, "365 days"],
    ] as [number, string][]
  ).map((w) => ({
    label: w[1],
    onClick: () => vm.setState({ window: w[0] }),
    bg: S.window === w[0] ? "#0a0a0b" : "#fff",
    fg: S.window === w[0] ? "#fff" : "#5f5e5a",
    border: S.window === w[0] ? "#0a0a0b" : "rgba(10,10,11,.16)",
  }));
  const tl = vm.timeline(rows);
  const urgLegend = (
    ["urgent", "action_required", "prepare", "monitor"] as Urgency[]
  ).map((u) => ({ label: vm.urgLabel(u), color: vm.urgColor(u) }));
  const reconCards = [
    {
      label: "Notice deadline passed, contract active",
      value: String(rec180Fixed.noticeDeadlinePassed.length),
      sub:
        money(rec180Fixed.noticeDeadlinePassedAnnualValue) +
        " annual value · " +
        rec180Fixed.noticeDeadlinePassedAutoRenew.length +
        " auto-renewing",
      color: COL.red,
    },
    {
      label: "Expiring inside 180 days",
      value: String(rec180Fixed.expiringWithinWindow.length),
      sub: money(rec180Fixed.expiringWithinWindowAnnualValue) + " annual value",
      color: COL.amber,
    },
    {
      label: "Expiring inside 90 days",
      value: String(rec90.expiringWithinWindow.length),
      sub: money(rec90.expiringWithinWindowAnnualValue) + " annual value",
      color: COL.amber,
    },
    {
      label: "Auto-renewing under management",
      value: String(summary.autoRenewCount),
      sub: "Governed count across " + summary.contractCount + " contracts",
      color: COL.ink,
    },
  ];
  const passedCols: DataTableColumn[] = [
    { label: "Vendor" },
    { label: "Contract" },
    { label: "Id" },
    { label: "Annual value", align: "right" },
    { label: "Actual spend", align: "right" },
    { label: "Notice deadline", align: "right" },
    { label: "Expiry", align: "right" },
    { label: "Renewal" },
    { label: "Weak signals", align: "center" },
    { label: "Urgency" },
  ];
  const passedRows = vm.contractTableRows(rows.filter((c) => c.noticePassed));

  // ── leverage lens ──
  const mx = vm.matrix(rows);
  const highLeverageRows = rows.filter((c) => c.leverage.weakSignalCount >= 2);
  const quadPanel = mx.quads.map((q) => {
    const yMax = Math.max(
      20,
      ...rows.map((c) => (c.row.annual_value ?? 0) / 1_000_000),
    );
    const inQ = rows.filter((c) => {
      const av = (c.row.annual_value ?? 0) / 1_000_000,
        high = av >= yMax * 0.3;
      return q.id === "renegotiate"
        ? c.leverage.weakSignalCount >= 2 && high
        : q.id === "benchmark"
          ? c.leverage.weakSignalCount < 2 && high
          : q.id === "consolidate"
            ? c.leverage.weakSignalCount >= 2 && !high
            : c.leverage.weakSignalCount < 2 && !high;
    });
    return {
      id: q.id,
      label: q.label,
      action: q.action,
      count: inQ.length,
      value: money(inQ.reduce(addRowAnnualValue, 0)),
      selected: S.quadrant === q.id,
      bg: S.quadrant === q.id ? "#0a0a0b" : "#fff",
      fg: S.quadrant === q.id ? "#fff" : "#0a0a0b",
      onClick: q.onClick,
      items: inQ.slice(0, 4).map((c) => ({
        label: c.row.vendor_name + " · " + c.row.contract_name,
        value: money(c.row.annual_value),
        onClick: () => vm.select("contract", c.row.contract_id),
      })),
    };
  });
  const leverageRowsForQuadrant = (quadrantId: string | null) => {
    const yMax = Math.max(
      20,
      ...rows.map((c) => (c.row.annual_value ?? 0) / 1_000_000),
    );
    if (!quadrantId) return highLeverageRows;
    return rows.filter((c) => {
      const annualValueM = (c.row.annual_value ?? 0) / 1_000_000;
      const highExposure = annualValueM >= yMax * 0.3;
      return quadrantId === "renegotiate"
        ? c.leverage.weakSignalCount >= 2 && highExposure
        : quadrantId === "benchmark"
          ? c.leverage.weakSignalCount < 2 && highExposure
          : quadrantId === "consolidate"
            ? c.leverage.weakSignalCount >= 2 && !highExposure
            : c.leverage.weakSignalCount < 2 && !highExposure;
    });
  };
  const leverageSelectedRows = leverageRowsForQuadrant(S.quadrant).sort(
    (a, b) => (b.row.annual_value ?? 0) - (a.row.annual_value ?? 0),
  );
  const leverageRowsTitle = S.quadrant
    ? `${quadPanel.find((q) => q.id === S.quadrant)?.action ?? "Selected quadrant"} — contract register`
    : "Two-or-more weak leverage signals — contract register";
  const leverageCols: DataTableColumn[] = [
    { label: "Vendor" },
    { label: "Contract" },
    { label: "Id" },
    { label: "Annual value", align: "right" },
    { label: "Actual spend", align: "right" },
    { label: "Weak signals", align: "center" },
    { label: "Benchmark right" },
    { label: "Alternatives" },
    { label: "Dependency note" },
    { label: "Expiry", align: "right" },
  ];
  const leverageRows = leverageSelectedRows.map((c) => ({
    key: c.row.contract_id,
    onClick: () => vm.select("contract", c.row.contract_id),
    cells: [
      vm.cell(c.row.vendor_name, { weight: 700 }),
      vm.cell(c.row.contract_name),
      vm.cell(c.row.contract_id, { mono: true }),
      vm.cell(money(c.row.annual_value), {
        mono: true,
        align: "right",
        weight: 700,
      }),
      vm.cell(money(c.row.actual_annual_spend), { mono: true, align: "right" }),
      vm.cell(`${c.leverage.weakSignalCount} of 4`, {
        mono: true,
        align: "center",
        color: c.leverage.weakSignalCount >= 2 ? COL.red : COL.teal,
      }),
      vm.cell(c.row.benchmarking_clause ?? "Not verified"),
      vm.cell(c.row.alternatives_available ?? "Not assessed"),
      vm.cell(c.row.concentration_note ?? "No dependency note"),
      vm.cell(fmtDate(c.row.end_date), { align: "right" }),
    ],
  }));
  const renegotiateQuadrant = quadPanel.find((q) => q.id === "renegotiate");
  const signalDefs = (
    [
      "benchmarking",
      "alternatives",
      "skill_dependency",
      "regional_dependency",
    ] as LeverageSignal[]
  ).map((s) => ({
    id: s,
    label: vm.signalLabel(s),
    count:
      String(rows.filter((c) => c.leverage.weakSignals[s]).length) +
      " of " +
      rows.length,
  }));

  // ── opportunities lens ──
  const oppGroups = (
    [
      "high_priority_leverage",
      "notice_deadline_passed",
      "top_concentration_vendor",
    ] as SourcingOpportunityReason[]
  ).map((reason) => {
    const items = opportunities.filter((o) => o.reasons.includes(reason));
    return {
      label: REASON_LABEL[reason],
      color: REASON_COLOR[reason],
      count: items.length,
      value: items.length
        ? money(
            items.reduce((t, o) => t + (numberFromDb(o.annualValue) ?? 0), 0),
          )
        : "—",
      items: items.map((o) => ({
        ref: o.contractId,
        vendor: o.vendorName,
        name: o.contractName,
        why: o.rationale.join(" "),
        exposed: money(o.annualValue),
        onClick: () => vm.select("opportunity", o.contractId),
      })),
    };
  });
  const oppCols: DataTableColumn[] = [
    { label: "Contract" },
    { label: "Vendor" },
    { label: "Reasons" },
    { label: "Annual value exposed", align: "right" },
  ];
  const oppRows: DataTableRow[] = opportunities.map((o) => ({
    onClick: () => vm.select("opportunity", o.contractId),
    cells: [
      vm.cell(o.contractName, { wrap: true }),
      vm.cell(o.vendorName, { weight: 600 }),
      vm.cell(o.reasons.map((r) => REASON_LABEL[r]).join(", "), {
        color: "#5f5e5a",
        wrap: true,
      }),
      vm.cell(money(o.annualValue), {
        align: "right",
        mono: true,
        weight: 600,
      }),
    ],
  }));

  // ── agenda lens — narrative generated live from real aggregates, not a
  // hand-authored findings table ──────────────────────────────────────────
  const findings = [
    {
      ref: "F-1",
      dot: COL.amber,
      headline:
        highLeverageRows.length +
        " contracts carry two or more weak leverage signals",
      observed:
        "Together worth " +
        money(highLeverageRows.reduce(addRowAnnualValue, 0)) +
        " of annual value. The signals come from benchmark rights, supplier alternatives, concentration dependency, and renewal mechanics.",
      why: "This is the shortest list of contracts where procurement has something concrete to improve or validate.",
      response:
        "Start the executive review with the leverage lens and open the contract register below the matrix.",
    },
    {
      ref: "F-2",
      dot: COL.blue,
      headline:
        "Top ten vendors hold " +
        pct(conc.topNShare(10)) +
        " of annual contract value",
      observed:
        conc.byVendor
          .slice(0, 3)
          .map((v) => v.vendorName)
          .join(", ") + " are the three largest by annual value.",
      why: "Concentration describes dependency, not exposure — cross-reference with the leverage matrix before treating rank alone as risk.",
      response:
        "Manage concentration through the leverage matrix rather than a spend ranking.",
    },
    {
      ref: "F-3",
      dot: COL.teal,
      headline:
        opportunities.length +
        " deterministic sourcing opportunities identified",
      observed:
        "Each opportunity is tied to a named contract and reason. Missing evidence is carried as missing, not converted into savings.",
      why: "Each opportunity states its reasons and rationale explicitly; none carries an invented readiness or confidence label.",
      response: "Work the opportunity list in annual-value order.",
    },
    {
      ref: "F-4",
      dot: passedN > 0 ? COL.red : COL.gray,
      headline:
        passedN > 0
          ? passedN + " contracts need notice-window follow-up"
          : "No active contract is past notice in the current as-of cut",
      observed:
        passedN > 0
          ? "At the governed as-of date, " +
            passedN +
            " active contracts totalling " +
            money(rec180Fixed.noticeDeadlinePassedAnnualValue) +
            " are past the contractual notice window."
          : "Renewal timing is not the primary trigger in this cut; commercial leverage and evidence readiness drive the first conversation.",
      why:
        passedN > 0
          ? "A missed notice window can remove negotiating optionality for the current term."
          : "A zero-result check is still useful, but it should not lead the story.",
      response:
        passedN > 0
          ? "Confirm the renewal position on each contract this month."
          : "Use the renewals tab only when the discussion is specifically about timing.",
    },
  ];
  const homeVerdict = {
    eyebrow: "Portfolio verdict",
    headline:
      highLeverageRows.length +
      " contracts (" +
      money(highLeverageRows.reduce(addRowAnnualValue, 0)) +
      ") carry weak leverage signals.",
    body:
      "Start with the leverage lens, not a spend ranking. The strongest action bucket is " +
      (renegotiateQuadrant?.action ?? "Build alternatives and renegotiate") +
      ": " +
      (renegotiateQuadrant?.count ?? 0) +
      " contracts, " +
      (renegotiateQuadrant?.value ?? "Not established") +
      " annual value.",
    nextAction:
      "Open Concentration & Leverage and work the top-right quadrant before treating concentration alone as risk.",
  };
  const homeStorySteps = [
    {
      id: "01",
      label: "Why now",
      value: highLeverageRows.length + " weak-leverage contracts",
      note: "Action is triggered by commercial optionality, not page traffic.",
    },
    {
      id: "02",
      label: "Where money sits",
      value: pct(conc.topNShare(10)) + " in top ten vendors",
      note: "Concentration explains dependency; it is not the recommendation by itself.",
    },
    {
      id: "03",
      label: "Where to act",
      value: (renegotiateQuadrant?.count ?? 0) + " renegotiation candidates",
      note: "The leverage lens turns spend into an action queue.",
    },
    {
      id: "04",
      label: "What to prove",
      value: opportunities.length + " sourced opportunities",
      note: "Evidence gaps stay explicit until contract, invoice, SLA or finance proof arrives.",
    },
  ];
  const journeys = [
    {
      id: "A",
      eyebrow: "Path A · optimize an existing contract",
      title: "Select a contract and build a fact-based renewal strategy",
      narrative:
        "Use the governed register to build a renewal, renegotiation or optimization strategy on a contract already held.",
      cta: "Select a contract to optimize",
      onClick: () => vm.select("contractList", "weak"),
      primary: true,
    },
  ];
  const portfolioLensButtons = (
    [
      [
        "leverage",
        "By leverage",
        "Show action buckets and the contracts to renegotiate first.",
      ],
      ["spend", "By spend", "Show vendor concentration and dependency shape."],
    ] as const
  ).map(([id, label, note]) => ({
    id,
    label,
    note,
    selected: S.portfolioLens === id,
    bg: S.portfolioLens === id ? "#0a0a0b" : "#fff",
    fg: S.portfolioLens === id ? "#fff" : "#2c2c2a",
    border: S.portfolioLens === id ? "#0a0a0b" : "rgba(10,10,11,.16)",
    onClick: () => vm.setState({ portfolioLens: id }),
  }));

  // ── list / saved views ──
  const listCols: DataTableColumn[] = [
    { label: "Vendor" },
    { label: "Contract" },
    { label: "Id" },
    { label: "Annual value", align: "right" },
    { label: "Actual spend", align: "right" },
    { label: "Notice deadline", align: "right" },
    { label: "Expiry", align: "right" },
    { label: "Renewal" },
    { label: "Weak signals", align: "center" },
    { label: "Urgency" },
  ];
  const vendorCols: DataTableColumn[] = [
    { label: "Vendor" },
    { label: "Category" },
    { label: "Contracts", align: "right" },
    { label: "Annual contract value", align: "right" },
    { label: "Total committed", align: "right" },
    { label: "Auto-renewing", align: "right" },
  ];
  const vendorListRows: DataTableRow[] = vm.portfolio.vendors
    .filter((v) => (v.vendor_category ?? "Unresolved") === sel.id)
    .sort((a, b) => (b.annual_value ?? 0) - (a.annual_value ?? 0))
    .map((v) => ({
      onClick: () => vm.select("vendor", v.vendor_ref),
      cells: [
        vm.cell(v.vendor_name, { weight: 600 }),
        vm.cell(v.vendor_category ?? "Unresolved", { color: "#5f5e5a" }),
        vm.cell(String(v.contract_count), { align: "right", mono: true }),
        vm.cell(money(v.annual_value), {
          align: "right",
          mono: true,
          weight: 600,
        }),
        vm.cell(money(v.total_committed_value), {
          align: "right",
          mono: true,
          color: "#5f5e5a",
        }),
        vm.cell(String(v.auto_renew_contracts), { align: "right", mono: true }),
      ],
    }));

  // ── vendor canvas ──
  const vendorStats = [
    {
      label: "Portfolio rank",
      value:
        (conc.byVendor.findIndex((r) => r.vendorRef === vendorRef) + 1 || "—") +
        " of " +
        conc.byVendor.length,
    },
    {
      label: "Share of annual contract value",
      value: vendorConcentration ? pct(vendorConcentration.shareOfTotal) : "—",
    },
    {
      label: "Material contracts shown",
      value: String(vendorMaterialContractCount),
    },
    ...(vendorRollupDiffers
      ? [
          {
            label: "Rollup contract families",
            value: String(vendorRollupContractCount),
          },
        ]
      : []),
    {
      label: "Auto-renewing",
      value: String(
        vendorPortfolioRow?.auto_renew_contracts ??
          vendorContracts.filter((c) => c.row.auto_renew).length,
      ),
    },
    {
      label: "Next contract end date",
      value: vendorPortfolioRow?.next_end_date
        ? fmtDate(vendorPortfolioRow.next_end_date)
        : "Not established",
    },
  ];
  const vendorContractRows = vm.contractTableRows(vendorContracts);
  const vendorComposition = (() => {
    const max = Math.max(
      ...vendorContracts.map((c) => c.row.annual_value ?? 0),
      1,
    );
    return vendorContracts
      .slice()
      .sort((a, b) => (b.row.annual_value ?? 0) - (a.row.annual_value ?? 0))
      .map((c) => ({
        id: c.row.contract_id,
        name: c.row.contract_name,
        acvPct: ((c.row.annual_value ?? 0) / max) * 100,
        spendPct: ((c.row.actual_annual_spend ?? 0) / max) * 100,
        acv: money(c.row.annual_value),
        spend: money(c.row.actual_annual_spend),
        renewalExposed: c.expiringWithin180,
        renewalLabel: c.expiringWithin180
          ? money(c.row.annual_value) + " inside 180 days"
          : "No decision inside 180 days",
        autoRenew: c.row.auto_renew,
        urgColor: vm.urgColor(c.urgency),
        onClick: () => vm.select("contract", c.row.contract_id),
      }));
  })();
  const vendorDependencyMap = buildVendorDependencyMap(
    vm,
    vendorRef,
    vendorName,
    vendorCat,
    vendorContracts,
  );
  const vendorOpps = opportunities
    .filter((o) => o.vendorName === vendorName)
    .map((o) => ({
      ref: o.contractId,
      exposed: money(o.annualValue),
      why: o.rationale.join(" "),
      reasons: o.reasons.map((r) => REASON_LABEL[r]).join(", "),
      onClick: () => vm.select("opportunity", o.contractId),
    }));

  // ── contract canvas ──
  const c = contract?.row ?? null;
  const evidenceOverview = detail?.evidenceOverview ?? null;
  const evidenceScope = detail?.evidenceScope ?? [];
  const evidencePricing = detail?.evidencePricing ?? [];
  const evidencePerformance = detail?.evidencePerformance ?? null;
  const performancePeriods = detail?.performancePeriods ?? [];
  const spendMonths = detail?.spendMonths ?? [];
  const opportunitySet = detail?.optimizationOpportunitySet ?? null;
  const cVm = c
    ? {
        id: c.contract_id,
        vendor: c.vendor_name,
        name: c.contract_name,
        cat: c.vendor_category ?? "Unresolved",
        acv: money(c.annual_value),
        spend: money(effectiveActualAnnualSpend),
        actualAnnualSpendUsd: effectiveActualAnnualSpend,
        committed: money(c.total_committed_value),
        expiry: fmtDate(c.end_date),
        notice:
          contract && contract.noticeDate
            ? fmtDate(contract.noticeDate.toISOString())
            : "No notice term",
        noticeDays:
          c.notice_period_days != null
            ? c.notice_period_days + " days"
            : "Not established",
        auto: c.auto_renew ? "Yes — renews unless notice is served" : "No",
        urgency: contract ? vm.urgLabel(contract.urgency) : "",
        urgColor: contract ? vm.urgColor(contract.urgency) : COL.gray,
        noticePassed: contract?.noticePassed ?? false,
        role: c.renewal_owner_ref ?? "Not assigned",
        evidence:
          c.source_confidence != null && Number.isFinite(c.source_confidence)
            ? pct(c.source_confidence) + " source confidence"
            : "Not established",
        scopedApplicationCount: c.scoped_application_count ?? null,
        scopeSummary:
          textOrNull(evidenceOverview?.contract_english_overview) ??
          (isReviewableContractScope(c.scope_summary)
            ? c.scope_summary
            : "Contract scope has not been extracted yet. Load the executed agreement, SOW or order form scope schedule, and application/service ownership extract before treating scope coverage as known."),
        businessFunctions: splitList(
          evidenceOverview?.business_functions_supported,
        ),
        systemsServices: splitList(
          evidenceOverview?.systems_services_supported,
        ),
        overviewSource: textOrNull(evidenceOverview?.source_system)
          ? `${evidenceOverview?.source_system}${evidenceOverview?.source_file_report ? " · " + evidenceOverview.source_file_report : ""}`
          : null,
        refreshFrequency:
          evidenceOverview?.refresh_frequency ??
          evidencePerformance?.refresh_frequency ??
          null,
        performancePeriods,
        spendMonths,
      }
    : null;
  const termRows = c
    ? (
        [
          ["Contract identifier", c.contract_id, "contract_id"],
          [
            "Vendor category",
            c.vendor_category ?? "Unresolved",
            "vendor_category",
          ],
          ["End date", fmtDate(c.end_date), "end_date"],
          [
            "Notice period",
            c.notice_period_days != null
              ? c.notice_period_days + " days"
              : "Not established",
            "notice_period_days",
          ],
          ["Auto-renew", c.auto_renew ? "Yes" : "No", "auto_renew"],
          [
            "Benchmarking clause",
            c.benchmarking_clause ?? "Not verified",
            "benchmarking_clause",
          ],
          [
            "Alternatives available",
            c.alternatives_available ?? "Not assessed",
            "alternatives_available",
          ],
          [
            "Exit rights",
            c.exit_rights_summary ?? "Not verified in indexed evidence",
            "exit_rights_summary",
          ],
          [
            "Concentration note",
            c.concentration_note ?? "None recorded",
            "concentration_note",
          ],
          [
            "Renewal owner",
            c.renewal_owner_ref ?? "Not assigned",
            "renewal_owner_ref",
          ],
          [
            "Renewal decision state",
            c.renewal_decision_state ?? "Not recorded",
            "renewal_decision_state",
          ],
        ] as [string, string, string][]
      ).map((t) => ({ label: t[0], value: t[1], field: t[2] }))
    : [];
  const econBars = c
    ? [
        {
          label: "Contracted annual value",
          value: money(c.annual_value),
          pct: 100,
          color: "#0a0a0b",
        },
        {
          label: "Actual annual spend",
          value: money(c.actual_annual_spend),
          pct: c.annual_value
            ? ((c.actual_annual_spend ?? 0) / c.annual_value) * 100
            : 0,
          color: "#3d6ea8",
        },
        {
          label: "Contracted-to-actual variance",
          value:
            c.annual_value != null && c.actual_annual_spend != null
              ? money(c.annual_value - c.actual_annual_spend)
              : "Not established",
          pct:
            c.annual_value && c.actual_annual_spend != null
              ? Math.max(
                  0,
                  ((c.annual_value - c.actual_annual_spend) / c.annual_value) *
                    100,
                )
              : 0,
          color: COL.amber,
        },
      ]
    : [];
  const fallbackScopeRows: DataTableRow[] = c
    ? vm
        .scopeTiers(c.contract_id)
        .unresolved.concat(
          vm.scopeTiers(c.contract_id).explicit,
          vm.scopeTiers(c.contract_id).vendorInferred,
        )
        .map((a) => ({
          cells: [
            vm.cell(a.application_name, { weight: 600, wrap: true }),
            vm.cell(a.business_function ?? "Not established", {
              color: "#5f5e5a",
            }),
            vm.cell(a.criticality ?? "Not established", { align: "center" }),
            vm.cell(a.lifecycle_state ?? "Not established", {
              color: "#5f5e5a",
            }),
            vm.cell(a.hosting_model ?? "Not established", { color: "#5f5e5a" }),
            vm.cell(
              a.annual_run_cost != null
                ? money(a.annual_run_cost)
                : "Not established",
              { align: "right", mono: true },
            ),
            vm.cell(a.modernization_plan ?? "Not established", {}),
          ],
        }))
    : [];
  const evidenceScopeRows: DataTableRow[] = evidenceScope.map((a) => ({
    cells: [
      vm.cell(
        a.application_name ?? a.application_ref ?? "Unspecified scope item",
        {
          weight: 700,
          wrap: true,
          sub: a.service_or_platform_component ?? undefined,
        },
      ),
      vm.cell(a.business_function ?? "Not established", {
        color: "#5f5e5a",
        wrap: true,
      }),
      vm.cell(a.criticality ?? "Not established", { align: "center" }),
      vm.cell(
        a.annual_run_cost_usd != null
          ? money(numberFromDb(a.annual_run_cost_usd))
          : "Not established",
        { align: "right", mono: true },
      ),
      vm.cell((a.relationship_method ?? "evidence").replace(/_/g, " "), {
        color: "#5f5e5a",
      }),
      vm.cell(a.source_file_report ?? a.source_system ?? "Not established", {
        color: "#5f5e5a",
        wrap: true,
      }),
    ],
  }));
  const scopeRows = evidenceScopeRows.length
    ? evidenceScopeRows
    : fallbackScopeRows;
  const scopeCols: DataTableColumn[] = evidenceScopeRows.length
    ? [
        { label: "Scope item" },
        { label: "Function" },
        { label: "Criticality", align: "center" },
        { label: "Annual run cost", align: "right" },
        { label: "Evidence method" },
        { label: "Source" },
      ]
    : [
        { label: "Application" },
        { label: "Business function" },
        { label: "Criticality", align: "center" },
        { label: "Lifecycle" },
        { label: "Hosting" },
        { label: "Annual run cost", align: "right" },
        { label: "Modernisation" },
      ];
  const pricingRows: DataTableRow[] = evidencePricing.map((line) => ({
    cells: [
      vm.cell(
        line.line_item_description ??
          line.sku_or_service_code ??
          line.line_item_id ??
          "Pricing line",
        { weight: 700, wrap: true, sub: line.sku_or_service_code ?? undefined },
      ),
      vm.cell(line.spend_driver ?? "Not established", { color: "#5f5e5a" }),
      vm.cell(
        line.quantity_or_commitment != null
          ? String(line.quantity_or_commitment)
          : "Not established",
        { align: "right", mono: true },
      ),
      vm.cell(line.unit_of_measure ?? "Not established", { color: "#5f5e5a" }),
      vm.cell(
        line.unit_price_usd != null
          ? money(numberFromDb(line.unit_price_usd))
          : "Not established",
        { align: "right", mono: true },
      ),
      vm.cell(
        line.annual_value_usd != null
          ? money(numberFromDb(line.annual_value_usd))
          : "Not established",
        { align: "right", mono: true },
      ),
      vm.cell(
        line.source_file_report ?? line.evidence_source ?? "Not established",
        { color: "#5f5e5a", wrap: true },
      ),
    ],
  }));
  const pricingCols: DataTableColumn[] = [
    { label: "Commercial line" },
    { label: "Driver" },
    { label: "Qty", align: "right" },
    { label: "Unit" },
    { label: "Unit price", align: "right" },
    { label: "Annual value", align: "right" },
    { label: "Source" },
  ];
  const scopeTierCounts = c ? vm.scopeTiers(c.contract_id) : null;

  const weakFlags = contract
    ? (Object.keys(contract.leverage.weakSignals) as LeverageSignal[]).map(
        (s) => ({
          label: vm.signalLabel(s),
          on: contract.leverage.weakSignals[s],
          color: contract.leverage.weakSignals[s] ? COL.red : COL.teal,
          mark: contract.leverage.weakSignals[s] ? "Weak signal" : "No signal",
        }),
      )
    : [];
  const weakCount = contract
    ? contract.leverage.weakSignalCount + " of 4"
    : "0 of 4";

  const progRows = c
    ? vm.initiativesFor(c.contract_id).map((p) => ({
        name: p.initiative_project_name,
        status: p.status ?? "Not recorded",
        note:
          p.major_risk_constraint ??
          p.decision_needed ??
          "No risk or decision recorded",
        color: p.major_risk_constraint ? COL.amber : COL.teal,
      }))
    : [];
  const hasProg = progRows.length > 0;

  // ── Optimization tab — real levers derived from the same weak-signal
  // flags the matrix uses; scenarios are structural (hold / renegotiate /
  // recompete), never sized until real evidence backs a number. ──────────
  const optLevers = contract
    ? [
        {
          label: "Commercial",
          items: [
            contract.leverage.weakSignals.benchmarking
              ? "Negotiate a benchmark or market-test right into the next term"
              : "Invoke the existing benchmark clause before the notice date",
            "Re-base the rate card against current market rates",
          ],
        },
        {
          label: "Leverage",
          items: [
            contract.leverage.weakSignals.alternatives
              ? "Build a credible alternatives shortlist before the notice date"
              : "Use existing alternatives to support a competitive renewal",
            contract.leverage.weakSignals.skill_dependency ||
            contract.leverage.weakSignals.regional_dependency
              ? "Address the concentration_note dependency (" +
                (c?.concentration_note ?? "") +
                ") before renewal"
              : "No specialised-skill or regional dependency flagged",
          ],
        },
        {
          label: "Governance",
          items: [
            "Confirm the renewal_owner_ref is current",
            "Record the renewal decision in renewal_decision_state once made",
          ],
        },
      ]
    : [];
  const optScenarios = contract
    ? [
        {
          name: "Hold and renew as-is",
          pos: "Term rolls on current pricing and service levels.",
          risk:
            "Locks the current leverage position for another term; " +
            (contract.row.auto_renew
              ? "happens by default if no notice is served."
              : "forfeits the notice window."),
          tone: COL.red,
          rec: false,
        },
        {
          name: "Renegotiate with market evidence",
          pos: "Re-base rates, add or invoke a benchmark right.",
          risk: "Requires evidence in place before the notice date.",
          tone: COL.teal,
          rec: contract.leverage.weakSignalCount < 3,
        },
        {
          name: "Recompete the scope",
          pos: "Take the scope to market with the governed baseline as the starting point.",
          risk: contract.leverage.weakSignals.alternatives
            ? "Few credible alternatives on record."
            : "Alternatives are on record; transition risk is more manageable.",
          tone: contract.leverage.weakSignals.alternatives
            ? COL.amber
            : COL.teal,
          rec: contract.leverage.weakSignalCount >= 3,
        },
      ]
    : [];
  const optLedger = contract
    ? buildContractOptimizationLedger({
        view: detail,
        contract: contract.row,
        leverage: contract.leverage,
      })
    : null;
  const optSpine = contract
    ? buildContractOptimizationSpine({
        contract: contract.row,
        contracts: vm.portfolio.contracts,
        leverageEntries: vm.leverage(),
        ledger: optLedger,
        asOfDateIso: vm.portfolio.asOfDateIso,
      })
    : null;
  const optLedgerView = optLedger
    ? {
        headline:
          clientFacingOpportunityText(optLedger.headline) ?? optLedger.headline,
        quantifiedLeakage:
          optLedger.quantifiedLeakageUsd > 0
            ? money(optLedger.quantifiedLeakageUsd)
            : "Not quantified",
        realizedValue:
          optLedger.realizedValueUsd > 0
            ? money(optLedger.realizedValueUsd)
            : "Not established",
        evidenceReady: String(optLedger.evidenceReadyCount),
        evidenceGaps: String(optLedger.evidenceGapCount),
        lines: optLedger.lines.map((line) => ({
          id: line.id,
          kind: line.kind,
          label: line.label,
          amountUsd: line.amountUsd,
          amount:
            line.amountUsd == null ? "Not established" : money(line.amountUsd),
          state: (
            {
              quantified: "Quantified",
              needs_evidence: "Needs evidence",
              workflow_required: "Workflow required",
              not_established: "Not established",
            } as const
          )[line.state],
          tone:
            line.state === "quantified"
              ? COL.teal
              : line.state === "workflow_required"
                ? COL.amber
                : line.state === "needs_evidence"
                  ? COL.red
                  : COL.gray,
          evidenceClass: (
            {
              system_evidenced: "SYSTEM EVIDENCED",
              document_evidenced: "DOCUMENT EVIDENCED",
              human_validated: "HUMAN VALIDATED",
              inferred: "INFERRED",
              missing: "MISSING",
            } as const
          )[line.evidenceClass],
          evidenceTone: (
            {
              system_evidenced: COL.teal,
              document_evidenced: "#3d6ea8",
              human_validated: "#246b45",
              inferred: COL.amber,
              missing: COL.red,
            } as const
          )[line.evidenceClass],
          evidence: clientFacingOpportunityText(line.evidence) ?? line.evidence,
          nextAction:
            clientFacingOpportunityText(line.nextAction) ?? line.nextAction,
          sourceRefs: line.sourceRefs,
          lineageFields: line.lineageFields,
        })),
      }
    : null;
  const optSpineView = optSpine
    ? {
        selected: optSpine.selected
          ? {
              rank: "#" + optSpine.selected.rank,
              rankNumber: optSpine.selected.rank,
              band: optSpine.selected.band,
              score: String(optSpine.selected.score),
              action: optSpine.selected.action,
              annualValue: money(optSpine.selected.annualValue),
              reasons: optSpine.selected.reasons.map((reason) => ({
                kind: reason.kind,
                label: reason.label,
                detail: reason.detail,
                sourceRef: reason.sourceRef,
                role: reason.role,
                tone:
                  reason.tone === "strong"
                    ? COL.teal
                    : reason.tone === "warning"
                      ? COL.amber
                      : reason.tone === "missing"
                        ? COL.red
                        : COL.slate,
                points: String(reason.points),
              })),
            }
          : null,
        topCandidates: optSpine.topCandidates.map((candidate) => ({
          rank: "#" + candidate.rank,
          label: candidate.vendorName + " · " + candidate.contractName,
          value: money(candidate.annualValue),
          score: String(candidate.score),
          band: candidate.band,
          selected: candidate.contractId === contract?.row.contract_id,
          onClick: () => vm.select("contract", candidate.contractId),
        })),
        sourceConnections: optSpine.sourceConnections.map((connection) => ({
          id: connection.id,
          sourceSystem: connection.sourceSystem,
          examples: connection.examples.join(" · "),
          extract: connection.extract,
          evidenceClasses: connection.evidenceClasses,
          ledgers: connection.ledgers.map(
            (ledger) =>
              ({
                recoverable_leakage: "Recoverable opportunity",
                avoided_cost: "Avoidable opportunity",
                negotiated_improvement: "Negotiable improvement",
                realized_value: "Finance-confirmed outcome",
              })[ledger],
          ),
          fields: connection.fields,
          outcome: connection.outcome,
        })),
        missingEvidenceSources: optSpine.missingEvidenceSources.map(
          (requirement) => ({
            lineId: requirement.lineId,
            lineLabel: requirement.lineLabel,
            nextAction: requirement.nextAction,
            ask: requirement.ask,
            connections: requirement.connections.map((connection) => ({
              id: connection.id,
              sourceSystem: connection.sourceSystem,
              examples: connection.examples.join(" · "),
              extract: connection.extract,
              fields: connection.fields.slice(0, 6),
              outcome: connection.outcome,
            })),
          }),
        ),
        story: optSpine.contractStory,
        missingEvidenceStory: optSpine.missingEvidenceStory,
      }
    : null;
  const opportunityView = opportunitySet
    ? (() => {
        const selected =
          opportunitySet.opportunities.find(
            (opportunity) =>
              opportunity.opportunityId ===
              opportunitySet.selectedOpportunityId,
          ) ??
          opportunitySet.opportunities[0] ??
          null;
        const fmtStage = (stage: string) =>
          stage
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        const fmtGrade = (grade: string) =>
          grade
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        const stageTone = (stage: string) =>
          stage === "validated" || stage === "finance_confirmed"
            ? COL.teal
            : stage === "baseline_conflict" || stage === "evidence_required"
              ? COL.red
              : stage === "approval_required" ||
                  stage === "target_position" ||
                  stage === "workflow_required"
                ? COL.amber
                : "#3d6ea8";
        const amount = (value: number | null | undefined) =>
          value == null ? "Not sized" : money(value);
        const opportunityMoney = (
          valueType: string,
          emptyLabel = "Not established",
        ) => {
          const typed = opportunitySet.opportunities.filter(
            (opportunity) => opportunity.valueType === valueType,
          );
          if (typed.length === 0) return emptyLabel;
          const valued = typed.filter(
            (opportunity) =>
              opportunity.amountUsd != null &&
              Number.isFinite(opportunity.amountUsd),
          );
          if (valued.length === 0) return "Not sized";
          return money(
            valued.reduce(
              (total, opportunity) => total + (opportunity.amountUsd ?? 0),
              0,
            ),
          );
        };
        const totalOpportunityMoney = () => {
          const valued = opportunitySet.opportunities.filter(
            (opportunity) =>
              opportunity.amountUsd != null &&
              Number.isFinite(opportunity.amountUsd),
          );
          if (valued.length === 0) return "Not sized";
          return money(
            valued.reduce(
              (total, opportunity) => total + (opportunity.amountUsd ?? 0),
              0,
            ),
          );
        };
        const financeConfirmed =
          opportunitySet.financeRealizations.length > 0
            ? money(
                opportunitySet.financeRealizations.reduce(
                  (total, item) => total + item.amountUsd,
                  0,
                ),
              )
            : "Not established";
        const sourceRefs =
          selected?.evidenceRefs
            .map((ref) =>
              [
                ref.tableName,
                ref.sourceRecordId,
                ref.sourceFileReport,
                ref.pageSpan,
              ]
                .filter(Boolean)
                .join(" · "),
            )
            .filter(Boolean) ?? [];
        const selectedLines = selected?.calculation?.lines ?? [];
        const displayOpportunityLabel = (
          opportunity: (typeof opportunitySet.opportunities)[number],
        ) =>
          opportunity.opportunityId.endsWith(":rate-variance")
            ? "Invoice billing-rate variance"
            : opportunity.label;
        const displayOpportunityShortLabel = (
          opportunity: (typeof opportunitySet.opportunities)[number],
        ) =>
          opportunity.opportunityId.endsWith(":rate-variance")
            ? "Invoice billing-rate variance"
            : opportunity.shortLabel;
        return {
          contractId: opportunitySet.contractId,
          recommendation: opportunitySet.recommendation,
          recommendationDetail: opportunitySet.recommendationDetail,
          actionState: fmtStage(opportunitySet.actionState),
          baseline: {
            status: opportunitySet.baseline.status,
            headline: opportunitySet.baseline.headline,
            detail: opportunitySet.baseline.detail,
            annualValue: amount(opportunitySet.baseline.annualValueUsd),
            pricingScheduleValue: amount(
              opportunitySet.baseline.pricingScheduleAnnualValueUsd,
            ),
            actualSpend: amount(opportunitySet.baseline.actualAnnualSpendUsd),
            committedValue: amount(
              opportunitySet.baseline.totalCommittedValueUsd,
            ),
            conflictAmount:
              opportunitySet.baseline.conflictAmountUsd == null
                ? null
                : money(Math.abs(opportunitySet.baseline.conflictAmountUsd)),
          },
          potential: {
            recoverable: opportunityMoney("recoverable_leakage"),
            avoidable: opportunityMoney("avoided_cost"),
            negotiable: opportunityMoney("negotiable_improvement"),
            total: totalOpportunityMoney(),
          },
          financeConfirmed,
          evidenceRequirements: opportunitySet.evidenceRequirements.map(
            (requirement) =>
              clientFacingOpportunityText(requirement) ?? requirement,
          ),
          selectedOpportunityId: selected?.opportunityId ?? null,
          selectedOpportunity: selected
            ? {
                id: selected.opportunityId,
                label: displayOpportunityLabel(selected),
                shortLabel: displayOpportunityShortLabel(selected),
                valueType: fmtStage(selected.valueType),
                amount: amount(selected.amountUsd),
                amountUsd: selected.amountUsd,
                stage: fmtStage(selected.stage),
                stageRaw: selected.stage,
                grade: fmtGrade(selected.evidenceGrade),
                tone: stageTone(selected.stage),
                confidence:
                  selected.confidence == null
                    ? "Not established"
                    : pct(selected.confidence),
                owner: selected.owner ?? "Not assigned",
                deadline: selected.deadline
                  ? fmtDate(selected.deadline)
                  : "No deadline",
                nextAction:
                  clientFacingOpportunityText(selected.nextAction) ??
                  selected.nextAction,
                blockingGap: clientFacingOpportunityText(selected.blockingGap),
                narrative:
                  clientFacingOpportunityText(selected.narrative) ??
                  selected.narrative,
                approvalState: fmtStage(selected.approvalState),
                overlapTreatment:
                  clientFacingOpportunityText(selected.overlapTreatment) ??
                  selected.overlapTreatment,
                sourceRefs,
                calculation: selected.calculation
                  ? {
                      ruleId: selected.calculation.ruleId,
                      ruleVersion: selected.calculation.ruleVersion,
                      formula: selected.calculation.formula,
                      eligibleQuantity: whole(
                        selected.calculation.eligibleQuantity,
                      ),
                      billedRate: amount(selected.calculation.billedRateUsd),
                      contractRate: amount(
                        selected.calculation.contractRateUsd,
                      ),
                      approvedExceptions: amount(
                        selected.calculation.approvedExceptionsUsd,
                      ),
                      calculatedAmount: amount(
                        selected.calculation.calculatedAmountUsd,
                      ),
                      includedLineCount: selected.calculation.includedLineCount,
                      excludedLineCount: selected.calculation.excludedLineCount,
                      pendingLineCount: selected.calculation.pendingLineCount,
                    }
                  : null,
              }
            : null,
          opportunities: opportunitySet.opportunities.map((opportunity) => ({
            id: opportunity.opportunityId,
            label: displayOpportunityLabel(opportunity),
            shortLabel: displayOpportunityShortLabel(opportunity),
            valueType: fmtStage(opportunity.valueType),
            amount: amount(opportunity.amountUsd),
            amountUsd: opportunity.amountUsd,
            stage: fmtStage(opportunity.stage),
            stageRaw: opportunity.stage,
            grade: fmtGrade(opportunity.evidenceGrade),
            tone: stageTone(opportunity.stage),
            owner: opportunity.owner ?? "Not assigned",
            deadline: opportunity.deadline
              ? fmtDate(opportunity.deadline)
              : "No deadline",
            blockingGap: clientFacingOpportunityText(opportunity.blockingGap),
            nextAction:
              clientFacingOpportunityText(opportunity.nextAction) ??
              opportunity.nextAction,
            sourceRefs: opportunity.evidenceRefs
              .map((ref) =>
                [
                  ref.tableName,
                  ref.sourceRecordId,
                  ref.sourceFileReport,
                  ref.pageSpan,
                ]
                  .filter(Boolean)
                  .join(" · "),
              )
              .filter(Boolean),
            selected: opportunity.opportunityId === selected?.opportunityId,
          })),
          calculationLines: selectedLines.map((line) => ({
            lineId: line.lineId,
            invoiceId: line.invoiceId ?? "Not established",
            invoiceLineId: line.invoiceLineId ?? "Not established",
            servicePeriod: line.servicePeriod ?? "Not established",
            skuOrService: line.skuOrService ?? "Not established",
            quantity:
              line.quantity == null ? "Not established" : whole(line.quantity),
            quantityBasis: line.quantityBasis,
            unitOfMeasure: line.unitOfMeasure ?? "Not established",
            billedRate: amount(line.billedRateUsd),
            contractRate: amount(line.contractRateUsd),
            amount: amount(line.amountUsd),
            inclusion: fmtStage(line.inclusion),
            inclusionRaw: line.inclusion,
            inclusionReason:
              clientFacingOpportunityText(line.inclusionReason) ??
              line.inclusionReason,
            pricingScheduleRef: line.pricingScheduleRef ?? "Not established",
            contractTermRef: line.contractTermRef ?? "Not established",
            amendmentRef: line.amendmentRef ?? "Not established",
            sourceRefs: line.sourceRefs
              .map((ref) =>
                [
                  ref.tableName,
                  ref.sourceRecordId,
                  ref.sourceFileReport,
                  ref.pageSpan,
                ]
                  .filter(Boolean)
                  .join(" · "),
              )
              .filter(Boolean),
          })),
          financeRealizations: opportunitySet.financeRealizations.map(
            (item) => ({
              id: item.realizationId,
              amount: money(item.amountUsd),
              basis: clientFacingOpportunityText(item.basis) ?? item.basis,
              confirmationDate: item.confirmationDate
                ? fmtDate(item.confirmationDate)
                : "Not established",
              owner: item.owner ?? "Not assigned",
              towerClaimRefs: item.towerClaimRefs,
              linkedOpportunityIds: item.linkedOpportunityIds,
            }),
          ),
        };
      })()
    : null;
  const optLaunch = c ? S.optimizationLaunch[c.contract_id] : undefined;
  const optCtaLabel =
    optLaunch?.status === "loading"
      ? "Opening optimization..."
      : optLaunch?.status === "error"
        ? "Retry contract optimization"
        : "Start / continue optimization";
  const optCtaError =
    optLaunch?.status === "error"
      ? (optLaunch.message ?? "Could not start optimization workflow.")
      : null;
  const optCtaHref = contract
    ? contractOptimizationIntakeHref(
        contract,
        opportunityView?.selectedOpportunityId ?? null,
      )
    : null;
  const recAction = opportunityView
    ? opportunityView.recommendation
    : opp &&
        oppContract &&
        contract &&
        oppContract.row.contract_id === contract.row.contract_id
      ? REASON_LABEL[opp.reasons[0]] + " — see sourcing opportunity"
      : contract && contract.leverage.weakSignalCount >= 2
        ? "Weak leverage — build alternatives and renegotiate"
        : contract?.noticePassed
          ? "Notice passed — confirm renewal position"
          : "Monitor — no deterministic opportunity flag on this contract";
  const recWhy =
    opportunityView?.recommendationDetail ??
    opportunities
      .find((o) => o.contractId === contract?.row.contract_id)
      ?.rationale.join(" ") ??
    "No sourcing-opportunity rule has flagged this contract at the governed as-of date.";

  // ── opportunity canvas ──
  const o = opp
    ? {
        ref: opp.contractId,
        vendor: opp.vendorName,
        name: opp.contractName,
        why: opp.rationale.join(" "),
        reasons: opp.reasons.map((r) => REASON_LABEL[r]),
        annualValue: money(opp.annualValue),
        role: oppContract?.row.renewal_owner_ref ?? "Not assigned",
      }
    : null;
  const oppLevers = oppContract
    ? [
        {
          label: "Commercial",
          items: [
            oppContract.leverage.weakSignals.benchmarking
              ? "Negotiate a benchmark right into the next term"
              : "Invoke the existing benchmark clause",
            "Re-base the rate card against current market rates",
          ],
        },
        {
          label: "Leverage",
          items: [
            oppContract.leverage.weakSignals.alternatives
              ? "Build a credible alternatives shortlist"
              : "Use existing alternatives to support negotiation",
          ],
        },
      ]
    : [];
  const oppScenarios = oppContract
    ? [
        {
          name: "Hold and renew as-is",
          pos: "Term rolls on current pricing.",
          risk: "Locks the current position.",
          tone: COL.red,
          rec: false,
        },
        {
          name: "Renegotiate with market evidence",
          pos: "Re-base rates, add a benchmark right.",
          risk: "Requires evidence before the notice date.",
          tone: COL.teal,
          rec: true,
        },
      ]
    : [];

  // ── evidence canvas ──
  const covCols: DataTableColumn[] = [
    { label: "Domain" },
    { label: "State" },
    { label: "Note" },
    { label: "Source" },
  ];
  const covRows: DataTableRow[] = coverage.map((cc) => ({
    cells: [
      vm.cell(cc.name, { weight: 600 }),
      vm.cell(cc.state, { weight: 600, color: cc.dot }),
      vm.cell(cc.note, { color: "#5f5e5a", wrap: true }),
      vm.cell(cc.system, { mono: true, color: "#5f5e5a", wrap: true }),
    ],
  }));
  const sysCols: DataTableColumn[] = [
    { label: "Source system" },
    { label: "Rows for this tenant", align: "right" },
    { label: "State" },
  ];
  const sysRows: DataTableRow[] = [
    {
      cells: [
        vm.cell("source.contract_360", { mono: true }),
        vm.cell(String(vm.portfolio.contracts.length), {
          align: "right",
          mono: true,
        }),
        vm.cell(
          vm.portfolio.reads.contracts === "available"
            ? "Available"
            : "Missing",
          {
            weight: 600,
            color:
              vm.portfolio.reads.contracts === "available"
                ? COL.teal
                : COL.gray,
          },
        ),
      ],
    },
    {
      cells: [
        vm.cell("source.vendor_contract_portfolio", { mono: true }),
        vm.cell(String(vm.portfolio.vendors.length), {
          align: "right",
          mono: true,
        }),
        vm.cell(
          vm.portfolio.reads.vendors === "available" ? "Available" : "Missing",
          {
            weight: 600,
            color:
              vm.portfolio.reads.vendors === "available" ? COL.teal : COL.gray,
          },
        ),
      ],
    },
    {
      cells: [
        vm.cell("source.contract_application_scope", { mono: true }),
        vm.cell(String(vm.portfolio.applicationScope.length), {
          align: "right",
          mono: true,
        }),
        vm.cell(
          vm.portfolio.reads.applicationScope === "available"
            ? "Available"
            : "Missing",
          {
            weight: 600,
            color:
              vm.portfolio.reads.applicationScope === "available"
                ? COL.teal
                : COL.gray,
          },
        ),
      ],
    },
    {
      cells: [
        vm.cell("source.contract_initiative_dependency", { mono: true }),
        vm.cell(String(vm.portfolio.initiativeDependencies.length), {
          align: "right",
          mono: true,
        }),
        vm.cell(
          vm.portfolio.reads.initiativeDependencies === "available"
            ? "Available"
            : "Missing",
          {
            weight: 600,
            color:
              vm.portfolio.reads.initiativeDependencies === "available"
                ? COL.teal
                : COL.gray,
          },
        ),
      ],
    },
  ];
  const conflictRows: DataTableRow[] = vm.portfolio.contracts
    .filter(
      (r) =>
        r.annual_value_conflict_flag || r.total_committed_value_conflict_flag,
    )
    .map((r) => ({
      onClick: () => vm.select("contract", r.contract_id),
      cells: [
        vm.cell(r.contract_id, { mono: true, weight: 600 }),
        vm.cell(r.vendor_name, {}),
        vm.cell(
          r.annual_value_conflict_flag
            ? "annual_value"
            : "total_committed_value",
          { mono: true, color: COL.blue },
        ),
        vm.cell(
          r.resolved_annual_value != null
            ? money(r.resolved_annual_value)
            : "Not resolved",
          { align: "right", mono: true },
        ),
        vm.cell("Open", { weight: 600, color: COL.amber }),
      ],
    }));
  const conflictCols: DataTableColumn[] = [
    { label: "Contract" },
    { label: "Vendor" },
    { label: "Conflicting field" },
    { label: "Resolved value", align: "right" },
    { label: "State" },
  ];
  const missingRows: DataTableRow[] = [
    {
      cells: [
        vm.cell("Explicit application-scope reference set", {
          weight: 600,
          wrap: true,
        }),
        vm.cell("All " + scopeAll.totalCount + " scope rows", {}),
        vm.cell(
          "Every application relationship stays unresolved rather than tiered",
          { color: "#5f5e5a", wrap: true },
        ),
        vm.cell("No (contract_id, application_ref) reference set loaded", {
          color: "#5f5e5a",
          wrap: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Financial exposure / operational performance", {
          weight: 600,
          wrap: true,
        }),
        vm.cell("All contracts, portfolio-wide", {}),
        vm.cell("Not pre-loaded — fetched per contract on selection", {
          color: "#5f5e5a",
          wrap: true,
        }),
        vm.cell("Would require per-contract fan-out at page load", {
          color: "#5f5e5a",
          wrap: true,
        }),
      ],
    },
    {
      cells: [
        vm.cell("Document evidence (doc.extraction)", {
          weight: 600,
          wrap: true,
        }),
        vm.cell("All contracts, portfolio-wide", {}),
        vm.cell("Not pre-loaded — fetched per contract on selection", {
          color: "#5f5e5a",
          wrap: true,
        }),
        vm.cell("Same reason as above", { color: "#5f5e5a", wrap: true }),
      ],
    },
  ];
  const missingCols: DataTableColumn[] = [
    { label: "Missing evidence" },
    { label: "Extent" },
    { label: "Consequence in Source" },
    { label: "Reason" },
  ];

  // ── Ask aVa (AgentDock surfaceContext/suggestedActions — real chat, not a canned answer) ──
  const availableV4Lenses = v4Snapshot.availability
    .filter((slice) => slice.state === "available")
    .map((slice) => slice.lensId);
  const unavailableV4Lenses = v4Snapshot.availability
    .filter((slice) => slice.state !== "available")
    .map((slice) => ({ lensId: slice.lensId, state: slice.state }));
  const sourceWorkspaceActiveTab =
    kind === "contract"
      ? `Contract 360 / ${activeTab ?? "Story"}`
      : kind === "vendor"
        ? `Vendor 360 / ${activeTab ?? "Overview"}`
        : kind === "evidence"
          ? `Evidence / ${activeTab ?? "Coverage"}`
          : `Portfolio / ${activeTab ?? "Portfolio"}`;
  const sourceWorkspacePageFacts = [
    `Source Workspace is reading governed ${v4Snapshot.datasetLabel} data as of ${fmtDate(v4Snapshot.asOfDateIso)}.`,
    `Portfolio totals: ${v4Snapshot.executivePortfolio.contractCount} contracts, ${v4Snapshot.contextCoverage.vendors} vendors, ${money(v4Snapshot.executivePortfolio.annualValue)} annual contract value, ${money(v4Snapshot.executivePortfolio.totalCommittedValue)} total committed value.`,
    `Top-10 vendor concentration is ${pct(conc.topNShare(10))}; category-clean value coverage is ${pct(categoryQuality.categoryCleanValuePct)}.`,
    `When a user asks for a chart, table, trend, or graph, answer with concise prose plus structured exhibits where the cited rows support it; never print raw JSON or code fences.`,
  ];
  const sourceWorkspaceVendorFacts =
    kind === "vendor"
      ? [
          `Selected vendor: ${vendorName}; category ${vendorCat ?? "not classified"}.`,
          `Vendor portfolio: ${vendorStats.map((stat) => `${stat.label} ${stat.value}`).join("; ")}.`,
          `Material contracts visible: ${vendorContracts
            .slice(0, 6)
            .map(
              (row) =>
                `${row.row.contract_id} ${row.row.contract_name} annual ${money(row.row.annual_value)} actual ${money(row.row.actual_annual_spend)}`,
            )
            .join(" | ")}.`,
        ]
      : kind === "contract" && c
        ? [
            `Selected contract: ${c.contract_id} ${c.vendor_name} - ${c.contract_name}.`,
            `Contract economics: annual ${money(c.annual_value)}, actual annual spend ${money(c.actual_annual_spend)}, committed ${money(c.total_committed_value)}, contracted-to-actual variance ${c.annual_value != null && c.actual_annual_spend != null ? money(c.annual_value - c.actual_annual_spend) : "not established"}.`,
            `Contract timing: end ${fmtDate(c.end_date)}, notice ${contract?.noticeDate ? fmtDate(contract.noticeDate.toISOString()) : "not established"}, notice period ${c.notice_period_days ?? "not established"} days, auto-renew ${c.auto_renew ? "yes" : "no"}, renewal owner ${c.renewal_owner_ref ?? "not assigned"}.`,
            `Contract scope summary: ${cVm?.scopeSummary ?? "scope not loaded"}.`,
            `Scope coverage: ${scopeRows.length} application or service-scope rows visible for this contract.`,
          ]
        : [];
  const sourceWorkspaceLedgerFacts = optLedgerView
    ? [
        `Optimization evidence headline: ${optLedgerView.headline}`,
        `Opportunity evidence status: ${optLedgerView.quantifiedLeakage} recoverable opportunity, ${optLedgerView.realizedValue} finance-confirmed outcome, ${optLedgerView.evidenceReady} ready lines, ${optLedgerView.evidenceGaps} evidence gaps.`,
        ...optLedgerView.lines.map(
          (line) =>
            `${line.label}: ${line.amount}; state ${line.state}; evidence ${line.evidenceClass}; evidence note ${line.evidence}; next action ${line.nextAction}; source refs ${line.sourceRefs.join(", ") || "not established"}.`,
        ),
      ]
    : [];
  const sourceWorkspaceOpportunityFacts = opportunityView
    ? [
        `Opportunity recommendation: ${opportunityView.recommendation} ${opportunityView.recommendationDetail}`,
        `Commercial baseline: ${opportunityView.baseline.headline} ${opportunityView.baseline.detail}`,
        `Potential value is separated from finance confirmation: ${opportunityView.potential.recoverable} recoverable, ${opportunityView.potential.avoidable} avoidable, ${opportunityView.potential.negotiable} negotiable, ${opportunityView.financeConfirmed} finance-confirmed.`,
        ...opportunityView.opportunities.map(
          (opportunity) =>
            `${opportunity.label}: ${opportunity.amount}; stage ${opportunity.stage}; evidence ${opportunity.grade}; owner ${opportunity.owner}; next action ${opportunity.nextAction}; blocking gap ${opportunity.blockingGap ?? "none"}.`,
        ),
        ...(opportunityView.selectedOpportunity?.calculation
          ? [
              `Selected opportunity calculation: ${opportunityView.selectedOpportunity.label}; rule ${opportunityView.selectedOpportunity.calculation.ruleId}; formula ${opportunityView.selectedOpportunity.calculation.formula}; amount ${opportunityView.selectedOpportunity.calculation.calculatedAmount}; included ${opportunityView.selectedOpportunity.calculation.includedLineCount}, pending ${opportunityView.selectedOpportunity.calculation.pendingLineCount}, excluded ${opportunityView.selectedOpportunity.calculation.excludedLineCount}.`,
            ]
          : []),
      ]
    : [];
  const sourceWorkspaceGraphFacts = [
    ...(optSpineView?.selected
      ? [
          `Optimization rank: ${optSpineView.selected.rank} with fit ${optSpineView.selected.score}/100 and action "${optSpineView.selected.action}".`,
          `Ranking reasons: ${optSpineView.selected.reasons.map((reason) => `${reason.label} (${reason.role.replace(/_/g, " ")}, ${reason.points} points): ${reason.detail}`).join(" | ")}.`,
          `Top optimization queue: ${optSpineView.topCandidates.map((candidate) => `${candidate.rank} ${candidate.label} ${candidate.value} fit ${candidate.score}`).join(" | ")}.`,
        ]
      : []),
    ...(optSpineView?.sourceConnections ?? []).map(
      (connection) =>
        `${connection.sourceSystem} feeds ${connection.ledgers.join(", ")} with ${connection.extract} Key fields: ${connection.fields.join(", ")}. Outcome: ${connection.outcome}`,
    ),
  ];
  const sourceWorkspaceQualityFacts = [
    `Category quality: ${categoryQuality.qualityMessage}; affected rows ${categoryQuality.affectedRows}; affected value ${money(categoryQuality.affectedAnnualValue)}; authority gate ${categoryQuality.authorityGate}.`,
    `Evidence state for current selection: ${kind === "contract" && c?.source_confidence != null && Number.isFinite(c.source_confidence) ? pct(c.source_confidence) + " source confidence" : "portfolio-level evidence"}.`,
    `Missing evidence must be stated as evidence missing or workflow required. Never convert missing value to zero, and never claim a finance-confirmed outcome without Tower or finance confirmation.`,
  ];
  const avaSurfaceContext = {
    tenant: vm.tenantName,
    module: "Source",
    activeClient: vm.tenantName,
    clientKey: vm.portfolio.tenantKey,
    activeTab: sourceWorkspaceActiveTab,
    selection:
      kind === "contract" && c
        ? c.contract_id + " · " + c.vendor_name
        : kind === "vendor"
          ? vendorName
          : kind === "opportunity" && opp
            ? opp.contractId
            : "Executive portfolio",
    lens: activeTab || null,
    asOf: fmtDate(vm.portfolio.asOfDateIso),
    evidence:
      kind === "contract" &&
      c?.source_confidence != null &&
      Number.isFinite(c.source_confidence)
        ? pct(c.source_confidence) + " source confidence"
        : "Portfolio-level",
    pageFacts: sourceWorkspacePageFacts,
    tenantFacts: [
      `Context coverage: ${v4Snapshot.contextCoverage.contracts} contract rows, ${v4Snapshot.contextCoverage.scopeRows} scope rows, ${v4Snapshot.contextCoverage.invoiceLines} invoice lines, ${v4Snapshot.contextCoverage.performanceRows} performance rows, ${v4Snapshot.contextCoverage.saasUsageRows} usage rows, ${v4Snapshot.contextCoverage.cloudRows} cloud rows.`,
      `Service-credit rollup: calculated ${money(v4Snapshot.performanceCredits.creditCalculated)}, claimed ${money(v4Snapshot.performanceCredits.creditClaimed)}, recovered ${money(v4Snapshot.performanceCredits.creditRecovered)}, unclaimed ${money(v4Snapshot.performanceCredits.unclaimedCredit)}.`,
      `AI usage value evidence: ${v4Snapshot.aiUsageValueProof.rowCount} usage rows, ${v4Snapshot.aiUsageValueProof.assignedSeats} assigned seats, ${v4Snapshot.aiUsageValueProof.activeUsers} active users, ${money(v4Snapshot.aiUsageValueProof.actualCost)} actual cost, ${v4Snapshot.aiUsageValueProof.claimableRows} claimable rows.`,
    ],
    vendorFacts: sourceWorkspaceVendorFacts,
    sourceFacts: [
      ...sourceWorkspaceOpportunityFacts,
      ...sourceWorkspaceLedgerFacts,
      ...sourceWorkspaceQualityFacts,
    ],
    graphFacts: sourceWorkspaceGraphFacts,
    qualityFacts: sourceWorkspaceQualityFacts,
    sourceV4: {
      datasetId: v4Snapshot.datasetId,
      datasetLabel: v4Snapshot.datasetLabel,
      datasetVersion: v4Snapshot.datasetVersion,
      analyticsProvider: v4Snapshot.analyticsProvider,
      activeLoadRunId: v4Snapshot.activeLoadRunId,
      asOf: fmtDate(v4Snapshot.asOfDateIso),
      availableLenses: availableV4Lenses,
      unavailableLenses: unavailableV4Lenses,
      executivePortfolio: {
        contracts: v4Snapshot.executivePortfolio.contractCount,
        annualValue: money(v4Snapshot.executivePortfolio.annualValue),
        totalCommittedValue: money(
          v4Snapshot.executivePortfolio.totalCommittedValue,
        ),
        autoRenewCount: v4Snapshot.executivePortfolio.autoRenewCount,
        notice90DayCount: v4Snapshot.executivePortfolio.notice90DayCount,
      },
      contextCoverage: {
        vendors: v4Snapshot.contextCoverage.vendors,
        contracts: v4Snapshot.contextCoverage.contracts,
        scopeRows: v4Snapshot.contextCoverage.scopeRows,
        invoiceLines: v4Snapshot.contextCoverage.invoiceLines,
        saasUsageRows: v4Snapshot.contextCoverage.saasUsageRows,
        cloudRows: v4Snapshot.contextCoverage.cloudRows,
        performanceRows: v4Snapshot.contextCoverage.performanceRows,
      },
      valueProof: {
        aiUsageRows: v4Snapshot.aiUsageValueProof.rowCount,
        assignedSeats: v4Snapshot.aiUsageValueProof.assignedSeats,
        activeUsers: v4Snapshot.aiUsageValueProof.activeUsers,
        actualCost: money(v4Snapshot.aiUsageValueProof.actualCost),
        claimableRows: v4Snapshot.aiUsageValueProof.claimableRows,
        topProducts: v4Snapshot.aiUsageValueProof.topProducts,
        rule: "Usage, active users and cost do not prove a finance-confirmed outcome without baseline and finance validation.",
      },
      selectedContract:
        kind === "contract" && c
          ? {
              contractId: c.contract_id,
              vendorId: c.vendor_ref,
              vendorName: c.vendor_name,
              contractName: c.contract_name,
              category: c.vendor_category,
              annualValueUsd: numberFromDb(c.annual_value),
              actualAnnualSpendUsd: numberFromDb(c.actual_annual_spend),
              totalCommittedValueUsd: numberFromDb(c.total_committed_value),
              contractedToActualVarianceUsd:
                c.annual_value != null && c.actual_annual_spend != null
                  ? (numberFromDb(c.annual_value) ?? 0) -
                    (numberFromDb(c.actual_annual_spend) ?? 0)
                  : null,
              endDate: fmtDate(c.end_date),
              noticeDate: contract?.noticeDate
                ? fmtDate(contract.noticeDate.toISOString())
                : "Not established",
              noticePeriodDays: c.notice_period_days,
              autoRenew: c.auto_renew,
              renewalOwnerRef: c.renewal_owner_ref,
              scopeSummary:
                cVm?.scopeSummary ??
                "Contract scope has not been extracted yet.",
              scopeRowCount: scopeRows.length,
              sourceConfidence: c.source_confidence,
            }
          : null,
      optimizationOpportunities: opportunityView
        ? {
            recommendation: opportunityView.recommendation,
            baseline: opportunityView.baseline,
            potential: opportunityView.potential,
            financeConfirmed: opportunityView.financeConfirmed,
            selectedOpportunity: opportunityView.selectedOpportunity,
            opportunities: opportunityView.opportunities.map((opportunity) => ({
              id: opportunity.id,
              label: opportunity.label,
              valueType: opportunity.valueType,
              amount: opportunity.amount,
              amountUsd: opportunity.amountUsd,
              stage: opportunity.stage,
              stageRaw: opportunity.stageRaw,
              grade: opportunity.grade,
              owner: opportunity.owner,
              nextAction: opportunity.nextAction,
              blockingGap: opportunity.blockingGap,
              sourceRefs: opportunity.sourceRefs,
            })),
          }
        : null,
      optimizationLedger: optLedgerView
        ? {
            headline: optLedgerView.headline,
            quantifiedLeakage: optLedgerView.quantifiedLeakage,
            quantifiedLeakageUsd: optLedger?.quantifiedLeakageUsd ?? null,
            realizedValue: optLedgerView.realizedValue,
            realizedValueUsd: optLedger?.realizedValueUsd ?? null,
            evidenceReady: optLedgerView.evidenceReady,
            evidenceGaps: optLedgerView.evidenceGaps,
            lines: optLedgerView.lines.map((line) => ({
              id: line.id,
              kind: line.kind,
              label: line.label,
              amount: line.amount,
              amountUsd: line.amountUsd,
              state: line.state,
              evidenceClass: line.evidenceClass,
              evidence: line.evidence,
              nextAction: line.nextAction,
              sourceRefs: line.sourceRefs,
              lineageFields: line.lineageFields,
            })),
          }
        : null,
      optimizationSpine: optSpineView
        ? {
            selected: optSpineView.selected,
            topCandidates: optSpineView.topCandidates.map((candidate) => ({
              rank: candidate.rank,
              label: candidate.label,
              value: candidate.value,
              score: candidate.score,
              band: candidate.band,
              selected: candidate.selected,
            })),
            sourceConnections: optSpineView.sourceConnections.map(
              (connection) => ({
                id: connection.id,
                sourceSystem: connection.sourceSystem,
                examples: connection.examples,
                extract: connection.extract,
                evidenceClasses: connection.evidenceClasses,
                ledgers: connection.ledgers,
                fields: connection.fields,
                outcome: connection.outcome,
              }),
            ),
          }
        : null,
      cloudOptimization: {
        rows: v4Snapshot.cloudOptimization.rowCount,
        actualCost: money(v4Snapshot.cloudOptimization.actualCost),
        overageAmount: money(v4Snapshot.cloudOptimization.overageAmount),
        topServices: v4Snapshot.cloudOptimization.topServices,
      },
      serviceCredits: {
        rows: v4Snapshot.performanceCredits.rowCount,
        calculated: money(v4Snapshot.performanceCredits.creditCalculated),
        claimed: money(v4Snapshot.performanceCredits.creditClaimed),
        recovered: money(v4Snapshot.performanceCredits.creditRecovered),
        unclaimed: money(v4Snapshot.performanceCredits.unclaimedCredit),
      },
      workforceRateCards: {
        rows: v4Snapshot.workforceRateCards.rowCount,
        hours: v4Snapshot.workforceRateCards.hours,
        averageBillRate:
          v4Snapshot.workforceRateCards.averageBillRate == null
            ? "Not established"
            : money(v4Snapshot.workforceRateCards.averageBillRate),
        unapprovedVarianceCount:
          v4Snapshot.workforceRateCards.unapprovedVarianceCount,
      },
      sourcingEvents: {
        rows: v4Snapshot.sourcingEvents.rowCount,
        normalizedCost: money(v4Snapshot.sourcingEvents.normalizedCost),
        averageWeightedScore: v4Snapshot.sourcingEvents.averageWeightedScore,
      },
      topVendors: v4Snapshot.topVendors.slice(0, 5).map((vendor) => ({
        vendorId: vendor.vendorId,
        legalName: vendor.legalName,
        supplierCategory: vendor.supplierCategory,
        riskTier: vendor.riskTier,
        annualValue: money(vendor.annualValue),
        contractCount: vendor.contractCount,
      })),
      workspaceDiagnostics: diagnostics,
      categoryQuality: {
        state: categoryQuality.qualityState,
        message: categoryQuality.qualityMessage,
        affectedRows: categoryQuality.affectedRows,
        affectedValue: money(categoryQuality.affectedAnnualValue),
        categoryCleanContractPct: pct(categoryQuality.categoryCleanContractPct),
        categoryCleanValuePct: pct(categoryQuality.categoryCleanValuePct),
        categoryConflictedContractCount:
          categoryQuality.categoryConflictedContractCount,
        categoryUnclassifiedContractCount:
          categoryQuality.categoryUnclassifiedContractCount,
        categoryReviewedCount: categoryQuality.categoryReviewedCount,
        authorityGate: categoryQuality.authorityGate,
        effectiveCategoryRule:
          "Group by effective_category only. Do not auto-substitute suggested_category until reviewed.",
      },
    },
  };
  const avaSuggestedActions = (
    kind === "contract"
      ? [
          ["weak-leverage", "Why does this contract carry weak leverage?"],
          ["evidence-gaps", "What evidence is missing for this contract?"],
        ]
      : kind === "vendor"
        ? [
            ["renewal-exposure", "Show renewal exposure for this vendor"],
            ["evidence-gaps", "What evidence is missing?"],
          ]
        : [
            [
              "renewal-exposure",
              "Show the top renewal exposures by annual value",
            ],
            [
              "concentration",
              "Why is concentration not the binding constraint?",
            ],
            ["taxonomy-exceptions", "Explain taxonomy exceptions"],
            ["evidence-gaps", "What evidence is missing?"],
          ]
  ).map((s) => ({ id: s[0], label: s[1], body: s[1] }));

  return {
    kind,
    activeTab,
    sel,
    contract,
    contractRow: c,
    cVm,
    vendorName,
    vendorCat,
    vendorRef,
    opp,
    o,
    rows,
    summary,
    conc,
    rec180: rec180Fixed,
    opportunities,
    tenantName: vm.tenantName,
    asOfDateIso: vm.portfolio.asOfDateIso,
    explorerRail: false,
    explorerPinned: S.explorerPinned,
    toggleExplorerPin: vm.toggleExplorerPin,
    shellCols: S.narrow
      ? "0px minmax(0,1fr)"
      : (S.tight ? "214px" : "272px") + " minmax(0,1fr)",
    explorerStyle:
      (S.narrow
        ? S.drawer
          ? "position:fixed;left:0;top:56px;bottom:34px;width:284px;z-index:70;box-shadow:0 8px 30px rgba(10,10,11,.22);"
          : "display:none;"
        : "") +
      "background:#fbfaf7;border-right:1px solid rgba(10,10,11,.12);display:flex;flex-direction:column;min-height:0;overflow:hidden",
    isNarrow: S.narrow,
    showStatusDetail: !!S.wide,
    toggleDrawer: () => vm.setState({ drawer: !S.drawer }),
    query: S.q,
    onQuery: (v: string) => vm.setState({ q: v }),
    back: () => vm.jump(S.hi - 1),
    fwd: () => vm.jump(S.hi + 1),
    backColor: S.hi > 0 ? "#fff" : "rgba(255,255,255,.28)",
    fwdColor: S.hi < S.hist.length - 1 ? "#fff" : "rgba(255,255,255,.28)",
    collapseAll: () => vm.setState({ open: {} }),
    tree,
    crumbs,
    title,
    thesis,
    tabs,
    headerActions:
      kind === "contract" && contract && activeTab !== "Optimize"
        ? [
            {
              label: "Open optimize plan",
              bg: "#0a0a0b",
              fg: "#fff",
              border: "#0a0a0b",
              onClick: () => {
                window.location.href = contractOptimizationIntakeHref(
                  contract,
                  opportunityView?.selectedOpportunityId ?? null,
                );
              },
            },
          ]
        : kind === "portfolio"
          ? [
              {
                label: "Select a contract to optimize",
                bg: "#0a0a0b",
                fg: "#fff",
                border: "#0a0a0b",
                onClick: () => {
                  window.location.href = "/source/optimize";
                },
              },
            ]
          : [],
    valueStrip: valueStrip.filter((v) => !v.missing),
    hasPending: valueStrip.filter((v) => v.missing).length > 0,
    pendingItems: valueStrip
      .filter((v) => v.missing)
      .map((v) => ({ label: v.label, sub: v.sub })),
    stripCompact: true,
    compactItems:
      kind === "portfolio" && activeTab === "Explore"
        ? [
            {
              label: "annual",
              value: money(
                v4HasPortfolio
                  ? v4Snapshot.executivePortfolio.annualValue
                  : summary.totalAnnualValue,
              ),
            },
            {
              label: "active contracts",
              value: String(
                v4HasPortfolio
                  ? v4Snapshot.executivePortfolio.contractCount
                  : summary.contractCount,
              ),
            },
            {
              label: "active strategic vendors",
              value: String(
                v4HasPortfolio
                  ? vm.portfolio.workspaceDiagnostics.v4VendorCount
                  : summary.vendorCount,
              ),
            },
            {
              label: "in top-10 vendor concentration",
              value: pct(conc.topNShare(10)),
            },
          ]
        : kind === "contract" && activeTab === "Optimize" && contract
          ? [
              {
                label: "annual value",
                value: money(contract.row.annual_value),
              },
              {
                label: "potential recoverable",
                value:
                  opportunityView?.potential.recoverable ??
                  optLedgerView?.quantifiedLeakage ??
                  "Not quantified",
              },
              {
                label: "finance confirmed",
                value:
                  opportunityView?.financeConfirmed ??
                  optLedgerView?.realizedValue ??
                  "Not established",
              },
              {
                label: "opportunities",
                value: opportunityView
                  ? String(opportunityView.opportunities.length)
                  : (optLedgerView?.evidenceReady ?? "0"),
              },
            ]
          : valueStrip
              .filter((v) => !v.missing)
              .slice(0, 4)
              .map((v) => ({ label: v.label, value: v.value })),
    compactRing:
      kind === "portfolio" && activeTab === "Explore"
        ? {
            label: "category-clean",
            valueLabel: pct(categoryQuality.categoryCleanValuePct),
            pct01: Number.isFinite(categoryQuality.categoryCleanValuePct)
              ? categoryQuality.categoryCleanValuePct
              : 0,
            color: "#ba7517",
          }
        : kind === "contract" && activeTab === "Optimize" && contract
          ? {
              label: "leverage risk",
              valueLabel: contract.leverage.weakSignalCount + " of 4 weak",
              pct01: contract.leverage.weakSignalCount / 4,
              color:
                contract.leverage.weakSignalCount >= 2 ? COL.red : COL.amber,
            }
          : null,
    contextTableCols,
    contextTableRows,
    availDot: vm.portfolio.isEmpty ? COL.gray : COL.teal,
    availLabel: vm.portfolio.isEmpty
      ? "No rows returned"
      : "Live governed data",
    isPortfolioContext: kind === "portfolio" && activeTab === "Portfolio",
    homeVerdict,
    homeStorySteps,
    leadershipPosition,
    coverage,
    goEvidence: () => vm.select("evidence", null, "Coverage"),
    hasPins: (S.pins[kind + ":" + (sel.id || "")] || []).length > 0,
    pins: S.pins[kind + ":" + (sel.id || "")] || [],
    statusSel: crumbLabels.slice(2).join(" › "),
    freshness: "Current at as-of",
    evidenceState:
      kind === "contract" &&
      c?.source_confidence != null &&
      Number.isFinite(c.source_confidence)
        ? pct(c.source_confidence)
        : "Mixed",
    tip: S.tip,
    sourceV4ProofCards,
    sourceV4DatasetId: v4Snapshot.datasetId,
    sourceV4AsOf: fmtDate(v4Snapshot.asOfDateIso),
    dataLayerDiagnostics: diagnostics,
    categoryQuality,
    cockpit: vm.portfolio.cockpit,
    portfolioIsEmpty: vm.portfolio.isEmpty,
    openCockpitContract: (contractId: string) =>
      vm.select("contract", contractId, "Story"),
    startCockpitOptimization: (
      contractId: string,
      opportunityId?: string | null,
    ) => vm.startContractOptimization(contractId, opportunityId),

    isExplore: kind === "portfolio" && activeTab === "Explore",
    ex: vm.explore(rows),
    pinSlice: () => vm.pin("Saved cut", "Saved cut", "Governed query"),
    isConc: kind === "portfolio" && activeTab === "Concentration & Leverage",
    portfolioLens: S.portfolioLens,
    portfolioLensButtons,
    showConcentrationLens:
      kind === "portfolio" &&
      activeTab === "Concentration & Leverage" &&
      S.portfolioLens === "spend",
    showLeverageLens:
      kind === "portfolio" &&
      activeTab === "Concentration & Leverage" &&
      S.portfolioLens === "leverage",
    pareto,
    top5Pct: pct(conc.topNShare(5)),
    top10Pct: pct(conc.topNShare(10)),
    concTake:
      "The top ten vendors represent " +
      pct(conc.topNShare(10)) +
      " of annual contract value.",
    topCols,
    topRows,
    concStrips,
    isRenewals: kind === "portfolio" && activeTab === "Renewals",
    windowBtns,
    tl,
    urgLegend,
    reconCards,
    passedCols,
    passedRows,
    isLeverage:
      kind === "portfolio" &&
      activeTab === "Concentration & Leverage" &&
      S.portfolioLens === "leverage",
    mx,
    quadPanel,
    signalDefs,
    leverageCols,
    leverageRows,
    leverageRowsTitle,
    isOpps: false,
    oppGroups,
    oppCols,
    oppRows,
    isAgenda: false,
    findings,
    journeys,

    isContractList: kind === "contractList",
    isVendorList: kind === "vendorList",
    listCols,
    listRows: vm.contractTableRows(listRows),
    vendorCols,
    vendorListRows,

    isVendor: kind === "vendor",
    vTab: S.tabs.vendor,
    vOverview: kind === "vendor" && activeTab === "Overview",
    vContracts: kind === "vendor" && activeTab === "Contracts",
    vDeps: kind === "vendor" && activeTab === "Dependencies",
    vOppsTab: kind === "vendor" && activeTab === "Opportunities",
    vendorStats,
    vendorContractRows,
    vendorComposition,
    vendorDependencyMap,
    vendorOpps,
    vendorHasOpps: vendorOpps.length > 0,

    isContract: isContractMode,
    cTab: S.tabs.contract,
    c: cVm,
    cOverview: activeTab === "Story",
    cEconomics: activeTab === "Economics",
    cScope: activeTab === "Scope",
    cPerformance: activeTab === "Performance",
    cRelationship: activeTab === "Relationship",
    cRenewal: false,
    cLeverage: false,
    cEvidence: activeTab === "Evidence",
    cActions: activeTab === "Optimize",
    termRows,
    econBars,
    scopeRows,
    scopeCols,
    pricingRows,
    pricingCols,
    hasScope: scopeRows.length > 0,
    hasEvidenceScope: evidenceScopeRows.length > 0,
    hasPricing: pricingRows.length > 0,
    scopeSummary: cVm?.scopeSummary ?? "",
    scopeTierCounts,
    evidenceOverview,
    evidencePerformance,
    weakFlags,
    weakCount,
    progRows,
    hasProg,
    recAction,
    recWhy,
    optLevers,
    optScenarios,
    optLedger: optLedgerView,
    optSpine: optSpineView,
    opportunityView,
    optCtaLabel,
    optCtaDisabled: optLaunch?.status === "loading",
    optCtaError,
    optCtaHref,
    startOptimization: contract
      ? () =>
          vm.startContractOptimization(
            contract.row.contract_id,
            opportunityView?.selectedOpportunityId ?? null,
          )
      : () => undefined,
    goActions: () => vm.setTab("contract", "Optimize"),
    detailState,
    detail,

    isOpp: kind === "opportunity" && !!opp,
    oppLevers,
    oppScenarios,

    isEvidence: kind === "evidence",
    evTab: S.tabs.evidence,
    evCoverage: kind === "evidence" && activeTab === "Coverage",
    evSystems: kind === "evidence" && activeTab === "Source systems",
    evDocs: kind === "evidence" && activeTab === "Contract documents",
    evConflicts: kind === "evidence" && activeTab === "Conflicts",
    evMissing: kind === "evidence" && activeTab === "Missing evidence",
    covCols,
    covRows,
    sysCols,
    sysRows,
    conflictCols,
    conflictRows,
    missingCols,
    missingRows,

    avaSurfaceContext,
    avaSuggestedActions,
    pin: vm.pin,
  };
}

function buildVendorDependencyMap(
  vm: WorkspaceViewModel,
  vendorRef: string | null,
  vendorName: string,
  vendorCat: string | null,
  vendorContracts: EnrichedContract[],
) {
  const initiatives = vendorContracts.flatMap((c) =>
    vm.initiativesFor(c.row.contract_id),
  );
  const platforms = Array.from(
    new Set(
      vendorContracts.flatMap((c) =>
        vm
          .scopeTiers(c.row.contract_id)
          .explicit.concat(vm.scopeTiers(c.row.contract_id).unresolved)
          .map((a) => a.hosting_model)
          .filter((h): h is string => !!h),
      ),
    ),
  );
  const criticalTotal = vendorContracts.reduce(
    (t, c) => t + (numberFromDb(c.row.critical_application_count) ?? 0),
    0,
  );
  return {
    vendor: vendorName,
    category: vendorCat ?? "Unresolved",
    contracts: vendorContracts.slice(0, 6).map((c) => ({
      id: c.row.contract_id,
      name: c.row.contract_name,
      onClick: () => vm.select("contract", c.row.contract_id),
    })),
    criticalApplications: criticalTotal,
    platforms,
    initiatives: initiatives.map((i) => ({
      name: i.initiative_project_name,
      status: i.status ?? "Not recorded",
    })),
    vendorRef,
  };
}

export type SourceWorkspaceVM = ReturnType<typeof buildViewModel>;
