import type { LiveAnswerCase } from "../types";

// IT-estate-B live-answer case file (W5.2). Cross-cutting IT-estate experts —
// no industry tag (these packs carry no industry×function key, so omitting
// `industry` keeps routing on the keyword surface, not an industry bonus).
//
// 9 experts × 5 cases = 45. Per expert the five cases are:
//   1 depth-metric    (positive control; cite_benchmark + name_real_next_move)
//   2 depth-stuck     (positive control; surface_stuck_point + hedge_uncertainty)
//   3 depth-shape     (positive control; output_shape_table + name_real_next_move)
//   4 adv-precision   (tempts_fake_precision; cite_benchmark + hedge_uncertainty)
//   5 adv-noevidence  (no_evidence; require_evidence + name_real_next_move)
//
// Every query is loaded with its expert's distinctive vocabulary and steered
// clear of neighbouring experts' tokens so the router lands top-1.

export const IT_ESTATE_B_CASES: LiveAnswerCase[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.application-modernization
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-appmod-1",
    query:
      "What is a credible benchmark for application decommission rate and run vs change split when we rationalize a sprawling legacy application portfolio?",
    expectedExpertId: "xp.x.application-modernization",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: rationalization decommission-rate benchmark + next move.",
  },
  {
    id: "x-appmod-2",
    query:
      "Our legacy modernization keeps becoming a big-bang rewrite and technical debt is treated as a one-time fix — where do these strangler-fig efforts actually get stuck?",
    expectedExpertId: "xp.x.application-modernization",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: rewrite reflex + technical-debt-as-tax stuck point.",
  },
  {
    id: "x-appmod-3",
    query:
      "Lay out a TIME / 6R disposition table for our legacy application estate so we can decide retire, consolidate, re-platform, or re-factor each system.",
    expectedExpertId: "xp.x.application-modernization",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: 6R/TIME disposition table + next move.",
  },
  {
    id: "x-appmod-4",
    query:
      "Tell me the exact modernization ROI percentage and precise technical-debt remediation payback we'll get from re-platforming our legacy applications.",
    expectedExpertId: "xp.x.application-modernization",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact rationalization ROI → cite + hedge.",
  },
  {
    id: "x-appmod-5",
    query:
      "How many of our applications are end-of-life and what is our current application total cost of ownership across the legacy estate?",
    expectedExpertId: "xp.x.application-modernization",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific EOL/TCO counts → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.enterprise-architecture
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-ea-1",
    query:
      "What is a reasonable benchmark for architecture standards compliance and reference-architecture reuse rate as we stand up enterprise architecture governance?",
    expectedExpertId: "xp.x.enterprise-architecture",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: standards-compliance / reference-architecture reuse benchmark.",
  },
  {
    id: "x-ea-2",
    query:
      "Our enterprise architecture practice is ivory-tower — the target-state and technology radar are artifacts nobody decides with. Where does this typically get stuck?",
    expectedExpertId: "xp.x.enterprise-architecture",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: ivory-tower EA / radar-that-only-describes stuck point.",
  },
  {
    id: "x-ea-3",
    query:
      "Give me a technology-radar table classifying our standards as adopt, trial, hold, or retire with the architecture decision record rationale per entry.",
    expectedExpertId: "xp.x.enterprise-architecture",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: technology-radar adopt/trial/hold/retire table.",
  },
  {
    id: "x-ea-4",
    query:
      "Tell me the exact architecture technical-debt ratio and the precise build-vs-buy savings number our reference architecture will deliver.",
    expectedExpertId: "xp.x.enterprise-architecture",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact EA debt ratio / build-vs-buy savings.",
  },
  {
    id: "x-ea-5",
    query:
      "What is our current architecture standards compliance percentage and how many redundant business capabilities does our estate carry today?",
    expectedExpertId: "xp.x.enterprise-architecture",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific conformance/redundancy counts → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.it-strategy-operating-model
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-itstrategy-1",
    query:
      "What is a healthy benchmark for the run-versus-change IT spend split and business-IT alignment score as we reshape the IT operating model and CIO agenda?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: run/change split + alignment-score operating-model benchmark.",
  },
  {
    id: "x-itstrategy-2",
    query:
      "Our reorg moved boxes but not decision rights, and governance has become a bottleneck where strategy dies in the stage gate. Where does the operating model get stuck?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: decision-rights / governance-bottleneck operating-model stuck point.",
  },
  {
    id: "x-itstrategy-3",
    query:
      "Lay out a table comparing centralized, federated, and hybrid IT operating models against demand-intake cycle time and value-realization for our CIO agenda.",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: centralized/federated/hybrid operating-model comparison table.",
  },
  {
    id: "x-itstrategy-4",
    query:
      "Tell me the exact IT value-realization percentage and the precise span-of-control we should target once we move from project to product funding.",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact value-realization / span-of-control number.",
  },
  {
    id: "x-itstrategy-5",
    query:
      "What is our current demand-intake cycle time and what share of our IT investment is funded by product value streams today?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific intake-time / product-funding mix → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.digital-product-management
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-digprod-1",
    query:
      "What is a credible benchmark for the outcome-versus-output ratio and feature adoption rate as we adopt a product operating model with empowered product teams?",
    expectedExpertId: "xp.x.digital-product-management",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: outcome-vs-output / feature-adoption product-operating-model benchmark.",
  },
  {
    id: "x-digprod-2",
    query:
      "We have agile theater and a feature-factory roadmap where continuous discovery is skipped and product managers act as backlog administrators. Where does this get stuck?",
    expectedExpertId: "xp.x.digital-product-management",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: agile-theater / output-over-outcome product stuck point.",
  },
  {
    id: "x-digprod-3",
    query:
      "Give me a table framing our roadmap as outcomes and OKR bets instead of feature promises, with the dual-track discovery and experiment win-rate per product team.",
    expectedExpertId: "xp.x.digital-product-management",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: outcome-roadmap / OKR product-team table.",
  },
  {
    id: "x-digprod-4",
    query:
      "Tell me the exact feature adoption rate and precise experiment win-rate lift our move to continuous discovery and dual-track delivery will produce.",
    expectedExpertId: "xp.x.digital-product-management",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact adoption / experiment-win-rate lift.",
  },
  {
    id: "x-digprod-5",
    query:
      "What share of our initiatives are funded as products versus projects today, and what is our current outcome-vs-output ratio across the product roadmap?",
    expectedExpertId: "xp.x.digital-product-management",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific product-funding / outcome ratio → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.integration-api-management
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-integration-1",
    query:
      "What is a reasonable benchmark for API reuse rate and the share of reusable versus point-to-point integrations as we stand up an iPaaS and full-lifecycle API gateway?",
    expectedExpertId: "xp.x.integration-api-management",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: API-reuse / point-to-point ratio iPaaS benchmark.",
  },
  {
    id: "x-integration-2",
    query:
      "Our point-to-point integration sprawl is an O(n^2) tax, the API estate is ungoverned, and a batch-bound backbone blocks event-driven use cases. Where does this get stuck?",
    expectedExpertId: "xp.x.integration-api-management",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: point-to-point sprawl / ungoverned-API integration stuck point.",
  },
  {
    id: "x-integration-3",
    query:
      "Give me a table of API-led layered connectivity — system, process, and experience APIs — mapped to our iPaaS, event streaming backbone, and B2B/EDI gateway.",
    expectedExpertId: "xp.x.integration-api-management",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: API-led layered-connectivity / iPaaS table.",
  },
  {
    id: "x-integration-4",
    query:
      "Tell me the exact API availability SLA and precise integration-delivery lead-time reduction our move to a governed API gateway and event-driven backbone will deliver.",
    expectedExpertId: "xp.x.integration-api-management",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact API SLA / integration lead-time number.",
  },
  {
    id: "x-integration-5",
    query:
      "How many of our integrations are point-to-point today and what is our current API reuse rate across the iPaaS estate?",
    expectedExpertId: "xp.x.integration-api-management",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific point-to-point count / API-reuse → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.identity-access-management
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-iam-1",
    query:
      "What is a credible benchmark for phishing-resistant MFA coverage and the share of privileged accounts under PAM as we build a least-privilege identity and access program?",
    expectedExpertId: "xp.x.identity-access-management",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: MFA-coverage / PAM least-privilege identity benchmark.",
  },
  {
    id: "x-iam-2",
    query:
      "We have entitlement creep, orphaned accounts from a slow joiner-mover-leaver lifecycle, and access recertification that is just a rubber-stamp. Where does IAM get stuck?",
    expectedExpertId: "xp.x.identity-access-management",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: over-privilege / orphaned-account / recert IAM stuck point.",
  },
  {
    id: "x-iam-3",
    query:
      "Give me a table of our joiner-mover-leaver provisioning and deprovisioning steps mapped to SSO federation, PAM just-in-time access, and recertification cadence.",
    expectedExpertId: "xp.x.identity-access-management",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: JML provisioning / SSO / PAM table.",
  },
  {
    id: "x-iam-4",
    query:
      "Tell me the exact time-to-revoke on offboarding and the precise standing-privilege reduction percentage zero-standing-privilege PAM will deliver for us.",
    expectedExpertId: "xp.x.identity-access-management",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact deprovisioning-time / privilege-reduction number.",
  },
  {
    id: "x-iam-5",
    query:
      "What is our current orphaned-account rate and what share of our applications are on SSO and federated identity today?",
    expectedExpertId: "xp.x.identity-access-management",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific orphaned-account / SSO coverage → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.technology-resilience-bcdr
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-resilience-1",
    query:
      "What is a credible benchmark for RTO and RPO attainment and DR test pass rate as we build tested recovery and operational resilience for our critical services?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: RTO/RPO attainment + DR-test-pass resilience benchmark.",
  },
  {
    id: "x-resilience-2",
    query:
      "Our DR plans are untested, we have single-vendor concentration risk, and crisis incident-command is unrehearsed. Where does technology resilience and continuity get stuck?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: untested-DR / concentration-risk resilience stuck point.",
  },
  {
    id: "x-resilience-3",
    query:
      "Give me a table mapping each critical service to its business-impact analysis, tested RTO/RPO, single-points-of-failure, and failover readiness.",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: BIA → RTO/RPO → SPOF → failover resilience table.",
  },
  {
    id: "x-resilience-4",
    query:
      "Tell me the exact time-to-failover and the precise RTO attainment our DR orchestration and tested-recovery resilience program will guarantee for critical services after a severe disruption.",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact failover-time / availability guarantee.",
  },
  {
    id: "x-resilience-5",
    query:
      "How many of our critical services have tested DR today and what is our current single-point-of-failure count across the resilience estate?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific tested-DR / SPOF counts → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.data-governance-mdm
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-datagov-1",
    query:
      "What is a credible benchmark for golden-record match rate and data-catalog coverage as we stand up master-data stewardship with assigned data owners and lineage?",
    expectedExpertId: "xp.x.data-governance-mdm",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: golden-record match / catalog-coverage MDM benchmark.",
  },
  {
    id: "x-datagov-2",
    query:
      "Our MDM dies in the match/merge survivorship and stewardship workflow, the catalog is shelfware, and the golden record is fiction. Where does data governance get stuck?",
    expectedExpertId: "xp.x.data-governance-mdm",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: match/merge-survivorship / catalog-shelfware MDM stuck point.",
  },
  {
    id: "x-datagov-3",
    query:
      "Give me a table of our critical data elements with assigned data steward, data owner, golden-record match rate, and lineage completeness per domain.",
    expectedExpertId: "xp.x.data-governance-mdm",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: CDE → steward/owner → match-rate → lineage table.",
  },
  {
    id: "x-datagov-4",
    query:
      "Tell me the exact golden-record match rate and the precise cost of poor data quality our master-data stewardship hub will eliminate.",
    expectedExpertId: "xp.x.data-governance-mdm",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact match-rate / COPDQ number.",
  },
  {
    id: "x-datagov-5",
    query:
      "What share of our critical data elements have an assigned data owner today and what is our current data-catalog coverage across the master-data estate?",
    expectedExpertId: "xp.x.data-governance-mdm",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific CDE-ownership / catalog coverage → require evidence.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // xp.x.data-privacy-protection
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-privacy-1",
    query:
      "What is a credible benchmark for DSAR cycle time and consent opt-out honor rate as we build a GDPR and CCPA privacy program with a living RoPA data map?",
    expectedExpertId: "xp.x.data-privacy-protection",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: DSAR-cycle / consent-honor GDPR-CCPA privacy benchmark.",
  },
  {
    id: "x-privacy-2",
    query:
      "DSAR at scale is breaking across a fragmented estate, shadow data means PII discovery is never complete, and consent enforcement leaks downstream. Where does privacy get stuck?",
    expectedExpertId: "xp.x.data-privacy-protection",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: DSAR-at-scale / shadow-PII / consent-leakage privacy stuck point.",
  },
  {
    id: "x-privacy-3",
    query:
      "Give me a RoPA table mapping each processing activity to lawful basis, retention period, cross-border transfer mechanism, and DPIA status under GDPR and CCPA.",
    expectedExpertId: "xp.x.data-privacy-protection",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: RoPA / lawful-basis / transfer-mechanism / DPIA table.",
  },
  {
    id: "x-privacy-4",
    query:
      "Tell me the exact DSAR cycle time and the precise cost-per-DSAR reduction automated rights fulfillment will deliver under our GDPR and CCPA obligations.",
    expectedExpertId: "xp.x.data-privacy-protection",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: demands exact DSAR-cycle / cost-per-DSAR number.",
  },
  {
    id: "x-privacy-5",
    query:
      "What share of our systems are in our RoPA data map today and what is our current PII discovery and classification coverage for GDPR and CCPA?",
    expectedExpertId: "xp.x.data-privacy-protection",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific RoPA / PII-discovery coverage → require evidence.",
  },
];
