// Consilium expert — Future of Work / Workforce Productivity (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2: it has no industry×function key. It answers the
// question every CXO is actually asking under the GenAI wave — "how does every
// persona/role in my company get work done more effectively, what does that
// realistically buy me, and how do I tell real productivity from the hype?"
//
// Anchoring doctrine. This expert is deliberately bound to the firm's Workforce
// Economics substrate concept: work is decomposed into towers → roles →
// rate-card units, and every estimate is run TWICE — a traditional baseline and
// an AI-native redesign — under a CAPACITY model (the honest framing is freed
// capacity reinvested into higher-value work, NOT mechanical effort-compression
// or a headcount-cut promise). The expert refuses the "20% faster therefore 20%
// fewer people" leap and insists on task-level decomposition and adoption
// reality before any dollar lands.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const futureOfWorkExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.future-of-work",
    expertName: "Future of Work & Workforce Productivity Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "future-of-work",
    scopeNote:
      "Horizontal across every function and industry: how each persona/role " +
      "gets work done more effectively with GenAI — tool adoption, role and " +
      "workflow redesign, skills/enablement, and the REALIZED (not hyped) " +
      "productivity value. Anchored to the Workforce Economics substrate " +
      "(towers → roles → rate-cards, 'estimate twice' traditional-vs-AI-native, " +
      "a CAPACITY model rather than effort-compression). Excludes function-" +
      "specific operating depth (revenue cycle, trading, merchandising, etc., " +
      "which are separate experts) and the IT-platform sourcing of the AI stack " +
      "itself (separate sourcing experts) beyond the workforce-tooling layer.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "ai_tool_adoption_rate",
        name: "AI tool adoption rate",
        definition:
          "Share of licensed/eligible employees who have meaningfully used the " +
          "GenAI tool at least once in the measurement window (activation, not " +
          "mere provisioning).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Enterprise copilot rollouts; activation commonly stalls well below " +
            "licensed seats in year one",
          label: "planning-range",
        },
        dataSource:
          "Tool admin/usage telemetry (M365/Workspace admin, copilot dashboards) joined to HRIS headcount",
        whyItMatters:
          "The first gate on every productivity claim — value is impossible if " +
          "people never activate the tool. A 90%-licensed / 35%-active estate is " +
          "the most common silent failure.",
      },
      {
        key: "weekly_active_usage",
        name: "Weekly active usage (depth of use)",
        definition:
          "Share of adopters who use the tool in a typical week, and the median " +
          "number of meaningful interactions per active user per week — depth, " +
          "not just first-touch activation.",
        unit: "% WAU / interactions per user-week",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 70,
          basis:
            "Sustained-usage cohorts in mature rollouts; habitual use is a " +
            "minority of nominal adopters early",
          label: "planning-range",
        },
        dataSource: "Tool usage telemetry; cohort retention curves by week-since-grant",
        whyItMatters:
          "Distinguishes a one-time try from an embedded habit. Value accrues to " +
          "habitual weekly users; the activation number flatters reality if depth " +
          "is not tracked.",
      },
      {
        key: "time_saved_per_task",
        name: "Time saved per task",
        definition:
          "Measured reduction in elapsed (or hands-on) time to complete a " +
          "defined, repeatable task with AI assistance vs the traditional " +
          "baseline, for the SAME quality bar.",
        unit: "% / minutes per task",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Controlled and field studies on drafting/coding/support tasks; " +
            "wide variance by task type and worker skill",
          label: "planning-range",
        },
        dataSource:
          "Task-level time studies / instrumented workflows comparing AI-assisted vs baseline cohorts",
        whyItMatters:
          "The atomic unit of the 'estimate twice' model — task-level time delta, " +
          "held to a constant quality bar, is the only honest input to a capacity " +
          "estimate. Self-reported global '%-faster' figures do not qualify.",
      },
      {
        key: "throughput_per_fte",
        name: "Throughput per FTE",
        definition:
          "Volume of completed work units (tickets, drafts, calls, code reviews, " +
          "claims, etc.) per full-time-equivalent per period, role-normalized.",
        unit: "work units per FTE per period",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Reported per-FTE throughput lift in role-specific deployments; " +
            "highly role- and baseline-dependent",
          label: "planning-range",
        },
        dataSource:
          "System-of-work output counts (ITSM, CRM, code repos, contact-center) per role / HRIS FTE",
        whyItMatters:
          "Translates task-level time savings into a capacity number a CFO can " +
          "act on — the bridge between 'faster per task' and 'more capacity per role'.",
      },
      {
        key: "cycle_time_reduction",
        name: "Cycle-time reduction",
        definition:
          "Reduction in end-to-end elapsed time for a multi-step process " +
          "(request-to-resolution, draft-to-publish, code-to-merge) attributable " +
          "to AI assistance.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 30,
          basis:
            "Process-level cycle-time deltas where AI removes wait/rework steps; " +
            "smaller than task-level gains due to hand-offs",
          label: "planning-range",
        },
        dataSource:
          "Process mining / workflow timestamps before vs after on matched cohorts",
        whyItMatters:
          "Catches the gap between task speed and process speed — hand-offs and " +
          "queues often eat task-level gains, so cycle time is the reality check " +
          "on workflow redesign.",
      },
      {
        key: "quality_error_rate",
        name: "Output quality / error rate",
        definition:
          "Defect, rework, or escalation rate of AI-assisted output vs the " +
          "traditional baseline — the guardrail that prevents speed from buying " +
          "quality debt.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 10,
          basis:
            "Rework/escalation rates on AI-assisted knowledge work; varies with " +
            "review discipline and task risk",
          label: "planning-range",
        },
        dataSource:
          "QA review samples, rework/escalation logs, customer-impact incidents on AI-assisted work",
        whyItMatters:
          "A time saving that raises error or rework rates is not a productivity " +
          "gain — it is cost displacement. Every capacity claim must hold quality " +
          "constant or net the rework out.",
      },
      {
        key: "license_utilization",
        name: "License utilization",
        definition:
          "Share of paid GenAI seats that are actively used in the period — the " +
          "shelfware detector.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 75,
          basis:
            "Paid-seat activation in enterprise deployments; large unused-seat " +
            "tails are common in blanket rollouts",
          label: "planning-range",
        },
        dataSource:
          "License management / SaaS spend management joined to tool usage telemetry",
        whyItMatters:
          "The cleanest waste signal and a direct cost line. Low utilization " +
          "means the firm is paying full price for partial adoption — and the ROI " +
          "denominator is inflated.",
      },
      {
        key: "redesigned_workflow_coverage",
        name: "Share of roles with redesigned workflows",
        definition:
          "Percentage of in-scope roles whose day-to-day workflow has been " +
          "explicitly redesigned around AI (new task allocation, review steps, " +
          "hand-offs) — not just given a tool.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Most early programs distribute tools without redesigning roles; " +
            "deliberate redesign is still a minority of the estate",
          label: "planning-range",
        },
        dataSource:
          "Role/workflow redesign inventory; HR + transformation-office records of redesigned role profiles",
        whyItMatters:
          "The single biggest separator between value-realizing and value-leaking " +
          "programs. Tools without role redesign produce 'productivity theater'; " +
          "redesigned roles convert time savings into reinvested capacity.",
      },
      {
        key: "employee_experience_enps",
        name: "Employee experience / eNPS (AI-affected roles)",
        definition:
          "Employee net-promoter or experience score among AI-affected roles, " +
          "tracking whether AI is perceived as augmentation or threat/burden.",
        unit: "eNPS (-100 to +100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Knowledge-worker eNPS ranges; AI sentiment swings the score in " +
            "both directions depending on framing and job security",
          label: "planning-range",
        },
        dataSource:
          "Pulse surveys / engagement platform, segmented by AI-affected role",
        whyItMatters:
          "Adoption and retention live here. If employees read AI as a headcount " +
          "threat, shadow behavior and disengagement quietly cap realized value " +
          "regardless of the tool's capability.",
      },
      {
        key: "capacity_reinvested",
        name: "Capacity reinvested (vs cashed out)",
        definition:
          "Share of freed capacity (from time/throughput gains) that is " +
          "deliberately redeployed to higher-value work, backlog, or growth — vs " +
          "left idle or absorbed invisibly.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Realized-capacity studies; much freed time evaporates without an " +
            "explicit reinvestment plan",
          label: "planning-range",
        },
        dataSource:
          "Capacity-reinvestment tracking: backlog burndown, reallocation records, growth output vs freed hours",
        whyItMatters:
          "The honest bottom line of the CAPACITY model. Freed capacity that is " +
          "not reinvested or reduced is value on paper only; this metric is what " +
          "turns the 'estimate twice' delta into realized economics.",
      },
      {
        key: "skill_enablement_completion",
        name: "Skill / enablement completion",
        definition:
          "Share of in-scope employees who have completed role-relevant AI " +
          "enablement (prompting, tool-specific workflow, review discipline) to a " +
          "demonstrated-competence bar.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Enablement completion in funded programs; completion ≠ competence " +
            "unless tied to demonstrated use",
          label: "planning-range",
        },
        dataSource:
          "LMS completion records joined to post-enablement tool-usage telemetry",
        whyItMatters:
          "Enablement is the lead indicator for depth-of-use and quality. Untrained " +
          "rollouts plateau at shallow use; competence-gated enablement is what " +
          "moves weekly active usage and error rate together.",
      },
    ],

    painThemes: [
      {
        key: "pilot_purgatory",
        name: "Pilot purgatory",
        description:
          "A long tail of small, disconnected AI pilots that demo well but never " +
          "scale — each owned by a different team, none tied to a role-level " +
          "capacity case, so none crosses the threshold to enterprise rollout.",
        detectionSignal:
          "Many named pilots, few production deployments; no pilot has a " +
          "task-level baseline or a defined scale gate; pilot count rising while " +
          "adoption rate is flat.",
        diagnosticQuestion:
          "How many AI pilots are running, how many have reached production at " +
          "scale, and what specific gate must a pilot clear to graduate?",
      },
      {
        key: "shelfware_licenses",
        name: "Shelfware licenses",
        description:
          "Blanket seat purchases (copilot for everyone) where a large share of " +
          "paid licenses are never activated or lapse to inactivity, inflating " +
          "spend and the ROI denominator.",
        detectionSignal:
          "License utilization well below seats purchased; a long tail of " +
          "zero-usage accounts; renewal sized to headcount rather than active use.",
        diagnosticQuestion:
          "What is your license utilization, and is seat allocation driven by " +
          "demonstrated active use or by blanket headcount provisioning?",
      },
      {
        key: "productivity_theater",
        name: "Productivity theater (vanity metrics)",
        description:
          "Programs report activity proxies — prompts sent, messages drafted, " +
          "'hours saved' from self-report — that look impressive but never connect " +
          "to throughput, cycle time, quality, or reinvested capacity.",
        detectionSignal:
          "Headline metrics are usage counts and self-reported time savings; no " +
          "task-level baseline, no quality control, no capacity-reinvestment line.",
        diagnosticQuestion:
          "Which of your reported AI benefits are tied to a measured baseline and " +
          "a held-constant quality bar, and which are activity proxies?",
      },
      {
        key: "adoption_plateau",
        name: "Adoption plateau",
        description:
          "Early-adopter enthusiasm carries usage to a ceiling, then it stalls — " +
          "the majority never forms a habit because workflows, incentives, and " +
          "enablement were not redesigned to make AI the path of least resistance.",
        detectionSignal:
          "Usage S-curve flattens well below target; weekly active usage stuck; " +
          "gains concentrated in a power-user minority.",
        diagnosticQuestion:
          "Where has weekly active usage plateaued, and what is keeping the " +
          "majority of eligible users from forming a daily/weekly habit?",
      },
      {
        key: "shadow_ai",
        name: "Shadow AI",
        description:
          "Employees route work through unsanctioned consumer AI tools because " +
          "official tooling is slower, weaker, or blocked — moving real " +
          "productivity (and real data) outside governance and out of measurement.",
        detectionSignal:
          "Network/DLP signals of consumer-AI traffic; survey reports of " +
          "off-platform use; gap between official-tool usage and observed quality/speed.",
        diagnosticQuestion:
          "What evidence do you have of employees using unsanctioned AI tools, " +
          "and is it a governance gap, a capability gap in official tools, or both?",
      },
      {
        key: "no_role_redesign",
        name: "Tool drop without role redesign",
        description:
          "AI tools are distributed without changing what the role does, how " +
          "tasks are allocated, or how output is reviewed — so time savings leak " +
          "into idle slack instead of converting to reinvested capacity.",
        detectionSignal:
          "High tool adoption but flat throughput per FTE and flat cycle time; no " +
          "redesigned role profiles; managers cannot say what freed time is for.",
        diagnosticQuestion:
          "For roles with high AI adoption, has the role itself been redesigned, " +
          "and where is the freed capacity explicitly being reinvested?",
      },
      {
        key: "attribution_fog",
        name: "Value attribution fog",
        description:
          "Productivity moves for many reasons at once (process changes, demand " +
          "shifts, staffing); without matched cohorts or a baseline, AI is " +
          "credited (or blamed) for changes it did not cause.",
        detectionSignal:
          "No control/matched cohort, no pre/post baseline; benefit claims with " +
          "no counterfactual; finance unable to reconcile claimed savings to P&L.",
        diagnosticQuestion:
          "How are you isolating AI's contribution from other concurrent changes " +
          "— is there a baseline, a matched cohort, or a counterfactual?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "role_copilots",
        name: "Role-specific copilots (in-flow assistance)",
        valueMechanism:
          "Embed an AI assistant in the role's primary tool (mail, docs, CRM, " +
          "IDE, ticketing) so drafting, lookup, and summarization happen in-flow — " +
          "cutting time-per-task at a constant quality bar and freeing capacity " +
          "that is then reinvested rather than mechanically removed.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Tool usage telemetry by role and feature",
          "Task-level baseline times for the targeted tasks",
          "Access to the role's documents/data within governance",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Output must be reviewed — speed without review trades time for rework",
          "Avoid measuring success by prompts-sent; require throughput/quality deltas",
        ],
        metricsMoved: [
          "ai_tool_adoption_rate",
          "time_saved_per_task",
          "throughput_per_fte",
          "capacity_reinvested",
        ],
      },
      {
        key: "knowledge_assistant_retrieval",
        name: "Knowledge assistant / enterprise retrieval",
        valueMechanism:
          "Ground an assistant in the firm's own documents and systems so " +
          "employees get cited, current answers instead of hunting across wikis " +
          "and inboxes — collapsing search-and-find time and reducing rework from " +
          "stale or wrong information.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Curated, access-controlled corpus with freshness/lineage",
          "Entitlements model so retrieval respects who-can-see-what",
          "Query/usage logs for coverage and answer-quality measurement",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Retrieval must cite sources; uncited answers reintroduce rework risk",
          "Stale or over-broad corpora produce confident-wrong answers — govern freshness and access",
        ],
        metricsMoved: [
          "time_saved_per_task",
          "cycle_time_reduction",
          "quality_error_rate",
        ],
      },
      {
        key: "meeting_summarization",
        name: "Meeting capture, summarization & follow-up",
        valueMechanism:
          "Auto-transcribe, summarize, and extract action items from meetings " +
          "and long threads — recovering note-taking and recap time and reducing " +
          "dropped follow-ups, which shows up as cycle-time and coordination gains.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Meeting/recording and collaboration-suite access within policy",
          "Consent and retention configuration",
          "Baseline on coordination/recap time for affected roles",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Recording consent and retention are compliance-sensitive — configure before scale",
          "Summaries can omit nuance; humans own decisions and action ownership",
        ],
        metricsMoved: [
          "time_saved_per_task",
          "cycle_time_reduction",
          "weekly_active_usage",
        ],
      },
      {
        key: "code_assistant",
        name: "Code assistant (developer productivity)",
        valueMechanism:
          "AI completion, test generation, and code review assistance in the IDE " +
          "and PR flow — raising developer throughput and shortening code-to-merge " +
          "cycle time, with review discipline holding defect rates flat.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Repo / IDE telemetry and PR cycle-time data",
          "Baseline throughput and defect/escape rates",
          "Code-handling and IP/licensing policy for AI suggestions",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Accepted suggestions must be reviewed and tested — acceptance ≠ correctness",
          "Watch for defect/escape-rate drift; speed that adds bugs is not a gain",
        ],
        metricsMoved: [
          "throughput_per_fte",
          "cycle_time_reduction",
          "quality_error_rate",
        ],
      },
      {
        key: "agentic_task_automation",
        name: "Agentic task automation (multi-step task execution)",
        valueMechanism:
          "Delegate bounded, repeatable multi-step tasks (data gathering, routine " +
          "ticket handling, report assembly) to supervised agents — removing whole " +
          "task chains from human queues and converting them to reviewed, " +
          "exception-only work, which moves throughput and capacity directly.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Well-defined task boundaries and success criteria",
          "Tool/API access with scoped permissions and audit logging",
          "Exception-handling and escalation paths to humans",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Autonomous action needs scoped permissions and a full audit trail",
          "Only delegate well-bounded tasks; unbounded autonomy creates accountability gaps",
        ],
        metricsMoved: [
          "throughput_per_fte",
          "capacity_reinvested",
          "cycle_time_reduction",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "estimate_twice_capacity_model",
        name: "Estimate-twice workforce capacity model",
        description:
          "A workforce-economics model that decomposes work into towers → roles → " +
          "rate-card units and estimates each twice: a traditional baseline and an " +
          "AI-native redesign. The delta is expressed as CAPACITY (hours/FTE freed) " +
          "and explicitly routed to reinvestment, backlog, or growth — never " +
          "auto-converted to a headcount cut.",
        boundary:
          "Owns the task-level decomposition, the dual estimate, and the capacity " +
          "math feeding the business case; does not own the headcount decision " +
          "itself (that is a leadership/HR call against the capacity output).",
        humanAccountabilityPoint:
          "Chief Transformation Officer (jointly with Finance for the capacity-to-P&L bridge)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "adoption_enablement_engine",
        name: "Adoption & enablement engine",
        description:
          "A standing capability that drives activation, depth-of-use, and " +
          "competence: role-based enablement, champions/power-user networks, " +
          "in-flow nudges, and a usage-telemetry feedback loop that targets the " +
          "adoption plateau directly.",
        boundary:
          "Owns activation, enablement, and habit formation; does not own tool " +
          "selection or the underlying platform engineering.",
        humanAccountabilityPoint: "Head of Learning & Enablement / Adoption Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "role_redesign_playbook",
        name: "Role & workflow redesign playbook",
        description:
          "A repeatable method to redesign a role around AI: identify the role's " +
          "task portfolio, reallocate tasks between human and AI, insert review " +
          "and exception steps, and define where freed capacity is reinvested — " +
          "producing a redesigned role profile, not just a tool grant.",
        boundary:
          "Owns the redesigned role profile and workflow; does not own performance " +
          "management or compensation changes that may follow.",
        humanAccountabilityPoint: "Function leader for the role (with HR business partner)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "productivity_measurement_baseline",
        name: "Productivity measurement & attribution baseline",
        description:
          "An instrumentation and evaluation layer that establishes task-level " +
          "baselines, runs matched/cohort comparisons, holds quality constant, and " +
          "reconciles claimed savings to throughput, cycle time, and reinvested " +
          "capacity — the antidote to productivity theater and attribution fog.",
        boundary:
          "Owns measurement methodology and the baseline; does not set targets or " +
          "make the investment decision — it supplies the honest numbers those use.",
        humanAccountabilityPoint: "Transformation-office Analytics Lead (with Finance)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "ai_governance_guardrail",
        name: "Workforce AI governance & shadow-AI guardrail",
        description:
          "A policy-plus-platform pattern that gives employees sanctioned, " +
          "capable tools inside governance (data handling, entitlements, audit) so " +
          "real work stays on-platform — closing the shadow-AI gap by making the " +
          "official path the easiest path.",
        boundary:
          "Owns acceptable-use policy, sanctioned-tool provisioning, and monitoring; " +
          "does not own model/vendor security certification (separate function).",
        humanAccountabilityPoint: "Chief AI Officer / Chief Information Security Officer (joint)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Workforce-productivity value is realized as CAPACITY, not as automatic " +
        "headcount reduction — the honest framing. The chain is: task-level time " +
        "savings (held to a constant quality bar) aggregate to throughput-per-FTE " +
        "and cycle-time gains; those gains become freed capacity per role; and the " +
        "capacity only becomes economic value if it is deliberately reinvested " +
        "into backlog, growth, or higher-value work — or, where leadership chooses, " +
        "translated to cost. Each step is haircut: adoption decay, capacity that " +
        "leaks into slack, quality/rework give-back, and attribution uncertainty " +
        "all erode the headline. The 'estimate twice' discipline (traditional vs " +
        "AI-native, decomposed to towers/roles/rate-cards) is what keeps the " +
        "business case from booking a 20%-faster claim as a 20%-headcount saving.",
      dominantHaircutFactors: [
        {
          factor: "Adoption decay (activation → habit gap)",
          rationale:
            "Time savings only count for people who actually use the tool " +
            "habitually; the gap between licensed seats and weekly active users " +
            "removes a large share of the theoretical benefit.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Activation-to-habit drop-off observed across enterprise copilot rollouts",
            label: "planning-range",
          },
        },
        {
          factor: "Capacity leakage (freed time not reinvested)",
          rationale:
            "Without role redesign and an explicit reinvestment plan, freed " +
            "minutes dissipate into slack and never convert to throughput or cost.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Realized-vs-theoretical capacity studies where reinvestment was not engineered",
            label: "planning-range",
          },
        },
        {
          factor: "Quality / rework give-back",
          rationale:
            "Some speed is paid back as review burden, rework, or escalations; " +
            "net value must subtract the quality give-back to be honest.",
          typicalHaircut: {
            low: 0.05,
            high: 0.2,
            basis:
              "Rework/escalation overhead on AI-assisted output before review discipline matures",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution uncertainty",
          rationale:
            "Concurrent process, demand, and staffing changes mean part of any " +
            "measured gain is not AI's — unattributed lift must be discounted.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Counterfactual gaps where no matched cohort or baseline isolates AI's contribution",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Time saved per targeted task",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Controlled/field studies on drafting, retrieval, coding, and support tasks",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_saved_per_task at a held-constant quality bar",
        },
        {
          lever: "Throughput per FTE uplift (redesigned roles)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Per-FTE throughput lift in roles with explicit workflow redesign, not just tool grants",
            label: "planning-range",
          },
          measuredAs: "Relative increase in throughput_per_fte for redesigned roles",
        },
        {
          lever: "Capacity reinvested (realized share of freed time)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Share of freed capacity demonstrably redeployed when a reinvestment plan exists",
            label: "planning-range",
          },
          measuredAs:
            "capacity_reinvested — freed hours redeployed as a fraction of freed hours",
        },
      ],
      timeToValueBand:
        "In-flow copilots and meeting/summarization: 1-2 quarters to first measured " +
        "task-level savings, but 3-4+ quarters to habitual depth-of-use. Role " +
        "redesign and realized capacity reinvestment: 2-4 quarters per wave once a " +
        "measurement baseline exists. Agentic task automation: 3-6+ quarters given " +
        "bounding, permissions, and governance ramp.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Collaboration & productivity suite",
          role: "Where most knowledge work happens and where in-flow copilots and usage telemetry live.",
          examples: ["Microsoft 365 / Copilot", "Google Workspace / Gemini", "Slack", "Zoom"],
        },
        {
          name: "Learning management / enablement (LMS)",
          role: "System of record for skill/enablement completion and competence tracking.",
          examples: ["Cornerstone", "Docebo", "Workday Learning", "LinkedIn Learning"],
        },
        {
          name: "HRIS / workforce system",
          role: "Headcount, role taxonomy, FTE, and the spine the capacity model joins to.",
          examples: ["Workday", "SAP SuccessFactors", "Oracle HCM"],
        },
        {
          name: "Engagement / experience platform",
          role: "Pulse surveys and eNPS for AI-affected roles — the adoption-sentiment signal.",
          examples: ["Glint", "Qualtrics EX", "Culture Amp"],
        },
        {
          name: "AI usage & license telemetry",
          role: "Adoption, weekly active usage, and license utilization measurement.",
          examples: ["Copilot/admin dashboards", "SaaS management (e.g. license-utilization tooling)"],
        },
      ],
      roles: [
        {
          title: "Chief Human Resources Officer (CHRO)",
          accountability:
            "Workforce strategy, role taxonomy, skills/enablement, and the people side of AI adoption.",
        },
        {
          title: "Chief AI / Transformation Officer",
          accountability:
            "The AI productivity program end-to-end — portfolio, adoption, role redesign, and realized capacity.",
        },
        {
          title: "Function / business-unit leaders",
          accountability:
            "Adoption and role redesign within their function and reinvestment of freed capacity.",
        },
        {
          title: "Head of Learning & Enablement",
          accountability:
            "Activation, competence, and habit formation across the AI-affected workforce.",
        },
        {
          title: "Finance / FP&A partner",
          accountability:
            "The capacity-to-P&L bridge — translating freed capacity to reinvestment or cost honestly.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Data privacy (GDPR / CCPA and equivalents)",
          relevance:
            "Governs employee and customer data flowing through AI tools, monitoring, and usage telemetry.",
        },
        {
          name: "Works councils / labor relations",
          relevance:
            "In many jurisdictions, role redesign, monitoring, and AI deployment affecting work require consultation/co-determination.",
        },
        {
          name: "Employee monitoring & workplace surveillance law",
          relevance:
            "Productivity telemetry and meeting capture are monitoring — consent, notice, and proportionality rules apply.",
        },
        {
          name: "AI governance & transparency frameworks (e.g. EU AI Act, NIST AI RMF)",
          relevance:
            "Shape acceptable use, risk classification, and disclosure for AI used in the workplace.",
        },
      ],
      canonicalTerms: [
        {
          term: "Capacity vs compression",
          definition:
            "Capacity = freed time reinvested in higher-value work; compression = the (often false) assumption that time saved equals proportional headcount/effort removed. This expert models capacity.",
        },
        {
          term: "Estimate twice",
          definition:
            "Estimating each unit of work both as a traditional baseline and as an AI-native redesign, decomposed to towers/roles/rate-cards, so the delta is explicit and honest.",
        },
        {
          term: "Copilot",
          definition:
            "An AI assistant embedded in the role's primary tool that provides in-flow help (drafting, lookup, summarization), with the human retaining the decision.",
        },
        {
          term: "Adoption curve",
          definition:
            "The S-curve from activation to habitual weekly use; the plateau between early adopters and the majority is where most programs stall.",
        },
        {
          term: "Task-level automation",
          definition:
            "Automating bounded tasks (or task chains) within a role rather than the whole job — the unit at which AI realistically removes work.",
        },
        {
          term: "Shelfware",
          definition:
            "Paid licenses that are provisioned but never actively used — a direct waste signal and an inflated ROI denominator.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "AI tool adoption / weekly active usage",
        authoritativeSource:
          "Tool admin & usage telemetry (copilot/M365/Workspace dashboards) joined to HRIS headcount",
        whatGoodEvidenceLooksLike:
          "Active-user counts and weekly-active cohorts by role and week-since-grant, against eligible headcount — distinguishing activation from habit.",
        weakEvidenceToReject:
          "Seats provisioned, or prompts-sent totals, presented as 'adoption'.",
      },
      {
        claim: "Time saved per task",
        authoritativeSource:
          "Task-level time studies or instrumented workflows comparing AI-assisted vs baseline cohorts at the same quality bar",
        whatGoodEvidenceLooksLike:
          "A defined repeatable task, a measured baseline time, a matched comparison, and a quality check confirming the bar was held.",
        weakEvidenceToReject:
          "A self-reported global '%-faster' figure with no task definition, baseline, or quality control.",
      },
      {
        claim: "Throughput / capacity uplift per FTE",
        authoritativeSource:
          "System-of-work output counts (ITSM/CRM/repos/contact-center) per FTE, before vs after, on matched cohorts",
        whatGoodEvidenceLooksLike:
          "Role-normalized work-unit counts per FTE for a redesigned-role cohort vs a control, with the same demand mix.",
        weakEvidenceToReject:
          "An extrapolation from time-saved-per-task to headcount with no throughput measurement or control cohort.",
      },
      {
        claim: "Realized capacity reinvestment / ROI",
        authoritativeSource:
          "Capacity-reinvestment records (backlog burndown, reallocation, growth output) reconciled with Finance to the P&L",
        whatGoodEvidenceLooksLike:
          "Freed hours traced to a specific reinvestment or cost outcome, net of haircuts, reconciled by Finance.",
        weakEvidenceToReject:
          "A theoretical dollar saving computed as (time saved × loaded rate × headcount) with no reinvestment or P&L reconciliation.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your AI tool adoption rate and weekly active usage by function — and how big is the gap between licensed seats and habitual users?",
      "For which tasks do you have a measured time-saved baseline at a constant quality bar, versus self-reported '%-faster' claims?",
      "What share of in-scope roles have had their workflow explicitly redesigned around AI, not just been given a tool?",
      "Where does freed capacity actually go — is there an explicit reinvestment plan, or does it leak into slack?",
      "How do you isolate AI's contribution from other concurrent changes (process, demand, staffing)?",
      "What is your license utilization, and how is seat allocation decided — demonstrated use or blanket headcount?",
      "What evidence do you have of shadow AI, and is it a governance gap or a capability gap in your sanctioned tools?",
      "How is the people side managed — enablement competence, eNPS of AI-affected roles, and whether employees read AI as augmentation or threat?",
    ],
    maturitySignals: [
      "Work is decomposed to task level and estimated twice (traditional vs AI-native) before any capacity or dollar claim.",
      "Adoption is measured as habitual weekly active use by role, not as seats provisioned.",
      "Roles are explicitly redesigned and freed capacity is routed to a named reinvestment, with Finance reconciling the bridge.",
      "Productivity claims carry a baseline, a held-constant quality bar, and a matched/counterfactual comparison.",
      "Sanctioned tools are capable enough that shadow AI is rare, and AI-affected-role eNPS is tracked.",
    ],
    redFlags: [
      "Headline benefits are activity proxies (prompts sent, hours self-reported) with no baseline or quality control.",
      "Time-saved-per-task is extrapolated straight to headcount savings with no throughput measurement or reinvestment plan.",
      "Many pilots, almost no production at scale, and no defined gate for graduating a pilot.",
      "License utilization is low and unexamined while seats are renewed at full headcount.",
      "Tools are widely adopted but throughput per FTE and cycle time are flat — and no one can say what freed time is for.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Suite-embedded copilots (Microsoft, Google)",
        category: "In-flow productivity copilots bundled with the collaboration suite",
        switchingCost:
          "High — fused to the M365/Workspace estate and identity; switching means moving the productivity suite itself.",
        renewalDynamics:
          "Per-seat add-on to the enterprise agreement; the negotiation is right-sizing seats to active users, not blanket headcount.",
      },
      {
        vendorName: "Frontier LLM / assistant providers (Anthropic, OpenAI, others)",
        category: "General assistants, enterprise chat, and API for retrieval/agentic use",
        switchingCost:
          "Moderate — model and assistant layer is increasingly swappable via abstraction; prompt/workflow and data-integration lock-in is the real cost.",
        renewalDynamics:
          "Fast-moving pricing and capability; favor consumption transparency, model-portability, and exit rights over multi-year lock-in.",
      },
      {
        vendorName: "Specialized productivity tools (code assistants, meeting/notetakers, vertical copilots)",
        category: "Point copilots for developers, meetings, sales, support, etc.",
        switchingCost:
          "Low-to-moderate — workflow-embedded but generally replaceable; watch data export and integration depth.",
        renewalDynamics:
          "Crowded, rapidly consolidating market; usage-based and outcome-based terms are increasingly available — negotiate them.",
      },
      {
        vendorName: "Enablement & adoption / change partners",
        category: "Training, change management, and adoption services",
        switchingCost:
          "Low — services are re-sourceable; the asset is the internal champion network and enablement content they leave behind.",
        renewalDynamics:
          "Scope-and-outcome based; structure to transfer capability in-house rather than create a standing dependency.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the collaboration suite the copilots ride on; the model/assistant layer is increasingly portable, so the value frontier (and negotiating room) is in seat right-sizing, consumption transparency, and avoiding workflow/data lock-in around point tools.",
    negotiationLevers: [
      "Right-size seats to demonstrated active use, not blanket headcount (kills shelfware spend)",
      "Consumption transparency and model-portability to avoid assistant-layer lock-in",
      "Outcome/usage-based pricing tied to measured adoption and throughput where available",
      "Data export, audit, and exit rights as contractual requirements",
      "Pilot-to-scale gating with a defined graduation metric before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      adoption_metric: [
        "tool usage telemetry",
        "HRIS eligible-headcount join",
        "week-since-grant cohort",
      ],
      productivity_claim: [
        "task-level baseline",
        "matched/cohort comparison",
        "held-constant quality bar",
      ],
      throughput_claim: [
        "system-of-work output counts per FTE",
        "before/after on matched cohorts",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (adoption decay, capacity leakage, quality, attribution)",
      ],
      capacity_realization: [
        "freed-capacity measurement",
        "reinvestment/cost record",
        "Finance P&L reconciliation",
      ],
    },
    citationStandard:
      "Adoption and productivity claims cite the telemetry/output source, the " +
      "period, and the comparison basis (baseline + cohort). Productivity claims " +
      "state whether the quality bar was held constant. Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied " +
      "(adoption decay, capacity leakage, quality give-back, attribution) — never " +
      "a single asserted ROI, and never time-saved extrapolated straight to headcount.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no task-level baseline — frame time savings as an industry planning range, not their measured number.",
      "Only seats/activity proxies are available — present adoption as nominal, flag that habitual use and value are unproven.",
      "Capacity is freed but no reinvestment record exists — frame value as potential, contingent on reinvestment.",
      "A headcount or dollar saving is requested without throughput data — model capacity, hedge the conversion to cost as a leadership decision.",
      "Vendor-reported productivity outcomes are cited — mark as vendor claims pending tenant validation.",
    ],
    inferenceLanguage: [
      "Across enterprise GenAI rollouts, task-level time savings typically run...",
      "Without your task-level baseline, the industry pattern suggests freed capacity of...",
      "Peer programs at this scale commonly see adoption plateau around...",
      "This is a capacity figure; converting it to cost is a leadership decision your data hasn't yet made.",
    ],
    flagWithoutEvidence: [
      "A specific headcount or dollar saving for this tenant",
      "This tenant's actual adoption rate or time-saved-per-task",
      "A claim that freed capacity here has been (or will be) reinvested or cashed out",
      "A specific ROI number for this tenant's AI productivity program",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "adoption by function / who is actually using AI",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Adoption rate and weekly active usage by function/role to expose the activation-to-habit gap.",
    },
    {
      questionPattern: "traditional vs AI-native estimate (estimate twice)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from traditional baseline to AI-native, showing capacity freed and each haircut, ending at capacity reinvested.",
    },
    {
      questionPattern: "capacity by tower/role / where the freed time is",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack freed capacity by tower/role using the workforce-economics decomposition.",
    },
    {
      questionPattern: "value sensitivity / which haircut bites hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of adoption decay, capacity leakage, quality give-back, and attribution on realized value.",
    },
    {
      questionPattern: "workforce productivity scorecard",
      exhibitKind: "table",
      note: "Adoption, weekly active usage, time saved per task, throughput per FTE, license utilization, redesigned-role coverage, eNPS, capacity reinvested vs planning ranges.",
    },
    {
      questionPattern: "adoption curve over time / where usage plateaued",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend weekly active usage by cohort to locate the adoption plateau.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Work is decomposed to task level and estimated twice before any capacity or dollar claim",
      "Roles are explicitly redesigned and freed capacity is routed to a named reinvestment",
      "Adoption is engineered (enablement, champions, in-flow nudges) and measured as habitual weekly use",
      "A measurement baseline with matched cohorts holds quality constant and isolates AI's contribution",
      "Sanctioned tools are capable enough that shadow AI is rare, and the people side (eNPS, security framing) is managed",
    ],
    failureDrivers: [
      "Tools distributed without role redesign — time savings leak into slack ('productivity theater')",
      "Headcount/dollar savings extrapolated from time-saved-per-task with no throughput or reinvestment evidence",
      "Pilot purgatory: many demos, no scale gate, adoption flat",
      "Shelfware: blanket seats, low utilization, ROI denominator inflated",
      "Adoption plateau and weak enablement leave value in a power-user minority; employees read AI as a threat",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Power users and tech-forward roles (developers, analysts, knowledge workers) " +
      "activate first and form habits fast; the majority stalls at a plateau unless " +
      "workflows, enablement, and incentives make AI the path of least resistance. " +
      "Sentiment is bimodal — augmentation framing accelerates, headcount-threat " +
      "framing triggers shadow behavior and disengagement.",
    roiClarity: "low",
    roiClarityBasis:
      "Productivity attribution is genuinely hard: gains are diffuse across many " +
      "roles, confounded by concurrent process/demand/staffing changes, and most " +
      "firms lack task-level baselines or matched cohorts. The capacity is real but " +
      "often does not show up in the P&L unless it is deliberately reinvested or " +
      "converted to cost — so ROI clarity is low until a measurement baseline and a " +
      "capacity-to-P&L bridge exist. This is the honest position: do not promise a " +
      "firm ROI from self-reported time savings.",
  },

  regulatoryFrame: {
    name: "Workforce data privacy, monitoring, and labor consultation",
    relevance:
      "The dominant cross-cutting frame: productivity telemetry and meeting " +
      "capture are employee monitoring (consent/notice/proportionality); AI " +
      "tools process employee and customer data under GDPR/CCPA; and role " +
      "redesign affecting work can trigger works-council/labor consultation in " +
      "many jurisdictions. AI-governance frameworks (EU AI Act, NIST AI RMF) " +
      "shape acceptable use (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 draft)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
