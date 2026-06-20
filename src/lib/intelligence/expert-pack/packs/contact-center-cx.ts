// Consilium expert — Contact Center → Customer Experience Transformation.
//
// W3 draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// cross-cutting, front-office expert: voice/chat/email/messaging support
// transformed with GenAI across deflection, agent-assist, and full automation.
//
// Honesty posture: this domain is where vanity metrics and vendor demos do the
// most damage. The pack is deliberately blunt about deflect-vs-assist-vs-
// automate — containment that just defers contacts, knowledge bases that rot,
// and "automation" that quietly degrades CSAT. It is cross-industry: the same
// CCaaS/CRM/knowledge spine recurs in banking, retail, healthcare, telco, and
// public sector, so this is a cross-cutting-domain expert, not an
// industry×function pack.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const contactCenterCxExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.contact-center-cx",
    expertName: "Contact Center & CX Transformation Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "contact-center-cx",
    scopeNote:
      "Front-office customer support transformation across voice, chat, email, " +
      "and messaging: GenAI deflection (self-service/bots), agent-assist " +
      "(copilot, real-time knowledge, summarization), and full automation of " +
      "low-complexity intents. Covers the trade-offs across CSAT, cost-to-serve, " +
      "containment, and adoption. Cross-industry (banking, retail, healthcare, " +
      "telco, public sector). Excludes field service, product/engineering " +
      "support tooling, and the back-office workflows a contact may trigger " +
      "(claims adjudication, order fulfillment) — those route to other experts.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "containment_rate",
        name: "Containment rate (self-service / bot)",
        definition:
          "Share of inbound contacts fully resolved in self-service (IVR, bot, " +
          "automated flow) without reaching a live agent, counting only genuine " +
          "resolutions — not abandons or silent transfers.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "CCaaS/conversational-AI vendor and operator ranges; varies widely " +
            "by intent mix — simple status checks contain far higher than " +
            "complex billing or empathy-heavy intents",
          label: "planning-range",
        },
        dataSource:
          "CCaaS / conversational-AI platform session logs joined to live-agent " +
          "contact records to net out escalations and abandons",
        whyItMatters:
          "The headline deflection economics — but the most gamed metric in the " +
          "domain. True containment (resolved + customer satisfied) is the real " +
          "number; counting deflections that re-contact within 24-72h is the " +
          "central false-containment trap.",
      },
      {
        key: "deflection_rate",
        name: "Deflection rate",
        definition:
          "Share of contacts diverted from a higher-cost channel (voice) to a " +
          "lower-cost channel (chat/self-service) or to asynchronous handling, " +
          "whether or not fully resolved at first touch.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 40,
          basis:
            "Channel-shift program ranges; depends on digital adoption and " +
            "whether self-service genuinely resolves vs merely defers",
          label: "planning-range",
        },
        dataSource:
          "Channel volume mix over time (telephony ACD vs digital channels) " +
          "with cohort tracking of diverted contacts",
        whyItMatters:
          "Distinct from containment — a contact can be deflected to chat and " +
          "still need an agent. Deflection without resolution shifts cost, it " +
          "does not remove it, so it must be read against re-contact rate.",
      },
      {
        key: "first_contact_resolution",
        name: "First-contact resolution (FCR)",
        definition:
          "Share of contacts resolved on the first interaction with no " +
          "follow-up contact required for the same issue within a defined window " +
          "(commonly 7 days).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 80,
          basis:
            "Cross-industry contact-center benchmarks; best-in-class >80% on " +
            "voice; lower for complex regulated intents",
          label: "planning-range",
        },
        dataSource:
          "Contact records linked by customer + issue over a trailing window " +
          "(CRM case threading + ACD/interaction logs)",
        whyItMatters:
          "The truest quality-and-cost lever — high FCR cuts repeat volume and " +
          "lifts CSAT simultaneously. AI bets that raise containment but depress " +
          "FCR (re-contacts) are net-negative even if containment looks good.",
      },
      {
        key: "average_handle_time",
        name: "Average handle time (AHT)",
        definition:
          "Mean agent time per contact: talk/handle time plus after-call work " +
          "(wrap), across the contacts an agent actually handles.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 8,
          basis:
            "Voice AHT ranges vary by intent complexity; simple intents 3-5 min, " +
            "complex/regulated 8-12 min — agent-assist compresses wrap most",
          label: "planning-range",
        },
        dataSource:
          "ACD/telephony talk + hold + after-call-work timers, by intent and " +
          "agent cohort",
        whyItMatters:
          "The direct cost-per-contact driver for handled volume. Agent-assist " +
          "and auto-summarization move AHT (especially wrap), but cutting AHT at " +
          "the expense of FCR or CSAT is a false economy.",
      },
      {
        key: "cost_per_contact",
        name: "Cost per contact",
        definition:
          "Fully-loaded cost to handle one contact (agent labor, supervision, " +
          "technology, facilities) divided by handled contact volume, by channel.",
        unit: "USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Channel-dependent: self-service pennies-to-$1, chat $3-6, voice " +
            "$6-12; onshore voice sits at the top of the range",
          label: "planning-range",
        },
        dataSource:
          "Contact-center cost centers (labor + tech + facilities) / handled " +
          "volume by channel from the GL and workforce systems",
        whyItMatters:
          "The economic denominator every deflection/automation business case is " +
          "judged on. Blended cost-to-serve only falls if deflected contacts are " +
          "genuinely removed, not re-routed — the link back to containment_rate.",
      },
      {
        key: "csat",
        name: "Customer satisfaction (CSAT)",
        definition:
          "Share of post-contact survey respondents rating the interaction " +
          "satisfied (commonly top-2-box on a 5-point scale).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 90,
          basis:
            "Cross-industry post-contact CSAT ranges; survey bias and low " +
            "response rates widen the real spread",
          label: "planning-range",
        },
        dataSource:
          "Post-contact surveys (IVR, email, SMS) joined to interaction records; " +
          "increasingly supplemented by automated QA sentiment on full transcripts",
        whyItMatters:
          "The honesty check on every cost play. Deflection and automation can " +
          "quietly erode CSAT — especially when bots trap customers or escalate " +
          "poorly — so it is the metric that must be watched alongside every " +
          "containment or AHT gain.",
      },
      {
        key: "nps",
        name: "Net promoter score (NPS)",
        definition:
          "Percentage of promoters minus percentage of detractors on the " +
          "0-10 likelihood-to-recommend question, often measured at the " +
          "relationship level and influenced by service experience.",
        unit: "points",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 50,
          basis:
            "Wide cross-industry variance; service interactions move relationship " +
            "NPS but attribution is loose",
          label: "planning-range",
        },
        dataSource:
          "Relationship and transactional NPS surveys; service-experience " +
          "attribution requires linking survey to recent contacts",
        whyItMatters:
          "The relationship-level proxy for whether service is building or eroding " +
          "loyalty — slower-moving than CSAT, harder to attribute, but the metric " +
          "executives anchor on for retention and lifetime-value arguments.",
      },
      {
        key: "abandonment_rate",
        name: "Abandonment rate",
        definition:
          "Share of contacts that disconnect or drop out (in queue or mid-flow) " +
          "before reaching resolution or a live agent.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "Voice queue abandonment ranges; best-in-class <5%; bot/self-service " +
            "drop-off can run far higher and is often miscounted as containment",
          label: "planning-range",
        },
        dataSource:
          "ACD queue events and bot-flow drop-off telemetry (distinguishing " +
          "abandon-before-agent from abandon-in-self-service)",
        whyItMatters:
          "The hidden cost of staffing gaps and bad bot design — abandoned " +
          "contacts re-contact, inflate volume, and crater CSAT. Self-service " +
          "abandons miscounted as containment are the core vanity-metric risk.",
      },
      {
        key: "self_service_rate",
        name: "Self-service rate",
        definition:
          "Share of total customer interactions that begin and stay in " +
          "self-service channels (web/app help, FAQ, automated flows) before any " +
          "assisted contact.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 70,
          basis:
            "Digital-mature segments run high; depends on intent shoppability and " +
            "knowledge-base quality",
          label: "planning-range",
        },
        dataSource:
          "Digital analytics on help/self-service journeys joined to assisted " +
          "contact volume to compute the assisted-vs-unassisted split",
        whyItMatters:
          "The upstream lever — every interaction that resolves before it becomes " +
          "an assisted contact is the cheapest outcome. Rising self-service rate " +
          "with flat re-contact is the signal real deflection is working.",
      },
      {
        key: "escalation_rate",
        name: "Escalation rate",
        definition:
          "Share of contained or tier-1 contacts that escalate to a live agent " +
          "or higher support tier, including bot-to-agent handoffs.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 45,
          basis:
            "Bot-to-agent and tier-1-to-tier-2 escalation ranges; depends on " +
            "intent complexity and how well handoff context is preserved",
          label: "planning-range",
        },
        dataSource:
          "Bot/self-service handoff events and tier-routing transitions in the " +
          "CCaaS and CRM systems",
        whyItMatters:
          "The pressure valve that exposes false containment — high escalation " +
          "after 'contained' contacts means the bot deflected without resolving. " +
          "Clean escalation with full context transfer is healthy; cold handoffs " +
          "that force customers to repeat themselves destroy CSAT.",
      },
      {
        key: "occupancy",
        name: "Agent occupancy",
        definition:
          "Share of an agent's logged-in (paid) time spent handling contacts " +
          "or in after-call work, versus available-idle time.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 80,
          high: 88,
          basis:
            "Sustainable occupancy band; persistently >90% drives burnout and " +
            "attrition, <75% signals overstaffing or poor forecasting",
          label: "planning-range",
        },
        dataSource:
          "Workforce-management (WFM) adherence and state data joined to ACD " +
          "handle time",
        whyItMatters:
          "The capacity-and-wellbeing lever — too high burns agents out and " +
          "feeds attrition; too low wastes labor. Automation that strips out the " +
          "easy contacts can spike occupancy on the hard ones left behind, a " +
          "second-order effect many cost cases miss.",
      },
      {
        key: "agent_attrition_rate",
        name: "Agent attrition rate (annualized)",
        definition:
          "Annualized rate at which frontline agents leave the contact center " +
          "(voluntary plus involuntary), as a share of average headcount.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Contact-center attrition is structurally high; outsourced/BPO and " +
            "high-occupancy environments sit at the top of the range",
          label: "planning-range",
        },
        dataSource:
          "HRIS / workforce records: separations over average frontline headcount",
        whyItMatters:
          "The cost the deflection business case usually ignores — every exit is " +
          "recruiting, onboarding, and ramp cost plus a quality dip. Agent-assist " +
          "that reduces cognitive load and after-call work is partly a retention " +
          "play, not just an AHT play.",
      },
    ],

    painThemes: [
      {
        key: "bot_deflection_backfire",
        name: "Bot-deflection backfire",
        description:
          "An aggressive bot or IVR contains contacts on paper but traps " +
          "customers in loops, deflects without resolving, and dumps cold " +
          "escalations on agents — so volume re-contacts, CSAT drops, and the " +
          "'savings' are recycled cost plus reputational damage.",
        detectionSignal:
          "High reported containment with rising 24-72h re-contact rate, climbing " +
          "escalation_rate, falling CSAT on contained-then-escalated journeys, " +
          "and social/complaint chatter about 'can't reach a human'.",
        diagnosticQuestion:
          "Of your contained contacts, what share re-contact within 72 hours, " +
          "and do you measure CSAT separately for customers who were deflected " +
          "and then had to escalate?",
      },
      {
        key: "knowledge_base_rot",
        name: "Knowledge-base rot",
        description:
          "Self-service, bots, and agent-assist all draw on a knowledge base " +
          "that is stale, contradictory, or full of gaps — so automation " +
          "confidently serves wrong answers and copilots hallucinate from bad " +
          "source material. The KB is the silent dependency every AI bet rides on.",
        detectionSignal:
          "No content freshness SLA or ownership; high agent override of " +
          "suggested answers; rising 'answer was wrong' feedback; bot answers " +
          "diverge from current policy; large share of articles untouched >12 months.",
        diagnosticQuestion:
          "Who owns knowledge freshness, what is your article review cadence, and " +
          "how often do agents reject the answer the assist tool suggests?",
      },
      {
        key: "fragmented_channels",
        name: "Fragmented channels & broken context",
        description:
          "Voice, chat, email, and messaging run on separate stacks with no " +
          "shared customer context, so customers repeat themselves across " +
          "channels and agents lack history — making true omnichannel resolution " +
          "and consistent AI behavior impossible.",
        detectionSignal:
          "Multiple disconnected platforms per channel; no unified interaction " +
          "history in the CRM; customers re-authenticating and re-explaining on " +
          "handoff; channel-specific bots that don't share intent or state.",
        diagnosticQuestion:
          "When a customer moves from chat to voice, does the agent see the full " +
          "prior conversation, or does the customer start over?",
      },
      {
        key: "agent_burnout_attrition",
        name: "Agent burnout & attrition spiral",
        description:
          "High occupancy, repetitive after-call work, and the residue of hard " +
          "contacts left after easy ones are automated away drive burnout, which " +
          "drives attrition, which drives understaffing, which drives occupancy " +
          "back up — a reinforcing loop that erodes quality and inflates cost.",
        detectionSignal:
          "Occupancy persistently >90%, rising attrition, lengthening ramp/tenure " +
          "gaps, falling quality scores on complex intents, growing overtime and " +
          "absenteeism.",
        diagnosticQuestion:
          "What is your annualized agent attrition, and after automating simple " +
          "intents, has the difficulty mix and occupancy of the remaining work " +
          "gone up?",
      },
      {
        key: "false_containment_vanity",
        name: "False-containment vanity metrics",
        description:
          "Containment and deflection are reported as wins without netting out " +
          "abandons, silent transfers, and re-contacts — so the board sees " +
          "savings that the cost-to-serve line never actually shows, and real " +
          "investment decisions are made on inflated numbers.",
        detectionSignal:
          "Containment counted at session start not resolution; abandons in " +
          "self-service booked as contained; no re-contact netting; reported " +
          "savings that don't reconcile to the cost-per-contact trend.",
        diagnosticQuestion:
          "Does your containment number count only resolved-and-satisfied " +
          "contacts, and can you reconcile reported deflection savings to the " +
          "actual cost-to-serve line?",
      },
      {
        key: "escalation_black_holes",
        name: "Escalation black holes",
        description:
          "Escalations from bots or tier-1 lose context, land in the wrong " +
          "queue, or stall — so customers repeat their issue, complex cases " +
          "bounce between teams, and the hardest contacts (the ones automation " +
          "couldn't handle) get the worst experience.",
        detectionSignal:
          "Cold bot-to-agent handoffs with no transcript/context passed; high " +
          "transfer rates between agent teams; long resolution time on escalated " +
          "cases; CSAT lowest on multi-transfer journeys.",
        diagnosticQuestion:
          "When the bot hands off to an agent, what context travels with the " +
          "customer, and how many transfers does a complex case take before it " +
          "reaches someone who can resolve it?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "conversational_self_service",
        name: "Conversational self-service (GenAI deflection)",
        valueMechanism:
          "A GenAI assistant resolves common intents end-to-end in chat/voice/" +
          "messaging — grounded in the knowledge base and able to take actions — " +
          "so qualifying contacts are genuinely resolved without an agent, " +
          "removing handle cost rather than merely deferring it.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Curated, fresh knowledge base with clear ownership",
          "Intent taxonomy and historical transcripts for grounding/eval",
          "Action/API access to back-end systems for transactional resolution",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Hallucination on policy/eligibility is a direct CSAT and compliance risk — ground in KB and constrain to verified answers",
          "Must offer a clean, fast path to a human; never trap the customer",
          "Measure on resolution + CSAT + re-contact, not raw containment, to avoid false-containment incentives",
        ],
        metricsMoved: [
          "containment_rate",
          "self_service_rate",
          "cost_per_contact",
          "csat",
        ],
      },
      {
        key: "agent_assist_copilot",
        name: "Agent-assist / copilot",
        valueMechanism:
          "A real-time copilot listens to the live contact, surfaces the right " +
          "answer, next-best-action, and guided steps, and drafts responses — " +
          "compressing handle time and after-call work while lifting consistency " +
          "and shortening new-agent ramp.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Real-time transcription / live transcript stream",
          "Knowledge base and policy content for retrieval",
          "Customer/interaction context from the CRM",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Suggestions must be visibly grounded and overridable — agents are accountable for what they say",
          "Bad suggestions erode trust fast; track agent acceptance/override as a quality signal",
          "Avoid surveillance framing that worsens morale; position as support, not scoring",
        ],
        metricsMoved: [
          "average_handle_time",
          "first_contact_resolution",
          "csat",
          "agent_attrition_rate",
        ],
      },
      {
        key: "realtime_knowledge_retrieval",
        name: "Real-time knowledge retrieval (RAG)",
        valueMechanism:
          "Retrieval-augmented generation answers agent and customer questions " +
          "from the live knowledge corpus with citations — replacing manual " +
          "article search and guesswork, so answers are faster, current, and " +
          "consistent across channels.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Indexed, permissioned knowledge corpus (articles, policies, macros)",
          "Content freshness and ownership metadata",
          "Feedback signals (helpful/not, agent overrides) for continuous eval",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Answer quality is capped by corpus quality — rides directly on knowledge-base rot",
          "Citations must be shown so answers are checkable, not trusted blindly",
          "Permission-scope retrieval so customers never see internal-only content",
        ],
        metricsMoved: [
          "first_contact_resolution",
          "average_handle_time",
          "containment_rate",
        ],
      },
      {
        key: "post_call_summarization_qa",
        name: "Post-contact summarization & automated QA",
        valueMechanism:
          "GenAI auto-drafts the after-call summary/disposition and scores every " +
          "interaction for quality and compliance — eliminating manual wrap and " +
          "moving QA from a 1-2% sample to near-100% coverage, surfacing coaching " +
          "and risk that sampling misses.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Interaction transcripts (voice ASR + digital)",
          "Disposition/QA rubric and compliance checklist",
          "CRM write-back for the generated summary",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-summaries must be agent-editable before commit — errors propagate into the record",
          "Automated QA scores inform coaching; punitive use without human review damages trust and accuracy",
          "Recording/consent and PII handling apply to every transcript processed",
        ],
        metricsMoved: [
          "average_handle_time",
          "csat",
          "agent_attrition_rate",
        ],
      },
      {
        key: "intent_routing",
        name: "Intent detection & smart routing",
        valueMechanism:
          "GenAI classifies intent and customer context up front and routes to " +
          "the right channel, skill, or self-service path on the first touch — " +
          "cutting misroutes, transfers, and queue time so contacts reach " +
          "resolution faster and escalations carry context.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Labelled intent taxonomy and historical routing outcomes",
          "Skill/queue model and agent proficiency data",
          "Customer context (CRM, prior interactions) at point of routing",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Misclassification sends customers down wrong paths — monitor routing accuracy and override rates",
          "Routing must pass full context on handoff to avoid escalation black holes",
          "Avoid routing rules that quietly bury hard intents to protect containment metrics",
        ],
        metricsMoved: [
          "first_contact_resolution",
          "escalation_rate",
          "abandonment_rate",
          "average_handle_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "contained_self_service_with_clean_escape",
        name: "Contained self-service with a clean human escape",
        description:
          "A grounded GenAI self-service layer resolves qualifying intents and, " +
          "the moment confidence or sentiment drops, hands off to a live agent " +
          "with the full transcript and context — designed so containment never " +
          "comes at the cost of trapping the customer.",
        boundary:
          "Owns first-touch resolution and the handoff trigger; does not own the " +
          "downstream agent workflow or the back-office systems it calls into.",
        humanAccountabilityPoint: "Head of Digital / Self-Service Channels",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "realtime_agent_assist_layer",
        name: "Real-time agent-assist layer over existing CCaaS",
        description:
          "A copilot layer that overlays the existing agent desktop — live " +
          "transcription, retrieval with citations, next-best-action, and " +
          "auto-summary — without ripping and replacing the CCaaS or CRM, so " +
          "value lands without a platform migration.",
        boundary:
          "Owns in-contact assistance and after-call drafting; does not own " +
          "telephony, routing, or the system-of-record CRM.",
        humanAccountabilityPoint: "VP Customer Care / Contact Center Operations",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "unified_knowledge_layer",
        name: "Unified knowledge layer with governance",
        description:
          "A single governed knowledge source — owned, freshness-SLA'd, and " +
          "permission-scoped — that feeds self-service, agent-assist, and search " +
          "alike, so every AI bet draws from one current truth instead of " +
          "drifting per channel.",
        boundary:
          "Owns content authoring, freshness, and permissions; does not own the " +
          "conversational surfaces that consume it.",
        humanAccountabilityPoint: "Knowledge Management Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "omnichannel_context_spine",
        name: "Omnichannel context spine",
        description:
          "A shared customer-and-interaction context layer (identity, history, " +
          "intent, state) that all channels read and write, so a customer moving " +
          "from chat to voice is recognized and never starts over — the " +
          "foundation that makes consistent AI behavior possible across channels.",
        boundary:
          "Owns cross-channel identity and interaction state; does not own the " +
          "channel-specific engagement tools or the bots themselves.",
        humanAccountabilityPoint: "CX Platform Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value comes from three honestly-different levers, in rising risk order. " +
        "(1) Agent-assist compresses AHT and after-call work on contacts agents " +
        "still handle — the lowest-risk, fastest win, with a retention dividend. " +
        "(2) Containment removes qualifying contacts entirely — the largest " +
        "prize, but real only when resolution and CSAT hold and re-contacts are " +
        "netted out; deflection that defers is recycled cost. (3) Full automation " +
        "of low-complexity intents scales cost-to-serve down hardest, but fails " +
        "loudly on empathy-heavy, edge-case, and policy-sensitive intents, where " +
        "forcing automation craters CSAT. The durable program assists first, " +
        "contains what genuinely resolves, automates only the narrow band that " +
        "stays satisfied — and watches CSAT on every move.",
      dominantHaircutFactors: [
        {
          factor: "False containment / re-contact erosion",
          rationale:
            "Headline containment routinely overstates real deflection because " +
            "abandons and re-contacts aren't netted out; the realizable cost " +
            "saving is materially below the reported containment number.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Observed gap between reported containment and net cost-to-serve " +
              "improvement once re-contacts and abandons are removed",
            label: "planning-range",
          },
        },
        {
          factor: "Knowledge-base quality cap",
          rationale:
            "Every AI bet (self-service, assist, RAG) is capped by knowledge " +
            "freshness and coverage; stale or thin content limits how much value " +
            "can actually be realized regardless of model quality.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Implementation experience where KB gaps limited automation/assist value",
            label: "planning-range",
          },
        },
        {
          factor: "CSAT / adoption guardrail",
          rationale:
            "Pushing containment or automation past the point customers tolerate " +
            "forces a pullback; value must be discounted for the band that has to " +
            "stay human to protect satisfaction and loyalty.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Programs that over-automated and had to re-introduce human paths",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "AHT / after-call-work reduction (agent-assist)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported handle-time and wrap reductions from copilot/summarization " +
              "programs; wrap compresses most",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in average_handle_time",
        },
        {
          lever: "Net containment uplift (genuine resolution)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Incremental genuinely-resolved containment over baseline after " +
              "netting re-contacts",
            label: "planning-range",
          },
          measuredAs:
            "Absolute lift in net containment_rate (resolved + satisfied)",
        },
        {
          lever: "Blended cost-to-serve reduction",
          range: {
            low: 0.1,
            high: 0.25,
            basis:
              "Channel-shift + assist + automation programs; realized only when " +
              "deflected contacts are genuinely removed",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in blended cost_per_contact",
        },
      ],
      timeToValueBand:
        "Agent-assist and auto-summarization: 1-2 quarters (overlay, no platform " +
        "swap). Conversational self-service: 2-4 quarters including knowledge " +
        "curation and eval. Cost-to-serve and CSAT effects compound over 2-4 " +
        "quarters as intent coverage and adoption scale.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "CCaaS / contact-center platform",
          role:
            "Routing, telephony/ACD, digital channels, and interaction handling " +
            "— the operational core the contact center runs on.",
          examples: [
            "Genesys Cloud",
            "NICE CXone",
            "Amazon Connect",
            "Five9",
            "Cisco Webex Contact Center",
          ],
        },
        {
          name: "CRM / case management",
          role:
            "System of record for customer identity, interaction history, and " +
            "case state across channels.",
          examples: [
            "Salesforce Service Cloud",
            "Microsoft Dynamics 365 Customer Service",
            "Zendesk",
            "ServiceNow CSM",
          ],
        },
        {
          name: "Knowledge base / content",
          role:
            "The answer corpus feeding self-service, agent-assist, and search — " +
            "the dependency every AI bet rides on.",
          examples: [
            "Salesforce Knowledge",
            "Zendesk Guide",
            "ServiceNow Knowledge Management",
            "Confluence (internal KB)",
          ],
        },
        {
          name: "Workforce management (WFM) & QM",
          role:
            "Forecasting, scheduling, adherence, and quality management / " +
            "interaction analytics for the agent workforce.",
          examples: [
            "NICE WFM",
            "Verint Workforce Management",
            "Calabrio ONE",
          ],
        },
        {
          name: "Conversational-AI / virtual-agent platform",
          role:
            "Bot/IVA design, NLU/intent, and the GenAI layer for deflection and " +
            "agent-assist.",
          examples: [
            "Google CCAI / Dialogflow",
            "Kore.ai",
            "Cognigy",
            "Sierra",
          ],
        },
      ],
      roles: [
        {
          title: "VP Customer Care / Chief Customer Officer",
          accountability:
            "End-to-end service experience, cost-to-serve, and customer loyalty.",
        },
        {
          title: "Contact Center Operations Director",
          accountability:
            "Staffing, service levels, AHT/occupancy, and frontline performance.",
        },
        {
          title: "CX / Customer Experience Leader",
          accountability:
            "CSAT/NPS, journey design, and the voice-of-customer program.",
        },
        {
          title: "Head of Digital / Self-Service Channels",
          accountability:
            "Containment, channel mix, and self-service/bot experience.",
        },
        {
          title: "Knowledge Management Lead",
          accountability:
            "Content freshness, coverage, and governance of the answer corpus.",
        },
        {
          title: "Workforce Management Lead",
          accountability:
            "Forecasting, scheduling, occupancy, and adherence.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Consumer protection & unfair-practices rules (e.g. FTC / UDAAP, FCA-style conduct)",
          relevance:
            "Service communications, disclosures, and automated responses must " +
            "be accurate and non-deceptive — bot answers on fees, eligibility, " +
            "or rights carry conduct risk.",
        },
        {
          name: "Call recording & consent laws (e.g. one/two-party consent, GDPR lawful basis)",
          relevance:
            "Recording, transcribing, and AI-processing interactions requires " +
            "appropriate notice/consent; jurisdiction-specific and central to any " +
            "transcript-based AI bet.",
        },
        {
          name: "PCI DSS (for payment-taking contacts)",
          relevance:
            "Contacts that capture card data must protect/scope cardholder data; " +
            "transcription and AI must avoid storing PAN in the clear (e.g. DTMF " +
            "masking, redaction).",
        },
        {
          name: "TCPA / outbound contact & do-not-call rules",
          relevance:
            "Automated and AI-driven outbound (proactive service, callbacks) is " +
            "constrained by consent and DNC regimes.",
        },
      ],
      canonicalTerms: [
        {
          term: "Containment",
          definition:
            "A contact resolved fully in self-service/bot without reaching a live " +
            "agent — honest only when it counts genuine resolution, not abandons.",
        },
        {
          term: "AHT (average handle time)",
          definition:
            "Agent talk/handle time plus after-call (wrap) work per contact.",
        },
        {
          term: "FCR (first-contact resolution)",
          definition:
            "Share of issues resolved on the first interaction with no follow-up " +
            "contact for the same issue.",
        },
        {
          term: "Deflection",
          definition:
            "Diverting a contact from a higher-cost channel to a lower-cost one " +
            "or to async — distinct from resolution; can defer rather than remove cost.",
        },
        {
          term: "Occupancy",
          definition:
            "Share of an agent's paid logged-in time spent handling contacts or " +
            "in after-call work versus idle-available.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Containment / deflection rate",
        authoritativeSource:
          "CCaaS / conversational-AI session logs joined to live-agent contact " +
          "records and re-contact tracking",
        whatGoodEvidenceLooksLike:
          "Net containment — contacts resolved in self-service AND not " +
          "re-contacting within a defined window — with abandons and silent " +
          "transfers removed, by intent.",
        weakEvidenceToReject:
          "A vendor dashboard 'containment %' counted at session start, including " +
          "abandons and excluding re-contacts.",
      },
      {
        claim: "AHT impact of agent-assist",
        authoritativeSource:
          "ACD handle/wrap timers compared across an assisted vs control agent " +
          "cohort over a trailing period",
        whatGoodEvidenceLooksLike:
          "A controlled before/after or A/B comparison of talk + after-call work " +
          "by intent, with FCR and CSAT held flat or improved.",
        weakEvidenceToReject:
          "A vendor-cited 'up to X% AHT reduction' with no baseline, cohort, or " +
          "FCR/CSAT control.",
      },
      {
        claim: "CSAT impact of automation",
        authoritativeSource:
          "Post-contact surveys joined to interaction records, segmented by " +
          "contained vs assisted vs escalated journeys",
        whatGoodEvidenceLooksLike:
          "CSAT measured separately for deflected-then-escalated journeys versus " +
          "straight-to-agent, with response-rate context.",
        weakEvidenceToReject:
          "A single blended CSAT number with no journey segmentation and an " +
          "undisclosed, low response rate.",
      },
      {
        claim: "Cost-to-serve reduction",
        authoritativeSource:
          "Fully-loaded contact-center cost centers divided by handled volume by " +
          "channel from the GL and WFM",
        whatGoodEvidenceLooksLike:
          "A reconciliation of reported deflection savings to the actual blended " +
          "cost-per-contact trend, showing removed (not re-routed) volume.",
        weakEvidenceToReject:
          "Projected savings extrapolated from containment % alone, never tied " +
          "back to the cost line.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your net containment rate — resolved and not re-contacting within 72 hours — and how does it differ from the headline number you report?",
      "What is your blended cost per contact by channel, and can you reconcile claimed deflection savings to that cost line?",
      "Who owns knowledge freshness, what is the article review cadence, and how often do agents override the answer the assist tool suggests?",
      "When a bot hands off to an agent, what context travels with the customer, and what is your escalation rate after contained contacts?",
      "What is your annualized agent attrition and current occupancy, and how has the difficulty mix of remaining work changed as you automate simple intents?",
      "Do you segment CSAT by journey — straight-to-agent vs deflected-then-escalated — and what does the deflected-then-escalated cohort look like?",
      "Across voice, chat, email, and messaging, does a customer's context follow them, or do they repeat themselves on every channel switch?",
    ],
    maturitySignals: [
      "Containment is reported as resolved-and-satisfied with re-contacts and abandons netted out, not at session start.",
      "Knowledge has a named owner and a freshness SLA, and agent override of suggested answers is tracked as a quality signal.",
      "CSAT is segmented by journey type so deflection's experience cost is visible.",
      "Bot-to-agent handoffs carry full context, and escalation is measured as a health signal, not just a volume.",
      "Cost-to-serve savings are reconciled to the GL cost line, not extrapolated from containment alone.",
    ],
    redFlags: [
      "Containment is reported high but 24-72h re-contact rate is unmeasured or rising.",
      "No knowledge owner or freshness SLA — automation and assist ride on stale content.",
      "CSAT is a single blended number with no journey segmentation and an undisclosed response rate.",
      "Bot-to-agent handoffs are cold (no context passed), and complex cases take multiple transfers to resolve.",
      "Agent occupancy is persistently above 90% and attrition is rising while simple intents are being automated away.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "CCaaS platform (Genesys, NICE CXone, Amazon Connect, Five9)",
        category: "Contact-center platform / telephony / routing",
        switchingCost:
          "High — telephony numbers, routing logic, integrations, and agent " +
          "retraining make replacement a multi-quarter program; consumption " +
          "(Amazon Connect) lowers lock-in versus seat-based incumbents.",
        renewalDynamics:
          "Multi-year seat or consumption commitments; incumbents bundle their " +
          "own GenAI add-ons at renewal to defend the account.",
      },
      {
        vendorName: "Conversational-AI / virtual-agent (Google CCAI, Kore.ai, Cognigy, Sierra)",
        category: "GenAI self-service / deflection / bot platform",
        switchingCost:
          "Moderate — flows and intent models are portable with effort, but " +
          "deep CCaaS/telephony integration and tuned content raise the cost.",
        renewalDynamics:
          "Fast-moving market; per-resolution or per-conversation pricing common; " +
          "favor outcome-based terms and short initial commitments.",
      },
      {
        vendorName: "Agent-assist / copilot (CCaaS-native + best-of-breed)",
        category: "Real-time assist / summarization / RAG",
        switchingCost:
          "Moderate — overlay layer is swappable, but watch model and data lock-in " +
          "and whether transcripts/embeddings are portable on exit.",
        renewalDynamics:
          "Per-agent or per-minute pricing; incumbents push native bundles — " +
          "press on measured AHT/CSAT proof before scaling.",
      },
      {
        vendorName: "CRM / knowledge (Salesforce, ServiceNow, Zendesk)",
        category: "System of record / case + knowledge",
        switchingCost:
          "Very high — the customer and case system of record with deep " +
          "integration; rarely sourced for the contact center in isolation.",
        renewalDynamics:
          "Enterprise agreements; embedded AI (Einstein, Now Assist) bundled to " +
          "extend the platform and raise switching cost further.",
      },
    ],
    switchingCosts:
      "The CRM/system-of-record and CCaaS telephony core are the high-lock-in " +
      "layers; the value frontier (conversational AI and agent-assist) sits in " +
      "moderate-switching-cost layers where outcome-based terms and exit rights " +
      "are negotiable. Beware incumbent GenAI bundling that quietly re-locks the " +
      "stack at renewal.",
    negotiationLevers: [
      "Outcome/per-resolution pricing tied to net (re-contact-adjusted) containment, not raw deflection",
      "AHT/CSAT parity proof in a controlled pilot before enterprise scale-up",
      "Data and transcript portability + model exit rights to avoid lock-in",
      "Unbundle GenAI add-ons from the core renewal to keep best-of-breed leverage",
      "Consumption-based commercial terms to align cost with actual contact volume",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      containment_claim: [
        "session logs with resolution outcome",
        "re-contact window netting",
        "abandon/silent-transfer exclusion",
      ],
      handle_time_claim: [
        "ACD talk + after-call-work timers",
        "assisted vs control cohort",
        "FCR/CSAT control",
      ],
      experience_claim: [
        "post-contact survey",
        "journey segmentation (contained vs escalated)",
        "response-rate disclosure",
      ],
      cost_to_serve_claim: [
        "fully-loaded cost centers",
        "handled volume by channel",
        "reconciliation to GL cost line",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors",
      ],
    },
    citationStandard:
      "Quantitative service claims cite the platform/ACD/survey/GL source and the " +
      "period, and containment is always stated net of re-contacts and abandons. " +
      "Value projections cite a baseline plus a labelled planning range and the " +
      "haircut factors applied — never a single asserted savings or ROI number, " +
      "and never a vendor 'up to X%' figure without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant reports containment without re-contact netting — frame the deflection economics as likely overstated, not as their true saving.",
      "Only a blended CSAT is available — flag that deflection's experience cost is invisible without journey segmentation.",
      "Vendor-reported AHT/containment outcomes are cited — mark as vendor claims pending a controlled pilot.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
    ],
    inferenceLanguage: [
      "Across contact centers at this scale, containment typically runs...",
      "Without your re-contact data, the industry pattern is that reported containment overstates real deflection by...",
      "Peer programs commonly see AHT compress on assist by...",
      "As an industry pattern (not your measured figure)...",
    ],
    flagWithoutEvidence: [
      "A specific cost-to-serve saving or ROI for this tenant",
      "This tenant's actual net containment or re-contact rate",
      "A claim that automation will hold CSAT for this tenant's specific intent mix",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "deflect vs assist vs automate trade-off / where does AI fit by intent",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap intents x lever (assist/contain/automate) shaded by net value and CSAT risk.",
    },
    {
      questionPattern: "cost-to-serve breakdown by channel / where cost concentrates",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost per contact by channel to show where deflection economics bite.",
    },
    {
      questionPattern: "value of a deflection/assist program / savings bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross containment to net cost-to-serve saving with re-contact and CSAT haircuts.",
    },
    {
      questionPattern: "containment vs CSAT trend / are we deflecting at the cost of experience",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Dual-trend containment_rate and CSAT over time to expose false-containment backfire.",
    },
    {
      questionPattern: "service KPI scorecard",
      exhibitKind: "table",
      note: "Containment, FCR, AHT, cost per contact, CSAT, abandonment, escalation, occupancy vs planning ranges.",
    },
    {
      questionPattern: "what drives value at risk in this program / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (false containment, KB quality, CSAT guardrail) on realizable value.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Agent-assist sequenced first — fastest, lowest-risk win with a retention dividend",
      "A governed, fresh knowledge base every AI bet draws from",
      "Containment measured net of re-contacts and abandons, with a clean human escape always available",
      "CSAT segmented by journey so deflection's experience cost stays visible",
      "Automation scoped to the narrow intent band that genuinely stays satisfied",
    ],
    failureDrivers: [
      "Aggressive containment that traps customers and dumps cold escalations — re-contacts and CSAT erase the savings",
      "Stale knowledge base feeding bots and copilots wrong answers",
      "Vanity containment counted at session start, never reconciled to cost-to-serve",
      "Over-automating empathy-heavy or edge-case intents, cratering CSAT and forcing a pullback",
      "Automating easy contacts while ignoring the burnout/occupancy spike on the hard work left behind",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Agent-assist adopts fastest because it visibly helps agents and shows up in " +
      "AHT/ramp within a quarter; supervisors and QA follow once auto-summary and " +
      "near-100% QA prove out. Customer-facing self-service adoption depends on " +
      "intent shoppability and trust — it scales intent-by-intent, expanding only " +
      "as net containment and CSAT hold, with a human escape that keeps trust intact.",
    roiClarity: "medium",
    roiClarityBasis:
      "AHT/assist value is directly measurable in ACD timers and cleanly " +
      "attributable. Containment and cost-to-serve value are firm only when " +
      "re-contacts and abandons are netted out and reconciled to the GL — without " +
      "that discipline ROI is routinely overstated. CSAT/loyalty effects are real " +
      "but loosely attributable, which is what holds overall clarity at medium.",
  },

  regulatoryFrame: {
    name: "Call recording & consent + consumer-protection conduct rules",
    relevance:
      "The dominant regulatory frame for AI in the contact center: recording, " +
      "transcribing, and AI-processing interactions requires appropriate " +
      "notice/consent, and automated responses on fees, eligibility, or rights " +
      "carry consumer-protection conduct risk. PCI DSS applies to payment-taking " +
      "contacts and TCPA/DNC to AI-driven outbound (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 draft)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
