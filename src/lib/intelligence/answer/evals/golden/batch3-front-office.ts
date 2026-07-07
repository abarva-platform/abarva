// Golden-question batch 3 — cross-cutting front-office / enterprise-operations experts.
//
// 60 questions: EXACTLY 5 per cross-cutting expert across 12 experts. Each
// question is sharpened so the dimensional router (`../router`) summons the
// intended expert as the TOP-1 lead across the full faculty, and so the
// grounding block (`../expert-grounding`) surfaces the `mustInclude` token(s).
//
// Five distinct angles per expert: headline metric, AI use-case, pain/
// stuck-point, vendor/system-of-record/sourcing, and diagnostic/maturity/ROI.
// No `industry` is set — these are cross-cutting experts that must win on
// keyword distinctiveness alone.

import type { GoldenQuestion } from "./types";

export const BATCH_3_FRONT_OFFICE: GoldenQuestion[] = [
  // ── xp.x.back-office-shared-services ──────────────────────────────────────
  {
    id: "x-backoffice-metric",
    query:
      "What is a world-class cost per invoice and invoice straight-through rate for our accounts-payable shared-services back office, and how does days-to-close compare across our finance towers?",
    expectedExpertId: "xp.x.back-office-shared-services",
    mustInclude: ["invoice"],
  },
  {
    id: "x-backoffice-aiuc",
    query:
      "Where should we apply touchless invoice automation, intelligent document processing, and agentic procurement to straight-through our P2P and source-to-pay back-office transactions?",
    expectedExpertId: "xp.x.back-office-shared-services",
    mustInclude: ["procurement"],
  },
  {
    id: "x-backoffice-pain",
    query:
      "Our shared-services back office double-counts automation and offshore arbitrage savings on the same FTEs and we lift-and-shift offshored without standardizing first — how do we fix maverick spend leakage and a fragmented process estate?",
    expectedExpertId: "xp.x.back-office-shared-services",
    mustInclude: ["offshore"],
  },
  {
    id: "x-backoffice-vendor",
    query:
      "How should we re-price our BPO and GBS managed-service back-office contract from FTE-based toward outcome and gain-share as touchless automation deflects transaction volume in our ERP and source-to-pay systems of record?",
    expectedExpertId: "xp.x.back-office-shared-services",
    mustInclude: ["arbitrage"],
  },
  {
    id: "x-backoffice-diag",
    query:
      "Assess the maturity of our Global Business Services back-office operating model and the ROI of dual-arbitrage automation-then-offshore against the Workforce Economics estimate-twice baseline by tower.",
    expectedExpertId: "xp.x.back-office-shared-services",
    mustInclude: ["shared services"],
  },

  // ── xp.x.future-of-work ───────────────────────────────────────────────────
  {
    id: "x-fow-metric",
    query:
      "What is a realistic AI tool adoption rate, weekly active usage, and time-saved-per-task benchmark for our GenAI copilot rollout, and how much freed capacity gets reinvested rather than cashed out?",
    expectedExpertId: "xp.x.future-of-work",
    mustInclude: ["adoption"],
  },
  {
    id: "x-fow-aiuc",
    query:
      "How do role-specific copilots, knowledge-assistant retrieval, and meeting summarization redesign each persona's workflow to convert time-saved-per-task into reinvested workforce capacity?",
    expectedExpertId: "xp.x.future-of-work",
    mustInclude: ["copilots"],
  },
  {
    id: "x-fow-pain",
    query:
      "We are stuck in pilot purgatory with shelfware licenses, productivity theater, and an adoption plateau — tools were dropped without role redesign so the freed capacity leaks into slack. How do we escape?",
    expectedExpertId: "xp.x.future-of-work",
    mustInclude: ["adoption"],
  },
  {
    id: "x-fow-vendor",
    query:
      "How should we right-size suite-embedded copilot seats to demonstrated active use and negotiate model-portability with our frontier-LLM assistant providers to kill shelfware in our AI usage and license telemetry?",
    expectedExpertId: "xp.x.future-of-work",
    mustInclude: ["redesign"],
  },
  {
    id: "x-fow-diag",
    query:
      "Using the estimate-twice traditional-versus-AI-native capacity model, diagnose whether our GenAI workforce-productivity program has a measurement baseline that holds the quality bar constant and reconciles freed capacity to the P&L.",
    expectedExpertId: "xp.x.future-of-work",
    mustInclude: ["capacity"],
  },

  // ── xp.x.contact-center-cx ────────────────────────────────────────────────
  {
    id: "x-ccx-metric",
    query:
      "What net containment rate, deflection rate, average handle time, and CSAT should our inbound contact center target once we net out re-contacts and abandons from self-service bot sessions?",
    expectedExpertId: "xp.x.contact-center-cx",
    mustInclude: ["containment"],
  },
  {
    id: "x-ccx-aiuc",
    query:
      "Where do conversational self-service deflection bots, real-time agent-assist copilots, and post-contact summarization fit by intent to lower cost-per-contact and average handle time in our voice and chat contact center?",
    expectedExpertId: "xp.x.contact-center-cx",
    mustInclude: ["agent-assist"],
  },
  {
    id: "x-ccx-pain",
    query:
      "Our containment looks great but it is bot-deflection backfire — customers get trapped, cold escalations dump on agents, knowledge-base rot feeds wrong answers, and false-containment vanity metrics hide re-contacts. How do we make deflection real?",
    expectedExpertId: "xp.x.contact-center-cx",
    mustInclude: ["containment"],
  },
  {
    id: "x-ccx-vendor",
    query:
      "How should we negotiate per-resolution outcome pricing with our CCaaS and conversational-AI virtual-agent vendors and prove AHT/CSAT parity before scaling agent-assist across the contact center?",
    expectedExpertId: "xp.x.contact-center-cx",
    mustInclude: ["deflection"],
  },
  {
    id: "x-ccx-diag",
    query:
      "Assess the maturity and ROI of our contact-center deflection program: is net containment reconciled to cost-to-serve, is CSAT segmented by deflected-then-escalated journey, and does bot-to-agent handoff carry full context?",
    expectedExpertId: "xp.x.contact-center-cx",
    mustInclude: ["self-service"],
  },

  // ── xp.x.sales-revenue-operations ─────────────────────────────────────────
  {
    id: "x-sales-metric",
    query:
      "What forecast accuracy, win rate, sales cycle length, and pipeline coverage ratio should our B2B revenue operations target, and how much rep selling-time are we losing to CRM admin?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    mustInclude: ["forecast"],
  },
  {
    id: "x-sales-aiuc",
    query:
      "Where do a seller copilot with CRM auto-capture, predictive lead scoring and smart routing, and conversation intelligence move forecast accuracy, win rate, and quota attainment across our sales pipeline?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    mustInclude: ["pipeline"],
  },
  {
    id: "x-sales-pain",
    query:
      "Our revenue engine suffers CRM garbage-in, pipeline inflation and sandbagging, forecast theater, and rep adoption route-around while an autonomous AI-SDR overreach floods outbound — how do we fix the binding constraint?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    mustInclude: ["forecast"],
  },
  {
    id: "x-sales-vendor",
    query:
      "How should we rationalize our revenue stack of CRM, sales-engagement sequencing, conversation-intelligence, and revenue-intelligence forecasting tools, and where does CPQ deal-desk guidance sit in the system of record?",
    expectedExpertId: "xp.x.sales-revenue-operations",
    mustInclude: ["win rate"],
  },
  {
    id: "x-sales-diag",
    query:
      "Diagnose whether CRM hygiene gates our AI bets and assess the ROI of seller-copilot rollout against new-hire ramp time and rep selling-time before we invest in pipeline forecasting.",
    expectedExpertId: "xp.x.sales-revenue-operations",
    mustInclude: ["selling-time"],
  },

  // ── xp.x.marketing-brand ──────────────────────────────────────────────────
  {
    id: "x-marketing-metric",
    query:
      "What marketing ROI/ROAS, customer acquisition cost, marketing-sourced pipeline percentage, and brand awareness/consideration should our brand-and-demand-generation marketing engine target, and how much media is non-working?",
    expectedExpertId: "xp.x.marketing-brand",
    mustInclude: ["brand"],
  },
  {
    id: "x-marketing-aiuc",
    query:
      "Where do GenAI creative and content production at scale, AI media-mix modeling for budget optimization, and AI campaign orchestration lift our marketing-sourced pipeline and brand consideration?",
    expectedExpertId: "xp.x.marketing-brand",
    mustInclude: ["campaign"],
  },
  {
    id: "x-marketing-pain",
    query:
      "Our marketing org is stuck in attribution fog ('half my advertising is wasted'), brand short-termism eating the long-horizon brand asset, GenAI content outrunning brand safety, and MarTech sprawl — how do we measure incrementality?",
    expectedExpertId: "xp.x.marketing-brand",
    mustInclude: ["brand"],
  },
  {
    id: "x-marketing-vendor",
    query:
      "How should we manage our advertising agency roster, creative production, and media buying, and rationalize the ad-tech DSP, ad server, and marketing-mix-modeling stack to cut the ad-tech tax and non-working media?",
    expectedExpertId: "xp.x.marketing-brand",
    mustInclude: ["media"],
  },
  {
    id: "x-marketing-diag",
    query:
      "Assess the maturity of our marketing measurement and brand-safety governance: are campaign ROI claims anchored to incrementality and marketing-mix modeling, and is GenAI content at scale governed for brand safety?",
    expectedExpertId: "xp.x.marketing-brand",
    mustInclude: ["awareness"],
  },

  // ── xp.x.customer-loyalty-personalization ─────────────────────────────────
  {
    id: "x-loyalty-metric",
    query:
      "What share of retail sales through our loyalty program, active member rate, member-versus-non-member AOV uplift, and points breakage liability should we target as we grow loyalty membership?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    mustInclude: ["loyalty"],
  },
  {
    id: "x-loyalty-aiuc",
    query:
      "Where do next-best-offer and next-best-action decisioning, recommendation and merchandising personalization, and CLV-based segmentation lift repeat purchase and personalization-attributed revenue for our loyalty members?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    mustInclude: ["personalization"],
  },
  {
    id: "x-loyalty-pain",
    query:
      "We over-claim personalization ROI on attribution not incrementality, our 'AI personalization' is really rules and segments, fragmented first-party-data identity is siloed, and our points program is mistaken for a customer relationship — how do we fix loyalty?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    mustInclude: ["loyalty"],
  },
  {
    id: "x-loyalty-vendor",
    query:
      "How should we choose our loyalty program platform, CDP with identity resolution and consent management, and personalization decisioning engine, and use data clean rooms for privacy-safe first-party-data enrichment?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    mustInclude: ["member"],
  },
  {
    id: "x-loyalty-diag",
    query:
      "Assess the maturity of our first-party-data foundation and the incremental ROI of personalization: are loyalty next-best-offer lifts measured against holdout incrementality, and is breakage treated as a liability not free margin?",
    expectedExpertId: "xp.x.customer-loyalty-personalization",
    mustInclude: ["personalization"],
  },

  // ── xp.x.customer-success ─────────────────────────────────────────────────
  {
    id: "x-csuccess-metric",
    query:
      "What net revenue retention, gross revenue retention, logo churn, and time-to-first-value should our post-sale customer-success org target, and what is a healthy ARR-per-CSM book of business?",
    expectedExpertId: "xp.x.customer-success",
    mustInclude: ["retention"],
  },
  {
    id: "x-csuccess-aiuc",
    query:
      "Where do predictive customer-health and churn scoring, AI-guided onboarding to accelerate time-to-value, and expansion-signal detection lift net revenue retention across our recurring-revenue customer base?",
    expectedExpertId: "xp.x.customer-success",
    mustInclude: ["onboarding"],
  },
  {
    id: "x-csuccess-pain",
    query:
      "Our customer-success team is reactive firefighting dressed as proactive CS, our health scores are vanity without predictive validation, CSM books are too big to be proactive, and the CS-versus-sales renewal-ownership tension is structural — how do we fix retention?",
    expectedExpertId: "xp.x.customer-success",
    mustInclude: ["renewals"],
  },
  {
    id: "x-csuccess-vendor",
    query:
      "How should we select a customer-success platform and wire product-usage telemetry, the CRM renewal record, and the recurring-revenue billing ledger into one signal layer for health scoring and expansion?",
    expectedExpertId: "xp.x.customer-success",
    mustInclude: ["adoption"],
  },
  {
    id: "x-csuccess-diag",
    query:
      "Assess the maturity and ROI of our customer-success motion: are health scores backtested against real churn outcomes, is onboarding time-to-value funded, and does CS-led expansion have clean usage and entitlement data?",
    expectedExpertId: "xp.x.customer-success",
    mustInclude: ["onboarding"],
  },

  // ── xp.x.pricing-revenue-management ───────────────────────────────────────
  {
    id: "x-pricing-metric",
    query:
      "What pocket margin, price realization (pocket versus list), and discount-leakage percentage should we target, and how do we read win-rate price-volume sensitivity in our margin waterfall?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    mustInclude: ["discount"],
  },
  {
    id: "x-pricing-aiuc",
    query:
      "Where do margin-waterfall leakage analytics, deal-desk price guidance and guardrails, and price-elasticity optimization modeling recover pocket margin and price realization across our quote-to-cash flow?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    mustInclude: ["margin"],
  },
  {
    id: "x-pricing-pain",
    query:
      "Most of our margin is lost in the pocket-price waterfall through uncontrolled discount delegation and exception creep, our promotions destroy value (gross lift, net loss), and our price increases don't stick — how do we govern discount leakage?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    mustInclude: ["discount"],
  },
  {
    id: "x-pricing-vendor",
    query:
      "How should we choose a price-optimization-and-management platform, CPQ deal-desk quoting tool, and trade-promotion management system, and align them to the ERP price of record for governed dynamic pricing?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    mustInclude: ["price realization"],
  },
  {
    id: "x-pricing-diag",
    query:
      "Assess the maturity of our pricing discipline and the ROI of price-optimization: do we have a price-truth data spine, disciplined discount and rebate governance, and elasticity models built on clean transaction data?",
    expectedExpertId: "xp.x.pricing-revenue-management",
    mustInclude: ["leakage"],
  },

  // ── xp.x.field-customer-service ───────────────────────────────────────────
  {
    id: "x-fieldsvc-metric",
    query:
      "What first-time-fix rate, mean-time-to-repair, truck-rolls-per-resolution, and technician wrench-time utilization should our field-service organization target to cut repeat visits?",
    expectedExpertId: "xp.x.field-customer-service",
    mustInclude: ["first-time-fix"],
  },
  {
    id: "x-fieldsvc-aiuc",
    query:
      "Where do remote connected-asset diagnostics, predictive maintenance failure prediction, and AI dispatch and scheduling optimization raise first-time fix and avoid truck rolls for our field technicians?",
    expectedExpertId: "xp.x.field-customer-service",
    mustInclude: ["truck"],
  },
  {
    id: "x-fieldsvc-pain",
    query:
      "Our field service is run as a cost center not a margin engine, we have false first-time-fix from close-the-job pressure, a parts-data gap that silently kills FTF, and predictive-maintenance pilots that stall — how do we fix truck-roll waste?",
    expectedExpertId: "xp.x.field-customer-service",
    mustInclude: ["technician"],
  },
  {
    id: "x-fieldsvc-vendor",
    query:
      "How should we select a field-service-management dispatch and scheduling platform, connected-asset IoT remote-monitoring system, and service-contract warranty installed-base system of record for our technicians?",
    expectedExpertId: "xp.x.field-customer-service",
    mustInclude: ["repair"],
  },
  {
    id: "x-fieldsvc-diag",
    query:
      "Assess the maturity and ROI of treating field service as a margin engine: is first-time fix measured honestly, is fault-to-part knowledge governed, and does scheduling account for skills and van-stock parts?",
    expectedExpertId: "xp.x.field-customer-service",
    mustInclude: ["truck rolls"],
  },

  // ── xp.x.consumer-products-operations ─────────────────────────────────────
  {
    id: "x-cpg-metric",
    query:
      "What gross margin, trade-promotion ROI, trade-spend percentage of gross revenue, and demand-forecast accuracy should our consumer-products maker target, and what on-shelf availability signals a perfect store?",
    expectedExpertId: "xp.x.consumer-products-operations",
    mustInclude: ["trade-promotion"],
  },
  {
    id: "x-cpg-aiuc",
    query:
      "Where do trade-promotion optimization with post-event incrementality, ML demand sensing from syndicated POS data, and revenue-growth-management price-pack optimization lift gross margin for our CPG portfolio?",
    expectedExpertId: "xp.x.consumer-products-operations",
    mustInclude: ["trade"],
  },
  {
    id: "x-cpg-pain",
    query:
      "Our consumer-products trade spend is a black box with no event-level ROI, retailer power squeezes our margin because we don't own the shelf, trade-deduction leakage grows, and demand volatility creates a retail bullwhip — how do we fix RGM?",
    expectedExpertId: "xp.x.consumer-products-operations",
    mustInclude: ["shelf"],
  },
  {
    id: "x-cpg-vendor",
    query:
      "How should we choose a trade-promotion-management system, demand-planning S&OP-IBP tool, and syndicated-POS consumption-data feed, and align them with our enterprise ERP for revenue growth management?",
    expectedExpertId: "xp.x.consumer-products-operations",
    mustInclude: ["trade spend"],
  },
  {
    id: "x-cpg-diag",
    query:
      "Assess the maturity and ROI of our revenue-growth-management and trade investment: is trade-promotion ROI measured at event level with incrementality, and is demand sensing wired to on-shelf-availability retail execution?",
    expectedExpertId: "xp.x.consumer-products-operations",
    mustInclude: ["demand forecast"],
  },

  // ── xp.x.foodservice-hospitality-operations ───────────────────────────────
  {
    id: "x-foodsvc-metric",
    query:
      "What food cost percentage of sales, labor cost percentage of sales, food-waste percentage, and contribution margin per site should our contract-foodservice estate target across cafes and campus dining?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    mustInclude: ["food cost"],
  },
  {
    id: "x-foodsvc-aiuc",
    query:
      "Where do AI demand forecasting and production planning, menu engineering with margin-aware pricing, and demand-based labor scheduling cut food waste and labor cost across our foodservice and hospitality sites?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    mustInclude: ["food waste"],
  },
  {
    id: "x-foodsvc-pain",
    query:
      "Our managed-foodservice estate battles food-cost creep and inflation pass-through, overproduction food waste, labor not matched to covers, and per-site execution variance across the fleet — how do we standardize culinary execution?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    mustInclude: ["food cost"],
  },
  {
    id: "x-foodsvc-vendor",
    query:
      "How should we select a foodservice-management POS, inventory and recipe-costing platform, a demand-forecasting production-planning layer, and a digital food-safety HACCP temperature-monitoring system for our dining sites?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    mustInclude: ["labor cost"],
  },
  {
    id: "x-foodsvc-diag",
    query:
      "Assess the maturity and ROI of our foodservice operations: are food cost and labor managed to demand and covers per labor hour, is menu engineering driving margin, and is food safety a governed non-negotiable across the estate?",
    expectedExpertId: "xp.x.foodservice-hospitality-operations",
    mustInclude: ["participation"],
  },

  // ── xp.x.media-entertainment ──────────────────────────────────────────────
  {
    id: "x-media-metric",
    query:
      "What monthly subscriber churn, ARPU, content cost per engaged hour, and watch-time engagement per subscriber should our streaming media-and-entertainment service target to manage the content-cost line?",
    expectedExpertId: "xp.x.media-entertainment",
    mustInclude: ["subscriber"],
  },
  {
    id: "x-media-aiuc",
    query:
      "Where do personalization and recommendation, churn-prediction retention orchestration, and content-demand forecasting for green-light support lift watch-time engagement and content ROI for our streaming catalog?",
    expectedExpertId: "xp.x.media-entertainment",
    mustInclude: ["content"],
  },
  {
    id: "x-media-pain",
    query:
      "Our media business is dominated by content cost, a churn leaky-bucket where acquisition only refills subscribers, fat-tailed content ROI we can't predict, and rights-and-royalty complexity leaking margin — how do we grow net subscribers?",
    expectedExpertId: "xp.x.media-entertainment",
    mustInclude: ["churn"],
  },
  {
    id: "x-media-vendor",
    query:
      "How should we choose our streaming OTT platform and CDN, subscription-management billing system, content media-asset-management metadata store, and rights-and-royalty management system for our subscriber base?",
    expectedExpertId: "xp.x.media-entertainment",
    mustInclude: ["subscriber"],
  },
  {
    id: "x-media-diag",
    query:
      "Assess the maturity and ROI of our media monetization: is the ad-versus-subscription trade-off managed, is content ROI evaluated per title and slate against engaged watch-time, and is royalty leakage reconciled?",
    expectedExpertId: "xp.x.media-entertainment",
    mustInclude: ["content"],
  },
];
