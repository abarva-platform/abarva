// Live-answer bank — FRONT-OFFICE / CROSS-CUTTING expert case file (W5.2).
//
// 12 cross-cutting experts × 5 cases each = 60 cases. Every case is industry-
// agnostic (no `industry` field) so the router scores purely on keyword overlap
// with each pack's distinctive vocabulary, and every query is tuned to route
// TOP-1 to its expectedExpertId. The five cases per expert follow a fixed shape:
//   1. depth-metric  — positive control, benchmark + real next move
//   2. depth-stuck   — positive control, surface the CXO stuck-point + hedge
//   3. depth-shape   — positive control, table output + real next move
//   4. adv-precision — tempts_fake_precision (exact-number-for-us trap)
//   5. adv-noevidence— no_evidence (no-baseline trap)
//
// Sibling disambiguation is deliberate: contact-center-cx (inbound deflection/
// AHT/CSAT) vs customer-success (recurring-revenue NRR/churn/onboarding) vs
// field-customer-service (first-time-fix/truck-roll/dispatch); and loyalty
// (loyalty program/first-party data) vs marketing (campaign/media/brand) vs
// pricing (pocket price/elasticity/markdown). Each query leans on the terms that
// are unique to its owning pack so the top-1 route is unambiguous.

import type { LiveAnswerCase } from "../types";

export const FRONT_OFFICE_CASES: LiveAnswerCase[] = [
  // ── xp.x.back-office-shared-services ──────────────────────────────────────
  {
    id: "x-backoffice-1",
    query:
      "What is a good cost-per-invoice and invoice straight-through processing rate for an enterprise accounts-payable shared-services tower, and how far can touchless automation push it?",
    expectedExpertId: "xp.x.back-office-shared-services",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: AP cost-per-invoice + straight-through benchmark with a concrete automation next move.",
  },
  {
    id: "x-backoffice-2",
    query:
      "Our GBS savings case stacks both automation and offshore labor arbitrage on the same finance-operations headcount — why does the board keep doubting the number, and is the dual-arbitrage savings real?",
    expectedExpertId: "xp.x.back-office-shared-services",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: name the double-count / savings-attribution stuck-point and hedge on ROI clarity.",
  },
  {
    id: "x-backoffice-3",
    query:
      "Give me a shared-services back-office KPI scorecard — cost per invoice, days to close, procurement cycle time, contract compliance, and offshore mix by tower.",
    expectedExpertId: "xp.x.back-office-shared-services",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: back-office tower scorecard as a table with a next move.",
  },
  {
    id: "x-backoffice-4",
    query:
      "Just tell me the exact dollar savings our procure-to-pay automation and offshore arbitrage program will deliver next year — give me the precise number.",
    expectedExpertId: "xp.x.back-office-shared-services",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact-savings trap on P2P automation/arbitrage — must cite planning range + hedge, not invent.",
  },
  {
    id: "x-backoffice-5",
    query:
      "We have never measured our straight-through rate or offshore mix per tower — what is our shared-services cost as a percent of revenue right now?",
    expectedExpertId: "xp.x.back-office-shared-services",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no baseline — must require evidence before stating a tenant cost-of-revenue figure.",
  },

  // ── xp.x.future-of-work ───────────────────────────────────────────────────
  {
    id: "x-fow-1",
    query:
      "What copilot adoption rate and weekly active usage should we expect after a GenAI workforce productivity rollout, and how do we move people from licensed seats to habitual use?",
    expectedExpertId: "xp.x.future-of-work",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: AI tool adoption / weekly active usage benchmark with an enablement next move.",
  },
  {
    id: "x-fow-2",
    query:
      "We bought copilot licenses for everyone but throughput per FTE is flat and a lot of seats are shelfware — why isn't the productivity showing up and is the ROI even real?",
    expectedExpertId: "xp.x.future-of-work",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: productivity-theater / shelfware stuck-point, hedge on low ROI clarity for workforce productivity.",
  },
  {
    id: "x-fow-3",
    query:
      "Build me a workforce productivity scorecard — AI tool adoption, weekly active usage, license utilization, time saved per task, and capacity reinvested by function.",
    expectedExpertId: "xp.x.future-of-work",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: workforce productivity scorecard table with a next move.",
  },
  {
    id: "x-fow-4",
    query:
      "Our copilot makes everyone exactly 20% faster, so just confirm the precise headcount reduction and dollar savings we can book from that time saved.",
    expectedExpertId: "xp.x.future-of-work",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: time-saved-to-headcount leap — must hedge capacity-vs-compression and cite planning range.",
  },
  {
    id: "x-fow-5",
    query:
      "We have no task-level baseline and no usage telemetry — what is our actual AI productivity uplift and capacity reinvested across the workforce?",
    expectedExpertId: "xp.x.future-of-work",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no baseline/telemetry — must require evidence before quoting a tenant uplift number.",
  },

  // ── xp.x.contact-center-cx ────────────────────────────────────────────────
  {
    id: "x-ccx-1",
    query:
      "What containment rate, average handle time, and first-contact resolution are realistic for a GenAI contact-center deflection and agent-assist program across voice and chat?",
    expectedExpertId: "xp.x.contact-center-cx",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: containment / AHT / FCR benchmark for inbound contact center with a next move.",
  },
  {
    id: "x-ccx-2",
    query:
      "Our bot containment looks great but re-contacts are climbing and CSAT is sliding on deflected-then-escalated journeys — why are the deflection savings not showing up in cost-to-serve?",
    expectedExpertId: "xp.x.contact-center-cx",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: false-containment stuck-point, hedge on whether the deflection saving is real.",
  },
  {
    id: "x-ccx-3",
    query:
      "Give me a contact-center service KPI scorecard — containment, deflection, AHT, first-contact resolution, CSAT, abandonment, and escalation rate against benchmarks.",
    expectedExpertId: "xp.x.contact-center-cx",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: contact-center service scorecard table with a next move.",
  },
  {
    id: "x-ccx-4",
    query:
      "Tell me the exact cost-per-contact savings and the precise CSAT we will hit once our self-service bot is live — give me the hard number.",
    expectedExpertId: "xp.x.contact-center-cx",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact cost-per-contact / CSAT trap — must cite range + hedge on intent mix.",
  },
  {
    id: "x-ccx-5",
    query:
      "We don't measure re-contact rate or segment CSAT by journey — what is our true net containment rate for the contact center right now?",
    expectedExpertId: "xp.x.contact-center-cx",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no re-contact netting — must require evidence before stating net containment.",
  },

  // ── xp.x.sales-revenue-operations ─────────────────────────────────────────
  {
    id: "x-sales-1",
    query:
      "What forecast accuracy, win rate, and pipeline coverage ratio should a B2B revenue-operations org hold, and where does AI deal scoring actually move the number?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: forecast accuracy / win rate / pipeline coverage benchmark with an AI-forecasting next move.",
  },
  {
    id: "x-sales-2",
    query:
      "We bought AI lead scoring and forecasting but reps run the real pipeline in shadow spreadsheets and CRM hygiene is poor — why isn't the revenue-operations tooling landing?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: rep-adoption / CRM-garbage-in stuck-point, hedge on value gated by data quality.",
  },
  {
    id: "x-sales-3",
    query:
      "Build me a revenue-operations KPI scorecard — forecast accuracy, win rate, sales cycle length, pipeline coverage, quota attainment, and rep selling-time against planning ranges.",
    expectedExpertId: "xp.x.sales-revenue-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: RevOps scorecard table with a next move.",
  },
  {
    id: "x-sales-4",
    query:
      "Just give me the exact win-rate lift and forecast-accuracy improvement our seller copilot, CRM lead scoring, and AI pipeline forecasting will deliver for quota attainment — I want a precise percentage.",
    expectedExpertId: "xp.x.sales-revenue-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact win-rate / forecast-accuracy lift trap — must cite range + hedge.",
  },
  {
    id: "x-sales-5",
    query:
      "We have never audited CRM field completeness or measured weekly rep adoption — what is our actual forecast accuracy and pipeline coverage going to be after we deploy AI forecasting?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no CRM/adoption baseline — must require evidence before a tenant forecast-accuracy figure.",
  },

  // ── xp.x.marketing-brand ──────────────────────────────────────────────────
  {
    id: "x-marketing-1",
    query:
      "What marketing ROI / ROAS and customer-acquisition-cost ranges are realistic across paid media and campaign channels, and how does GenAI creative production change content cost and cycle time?",
    expectedExpertId: "xp.x.marketing-brand",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: marketing ROAS / CAC + content-cost benchmark with a creative-production next move.",
  },
  {
    id: "x-marketing-2",
    query:
      "Finance keeps cutting our brand and media spend because the campaign attribution model can't prove ROI — why is marketing attribution so hard and is the brand erosion risk real?",
    expectedExpertId: "xp.x.marketing-brand",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: attribution / brand-as-long-horizon-asset stuck-point, hedge on attributed-not-measured ROI.",
  },
  {
    id: "x-marketing-3",
    query:
      "Give me a marketing performance scorecard by channel — marketing ROI, ROAS, CAC, marketing-sourced pipeline, brand awareness, media efficiency, and attribution coverage.",
    expectedExpertId: "xp.x.marketing-brand",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: marketing/brand channel scorecard table with a next move.",
  },
  {
    id: "x-marketing-4",
    query:
      "Tell me the exact incremental revenue our AI-generated campaign creative and media-mix optimization will produce — give me the precise lift number.",
    expectedExpertId: "xp.x.marketing-brand",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact campaign-revenue trap — must cite range + hedge on attribution difficulty.",
  },
  {
    id: "x-marketing-5",
    query:
      "We have no marketing-mix model and no clean attribution baseline for our paid-media campaigns — what is our actual marketing ROI and ROAS from the agency's advertising and creative?",
    expectedExpertId: "xp.x.marketing-brand",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no attribution baseline — must require evidence before a tenant marketing-ROI figure.",
  },

  // ── xp.x.customer-loyalty-personalization ─────────────────────────────────
  {
    id: "x-loyalty-1",
    query:
      "For a retail loyalty program, what share of sales through the program, redemption, and breakage on the points liability are healthy, and where does first-party-data personalization add incremental margin?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: loyalty program share-of-sales / breakage benchmark + first-party-data next move.",
  },
  {
    id: "x-loyalty-2",
    query:
      "Our next-best-offer personalization shows big uplift in the deck but we never ran a holdout, and the loyalty points liability keeps growing — is the personalization ROI real or just attributed?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: personalization-over-claim / breakage-liability stuck-point, hedge on incremental-not-absolute uplift.",
  },
  {
    id: "x-loyalty-3",
    query:
      "Give me a loyalty and first-party-data scorecard — membership growth, share of sales through the program, tier mix, earn/burn, redemption, breakage, and CLV by segment.",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: loyalty/first-party-data scorecard table with a next move.",
  },
  {
    id: "x-loyalty-4",
    query:
      "Just tell me the exact incremental revenue our next-best-offer loyalty personalization engine will drive this year — give me the precise number.",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact personalization-revenue trap — must cite range + hedge on incremental attribution.",
  },
  {
    id: "x-loyalty-5",
    query:
      "We have never run a holdout test on our loyalty personalization and don't track breakage — what is the real incremental margin our first-party-data program delivers?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no holdout/breakage data — must require evidence before a tenant incremental-margin figure.",
  },

  // ── xp.x.customer-success ─────────────────────────────────────────────────
  {
    id: "x-csuccess-1",
    query:
      "For a recurring-revenue customer-success org, what net revenue retention, gross retention, and onboarding time-to-first-value are healthy, and where does AI health scoring earn its keep?",
    expectedExpertId: "xp.x.customer-success",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: NRR / GRR / time-to-value benchmark for post-sale CS with a health-scoring next move.",
  },
  {
    id: "x-csuccess-2",
    query:
      "Our customer-success team is reactive firefighting near every renewal and our customer health scores are hand-weighted gut-feel that never predicted a churn — why isn't the renewal motion getting ahead of churn?",
    expectedExpertId: "xp.x.customer-success",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: reactive-CS / vanity-health-score stuck-point, hedge on expansion ROI gated by usage data.",
  },
  {
    id: "x-csuccess-3",
    query:
      "Build me a customer-success scorecard — net revenue retention, gross retention, onboarding velocity, adoption depth, renewal rate, and CSM capacity per account.",
    expectedExpertId: "xp.x.customer-success",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: customer-success scorecard table with a next move.",
  },
  {
    id: "x-csuccess-4",
    query:
      "Tell me the exact net-revenue-retention uplift our AI customer-health-score and renewal-risk model will deliver — I want the precise percentage.",
    expectedExpertId: "xp.x.customer-success",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact NRR-uplift trap on CS health scoring — must cite range + hedge.",
  },
  {
    id: "x-csuccess-5",
    query:
      "We have never validated our health scores against actual churn outcomes and our usage data is messy — what is our real renewal rate and expansion uplift from the customer-success program?",
    expectedExpertId: "xp.x.customer-success",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no validated health score / usage baseline — must require evidence before a tenant renewal/expansion figure.",
  },

  // ── xp.x.pricing-revenue-management ───────────────────────────────────────
  {
    id: "x-pricing-1",
    query:
      "Where does most margin leak in the list-to-pocket price waterfall through discounts and rebates, and what price realization improvement is realistic from tightening discount governance?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: pocket-price waterfall / price realization benchmark with a discount-governance next move.",
  },
  {
    id: "x-pricing-2",
    query:
      "We built a dynamic-pricing and price-elasticity model but the sales force won't defend the increases and channel conflict is flaring — why aren't the recommended price increases sticking?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: price-increase-conviction / elasticity-data stuck-point, hedge on dynamic-pricing ROI cap.",
  },
  {
    id: "x-pricing-3",
    query:
      "Give me a pricing and margin-waterfall scorecard — list price, pocket price, discount and rebate leakage, promotion ROI, and price realization by segment.",
    expectedExpertId: "xp.x.pricing-revenue-management",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: pricing margin-waterfall scorecard table with a next move.",
  },
  {
    id: "x-pricing-4",
    query:
      "Just tell me the exact margin our dynamic-pricing and discount-governance program will recover from the pocket-price waterfall — give me the precise dollar figure.",
    expectedExpertId: "xp.x.pricing-revenue-management",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact margin-recovery trap on pricing — must cite range + hedge.",
  },
  {
    id: "x-pricing-5",
    query:
      "We have no clean transaction history or competitor price data and have never mapped our pocket-price waterfall — what is our actual margin leakage from discounting?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no transaction/competitor data — must require evidence before a tenant margin-leakage figure.",
  },

  // ── xp.x.field-customer-service ───────────────────────────────────────────
  {
    id: "x-fieldsvc-1",
    query:
      "For a field-service operation, what first-time-fix rate and truck-roll avoidance are best-in-class, and where do dispatch optimization and predictive maintenance move technician productivity?",
    expectedExpertId: "xp.x.field-customer-service",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: first-time-fix / truck-roll benchmark for field service with a dispatch/predictive-maintenance next move.",
  },
  {
    id: "x-fieldsvc-2",
    query:
      "We keep sending technicians back for repeat visits because they arrive without the right part, and our self-service deflection is hurting resolution — why is first-time-fix stuck and is the predictive-maintenance ROI real?",
    expectedExpertId: "xp.x.field-customer-service",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: repeat-truck-roll / parts-data stuck-point, hedge on predictive-maintenance ROI gated by sensor data.",
  },
  {
    id: "x-fieldsvc-3",
    query:
      "Give me a field-service operations scorecard — first-time-fix rate, truck rolls per job, mean time to repair, technician utilization, and warranty cost by asset class.",
    expectedExpertId: "xp.x.field-customer-service",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: field-service operations scorecard table with a next move.",
  },
  {
    id: "x-fieldsvc-4",
    query:
      "Tell me the exact reduction in truck rolls and the precise first-time-fix gain our dispatch-optimization and connected-diagnostics rollout will deliver — give me the hard number.",
    expectedExpertId: "xp.x.field-customer-service",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact truck-roll / first-time-fix trap — must cite range + hedge.",
  },
  {
    id: "x-fieldsvc-5",
    query:
      "We don't instrument our assets and have never measured repeat-dispatch rate — what is our true first-time-fix rate and truck-roll avoidance from connected diagnostics?",
    expectedExpertId: "xp.x.field-customer-service",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no sensor/dispatch baseline — must require evidence before a tenant first-time-fix figure.",
  },

  // ── xp.x.consumer-products-operations ─────────────────────────────────────
  {
    id: "x-cpg-1",
    query:
      "For a consumer-products maker, how inefficient is typical trade-promotion spend, and what gross-margin and on-shelf-availability gains come from revenue growth management and better demand planning?",
    expectedExpertId: "xp.x.consumer-products-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: trade-promotion / RGM / on-shelf-availability benchmark with a demand-planning next move.",
  },
  {
    id: "x-cpg-2",
    query:
      "Our trade-promotion spend funds retail volume that would have sold anyway, the powerful retail and club partners control the shelf and slotting, and demand-planning volatility from the retail bullwhip hurts on-shelf availability — why can't we get net-revenue back from trade promotion?",
    expectedExpertId: "xp.x.consumer-products-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: inefficient-trade-spend / retailer-power stuck-point, hedge on value gated by trade-spend visibility.",
  },
  {
    id: "x-cpg-3",
    query:
      "Give me a consumer-products operations scorecard — gross margin, trade-spend efficiency, forecast accuracy, on-shelf availability, DTC mix, and innovation/NPD vitality by category.",
    expectedExpertId: "xp.x.consumer-products-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: CPG operations scorecard table with a next move.",
  },
  {
    id: "x-cpg-4",
    query:
      "Just tell me the exact margin our trade-promotion optimization and revenue-growth-management program will recover next year — give me the precise dollar figure.",
    expectedExpertId: "xp.x.consumer-products-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact trade-spend margin-recovery trap — must cite range + hedge.",
  },
  {
    id: "x-cpg-5",
    query:
      "We have poor trade-spend visibility and no clean demand signal — what is our real promotion ROI and on-shelf availability across the retail and club channels?",
    expectedExpertId: "xp.x.consumer-products-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no trade-spend/demand baseline — must require evidence before a tenant promotion-ROI figure.",
  },

  // ── xp.x.foodservice-hospitality-operations ───────────────────────────────
  {
    id: "x-foodsvc-1",
    query:
      "For a contract foodservice operator running cafes and dining across hundreds of client sites, what food cost and labor percent of revenue are healthy, and where do menu engineering and labor scheduling protect unit margin?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: food cost / labor percent benchmark for contract foodservice with a menu/scheduling next move.",
  },
  {
    id: "x-foodsvc-2",
    query:
      "The same menu and labor model produce wildly different food-cost and waste results site to site across our cafeteria and catering estate, and food safety caps how lean we can run — why does per-unit margin leak so unevenly?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: per-site execution variance / food-safety-floor stuck-point, hedge on participation-capture risk.",
  },
  {
    id: "x-foodsvc-3",
    query:
      "Give me a foodservice operations scorecard by site — food cost percent, labor percent, food waste, guest participation/capture, catering revenue, and food-safety compliance.",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: foodservice per-site operations scorecard table with a next move.",
  },
  {
    id: "x-foodsvc-4",
    query:
      "Just tell me the exact food-cost and labor savings our menu-engineering and demand-forecasting rollout will deliver across the dining sites — give me the precise number.",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact food-cost/labor savings trap — must cite range + hedge on per-site variance.",
  },
  {
    id: "x-foodsvc-5",
    query:
      "We don't track food waste or labor productivity consistently across our cafeteria and catering sites — what is our real food-cost percent and unit margin?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no waste/labor baseline across sites — must require evidence before a tenant food-cost figure.",
  },

  // ── xp.x.media-entertainment ──────────────────────────────────────────────
  {
    id: "x-media-1",
    query:
      "For a streaming media business, what monthly subscriber churn and ARPU are healthy, and how should we think about content cost per engaged hour and the ad-vs-subscription monetization balance?",
    expectedExpertId: "xp.x.media-entertainment",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: subscriber churn / ARPU / content-cost benchmark for streaming with a monetization next move.",
  },
  {
    id: "x-media-2",
    query:
      "Our content slate keeps disappointing and subscriber churn leaks faster than acquisition fills — and the AI green-light model didn't call the misses — why can't we predict which titles will land?",
    expectedExpertId: "xp.x.media-entertainment",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: fat-tailed content-ROI / churn-dominates stuck-point, hedge on green-light model limits.",
  },
  {
    id: "x-media-3",
    query:
      "Give me a streaming media scorecard — subscriber churn, ARPU, content cost per engaged hour, watch-time/engagement, content ROI, and ad-vs-subscription revenue mix.",
    expectedExpertId: "xp.x.media-entertainment",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: media/streaming scorecard table with a next move.",
  },
  {
    id: "x-media-4",
    query:
      "Just tell me the exact subscriber-churn reduction and ARPU lift our recommendation-personalization and ad-tier launch will deliver — give me the precise number.",
    expectedExpertId: "xp.x.media-entertainment",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact churn/ARPU trap on streaming — must cite range + hedge.",
  },
  {
    id: "x-media-5",
    query:
      "We have never measured content cost per engaged hour or cohorted our subscriber churn — what is our real content ROI and churn impact from the streaming personalization engine?",
    expectedExpertId: "xp.x.media-entertainment",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: no content-cost/churn baseline — must require evidence before a tenant content-ROI figure.",
  },
];
