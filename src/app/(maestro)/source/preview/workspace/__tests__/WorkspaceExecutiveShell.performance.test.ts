import { readFileSync } from "node:fs";

import { unreachableTopLevelDeclarations } from "../../../../../../../scripts/quality/export-reachability.mjs";

/*
 * T-555. Every `readFileSync` in this file used to be scanned with a bare
 * `toContain`, which made each of them a control a COMMENT could satisfy:
 * write the asserted text into a comment in the component and the positive
 * passes with the affordance gone; write the forbidden text into a comment
 * and the negative fails with nothing wrong. That is the defect class of
 * T-513 and T-553, and it is worse here than in either, because this suite is
 * named by exact path in `.github/workflows/ai-surface-control-catalog.yml`
 * and therefore runs in a required job.
 *
 * Three answers were applied, one per control, and which one is recorded
 * beside the control:
 *
 *   RENDERED   — the control names something a reader sees, the component
 *                that draws it is actually MOUNTED, and a rendered tree can
 *                fail on it. Moved to
 *                `WorkspaceExecutiveShell.shell-behaviour.test.tsx`, which
 *                mutation-proves each one.
 *   RETIRED    — the control has no subject worth holding: either a render
 *                elsewhere already proves it, or the thing it describes is
 *                not reachable by any reader. Deleted here, with the reason
 *                and, where there is one, the suite and query that replace
 *                it. The second kind is the more important finding of T-555
 *                and is recorded on the graph block below.
 *   HYGIENE    — the control is a rule about the CODE, not about a frame:
 *                a pattern that must not appear anywhere in 8421 lines, or a
 *                stylesheet declaration jsdom never applies. A render cannot
 *                express it. These stay, but they now read `sourceCode()` and
 *                `styleSheet()`, which blank every comment before the scan,
 *                so a comment can neither satisfy a positive nor trip a
 *                negative. `stripComments` preserves offsets, so index
 *                arithmetic over the result still points at real code.
 */

const WORKSPACE_DIR = `${__dirname}/..`;

/*
 * The reachability walk this suite used to define now lives in
 * `scripts/quality/export-reachability.mjs` — item U-504.
 *
 * It was moved rather than copied. A control shipped inside one component's
 * test file reads exactly one path, and the defect it repaired here was not
 * special to this file: any component can lose its mount site, keep compiling
 * and keep linting, because `no-unused-vars` is satisfied the moment one dead
 * declaration references another. Copying the helper into a second test file is
 * the shape item T-723 was filed against, so there is one module and both this
 * suite and the repository-wide census import it.
 *
 * The move also fixed it. Measured over 1611 component files, the line-and-
 * regex version this file held reported 22 unreachable declarations of which
 * **15 were false positives**: a `<Code>src/lib/reasoning/*</Code>` in JSX text
 * opens a block comment to a hand-written stripper, which blanked the whole
 * component body below it and so every reference the page made to its own
 * tables and styles. The shared walk asks the TypeScript parser instead. It
 * still returns exactly the ten declarations U-503 deleted when run against
 * that file's content at `c26e0c219`, so the true positive is unchanged.
 */

function stripComments(
  text: string,
  { lineComments = true }: { lineComments?: boolean } = {},
): string {
  const out = text.split("");
  const n = text.length;
  let state: "code" | "line" | "block" | "sq" | "dq" | "tpl" = "code";
  let i = 0;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (state === "code") {
      if (lineComments && c === "/" && d === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        state = "line";
        i += 2;
        continue;
      }
      if (c === "/" && d === "*") {
        out[i] = " ";
        out[i + 1] = " ";
        state = "block";
        i += 2;
        continue;
      }
      if (c === "'") state = "sq";
      else if (c === '"') state = "dq";
      else if (c === "`") state = "tpl";
      i += 1;
      continue;
    }
    if (state === "line") {
      if (c === "\n") state = "code";
      else out[i] = " ";
      i += 1;
      continue;
    }
    if (state === "block") {
      if (c === "*" && d === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        state = "code";
        i += 2;
        continue;
      }
      if (c !== "\n") out[i] = " ";
      i += 1;
      continue;
    }
    // inside a string literal: only its own closing quote ends it.
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (
      (state === "sq" && c === "'") ||
      (state === "dq" && c === '"') ||
      (state === "tpl" && c === "`")
    ) {
      state = "code";
    }
    i += 1;
  }
  return out.join("");
}

/** `WorkspaceExecutiveShell.tsx` with every comment blanked. */
function sourceCode() {
  return stripComments(
    readFileSync(`${WORKSPACE_DIR}/WorkspaceExecutiveShell.tsx`, "utf8"),
  );
}

/** `workspace.css` with every comment blanked. CSS has no `//` comment. */
function styleSheet() {
  return stripComments(readFileSync(`${WORKSPACE_DIR}/workspace.css`, "utf8"), {
    lineComments: false,
  });
}

import {
  SOURCE_CHART_PALETTE,
  consumptionRampRows,
  coverageForVendor,
  contractPurposeSummary,
  contractTabNarrative,
  contractSearchRank,
  contractValueTypeSummary,
  displayBenchmarkingClause,
  focusedContractSet,
  focusedVendorSet,
  leverTableRows,
  negotiationSequenceRows,
  orderedActionRows,
  optimizeTypeRows,
  performanceActual,
  sizedOpportunityTotalUsd,
  resolveSelectedVendor,
  sourceImpactCoverageRowTotal,
  source360RecoverableCreditCoverageRows,
  source360RecoverableCreditFinding,
  topVendors,
  vendorArchetypeCoverage,
  vendorArchetypeRows,
  vendorCoverageRows,
  vendorLinkedContracts,
  vendorReadinessDecisionRows,
} from "../WorkspaceExecutiveShell";
import { portfolioDiscountComparatorSummary } from "../contractDiscountComparator";
import { focusableContractRows } from "../contractDiscovery";
import { INITIAL_STATE, WorkspaceViewModel } from "../viewModel";

describe("WorkspaceExecutiveShell performance formatting", () => {
  it("uses recorded action priority ahead of an unsized alphabetical fallback", () => {
    const rows = orderedActionRows([
      { action_candidate_id: "a-marketplace", title: "Route through Marketplace", priority: "P2", candidate_amount_usd: null },
      { action_candidate_id: "z-ramp", title: "Re-time annual commitment", priority: "P0", candidate_amount_usd: null },
    ] as never);
    expect(rows.map((row) => row.action_candidate_id)).toEqual(["z-ramp", "a-marketplace"]);
  });
  it("keeps Source charts on semantic palette tokens instead of hard-black slabs", () => {
    // The first assertion reads the exported value, not the file.
    expect(Object.values(SOURCE_CHART_PALETTE)).not.toContain("#0a0a0b");

    // HYGIENE. "the slab colour appears nowhere in the component" is a claim
    // about 8421 lines; no single render can make it.
    const source = sourceCode();

    expect(source).not.toContain('fill="#0a0a0b"');
    expect(source).not.toContain('stroke="#0a0a0b"');
    expect(source).not.toContain("<b>black</b>");
    expect(source).not.toContain('? "#0a0a0b"');
  });

  it("keeps Source navigation singular and avoids duplicate toolbar actions", () => {
    /*
     * RETIRED: `expect(source).toContain('aria-label="Source workspace
     * navigation"')` — the line T-555 names. It is proved by a render, five
     * times, in `WorkspaceClient.ecl-browser.test.tsx`, which mounts the real
     * shell and resolves the nav by ACCESSIBLE NAME:
     * `getByRole("navigation", { name: "Source workspace navigation" })` at
     * lines 411, 545, 797, 1183 and 1914. An accessible-name query fails when
     * the label is removed and cannot be satisfied by a comment, so keeping
     * the byte-scan beside it added no control at all — only the illusion of
     * one. The NEGATIVES below are not redundant with it and stay: they say
     * the two retired labels appear NOWHERE, which no render asserts.
     */
    const source = sourceCode();
    const css = styleSheet();

    expect(source).not.toContain('aria-label="Source workspace header"');
    expect(source).not.toContain(
      'aria-label="Persistent Source workspace toolbar"',
    );
    expect(source).toContain("sw-v2-impact-load-badge");
    expect(css).toContain(".sw-v2-horizontal-tabs");
    expect(css).not.toContain(".sw-v2-frame-bar");
    expect(css).not.toContain(".sw-v2-sticky-context");
    expect(css).not.toContain(".sw-v2-compact-action-button");
    expect(source).not.toContain("<span>Evidence</span></button>");
    expect(source).not.toContain("<span>Graph</span></button>");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(css).toContain("max-width: min(100%, 1280px)");
    expect(css).toContain("max-width: min(100%, 1120px)");
    expect(css).toContain("grid-template-columns: 1fr");
  });

  it("renders commercial posture on the product-shell Contract 360 page", () => {
    /*
     * HYGIENE, deliberately not retired. `WorkspaceClient.ecl-browser.test.tsx`
     * line 1244 proves the posture eyebrow RENDERS on the product shell, so
     * "the reader sees it" is covered. What it does not pin is WHICH
     * component draws it — the four scans below say the product shell reaches
     * it through `ProductShellCommercialPostureStrip` over `posture.items`,
     * and a rewrite that satisfied the render from some other path would not
     * trip that suite. The scans are a composition rule, so they stay and are
     * comment-proofed rather than moved.
     */
    const source = sourceCode();

    expect(source).toContain("<ProductShellCommercialPostureStrip vm={vm} />");
    expect(source).toContain('aria-label="Commercial posture"');
    expect(source).toContain('PanelHead eyebrow="Commercial posture"');
    expect(source).toContain("posture.items.map");
  });

  it("keeps Contract 360 Optimize table-first", () => {
    // HYGIENE. Three of the five assertions are absence claims over the whole
    // component, which is not a statement any one rendered frame can carry.
    const source = sourceCode();

    expect(source).toContain("<ContractOptimizeContent vm={vm} />");
    expect(source).toContain("<ContractLeverTableContent vm={vm} />");
    expect(source).toContain('tab === "Optimize"');
    expect(source).not.toContain(
      "<ProductShellOptimizationExecutiveStrip vm={vm} />",
    );
    expect(source).not.toContain("<ContractWorkflowRail vm={vm} />");
    expect(source).not.toContain("<ContractRefusalChips vm={vm} />");
  });

  it("promotes supplemental depth/action contracts into the focused contract list", () => {
    const action = (
      contractId: string,
      vendorName: string,
      amount: number,
      index: number,
    ) => ({
      tenant_key: "meridian-health",
      action_candidate_id: `${contractId}:action:${index}`,
      opportunity_id: `${contractId}:opportunity:${index}`,
      contract_id: contractId,
      vendor_ref: vendorName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
      vendor_name: vendorName,
      title: "Loaded optimization action",
      action_type: "commercial_opportunity",
      opportunity_type: "negotiated_improvement",
      finding_summary: "Loaded governed opportunity evidence",
      deterministic_basis: "source opportunity projection",
      candidate_amount_usd: amount,
      priority: "high",
      readiness_state: "candidate",
      evidence_state: "present",
      authority_state: "not_confirmed",
      finance_confirmation_state: "not_confirmed",
      next_action: "Open Optimize",
      accountable_role: "Finance",
      decision_due_date: null,
      coverage_state: "decision_ready",
      blocker_if_missing: null,
      citation_basis_json: null,
      load_run_id: "test-run",
    });
    const portfolio = {
      contracts: [
        {
          tenant_key: "meridian-health",
          contract_id: "CTR-REGISTRY-001",
          vendor_ref: "vendor-register",
          vendor_name: "Large Registry Vendor",
          vendor_category: "platform",
          contract_name: "Large header-only registry agreement",
          annual_value: 50_000_000,
          actual_annual_spend: null,
          total_committed_value: null,
          committed_annual_spend: null,
          auto_renew: false,
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-DBX-001",
            vendor_ref: "vendor-databricks",
            vendor_name: "Databricks, Inc.",
            vendor_category: "cloud_data_platform",
            contract_archetype: "cloud_consumption",
            contract_name: "Databricks Enterprise Agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
          {
            tenant_key: "meridian-health",
            contract_id: "MER-CLOUD-AWS-001",
            vendor_ref: "vendor-aws",
            vendor_name: "Amazon Web Services, Inc.",
            vendor_category: "cloud",
            contract_archetype: "cloud_consumption",
            contract_name: "AWS Enterprise Discount Program",
            spend_rows: 12,
            actual_spend_usd: 24_300_000,
            committed_spend_usd: 23_400_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 5,
            scope_rows: 5,
            critical_scope_rows: 3,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [
          ...Array.from({ length: 6 }, (_, index) =>
            action("MER-TECH-DBX-001", "Databricks, Inc.", 620_000, index),
          ),
          ...Array.from({ length: 5 }, (_, index) =>
            action(
              "MER-CLOUD-AWS-001",
              "Amazon Web Services, Inc.",
              620_000,
              index,
            ),
          ),
        ],
        claimCards: [],
      },
    };

    const focus = focusedContractSet(portfolio as never, 3);

    expect(focus.rows.map((row) => row.contract.contract_id)).toEqual([
      "MER-TECH-DBX-001",
      "MER-CLOUD-AWS-001",
      "CTR-REGISTRY-001",
    ]);
    expect(focus.rows[0]).toMatchObject({
      actionRows: 6,
      // "Why listed" names what the reader gets, not the row that holds it.
      reason: "6 governed actions",
    });
    expect(focus.rows[1]).toMatchObject({
      actionRows: 5,
      reason: "5 governed actions",
    });
    expect(focus.rows[0]?.contract.contract_name).toContain("Databricks");
    expect(focus.rows[1]?.contract.vendor_name).toBe(
      "Amazon Web Services, Inc.",
    );

    const unsized = focusedContractSet({
      ...portfolio,
      impact: {
        ...portfolio.impact,
        actionCandidates: portfolio.impact.actionCandidates.map((row) =>
          row.contract_id === "MER-TECH-DBX-001"
            ? { ...row, candidate_amount_usd: null }
            : row,
        ),
        claimCards: Array.from({ length: 6 }, (_, index) => ({
          contract_id: "MER-TECH-DBX-001",
          claim_card_id: `claim-${index}`,
        })),
      },
    } as never, 3);
    expect(unsized.rows.find((row) => row.contract.contract_id === "MER-TECH-DBX-001")?.reason)
      .toBe("6 claim rows · sizing not established");
  });

  it("sorts searched supplemental vendor contracts ahead of old register-only rows", () => {
    const oldRegisterRow = {
      contractId: "CTR-OLD-DATABRICKS-001",
      contractName: "Older Databricks register agreement",
      vendorName: "Databricks, Inc.",
      sourceLabel: "Governed register",
      sourceDetail: "$250K",
      isSupplemental: false,
      sortValue: 250_000,
      evidenceScore: 0,
      searchText: ["ctr-old-databricks-001", "databricks, inc."],
    };
    const loadedDepthRow = {
      contractId: "MER-TECH-DBX-001",
      contractName: "Databricks Enterprise Agreement",
      vendorName: "Databricks, Inc.",
      sourceLabel: "Supplemental depth",
      sourceDetail: "decision ready",
      isSupplemental: true,
      sortValue: 1_900_000,
      evidenceScore: 760,
      searchText: ["mer-tech-dbx-001", "databricks, inc."],
    };

    const rows = [oldRegisterRow, loadedDepthRow].sort(
      (a, b) =>
        contractSearchRank(a, "databricks") -
          contractSearchRank(b, "databricks") ||
        b.evidenceScore - a.evidenceScore ||
        (b.sortValue ?? 0) - (a.sortValue ?? 0) ||
        a.contractId.localeCompare(b.contractId),
    );

    expect(rows[0]?.contractId).toBe("MER-TECH-DBX-001");
  });

  it("groups supplemental depth contracts under a selected vendor even when vendor refs differ", () => {
    const portfolio = {
      contracts: [
        {
          tenant_key: "meridian-health",
          contract_id: "CTR-OLD-DATABRICKS-001",
          vendor_ref: "legacy-dbx-vendor-ref",
          vendor_name: "Databricks, Inc.",
          vendor_category: "cloud_data_platform",
          contract_name: "Older Databricks register agreement",
          annual_value: 250_000,
          actual_annual_spend: null,
          total_committed_value: null,
          committed_annual_spend: null,
          auto_renew: false,
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-DBX-001",
            vendor_ref: "MER-VEN-DATABRICKS",
            vendor_name: "Databricks, Inc.",
            vendor_category: "cloud_data_platform",
            contract_archetype: "cloud_consumption",
            contract_name: "Databricks Enterprise Agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
    };
    const selectedVendor = {
      tenant_key: "meridian-health",
      vendor_ref: "legacy-dbx-vendor-ref",
      vendor_refs: ["legacy-dbx-vendor-ref"],
      vendor_name: "Databricks, Inc.",
      vendor_category: "cloud_data_platform",
      contract_count: 1,
      annual_value: 250_000,
      total_committed_value: null,
      auto_renew_contracts: 0,
      next_end_date: null,
      contract_refs: ["CTR-OLD-DATABRICKS-001"],
    };

    const contracts = vendorLinkedContracts(
      focusableContractRows(portfolio as never),
      selectedVendor,
    );

    expect(contracts.map((contract) => contract.contract_id)).toEqual([
      "CTR-OLD-DATABRICKS-001",
      "MER-TECH-DBX-001",
    ]);
  });

  it("resolves a selected evidence-only vendor into the vendor detail panel", () => {
    const portfolio = {
      tenantKey: "tenant-a",
      contracts: [],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "tenant-a",
            contract_id: "CONTRACT-EVIDENCE-001",
            vendor_ref: "VEN-EVIDENCE-ONLY",
            vendor_name: "Evidence Cloud Vendor, Inc.",
            vendor_category: "cloud_platform",
            contract_archetype: "cloud_services",
            contract_name: "Evidence-backed cloud services agreement",
            spend_rows: 13,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 0,
            unclaimed_credit_usd: 0,
            opportunity_rows: 7,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
    };

    const selectedVendor = resolveSelectedVendor(
      portfolio as never,
      [],
      "VEN-EVIDENCE-ONLY",
    );

    expect(selectedVendor).toMatchObject({
      vendor_ref: "VEN-EVIDENCE-ONLY",
      vendor_name: "Evidence Cloud Vendor, Inc.",
      contract_count: 1,
      contract_refs: ["CONTRACT-EVIDENCE-001"],
      vendor_refs: ["VEN-EVIDENCE-ONLY"],
    });
  });

  it("aggregates selected vendor coverage across evidence vendor aliases", () => {
    const portfolio = {
      tenantKey: "tenant-a",
      contracts: [],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "tenant-a",
            contract_id: "CONTRACT-EVIDENCE-001",
            vendor_ref: "VEN-EVIDENCE-PRIMARY",
            vendor_name: "Evidence Cloud Vendor, Inc.",
            vendor_category: "cloud_platform",
            contract_archetype: "cloud_services",
            contract_name: "Primary evidence-backed agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 0,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
          {
            tenant_key: "tenant-a",
            contract_id: "CONTRACT-EVIDENCE-002",
            vendor_ref: "VEN-EVIDENCE-ALIAS",
            vendor_name: "Evidence Cloud Vendor, Inc.",
            vendor_category: "cloud_platform",
            contract_archetype: "advisory_services",
            contract_name: "Supplemental evidence-backed agreement",
            spend_rows: 1,
            actual_spend_usd: 10_000,
            committed_spend_usd: 180_000,
            performance_rows: 0,
            unclaimed_credit_usd: 5_000,
            opportunity_rows: 1,
            scope_rows: 1,
            critical_scope_rows: 0,
            document_page_text_rows: 1,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
    };
    const selectedVendor = resolveSelectedVendor(
      portfolio as never,
      [],
      "VEN-EVIDENCE-PRIMARY",
    );

    expect(selectedVendor?.vendor_refs).toEqual([
      "VEN-EVIDENCE-PRIMARY",
      "VEN-EVIDENCE-ALIAS",
    ]);
    expect(
      coverageForVendor(
        selectedVendor as never,
        vendorCoverageRows(portfolio as never),
      ),
    ).toMatchObject({
      spendRows: 13,
      performanceRows: 0,
      actionRows: 7,
      unclaimedCredit: 5_000,
    });
  });

  it("keeps evidence aliases when a selected vendor also exists in the register", () => {
    const registerVendor = {
      tenant_key: "tenant-a",
      vendor_ref: "VEN-REGISTER",
      vendor_name: "Register Cloud Vendor, Inc.",
      vendor_category: null,
      contract_count: 7,
      annual_value: 17_300_000,
      total_committed_value: 17_300_000,
      auto_renew_contracts: 7,
      next_end_date: null,
      contract_refs: ["CTR-REGISTER-001"],
      vendor_refs: [],
    };
    const portfolio = {
      tenantKey: "tenant-a",
      contracts: [],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "tenant-a",
            contract_id: "CONTRACT-DEPTH-001",
            vendor_ref: "VEN-REGISTER",
            vendor_name: "Register Cloud Vendor, Inc.",
            vendor_category: "cloud_platform",
            contract_archetype: "cloud_services",
            contract_name: "Primary cloud services agreement",
            spend_rows: 12,
            actual_spend_usd: 2_400_000,
            committed_spend_usd: 2_300_000,
            performance_rows: 0,
            unclaimed_credit_usd: 0,
            opportunity_rows: 5,
            scope_rows: 2,
            critical_scope_rows: 1,
            document_page_text_rows: 4,
            coverage_state: "decision_ready",
          },
          {
            tenant_key: "tenant-a",
            contract_id: "CONTRACT-DEPTH-002",
            vendor_ref: "VEN-DEPTH-ALIAS",
            vendor_name: "Register Cloud Vendor, Inc.",
            vendor_category: "cloud_platform",
            contract_archetype: "cloud_services",
            contract_name: "Supplemental cloud services agreement",
            spend_rows: 12,
            actual_spend_usd: 22_000_000,
            committed_spend_usd: 21_100_000,
            performance_rows: 0,
            unclaimed_credit_usd: 0,
            opportunity_rows: 1,
            scope_rows: 1,
            critical_scope_rows: 0,
            document_page_text_rows: 2,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
    };

    const selectedVendor = resolveSelectedVendor(
      portfolio as never,
      [registerVendor as never],
      "VEN-REGISTER",
    );

    expect(selectedVendor?.vendor_ref).toBe("VEN-REGISTER");
    expect(selectedVendor?.vendor_refs).toEqual([
      "VEN-REGISTER",
      "VEN-DEPTH-ALIAS",
    ]);
    expect(
      coverageForVendor(
        selectedVendor as never,
        vendorCoverageRows(portfolio as never),
      ),
    ).toMatchObject({
      spendRows: 24,
      performanceRows: 0,
      actionRows: 6,
      unclaimedCredit: 0,
    });
  });

  it("keeps portfolio summary and concentration on the governed register rows", () => {
    const portfolio = {
      tenantKey: "meridian-health",
      asOfDateIso: "2027-06-30",
      contracts: [
        {
          tenant_key: "meridian-health",
          contract_id: "CTR-REGISTER-001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "platform",
          contract_name: "Register agreement",
          annual_value: 10_000_000,
          actual_annual_spend: null,
          total_committed_value: null,
          committed_annual_spend: null,
          auto_renew: false,
        },
      ],
      vendors: [],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-DBX-001",
            vendor_ref: "MER-VEN-DATABRICKS",
            vendor_name: "Databricks, Inc.",
            vendor_category: "cloud_data_platform",
            contract_archetype: "cloud_consumption",
            contract_name: "Databricks Enterprise Agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
      categoryQuality: { semanticRows: [] },
      applicationScope: [],
      initiativeDependencies: [],
    };
    const vm = new WorkspaceViewModel(
      INITIAL_STATE,
      () => undefined,
      portfolio as never,
      "Meridian Health",
      () => undefined,
    );

    expect(focusableContractRows(portfolio as never)).toHaveLength(2);
    expect(vm.contracts().map((contract) => contract.contract_id)).toEqual([
      "CTR-REGISTER-001",
    ]);
    expect(vm.summary()).toMatchObject({
      contractCount: 1,
      vendorCount: 1,
      totalAnnualValue: 10_000_000,
    });
    expect(
      vm.concentration().byVendor.map((vendor) => vendor.vendorRef),
    ).toEqual(["vendor-register"]);
  });

  it("declares no top-level symbol that nothing exported can reach", () => {
    /*
     * U-503, and the executable replacement for the comment that used to sit
     * here. That comment recorded a finding it could not enforce: thirteen
     * assertions titled "keeps the contract graph tab as a real lineage
     * visual with drill-down subtabs" were green for the whole fortnight
     * after the tab left the IA, because bytes on disk are exactly what
     * survives a component becoming unreachable. Retiring them removed the
     * false coverage and left nothing that would notice the next one.
     *
     * This is that control, and it is a reachability computation rather than
     * a scan: it walks the module's own reference graph out from its exports
     * and reports what the walk never arrives at. When it was first written
     * it returned ten names — `ContractGraphPage`, its four private helpers,
     * `GRAPH_SUBTABS`, and the four label helpers reachable only through
     * them — which is precisely the closure U-503 deleted. It fails again the
     * day a renderer the product cannot mount is added back, and unlike a
     * scan for an absent name it cannot outlive its subject.
     */
    expect(unreachableTopLevelDeclarations(sourceCode())).toEqual([]);
  });

  it("derives graph row volumes from loaded impact coverage before old snapshots", () => {
    const coverage = [
      {
        spend_rows: 24,
        performance_rows: 12,
        document_page_text_rows: 8,
        change_order_rows: 3,
      },
      {
        spend_rows: "180",
        performance_rows: "132",
        document_page_text_rows: "79",
        change_order_rows: "22",
      },
    ] as unknown as Parameters<typeof sourceImpactCoverageRowTotal>[0];

    expect(sourceImpactCoverageRowTotal(coverage, "spend_rows")).toBe(204);
    expect(sourceImpactCoverageRowTotal(coverage, "performance_rows")).toBe(
      144,
    );
    expect(
      sourceImpactCoverageRowTotal(coverage, "document_page_text_rows"),
    ).toBe(87);
    expect(sourceImpactCoverageRowTotal(coverage, "change_order_rows")).toBe(
      25,
    );
  });

  it("keeps the Evidence page visual's stylesheet classes present", () => {
    /*
     * RENDERED. `EvidenceLaneBarChart` and its `aria-label` are mounted and
     * mutation-proved in `WorkspaceExecutiveShell.shell-behaviour.test.tsx`,
     * which also pins the behaviour neither scan reached: a lane with zero
     * rows is still DRAWN, so a missing lane reports itself instead of
     * disappearing.
     *
     * The two CSS classes stay HYGIENE: jsdom parses no stylesheet, so a
     * mounted tree cannot tell a present rule from a missing one.
     * `styleSheet()` at least means a commented-out rule no longer reads as
     * a live one, which a bare `toContain` could not tell apart.
     */
    const css = styleSheet();

    expect(css).toContain(".sw-v2-visual-bars");
    expect(css).toContain(".sw-v2-visual-bar-row");
  });

  it("does not print raw vendor names in executive-facing labels", () => {
    // HYGIENE, and the one case here where comment-proofing changes the
    // control's meaning most: eight of these eleven assertions say a raw
    // identifier is printed NOWHERE. A negative over a whole file is exactly
    // the assertion a stray comment can turn red for no reason, and exactly
    // the assertion no render can make.
    const source = sourceCode();

    expect(source).not.toContain("<b>{vendor.vendor_name}</b>");
    expect(source).not.toContain("<span>{contract.vendor_name}</span>");
    expect(source).not.toContain("<small>{contract.vendor_name}</small>");
    expect(source).not.toContain("value={contract.vendor_name}");
    expect(source).not.toContain("title={selectedVendor?.vendor_name");
    expect(source).not.toContain("? selectedVendor.vendor_name");
    expect(source).not.toContain("return vendor?.vendor_name");
    expect(source).not.toContain("return contract?.vendor_name");
    expect(source).toContain("safeVendorDisplayName(vendor.vendor_name");
    expect(source).toContain("vendor.vendor_ref");
    expect(source).toContain("safeContractVendorDisplayName(contract)");
  });

  it("renders numeric performance actuals from governed rows without throwing", () => {
    expect(performanceActual(89, null)).toBe("89.0%");
    expect(performanceActual(null, 0.91)).toBe("91.0%");
    expect(performanceActual(null, 96)).toBe("96.0%");
    expect(performanceActual("89%", null)).toBe("89%");
  });

  it("collapses duplicate supplier display names before ranking concentration", () => {
    const vendors = topVendors({
      vendors: [
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-platform",
          vendor_name: "Epic Systems Corporation",
          vendor_category: "EHR",
          contract_count: 1,
          annual_value: 86_200_000,
          total_committed_value: 86_200_000,
          auto_renew_contracts: 1,
          next_end_date: "2028-12-31",
          contract_refs: ["CTR-PLATFORM"],
        },
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-modules",
          vendor_name: "Epic Systems Corp.",
          vendor_category: "EHR",
          contract_count: 14,
          annual_value: 50_900_000,
          total_committed_value: 50_900_000,
          auto_renew_contracts: 2,
          next_end_date: "2027-12-31",
          contract_refs: [
            "CTR-0005",
            "CTR-0006",
            "CTR-0007",
            "CTR-0008",
            "CTR-0009",
            "CTR-0005",
          ],
        },
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-cloud",
          vendor_name: "Amazon Web Services",
          vendor_category: "Cloud",
          contract_count: 7,
          annual_value: 55_200_000,
          total_committed_value: 55_200_000,
          auto_renew_contracts: 0,
          next_end_date: "2029-12-31",
          contract_refs: ["CTR-AWS"],
        },
      ],
      contracts: [
        {
          contract_id: "CTR-PLATFORM",
          vendor_ref: "vendor-platform",
          vendor_name: "Epic Systems Corporation",
          annual_value: 86_200_000,
          resolved_annual_value: null,
          total_committed_value: 86_200_000,
          resolved_total_committed_value: null,
          end_date: "2028-12-31",
          auto_renew: true,
        },
        ...["CTR-0005", "CTR-0006", "CTR-0007", "CTR-0008", "CTR-0009"].map(
          (contract_id) => ({
            contract_id,
            vendor_ref: "vendor-modules",
            vendor_name: "Epic Systems Corp.",
            annual_value: 10_180_000,
            resolved_annual_value: null,
            total_committed_value: 10_180_000,
            resolved_total_committed_value: null,
            end_date: "2027-12-31",
            auto_renew: false,
          }),
        ),
        {
          contract_id: "CTR-AWS",
          vendor_ref: "vendor-cloud",
          vendor_name: "Amazon Web Services",
          annual_value: 55_200_000,
          resolved_annual_value: null,
          total_committed_value: 55_200_000,
          resolved_total_committed_value: null,
          end_date: "2029-12-31",
          auto_renew: false,
        },
      ],
    } as unknown as Parameters<typeof topVendors>[0]);

    expect(vendors).toHaveLength(2);
    expect(vendors[0]?.vendor_name).toBe("Epic Systems Corporation");
    expect(vendors[0]?.annual_value).toBe(137_100_000);
    expect(vendors[0]?.contract_count).toBe(6);
    expect(vendors[0]?.contract_refs).toEqual([
      "CTR-PLATFORM",
      "CTR-0005",
      "CTR-0006",
      "CTR-0007",
      "CTR-0008",
      "CTR-0009",
    ]);
    expect(vendors[1]?.vendor_name).toBe("Amazon Web Services");
  });

  it("does not render opaque vendor identifiers as supplier names", () => {
    const vendors = topVendors({
      vendors: [
        {
          tenant_key: "meridian-health",
          vendor_ref: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_name: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_category: null,
          contract_count: 1,
          annual_value: 86_000,
          total_committed_value: 86_000,
          auto_renew_contracts: 0,
          next_end_date: null,
          contract_refs: ["CTR-0002"],
        },
      ],
      contracts: [],
    } as unknown as Parameters<typeof topVendors>[0]);

    expect(vendors[0]?.vendor_name).toBe("Vendor name not resolved");
  });

  it("withholds unresolved supplier rows from evidence-focused vendor lists", () => {
    const portfolio = {
      vendors: [
        {
          tenant_key: "meridian-health",
          vendor_ref: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_name: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_category: null,
          contract_count: 1,
          annual_value: 86_000,
          total_committed_value: 86_000,
          auto_renew_contracts: 0,
          next_end_date: null,
          contract_refs: ["CTR-0002"],
        },
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-salesforce",
          vendor_name: "Salesforce, Inc.",
          vendor_category: "crm_saas",
          contract_count: 1,
          annual_value: 9_200_000,
          total_committed_value: 9_200_000,
          auto_renew_contracts: 0,
          next_end_date: null,
          contract_refs: ["MER-TECH-SFDC-001"],
        },
      ],
      contracts: [],
      impact: {
        evidenceCoverage: [
          {
            contract_id: "CTR-0002",
            vendor_ref: "24fc65af-8223-4884-9241-ef5736960a1b",
            vendor_name: "24fc65af-8223-4884-9241-ef5736960a1b",
            spend_rows: 24,
            performance_rows: 24,
            opportunity_rows: 2,
            unclaimed_credit_usd: 86_000,
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            vendor_ref: "vendor-salesforce",
            vendor_name: "Salesforce, Inc.",
            spend_rows: 12,
            performance_rows: 0,
            opportunity_rows: 1,
            unclaimed_credit_usd: 0,
          },
        ],
      },
    } as unknown as Parameters<typeof topVendors>[0];

    const vendors = topVendors(portfolio);
    const focus = focusedVendorSet(
      portfolio as Parameters<typeof focusedVendorSet>[0],
      vendors,
      "evidence",
      7,
    );

    expect(focus.rows.map(({ vendor }) => vendor.vendor_name)).toEqual([
      "Salesforce, Inc.",
    ]);
    expect(focus.unresolvedCount).toBe(1);
    expect(
      focus.rows.some(
        ({ vendor }) => vendor.vendor_name === "Vendor name not resolved",
      ),
    ).toBe(false);
  });

  it("does not render action narrative as a benchmarking clause", () => {
    expect(displayBenchmarkingClause("benchmarking clause present")).toBe(
      "benchmarking clause present",
    );
    expect(
      displayBenchmarkingClause(
        "(1) Right-size the 8% unused entitlements at renewal -- approximately $4.14M annually at current unit pricing.",
      ),
    ).toBe("Not established");
    expect(displayBenchmarkingClause(null)).toBe("Not established");
  });

  it("prefers deterministic impact-layer credits over broader snapshot credits", () => {
    const portfolio = {
      impact: {
        evidenceCoverage: [
          {
            load_run_id: "active-load",
            unclaimed_credit_usd: 102_666.65,
          },
          {
            load_run_id: "active-load",
            unclaimed_credit_usd: 0,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "active-load",
      },
    };

    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBe(102_666.65);
  });

  it("keeps the credit headline scoped to the active deterministic load run", () => {
    const portfolio = {
      impact: {
        actionCandidates: [],
        evidenceCoverage: [
          {
            contract_id: "OLD-001",
            load_run_id: "older-load",
            unclaimed_credit_usd: 86_333.35,
          },
          {
            contract_id: "MER-TECH-AMS-001",
            load_run_id: "active-load",
            unclaimed_credit_usd: 37_466.66,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "active-load",
            unclaimed_credit_usd: 50_866.66,
          },
          {
            contract_id: "CTR-0002",
            load_run_id: "active-load",
            unclaimed_credit_usd: 14_333.33,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "active-load",
      },
    };

    expect(
      source360RecoverableCreditCoverageRows(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditCoverageRows
        >[0],
      ).map((row) => row.contract_id),
    ).toEqual(["MER-TECH-AMS-001", "MER-TECH-SD-001", "CTR-0002"]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(102_666.65, 2);
  });

  it("falls back to snapshot credits when no deterministic impact credit is loaded", () => {
    const portfolio = {
      impact: {
        actionCandidates: [],
        evidenceCoverage: [
          {
            load_run_id: "active-load",
            unclaimed_credit_usd: 0,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 43_000.02,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "active-load",
      },
    };

    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBe(43_000.02);
  });

  it("does not blend historical credit coverage into the current action headline", () => {
    const portfolio = {
      impact: {
        actionCandidates: [
          {
            contract_id: "MER-TECH-SD-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
          },
        ],
        evidenceCoverage: [
          {
            contract_id: "OLD-001",
            load_run_id: "older-load",
            unclaimed_credit_usd: 86_333.35,
            opportunity_rows: 1,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "current-package",
            unclaimed_credit_usd: 50_866.66,
            opportunity_rows: 1,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: null,
      },
    };

    expect(
      source360RecoverableCreditCoverageRows(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditCoverageRows
        >[0],
      ).map((row) => row.contract_id),
    ).toEqual(["MER-TECH-SD-001"]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(50_866.66, 2);
  });

  it("uses the richest deterministic impact package when workspace diagnostics name a broad projection", () => {
    const portfolio = {
      contracts: [],
      vendors: [],
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "ecl-dense-source-room-projection",
      },
      impact: {
        actionCandidates: [
          {
            contract_id: "OLD-CTR-0002",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 72_000,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 15_166.67,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-AMS-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 188_199.99,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-SD-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 50_499.99,
            finance_confirmation_state: "not_confirmed",
          },
        ],
        evidenceCoverage: [
          {
            contract_id: "OLD-CTR-0002",
            load_run_id: "recorded-data-refresh-6a94e1cf-runtime-l3",
            unclaimed_credit_usd: 72_000,
            document_page_text_rows: 0,
            change_order_rows: 0,
            opportunity_rows: 2,
            scope_rows: 0,
            spend_rows: 24,
            performance_rows: 24,
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 15_166.67,
            document_page_text_rows: 6,
            change_order_rows: 1,
            opportunity_rows: 1,
            scope_rows: 3,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-AMS-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 36_999.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 2,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 50_499.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 1,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
        ],
      },
    };

    expect(
      source360RecoverableCreditCoverageRows(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditCoverageRows
        >[0],
      ).map((row) => row.contract_id),
    ).toEqual(["MER-TECH-SFDC-001", "MER-TECH-AMS-001", "MER-TECH-SD-001"]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(102_666.65, 2);

    const recoverableType = optimizeTypeRows(
      portfolio as unknown as Parameters<typeof optimizeTypeRows>[0],
    ).find((row) => row.type === "recoverable leakage");

    expect(recoverableType).toMatchObject({
      count: 3,
      amount: 102_666.65,
    });
  });

  it("keeps recoverable leakage type mix aligned to credit coverage when an action card is missing", () => {
    const portfolio = {
      contracts: [],
      vendors: [],
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "ecl-dense-source-room-projection",
      },
      impact: {
        actionCandidates: [
          {
            contract_id: "MER-TECH-AMS-001",
            action_type: "avoid_future_spend",
            opportunity_type: "change_order_control",
            title:
              "Convert recurring AMS change orders into base service catalog",
            finding_summary:
              "Recurring change orders should be moved into run catalog.",
            deterministic_basis: "change order rows",
            candidate_amount_usd: 151_000,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-SD-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 50_499.99,
            finance_confirmation_state: "not_confirmed",
          },
        ],
        evidenceCoverage: [
          {
            contract_id: "MER-TECH-SFDC-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 15_166.67,
            document_page_text_rows: 6,
            change_order_rows: 1,
            opportunity_rows: 1,
            scope_rows: 3,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-AMS-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 36_999.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 2,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 50_499.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 1,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
        ],
      },
    };

    const rows = optimizeTypeRows(
      portfolio as unknown as Parameters<typeof optimizeTypeRows>[0],
    );

    expect(
      rows.find((row) => row.type === "recoverable leakage"),
    ).toMatchObject({
      count: 3,
      amount: 102_666.65,
    });
    expect(
      rows.find((row) => row.type === "change order control"),
    ).toMatchObject({
      count: 1,
      amount: 151_000,
    });
  });

  it("aggregates vendor evidence depth rows for charting without inventing coverage", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "MER-TECH-AMS-001",
          vendor_ref: "vendor-cognizant",
          vendor_name: "Cognizant Technology Solutions",
        },
        {
          contract_id: "MER-TECH-SD-001",
          vendor_ref: "vendor-kyndryl",
          vendor_name: "Kyndryl, Inc.",
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            contract_id: "MER-TECH-AMS-001",
            vendor_ref: "vendor-cognizant",
            spend_rows: 12,
            performance_rows: 12,
            opportunity_rows: 2,
            unclaimed_credit_usd: 36_999.99,
          },
          {
            contract_id: "MER-TECH-SD-001",
            vendor_ref: null,
            spend_rows: 12,
            performance_rows: 12,
            opportunity_rows: 1,
            unclaimed_credit_usd: 50_499.99,
          },
        ],
      },
    };

    const rows = vendorCoverageRows(
      portfolio as unknown as Parameters<typeof vendorCoverageRows>[0],
    );

    expect(rows.get("vendor-cognizant")).toMatchObject({
      spendRows: 12,
      performanceRows: 12,
      actionRows: 2,
      unclaimedCredit: 36_999.99,
    });
    expect(rows.get("vendor-kyndryl")).toMatchObject({
      spendRows: 12,
      performanceRows: 12,
      actionRows: 1,
      unclaimedCredit: 50_499.99,
    });
  });

  it("rolls vendor archetype charts from declared contract categories", () => {
    const rows = vendorArchetypeRows({
      contracts: [
        {
          contract_id: "MER-TECH-M365-001",
          vendor_ref: "vendor-msft",
          vendor_name: "Microsoft Corporation",
          vendor_category: "SaaS",
          annual_value: 14_800_000,
        },
        {
          contract_id: "MER-TECH-SFDC-001",
          vendor_ref: "vendor-sfdc",
          vendor_name: "Salesforce, Inc.",
          vendor_category: "SaaS",
          annual_value: 9_200_000,
        },
        {
          contract_id: "MER-TECH-AWS-001",
          vendor_ref: "vendor-aws",
          vendor_name: "Amazon Web Services, Inc.",
          vendor_category: "Cloud",
          annual_value: 11_800_000,
        },
      ],
    } as unknown as Parameters<typeof vendorArchetypeRows>[0]);

    expect(rows[0]).toMatchObject({
      category: "SaaS",
      vendorCount: 2,
      contractCount: 2,
      annualValue: 24_000_000,
      vendorRef: "vendor-msft",
      vendorName: "Microsoft Corporation",
    });
    expect(rows[1]).toMatchObject({
      category: "Cloud",
      vendorCount: 1,
      contractCount: 1,
      annualValue: 11_800_000,
      vendorRef: "vendor-aws",
      vendorName: "Amazon Web Services, Inc.",
    });
  });

  it("excludes unmapped contract categories from archetype chart rows", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "CTR-0001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "Not established",
          annual_value: 549_000_000,
        },
        {
          contract_id: "MER-TECH-M365-001",
          vendor_ref: "vendor-msft",
          vendor_name: "Microsoft Corporation",
          vendor_category: "productivity_platform",
          annual_value: 14_800_000,
        },
      ],
    } as unknown as Parameters<typeof vendorArchetypeRows>[0];

    expect(vendorArchetypeRows(portfolio)).toEqual([
      {
        category: "productivity_platform",
        vendorCount: 1,
        contractCount: 1,
        annualValue: 14_800_000,
        vendorRef: "vendor-msft",
        vendorName: "Microsoft Corporation",
      },
    ]);
    expect(vendorArchetypeCoverage(portfolio)).toEqual({
      totalContracts: 2,
      declaredContracts: 1,
      unmappedCount: 1,
      supplementalDeclaredCount: 0,
    });
  });

  it("keeps declared supplemental evidence out of annual-value archetype charts", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "CTR-0001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "Not established",
          annual_value: 549_000_000,
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            contract_id: "MER-TECH-M365-001",
            vendor_ref: "vendor-msft",
            vendor_name: "Microsoft Corporation",
            vendor_category: "productivity_platform",
            committed_spend_usd: 14_800_000,
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            vendor_ref: "vendor-sfdc",
            vendor_name: "Salesforce, Inc.",
            contract_archetype: "crm_saas",
            actual_spend_usd: 9_200_000,
          },
        ],
      },
    } as unknown as Parameters<typeof vendorArchetypeRows>[0];

    expect(vendorArchetypeRows(portfolio)).toEqual([]);
    expect(vendorArchetypeCoverage(portfolio)).toEqual({
      totalContracts: 3,
      declaredContracts: 2,
      unmappedCount: 1,
      supplementalDeclaredCount: 2,
    });
  });

  it("shows canonical depth archetypes in the mix without changing the register denominator", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "CTR-0001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "Not established",
          annual_value: 549_000_000,
        },
      ],
      archetypeCoverageRows: [
        {
          tenant_key: "meridian-health",
          contract_id: "MER-TECH-DBX-001",
          vendor_ref: "vendor-databricks",
          vendor_name: "Databricks, Inc.",
          contract_archetype: "cloud_consumption_commit",
          annual_value: 1_550_000,
        },
      ],
    } as unknown as Parameters<typeof vendorArchetypeRows>[0];

    expect(vendorArchetypeRows(portfolio)).toEqual([
      {
        category: "cloud_consumption_commit",
        vendorCount: 1,
        contractCount: 1,
        annualValue: 1_550_000,
        vendorRef: "vendor-databricks",
        vendorName: "Databricks, Inc.",
      },
    ]);
    expect(vendorArchetypeCoverage(portfolio)).toEqual({
      totalContracts: 2,
      declaredContracts: 1,
      unmappedCount: 1,
      supplementalDeclaredCount: 1,
    });
  });

  it("turns coverage readiness into readable decision rows instead of chart coordinates", () => {
    const rows = vendorReadinessDecisionRows({
      tenantKey: "meridian-health",
      impact: {
        vendorPositions: [
          {
            vendor_ref: "vendor-ready",
            vendor_name: "Ready Vendor",
            contract_count: 4,
            annual_value: 1_000_000,
            action_candidate_count: 2,
            candidate_amount_usd: 250_000,
            decision_ready_contracts: 3,
            spend_rows: 12,
            performance_rows: 4,
            unclaimed_credit_usd: 10_000,
            vendor_position_state: "decision_ready",
          },
          {
            vendor_ref: "vendor-large",
            vendor_name: "Large Thin Vendor",
            contract_count: 10,
            annual_value: 10_000_000,
            action_candidate_count: 0,
            candidate_amount_usd: 0,
            decision_ready_contracts: 0,
            spend_rows: 0,
            performance_rows: 0,
            unclaimed_credit_usd: 0,
            vendor_position_state: "not_loaded",
          },
        ],
      },
    } as unknown as Parameters<typeof vendorReadinessDecisionRows>[0]);

    expect(rows[0]).toMatchObject({
      vendorRef: "vendor-ready",
      annualValueLabel: "$1.0M",
      candidateValueLabel: "$250K",
      readinessLabel: "3/4 ready · 75%",
      actionLabel: "2 actions",
      evidenceLabel: "12 spend · 4 performance · credit gap",
      postureLabel: "Decision Ready",
    });
    expect(rows[1]).toMatchObject({
      vendorRef: "vendor-large",
      candidateValueLabel: "No candidate value",
      readinessLabel: "0/10 ready · 0%",
      evidenceLabel: "No depth evidence",
      postureLabel: "Not Loaded",
    });
    expect(rows[0]).not.toHaveProperty("x");
    expect(rows[0]).not.toHaveProperty("y");
    expect(rows[0]).not.toHaveProperty("size");
  });
  it("shows the levers themselves, not just a count of them", () => {
    const rows = leverTableRows([
      {
        id: "OPP-1",
        buyerAsk: "Amend Section 2 to carry unused commitment forward.",
        vendorConcession: "Scheduling concession, no cash cost.",
        negotiationLanguage: null,
      },
      {
        id: "OPP-2",
        buyerAsk: null,
        vendorConcession: null,
        negotiationLanguage: "Tie the fee to what we actually run.",
      },
      {
        id: "OPP-3",
        buyerAsk: null,
        vendorConcession: null,
        negotiationLanguage: null,
      },
    ]);
    // A lever with no ask and no language has nothing to show a negotiator,
    // so it stays out of the table rather than rendering an empty row.
    expect(rows.map((row) => row.id)).toEqual(["OPP-1", "OPP-2"]);
  });

  it("keeps signal-stage levers out of the sized opportunity total", () => {
    const total = sizedOpportunityTotalUsd([
      { stageRaw: "quantified", amountUsd: 400_000 },
      { stageRaw: "quantified", amountUsd: 620_000 },
      { stageRaw: "signal", amountUsd: 900_000 },
      { stageRaw: "quantified", amountUsd: null },
    ]);
    // The signal row must not inflate the headline, and a null amount must
    // not throw the sum.
    expect(total).toBe(1_020_000);
  });

  it("scales monthly consumption ramp rows against the largest commitment month", () => {
    const rows = consumptionRampRows(
      [
        {
          period_start: "2026-01-01",
          period_end: "2026-01-31",
          committed_amount: 100_000,
          actual_spend: 50_000,
        },
        {
          period_start: "2026-02-01",
          period_end: "2026-02-28",
          committed_amount: 200_000,
          actual_spend: 25_000,
        },
        {
          period_start: "2026-03-01",
          period_end: "2026-12-31",
          committed_amount: null,
          actual_spend: 10_000,
        },
      ],
      new Date("2026-03-15T00:00:00Z"),
    );

    expect(rows.map((row) => row.periodLabel)).toEqual(["Jan", "Feb", "Mar"]);
    expect(rows[0].committedScalePct).toBe(50);
    expect(rows[0].actualScalePct).toBe(25);
    expect(rows[0].utilizationPct).toBe(50);
    expect(rows[1].utilizationPct).toBe(13);
    expect(rows[2].committedScalePct).toBeNull();
    expect(rows[2].utilizationPct).toBeNull();
    expect(rows[2].isPartial).toBe(true);
  });

  it("renders no ramp rows when no monthly observations are loaded", () => {
    expect(consumptionRampRows([])).toEqual([]);
  });

  it("orders negotiation levers by authored play while keeping held-back asks last", () => {
    const rows = negotiationSequenceRows([
      {
        id: "OPT-DISCOUNT-REPRICE",
        label: "Signal-stage discount band re-price review",
        buyerAsk: "Re-price the discount band.",
        vendorConcession: null,
        negotiationLanguage: null,
        timingDependency: "Load benchmark first.",
        owner: "Sourcing",
        ownerRole: "Strategic sourcing",
        priority: "P0",
        deadline: "2026-09-01",
        stageRaw: "signal",
      },
      {
        id: "OPT-COMMIT-RAMP",
        label: "Re-time annual commitment to program delivery pace",
        buyerAsk: "Reset the commitment ramp.",
        vendorConcession: null,
        negotiationLanguage: null,
        timingDependency: "Before year-two lock.",
        owner: "Finance",
        ownerRole: "Technology finance",
        priority: "P0",
        deadline: "2026-08-01",
        stageRaw: "quantified",
      },
      {
        id: "OPT-CARRY-FORWARD",
        label: "Add carry-forward provision for unused year-one commitment",
        buyerAsk: "Carry unused commitment forward.",
        vendorConcession: null,
        negotiationLanguage: null,
        timingDependency: "Before payment authorization.",
        owner: "Sourcing",
        ownerRole: "Strategic sourcing",
        priority: "P1",
        deadline: "2026-12-01",
        stageRaw: "quantified",
      },
      {
        id: "OPT-SUPPORT-REBASE",
        label: "Re-base support fee to consumed spend",
        buyerAsk: "Tie support to consumed spend.",
        vendorConcession: null,
        negotiationLanguage: null,
        timingDependency: "Attach to amendment.",
        owner: "Finance",
        ownerRole: "Technology finance",
        priority: "P0",
        deadline: "2026-10-01",
        stageRaw: "quantified",
      },
    ]);

    expect(rows.map((row) => row.opportunity.id)).toEqual([
      "OPT-CARRY-FORWARD",
      "OPT-COMMIT-RAMP",
      "OPT-SUPPORT-REBASE",
      "OPT-DISCOUNT-REPRICE",
    ]);
    expect(rows.at(-1)?.holdBack).toBe(true);
    expect(rows.at(-1)?.evidenceGap).toContain("benchmark comparable");
  });

  it("falls back to priority when a lever has no authored sequencing rule", () => {
    const rows = negotiationSequenceRows([
      {
        id: "OPT-GENERIC-MISSING",
        label: "Generic missing priority",
        buyerAsk: "Review commercial term.",
        priority: null,
        deadline: "2026-01-01",
        stageRaw: "quantified",
      },
      {
        id: "OPT-GENERIC-P2",
        label: "Generic priority two",
        buyerAsk: "Review commercial term.",
        priority: "P2",
        deadline: "2026-12-31",
        stageRaw: "signal",
      },
    ]);

    expect(rows.map((row) => row.opportunity.id)).toEqual([
      "OPT-GENERIC-P2",
      "OPT-GENERIC-MISSING",
    ]);
  });

  it("does not sequence rows that have no negotiation detail", () => {
    expect(
      negotiationSequenceRows([
        {
          id: "OPT-EMPTY",
          label: "Empty opportunity",
          buyerAsk: null,
          vendorConcession: null,
          negotiationLanguage: null,
          timingDependency: null,
          priority: null,
          deadline: null,
          stageRaw: "quantified",
        },
      ]),
    ).toEqual([]);
  });

  it("reads an absent value type as a finding instead of a blank row", () => {
    const summary = contractValueTypeSummary({
      potential: {
        recoverable: "Not established",
        avoidable: "Not established",
        negotiable: "$1.8M",
      },
      financeConfirmed: "Not established",
    });
    expect(summary.established.map(([label]) => label)).toEqual(["Negotiable"]);
    expect(summary.absent).toEqual(["recoverable", "avoidable"]);
    expect(summary.confirmed).toBeNull();
  });

  it("still lists recoverable value when the contract actually has some", () => {
    const summary = contractValueTypeSummary({
      potential: {
        recoverable: "$50.5K",
        avoidable: "Not established",
        negotiable: "$1.8M",
      },
      financeConfirmed: "$12.0K",
    });
    expect(summary.established.map(([label]) => label)).toEqual([
      "Recoverable",
      "Negotiable",
    ]);
    expect(summary.absent).toEqual(["avoidable"]);
    expect(summary.confirmed).toBe("$12.0K");
  });

  it("keeps portfolio-level facts off a single-contract view", () => {
    // HYGIENE. `stripComments` preserves offsets, so the window arithmetic
    // below still indexes real code — and a commented-out guard no longer
    // reads as a live one, which is the failure this window was blind to.
    const source = sourceCode();
    const marker = source.indexOf("<SourceCommandKpiStrip");
    expect(marker).toBeGreaterThan(-1);
    // The portfolio strip must sit behind a selected-contract guard so a
    // reader drilled into one agreement is not shown book-level totals.
    expect(source.slice(Math.max(0, marker - 220), marker)).toContain(
      'selectedContractId || currentPage !== "Command" ? null : (',
    );
  });

  it("gives full-width command panels a real grid span", () => {
    // HYGIENE. jsdom applies no stylesheet, so this cannot become a render.
    const css = styleSheet();

    expect(css).toContain(".sw-v2-span-3");
    expect(css).toContain("grid-column: 1 / -1;");
  });

  /*
   * Both cloud-consumption cases below supply `purpose_summary`.
   *
   * They did not, until T-588. They were written against a branch of
   * `contractPurposeSummary` that, when no purpose had been reviewed,
   * synthesised one from the contract header — "This is a cloud consumption
   * commitment with <vendor> covering <scope>" — and `3d2b23f32` (#8128)
   * deleted that branch on purpose, because a characterisation asserted in the
   * same voice as a reviewed extraction is the thing a governed surface must
   * not do. That commit updated the three sibling suites in this directory and
   * missed this one, which is the only suite here that no workflow runs.
   *
   * So the fixtures are updated, not the expectations: a case about how a
   * reviewed purpose reads has to supply one. What each case asserts about
   * classification, evidence and identifier leakage is unchanged. The
   * unreviewed input keeps its own case immediately below, so the deleted
   * branch stays deleted and cannot return unnoticed.
   */
  const cloudConsumptionContract = {
    contract_id: "MER-TECH-DBX-001",
    vendor_ref: "MER-VEN-DATABRICKS",
    vendor_name: "Databricks, Inc.",
    vendor_category: "cloud_data_platform",
    contract_name:
      "Databricks Enterprise Agreement - Platform, Support and Committed Purchase",
    scope_summary: "Cloud data platform subscription - absent - for_cause_only",
    annual_value: 1_900_000,
    resolved_annual_value: null,
    actual_annual_spend: null,
  };

  const cloudConsumptionCoverage = {
    contract_id: "MER-TECH-DBX-001",
    contract_archetype: "cloud_consumption",
    actual_spend_usd: 66_000,
    committed_spend_usd: 1_900_000,
    scope_rows: 4,
    spend_rows: 12,
    document_page_text_rows: 6,
    opportunity_rows: 6,
  };

  it("summarizes a cloud consumption contract before showing optimization levers", () => {
    const summary = contractPurposeSummary(
      {
        ...cloudConsumptionContract,
        purpose_summary:
          "Databricks, Inc. supplies the lakehouse platform under Platform, Support and Committed Purchase, drawn down against a committed annual purchase.",
      } as never,
      cloudConsumptionCoverage as never,
    );

    expect(summary.heading).toBe("What this contract is");
    expect(summary.body).toContain("Databricks, Inc.");
    expect(summary.body).toContain("Platform, Support and Committed Purchase");
    // `readAs` is the classification the reader actually sees in the body.
    expect(summary.body).toContain("usage-backed commercial commitment");
    expect(summary.evidence).toContain("Reviewed purpose extraction");
    expect(summary.evidence).toContain("Cloud Consumption archetype");
    expect(summary.evidence).toContain("$1.9M annual value");
    expect(summary.evidence).toContain("$66K observed spend");
    expect(summary.evidence).toContain("6 document text rows");
    expect(summary.evidence).toContain("6 opportunity rows");
  });

  it("refuses to characterise the same contract when no purpose is reviewed", () => {
    // Same contract, same evidence, no reviewed purpose. The card must say so
    // rather than assemble a characterisation out of the header — the header
    // here would classify as cloud consumption perfectly well, which is
    // precisely why the refusal has to be tested on a contract that would
    // otherwise read convincingly.
    const summary = contractPurposeSummary(
      cloudConsumptionContract as never,
      cloudConsumptionCoverage as never,
    );

    expect(summary.heading).toBe("Purpose review needed");
    expect(summary.body).toBe(
      "No reviewed contract-purpose extraction is available.",
    );
    expect(summary.body).not.toContain("cloud consumption commitment");
    expect(summary.body).not.toContain("Databricks, Inc.");
    // The evidence that IS loaded is still reported; refusing to characterise
    // is not the same as withholding what the header establishes.
    expect(summary.evidence).toContain("Cloud Consumption archetype");
    expect(summary.evidence).toContain("$1.9M annual value");
  });

  it("refuses a purpose extraction that is really concatenated clause enums", () => {
    /*
     * The identifier-leak guard, on the one input from which identifiers can
     * still reach a reader.
     *
     * Before T-588 this contract's clause enums were asserted absent from the
     * body of the *derived* characterisation, which read them off
     * `scope_summary`. That branch is gone, so nothing on `scope_summary` can
     * reach the body any more and an assertion about it there could no longer
     * fail. The live path for the same defect is a stored `purpose_summary`
     * that is itself column values rather than prose — the loaders write that
     * field, so it is a real shape, not a contrived one. It must refuse, not
     * render.
     */
    const summary = contractPurposeSummary(
      {
        ...cloudConsumptionContract,
        purpose_summary:
          "Cloud data platform subscription - absent - for_cause_only",
      } as never,
      cloudConsumptionCoverage as never,
    );

    expect(summary.heading).toBe("Purpose review needed");
    expect(summary.body).not.toContain("for_cause_only");
    expect(summary.body).not.toContain("absent");
  });

  it("refuses a purpose extraction that states a value is absent in prose", () => {
    /*
     * The second of `usableScopeSummary`'s two independent rejections, and it
     * needs its own case because the first one masks it.
     *
     * The case above is refused by the `" - absent -"` separator test before
     * the bare-word list is ever consulted — deleting that word list leaves the
     * case above green, which a mutation showed rather than a reading. This
     * fixture carries the bare word in prose with no separator shape, so only
     * the word list can refuse it.
     *
     * Noted while proving this: the word list's `for_cause_only` alternative
     * was unreachable, because `withoutIdentifierTokens` stripped snake_case
     * runs before the list was applied. T-591 repaired it by consulting the
     * list on the raw value first. The alternatives now live in
     * `@/lib/source/contract-purpose-refusal`, and
     * `src/__tests__/behaviors/source-contract-purpose-refusal-alternatives.test.ts`
     * enumerates them so a future alternative the stripper would swallow fails
     * a required check rather than becoming dead — this suite is named by no
     * workflow, which is why the enumeration does not live here.
     */
    const summary = contractPurposeSummary(
      {
        ...cloudConsumptionContract,
        purpose_summary: "Committed purchase detail is absent pending review.",
      } as never,
      cloudConsumptionCoverage as never,
    );

    expect(summary.heading).toBe("Purpose review needed");
    expect(summary.body).toBe(
      "No reviewed contract-purpose extraction is available.",
    );
  });

  it("gives Story, Scope, Relationship, and Evidence distinct CXO-ready narratives", () => {
    const contract = {
      contract_id: "CONTRACT-CLOUD-001",
      vendor_ref: "VENDOR-CLOUD",
      vendor_name: "Cloud Platform Vendor, Inc.",
      vendor_category: "cloud_data_platform",
      contract_name:
        "Enterprise Agreement - Platform, Support and Committed Purchase",
      scope_summary: null,
      annual_value: 1_900_000,
      resolved_annual_value: null,
      actual_annual_spend: 66_000,
    } as never;
    const coverage = {
      contract_id: "CONTRACT-CLOUD-001",
      contract_archetype: "cloud_consumption",
      actual_spend_usd: 66_000,
      committed_spend_usd: 1_900_000,
      scope_rows: 4,
      spend_rows: 12,
      document_page_text_rows: 0,
      opportunity_rows: 6,
      performance_rows: 12,
    } as never;
    const scopeRows = [
      {
        application_name: "Claims analytics workload",
        business_function: "Revenue Cycle Analytics",
        hosting_model: "AWS",
        criticality: "Tier 2",
      },
      {
        application_name: "Data migration workload",
        business_function: "Enterprise Data & Analytics",
        hosting_model: "AWS",
        criticality: "Tier 1",
      },
    ] as never;
    const vm = {
      detailState: "ready",
      opportunityView: {
        opportunities: [
          { stageRaw: "quantified", amountUsd: 1_500_000 },
          { stageRaw: "signal", amountUsd: 300_000 },
        ],
      },
    } as never;

    const story = contractTabNarrative(
      "Story",
      vm,
      contract,
      coverage,
      scopeRows,
      undefined,
    );
    const scope = contractTabNarrative(
      "Scope",
      vm,
      contract,
      coverage,
      scopeRows,
      undefined,
    );
    const relationship = contractTabNarrative(
      "Relationship",
      vm,
      contract,
      coverage,
      scopeRows,
      undefined,
    );
    const evidence = contractTabNarrative(
      "Evidence",
      vm,
      contract,
      coverage,
      scopeRows,
      undefined,
    );

    expect(story.provenance).toBe("Executive story");
    expect(story.headline).toContain("governed optimization levers");
    expect(scope.provenance).toBe("Scope story");
    expect(scope.headline).toContain("not the whole enterprise");
    expect(scope.body).toContain("Plain English scope");
    expect(relationship.provenance).toBe("Relationship map");
    expect(relationship.body).toContain("vendor -> contract");
    expect(evidence.provenance).toBe("Evidence boundary");
    expect(evidence.headline).toContain("Document pages are not attached");
    expect(evidence.body).toContain("structured rows support");
  });

  it("turns an empty Performance tab into an explicit governed gap instead of filler counts", () => {
    const performance = contractTabNarrative(
      "Performance",
      { detailState: "ready", detail: { performancePeriods: [] } } as never,
      {
        contract_id: "CONTRACT-CLOUD-001",
        vendor_name: "Cloud Platform Vendor, Inc.",
        contract_name: "Enterprise Agreement - Platform Commitment",
      } as never,
      {
        contract_id: "CONTRACT-CLOUD-001",
        scope_rows: 4,
        spend_rows: 12,
        performance_rows: 0,
        document_page_text_rows: 0,
        opportunity_rows: 6,
      } as never,
      [] as never,
      undefined,
    );

    expect(performance.provenance).toBe("Performance gap");
    expect(performance.headline).toBe("No performance periods loaded.");
    expect(performance.body).toContain(
      "can still be optimized on consumption, commitment timing, and commercial terms",
    );
    expect(performance.body).toContain("cannot support a service-quality");
    expect(performance.blocker).toContain("Load ITSM, SLA, service-credit");
    expect(performance.body).not.toContain("Scope rows");
    expect(performance.body).not.toContain("Document pages");
  });

  it("does not force cloud language onto a generic managed-services contract", () => {
    // Fixture updated by T-588 for the reason recorded above the cloud case:
    // a contract whose purpose has been reviewed supplies `purpose_summary`.
    // The classification assertion moves from `label` to `readAs` because
    // `readAs` is what a reviewed body actually renders.
    const summary = contractPurposeSummary({
      contract_id: "MER-AMS-001",
      vendor_ref: "VEN-AMS",
      vendor_name: "Service Partner",
      vendor_category: "managed_services",
      contract_name: "Application Managed Services SOW",
      purpose_summary:
        "Service Partner provides run support, service desk triage, and change-request governance for the application estate.",
      scope_summary:
        "run support, service desk triage, and change-request governance",
      annual_value: 7_200_000,
      resolved_annual_value: null,
      actual_annual_spend: 7_100_000,
    } as never);

    expect(summary.heading).toBe("What this contract is");
    expect(summary.body).toContain(
      "run support, service desk triage, and change-request governance",
    );
    expect(summary.body).toContain(
      "service-scope and performance-control agreement",
    );
    expect(summary.body).not.toContain("cloud consumption commitment");
    expect(summary.body).not.toContain("usage-backed commercial commitment");
    expect(summary.evidence).toContain("Managed Services archetype");
    expect(summary.evidence).toContain("$7.2M annual value");
  });

  it("summarizes discount evidence as portfolio-relative, not external benchmark proof", () => {
    const summary = portfolioDiscountComparatorSummary(
      "MER-TECH-DBX-001",
      [
        {
          contract_id: "MER-TECH-DBX-001",
          cloud_provider: "aws",
          commitment_covered_spend_usd: 10_000,
          expected_discount_pct: 0.09,
        },
        {
          contract_id: "MER-CLOUD-AWS-001",
          cloud_provider: "aws",
          commitment_covered_spend_usd: 500_000,
          expected_discount_pct: 0.28,
        },
      ],
      [
        {
          id: "OPT-DBX-DISCOUNT-REPRICE-001",
          label: "Signal-stage discount band re-price review",
          stageRaw: "signal",
          blockingGap:
            "Benchmark comparable required before discount-band value can be treated as supported.",
        },
      ],
    );

    expect(summary?.headline).toBe(
      "Loaded discount 9.0%; same-tenant cloud peer median 28.0%.",
    );
    expect(summary?.basis).toContain("1 peer contract");
    expect(summary?.basis).toContain("portfolio-relative range of 28.0%");
    expect(summary?.caveat).toContain("not an external market benchmark");
    expect(summary?.evidenceGate).toContain("Benchmark comparable required");
  });

  it("normalizes loaded discount percentages stored as whole percentages", () => {
    const summary = portfolioDiscountComparatorSummary(
      "MER-TECH-DBX-001",
      [
        {
          contract_id: "MER-TECH-DBX-001",
          cloud_provider: "aws",
          commitment_covered_spend_usd: 1_900_000,
          expected_discount_pct: 9,
        },
        {
          contract_id: "MER-CLOUD-AWS-001",
          cloud_provider: "aws",
          commitment_covered_spend_usd: 23_400_000,
          expected_discount_pct: 28,
        },
      ],
      [
        {
          id: "OPT-DBX-DISCOUNT-REPRICE-001",
          label: "Signal-stage discount band re-price review",
          stageRaw: "signal",
          blockingGap:
            "Benchmark comparable required before discount-band value can be treated as supported.",
        },
      ],
    );

    expect(summary?.headline).toBe(
      "Loaded discount 9.0%; same-tenant cloud peer median 28.0%.",
    );
    expect(summary?.basis).toContain("portfolio-relative range of 28.0%");
  });

  it("keeps the discount ask gated when no same-tenant comparator is loaded", () => {
    const summary = portfolioDiscountComparatorSummary(
      "MER-TECH-DBX-001",
      [
        {
          contract_id: "MER-TECH-DBX-001",
          cloud_provider: "aws",
          commitment_covered_spend_usd: 10_000,
          expected_discount_pct: 0.09,
        },
      ],
      [
        {
          id: "OPT-DBX-DISCOUNT-REPRICE-001",
          label: "Signal-stage discount band re-price review",
          stageRaw: "signal",
          blockingGap:
            "Benchmark comparable required before discount-band value can be treated as supported.",
        },
      ],
    );

    expect(summary?.headline).toBe(
      "Loaded discount 9.0%; no same-tenant cloud peer discount is loaded.",
    );
    expect(summary?.peerMedianPct).toBeNull();
    expect(summary?.basis).toContain("cannot benchmark the rate");
    expect(summary?.factLine).toContain("Evidence gate");
  });
});

/*
 * The scanner that the HYGIENE controls above now depend on, proved in both
 * directions. Without this block, `stripComments` is itself an unproved
 * control: if it were inverted — or if it silently blanked nothing — every
 * assertion above would keep passing and the comment hole would be open
 * again with a comment claiming it was closed.
 */
describe("the source-hygiene scanner is comment-proof", () => {
  it("does not find a control that appears only in a comment", () => {
    const code = [
      'const real = <nav aria-label="Source workspace navigation" />;',
      '// aria-label="Source workspace header"',
      "/* aria-label=\"Persistent Source workspace toolbar\" */",
    ].join("\n");
    const stripped = stripComments(code);

    expect(stripped).toContain('aria-label="Source workspace navigation"');
    expect(stripped).not.toContain('aria-label="Source workspace header"');
    expect(stripped).not.toContain(
      'aria-label="Persistent Source workspace toolbar"',
    );
  });

  it("leaves a comment marker that is inside a string literal alone", () => {
    const code = [
      'const keep = "// not a comment";',
      "const alsoKeep = `/* not a comment either */`;",
      "const single = '/* nor this */';",
      '// const gone = "erased";',
    ].join("\n");
    const stripped = stripComments(code);

    expect(stripped).toContain('"// not a comment"');
    expect(stripped).toContain("`/* not a comment either */`");
    expect(stripped).toContain("'/* nor this */'");
    expect(stripped).not.toContain("erased");
  });

  it("preserves every offset so index arithmetic still points at real code", () => {
    const code = 'const a = 1; /* xx */ const b = 2;';
    const stripped = stripComments(code);

    expect(stripped).toHaveLength(code.length);
    expect(stripped.indexOf("const b")).toBe(code.indexOf("const b"));
    expect(stripped).not.toContain("xx");
  });

  it("does not read a CSS url or a regex slash as the start of a comment", () => {
    const css = stripComments(
      '.a { background: url(//cdn/x.png); } /* .gone {} */ .b { color: red; }',
      { lineComments: false },
    );

    expect(css).toContain("url(//cdn/x.png)");
    expect(css).toContain(".b { color: red; }");
    expect(css).not.toContain(".gone");
  });

  /*
   * The two cases below are the real known positives, not synthetic ones: a
   * phrase that exists in each shipped file ONLY inside a comment. If either
   * comment is ever reworded these will fail — that is the intended cost, and
   * the repair is to pick another comment-only phrase from the same file, not
   * to delete the case.
   */
  it("blanks a phrase that exists only in a comment in the real component", () => {
    const raw = readFileSync(
      `${WORKSPACE_DIR}/WorkspaceExecutiveShell.tsx`,
      "utf8",
    );

    expect(raw).toContain("export-reachability");
    expect(sourceCode()).not.toContain("export-reachability");
    expect(sourceCode()).toContain("export function performanceActual");
  });

  it("blanks a phrase that exists only in a comment in the real stylesheet", () => {
    const raw = readFileSync(`${WORKSPACE_DIR}/workspace.css`, "utf8");

    expect(raw).toContain("Source Workspace design preview");
    expect(styleSheet()).not.toContain("Source Workspace design preview");
    expect(styleSheet()).toContain(".sw-v2-horizontal-tabs");
  });

  /*
   * A runaway scanner is the failure mode that would NOT announce itself: a
   * mis-detected block-comment opener blanks everything up to the next
   * closer, which for the positives above simply reads as "the control is
   * gone". These anchors are
   * spread across the file so a swallowed region is caught here rather than
   * mis-reported as a missing affordance.
   */
  it("blanks only comments, not the code between them", () => {
    const raw = readFileSync(
      `${WORKSPACE_DIR}/WorkspaceExecutiveShell.tsx`,
      "utf8",
    );
    const stripped = sourceCode();

    expect(stripped).toHaveLength(raw.length);
    for (const anchor of [
      "export const SOURCE_CHART_PALETTE",
      "export function orderedActionRows",
      "export function contractPurposeSummary",
      "export function EvidenceLaneBarChart",
      "export function performanceActual",
    ]) {
      expect(stripped).toContain(anchor);
    }
  });
});
