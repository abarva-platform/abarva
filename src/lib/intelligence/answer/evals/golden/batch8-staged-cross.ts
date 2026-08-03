// Golden question batch 8 — newly-staged cross-cutting experts.
//
// EXACTLY 5 questions for each of the 4 staged cross-cutting experts (20 total),
// covering 5 distinct angles each: (1) metric, (2) AI use-case, (3) pain /
// stuck-point, (4) vendor/system-of-record/sourcing, (5) diagnostic/maturity/ROI.
//
// Every question is verified to (a) route TOP-1 to its expectedExpertId across
// all 71 registered experts and (b) surface each `mustInclude` token in the
// grounding block. These experts are all cross-cutting, so `industry` is omitted
// (a known tenant industry must never fence a cross-cutting routing decision).

import type { GoldenQuestion } from "./types";

export const BATCH_8_STAGED_CROSS: GoldenQuestion[] = [
  // ── xp.x.real-estate-workplace ────────────────────────────────────────────
  {
    id: "x-cre-metric",
    query:
      "What space utilization rate, cost per occupied seat, and occupancy density benchmarks should our corporate real estate portfolio hold post-hybrid?",
    expectedExpertId: "xp.x.real-estate-workplace",
    mustInclude: ["utilization"],
  },
  {
    id: "x-cre-aiuc",
    query:
      "How can AI fuse badge, sensor, Wi-Fi, and desk-booking signals into a defensible workplace occupancy and utilization read to right-size our office footprint?",
    expectedExpertId: "xp.x.real-estate-workplace",
    mustInclude: ["occupancy"],
  },
  {
    id: "x-cre-pain",
    query:
      "Hybrid work stranded much of our office footprint but we are locked into long-dated leases — how do we recover the cost of empty desks at our lease-event windows?",
    expectedExpertId: "xp.x.real-estate-workplace",
    mustInclude: ["lease"],
  },
  {
    id: "x-cre-vendor",
    query:
      "How should we stand up an IWMS and occupancy-sensing platform to run lease administration, space management, and facilities maintenance on one building source of truth?",
    expectedExpertId: "xp.x.real-estate-workplace",
    mustInclude: ["facilities"],
  },
  {
    id: "x-cre-diag",
    query:
      "Diagnose the maturity of our corporate real estate operation — is our cost per seat and stranded-space share defensible given measured workplace utilization?",
    expectedExpertId: "xp.x.real-estate-workplace",
    mustInclude: ["seat"],
  },

  // ── xp.x.partner-channel-ecosystem ────────────────────────────────────────
  {
    id: "x-partner-metric",
    query:
      "What partner-sourced revenue share, deal-registration approval rate, and active-reseller ratio benchmarks should our indirect channel program hold?",
    expectedExpertId: "xp.x.partner-channel-ecosystem",
    mustInclude: ["partner"],
  },
  {
    id: "x-partner-aiuc",
    query:
      "How can AI auto-triage incoming deal-registration requests from resellers and distributors, detect channel conflict, and approve clean registrations fast?",
    expectedExpertId: "xp.x.partner-channel-ecosystem",
    mustInclude: ["deal"],
  },
  {
    id: "x-partner-pain",
    query:
      "Our MDF and co-op spend on resellers is claimed on faith with no proof-of-performance, and influenced channel revenue is self-reported — how do we get honest attribution?",
    expectedExpertId: "xp.x.partner-channel-ecosystem",
    mustInclude: ["mdf"],
  },
  {
    id: "x-partner-vendor",
    query:
      "How should we choose a PRM and structure deal registration, partner tiers, and co-sell marketplace listings across our distributor and reseller channel?",
    expectedExpertId: "xp.x.partner-channel-ecosystem",
    mustInclude: ["channel"],
  },
  {
    id: "x-partner-diag",
    query:
      "Diagnose the maturity of our channel program — is our partner-sourced versus partner-influenced revenue split honest and our MDF ROI actually measured?",
    expectedExpertId: "xp.x.partner-channel-ecosystem",
    mustInclude: ["partner"],
  },

  // ── xp.x.knowledge-management ──────────────────────────────────────────────
  {
    id: "x-km-metric",
    query:
      "What time-to-find, enterprise-search success rate, and knowledge-base freshness benchmarks should our knowledge management program hold?",
    expectedExpertId: "xp.x.knowledge-management",
    mustInclude: ["search"],
  },
  {
    id: "x-km-aiuc",
    query:
      "How do we build RAG-grounded knowledge answers over our content so employee and customer self-service stay accurate, permission-trimmed, and traceable?",
    expectedExpertId: "xp.x.knowledge-management",
    mustInclude: ["rag"],
  },
  {
    id: "x-km-pain",
    query:
      "Our enterprise search still fails after years and our knowledge content rots because contribution is unincentivized — how do we fix findability and content freshness?",
    expectedExpertId: "xp.x.knowledge-management",
    mustInclude: ["findability"],
  },
  {
    id: "x-km-vendor",
    query:
      "How should we choose an enterprise search and knowledge-base platform with security-trimming and content lifecycle governance for unstructured knowledge?",
    expectedExpertId: "xp.x.knowledge-management",
    mustInclude: ["content"],
  },
  {
    id: "x-km-diag",
    query:
      "Diagnose the maturity of our knowledge management — what share of content has an owner and review date, and is time-to-find improving or is the corpus stale?",
    expectedExpertId: "xp.x.knowledge-management",
    mustInclude: ["content"],
  },

  // ── xp.x.rd-innovation-portfolio ───────────────────────────────────────────
  {
    id: "x-rdinnov-metric",
    query:
      "What R&D intensity, return-on-R&D, and portfolio horizon-balance benchmarks should our innovation portfolio hold across H1, H2, and H3 bets?",
    expectedExpertId: "xp.x.rd-innovation-portfolio",
    mustInclude: ["r&d"],
  },
  {
    id: "x-rdinnov-aiuc",
    query:
      "How can AI technology scouting and horizon scanning surface emerging innovation bets and feed option-valued decision support for our R&D portfolio?",
    expectedExpertId: "xp.x.rd-innovation-portfolio",
    mustInclude: ["horizon"],
  },
  {
    id: "x-rdinnov-pain",
    query:
      "Most of our innovation portfolio is horizon-1 incrementalism mislabeled as transformation while our stage-gate kills speed — how do we protect H2 and H3 bets?",
    expectedExpertId: "xp.x.rd-innovation-portfolio",
    mustInclude: ["stage-gate"],
  },
  {
    id: "x-rdinnov-vendor",
    query:
      "How should we run our stage-gate idea-to-launch funnel and technology-scouting open-innovation pipeline to manage the cross-horizon innovation portfolio?",
    expectedExpertId: "xp.x.rd-innovation-portfolio",
    mustInclude: ["innovation"],
  },
  {
    id: "x-rdinnov-diag",
    query:
      "Diagnose our innovation maturity and return on R&D — is our horizon balance real or is transformational spend starved and measured on horizon-1 metrics?",
    expectedExpertId: "xp.x.rd-innovation-portfolio",
    mustInclude: ["innovation"],
  },
];
