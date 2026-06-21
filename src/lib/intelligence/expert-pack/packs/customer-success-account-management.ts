// Consilium expert — Customer Success & Account Management (cross-cutting).
//
// W3 (wave 3) draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// A cross-cutting, post-sale expert spanning the recurring-revenue customer
// lifecycle: onboarding & time-to-value, adoption, health scoring, renewals,
// churn prevention, expansion / upsell (NRR), the success-plan / QBR motion, and
// CS operations + tooling. Cross-industry — the same CS-platform + CRM +
// usage-telemetry spine recurs in B2B SaaS, fintech, healthtech, industrial
// subscription, and managed-service businesses.
//
// Honesty posture: NRR is the metric that compounds enterprise value, but the
// pack is blunt about four truths. (1) Most CS orgs are REACTIVE firefighting
// dressed up as "proactive" — they touch accounts when the renewal looms or a
// fire starts, not on a leading-indicator cadence. (2) Health scores are
// usually VANITY — hand-weighted gut-feel with no predictive validation against
// actual churn/renewal outcomes — until they are tied to real usage + outcome
// data and backtested. (3) The "CS owns the renewal" vs sales tension is
// STRUCTURAL, not a process bug: incentives, comp, and account ownership pull in
// different directions and no tool fixes that. (4) Time-to-first-value in
// onboarding is the leading indicator everyone underinvests in, and CS-led
// expansion ROI is real but GATED by clean usage/entitlement data. Excludes the
// new-logo pipeline (sales-revenue-operations), the support contact center
// (contact-center-cx), and field service delivery / dispatch
// (field-customer-service) — those route to other experts.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const customerSuccessAccountManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.customer-success",
    expertName: "Customer Success & Account Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "customer-success",
    scopeNote:
      "AI across the post-sale, recurring-revenue customer lifecycle: " +
      "onboarding & time-to-value, product adoption, customer health scoring, " +
      "renewals, churn prevention, expansion / upsell (net revenue retention), " +
      "the success-plan / QBR motion, and CS operations + tooling. Covers the " +
      "trade-offs across retention (GRR), expansion (NRR), onboarding velocity, " +
      "adoption depth, and CSM capacity — and is candid that most CS orgs are " +
      "reactive firefighting, that health scores are vanity until validated " +
      "against real outcomes, that the 'CS owns the renewal' vs sales tension is " +
      "structural, and that CS-led expansion ROI is gated by clean usage and " +
      "entitlement data. Cross-industry (B2B SaaS, fintech, healthtech, " +
      "industrial subscription, managed services). Excludes the new-logo " +
      "pipeline (sales operations), the support contact center, and field " +
      "service delivery / dispatch — those route to other experts.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "net_revenue_retention",
        name: "Net revenue retention (NRR)",
        definition:
          "Recurring revenue from a cohort of existing customers at period end " +
          "versus its value at period start, including expansion and net of " +
          "downgrade/contraction and churn — above 100% means the installed base " +
          "grows on its own before any new logo.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 100,
          high: 120,
          basis:
            "B2B SaaS NRR benchmark ranges; best-in-class clears 120%+, healthy " +
            "sits above 100%, and below 100% means the base leaks faster than it " +
            "expands — the single metric that compounds enterprise value",
          label: "planning-range",
        },
        dataSource:
          "Recurring-revenue / billing ledger tracking expansion, contraction, " +
          "and churn by cohort, joined to the CRM/CS platform",
        whyItMatters:
          "The compounding engine of durable revenue and the cheapest growth " +
          "there is — a few points of NRR dwarf most new-logo effort in valuation " +
          "terms. But it is a lagging composite: it only tells you what happened, " +
          "so it must be decomposed into GRR, expansion, and contraction to be " +
          "actionable rather than a vanity headline.",
      },
      {
        key: "gross_revenue_retention",
        name: "Gross revenue retention (GRR)",
        definition:
          "Recurring revenue retained from an existing cohort at period end as a " +
          "share of its starting value, counting only churn and contraction and " +
          "EXCLUDING any expansion — it can never exceed 100%.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 95,
          basis:
            "B2B retention benchmark ranges; healthy GRR sits in the high 80s to " +
            "mid 90s, and a strong NRR riding on a weak GRR signals leaky " +
            "retention masked by a few large expansions",
          label: "planning-range",
        },
        dataSource:
          "Recurring-revenue ledger by cohort, isolating churn and contraction " +
          "from expansion",
        whyItMatters:
          "The honest floor under NRR — it strips out expansion to show how much " +
          "of the base is genuinely leaking. A great NRR carried by a handful of " +
          "expansions can hide a GRR problem that breaks the moment expansion " +
          "stalls; GRR is the retention truth a board should read first.",
      },
      {
        key: "logo_churn_rate",
        name: "Logo churn rate",
        definition:
          "Share of customer accounts (logos, not dollars) lost in the period " +
          "out of the count at period start — the count-based complement to " +
          "dollar retention.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 15,
          basis:
            "Annual B2B logo-churn ranges vary sharply by segment; enterprise " +
            "books churn in low single digits while SMB/self-serve books run " +
            "well into double digits",
          label: "planning-range",
        },
        dataSource:
          "CRM / CS platform account status changes joined to billing " +
          "cancellation events, by segment and cohort",
        whyItMatters:
          "Exposes the shape of churn that dollar retention hides — losing many " +
          "small logos while a few large ones expand can flatter NRR while the " +
          "base hollows out, raising acquisition pressure and concentration risk. " +
          "Logo and dollar churn must be read together.",
      },
      {
        key: "time_to_first_value",
        name: "Time-to-first-value (onboarding)",
        definition:
          "Median elapsed time from contract start (or kickoff) to the customer " +
          "reaching the first defined value milestone — go-live, first " +
          "meaningful use, or the activation event that predicts retention.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 14,
          high: 90,
          basis:
            "Onboarding-velocity ranges by product complexity; lightweight " +
            "products activate in weeks, complex enterprise implementations run " +
            "1-3+ months — the band reflects the common mid-market range",
          label: "planning-range",
        },
        dataSource:
          "Onboarding/implementation milestone tracking in the CS platform or " +
          "project tool, joined to product activation telemetry",
        whyItMatters:
          "The leading indicator everyone underinvests in — a customer who never " +
          "reaches first value is a churn statistic months before the renewal. " +
          "Time-to-value is the earliest, most controllable lever on retention, " +
          "yet it is routinely treated as an implementation cost center rather " +
          "than the front of the retention funnel.",
      },
      {
        key: "product_adoption_rate",
        name: "Product adoption / active-usage rate",
        definition:
          "Share of licensed/entitled users (or accounts) actively using the " +
          "product on a defined cadence and depth — distinct from logged-in-once, " +
          "measured against the usage that actually predicts value realization.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 70,
          basis:
            "Active-usage-of-entitlement ranges from adoption studies; many " +
            "accounts sit below the depth that predicts renewal, and shelfware " +
            "seats are a silent churn precursor",
          label: "planning-range",
        },
        dataSource:
          "Product usage telemetry / analytics joined to entitlement and seat " +
          "data in the billing and CS platform",
        whyItMatters:
          "The clearest causal antecedent of retention and the raw material for " +
          "any credible health score — value realized rides on real usage, not " +
          "seats sold. Low adoption against entitlement is the leading signal of " +
          "both churn risk and a stalled expansion opportunity.",
      },
      {
        key: "health_score_coverage_accuracy",
        name: "Customer health-score coverage & predictive accuracy",
        definition:
          "Share of the recurring-revenue base carrying a current health score, " +
          "and how well that score predicts the next-period renewal/churn outcome " +
          "(e.g. measured as the lift of red-flagged accounts' actual churn over " +
          "the base rate) — coverage and validated accuracy together.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Coverage ranges widely and validated predictive accuracy is rarely " +
            "measured at all; the band reflects coverage of the actively-managed " +
            "book, with predictive validation the exception not the norm",
          label: "planning-range",
        },
        dataSource:
          "CS platform health-score records joined retrospectively to actual " +
          "renewal/churn outcomes for backtesting",
        whyItMatters:
          "The metric that exposes whether health scoring is real or vanity. A " +
          "score with high coverage but no backtest against actual outcomes is " +
          "decoration; the value is only there when red flags actually predict " +
          "churn at a rate that justifies acting on them. Most orgs measure " +
          "coverage and never measure accuracy.",
      },
      {
        key: "expansion_rate",
        name: "Expansion / upsell rate",
        definition:
          "Incremental recurring revenue from the existing base (upsell, " +
          "cross-sell, seat/usage growth) in the period as a share of starting " +
          "recurring revenue — the positive component inside NRR.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 8,
          high: 25,
          basis:
            "Expansion-as-a-share-of-base ranges from B2B benchmarks; usage- and " +
            "seat-based models with strong adoption expand fastest, flat-fee " +
            "models far less",
          label: "planning-range",
        },
        dataSource:
          "Recurring-revenue ledger isolating expansion bookings by account, " +
          "joined to usage and entitlement data",
        whyItMatters:
          "The growth half of NRR and where CS-led expansion ROI is real — but " +
          "it is gated by clean usage and entitlement data, because a credible " +
          "expansion play needs to know what a customer already owns and actually " +
          "uses. Without that, expansion is guesswork that erodes trust.",
      },
      {
        key: "renewal_rate",
        name: "Renewal rate",
        definition:
          "Share of contracts (or contract value) up for renewal in the period " +
          "that actually renew, measured on the renewal-eligible cohort rather " +
          "than the whole base.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "Renewal-of-eligible-cohort ranges; healthy books renew the large " +
            "majority by value, and a gap between dollar and logo renewal flags " +
            "small-account leakage",
          label: "planning-range",
        },
        dataSource:
          "CRM / CS-platform renewal opportunity records joined to billing " +
          "renewal events, on the renewal-eligible cohort",
        whyItMatters:
          "The renewal-moment verdict on the whole post-sale motion — but it is " +
          "a lagging confirmation of work that should have happened months " +
          "earlier. A renewal won by a last-minute discount is a retention " +
          "failure dressed as a save; renewal rate must be read against " +
          "discount-to-renew and time-to-value upstream.",
      },
      {
        key: "csm_book_of_business",
        name: "CSM book-of-business (ARR per CSM)",
        definition:
          "Recurring revenue (or account count) under management per " +
          "customer-success manager — the capacity ratio that determines how " +
          "proactive versus reactive the motion can actually be.",
        unit: "USD ARR per CSM",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 2000000,
          high: 5000000,
          basis:
            "ARR-per-CSM ranges by segment and touch model; high-touch enterprise " +
            "books run lower, tech-touch/pooled models far higher — the right " +
            "number depends on segment, not a universal target",
          label: "planning-range",
        },
        dataSource:
          "CS platform / CRM book assignments joined to ARR per account and CSM " +
          "headcount",
        whyItMatters:
          "The capacity reality that decides whether 'proactive CS' is possible " +
          "at all — an over-stuffed book forces reactive firefighting no playbook " +
          "can overcome. AI scale (digital/tech-touch, automated playbooks) earns " +
          "its keep precisely by letting a CSM cover more ARR without dropping to " +
          "pure reactivity, but only if it offloads real work.",
      },
      {
        key: "qbr_success_plan_coverage",
        name: "QBR / success-plan coverage",
        definition:
          "Share of the strategic/managed book with a current documented success " +
          "plan (mutual goals, success criteria, milestones) and an on-cadence " +
          "executive business review — the proactive-motion coverage metric.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Coverage of the managed book with a live success plan + on-cadence " +
            "QBR; many orgs claim a QBR motion but cover only a fraction of " +
            "accounts with a genuinely current plan",
          label: "planning-range",
        },
        dataSource:
          "CS platform success-plan and QBR completion records against the " +
          "managed-book account list",
        whyItMatters:
          "The clearest measure of whether CS is genuinely proactive or just " +
          "calls it that — a success plan tied to the customer's own outcomes is " +
          "the difference between an account that renews on value and one that " +
          "haggles on price. Low coverage with high claimed maturity is the " +
          "reactive-firefighting tell.",
      },
      {
        key: "time_to_resolve_escalations",
        name: "Time-to-resolve customer escalations",
        definition:
          "Median elapsed time from a customer escalation (executive complaint, " +
          "churn-risk event, critical issue) being raised to documented " +
          "resolution — the responsiveness of the save motion.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 21,
          basis:
            "Escalation-to-resolution ranges by severity and cross-functional " +
            "dependency; the band reflects common managed-account escalation " +
            "cycles, with complex multi-team issues running longer",
          label: "planning-range",
        },
        dataSource:
          "CS platform / escalation tracker case records joined to resolution " +
          "and outcome status",
        whyItMatters:
          "The honesty check on the save motion — a slow or undocumented " +
          "escalation path means churn risks fester until renewal, when it is too " +
          "late to recover. It also exposes whether CS can actually mobilize " +
          "product, support, and exec sponsorship, or just absorbs blame without " +
          "the authority to fix.",
      },
      {
        key: "nps_customer_effort",
        name: "NPS / customer-effort score",
        definition:
          "Relationship sentiment captured via Net Promoter Score and/or a " +
          "customer-effort measure on key interactions — a perception signal, " +
          "read alongside behavioral usage rather than in place of it.",
        unit: "score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "B2B relationship-NPS ranges; the band reflects healthy managed-" +
            "account relationships, with the caveat that low response rates and " +
            "selection bias make absolute NPS a weak standalone signal",
          label: "planning-range",
        },
        dataSource:
          "Survey platform (relationship/transactional NPS, CES) joined to " +
          "account and CSM in the CS platform",
        whyItMatters:
          "A useful early sentiment read and a coaching input, but a notorious " +
          "vanity trap on its own — promoters churn and detractors renew, " +
          "response rates skew the number, and a high NPS can mask a usage " +
          "collapse. It earns its place only when triangulated against adoption " +
          "and outcome data, never as the headline health proxy.",
      },
    ],

    painThemes: [
      {
        key: "reactive_firefighting",
        name: "Reactive firefighting dressed as proactive CS",
        description:
          "The org calls itself 'proactive' but actually touches accounts only " +
          "when the renewal looms or a fire breaks out — there is no " +
          "leading-indicator cadence, success plans are stale or absent, and the " +
          "team's week is consumed by escalations rather than driving adoption. " +
          "Retention then depends on heroics at renewal time instead of value " +
          "delivered months earlier.",
        detectionSignal:
          "Low success-plan/QBR coverage despite claimed maturity; activity " +
          "spikes in the 60-90 days before renewal; escalation volume dominating " +
          "CSM time; saves won by last-minute discounts rather than re-engaged " +
          "value.",
        diagnosticQuestion:
          "What share of your managed book has a current success plan and an " +
          "on-cadence QBR, and how much of your CSM activity happens in the 90 " +
          "days before renewal versus evenly across the lifecycle?",
      },
      {
        key: "vanity_health_scores",
        name: "Vanity health scores (no predictive validation)",
        description:
          "A red/yellow/green health score is hand-weighted from gut-feel inputs " +
          "and never backtested against actual churn/renewal outcomes, so it " +
          "looks rigorous but predicts nothing. CSMs learn to distrust it, " +
          "leadership reports it anyway, and real at-risk accounts sit green " +
          "while healthy ones flash red.",
        detectionSignal:
          "No backtest of score vs actual outcomes; weights set by opinion and " +
          "never revisited; churned accounts that were green the prior quarter; " +
          "CSMs overriding or ignoring the score in practice.",
        diagnosticQuestion:
          "When you look back, what share of last year's churned accounts were " +
          "flagged red in advance — and has anyone measured your health score's " +
          "predictive accuracy against actual outcomes?",
      },
      {
        key: "cs_sales_renewal_tension",
        name: "CS-vs-sales renewal-ownership tension (structural)",
        description:
          "Whether CS or sales owns the renewal and expansion is a structural " +
          "conflict — comp plans, account ownership, and quota pull in different " +
          "directions, so accounts fall between the two, expansion signals die in " +
          "the handoff, and the customer experiences competing internal agendas. " +
          "No tool fixes an incentive mismatch.",
        detectionSignal:
          "Ambiguous renewal/expansion ownership in the RACI; expansion signals " +
          "raised by CS that sales never works; renewals slipping in the handoff; " +
          "comp plans that reward the same dollar to two teams or neither.",
        diagnosticQuestion:
          "Who is comped on the renewal and on expansion, and when a CSM spots " +
          "an expansion signal, what is the exact path and ownership for turning " +
          "it into a booked deal?",
      },
      {
        key: "onboarding_underinvestment",
        name: "Onboarding / time-to-value underinvestment",
        description:
          "Onboarding is treated as a cost center to be minimized rather than the " +
          "front of the retention funnel, so customers stall before first value, " +
          "implementations drag, and a cohort is effectively churning months " +
          "before anyone is watching. The leading indicator most predictive of " +
          "retention is the one least resourced.",
        detectionSignal:
          "No defined first-value milestone or measured time-to-value; high " +
          "share of accounts never reaching activation; early-life churn " +
          "concentrated in the first renewal; onboarding handoffs lost between " +
          "sales, implementation, and CS.",
        diagnosticQuestion:
          "What is your defined first-value milestone, your median time-to-value " +
          "to reach it, and what share of new customers never reach it at all?",
      },
      {
        key: "dirty_usage_entitlement_data",
        name: "Dirty usage & entitlement data gating expansion",
        description:
          "Usage telemetry, seat/entitlement records, and contract terms live in " +
          "disconnected systems and disagree, so CS cannot reliably say what a " +
          "customer owns versus actually uses. Every data-dependent bet — health " +
          "scoring, churn prediction, expansion targeting — is then built on sand, " +
          "and expansion plays misfire and erode trust.",
        detectionSignal:
          "Entitlement and usage data in separate systems with no reliable join; " +
          "expansion pitches for capability the customer already owns; health " +
          "scores that can't incorporate real usage; manual reconciliation before " +
          "every QBR.",
        diagnosticQuestion:
          "Can you reliably join what each customer is entitled to with what they " +
          "actually use today, in one place — or is that reconciled by hand " +
          "before each renewal and QBR?",
      },
      {
        key: "csm_capacity_overload",
        name: "CSM capacity overload (book too big to be proactive)",
        description:
          "Books of business are stuffed beyond what allows any proactive motion, " +
          "so CSMs triage by whoever shouts loudest and the long tail goes " +
          "untouched until it churns. Leadership demands proactivity the capacity " +
          "math forbids, and 'do more with less' quietly means 'react to fires.'",
        detectionSignal:
          "ARR-per-CSM well above the segment's touch model; long-tail accounts " +
          "with no contact for months; CSMs reporting they only manage the " +
          "noisiest accounts; tech-touch tier that is really a no-touch tier.",
        diagnosticQuestion:
          "What is your ARR-per-CSM by segment, and what share of your book had " +
          "no proactive CSM touch in the last quarter?",
      },
      {
        key: "lagging_metric_blindness",
        name: "Lagging-metric blindness (NRR as a rear-view mirror)",
        description:
          "The org steers on NRR and renewal rate — both lagging composites — and " +
          "discovers problems only after the revenue has left. Without decomposing " +
          "NRR into GRR/expansion/contraction and wiring leading indicators " +
          "(time-to-value, adoption, health) to action, the team is always " +
          "reacting to outcomes it can no longer change.",
        detectionSignal:
          "NRR reported as a single headline with no GRR/expansion decomposition; " +
          "no leading indicators tied to a defined play; surprises at renewal; " +
          "post-mortems that find the warning signs were visible months earlier.",
        diagnosticQuestion:
          "Do you decompose NRR into GRR, expansion, and contraction, and which " +
          "leading indicators trigger a defined action before the renewal " +
          "conversation?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "predictive_health_churn",
        name: "Predictive customer health & churn scoring",
        valueMechanism:
          "A model learns from real usage, support, sentiment, and engagement " +
          "signals which patterns actually preceded past churn and renewal, " +
          "replacing gut-weighted health scores with a backtested, validated " +
          "signal — so CSMs act on accounts that are genuinely at risk early " +
          "enough to change the outcome, lifting retention.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Product usage telemetry joined to account and entitlement data",
          "Historical renewal / churn / contraction outcomes for training labels",
          "Support, sentiment, and engagement signals at sufficient coverage",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A score with no backtest against actual outcomes is the vanity trap automated — it must be validated for predictive accuracy, not just deployed",
          "A churn flag with no triggered human play is worthless; the value is in the action, not the prediction",
          "Models trained on which accounts CSMs historically worked reinforce attention bias, not true risk — audit for feedback loops",
        ],
        metricsMoved: [
          "health_score_coverage_accuracy",
          "gross_revenue_retention",
          "logo_churn_rate",
          "renewal_rate",
        ],
      },
      {
        key: "onboarding_acceleration",
        name: "AI-guided onboarding & time-to-value acceleration",
        valueMechanism:
          "AI sequences and personalizes the onboarding path, nudges customers " +
          "and CSMs at the right milestones, flags stalled implementations, and " +
          "surfaces the fastest route to first value — compressing time-to-value " +
          "so more of each cohort reaches activation, the strongest leading " +
          "indicator of retention.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Defined first-value milestone and onboarding milestone tracking",
          "Product activation telemetry to detect stalls and reaching value",
          "Implementation/project data and customer profile for personalization",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "An automated nudge to a stuck enterprise customer can feel tone-deaf — the CSM owns the relationship and edits high-stakes outreach",
          "Speeding onboarding by skipping configuration that drives durable value is a false win — measure to durable activation, not just go-live",
          "Personalization needs a clean customer profile; thin onboarding data produces generic guidance that underwhelms",
        ],
        metricsMoved: [
          "time_to_first_value",
          "product_adoption_rate",
          "gross_revenue_retention",
        ],
      },
      {
        key: "expansion_signal_detection",
        name: "Expansion-signal detection & next-best-action",
        valueMechanism:
          "A model reads usage depth, entitlement gaps, and engagement patterns " +
          "to flag accounts ripe for upsell/cross-sell and recommends the " +
          "specific next-best expansion play, prompting CS or sales to act with a " +
          "grounded reason — turning adoption into expansion revenue and lifting " +
          "NRR without new logos.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clean usage telemetry joined to entitlement/contract terms",
          "Historical expansion outcomes by signal for learning",
          "An owned handoff path from CS signal to a booked expansion",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Expansion ROI is gated by clean usage/entitlement data — pitching capability a customer already owns destroys trust fast",
          "The CS-vs-sales ownership tension is structural; a signal with no clear owner to action it dies in the handoff regardless of model quality",
          "Aggressive AI-driven upsell into an unhealthy account accelerates churn — gate expansion plays on health, not just opportunity",
        ],
        metricsMoved: [
          "expansion_rate",
          "net_revenue_retention",
          "product_adoption_rate",
        ],
      },
      {
        key: "csm_copilot",
        name: "CSM copilot & account-prep automation",
        valueMechanism:
          "A copilot drafts QBR decks and success-plan updates, summarizes " +
          "account history and usage trends, prepares renewal briefs, and " +
          "auto-logs touchpoints — taking prep and admin off the CSM so they can " +
          "cover a larger book proactively rather than triaging by who shouts " +
          "loudest.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "CS platform read/write for account context and activity logging",
          "Usage, support, and renewal data for briefing and summarization",
          "Email/calendar/meeting data for touchpoint capture",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "QBR and renewal materials go to the customer — the CSM is accountable and must review every AI-drafted artifact before it ships",
          "Auto-captured touchpoints must be reviewable so a bad capture doesn't corrupt the account record other AI bets depend on",
          "Position as time-back enabling proactivity, not surveillance of CSM activity, or adoption collapses",
        ],
        metricsMoved: [
          "csm_book_of_business",
          "qbr_success_plan_coverage",
          "time_to_resolve_escalations",
        ],
      },
      {
        key: "digital_tech_touch_scale",
        name: "Digital / tech-touch CS at scale",
        valueMechanism:
          "Automated, signal-triggered lifecycle journeys (in-app guidance, " +
          "milestone emails, self-serve health nudges) cover the long-tail and " +
          "lower-ARR base no human CSM can reach, so adoption and retention " +
          "improve across accounts that would otherwise go untouched until they " +
          "churn — extending proactive coverage without proportional headcount.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Usage telemetry and lifecycle-stage signals to trigger journeys",
          "Segmentation of the book into human vs digital-touch tiers",
          "In-app messaging / lifecycle-automation channel integration",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Tech-touch must not become no-touch — an automated tier with no escalation path to a human when an account turns red is abandonment",
          "Over-messaging fatigues customers and trains them to ignore the channel; cadence and relevance must be governed",
          "Digital journeys built on thin or wrong usage signals fire irrelevant nudges that erode rather than build trust",
        ],
        metricsMoved: [
          "product_adoption_rate",
          "gross_revenue_retention",
          "csm_book_of_business",
        ],
      },
      {
        key: "voice_of_customer_synthesis",
        name: "Voice-of-customer synthesis & sentiment intelligence",
        valueMechanism:
          "AI synthesizes signal from QBR notes, support tickets, survey verbatims, " +
          "and call transcripts into account-level and portfolio-level themes — " +
          "surfacing emerging churn drivers, product gaps, and at-risk sentiment " +
          "early — so CS leadership and product act on patterns instead of " +
          "discovering them at renewal.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Unstructured CS/support text (notes, tickets, verbatims, transcripts)",
          "Account and renewal linkage to tie sentiment to revenue at risk",
          "A workflow that routes synthesized themes to an owner who acts",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Recording/consent laws apply per jurisdiction to any analyzed customer calls",
          "Survey/verbatim selection bias skews synthesized sentiment — triangulate against behavioral usage, never treat NPS prose as ground truth",
          "Synthesized 'themes' are hypotheses for human validation, not proven causes of churn",
        ],
        metricsMoved: [
          "nps_customer_effort",
          "logo_churn_rate",
          "time_to_resolve_escalations",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_customer_signal_layer",
        name: "Unified customer signal layer (usage + entitlement + relationship)",
        description:
          "A governed context layer that joins product usage telemetry, " +
          "entitlement/contract terms, support, sentiment, and CRM relationship " +
          "data into one current account view — so health scoring, churn " +
          "prediction, and expansion targeting all reason over a complete, " +
          "reconciled signal instead of siloed fragments. Treated as the " +
          "prerequisite foundation because every data-dependent CS bet is capped " +
          "by it.",
        boundary:
          "Owns the joined customer-signal model and its data quality; does not " +
          "own the source systems (product analytics, billing, CRM) or the CS " +
          "workflows that consume the signal.",
        humanAccountabilityPoint:
          "Head of Customer Success Operations (CS Ops)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "validated_health_scoring",
        name: "Validated, backtested health-scoring model",
        description:
          "A health score built on the unified signal layer and continuously " +
          "backtested against actual renewal/churn outcomes — with published " +
          "predictive accuracy, explainable per-account drivers, and a retrain " +
          "cadence — so the score is a trusted trigger for action rather than a " +
          "gut-weighted vanity dashboard CSMs ignore.",
        boundary:
          "Owns the scoring model, its validation, and explainability; does not " +
          "own the underlying signal layer or the playbooks the score triggers.",
        humanAccountabilityPoint:
          "CS Operations / Customer Success Analytics Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "lifecycle_playbook_engine",
        name: "Lifecycle playbook & success-plan engine",
        description:
          "A playbook layer that ties leading indicators (time-to-value, adoption " +
          "drop, health flag, expansion signal) to defined, owned plays and " +
          "tracks success plans and QBR cadence across the book — converting " +
          "reactive firefighting into a proactive, signal-triggered motion with " +
          "explicit ownership for every play.",
        boundary:
          "Owns play definitions, success-plan structure, and cadence tracking; " +
          "does not own the relationship itself or the renewal/expansion " +
          "commercial close.",
        humanAccountabilityPoint:
          "VP Customer Success",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "tiered_touch_operating_model",
        name: "Tiered touch model (high-touch + digital/tech-touch)",
        description:
          "A segmented operating model that routes high-ARR/strategic accounts to " +
          "human-led high-touch CS and the long-tail/lower-ARR base to automated " +
          "digital journeys with a defined escalation path to a human when signals " +
          "turn red — so proactive coverage extends across the whole base within " +
          "realistic CSM capacity rather than leaving the tail untouched.",
        boundary:
          "Owns segmentation, touch-tier routing, and the escalation bridge from " +
          "digital to human; does not own the underlying scoring or the " +
          "individual account relationships.",
        humanAccountabilityPoint:
          "VP Customer Success / Chief Customer Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value compounds through NRR, but it is realized in rising " +
        "data-dependency and trust order. (1) Onboarding / time-to-value — the " +
        "earliest, most controllable lever: getting more of each cohort to first " +
        "value lifts GRR before any renewal is at stake, and it is the most " +
        "underinvested and therefore the highest-headroom move. (2) Validated " +
        "health & churn prevention — backtested scoring that triggers real plays " +
        "protects the base, but the value is fictional until the score is proven " +
        "predictive and a human actually acts on the flag. (3) Expansion / NRR " +
        "growth — the largest prize, but the most gated: it rides on clean " +
        "usage/entitlement data AND on resolving the structural CS-vs-sales " +
        "ownership tension, so it pays last and only when the foundation is in " +
        "place. (4) CSM capacity / tech-touch scale — copilots and digital " +
        "journeys let the same team cover more book proactively, multiplying the " +
        "other levers rather than standing alone. The durable program fixes the " +
        "unified signal layer first, earns trust with validated scoring and " +
        "onboarding wins, and only then leans on AI-led expansion.",
      dominantHaircutFactors: [
        {
          factor: "Usage & entitlement data quality cap",
          rationale:
            "Health scoring, churn prediction, and expansion targeting are all " +
            "capped by the ability to reliably join what a customer owns with " +
            "what they actually use; on disconnected or dirty usage/entitlement " +
            "data the bets misfire and the realizable value collapses far below " +
            "the model's theoretical lift.",
          typicalHaircut: {
            low: 0.25,
            high: 0.55,
            basis:
              "Observed gap between projected and realized CS-AI value where " +
              "usage/entitlement data could not be reliably joined",
            label: "planning-range",
          },
        },
        {
          factor: "Structural CS-vs-sales ownership friction",
          rationale:
            "Expansion and renewal value leaks where comp, ownership, and quota " +
            "pull CS and sales apart; a signal with no clear owner to action it " +
            "dies in the handoff, so projected expansion must be discounted for " +
            "the organizational friction no model resolves.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Expansion pipeline raised by CS that was never worked to close due " +
              "to ambiguous ownership and misaligned incentives",
            label: "planning-range",
          },
        },
        {
          factor: "Health-score predictive-accuracy shortfall",
          rationale:
            "Where a health score is deployed without backtesting against actual " +
            "outcomes, its red flags don't predict churn, so the modeled " +
            "retention lift never materializes — the vanity-score haircut.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Difference between assumed and validated predictive lift for " +
              "health scores not backtested against renewal/churn outcomes",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "NRR uplift (validated retention + CS-led expansion)",
          range: {
            low: 0.03,
            high: 0.1,
            basis:
              "Reported NRR-point gains from validated churn prevention and " +
              "CS-led expansion programs, net of data-quality and ownership " +
              "haircuts",
            label: "planning-range",
          },
          measuredAs: "Absolute lift in net_revenue_retention (NRR points)",
        },
        {
          lever: "Time-to-value compression (AI-guided onboarding)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Reported relative reductions in time-to-first-value from guided/" +
              "personalized onboarding programs, contingent on a defined " +
              "activation milestone",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in time_to_first_value",
        },
        {
          lever: "CSM capacity expansion (copilot + tech-touch)",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reported increase in ARR a CSM can manage proactively after admin " +
              "automation and digital-touch coverage, contingent on real work " +
              "offload",
            label: "planning-range",
          },
          measuredAs: "Relative increase in csm_book_of_business at constant proactivity",
        },
      ],
      timeToValueBand:
        "Unified signal layer + entitlement reconciliation: 1-3 quarters of " +
        "data work before downstream bets pay off. CSM copilot and AI-guided " +
        "onboarding: 1-2 quarters (overlay, fast adoption). Validated health/" +
        "churn scoring: 2-4 quarters to gather outcome labels and backtest to " +
        "trusted accuracy. Expansion and NRR effects: compound over multiple " +
        "renewal cycles, so the durable signal shows across 4+ quarters, not one.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Customer Success platform",
          role:
            "The system of record for the post-sale motion — health scores, " +
            "success plans, playbooks, renewal/expansion tracking, and the " +
            "joined customer signal CS reasons over.",
          examples: [
            "Gainsight",
            "Totango",
            "Catalyst",
            "Planhat",
            "ChurnZero",
          ],
        },
        {
          name: "CRM (customer & renewal record)",
          role:
            "The account, contact, and renewal/expansion opportunity record CS " +
            "shares with sales — the spine of the ownership handoff and the " +
            "commercial close.",
          examples: [
            "Salesforce",
            "Microsoft Dynamics 365",
            "HubSpot",
          ],
        },
        {
          name: "Product usage / analytics telemetry",
          role:
            "The behavioral truth of adoption and value realization — the raw " +
            "signal under any credible health score, churn model, or expansion " +
            "play.",
          examples: [
            "Pendo",
            "Amplitude",
            "Mixpanel",
            "Heap",
          ],
        },
        {
          name: "Billing / recurring-revenue ledger",
          role:
            "The entitlement, contract-term, and recurring-revenue record that " +
            "grounds NRR/GRR, renewal eligibility, and what a customer actually " +
            "owns.",
          examples: [
            "Zuora",
            "Stripe Billing",
            "Chargebee",
            "SAP / NetSuite subscription billing",
          ],
        },
        {
          name: "Voice-of-customer / survey & in-app messaging",
          role:
            "Relationship and transactional sentiment capture (NPS/CES) and the " +
            "digital-touch channel for automated lifecycle journeys.",
          examples: [
            "Medallia",
            "Qualtrics",
            "Delighted",
            "Pendo / Appcues (in-app)",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Customer Officer (CCO)",
          accountability:
            "The entire post-sale customer experience and the recurring-revenue " +
            "retention and expansion engine across the installed base.",
        },
        {
          title: "VP Customer Success",
          accountability:
            "NRR/GRR attainment, the CS operating model and touch tiers, CSM " +
            "capacity, and the proactive success-plan/QBR motion.",
        },
        {
          title: "Customer Success Manager (CSM)",
          accountability:
            "The health, adoption, renewal, and expansion of an assigned book of " +
            "accounts, and the success-plan/QBR relationship with each.",
        },
        {
          title: "Head of Customer Success Operations (CS Ops)",
          accountability:
            "The CS tech stack, the unified customer-signal data quality, health-" +
            "score design and validation, and segmentation/capacity modeling.",
        },
        {
          title: "Onboarding / Implementation Lead",
          accountability:
            "Time-to-first-value, the onboarding milestone path, and the handoff " +
            "from sales/implementation into ongoing CS.",
        },
        {
          title: "Renewals / Account Manager",
          accountability:
            "The renewal close and expansion bookings — the commercial counterpart " +
            "to the CSM, and the focal point of the CS-vs-sales ownership tension.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Data privacy on usage telemetry (GDPR / CCPA)",
          relevance:
            "Product usage telemetry, health scoring, and sentiment analysis " +
            "process personal and customer data and must respect lawful basis, " +
            "purpose limitation, data-subject rights, and contractual data-use " +
            "terms.",
        },
        {
          name: "Contract & renewal terms (auto-renewal / cancellation law)",
          relevance:
            "Auto-renewal, notice, and cancellation rules (e.g. consumer auto-" +
            "renewal statutes and B2B contract terms) govern how renewals and " +
            "any AI-driven renewal/retention motion must be conducted.",
        },
        {
          name: "Call recording & consent laws",
          relevance:
            "Recording and transcription of customer QBRs and calls for voice-of-" +
            "customer synthesis require jurisdiction-appropriate consent and " +
            "notice.",
        },
      ],
      canonicalTerms: [
        {
          term: "Net revenue retention (NRR)",
          definition:
            "Existing-base recurring revenue end vs start including expansion and " +
            "net of churn/contraction; above 100% means the base grows on its own " +
            "— the metric that compounds enterprise value.",
        },
        {
          term: "Gross revenue retention (GRR)",
          definition:
            "Retained recurring revenue net of churn and contraction but " +
            "EXCLUDING expansion; can never exceed 100% and is the honest floor " +
            "under NRR.",
        },
        {
          term: "Time-to-first-value (TTFV)",
          definition:
            "Elapsed time from contract start to the first defined value " +
            "milestone — the leading indicator of retention set during " +
            "onboarding.",
        },
        {
          term: "Health score",
          definition:
            "A composite signal of an account's likelihood to renew/expand vs " +
            "churn — only meaningful when backtested against actual outcomes, " +
            "otherwise a vanity dashboard.",
        },
        {
          term: "QBR / success plan",
          definition:
            "The quarterly business review and the mutual success plan (goals, " +
            "criteria, milestones) that operationalize a proactive, " +
            "outcome-anchored CS motion.",
        },
        {
          term: "Book of business",
          definition:
            "The set of accounts (and their ARR) assigned to a CSM — the capacity " +
            "ratio that determines how proactive the motion can be.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Net / gross revenue retention (NRR / GRR)",
        authoritativeSource:
          "Recurring-revenue / billing ledger tracking expansion, contraction, " +
          "and churn by cohort over multiple periods, reconciled to finance",
        whatGoodEvidenceLooksLike:
          "A cohort-based NRR decomposed into GRR, expansion, and contraction " +
          "over multiple periods, reconciled to the finance ledger, with logo and " +
          "dollar retention shown together.",
        weakEvidenceToReject:
          "A single headline NRR figure with no GRR decomposition, no cohort " +
          "basis, and no reconciliation to billed revenue.",
      },
      {
        claim: "Health-score predictive accuracy",
        authoritativeSource:
          "Health-score records joined retrospectively to actual renewal/churn " +
          "outcomes for backtesting",
        whatGoodEvidenceLooksLike:
          "A backtest showing the lift of red-flagged accounts' actual churn over " +
          "the base rate across a real cohort, with the share of churned accounts " +
          "that were flagged red in advance.",
        weakEvidenceToReject:
          "A health score's coverage or a vendor 'accuracy' claim with no " +
          "backtest against actual renewal/churn outcomes for this tenant.",
      },
      {
        claim: "Time-to-value / onboarding impact",
        authoritativeSource:
          "Onboarding milestone tracking joined to product activation telemetry, " +
          "against a defined first-value milestone, before and after",
        whatGoodEvidenceLooksLike:
          "A before/after on median time-to-first-value and the share of a cohort " +
          "reaching activation, tied to that cohort's subsequent retention.",
        weakEvidenceToReject:
          "A 'faster onboarding' claim measured to go-live rather than durable " +
          "activation, with no link to a defined value milestone or retention " +
          "outcome.",
      },
      {
        claim: "Expansion / NRR uplift from a CS-led play",
        authoritativeSource:
          "Recurring-revenue ledger isolating expansion by account, joined to " +
          "the usage/entitlement signal and which accounts were actioned",
        whatGoodEvidenceLooksLike:
          "A cohort comparison of expansion/NRR for accounts where the signal " +
          "drove an owned play versus not, with clean entitlement data behind the " +
          "play and attribution haircuts applied.",
        weakEvidenceToReject:
          "An expansion-pipeline or model 'opportunity' figure with no booked " +
          "revenue, no clean entitlement basis, and no owner who actually worked " +
          "it.",
      },
      {
        claim: "CSM capacity / proactivity gain",
        authoritativeSource:
          "ARR-per-CSM and proactive-touch coverage from the CS platform, before " +
          "and after admin automation / tech-touch coverage",
        whatGoodEvidenceLooksLike:
          "A measured before/after on ARR-per-CSM at constant or improved " +
          "proactive-touch coverage, showing real work was offloaded, not just a " +
          "bigger book assigned.",
        weakEvidenceToReject:
          "A 'CSMs save N hours' figure from a vendor survey with no proactive-" +
          "coverage or book-size baseline.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your NRR and GRR by cohort, and do you decompose NRR into expansion, contraction, and churn — or report it as a single headline?",
      "When you look back, what share of last year's churned accounts were flagged red in advance, and has anyone measured your health score's predictive accuracy against actual outcomes?",
      "What is your defined first-value milestone, your median time-to-value to reach it, and what share of new customers never reach it at all?",
      "Who is comped on the renewal and on expansion, and when a CSM spots an expansion signal, what is the exact path and ownership for turning it into a booked deal?",
      "Can you reliably join what each customer is entitled to with what they actually use today in one place, or is that reconciled by hand before each renewal and QBR?",
      "What is your ARR-per-CSM by segment, what share of your book had no proactive touch last quarter, and what share has a current success plan and on-cadence QBR?",
      "Which leading indicators (time-to-value, adoption drop, health flag) trigger a defined, owned action before the renewal conversation rather than after?",
    ],
    maturitySignals: [
      "NRR is decomposed into GRR, expansion, and contraction by cohort, and logo and dollar retention are read together — not a single headline.",
      "Health scores are backtested against actual renewal/churn outcomes with published predictive accuracy and a retrain cadence, not gut-weighted and never revisited.",
      "Onboarding has a defined first-value milestone, time-to-value is measured, and the share of each cohort reaching activation is tracked as a leading retention indicator.",
      "Usage, entitlement, and relationship data are joined in one reconciled signal layer, so health/churn/expansion bets reason over a complete account view.",
      "Renewal and expansion ownership is explicit in the comp plan and RACI, and leading indicators are wired to defined, owned plays — proactivity is measured, not claimed.",
    ],
    redFlags: [
      "Health scores are deployed and reported but never backtested against actual outcomes, and accounts churn green while healthy ones flash red.",
      "The org calls itself proactive but success-plan/QBR coverage is low and CSM activity spikes only in the 90 days before renewal.",
      "Expansion plays misfire because usage and entitlement data can't be reliably joined, and CS pitches capability customers already own.",
      "Renewal and expansion ownership is ambiguous between CS and sales, signals die in the handoff, and saves are won by last-minute discounts.",
      "ARR-per-CSM is well above the segment's touch model and a large share of the book goes untouched until it churns (no real tech-touch tier).",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Customer Success platform (Gainsight, Totango, Catalyst, Planhat, ChurnZero)",
        category: "CS system of record / health scoring / playbooks",
        switchingCost:
          "High — the system of record for health scores, success plans, " +
          "playbooks, and renewal tracking, with deep integrations into CRM, " +
          "billing, and product analytics; migration re-creates models, playbooks, " +
          "and historical health context.",
        renewalDynamics:
          "Per-seat / per-managed-ARR pricing; the accumulated health-model " +
          "tuning and success-plan history are the real lock-in. Press on data and " +
          "model portability, and watch CRM-native CS modules bundling at renewal.",
      },
      {
        vendorName: "Product analytics / usage telemetry (Pendo, Amplitude, Mixpanel, Heap)",
        category: "Adoption signal / in-app guidance",
        switchingCost:
          "Moderate-to-high — instrumentation and historical event data " +
          "accumulate value over time, so the data history (not the tool) is the " +
          "lock-in; re-instrumentation is a real cost on exit.",
        renewalDynamics:
          "Usage/MTU-based pricing that scales with growth; negotiate event-volume " +
          "tiers and confirm raw-event export rights to avoid telemetry lock-in.",
      },
      {
        vendorName: "Voice-of-customer / survey (Medallia, Qualtrics, Delighted)",
        category: "NPS / CES / sentiment capture",
        switchingCost:
          "Moderate — survey programs and response history are portable with " +
          "effort; the risk is over-weighting NPS as the health proxy rather than " +
          "lock-in.",
        renewalDynamics:
          "Response-volume / seat pricing; consolidation pressure as CS and " +
          "experience suites absorb VoC — watch for bundle re-lock.",
      },
      {
        vendorName: "Recurring-billing / revenue platform (Zuora, Chargebee, Stripe Billing)",
        category: "Entitlement / subscription billing / NRR ledger",
        switchingCost:
          "Very high — the entitlement and recurring-revenue system of record " +
          "wired into finance, provisioning, and contracts; replacement is a " +
          "multi-quarter finance program rarely undertaken for CS alone.",
        renewalDynamics:
          "Volume/revenue-based pricing; deep finance integration makes it the " +
          "stickiest layer — the lever is the entitlement data quality it must " +
          "expose to CS, not switching it.",
      },
    ],
    switchingCosts:
      "The billing/entitlement ledger is the highest-lock-in layer (wired into " +
      "finance), and the CS platform is the next stickiest because accumulated " +
      "health models and success-plan history live there. The value-frontier " +
      "tools (product analytics, VoC) sit in moderate-switching layers where the " +
      "real lock-in is accumulated DATA — event history, survey corpus — so exit " +
      "rights over your own data matter more than the software contract. The " +
      "strategic lever is rarely switching a system; it is forcing clean " +
      "usage/entitlement data to surface across these systems so the CS-AI bets " +
      "can actually work. Beware CRM-native CS modules bundling at renewal to " +
      "re-lock the stack.",
    negotiationLevers: [
      "Validated outcome proof in a controlled pilot (health-score predictive accuracy, retention/expansion lift) before enterprise scale-up",
      "Raw usage-event and health-model / success-plan portability + export rights to avoid data lock-in",
      "Managed-ARR or per-managed-account pricing tied to the book actually covered, not blanket seats (pay for coverage, not shelfware)",
      "Entitlement-data exposure commitments from the billing platform so CS can reliably join owned-vs-used data",
      "Unbundle add-on AI features (predictive scoring, copilots) from the core CS-platform renewal to keep best-of-breed leverage",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      retention_claim: [
        "recurring-revenue ledger by cohort",
        "NRR decomposed into GRR / expansion / contraction",
        "logo and dollar retention shown together, reconciled to finance",
      ],
      health_score_claim: [
        "backtest of score vs actual renewal/churn outcomes",
        "lift of red-flagged churn over base rate",
        "share of churned accounts flagged red in advance",
      ],
      onboarding_claim: [
        "defined first-value milestone",
        "before/after median time-to-value",
        "share of cohort reaching activation tied to retention",
      ],
      expansion_claim: [
        "booked expansion revenue (not pipeline) by account",
        "clean usage/entitlement basis for the play",
        "owned-and-actioned vs not comparison with attribution haircut",
      ],
      capacity_claim: [
        "ARR-per-CSM baseline by segment",
        "proactive-touch coverage before/after",
        "evidence of real work offloaded, not just a bigger book",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (usage/entitlement data quality, CS-vs-sales ownership, health-score validation)",
      ],
    },
    citationStandard:
      "Quantitative retention/expansion claims cite the recurring-revenue/billing " +
      "ledger and the cohort and period, and NRR is decomposed into GRR, " +
      "expansion, and contraction rather than asserted as a single headline. " +
      "Health-score claims are stated as a backtest against actual renewal/churn " +
      "outcomes (the lift of red-flagged churn over base rate), never as coverage " +
      "or a vendor accuracy figure alone. Onboarding claims cite a defined " +
      "first-value milestone and measure to durable activation, not go-live. " +
      "Value projections cite a baseline plus a labelled planning range and the " +
      "haircut factors applied (usage/entitlement data quality, CS-vs-sales " +
      "ownership friction, health-score validation) — never a single asserted NRR " +
      "lift, and never a vendor 'up to X%' figure without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not backtested its health score against actual outcomes — frame any retention value as gated by score validity and likely overstated until the backtest is done.",
      "Usage and entitlement data cannot be reliably joined — flag that expansion and churn-prediction value assumes a data join that may not exist, since it is the binding gate.",
      "NRR is reported as a single headline without GRR decomposition — hedge that a strong NRR can mask a weak GRR carried by a few expansions.",
      "Renewal/expansion ownership between CS and sales is ambiguous — flag the structural tension as a discount on projected expansion no tool resolves.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
    ],
    inferenceLanguage: [
      "Across recurring-revenue businesses at this scale, NRR typically runs... (industry pattern, not your measured figure)",
      "Without your health-score backtest, the industry pattern is that unvalidated scores predict little, so the retention lift is capped by...",
      "As an industry pattern (not your data), CS-led expansion ROL is gated by clean usage/entitlement data and by who is comped on the renewal...",
      "Peer programs commonly see time-to-value compress by... with guided onboarding, contingent on a defined activation milestone.",
    ],
    flagWithoutEvidence: [
      "A specific NRR / GRR or retention lift for this tenant",
      "This tenant's actual health-score predictive accuracy or churn-flag hit rate",
      "A specific expansion-revenue figure from this tenant's CS-led plays",
      "A claim that this tenant's CS motion is proactive rather than reactive without success-plan/QBR coverage data",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "NRR decomposition / where retention leaks and expands",
      exhibitKind: "chart",
      chartKind: "waterfall",
      chartBuilder: "waterfall",
      note: "Waterfall from starting ARR through churn, contraction, and expansion to ending ARR — exposes the GRR floor under a headline NRR.",
    },
    {
      questionPattern: "value of a CS / retention-AI program / realizable-value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled NRR/retention lift to realizable value with usage/entitlement-data-quality, CS-vs-sales ownership, and health-score-validation haircuts.",
    },
    {
      questionPattern: "what drives value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (usage/entitlement data quality, ownership friction, health-score validation) on realizable retention/expansion value.",
    },
    {
      questionPattern: "where AI fits across the customer lifecycle / lever prioritization by value and data-readiness",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of lifecycle stages (onboarding → adoption → health → renewal → expansion) x AI lever shaded by net value and data-readiness/ownership risk.",
    },
    {
      questionPattern: "customer success KPI scorecard",
      exhibitKind: "table",
      note: "NRR, GRR, logo churn, time-to-value, adoption, health coverage+accuracy, expansion, renewal rate, ARR-per-CSM, QBR coverage, escalation time, NPS vs planning ranges.",
    },
    {
      questionPattern: "lifecycle adoption / time-to-value cohort trend",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Cohort trend of time-to-first-value and adoption depth over the lifecycle to expose where customers stall before value.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A unified usage + entitlement + relationship signal layer built first, so every data-dependent CS bet reasons over a complete, reconciled view",
      "Health scoring backtested against actual outcomes with published accuracy, so red flags are trusted triggers rather than a vanity dashboard",
      "Onboarding / time-to-value treated as the front of the retention funnel with a defined activation milestone, not minimized as a cost center",
      "Renewal and expansion ownership made explicit in comp and RACI so CS expansion signals have a clear owner to action them",
      "Leading indicators wired to defined, owned plays, with proactivity measured (success-plan/QBR coverage) rather than merely claimed",
    ],
    failureDrivers: [
      "Deploying health scores that are never backtested — accounts churn green and CSMs learn to ignore the score",
      "Pitching AI-driven expansion on dirty usage/entitlement data, pitching capability customers already own and eroding trust",
      "Leaving the CS-vs-sales ownership tension unresolved so expansion signals die in the handoff regardless of model quality",
      "Calling the motion proactive while CSM books are too big to be anything but reactive, leaving the long tail untouched until it churns",
      "Steering only on lagging NRR/renewal rate so problems surface after the revenue has already left",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption hinges on whether a bet obviously helps the CSM or the customer " +
      "without adding work. CSM copilots and AI-guided onboarding adopt fastest " +
      "because they remove prep and admin reps hate; digital/tech-touch follows " +
      "where the long tail was already going untouched. Predictive health and " +
      "churn scoring adopt only once CSMs trust the backtest and can see the " +
      "per-account drivers — adoption spreads team-by-team as the score proves " +
      "itself, not by mandate. AI-led expansion has the weakest readiness because " +
      "it collides with the structural CS-vs-sales ownership question and requires " +
      "clean entitlement data, so it should expand only on proof, never by default.",
    roiClarity: "medium",
    roiClarityBasis:
      "Time-to-value compression and CSM capacity gains are directly measurable " +
      "in milestone and book-coverage data and cleanly attributable. Retention " +
      "and expansion gains are real but influenced by many factors and easy to " +
      "over-credit without cohort/holdout comparison and NRR decomposition. The " +
      "two structural discounts — usage/entitlement data quality and the " +
      "CS-vs-sales ownership friction — are large and tenant-specific, and " +
      "health-score value is fictional until backtested, so ROI is firm only when " +
      "those are measured; without that discipline the case is routinely " +
      "overstated, which holds clarity at medium.",
  },

  regulatoryFrame: {
    name: "Customer-data privacy + auto-renewal / contract terms",
    relevance:
      "The dominant regulatory frame for AI in the post-sale lifecycle: product " +
      "usage telemetry, health scoring, and sentiment analysis process personal " +
      "and customer data and must respect privacy law (GDPR/CCPA), lawful basis, " +
      "and contractual data-use terms; QBR/call recording for voice-of-customer " +
      "synthesis requires jurisdiction-appropriate consent; and any AI-driven " +
      "renewal/retention motion must honor auto-renewal, notice, and cancellation " +
      "rules and the contract terms governing the recurring relationship (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
