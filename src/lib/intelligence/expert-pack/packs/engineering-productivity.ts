// Consilium expert — Software & Engineering Productivity / AI-native SDLC (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every engineering and technology leader is asking under the GenAI
// wave: "how does AI across the software lifecycle — code assistants, test
// generation, code review, CI/CD, agentic tasks — actually make my engineering
// organization faster and SAFER, what does that realistically buy me, and how
// do I tell real delivery improvement from vanity velocity?"
//
// Honesty doctrine. This expert is built around two non-negotiable truths.
// First, "lines of code", commit counts, and naive velocity are VANITY metrics —
// AI inflates them trivially and they correlate poorly with delivered value.
// The DORA frame (throughput + stability TOGETHER) is the honest unit: you must
// measure delivery throughput and quality/stability as a paired system, because
// speed bought with rising change-failure or escaped defects is not a gain, it
// is deferred cost. Second, adoption depends on DEVELOPER TRUST: assistants that
// produce plausible-but-wrong code, or that are imposed as a surveillance/
// productivity-policing tool, get quietly abandoned or gamed. The expert refuses
// the "AI writes X% of our code therefore X% productivity" leap and insists on
// throughput-and-stability measurement, review discipline, and developer
// experience before any business case lands.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const engineeringProductivityExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.engineering-productivity",
    expertName: "Software & Engineering Productivity Expert (AI-native SDLC)",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "engineering-productivity",
    scopeNote:
      "Horizontal across every engineering organization and industry: how AI " +
      "across the software lifecycle — code assistants, AI code review and test " +
      "generation, CI/CD automation, agentic developer tasks, platform " +
      "engineering and developer experience — actually improves delivery, held " +
      "to the DORA frame (throughput AND stability together) and to developer " +
      "trust as the adoption gate. Anchored to the honest position that lines of " +
      "code, commit counts, and naive velocity are VANITY metrics. Excludes the " +
      "commercial sourcing of the AI/dev-tool stack itself (a separate sourcing " +
      "expert beyond the developer-tooling layer), function-specific operating " +
      "depth in non-engineering domains, and broad workforce-economics modeling " +
      "outside the engineering org (a separate Future-of-Work expert).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "deployment_frequency",
        name: "Deployment frequency",
        definition:
          "How often the organization successfully releases to production for a " +
          "given service/team — a DORA throughput metric measuring delivery " +
          "cadence, not code volume.",
        unit: "deployments per service per period (or elite/high/medium/low band)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1,
          high: 30,
          basis:
            "DORA performance bands span on-demand (multiple/day) for elite to " +
            "weekly/monthly for low; wide variance by service architecture and " +
            "deployment automation",
          label: "planning-range",
        },
        dataSource:
          "CI/CD and deployment pipeline records (e.g. GitHub Actions, GitLab, Argo, Spinnaker) per service",
        whyItMatters:
          "A core DORA throughput signal — but only honest when read WITH change " +
          "failure rate. High deploy frequency with rising failures is instability, " +
          "not productivity; the pair is the unit, never the speed alone.",
      },
      {
        key: "lead_time_for_changes",
        name: "Lead time for changes",
        definition:
          "Elapsed time from code committed to that code running successfully in " +
          "production — a DORA throughput metric for end-to-end delivery speed.",
        unit: "hours (or elite/high/medium/low band)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 168,
          basis:
            "DORA bands run from under an hour (elite) to a week-plus (low); " +
            "dominated by review wait, batch size, and pipeline automation maturity",
          label: "planning-range",
        },
        dataSource:
          "Version control + CI/CD timestamps (commit → merge → deploy) per service",
        whyItMatters:
          "Captures the whole delivery path, not just coding speed. AI that speeds " +
          "authoring but leaves review queues and manual gates untouched barely " +
          "moves lead time — which is why this is a better signal than velocity.",
      },
      {
        key: "change_failure_rate",
        name: "Change failure rate",
        definition:
          "Share of production deployments that result in degraded service " +
          "requiring remediation (rollback, hotfix, patch) — a DORA stability " +
          "metric that guards throughput against quality debt.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "DORA stability bands span roughly 0-15% (elite/high) to 30%+ (low); " +
            "AI-assisted code can push this up if review discipline lags",
          label: "planning-range",
        },
        dataSource:
          "Deployment + incident/rollback records correlated to releases (CI/CD + incident management)",
        whyItMatters:
          "The stability half of the DORA pair and the honesty check on AI speed. " +
          "If assistants raise deploy frequency but also change failure rate, the " +
          "organization is shipping faster AND breaking more — a false win.",
      },
      {
        key: "mttr",
        name: "Mean time to restore (MTTR)",
        definition:
          "Average time to recover service after a production failure — a DORA " +
          "stability metric for resilience and incident response.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 24,
          basis:
            "DORA bands span under an hour (elite) to over a day (low); driven by " +
            "observability, rollback automation, and on-call maturity",
          label: "planning-range",
        },
        dataSource:
          "Incident management / observability platform (e.g. PagerDuty, Opsgenie, Datadog) restore timestamps",
        whyItMatters:
          "Stability is not just avoiding failure but recovering fast. AI can help " +
          "(incident summarization, suggested fixes) or hurt (opaque generated code " +
          "is harder to debug under pressure) — so MTTR must be tracked through any rollout.",
      },
      {
        key: "pr_cycle_time",
        name: "Pull-request cycle time",
        definition:
          "Elapsed time from a pull request being opened to it being merged, " +
          "decomposable into time-to-first-review, review iterations, and " +
          "time-to-merge.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 72,
          basis:
            "Healthy teams merge within a day or so; long tails reflect review " +
            "bottlenecks, large batch sizes, and waiting more than coding",
          label: "planning-range",
        },
        dataSource:
          "Version control / code-review platform PR timestamps (GitHub, GitLab, Bitbucket)",
        whyItMatters:
          "Exposes where delivery actually stalls — usually review WAIT, not " +
          "authoring. AI authoring gains evaporate here if review capacity is the " +
          "constraint, which is why cycle time, not LOC, is the real diagnostic.",
      },
      {
        key: "code_review_turnaround",
        name: "Code-review turnaround (time to first review)",
        definition:
          "Median time from a pull request being opened to its first substantive " +
          "human review — the review-capacity signal that gates flow.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 24,
          basis:
            "Responsive teams give first review within a few hours; slow review is " +
            "a leading cause of long PR cycle time and large, risky batches",
          label: "planning-range",
        },
        dataSource:
          "Code-review platform events (PR opened → first review submitted)",
        whyItMatters:
          "When AI increases the volume of code authored, review becomes the " +
          "bottleneck and the risk surface. Turnaround tells you whether reviewers " +
          "can keep pace honestly — or are rubber-stamping AI output.",
      },
      {
        key: "test_coverage",
        name: "Test coverage",
        definition:
          "Share of code (lines/branches) exercised by the automated test suite — " +
          "an imperfect but tracked proxy for safety-net depth, best read alongside " +
          "escaped defect rate.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis:
            "Pragmatic teams target a meaningful-coverage band rather than 100%; " +
            "very high coverage can signal low-value tests, very low signals risk",
          label: "planning-range",
        },
        dataSource:
          "CI test/coverage reports (e.g. coverage tooling in the pipeline) per service",
        whyItMatters:
          "Coverage is itself a vanity metric if chased blindly — AI can generate " +
          "many shallow tests that lift the number without catching defects. It is " +
          "tracked IN-RANGE and only meaningful paired with escaped defect rate.",
      },
      {
        key: "ai_assistant_adoption",
        name: "AI assistant adoption rate",
        definition:
          "Share of eligible developers who meaningfully use the AI coding " +
          "assistant in a typical week (active use, not mere license provisioning).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Developer copilot rollouts; sustained weekly use is commonly a " +
            "fraction of licensed seats, gated by trust and workflow fit",
          label: "planning-range",
        },
        dataSource:
          "Assistant usage telemetry (IDE plugin / copilot dashboards) joined to engineering headcount",
        whyItMatters:
          "The first gate on any AI-SDLC value claim — no benefit is possible " +
          "without active use. Low adoption usually signals a trust problem " +
          "(plausible-wrong suggestions) or workflow friction, not laziness.",
      },
      {
        key: "ai_suggestion_acceptance_rate",
        name: "AI suggestion acceptance rate",
        definition:
          "Share of AI code suggestions developers accept (keep, possibly edited) " +
          "rather than reject — a usage-quality proxy, NOT a productivity or value " +
          "measure on its own.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 20,
          high: 40,
          basis:
            "Reported acceptance for inline code completion; varies sharply by " +
            "language, codebase, and task — a high number alone is not value",
          label: "planning-range",
        },
        dataSource:
          "AI assistant telemetry (suggestions shown vs accepted vs retained-after-edit)",
        whyItMatters:
          "A trust/fit signal — too low means suggestions are unhelpful or " +
          "untrusted, suspiciously high can mean uncritical acceptance. It is " +
          "tracked IN-RANGE precisely because optimizing it as a target is gameable.",
      },
      {
        key: "escaped_defect_rate",
        name: "Escaped defect rate",
        definition:
          "Rate of defects that reach production (escape pre-production testing " +
          "and review) per release or per unit of work — the true quality outcome " +
          "behind coverage and acceptance proxies.",
        unit: "defects per release (or per KLOC changed)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 5,
          basis:
            "Escaped-defect density varies widely by domain and test maturity; " +
            "the directional ask is downward through any AI rollout, not a fixed bar",
          label: "planning-range",
        },
        dataSource:
          "Defect/incident tracking correlated to releases (bug tracker + incident management)",
        whyItMatters:
          "The quality reality check on speed and on AI-generated code. If deploy " +
          "frequency rises while escaped defects rise, AI is manufacturing latent " +
          "risk — this metric, not coverage, tells the honest story.",
      },
      {
        key: "developer_satisfaction_enps",
        name: "Developer satisfaction / eNPS",
        definition:
          "Developer experience and net-promoter sentiment, including trust in and " +
          "perceived helpfulness of AI tooling — the adoption-and-retention signal " +
          "(aligned with SPACE-framework satisfaction).",
        unit: "eNPS (-100 to +100) / DevEx index",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Engineering-org eNPS ranges; AI tooling swings sentiment in both " +
            "directions depending on trust, friction, and whether it is framed as surveillance",
          label: "planning-range",
        },
        dataSource:
          "Developer experience surveys / pulse (segmented by team and by AI tool exposure)",
        whyItMatters:
          "Adoption and retention live here. If developers distrust the assistant " +
          "or read productivity telemetry as surveillance, they disengage or game " +
          "it — quietly capping realized value regardless of tool capability.",
      },
      {
        key: "flow_focus_time",
        name: "Flow / focus time",
        definition:
          "Share of an engineer's working time spent in uninterrupted focused " +
          "work versus toil (manual ops, waiting on builds/reviews, context " +
          "switching) — a developer-experience throughput driver.",
        unit: "% of working time (or focus hours per developer-week)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Self-reported and instrumented focus-time studies; toil and " +
            "interruption commonly consume a large share of the engineering day",
          label: "planning-range",
        },
        dataSource:
          "Developer experience surveys plus calendar/build/CI wait instrumentation",
        whyItMatters:
          "Much AI-SDLC value is removing toil and wait, not typing faster. Flow " +
          "time captures whether automation actually freed cognitive capacity — the " +
          "honest counterweight to authoring-speed vanity claims.",
      },
    ],

    painThemes: [
      {
        key: "vanity_velocity",
        name: "Vanity velocity (LOC / commit / story-point theater)",
        description:
          "The organization measures and celebrates output volume — lines of " +
          "code, commits, story points, 'AI wrote X% of our code' — which AI " +
          "inflates trivially and which correlate poorly with delivered value or " +
          "stability, masking whether anything actually got better.",
        detectionSignal:
          "Headline AI benefits are LOC/commit/acceptance-rate figures or a " +
          "'%-of-code-AI-generated' stat; no paired DORA stability metric; deploy " +
          "frequency or velocity reported without change failure rate.",
        diagnosticQuestion:
          "Which of your reported AI productivity gains are tied to DORA " +
          "throughput-AND-stability outcomes, and which are output-volume proxies " +
          "like lines of code, commits, or suggestion acceptance?",
      },
      {
        key: "review_bottleneck",
        name: "Review bottleneck (authoring outruns review)",
        description:
          "AI raises the volume and speed of code authored, but human review " +
          "capacity is unchanged — so pull requests pile up, cycle time grows, and " +
          "reviewers either become the constraint or start rubber-stamping AI output.",
        detectionSignal:
          "Rising PR throughput but flat or growing PR cycle time and review " +
          "turnaround; large PRs; reviewers approving faster than they could " +
          "plausibly read; escaped defects creeping up.",
        diagnosticQuestion:
          "Since AI adoption, has PR cycle time and code-review turnaround held or " +
          "improved — or has authoring simply outrun your review capacity?",
      },
      {
        key: "quality_debt_from_speed",
        name: "Quality debt bought with speed",
        description:
          "Deploy frequency and authoring speed rise while change failure rate, " +
          "MTTR, or escaped defects quietly climb — speed is being financed by " +
          "deferred quality cost that surfaces later as incidents and rework.",
        detectionSignal:
          "Throughput metrics improving while stability metrics (change failure " +
          "rate, MTTR, escaped defects) degrade or are simply not tracked alongside.",
        diagnosticQuestion:
          "Are your DORA stability metrics (change failure rate, MTTR, escaped " +
          "defects) holding or improving as throughput rises, or are you trading " +
          "stability for speed?",
      },
      {
        key: "developer_distrust",
        name: "Developer distrust of AI suggestions",
        description:
          "Assistants that produce plausible-but-wrong code, hallucinated APIs, or " +
          "suggestions that don't fit the codebase erode trust; developers turn the " +
          "tool off, ignore it, or spend more time verifying than they save.",
        detectionSignal:
          "Low or declining acceptance rate, low weekly active adoption despite " +
          "licenses, survey comments about wrong/irrelevant suggestions, power-user " +
          "concentration with a long inactive tail.",
        diagnosticQuestion:
          "Do your developers trust the assistant's suggestions — what are " +
          "acceptance and active-use rates, and what do they say about correctness " +
          "and fit to your codebase?",
      },
      {
        key: "surveillance_framing",
        name: "Productivity surveillance framing",
        description:
          "Per-developer productivity telemetry (keystrokes, LOC, acceptance) is " +
          "used to rank or police individuals; engineers respond by gaming metrics " +
          "or disengaging, destroying both trust and the validity of the data.",
        detectionSignal:
          "Individual-level productivity dashboards used in performance reviews; " +
          "metric gaming (padded commits, trivial PRs); falling eNPS; resistance to " +
          "instrumentation framed as monitoring.",
        diagnosticQuestion:
          "Is AI/productivity telemetry used to improve the system (team-level, " +
          "diagnostic) or to rank individuals — and how do developers perceive it?",
      },
      {
        key: "ci_cd_toil_and_flake",
        name: "CI/CD toil and flaky pipelines",
        description:
          "Slow, flaky, or manual delivery pipelines mean developers wait on " +
          "builds, re-run flaky tests, and shepherd manual gates — toil that caps " +
          "lead time and deployment frequency no matter how fast code is authored.",
        detectionSignal:
          "Long or unreliable build times, high flaky-test re-run rate, manual " +
          "release steps, lead time dominated by pipeline/wait rather than coding.",
        diagnosticQuestion:
          "How much of your lead time is pipeline wait, flaky-test re-runs, and " +
          "manual gates — and would AI authoring speed even reach production faster?",
      },
      {
        key: "platform_fragmentation",
        name: "Platform fragmentation / cognitive load",
        description:
          "Without a coherent internal platform (golden paths, paved roads, " +
          "self-service), every team reinvents tooling and carries high cognitive " +
          "load; AI tools bolted onto fragmented estates amplify inconsistency " +
          "rather than scaling delivery.",
        detectionSignal:
          "Many bespoke per-team toolchains, no golden paths, high onboarding time, " +
          "duplicated infra/CI patterns, developer-experience complaints about " +
          "cognitive load and context switching.",
        diagnosticQuestion:
          "Do teams share paved roads and golden paths, or does each reinvent " +
          "tooling — and is cognitive load a measured constraint on delivery?",
      },
      {
        key: "ai_provenance_security",
        name: "AI code provenance, IP, and security exposure",
        description:
          "AI-generated code can introduce licensing/IP ambiguity, insecure " +
          "patterns, or leakage of proprietary code to external models — risks that " +
          "are invisible in velocity metrics but real in audit, security, and legal.",
        detectionSignal:
          "No policy on AI suggestion provenance or code-sharing with external " +
          "models; security scanning not gating AI-assisted PRs; no record of which " +
          "code paths were AI-influenced; legal/IP questions unanswered.",
        diagnosticQuestion:
          "What governs AI code provenance, IP, and security in your SDLC — is " +
          "AI-assisted code scanned and policy-bounded, and is proprietary code " +
          "protected from external models?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "code_completion_assistant",
        name: "In-IDE code completion & generation assistant",
        valueMechanism:
          "Embed an assistant in the developer's IDE for inline completion, " +
          "boilerplate generation, and in-context explanation — reducing authoring " +
          "and lookup toil so engineers spend more time on design and review. Value " +
          "shows up as reduced PR cycle time and recovered flow time at a held " +
          "quality bar, NOT as lines of code.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "IDE/assistant usage telemetry (suggestions shown, accepted, retained)",
          "Baseline PR cycle time and review turnaround per team",
          "Code-handling and IP/licensing policy for AI suggestions",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Accepted suggestions must be reviewed and tested — acceptance is not correctness",
          "Watch escaped-defect and change-failure drift; do not measure success by LOC or acceptance rate",
        ],
        metricsMoved: [
          "ai_assistant_adoption",
          "ai_suggestion_acceptance_rate",
          "pr_cycle_time",
          "flow_focus_time",
        ],
      },
      {
        key: "ai_code_review",
        name: "AI-assisted code review",
        valueMechanism:
          "An assistant performs a first-pass review on pull requests — flagging " +
          "likely bugs, style issues, security smells, and missing tests — so human " +
          "reviewers focus on design and intent. Relieves the review bottleneck and " +
          "shortens review turnaround while preserving (and ideally improving) the " +
          "stability metrics, because faster review does not mean weaker review.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Repository access and PR/review event data within governance",
          "Baseline code-review turnaround and PR cycle time",
          "Escaped-defect and change-failure baselines to confirm quality holds",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "AI review augments, never replaces, human accountability for merge decisions",
          "Risk of automation complacency — guard against rubber-stamping AI's first pass",
        ],
        metricsMoved: [
          "code_review_turnaround",
          "pr_cycle_time",
          "escaped_defect_rate",
        ],
      },
      {
        key: "test_generation",
        name: "AI test generation & coverage augmentation",
        valueMechanism:
          "Generate unit/integration tests and edge cases from code and specs to " +
          "raise meaningful coverage and catch regressions earlier — value realized " +
          "as a lower escaped-defect rate, NOT as a higher coverage number for its " +
          "own sake (shallow generated tests that only lift the percentage are explicitly out of scope).",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Codebase and existing test suite access",
          "Coverage and escaped-defect baselines per service",
          "A test-quality bar (mutation testing or review) to reject shallow tests",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated tests must be reviewed for genuine assertions, not coverage padding",
          "Track escaped defects, not just coverage, or this becomes a vanity metric",
        ],
        metricsMoved: [
          "test_coverage",
          "escaped_defect_rate",
          "change_failure_rate",
        ],
      },
      {
        key: "cicd_pipeline_intelligence",
        name: "CI/CD pipeline intelligence & remediation",
        valueMechanism:
          "AI triages pipeline failures, detects and quarantines flaky tests, " +
          "suggests fixes, and assists release/incident response — cutting toil and " +
          "wait in the delivery path so lead time and deployment frequency improve " +
          "without sacrificing stability, and MTTR shortens during incidents.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "CI/CD pipeline logs, test results, and flaky-test history",
          "Lead time, deployment frequency, and MTTR baselines",
          "Observability/incident data for failure correlation",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-quarantine and suggested fixes need human confirmation before merge/release",
          "Opaque generated remediations can lengthen MTTR if engineers cannot reason about them",
        ],
        metricsMoved: [
          "lead_time_for_changes",
          "deployment_frequency",
          "mttr",
        ],
      },
      {
        key: "agentic_dev_tasks",
        name: "Agentic developer tasks (bounded multi-step automation)",
        valueMechanism:
          "Delegate bounded, well-specified engineering tasks — dependency " +
          "upgrades, routine refactors, migration chores, scaffolding — to " +
          "supervised agents that open reviewable PRs, removing repetitive task " +
          "chains from human queues and converting them to exception-only review, " +
          "which moves throughput and recovers flow time directly.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Well-defined task boundaries and success/acceptance criteria",
          "Scoped repo/tool permissions with full audit logging",
          "Test and CI gates strong enough to validate agent output",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Agent-authored changes must pass the same (or stricter) review and CI gates as humans",
          "Only delegate well-bounded tasks; unbounded autonomy creates accountability and security gaps",
        ],
        metricsMoved: [
          "deployment_frequency",
          "pr_cycle_time",
          "flow_focus_time",
        ],
      },
      {
        key: "internal_platform_assistant",
        name: "Platform engineering / golden-path assistant",
        valueMechanism:
          "An AI layer over the internal developer platform answers " +
          "'how do I deploy/observe/secure this here', scaffolds services onto " +
          "paved roads, and reduces cognitive load and onboarding time — scaling " +
          "consistent, secure delivery across teams rather than amplifying " +
          "fragmentation, which improves lead time and developer experience.",
        adoptionProfile: "early",
        dataDependencies: [
          "Documented golden paths, platform APIs, and a curated internal corpus",
          "Onboarding-time and developer-experience baselines",
          "Entitlements so platform answers respect access and environment scope",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Platform answers must cite authoritative internal docs; stale guidance erodes trust fast",
          "Scaffolding must enforce, not bypass, security and compliance gates",
        ],
        metricsMoved: [
          "lead_time_for_changes",
          "developer_satisfaction_enps",
          "flow_focus_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "dora_paired_measurement",
        name: "DORA paired-metric measurement baseline",
        description:
          "An instrumentation and evaluation layer that measures the four DORA " +
          "metrics (deployment frequency, lead time, change failure rate, MTTR) as " +
          "a PAIRED system — throughput and stability together — per service and " +
          "team, with PR cycle time and escaped defects, establishing the honest " +
          "baseline that any AI-SDLC claim must move. It is the antidote to vanity " +
          "velocity: it refuses to report speed without stability.",
        boundary:
          "Owns the measurement methodology, the paired baselines, and the " +
          "diagnostic dashboards; does not set delivery targets or make the " +
          "investment decision — it supplies the honest numbers those use, at the " +
          "team/service level, never to rank individuals.",
        humanAccountabilityPoint:
          "VP of Engineering / Head of Developer Productivity (with the DevEx/platform analytics lead)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "review_capacity_guardrail",
        name: "Review-capacity guardrail (authoring/review balance)",
        description:
          "A pattern that keeps review capacity in balance with AI-accelerated " +
          "authoring: smaller PRs, AI first-pass review feeding human reviewers, " +
          "review SLAs, and monitoring of turnaround and escaped defects so the " +
          "bottleneck does not silently move to review or degrade into rubber-stamping.",
        boundary:
          "Owns review workflow, SLAs, and the AI-review-to-human-review handoff; " +
          "does not own merge authority itself, which stays with accountable humans.",
        humanAccountabilityPoint:
          "Engineering managers / tech leads accountable for each repository's merge bar",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "ai_sdlc_governance",
        name: "AI-in-SDLC governance & provenance guardrail",
        description:
          "A policy-plus-platform pattern governing AI use across the lifecycle: " +
          "approved tools and models, code-provenance and IP rules, security " +
          "scanning gating AI-assisted PRs, and protection of proprietary code from " +
          "external models — so AI accelerates delivery inside a defensible audit, " +
          "security, and legal boundary.",
        boundary:
          "Owns AI acceptable-use policy, provenance/IP rules, and the security " +
          "gates on AI-assisted code; does not own the individual merge decision or " +
          "the underlying model/vendor certification (separate functions).",
        humanAccountabilityPoint:
          "CISO / Head of Application Security (with Engineering and Legal/IP)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "developer_experience_program",
        name: "Developer experience & trust program",
        description:
          "A standing capability that treats adoption as a trust and experience " +
          "problem: enablement on effective AI use, developer-experience surveys " +
          "(SPACE/DevEx), a champions network, friction removal, and an explicit " +
          "commitment that telemetry improves the system rather than policing " +
          "individuals — directly targeting distrust and surveillance framing.",
        boundary:
          "Owns enablement, DevEx measurement, and the trust/communication framing; " +
          "does not own tool selection or platform engineering itself.",
        humanAccountabilityPoint:
          "Head of Developer Experience / Engineering enablement lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "platform_golden_paths",
        name: "Internal platform & golden paths (paved roads)",
        description:
          "A platform-engineering pattern that provides self-service golden paths — " +
          "scaffolding, CI/CD templates, observability, and security baked in — so " +
          "delivery scales consistently and AI tooling rides paved roads instead of " +
          "amplifying fragmentation, reducing cognitive load and lead time across teams.",
        boundary:
          "Owns the platform, golden paths, and self-service tooling; does not own " +
          "product roadmaps or per-team architecture decisions beyond the paved-road contract.",
        humanAccountabilityPoint:
          "Head of Platform Engineering (with a product-minded platform team)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Engineering-productivity value is realized as faster, SAFER delivery — " +
        "the DORA pairing of throughput and stability — and as recovered " +
        "developer capacity, NOT as lines of code or velocity. The honest chain " +
        "is: AI removes authoring, review, and pipeline toil; that shortens PR " +
        "cycle time and lead time and recovers flow time; IF review capacity and " +
        "CI/CD keep pace, the gains reach production as higher deployment " +
        "frequency WITHOUT raising change failure rate, MTTR, or escaped defects. " +
        "Each step is haircut: adoption gated by developer trust, review-capacity " +
        "saturation, quality/rework give-back from unreviewed AI code, and " +
        "attribution uncertainty all erode the headline. Recovered capacity only " +
        "becomes value if it is reinvested into higher-value engineering work — " +
        "and the business case must never book 'AI wrote X% of code' or a rising " +
        "LOC/velocity figure as productivity. The discipline that keeps it honest " +
        "is measuring throughput and stability together, always.",
      dominantHaircutFactors: [
        {
          factor: "Adoption / trust gap (license → habitual trusted use)",
          rationale:
            "Gains only count for developers who actually adopt and trust the " +
            "assistant; plausible-wrong suggestions and friction leave a large " +
            "inactive or skeptical tail that removes much theoretical benefit.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Licensed-seat to habitual-trusted-use drop-off across developer copilot rollouts",
            label: "planning-range",
          },
        },
        {
          factor: "Review-capacity saturation (authoring outruns review)",
          rationale:
            "Faster authoring does not reach production faster if review and CI " +
            "are the constraint; the bottleneck moves to review and eats much of " +
            "the authoring gain.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Lead-time and PR-cycle-time studies where review/pipeline wait dominates delivery",
            label: "planning-range",
          },
        },
        {
          factor: "Quality / rework give-back (stability cost)",
          rationale:
            "Some speed is paid back as rising change failure rate, MTTR, or " +
            "escaped defects from under-reviewed AI code; net value must subtract " +
            "the stability give-back to be honest.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Stability give-back on AI-assisted code before review discipline and gating mature",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution uncertainty",
          rationale:
            "Delivery metrics move for many reasons at once (process changes, team " +
            "composition, architecture, demand); without matched cohorts or a " +
            "baseline, AI is credited for changes it did not cause.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Counterfactual gaps where no matched team/baseline isolates AI's contribution to DORA metrics",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Lead-time / PR-cycle-time reduction",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reported delivery-speed improvement where AI authoring + review + pipeline gains reach production",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in lead_time_for_changes / pr_cycle_time at held-or-improved stability",
        },
        {
          lever: "Deployment-frequency uplift (stability held)",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Throughput uplift in teams where change failure rate and MTTR held or improved",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in deployment_frequency with change_failure_rate flat or down",
        },
        {
          lever: "Recovered flow / focus time",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Reduction in toil and wait converted to focus time where automation removed real friction",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in flow_focus_time attributable to AI-removed toil",
        },
      ],
      timeToValueBand:
        "In-IDE code assistants and AI code review: 1-2 quarters to first measured " +
        "PR-cycle-time and review-turnaround gains, but 3-4+ quarters to habitual " +
        "trusted adoption across the org. Test generation and CI/CD intelligence: " +
        "2-4 quarters to move escaped defects, lead time, and MTTR once baselines " +
        "exist. Agentic dev tasks and platform/golden-path assistants: 3-6+ " +
        "quarters given bounding, permissions, governance, and platform maturity.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Version control & code-review platform",
          role: "Source of truth for commits, PRs, review events, and most throughput/cycle-time signals.",
          examples: ["GitHub", "GitLab", "Bitbucket", "Azure DevOps Repos"],
        },
        {
          name: "CI/CD & delivery pipeline",
          role: "Where builds, tests, and deployments run — the source for deployment frequency and lead time.",
          examples: ["GitHub Actions", "GitLab CI", "Jenkins", "Argo CD", "Spinnaker", "CircleCI"],
        },
        {
          name: "Incident management & observability",
          role: "Production failure, restore, and reliability data — the source for change failure rate and MTTR.",
          examples: ["PagerDuty", "Opsgenie", "Datadog", "Grafana", "Sentry"],
        },
        {
          name: "AI assistant & developer-tool telemetry",
          role: "Adoption, suggestion acceptance, and active-use measurement for AI coding tools.",
          examples: ["Copilot/assistant admin dashboards", "IDE plugin telemetry", "engineering-intelligence platforms"],
        },
        {
          name: "Issue / work tracking & developer-experience platform",
          role: "Work items, defects, and DevEx/eNPS survey data tying delivery to quality and satisfaction.",
          examples: ["Jira", "Linear", "developer-experience survey platforms"],
        },
      ],
      roles: [
        {
          title: "VP of Engineering / CTO",
          accountability:
            "Delivery performance, the engineering operating model, and the AI-in-SDLC program end-to-end.",
        },
        {
          title: "Head of Developer Productivity / Developer Experience",
          accountability:
            "Measurement (DORA/SPACE/DevEx), enablement, and the trust framing of AI tooling and telemetry.",
        },
        {
          title: "Head of Platform Engineering",
          accountability:
            "Golden paths, self-service tooling, CI/CD, and the paved roads AI delivery rides on.",
        },
        {
          title: "Engineering managers / tech leads",
          accountability:
            "Per-team adoption, review discipline, merge bar, and reinvestment of recovered capacity.",
        },
        {
          title: "CISO / Head of Application Security",
          accountability:
            "AI code provenance, IP, and security gating across the lifecycle (with Legal/IP).",
        },
      ],
      regulatoryFrames: [
        {
          name: "Software IP, licensing & open-source compliance",
          relevance:
            "AI-generated code raises provenance, copyright, and OSS-license questions that must be governed in the SDLC.",
        },
        {
          name: "Data privacy & code-confidentiality (GDPR/CCPA, trade secret)",
          relevance:
            "Sending proprietary code or customer data to external models implicates privacy and trade-secret protection.",
        },
        {
          name: "Application security & secure-SDLC standards (e.g. OWASP, NIST SSDF)",
          relevance:
            "AI-assisted code must pass the same secure-development gates; standards shape scanning and review requirements.",
        },
        {
          name: "AI governance & employee-monitoring frameworks (EU AI Act, NIST AI RMF, monitoring law)",
          relevance:
            "Shape acceptable AI use and constrain how developer-productivity telemetry may be used (system improvement, not individual surveillance).",
        },
      ],
      canonicalTerms: [
        {
          term: "DORA metrics",
          definition:
            "The four delivery metrics — deployment frequency, lead time for changes, change failure rate, mean time to restore — read as a PAIRED throughput-and-stability system, never speed alone.",
        },
        {
          term: "Vanity velocity",
          definition:
            "Output-volume measures (lines of code, commits, story points, '%-of-code-AI-generated') that AI inflates trivially and that correlate poorly with delivered value or stability.",
        },
        {
          term: "SPACE framework",
          definition:
            "A developer-productivity framework spanning Satisfaction, Performance, Activity, Communication, and Efficiency — a corrective to single-metric measurement.",
        },
        {
          term: "Flow / toil",
          definition:
            "Flow is uninterrupted high-value work; toil is manual, repetitive operational effort (waiting on builds/reviews, flaky reruns, manual gates) that AI is well-suited to remove.",
        },
        {
          term: "Golden path / paved road",
          definition:
            "A supported, opinionated, self-service way to build, deploy, and operate a service on the internal platform, reducing cognitive load and inconsistency.",
        },
        {
          term: "Suggestion acceptance rate",
          definition:
            "Share of AI suggestions developers keep — a trust/fit proxy that is gameable and must never be optimized as a productivity target on its own.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Delivery throughput improvement (deploy frequency, lead time)",
        authoritativeSource:
          "CI/CD pipeline and version-control timestamps per service, before vs after, on matched teams",
        whatGoodEvidenceLooksLike:
          "DORA throughput metrics measured per service with a defined baseline and a matched-team comparison — and ALWAYS reported alongside the stability metrics.",
        weakEvidenceToReject:
          "Lines of code, commit counts, story-point velocity, or a '%-of-code-AI-generated' figure presented as productivity.",
      },
      {
        claim: "Stability held while speed rose",
        authoritativeSource:
          "Deployment-to-incident correlation and observability data for change failure rate and MTTR",
        whatGoodEvidenceLooksLike:
          "Change failure rate, MTTR, and escaped defects tracked over the same window as throughput, showing stability flat or improving as speed rose.",
        weakEvidenceToReject:
          "Throughput gains reported with no stability metric, or a claim of 'faster delivery' with change failure rate untracked.",
      },
      {
        claim: "AI assistant adoption and trust",
        authoritativeSource:
          "Assistant usage telemetry joined to engineering headcount, plus developer-experience survey data",
        whatGoodEvidenceLooksLike:
          "Weekly active adoption by team against eligible developers, with acceptance-in-range and DevEx/eNPS sentiment on correctness and fit.",
        weakEvidenceToReject:
          "Seats provisioned, or a high suggestion-acceptance rate alone, presented as adoption or as value.",
      },
      {
        claim: "Recovered capacity / ROI",
        authoritativeSource:
          "Flow/cycle-time deltas plus reinvestment records reconciled with engineering leadership and Finance",
        whatGoodEvidenceLooksLike:
          "Recovered flow/cycle time traced to a specific reinvestment in higher-value engineering work, net of haircuts and stability give-back.",
        weakEvidenceToReject:
          "A theoretical dollar saving computed as (time saved × loaded developer rate × headcount) with no throughput, stability, or reinvestment evidence.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do you measure the four DORA metrics as a PAIRED system — throughput AND stability — and what are your current bands per service?",
      "Which of your reported AI productivity gains are tied to DORA outcomes versus output-volume proxies like lines of code, commits, or acceptance rate?",
      "Since AI adoption, has PR cycle time and code-review turnaround improved, or has authoring outrun your review capacity?",
      "Are change failure rate, MTTR, and escaped defects holding as throughput rises, or are you trading stability for speed?",
      "What are your AI assistant active-adoption and acceptance rates, and what do developers say about whether they trust the suggestions?",
      "How is developer-productivity telemetry used — to improve the system at team level, or to rank and police individuals?",
      "How much of your lead time is pipeline wait, flaky-test reruns, and manual gates rather than coding?",
      "What governs AI code provenance, IP, and security — are AI-assisted PRs scanned and gated, and is proprietary code protected from external models?",
    ],
    maturitySignals: [
      "DORA metrics are tracked as a paired throughput-and-stability system per service, with PR cycle time and escaped defects.",
      "AI-SDLC value is measured against delivery outcomes, never lines of code, commits, or velocity.",
      "Review capacity is deliberately balanced with AI-accelerated authoring (smaller PRs, AI first-pass review, SLAs).",
      "Productivity telemetry is team-level and diagnostic, framed and trusted as system improvement, not individual surveillance.",
      "AI use in the lifecycle is governed: approved tools, provenance/IP rules, security gating on AI-assisted PRs, paved roads for delivery.",
    ],
    redFlags: [
      "Headline AI benefits are lines of code, commits, story-point velocity, or '%-of-code-AI-generated' — vanity velocity.",
      "Throughput is reported without the paired stability metrics; change failure rate and MTTR are untracked or degrading.",
      "Authoring has outrun review — PR cycle time and review turnaround are flat or worsening, with signs of rubber-stamping.",
      "Per-developer productivity dashboards drive performance reviews; developers are gaming metrics and eNPS is falling.",
      "Adoption is low or concentrated in a power-user minority despite licenses, with distrust of suggestion correctness.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "IDE-embedded code assistants (GitHub Copilot, others)",
        category: "In-flow code completion and generation in the developer's IDE",
        switchingCost:
          "Moderate — embedded in developer workflow and habits; the assistant layer is increasingly swappable, but enablement, prompt patterns, and telemetry integration create stickiness.",
        renewalDynamics:
          "Per-developer-seat subscription; the negotiation is right-sizing seats to habitual active users and proving DORA impact, not blanket headcount.",
      },
      {
        vendorName: "Frontier LLM / agent providers (Anthropic, OpenAI, others)",
        category: "Foundation models and agents for coding, review, test gen, and agentic dev tasks via API",
        switchingCost:
          "Moderate — model layer is increasingly portable via abstraction; the real lock-in is prompt/agent workflows, evals, and deep tool/repo integration.",
        renewalDynamics:
          "Fast-moving capability and pricing; favor consumption transparency, model-portability, code-confidentiality terms, and exit rights over multi-year lock-in.",
      },
      {
        vendorName: "AI code-review, test-gen, and engineering-intelligence tools",
        category: "Point tools for AI review, test generation, and DORA/DevEx measurement",
        switchingCost:
          "Low-to-moderate — workflow-embedded but generally replaceable; watch data export, metric-definition portability, and repo-integration depth.",
        renewalDynamics:
          "Crowded, rapidly consolidating market; usage- and outcome-based terms are increasingly available — negotiate them against measured delivery impact.",
      },
      {
        vendorName: "Internal developer platform / CI/CD vendors",
        category: "Platform-engineering, golden-path, and delivery-pipeline tooling (often AI-augmented)",
        switchingCost:
          "High — fused to the delivery estate, golden paths, and team workflows; migrating the platform is a multi-quarter program, not a tool swap.",
        renewalDynamics:
          "Platform/enterprise agreements; the asset is the paved roads and integrations built on top — structure for portability where feasible.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the internal developer platform and CI/CD estate the AI tools ride on; the model/assistant layer is increasingly portable, so the value frontier (and negotiating room) is in seat right-sizing to active use, consumption transparency, code-confidentiality guarantees, and avoiding workflow/metric lock-in around point tools.",
    negotiationLevers: [
      "Right-size seats to demonstrated habitual active use, not blanket developer headcount (kills shelfware spend)",
      "Code-confidentiality and IP terms: no training on proprietary code, with audit and exit rights",
      "Consumption transparency and model-portability to avoid assistant/agent-layer lock-in",
      "Outcome/usage-based pricing tied to measured DORA impact (throughput AND stability) where available",
      "Pilot-to-scale gating with a defined DORA-based graduation metric before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      throughput_claim: [
        "CI/CD and version-control timestamps per service",
        "before/after on matched teams",
        "paired stability metric reported alongside",
      ],
      stability_claim: [
        "deployment-to-incident correlation",
        "change failure rate / MTTR / escaped-defect baseline",
        "same measurement window as throughput",
      ],
      adoption_claim: [
        "assistant usage telemetry",
        "engineering eligible-headcount join",
        "acceptance-in-range and DevEx/eNPS sentiment",
      ],
      value_projection: [
        "baseline DORA metric",
        "benchmark planning-range",
        "explicit haircut factors (adoption/trust, review-capacity, quality give-back, attribution)",
      ],
      capacity_realization: [
        "flow/cycle-time delta",
        "reinvestment record into higher-value engineering work",
        "leadership/Finance reconciliation",
      ],
    },
    citationStandard:
      "Delivery claims cite the pipeline/VCS/incident source, the period, the " +
      "service/team scope, and the comparison basis (baseline + matched cohort). " +
      "Throughput claims MUST be reported alongside the paired stability metrics " +
      "(change failure rate, MTTR, escaped defects). Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied " +
      "(adoption/trust, review-capacity saturation, quality give-back, " +
      "attribution) — never a single asserted ROI, and never lines of code, " +
      "commits, or velocity extrapolated to productivity or headcount.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no DORA baseline — frame delivery gains as an industry planning range, not their measured number.",
      "Only output-volume or acceptance-rate proxies are available — present as activity, flag that delivery and quality impact is unproven.",
      "Throughput is improving but stability is untracked — hedge any 'faster delivery' claim until change failure rate and MTTR are measured.",
      "A headcount or dollar saving is requested without throughput-and-stability data — model recovered capacity, hedge conversion to cost as a leadership decision.",
      "Vendor-reported developer-productivity outcomes are cited — mark as vendor claims pending tenant validation against DORA.",
    ],
    inferenceLanguage: [
      "Across enterprise AI-SDLC rollouts, lead-time and PR-cycle-time improvements typically run...",
      "Without your DORA baseline, the industry pattern suggests delivery gains of... at held stability",
      "Peer engineering orgs at this scale commonly see adoption and trusted-use plateau around...",
      "This is a recovered-capacity figure read with stability held; converting it to cost is a leadership decision your data hasn't yet made.",
    ],
    flagWithoutEvidence: [
      "A specific headcount or dollar saving for this tenant's engineering org",
      "This tenant's actual DORA metrics, PR cycle time, or escaped-defect rate",
      "A claim that recovered engineering capacity here has been (or will be) reinvested or cashed out",
      "A specific ROI number for this tenant's AI-SDLC program",
      "A productivity claim based on lines of code, commits, or '%-of-code-AI-generated' for this tenant",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "DORA performance / throughput and stability together",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Deployment frequency, lead time, change failure rate, and MTTR side-by-side so throughput is never read without stability.",
    },
    {
      questionPattern: "AI-SDLC value bridge (baseline to realized, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline delivery to AI-assisted, showing recovered capacity and each haircut (adoption/trust, review-capacity, quality give-back, attribution).",
    },
    {
      questionPattern: "value sensitivity / which haircut bites hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of adoption/trust gap, review-capacity saturation, quality give-back, and attribution on realized value.",
    },
    {
      questionPattern: "delivery trend over time / where AI moved the curve",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend lead time, PR cycle time, and change failure rate together to show speed improving while stability holds (or not).",
    },
    {
      questionPattern: "engineering productivity scorecard",
      exhibitKind: "table",
      note: "DORA four, PR cycle time, review turnaround, test coverage, AI adoption + acceptance, escaped defects, eNPS, flow time vs planning ranges.",
    },
    {
      questionPattern: "adoption by team / who actually trusts and uses AI",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Active adoption and acceptance-in-range by team, with the inactive/skeptical tail visible, to expose the trust gap.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "DORA metrics are measured as a paired throughput-and-stability system before any AI claim is made",
      "Review capacity and CI/CD are deliberately scaled so AI authoring gains reach production safely",
      "Adoption is earned through developer trust — accurate, well-fitting suggestions and friction removal",
      "Productivity telemetry is team-level and diagnostic, explicitly not used to police individuals",
      "AI use is governed (provenance, IP, security gating) and delivery rides paved-road platform golden paths",
    ],
    failureDrivers: [
      "Measuring and rewarding vanity velocity — lines of code, commits, '%-of-code-AI-generated' — instead of delivery outcomes",
      "Throughput chased without the paired stability metrics, accumulating quality debt that surfaces as incidents",
      "Authoring outruns review capacity, moving the bottleneck to review or degrading it into rubber-stamping",
      "Developer distrust from plausible-wrong suggestions, or surveillance framing that triggers gaming and disengagement",
      "AI bolted onto fragmented platforms and flaky pipelines, amplifying inconsistency instead of scaling delivery",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Senior and tech-forward engineers adopt code assistants first and form " +
      "habits fast where suggestions fit the codebase; the broader org follows only " +
      "as trust is earned and friction removed. AI code review and test generation " +
      "lag until paired-stability evidence shows quality holds. Agentic dev tasks " +
      "and platform assistants adopt last, gated by governance and platform " +
      "maturity. Sentiment is decisive — trust and a system-improvement framing " +
      "accelerate; plausible-wrong output or a surveillance framing trigger " +
      "abandonment and metric gaming.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is better here than in diffuse workforce productivity because " +
      "delivery is instrumentable — DORA metrics, PR cycle time, and escaped " +
      "defects are measurable per service. But it is only MEDIUM, not high: gains " +
      "are confounded by concurrent process/team/architecture changes, most orgs " +
      "lack clean baselines or matched cohorts, and the honest number must net out " +
      "the stability give-back and review-capacity saturation. The discipline that " +
      "earns clarity is measuring throughput AND stability together against a " +
      "baseline — and refusing to book lines of code or velocity as ROI.",
  },

  regulatoryFrame: {
    name: "AI-in-SDLC governance: code provenance/IP, security, and developer-monitoring limits",
    relevance:
      "The dominant cross-cutting frame for AI across the software lifecycle: " +
      "AI-generated code raises IP/licensing and open-source provenance questions; " +
      "sending proprietary code to external models implicates data privacy and " +
      "trade-secret protection; AI-assisted code must pass secure-SDLC gates " +
      "(OWASP, NIST SSDF); and developer-productivity telemetry is employee " +
      "monitoring constrained by privacy and AI-governance frameworks (EU AI Act, " +
      "NIST AI RMF) — it must improve the system, not surveil individuals (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
