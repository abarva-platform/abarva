// Consilium expert — Knowledge Management & Enterprise Search (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It owns the
// CAPTURE, CURATION, GOVERNANCE, and FINDABILITY of UNSTRUCTURED enterprise
// knowledge and content: knowledge capture/curation, enterprise search &
// retrieval, content lifecycle & governance, taxonomy/ontology, communities of
// practice, self-service knowledge (customer support and employee), and — newly
// business-critical — RAG / enterprise-AI knowledge grounding.
//
// DISTINCT from two neighbouring experts. The data-governance-mdm expert owns
// STRUCTURED master/reference data, match/merge, and golden records; the
// data-analytics-platform expert owns the analytics/BI platform and pipelines.
// THIS expert owns UNSTRUCTURED knowledge/content + findability — the documents,
// articles, wikis, and the search/retrieval layer over them, regardless of which
// platform stores them.
//
// CORE DOCTRINE — KM DIES OF CONTENT ROT AND UNINCENTIVIZED CONTRIBUTION;
// SEARCH HAS BEEN "ALMOST SOLVED" FOR 20 YEARS; RAG MADE QUALITY + PERMISSIONS
// SUDDENLY BUSINESS-CRITICAL. Five honesty rules drive every recommendation:
//   (1) Most KM programs die not because the platform is wrong but because
//       contribution is never incentivized and content is never curated — so the
//       knowledge base rots, stale outweighs fresh, and people stop trusting it.
//       Freshness and ownership, not the wiki you bought, decide the outcome.
//   (2) Enterprise search has been "almost solved" for 20 years and still is not,
//       because the hard part is not ranking — it is ACCESS CONTROL (security-
//       trimmed results), FRESHNESS, and FRAGMENTATION across dozens of content
//       silos. A new search box over a fragmented, permission-blind, stale estate
//       does not fix findability.
//   (3) RAG / LLM grounding did not make these problems go away — it made them
//       business-critical overnight. Garbage-in is now answered CONFIDENTLY and
//       fluently; a stale or wrong article that used to sit unread is now the
//       source of a confident wrong answer, and a permission leak in retrieval is
//       now a data-exposure incident, not a ranking nuisance.
//   (4) "Deflection" metrics FLATTER KM. A high self-service deflection rate can
//       coexist with poor findability — a deflected contact may be an abandoned,
//       frustrated user who gave up, not a satisfied self-server. Deflection must
//       be read with findability satisfaction and answer accuracy, never alone.
//   (5) KM ROI is REAL (time-to-find, support deflection, faster onboarding) but
//       it is gated by CURATION DISCIPLINE, not search technology. The value dies
//       in the unglamorous work of ownership, review cycles, retirement of stale
//       content, and incentivized contribution — the 80% the platform demo never
//       shows. Tool-aware (ServiceNow KM, Confluence, SharePoint, Guru, Glean,
//       Elastic/enterprise-search), not tool-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const knowledgeManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.knowledge-management",
    expertName: "Knowledge Management & Enterprise Search Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "knowledge-management",
    scopeNote:
      "Cross-cutting capture, curation, governance, and findability of " +
      "UNSTRUCTURED enterprise knowledge and content: knowledge capture & " +
      "curation, enterprise search & retrieval, content lifecycle & " +
      "governance, taxonomy/ontology, communities of practice, self-service " +
      "knowledge (customer support and employee), and RAG / enterprise-AI " +
      "knowledge grounding. Doctrine: most KM programs die because contribution " +
      "is UNINCENTIVIZED and content ROTS (stale outweighs fresh); enterprise " +
      "search has been 'almost solved' for 20 years and still is not, because of " +
      "ACCESS-CONTROL (security-trimming), FRESHNESS, and FRAGMENTATION, not " +
      "ranking; RAG/LLM grounding just made knowledge QUALITY + PERMISSIONS " +
      "suddenly business-critical (garbage-in is now answered CONFIDENTLY); " +
      "'deflection' metrics FLATTER KM while findability stays poor; ROI is real " +
      "(time-to-find, deflection, onboarding) but gated by CURATION DISCIPLINE, " +
      "not search tech. DISTINCT from the data-governance-mdm expert (structured " +
      "master/reference data, match/merge, golden records) and the " +
      "data-analytics-platform expert (BI/analytics platform and pipelines) — " +
      "this expert owns UNSTRUCTURED knowledge/content and findability. Excludes " +
      "structured-data governance, the AI/ML model layer and model risk, and the " +
      "contact-center operating model itself (separate experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "time_to_find_answer",
        name: "Time to find / time to answer",
        definition:
          "Median elapsed time for a knowledge seeker (employee or supported " +
          "customer) to locate the correct, current answer to a real question — " +
          "from query intent to confirmed answer, not merely to a search-result " +
          "page.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "Findability / knowledge-worker studies; well-curated, well-indexed " +
            "estates resolve in a minute or two, fragmented permission-blind " +
            "estates push the median into many minutes of hunting across silos",
          label: "planning-range",
        },
        dataSource:
          "Search analytics (query-to-click-to-resolution), knowledge-base " +
          "session telemetry, and findability/task-success studies",
        whyItMatters:
          "Time-to-find is the truest unit of knowledge productivity and the " +
          "clearest source of KM ROI — knowledge workers spend a large share of " +
          "the day searching for and recreating information. It is the number a " +
          "search box is bought to move, and the one a fragmented, stale estate " +
          "quietly inflates.",
      },
      {
        key: "search_success_rate",
        name: "Search success rate (and zero-result rate)",
        definition:
          "Share of searches that lead the user to a relevant result they act on " +
          "(click-through to a successful task), with the inverse zero-result / " +
          "no-click rate tracked as the failure signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Enterprise-search analytics ranges; tuned, well-curated search " +
            "reaches the high end while fragmented, permission-blind, or " +
            "synonym-poor search leaves a large zero-result/abandon tail",
          label: "planning-range",
        },
        dataSource:
          "Enterprise-search / knowledge-base query analytics (success clicks, " +
          "zero-result queries, refinements, abandons)",
        whyItMatters:
          "The direct read on whether search actually works. A high zero-result " +
          "rate is the earliest, most honest sign that content coverage, " +
          "synonyms, freshness, or permissions are broken — long before " +
          "deflection or satisfaction reveal it.",
      },
      {
        key: "self_service_deflection_rate",
        name: "Self-service deflection rate",
        definition:
          "Share of support contacts (customer or employee) resolved through " +
          "self-service knowledge without a human agent — explicitly read " +
          "ALONGSIDE findability satisfaction and answer accuracy, never as a " +
          "standalone success metric.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "Support self-service ranges; mature, well-curated knowledge bases " +
            "deflect a substantial share, but the figure is easily inflated by " +
            "abandonment and must be qualified by satisfaction and accuracy",
          label: "planning-range",
        },
        dataSource:
          "Support / service-management deflection analytics joined to CSAT, " +
          "abandonment, and downstream re-contact (the same intent recurring)",
        whyItMatters:
          "Deflection is the headline KM-to-support ROI lever AND the metric " +
          "that most flatters the program. A 'deflected' contact can be a " +
          "frustrated user who gave up — so deflection is only credible read " +
          "with findability satisfaction, answer accuracy, and re-contact.",
      },
      {
        key: "kb_freshness_rate",
        name: "Knowledge-base freshness (% reviewed in cycle)",
        definition:
          "Share of published knowledge content that has been reviewed, " +
          "validated, or updated within its defined review cycle (and is not " +
          "past its review-due date) — the measurable form of content-rot " +
          "control.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Content-governance ranges; disciplined programs keep nearly all " +
            "active content within its review cycle, while neglected estates let " +
            "a large stale long-tail accumulate past review-due",
          label: "planning-range",
        },
        dataSource:
          "Knowledge-management content lifecycle reporting (review dates, " +
          "last-updated, review-due, and retirement status)",
        whyItMatters:
          "Freshness is where KM lives or dies. Stale content outweighing fresh " +
          "is the root cause of distrust, abandoned self-service, and — under " +
          "RAG — confident wrong answers. It is the single best leading " +
          "indicator that curation discipline is real or absent.",
      },
      {
        key: "content_coverage_top_intents",
        name: "Content coverage of top intents",
        definition:
          "Share of the top recurring questions / support intents that have a " +
          "current, accurate, findable knowledge article (or grounding source) " +
          "covering them — coverage measured where demand is, not across the " +
          "whole corpus.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Knowledge-coverage ranges against top-volume intents; mature " +
            "programs cover nearly all high-frequency intents, immature ones " +
            "leave demand-weighted gaps that drive search failure and contacts",
          label: "planning-range",
        },
        dataSource:
          "Top-intent / query-volume analysis joined to the content inventory " +
          "(search zero-results, contact reasons, and knowledge-gap reports)",
        whyItMatters:
          "Coverage on TOP intents is where findability is won or lost — a huge " +
          "corpus with gaps on the highest-volume questions still fails users. " +
          "It reframes content work from 'write more' to 'cover the demand,' the " +
          "discipline that actually moves deflection and time-to-find.",
      },
      {
        key: "article_reuse_rate",
        name: "Article reuse rate",
        definition:
          "Frequency with which existing knowledge articles are reused (linked, " +
          "viewed, attached to a resolution) rather than answers being " +
          "recreated ad hoc — a knowledge-capture-and-reuse maturity signal " +
          "(KCS-aligned).",
        unit: "reuses per article per period / % resolutions linked to KB",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Knowledge-Centered Service (KCS) reuse ranges; mature capture-and-" +
            "reuse cultures link the majority of resolutions to reused content, " +
            "low-maturity teams recreate answers and leave content unused",
          label: "planning-range",
        },
        dataSource:
          "Service-management / knowledge linkage analytics (resolutions linked " +
          "to articles, article view/link frequency)",
        whyItMatters:
          "Reuse is the proof that captured knowledge is actually working — it " +
          "is the difference between a knowledge base and a content graveyard. " +
          "High reuse means capture, findability, and trust are aligned; low " +
          "reuse means people route around the KB and recreate answers.",
      },
      {
        key: "contribution_rate",
        name: "Contribution rate",
        definition:
          "Rate at which eligible contributors (agents, SMEs, employees) create " +
          "or improve knowledge in the period — new articles, edits, and " +
          "validations — relative to the contributor population.",
        unit: "contributions per contributor per period / % active contributors",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 50,
          basis:
            "KM contribution ranges; without explicit incentives and embedded " +
            "capture, contribution concentrates in a small active minority — " +
            "incentivized, in-workflow capture broadens it materially",
          label: "planning-range",
        },
        dataSource:
          "Knowledge-platform authoring/edit telemetry joined to the eligible " +
          "contributor population (active contributors, contribution volume)",
        whyItMatters:
          "Contribution is the supply side of KM and the most common point of " +
          "death. Programs fail because contribution is never incentivized or " +
          "embedded in the workflow, so the corpus stops growing and rots — " +
          "this metric exposes that decay before freshness and reuse collapse.",
      },
      {
        key: "pct_content_with_owner_review_date",
        name: "% content with owner + review date",
        definition:
          "Share of published knowledge content that carries a named owner AND " +
          "a defined next-review date — the accountability-and-lifecycle " +
          "coverage that makes curation an operating reality rather than a " +
          "one-time cleanup.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "Content-governance maturity ranges; disciplined programs assign an " +
            "owner and review date to nearly all active content, neglected ones " +
            "leave large unowned, never-reviewed long-tails",
          label: "planning-range",
        },
        dataSource:
          "Knowledge-platform metadata / content-governance reporting (owner " +
          "assignment and review-date coverage over the active corpus)",
        whyItMatters:
          "Ownership plus a review date is where content governance becomes " +
          "accountability instead of a memo. Unowned, never-reviewed content is " +
          "the single best predictor of rot — and, under RAG, of confident wrong " +
          "answers no one is responsible for fixing.",
      },
      {
        key: "grounded_answer_accuracy",
        name: "Answer accuracy (grounded / RAG)",
        definition:
          "Share of AI-grounded / RAG answers over the knowledge corpus that are " +
          "factually correct, current, and properly cited to a permitted source " +
          "— evaluated against a graded test set, not asserted.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "Enterprise RAG evaluation ranges; accuracy is gated by corpus " +
            "freshness, coverage, and de-duplication far more than by the model " +
            "— a stale or contradictory corpus caps accuracy regardless of LLM",
          label: "planning-range",
        },
        dataSource:
          "RAG / grounded-answer evaluation harness (graded answer set with " +
          "citation, freshness, and permission checks) and user feedback signals",
        whyItMatters:
          "Under RAG, knowledge quality became business-critical: garbage-in is " +
          "now answered CONFIDENTLY. Grounded answer accuracy is the metric that " +
          "exposes corpus rot, duplication, and coverage gaps as executive risk " +
          "— and it is moved by curation, not by swapping the model.",
      },
      {
        key: "duplicate_stale_content_rate",
        name: "Duplicate / stale content rate",
        definition:
          "Share of the active corpus that is duplicated (multiple " +
          "near-identical or contradictory articles for the same intent) or " +
          "stale (past review-due / superseded but not retired) — the corpus-rot " +
          "burden.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Content-audit ranges; neglected estates accumulate large duplicate " +
            "and stale shares (often a third or more of the corpus), disciplined " +
            "lifecycle management drives both to low single-to-double digits",
          label: "planning-range",
        },
        dataSource:
          "Content-audit / near-duplicate detection and lifecycle reporting " +
          "(duplicate clusters, superseded-not-retired, past-review-due counts)",
        whyItMatters:
          "Duplicate and stale content is the measurable form of rot — it " +
          "degrades search ranking, splits trust, and, under RAG, produces " +
          "contradictory or confidently-wrong answers. It is the burden curation " +
          "discipline exists to remove, and the clearest target for retirement.",
      },
      {
        key: "findability_satisfaction",
        name: "Findability satisfaction",
        definition:
          "User-reported satisfaction with the ability to find correct, current " +
          "knowledge (article helpfulness votes, search-satisfaction surveys, " +
          "task-success self-report) — the experience read that keeps deflection " +
          "honest.",
        unit: "% satisfied / CSAT (1-5) / helpfulness score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Knowledge-experience satisfaction ranges; well-curated, findable " +
            "estates score high, while fragmented, stale ones leave users " +
            "dissatisfied even where raw deflection looks healthy",
          label: "planning-range",
        },
        dataSource:
          "Article helpfulness votes, search-satisfaction surveys, and " +
          "self-service experience CSAT joined to deflection and re-contact",
        whyItMatters:
          "Findability satisfaction is the corrective to deflection theater. It " +
          "distinguishes a genuinely self-served user from a frustrated one who " +
          "gave up — without it, a flattering deflection number can hide a " +
          "findability failure entirely.",
      },
      {
        key: "time_to_onboard_new_hire",
        name: "Mean time to onboard new hire (knowledge ramp)",
        definition:
          "Median time for a new hire (or new support agent) to reach defined " +
          "productivity / competency, to the extent it is gated by access to " +
          "and findability of the knowledge they need to do the job.",
        unit: "weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 16,
          basis:
            "Onboarding-ramp ranges; strong, findable, current knowledge and " +
            "guided paths compress ramp materially, while tribal-knowledge, " +
            "fragmented estates stretch it out and load tenured staff",
          label: "planning-range",
        },
        dataSource:
          "HR / enablement onboarding-to-productivity tracking joined to " +
          "knowledge-access and self-service usage during ramp",
        whyItMatters:
          "Knowledge ramp is a large, often-uncounted KM value lever — strong, " +
          "findable knowledge turns tribal knowledge into a self-serve path, " +
          "compressing onboarding and offloading tenured experts. It connects KM " +
          "directly to workforce productivity and capacity.",
      },
    ],

    painThemes: [
      {
        key: "content_rot_no_curation",
        name: "Content rot — stale outweighs fresh, no curation discipline",
        description:
          "Knowledge is captured once and never maintained: articles are " +
          "unowned, have no review date, and are never retired, so the stale and " +
          "superseded long-tail grows until it outweighs fresh content. Users " +
          "stop trusting the knowledge base, search ranks rot alongside truth, " +
          "and — under RAG — the model confidently answers from the stale source.",
        detectionSignal:
          "Low freshness rate, large past-review-due and superseded-not-retired " +
          "counts, low % content with owner + review date, falling article " +
          "helpfulness, and a duplicate/stale rate climbing toward a third or " +
          "more of the corpus.",
        diagnosticQuestion:
          "What share of your active content has a named owner and a review " +
          "date, what share is past its review cycle, and who is accountable for " +
          "retiring stale and superseded articles?",
      },
      {
        key: "contribution_not_incentivized",
        name: "Contribution never incentivized or embedded",
        description:
          "Knowledge creation depends on a small volunteer minority because it " +
          "is extra work with no incentive, recognition, or in-workflow capture " +
          "— so the corpus stops growing, coverage on new and changing intents " +
          "lags, and the program quietly starves. The platform was never the " +
          "problem; the supply of curated knowledge was.",
        detectionSignal:
          "Contribution concentrated in a handful of active authors, low active-" +
          "contributor share, no capture embedded in the support/work workflow, " +
          "no incentive or recognition, and coverage gaps on recent intents.",
        diagnosticQuestion:
          "Who actually contributes knowledge, is capture embedded in the " +
          "workflow (e.g. resolve-and-capture) or bolted on as extra work, and " +
          "what incentive or recognition makes contributing worth it?",
      },
      {
        key: "search_almost_solved_fragmentation",
        name: "Search 'almost solved' — fragmentation, freshness, permissions",
        description:
          "A new search box is bought expecting to fix findability, but the real " +
          "blockers are FRAGMENTATION (knowledge scattered across dozens of " +
          "silos), FRESHNESS (the index serves stale content), and ACCESS " +
          "CONTROL (results are not security-trimmed to the user's permissions) " +
          "— none of which better ranking solves. Findability stays poor and the " +
          "tool is blamed.",
        detectionSignal:
          "Many disconnected content repositories, no unified or federated " +
          "index, stale index lag, no security-trimming (or over-trimming), high " +
          "zero-result and refinement rates, and users defaulting to colleagues " +
          "over search.",
        diagnosticQuestion:
          "Across how many silos is your knowledge scattered, is search " +
          "security-trimmed to each user's real permissions, and how fresh is " +
          "the index — or did you buy a better search box over the same broken " +
          "estate?",
      },
      {
        key: "rag_confident_garbage",
        name: "RAG made garbage-in a confident wrong answer",
        description:
          "An LLM/RAG layer is put over the existing corpus and now answers " +
          "confidently and fluently from stale, duplicated, contradictory, or " +
          "permission-leaking content — turning a long-tolerated content-quality " +
          "problem into a board-visible risk of confident wrong answers and data " +
          "exposure. The reflex is to tune the model; the fix is to curate the " +
          "corpus and enforce permissions in retrieval.",
        detectionSignal:
          "RAG pilots producing plausible-but-wrong or contradictory answers, no " +
          "grounded-answer evaluation set, no citation/freshness checks, " +
          "retrieval not enforcing source permissions, and a model-tuning reflex " +
          "rather than a curation-and-permissions response.",
        diagnosticQuestion:
          "For the content your RAG/AI answers over, is it current, " +
          "de-duplicated, owned, and permission-enforced in retrieval — and is " +
          "grounded-answer accuracy measured against a graded set, or assumed?",
      },
      {
        key: "deflection_theater",
        name: "Deflection theater — flattering metric, poor findability",
        description:
          "A high self-service deflection rate is reported as success while " +
          "findability is actually poor: many 'deflected' contacts are " +
          "frustrated users who abandoned, the same intents re-contact through " +
          "another channel, and satisfaction with finding answers is low. The " +
          "metric flatters KM and masks the real failure.",
        detectionSignal:
          "High deflection reported alone, with low findability satisfaction, " +
          "high self-service abandonment, recurring re-contact for the same " +
          "intents, and no answer-accuracy or task-success measurement behind " +
          "the deflection figure.",
        diagnosticQuestion:
          "Behind your deflection rate, what is findability satisfaction, the " +
          "self-service abandonment rate, and the re-contact rate for the same " +
          "intents — is it genuine self-service or users giving up?",
      },
      {
        key: "taxonomy_findability_breakdown",
        name: "Taxonomy / ontology & metadata breakdown",
        description:
          "Content is filed under inconsistent, outdated, or absent taxonomy and " +
          "tagging — no controlled vocabulary, synonyms, or entity model — so the " +
          "same topic is labelled differently across silos, search and " +
          "navigation fragment, and retrieval (human or RAG) cannot reliably " +
          "find the right thing.",
        detectionSignal:
          "Inconsistent or unmaintained tags and categories, no controlled " +
          "vocabulary or synonym set, duplicate topics under different labels, " +
          "high search-refinement rates, and RAG retrieval returning the wrong " +
          "or partial source.",
        diagnosticQuestion:
          "Is your knowledge organized under a maintained taxonomy with " +
          "controlled vocabulary and synonyms, or has tagging drifted so the " +
          "same topic is filed and labelled differently across systems?",
      },
      {
        key: "permission_leakage_oversharing",
        name: "Permission leakage & oversharing in retrieval",
        description:
          "Access controls on content are inconsistent or not enforced at the " +
          "retrieval layer, so search or a RAG assistant surfaces content a user " +
          "should not see (oversharing) — a low-grade ranking nuisance for " +
          "decades that, under enterprise AI, becomes a data-exposure incident " +
          "with confident, summarized leakage.",
        detectionSignal:
          "No reliable security-trimming, inconsistent permissions across " +
          "repositories, over-permissive shared sites, RAG retrieval ignoring " +
          "source ACLs, and no audit of what content the assistant can reach per " +
          "user.",
        diagnosticQuestion:
          "Does your search and RAG retrieval enforce each user's real " +
          "permissions on every source, and have you audited what content the " +
          "assistant can actually surface for different roles?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "rag_grounded_knowledge_answers",
        name: "RAG grounded knowledge answers (employee & customer self-service)",
        valueMechanism:
          "An LLM answers questions by retrieving from the curated, " +
          "permission-trimmed knowledge corpus and synthesizing a cited answer — " +
          "collapsing time-to-find and lifting deflection by giving a direct " +
          "answer instead of a list of links. Value is realized only when the " +
          "corpus is fresh, de-duplicated, and permission-enforced; accuracy is " +
          "gated by curation, not the model.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A curated, fresh, de-duplicated knowledge corpus with owners and review dates",
          "Source-level permissions enforceable at retrieval (security-trimmed)",
          "A graded grounded-answer evaluation set with citation and freshness checks",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Garbage-in is answered confidently — stale/contradictory content must be curated before grounding, not after complaints",
          "Retrieval must enforce source permissions or it becomes a confident data-exposure channel",
        ],
        metricsMoved: [
          "grounded_answer_accuracy",
          "time_to_find_answer",
          "self_service_deflection_rate",
        ],
      },
      {
        key: "ai_search_relevance_intent",
        name: "AI / semantic enterprise search & intent understanding",
        valueMechanism:
          "Semantic (vector) and hybrid search plus intent understanding and " +
          "synonym expansion raise search success and cut zero-results by " +
          "matching meaning, not keywords, across a unified index — improving " +
          "findability where ranking genuinely was the gap, on top of (not " +
          "instead of) fixing fragmentation, freshness, and permissions.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "A unified or federated index across content silos with security-trimming",
          "Query and click analytics (success, zero-result, refinement) for tuning",
          "A controlled vocabulary / synonym set and taxonomy to ground intent",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Semantic ranking over a fragmented, stale, permission-blind estate still fails — index hygiene comes first",
          "Relevance tuning must be evaluated on real query success, not offline relevance alone",
        ],
        metricsMoved: [
          "search_success_rate",
          "time_to_find_answer",
          "findability_satisfaction",
        ],
      },
      {
        key: "ai_content_lifecycle_curation",
        name: "AI content lifecycle & curation (stale/duplicate detection, refresh)",
        valueMechanism:
          "AI detects stale, superseded, contradictory, and near-duplicate " +
          "content, flags review-due articles, suggests merges and retirements, " +
          "and drafts refreshes — collapsing the curation backlog so freshness " +
          "rises and the duplicate/stale burden falls, directly attacking the " +
          "content-rot that kills KM and corrupts RAG.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "The content inventory with last-updated, review-due, and version metadata",
          "Usage, helpfulness, and search-success signals to prioritize curation",
          "Near-duplicate / contradiction detection over the corpus",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-suggested retirements and merges must be owner-approved — auto-deletion risks losing valid knowledge",
          "AI-drafted refreshes must be SME-validated before publish, especially for regulated or safety content",
        ],
        metricsMoved: [
          "kb_freshness_rate",
          "duplicate_stale_content_rate",
          "pct_content_with_owner_review_date",
        ],
      },
      {
        key: "ai_capture_authoring_assist",
        name: "AI knowledge capture & authoring assistance (resolve-and-capture)",
        valueMechanism:
          "AI drafts new articles from resolved cases, chats, and tickets, " +
          "suggests gaps from unanswered intents, and lowers authoring friction " +
          "so capture is embedded in the workflow rather than extra work — " +
          "raising contribution and coverage of top intents where unincentivized " +
          "contribution otherwise starves the corpus.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Resolved cases, chat/ticket transcripts, and unanswered-intent signals",
          "Top-intent / coverage-gap analysis to target authoring",
          "An authoring/review workflow so drafts are validated before publish",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-drafted articles must be SME-reviewed for accuracy and permission/sensitivity before publish",
          "Capture volume without a quality bar recreates rot — drafts feed review, not direct publish",
        ],
        metricsMoved: [
          "contribution_rate",
          "content_coverage_top_intents",
          "article_reuse_rate",
        ],
      },
      {
        key: "ai_taxonomy_tagging_metadata",
        name: "AI taxonomy, tagging & metadata enrichment",
        valueMechanism:
          "AI auto-classifies content against a controlled taxonomy, suggests " +
          "tags, synonyms, and entity links, and detects mis-filed or " +
          "inconsistently labelled content — restoring a consistent organizing " +
          "layer so both human navigation and RAG retrieval find the right " +
          "source, attacking the taxonomy breakdown behind poor findability.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A controlled taxonomy / ontology and synonym set to classify against",
          "Content text and existing tags for classification and consistency checks",
          "Search-refinement and retrieval-error signals to prioritize fixes",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-tagging that drives access or routing must be human-validated on sensitive content",
          "Taxonomy suggestions need governance — an unmanaged auto-taxonomy drifts as fast as a manual one",
        ],
        metricsMoved: [
          "search_success_rate",
          "content_coverage_top_intents",
          "duplicate_stale_content_rate",
        ],
      },
      {
        key: "ai_onboarding_expertise_assistant",
        name: "AI onboarding & expertise-location assistant",
        valueMechanism:
          "A grounded assistant answers new-hire and agent questions from the " +
          "curated corpus and routes to the right expert or community when " +
          "knowledge is tacit — compressing the knowledge ramp and offloading " +
          "tenured experts by turning tribal knowledge into a guided, self-serve " +
          "path.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "A curated onboarding/role corpus with owners and currency",
          "Expertise / community directory to route tacit-knowledge questions",
          "Onboarding-ramp and self-service usage baselines to measure impact",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Answers must cite current, permitted sources; stale onboarding guidance erodes trust fast",
          "Expert routing must respect availability and not overload a few named SMEs",
        ],
        metricsMoved: [
          "time_to_onboard_new_hire",
          "time_to_find_answer",
          "findability_satisfaction",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "content_lifecycle_governance",
        name: "Content lifecycle governance (ownership + review cycles + retirement)",
        description:
          "Knowledge run as a governed lifecycle, not a one-time load: every " +
          "active article carries a named owner and a review date, review cycles " +
          "run on a cadence, superseded and stale content is actively retired, " +
          "and freshness and duplicate/stale rate are measured — making curation " +
          "discipline an operating reality so the corpus stays trustworthy and " +
          "RAG-safe.",
        boundary:
          "Owns the content lifecycle — ownership, review cadence, retirement, " +
          "and freshness/quality measurement; does not own the authoring of " +
          "domain content itself (SMEs do) or the platform — it makes whoever " +
          "owns content accountable for keeping it current.",
        humanAccountabilityPoint:
          "Knowledge Manager / Head of Knowledge (lifecycle standards & freshness); content owners accountable per article/domain",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "unified_search_security_trimmed",
        name: "Unified, security-trimmed enterprise search (fresh federated index)",
        description:
          "A unified or federated search layer that indexes across the content " +
          "silos with a fresh index and ENFORCES each user's permissions at " +
          "retrieval (security-trimmed results), with semantic/hybrid ranking, " +
          "synonyms, and tuning from query-success analytics — directly " +
          "attacking the fragmentation, freshness, and access-control blockers " +
          "that have kept search 'almost solved.'",
        boundary:
          "Owns the index, security-trimming, relevance, and search analytics " +
          "across sources; does not own the content's accuracy or lifecycle (the " +
          "governance pattern does) or the source-system permissions themselves " +
          "— it must faithfully honor them.",
        humanAccountabilityPoint:
          "Enterprise Search / Findability Lead (relevance & index); source-system owners (permissions honored)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "rag_grounding_layer",
        name: "Governed RAG grounding layer over the knowledge corpus",
        description:
          "A retrieval-augmented generation layer that answers over the curated " +
          "corpus with permission-enforced retrieval, citation of permitted " +
          "sources, freshness checks, and a graded evaluation harness — so " +
          "AI-grounded answers are accurate, current, cited, and safe, built ON " +
          "TOP of curation and security-trimming rather than as a substitute for " +
          "them.",
        boundary:
          "Owns retrieval, grounding, citation, permission-enforcement, and " +
          "answer evaluation; does NOT own content currency/quality (the " +
          "lifecycle pattern) or the underlying permission model (the search/" +
          "source layer) — it consumes and must not weaken either.",
        humanAccountabilityPoint:
          "Knowledge/AI Product Owner (grounding quality & evaluation); content owners accountable for the grounded sources",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "embedded_capture_kcs",
        name: "Embedded capture & reuse operating model (KCS-style)",
        description:
          "Knowledge capture and reuse embedded directly in the work and support " +
          "workflow (resolve-and-capture), with reuse linked to resolutions, " +
          "contribution incentivized and recognized, and a lightweight quality " +
          "bar — so the corpus grows and stays covered on real demand rather " +
          "than starving on unincentivized volunteer effort.",
        boundary:
          "Owns the capture-and-reuse workflow, contribution incentives, and the " +
          "publish-quality bar; does not own the search/retrieval layer or the " +
          "lifecycle retirement cadence — it is the supply engine that feeds " +
          "them current, demand-aligned content.",
        humanAccountabilityPoint:
          "Knowledge Program Lead (capture-and-reuse model & incentives); team leads accountable for embedded contribution",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "taxonomy_ontology_management",
        name: "Taxonomy / ontology & metadata management",
        description:
          "A maintained controlled vocabulary, taxonomy/ontology, synonym set, " +
          "and metadata standard applied consistently across content silos and " +
          "used to ground both navigation and retrieval — so the same topic is " +
          "labelled and found the same way everywhere, the foundation that " +
          "search relevance and RAG retrieval both depend on.",
        boundary:
          "Owns the controlled vocabulary, taxonomy, synonyms, and metadata " +
          "standard and their consistent application; does not own the content " +
          "itself or the search engine — it is the shared organizing layer they " +
          "all rely on to be findable.",
        humanAccountabilityPoint:
          "Taxonomist / Information Architect (the controlled vocabulary & metadata standard)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Knowledge-management value is realized as RECOVERED TIME and DEFLECTED " +
        "EFFORT — faster time-to-find, higher self-service deflection, faster " +
        "onboarding, and reuse instead of recreation — never at the point of " +
        "publishing content. The honest chain is: curated, fresh, findable, " +
        "permission-safe knowledge shortens time-to-find and lifts genuine " +
        "deflection and reuse; that recovers knowledge-worker and agent time and " +
        "compresses the knowledge ramp; IF that recovered time is reinvested or " +
        "cashed out, it becomes value. Two engines run: (1) direct efficiency — " +
        "time-to-find reduction, support deflection, and onboarding compression, " +
        "the most measurable slice; and (2) enablement — a trustworthy corpus " +
        "UNLOCKS reliable RAG/AI answers and better decisions, larger but softer " +
        "and attributed to the use cases it enables, not to the KM line. The " +
        "binding constraint is CURATION DISCIPLINE, not search technology: " +
        "without ownership, review cycles, retirement, and incentivized " +
        "contribution, content rots, deflection becomes theater, and RAG " +
        "answers confidently from garbage — so projected value must be " +
        "discounted to what the actual curation capacity can sustain. " +
        "Deflection in particular must be netted for abandonment, never booked " +
        "gross.",
      dominantHaircutFactors: [
        {
          factor: "Curation discipline / content-rot give-back",
          rationale:
            "The single largest over-statement in KM business cases. Value " +
            "modeled on a fresh, findable corpus collapses if contribution is " +
            "unincentivized and content is never reviewed or retired — the " +
            "corpus rots, trust falls, and reuse and deflection decay. Projected " +
            "value must be discounted to what the actual curation capacity and " +
            "contribution model can sustain.",
          typicalHaircut: {
            low: 0.25,
            high: 0.6,
            basis:
              "Observed gap between KM projected value and realized value where " +
              "curation discipline and incentivized contribution are absent and " +
              "content rots",
            label: "planning-range",
          },
        },
        {
          factor: "Deflection overstatement (abandonment, not self-service)",
          rationale:
            "Self-service deflection is the most flattering KM number — a large " +
            "share of 'deflected' contacts can be frustrated users who abandoned " +
            "and re-contact elsewhere, so gross deflection over-states realized " +
            "value and must be netted for abandonment, re-contact, and " +
            "findability satisfaction.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Gap between gross deflection and net genuine self-service once " +
              "abandonment, re-contact, and satisfaction are accounted for",
            label: "planning-range",
          },
        },
        {
          factor: "Fragmentation / freshness / permissions (findability not fixed)",
          rationale:
            "Where knowledge stays scattered across silos, the index is stale, " +
            "or results are not security-trimmed, a new search or RAG layer does " +
            "not actually improve findability — so time-to-find and search-" +
            "success gains do not materialize and value must be discounted to " +
            "the share of the estate genuinely unified, fresh, and permission-" +
            "safe.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Shortfall where fragmentation, index staleness, or missing " +
              "security-trimming leave findability unimproved despite the tool",
            label: "planning-range",
          },
        },
        {
          factor: "Recovered-time conversion / attribution uncertainty",
          rationale:
            "Time saved per search or contact is real but diffuse; it only " +
            "becomes value if reinvested or cashed out, and time-to-find / " +
            "deflection move for many reasons at once — so without a baseline " +
            "and a reinvestment path, KM is credited for savings it cannot " +
            "substantiate.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Counterfactual and conversion gap between modeled time savings " +
              "and value actually reinvested or removed from cost",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Time-to-find / knowledge-search-time reduction",
          range: {
            low: 0.15,
            high: 0.5,
            basis:
              "Reported reduction in time spent searching for and recreating " +
              "knowledge once a fresh, findable, permission-safe estate is in place",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_to_find_answer translated to recovered " +
            "knowledge-worker / agent time, net of conversion haircuts",
        },
        {
          lever: "Support self-service deflection (net of abandonment)",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reported genuine deflection uplift once content covers top intents " +
              "and findability is real — measured NET of abandonment and re-contact",
            label: "planning-range",
          },
          measuredAs:
            "Increase in self_service_deflection_rate qualified by " +
            "findability_satisfaction and re-contact — never gross deflection",
        },
        {
          lever: "Onboarding / knowledge-ramp compression",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reported reduction in time-to-productivity attributable to strong, " +
              "findable, current knowledge and guided self-serve paths",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_to_onboard_new_hire attributable to " +
            "knowledge access and findability",
        },
        {
          lever: "RAG/AI answer value enabled by a trustworthy corpus (multiplier)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Attributed to enabled use cases: share of downstream RAG/AI " +
              "answer value that becomes realizable once content is fresh, " +
              "de-duplicated, owned, and permission-safe",
            label: "planning-range",
          },
          measuredAs:
            "Increment in realizable grounded-answer value attributable to " +
            "kb_freshness_rate and grounded_answer_accuracy — credited to the " +
            "use case, not the KM line",
        },
      ],
      timeToValueBand:
        "First findable, curated knowledge domain (top-intent coverage + " +
        "owners + review cycles + a unified, security-trimmed search slice): " +
        "1-3 quarters. Measurable time-to-find and net-deflection improvement on " +
        "that domain: 2-4 quarters. A governed RAG grounding layer with measured " +
        "answer accuracy: 2-4 quarters once the corpus is curated and security-" +
        "trimming is enforced. Enterprise-wide curation operating model, " +
        "embedded capture/reuse, taxonomy, and onboarding impact: 12-30 months, " +
        "sequenced by highest-volume intents and highest-AI-dependency domains " +
        "first.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Knowledge base / service knowledge management",
          role:
            "Authoritative store for support and IT/HR knowledge articles — " +
            "authoring, lifecycle, reuse linkage, and self-service publishing.",
          examples: [
            "ServiceNow Knowledge Management",
            "Zendesk Guide",
            "Salesforce Knowledge",
            "Guru",
          ],
        },
        {
          name: "Collaboration / wiki & document content",
          role:
            "Where most unstructured enterprise knowledge actually lives — " +
            "wikis, team sites, documents, and pages, often fragmented across " +
            "many spaces.",
          examples: [
            "Confluence",
            "Microsoft SharePoint",
            "Microsoft 365 / OneDrive",
            "Google Workspace",
            "Notion",
          ],
        },
        {
          name: "Enterprise search & retrieval",
          role:
            "Unified/federated indexing, ranking, security-trimming, and " +
            "retrieval across the content silos — the findability layer.",
          examples: [
            "Glean",
            "Elastic / Elasticsearch",
            "Microsoft Search / Copilot retrieval",
            "Coveo",
            "Algolia",
          ],
        },
        {
          name: "RAG / grounding & vector infrastructure",
          role:
            "Retrieval-augmented grounding over the corpus — embeddings, vector " +
            "/ hybrid retrieval, citation, and grounded-answer evaluation.",
          examples: [
            "Vector stores / hybrid search",
            "Azure AI Search",
            "Enterprise RAG / grounding platforms",
            "Copilot/assistant grounding connectors",
          ],
        },
        {
          name: "Taxonomy / metadata & content-analytics tooling",
          role:
            "Controlled vocabulary, taxonomy/ontology, auto-classification, and " +
            "content/search analytics for curation and findability.",
          examples: [
            "Taxonomy / ontology management tools",
            "Auto-classification / metadata tagging tools",
            "Search & content analytics dashboards",
          ],
        },
      ],
      roles: [
        {
          title: "Head of Knowledge Management / Chief Knowledge Officer",
          accountability:
            "The KM strategy and operating model — whether KM is a curated, " +
            "incentivized, findability-driven capability or a content graveyard " +
            "behind a flattering deflection number.",
        },
        {
          title: "Knowledge Manager",
          accountability:
            "Content lifecycle governance — ownership assignment, review " +
            "cycles, retirement of stale/duplicate content, freshness and " +
            "quality measurement; the role where curation discipline lives.",
        },
        {
          title: "Enterprise Search / Findability Lead",
          accountability:
            "Search relevance, index freshness and coverage, security-trimming, " +
            "and search-success analytics across the content silos.",
        },
        {
          title: "Taxonomist / Information Architect",
          accountability:
            "The controlled vocabulary, taxonomy/ontology, synonyms, and " +
            "metadata standard, and their consistent application across silos.",
        },
        {
          title: "Subject-Matter Experts & Content Owners",
          accountability:
            "Accuracy and currency of the knowledge in their domain — " +
            "contributing, validating, and reviewing the articles they own.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Records management & retention obligations",
          relevance:
            "Knowledge content can fall under records-retention and disposition " +
            "rules — what must be kept, for how long, and defensibly destroyed — " +
            "so content lifecycle and retirement intersect with records " +
            "compliance, not just hygiene.",
        },
        {
          name: "Access control / least-privilege & security-trimming",
          relevance:
            "Content access must reflect least-privilege, and search/RAG " +
            "retrieval must enforce those permissions (security-trimming) — " +
            "under enterprise AI, oversharing in retrieval becomes a data-" +
            "exposure incident, making access-control a first-class KM control.",
        },
        {
          name: "Data privacy in content (GDPR/CCPA)",
          relevance:
            "Knowledge and documents can contain personal data, triggering " +
            "classification, minimization, retention, and subject-rights duties " +
            "— and constraining what a RAG assistant may retrieve, summarize, or " +
            "expose.",
        },
        {
          name: "IP / confidentiality & sensitive-content handling",
          relevance:
            "Knowledge often carries IP, trade-secret, and confidentiality " +
            "classifications; capture, search, and grounding must respect " +
            "sensitivity labels and avoid leaking proprietary content into " +
            "answers or external models.",
        },
      ],
      canonicalTerms: [
        {
          term: "Findability",
          definition:
            "The ease and reliability with which a user can locate the correct, " +
            "current knowledge they need — the true outcome KM and enterprise " +
            "search exist to deliver, distinct from raw content volume.",
        },
        {
          term: "Content rot / staleness",
          definition:
            "The accumulation of out-of-date, superseded, duplicated, and " +
            "contradictory content past its review cycle — the decay that " +
            "erodes trust, degrades search, and, under RAG, produces confident " +
            "wrong answers.",
        },
        {
          term: "Deflection",
          definition:
            "The share of support contacts resolved by self-service knowledge " +
            "without a human agent — a real ROI lever that flatters KM unless " +
            "netted for abandonment and read with findability satisfaction.",
        },
        {
          term: "RAG (retrieval-augmented generation) / grounding",
          definition:
            "Answering a question by retrieving relevant, permitted content from " +
            "the knowledge corpus and having an LLM synthesize a cited answer — " +
            "its accuracy gated by corpus freshness, coverage, de-duplication, " +
            "and permission enforcement.",
        },
        {
          term: "Security-trimming",
          definition:
            "Filtering search and retrieval results so each user sees only " +
            "content their permissions allow — the access-control discipline " +
            "that turns retrieval oversharing from a ranking nuisance into a " +
            "prevented data-exposure incident.",
        },
        {
          term: "Taxonomy / ontology & controlled vocabulary",
          definition:
            "The maintained organizing structures — categories, relationships, " +
            "and an approved term/synonym set — that ground consistent tagging, " +
            "navigation, and retrieval so the same topic is found the same way " +
            "everywhere.",
        },
        {
          term: "Knowledge-Centered Service (KCS)",
          definition:
            "An operating model that embeds knowledge capture and reuse in the " +
            "support workflow (resolve-and-capture, link-and-reuse), making " +
            "contribution part of the work rather than extra effort.",
        },
        {
          term: "Communities of practice",
          definition:
            "Networks of practitioners who share, validate, and grow tacit " +
            "knowledge — the human layer that captures expertise that never " +
            "lands cleanly in an article.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Findability & search effectiveness",
        authoritativeSource:
          "Enterprise-search / knowledge-base query analytics and findability / " +
          "task-success studies",
        whatGoodEvidenceLooksLike:
          "Time-to-find, search success and zero-result rates, refinement and " +
          "abandon rates, and task-success data measured on real queries across " +
          "the actual estate — with security-trimming and index freshness " +
          "confirmed.",
        weakEvidenceToReject:
          "A vendor 'our search is 90% relevant' default, an offline relevance " +
          "score with no real-query success, or a search claim over an estate " +
          "that is still fragmented, stale, or not permission-trimmed.",
      },
      {
        claim: "Content health & curation discipline",
        authoritativeSource:
          "Content lifecycle reporting (freshness, review-due, owner + " +
          "review-date coverage, duplicate/stale detection) and contribution " +
          "telemetry",
        whatGoodEvidenceLooksLike:
          "Freshness rate, % content with owner + review date, duplicate/stale " +
          "rate, and active-contributor share over the active corpus — evidence " +
          "of running review cycles and actual retirement, not a one-time " +
          "cleanup.",
        weakEvidenceToReject:
          "A raw article count presented as health, a 'we have a knowledge base' " +
          "assertion with no freshness, ownership, or retirement data, or " +
          "contribution credited to a one-time migration.",
      },
      {
        claim: "Self-service deflection & knowledge ROI",
        authoritativeSource:
          "Deflection analytics joined to CSAT/findability satisfaction, " +
          "self-service abandonment, and re-contact for the same intents",
        whatGoodEvidenceLooksLike:
          "Deflection NET of abandonment and re-contact, qualified by " +
          "findability satisfaction and answer accuracy, with time-to-find and " +
          "onboarding-ramp deltas traced to a baseline.",
        weakEvidenceToReject:
          "A gross deflection rate reported alone as success, with no " +
          "satisfaction, abandonment, or re-contact behind it — deflection " +
          "theater.",
      },
      {
        claim: "Grounded / RAG answer quality and permission safety",
        authoritativeSource:
          "A graded grounded-answer evaluation harness (accuracy, citation, " +
          "freshness) plus retrieval permission-enforcement audit",
        whatGoodEvidenceLooksLike:
          "Answer accuracy against a graded set with citations to current, " +
          "permitted sources, freshness checks, and evidence retrieval enforces " +
          "each user's permissions (security-trimmed) — accuracy attributed to " +
          "corpus curation, not just the model.",
        weakEvidenceToReject:
          "A 'the AI answers our questions' demo with no graded evaluation, no " +
          "citation/freshness check, and no audit that retrieval honors source " +
          "permissions.",
      },
      {
        claim: "Time / value recovered from improved knowledge",
        authoritativeSource:
          "A bottom-up model of time-to-find reduction and net deflection " +
          "anchored to baselines, reconciled with operations/enablement and " +
          "Finance",
        whatGoodEvidenceLooksLike:
          "Recovered knowledge-worker/agent time and net deflection built from " +
          "measured baselines, with explicit haircuts for curation discipline, " +
          "deflection overstatement, fragmentation, and conversion — and a " +
          "reinvestment path.",
        weakEvidenceToReject:
          "A headline 'knowledge workers waste X% of the day searching' figure " +
          "applied top-down × headcount × rate with no tenant baseline, no " +
          "haircuts, and no reinvestment evidence.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your active content has a named owner and a review date, what share is past its review cycle, and who is accountable for retiring stale and duplicate content?",
      "Who actually contributes knowledge, is capture embedded in the workflow (resolve-and-capture) or bolted on as extra work, and what incentive makes contributing worth it?",
      "Across how many silos is your knowledge scattered, is search security-trimmed to each user's real permissions, and how fresh is the index?",
      "For the content your RAG/AI answers over, is it current, de-duplicated, owned, and permission-enforced in retrieval — and is grounded-answer accuracy measured against a graded set?",
      "Behind your self-service deflection rate, what are findability satisfaction, self-service abandonment, and the re-contact rate for the same intents — genuine self-service or users giving up?",
      "What is your time-to-find for a real question, your search success / zero-result rate, and your coverage of the top recurring intents?",
      "Is your knowledge organized under a maintained taxonomy with controlled vocabulary and synonyms, or has tagging drifted so the same topic is filed differently across systems?",
    ],
    maturitySignals: [
      "Active content carries named owners and review dates, review cycles run on cadence, and stale/duplicate content is actively retired — freshness and duplicate/stale rate are measured.",
      "Knowledge capture and reuse are embedded in the workflow and contribution is incentivized, so coverage of top intents stays current and reuse is high.",
      "Search is unified across silos, fresh, and security-trimmed to real permissions, tuned from query-success analytics — findability satisfaction is measured, not assumed.",
      "RAG/grounded answers run over a curated, permission-enforced corpus with citations and a graded accuracy evaluation; deflection is read NET of abandonment and with satisfaction.",
      "A maintained taxonomy / controlled vocabulary grounds both navigation and retrieval, and KM value is measured against time-to-find, net deflection, and onboarding — not raw article counts.",
    ],
    redFlags: [
      "Stale content outweighs fresh — low freshness rate, a large past-review-due and duplicate/stale long-tail, unowned articles, and falling article helpfulness; curation discipline is absent.",
      "Contribution depends on a tiny volunteer minority with no incentive or embedded capture — the corpus has stopped growing and coverage of new intents lags.",
      "A new search box was bought over a still-fragmented, stale, permission-blind estate — high zero-result rates persist and users default to colleagues over search.",
      "RAG/AI was put over the existing corpus and now answers confidently from stale, contradictory, or permission-leaking content, with no graded evaluation and a model-tuning reflex.",
      "A high deflection rate is reported alone as success, with low findability satisfaction, high abandonment, and recurring re-contact behind it — deflection theater.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Service knowledge-management platforms (ServiceNow KM, Zendesk Guide, Salesforce Knowledge, Guru)",
        category: "Support/IT/HR knowledge authoring, lifecycle, reuse, and self-service",
        switchingCost:
          "Moderate-to-high — fused to the support/ITSM/CRM platform, with accumulated articles, reuse linkage, workflows, and lifecycle metadata; migration is a content-and-workflow program, not a swap.",
        renewalDynamics:
          "Often bundled with the broader service/ITSM/CRM subscription; the lever is tying value to curated coverage, freshness, and net deflection — not article count — and pressure-testing standalone KM against the platform-native module.",
      },
      {
        vendorName: "Collaboration / wiki platforms (Confluence, SharePoint/M365, Google Workspace, Notion)",
        category: "General unstructured knowledge — wikis, sites, documents, pages",
        switchingCost:
          "Very high — most enterprise knowledge lives here, fused to identity, permissions, and daily work; replatforming is a multi-year content migration rarely undertaken, so the estate is a given to govern, not switch.",
        renewalDynamics:
          "Enterprise/suite agreements (often with the productivity suite); the practical work is governing and de-fragmenting the estate you have, and negotiating search/AI add-ons (e.g. Copilot) against measured findability impact.",
      },
      {
        vendorName: "Enterprise search & findability platforms (Glean, Elastic, Coveo, Microsoft Search, Algolia)",
        category: "Unified/federated indexing, ranking, security-trimming, and search analytics",
        switchingCost:
          "Moderate — connectors, relevance tuning, and security-trimming integrations embed, but the search layer is more swappable than the content estate; platform-native search (Microsoft/Copilot) pressures standalone tools.",
        renewalDynamics:
          "Per-user or per-document/index pricing; tie renewal to measured search success, zero-result reduction, and findability satisfaction — and weigh standalone best-of-breed against platform-native search displacement.",
      },
      {
        vendorName: "RAG / grounding & vector infrastructure (Azure AI Search, vector stores, enterprise RAG platforms)",
        category: "Embeddings, retrieval, grounding, citation, and grounded-answer evaluation",
        switchingCost:
          "Low-to-moderate — the retrieval/grounding layer is increasingly portable and standardizing; real stickiness is in connectors, evaluation harnesses, and permission-enforcement integration, not the vector store itself.",
        renewalDynamics:
          "Fast-moving, consumption-priced, and converging with search and the LLM stack; favor portability, permission-enforcement and code/content-confidentiality terms, and outcome (answer-accuracy) gating over multi-year lock-in.",
      },
      {
        vendorName: "Taxonomy / metadata & content-analytics tooling",
        category: "Controlled vocabulary, auto-classification, tagging, and content/search analytics",
        switchingCost:
          "Low-to-moderate — taxonomies and rules are partly portable but accumulated models and integrations embed; often subsumed by the catalog/search/platform native capabilities.",
        renewalDynamics:
          "Smaller, often-bundled spend; negotiate against native classification in the search/collaboration platform and tie value to measured findability and curation improvement.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the collaboration/content estate (SharePoint/M365, Confluence) where the knowledge actually lives — effectively a given to govern, not switch — and, secondarily, the service KM platform. The negotiable frontier is the search, RAG/grounding, taxonomy, and analytics layers on top, which are more portable. The strategic risk is platform-native bundling: the productivity-suite vendor's own search and AI grounding (e.g. Microsoft Copilot over M365) absorbing standalone search, RAG, and taxonomy tools and eroding best-of-breed leverage.",
    negotiationLevers: [
      "Tie KM/search renewals to measured curated coverage, freshness, search success, and NET deflection — never raw article count or seats provisioned",
      "Right-size search/RAG seats and document/index volume to active findability use, not blanket headcount or whole-estate indexing",
      "Discipline standalone search, RAG, and taxonomy pricing against platform-native capabilities (Microsoft Copilot/Search, suite-native) you already pay for",
      "Permission-enforcement, content-confidentiality, and no-training-on-content terms with audit and exit rights for any RAG/grounding over proprietary knowledge",
      "Pilot-to-scale gating with a defined findability / grounded-answer-accuracy graduation metric before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      findability_search_claim: [
        "real-query search analytics (success, zero-result, refinement, abandon)",
        "time-to-find / task-success measurement on the actual estate",
        "confirmation of index freshness and security-trimming",
      ],
      content_health_claim: [
        "freshness rate and % content with owner + review date",
        "duplicate/stale rate and evidence of running review cycles and retirement",
        "active-contributor share (not a one-time migration)",
      ],
      deflection_value_claim: [
        "deflection NET of abandonment and re-contact",
        "findability satisfaction / CSAT alongside deflection",
        "answer accuracy or task-success behind the deflection figure",
      ],
      rag_grounding_claim: [
        "graded grounded-answer accuracy with citations to current, permitted sources",
        "freshness and de-duplication state of the grounded corpus",
        "retrieval permission-enforcement (security-trimming) audit",
      ],
      value_projection: [
        "bottom-up time-to-find / net-deflection model anchored to baselines",
        "benchmark planning-range",
        "explicit haircut factors (curation discipline, deflection overstatement, fragmentation/freshness/permissions, conversion/attribution)",
        "enablement value attributed to enabled use cases, not the KM line",
      ],
    },
    citationStandard:
      "Findability and content claims cite the search/knowledge-platform " +
      "analytics or lifecycle reporting and the period, scoped to the actual " +
      "estate, and confirm index freshness and security-trimming. Deflection is " +
      "cited NET of abandonment and re-contact and ALWAYS reported alongside " +
      "findability satisfaction — never gross deflection alone. RAG/grounded-" +
      "answer claims cite a graded accuracy evaluation with citations to " +
      "current, permitted sources and a permission-enforcement audit, never a " +
      "demo. Value is sized BOTTOM-UP from time-to-find and net-deflection " +
      "baselines with a labelled planning range, the haircuts applied " +
      "(especially curation discipline and deflection overstatement), and " +
      "enablement value attributed to the enabled use case — never a standalone " +
      "'KM delivers X ROI' or a top-down 'workers waste X% of the day' headline.",
  },

  hedgeRules: {
    whenToHedge: [
      "Value is sized on a fresh, findable corpus with no evidence that ownership, review cycles, retirement, and incentivized contribution are actually running — flag curation discipline as the binding constraint and discount accordingly.",
      "A self-service deflection rate is quoted without abandonment, re-contact, or findability satisfaction — distinguish gross deflection from net genuine self-service and avoid booking deflection theater.",
      "Search or RAG impact is claimed over an estate that is still fragmented, stale, or not security-trimmed — hedge any findability gain until the index is unified, fresh, and permission-enforced.",
      "RAG/grounded-answer quality is asserted from a demo with no graded evaluation, citation, or permission audit — mark accuracy as unproven and gated by corpus curation, not the model.",
      "A time-saving or headcount figure is requested from a 'workers waste X% of the day searching' headline — model recovered time as a planning range, hedge conversion to cost as a leadership decision.",
    ],
    inferenceLanguage: [
      "Across enterprise knowledge estates at this scale, the binding constraint is typically content rot and unincentivized contribution, not the search tool...",
      "Without your search and lifecycle analytics, the industry pattern is that findability is gated by fragmentation, freshness, and permissions far more than ranking...",
      "Peer programs commonly find a large share of reported deflection is abandonment once netted for re-contact and satisfaction...",
      "Treating time-to-find savings as a planning range pending a bottom-up, baseline-anchored model rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or time-saving for this tenant absent a bottom-up, baseline-anchored time-to-find / net-deflection model",
      "This tenant's actual time-to-find, search success rate, freshness rate, deflection, or grounded-answer accuracy",
      "A claim that the knowledge estate is 'findable' or 'curated' without freshness, ownership, review-cycle, and security-trimming evidence",
      "A claim that RAG/AI answers are accurate and safe without a graded evaluation set and a retrieval permission-enforcement audit",
      "A self-service deflection figure presented as success without abandonment, re-contact, and findability-satisfaction context",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "KM value story / recovered time + net deflection net of haircuts",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross time-to-find and deflection opportunity to net realizable value, subtracting the curation-discipline, deflection-overstatement, fragmentation/freshness/permissions, and conversion/attribution haircuts.",
    },
    {
      questionPattern:
        "content health / freshness, ownership, duplicate-stale by domain",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap knowledge domains against freshness rate, % with owner + review date, duplicate/stale rate, and coverage of top intents to expose where content rot bites — not a single corpus average.",
    },
    {
      questionPattern:
        "findability vs deflection / is deflection genuine or theater",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Bar deflection against findability satisfaction, self-service abandonment, and re-contact side-by-side so deflection is never read alone — the honesty check on deflection theater.",
    },
    {
      questionPattern:
        "search & findability trend over time / where curation moved the curve",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend time-to-find, search success / zero-result rate, and freshness together to show findability improving as curation discipline takes hold (or not).",
    },
    {
      questionPattern:
        "value sensitivity / which KM haircut bites hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of curation discipline, deflection overstatement, fragmentation/freshness/permissions, and conversion/attribution on realized value.",
    },
    {
      questionPattern:
        "knowledge management & findability KPI scorecard",
      exhibitKind: "table",
      note: "Time-to-find, search success / zero-result, deflection (net), freshness, top-intent coverage, reuse, contribution, % content with owner + review date, grounded-answer accuracy, duplicate/stale rate, findability satisfaction, onboarding ramp vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Content lifecycle is governed — named owners, review cycles, and active retirement keep freshness high and the duplicate/stale burden low",
      "Contribution is incentivized and capture is embedded in the workflow (resolve-and-capture), so coverage of top intents stays current",
      "Search is unified across silos, fresh, and security-trimmed to real permissions, and findability is measured against time-to-find and search success",
      "RAG/grounding runs over a curated, permission-enforced corpus with citations and a graded accuracy evaluation — built on curation, not as a substitute",
      "Value is measured against time-to-find, NET deflection, reuse, and onboarding — never raw article counts or gross deflection",
    ],
    failureDrivers: [
      "Content rots — contribution unincentivized, articles unowned and never reviewed or retired — so stale outweighs fresh and trust collapses",
      "A new search box is bought over a fragmented, stale, permission-blind estate, so findability does not actually improve and the tool is blamed",
      "RAG is put over an uncurated corpus and answers confidently from garbage, with no graded evaluation and a model-tuning reflex instead of curation",
      "Deflection is chased and reported gross as success while findability satisfaction is poor and users abandon and re-contact — deflection theater",
      "Permissions are inconsistent and retrieval is not security-trimmed, turning oversharing into a confident data-exposure incident under AI",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption follows trust, and trust follows findability that visibly " +
      "works. A first curated, findable domain — top-intent coverage, owners " +
      "and review cycles, unified and security-trimmed search, and accurate " +
      "grounded answers — proves value to the support agents and employees who " +
      "consume it; they stop routing around the knowledge base and recreating " +
      "answers, which pulls adjacent domains in. RAG/AI demand is the " +
      "accelerant: it makes content quality and permissions board-visible and " +
      "creates pull for curation that volunteer KM never generated. The slow, " +
      "decisive unlock is curation discipline and incentivized contribution — " +
      "until ownership, review cycles, retirement, and embedded capture are " +
      "real, the platform is bought but the corpus rots. Knowledge managers and " +
      "power-contributors move first; broad employee, support, and AI-agent " +
      "consumption are the lagging, value-defining waves.",
    roiClarity: "medium",
    roiClarityBasis:
      "The direct-efficiency slice — time-to-find reduction, net self-service " +
      "deflection, and onboarding-ramp compression — is measurable once " +
      "baselines exist (search analytics, deflection netted for abandonment, " +
      "ramp tracking), so that ROI is reasonably firm. But it is only MEDIUM, " +
      "not high: deflection is the most flattering and most gamed KM metric and " +
      "must be netted hard for abandonment and re-contact; time-to-find savings " +
      "are diffuse and only become value if reinvested or cashed out; and " +
      "gains are confounded by concurrent process and tooling changes without a " +
      "clean baseline. The larger enablement value — reliable RAG/AI answers " +
      "and better decisions on a trustworthy corpus — is real but soft and is " +
      "attributed to the use cases it enables, gated by the curation-discipline " +
      "binding constraint. That is why the evidence and hedge rules force " +
      "bottom-up, baseline-anchored sizing, net deflection, graded grounded-" +
      "answer accuracy, and hard discounts for content rot and deflection " +
      "overstatement.",
  },

  regulatoryFrame: {
    name: "Knowledge content governance: records retention, access-control/least-privilege, privacy & IP",
    relevance:
      "The dominant cross-cutting frame for unstructured knowledge and " +
      "findability: knowledge content can fall under records-retention and " +
      "defensible-disposition rules; content access and search/RAG retrieval " +
      "must enforce least-privilege via security-trimming — and under " +
      "enterprise AI, retrieval oversharing becomes a data-exposure incident, " +
      "not a ranking nuisance; documents carry personal data (GDPR/CCPA) and " +
      "IP/confidentiality classifications that constrain capture, search, " +
      "grounding, and what may be exposed to or trained by external models " +
      "(see vocabulary.regulatoryFrames) — making retention, access-control, " +
      "privacy, and IP first-class KM controls, not optional hygiene.",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
