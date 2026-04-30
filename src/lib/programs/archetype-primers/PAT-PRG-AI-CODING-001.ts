// PR-OV2-3a-AICODING: AI Coding Productivity archetype primer (PAT-PRG-AI-CODING-001).

import type { ArchetypePrimer } from './types';

export const AI_CODING_PRIMER: ArchetypePrimer = {
  patternId: 'PAT-PRG-AI-CODING-001',
  displayName: 'AI Coding Productivity',

  p1OutcomeStatement:
    'Phase 1 closes when four artifacts survive scrutiny: (1) a first-cohort ' +
    'definition naming a single engineering function or one bounded repo set ' +
    '(backend platform, frontend, mobile, ML/Data — not "all 5,000 engineers"), ' +
    'because the everywhere-charter rollout produces no measurable cohort ' +
    'baseline and no defensible value case; (2) a PR-cycle-time and ' +
    'suggestion-acceptance baseline for that cohort’s last 90 days BEFORE ' +
    'Copilot / Cursor / Claude Code is enabled, because a baseline measured ' +
    'after enablement is no longer a baseline and the productivity claim becomes ' +
    'unfalsifiable; (3) a repo-indexing audit with a named owner per ' +
    'private/proprietary repo plus an IP/legal posture for AI-generated code ' +
    '(copyleft attribution, proprietary-code segregation, training-data ' +
    'inheritance), because the indexing surface is the privacy floor and ' +
    'cannot be retrofitted after enablement; (4) a stakeholder map that ' +
    'explicitly names the dissenter — usually the senior tech lead who will ' +
    'say "AI generates buggy code; this will increase defect rate and review ' +
    'burden" — whose concern becomes the kill criterion’s anchor. P1 is not ' +
    'a vendor evaluation: P2 owns the GitHub Copilot vs. Cursor vs. Claude ' +
    'Code vs. self-hosted decision. P1 is the proof that the cohort, the ' +
    'baseline, and the indexing posture are real before any seat is provisioned.',

  smes: [
    {
      role: 'Engineering Manager / First-Cohort Lead',
      rationale:
        'Owns the first cohort’s repo set, the team’s sprint cadence, and the workflow integration; without their attestation the cohort definition is aspirational and the PR-cycle baseline cannot be tied to a real team that will actually use the tool.',
      neededAt: 'kickoff',
      escalationHint:
        'If the Engineering Manager cannot attend Day 1, defer Day 1 rather than running it without functional authority — a cohort locked without the EM reopens at P2 and the baseline has to be re-pulled against a different team.',
    },
    {
      role: 'DevEx / Developer Productivity Lead',
      rationale:
        'Owns the PR-cycle-time, time-to-first-review, and suggestion-acceptance baselines from GitHub/GitLab/Jira and any DX telemetry (DX, Code Climate Velocity, LinearB); without this role the program cannot measure improvement and the productivity claim falls into the wishlist-baseline anti-pattern that fails the P1 gate (failure mode #9).',
      neededAt: 'data-discovery',
      escalationHint:
        'If no DevEx Lead is named, escalate to the VP Engineering at P0 close to confirm coverage before Day 1 — without an instrumented baseline, AI Coding programs cannot survive their first quarterly value-realisation review.',
    },
    {
      role: 'Repo / Source Control Architect',
      rationale:
        'Owns the repo-indexing audit, branch-protection rules, PR-template enforcement, and the platform dependency (GitHub Enterprise / GitLab / Bitbucket / self-hosted) the AI tool must integrate with; required to scope the indexing surface so private/proprietary code segregation is enforced before enablement (failure mode #3).',
      neededAt: 'data-discovery',
      escalationHint:
        'If the repo estate is federated across multiple platforms, name a single accountable Source Control Architect before Day 2 to avoid the audit becoming a multi-platform RACI rather than a measured indexing posture.',
    },
    {
      role: 'Legal / IP Counsel',
      rationale:
        'License posture on AI-generated code, copyleft attribution risk, proprietary-code segregation, and the training-data inheritance question; without Legal sign-off in P1 the P2 charter is built without lawful-basis cover and is rebuilt after the first audit finding or vendor contract review (failure mode #6).',
      neededAt: 'data-discovery',
      escalationHint:
        'If Legal Counsel is unavailable, an empowered IP-specialist paralegal with documented authority to attest license posture is acceptable; if neither is named, block repo-indexing audit publication and log the absence as a P2 readiness risk.',
    },
    {
      role: 'Senior Tech Lead — likely dissenter',
      rationale:
        'The inevitable dissenter — typically the staff/principal engineer who says "AI generates buggy code; this will increase defects and review burden". Surfacing them in P1 turns a P3/P4 blocker into a Day 3 conversation with documented mitigations; their concern (defect-rate, review-load) becomes the program’s explicit kill criterion (failure mode #10).',
      neededAt: 'baseline',
      escalationHint:
        'If no obvious dissenter exists on the program team, ask the Engineering Manager to name the most respected sceptic on the cohort — a stakeholder map without a dissenter is a department RACI and the P1 anti-pattern detector will flag it at the gate.',
    },
    {
      role: 'HR / Engineering Skills Lead',
      rationale:
        'Owns the prompt-literacy curriculum, the AI-assisted-PR review training, and the override-vs-accept guidance; deferring this to P5 is the dominant adoption-fade pathway because curriculum authoring has 4–6 week lead time, acceptance rates plateau without it, and value evaporates within the first quarter (failure mode #4).',
      neededAt: 'baseline',
      escalationHint:
        'If HR / Engineering Skills is unavailable, request a named L&D / Engineering Excellence partner with curriculum-authoring authority; do not run Day 2 afternoon without skills-side coverage — the prompt-literacy plan cannot be deferred to P5.',
    },
    {
      role: 'CISO / AppSec Sponsor',
      rationale:
        'Owns the secrets-in-code, dependency-vulnerability, and AI-suggestion-quality gating; AI Coding tools occasionally surface or suggest credentials and vulnerable patterns, and AppSec posture has to be locked in P1 so the P2 cohort design respects the security floor rather than retrofitting controls after the first incident.',
      neededAt: 'synthesis-prep',
    },
  ],

  templates: [
    {
      id: 'ai-coding-first-cohort-workshop-guide',
      title: 'AI Coding first-cohort + workflow inventory workshop facilitator guide',
      kind: 'workshop_facilitator_guide',
      description:
        'Run-of-show + prompts for the Day 1 session: forces a single-function or single-repo-set first cohort decision, surfaces the top workflows where the tool will be evaluated (boilerplate, refactor, new feature, debug), and seeds the PR-cycle-time baseline scope before any seat is provisioned.',
      satisfiesEvidenceItems: [
        'p0-seed-ingested',
        'validated-problem-statement',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'pr-cycle-time-baseline-spreadsheet',
      title: 'PR cycle-time + acceptance-rate baseline spreadsheet',
      kind: 'baseline_spreadsheet',
      description:
        'Per-repo / per-team / per-PR-size-bucket rows for last 90 days of PR cycle time, time-to-first-review, defect rate, and suggestion-acceptance-rate (if any prior pilot exists), with capture method, source system (GitHub/GitLab/Jira), grain, owner, and known caveats — populated BEFORE the AI tool is enabled in the cohort’s repos so the baseline is defensible.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'repo-indexing-audit-template',
      title: 'Repo-indexing audit + sensitivity classification capture template',
      kind: 'capture_template',
      description:
        'Per-repo rows for sensitivity classification (public / internal / proprietary / regulated), indexing posture (will-index / index-with-redaction / exclude), branch-protection rules, secrets-scanning coverage, copyleft-dependency exposure, and the named owner with target attestation date — required before any AI tool sees the cohort’s code.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'senior-tech-lead-dissenter-interview-script',
      title: 'Senior Tech Lead (dissenter) interview script',
      kind: 'interview_script',
      description:
        'Sequenced prompts for the senior tech lead 1:1 — surfaces the defect-rate concern, review-burden concern, IP/license concern, and the "AI generates buggy code" objection; turns each into a falsifiable criterion the P2 readiness recommendation must answer.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'validated-problem-statement',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'ai-coding-skills-and-curriculum-template',
      title: 'Prompt-literacy + AI-PR-review curriculum template',
      kind: 'document',
      description:
        'Onboarding curriculum scaffold for the first cohort — prompt patterns by workflow type (boilerplate, refactor, new feature, debug), AI-PR-review checklist (override vs. accept criteria), defect-rate guardrails, and the weekly check-in cadence for the first 8 weeks post-enablement.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'stakeholder-map-named',
      ],
    },
    {
      id: 'ai-coding-discovery-report-template',
      title: 'AI Coding Discovery Report template',
      kind: 'document',
      description:
        'Final P1 deliverable scaffold: first-cohort definition, PR-cycle-time + acceptance-rate baseline with bias-and-distribution caveats, repo-indexing audit findings with sensitivity classification, license-posture attestation from Legal, stakeholder map with named dissenter, contradictions log, and P2 readiness recommendation.',
      satisfiesEvidenceItems: [
        'validated-problem-statement',
        'okr-baseline-captured',
        'stakeholder-map-named',
        'discovery-contradictions-logged',
        'p2-readiness-recommendation',
      ],
    },
  ],

  workshops: [
    {
      id: 'ai-coding-first-cohort-and-workflow-inventory',
      title: 'AI Coding first-cohort + workflow inventory (Day 1)',
      description:
        'Three-hour decision workshop where the Engineering Manager, DevEx Lead, and Repo / Source Control Architect lock a single-function or single-repo-set first cohort (not "all engineers") and name the top workflows where the AI tool will be evaluated (boilerplate, refactor, new feature, debug). Output is the cohort definition the rest of P1 will baseline against and the repo set the indexing audit will scope.',
      durationHours: 3,
      attendees: [
        'Engineering Manager / First-Cohort Lead',
        'DevEx / Developer Productivity Lead',
        'Repo / Source Control Architect',
      ],
      usesTemplates: [
        'ai-coding-first-cohort-workshop-guide',
        'pr-cycle-time-baseline-spreadsheet',
      ],
    },
    {
      id: 'repo-indexing-audit-and-baseline',
      title: 'Repo-indexing audit + PR-cycle baseline (Day 2)',
      description:
        'Four-hour split-session day. Morning (2h) with Repo / Source Control Architect + Legal / IP Counsel runs the repo-indexing audit across the cohort’s repos, names sensitivity classification per repo, and locks the IP/license posture for AI-generated code. Afternoon (2h) with DevEx Lead + Engineering Manager + HR / Engineering Skills Lead pulls the PR-cycle-time and acceptance-rate baseline for the last 90 days BEFORE the AI tool is enabled and drafts the prompt-literacy + AI-PR-review curriculum.',
      durationHours: 4,
      attendees: [
        'Repo / Source Control Architect',
        'Legal / IP Counsel',
        'DevEx / Developer Productivity Lead',
        'Engineering Manager / First-Cohort Lead',
        'HR / Engineering Skills Lead',
      ],
      usesTemplates: [
        'repo-indexing-audit-template',
        'pr-cycle-time-baseline-spreadsheet',
        'ai-coding-skills-and-curriculum-template',
      ],
    },
    {
      id: 'dissenter-and-readiness-validation',
      title: 'Dissenter interview + P2 readiness validation (Day 3)',
      description:
        'Two-hour synthesis-prep session: Senior Tech Lead (dissenter) is interviewed on the defect-rate, review-burden, and IP concerns; Engineering Manager confirms the cohort definition still holds against Day 1–2 evidence; CISO / AppSec Sponsor signs off on the indexing posture. Closes with a draft P2 readiness recommendation (proceed / re-scope cohort / remediate-first / stop) and the dissenter’s concerns logged with proposed mitigations.',
      durationHours: 2,
      attendees: [
        'Senior Tech Lead — likely dissenter',
        'Engineering Manager / First-Cohort Lead',
        'CISO / AppSec Sponsor',
      ],
      usesTemplates: [
        'senior-tech-lead-dissenter-interview-script',
        'ai-coding-discovery-report-template',
      ],
    },
  ],

  dataAssets: [
    {
      id: 'first-cohort-workflow-inventory',
      label: 'First cohort top-workflow inventory (boilerplate / refactor / new feature / debug)',
      rationale:
        'Anchors the rest of P1 in named workflow types from a single engineering function rather than a generic "developer productivity" hypothesis; without this artifact the PR-cycle baseline has no scope and value attribution post-rollout becomes a rhetorical exercise.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'repo-indexing-audit-findings',
      label: 'Repo-indexing audit findings with sensitivity classification + named owners',
      rationale:
        'Required to make the Synthesis (P2) "index-with-redaction vs. excluded-repos vs. proceed" decision honestly; once the AI tool is enabled in the cohort’s repos the indexing surface determines what the model has seen, and proprietary-code segregation cannot be retrofitted after the first generation.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
    {
      id: 'pr-cycle-time-baseline',
      label: 'PR cycle-time baseline (last 90 days, by repo / team / PR size bucket)',
      rationale:
        'Grain matters — a 200-LOC PR with 4-hour median cycle time that drops to 2.5 hours is a different program than a 50-LOC PR with 30-minute cycle dropping to 22 minutes; aggregate "26% PR cycle-time reduction" claims (the Apex broker bundle’s headline number) fail the quarterly value-realisation review without the per-bucket grain to defend them.',
      format: 'spreadsheet',
      neededAt: 'baseline',
    },
    {
      id: 'suggestion-acceptance-baseline',
      label: 'Suggestion acceptance-rate baseline (if any prior Copilot / Cursor / Claude Code pilot exists)',
      rationale:
        'The Apex broker bundle shows ~450 engineers on GitHub Copilot at 79% WAU — surfacing the actual acceptance-rate by language, by file type, and by workflow turns the dissenter’s "AI generates buggy code" objection into a measurable one and informs the P2 cohort-vs-tenant scope decision.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'license-posture-attestation',
      label: 'License-posture attestation from Legal (AI-generated code, copyleft, proprietary segregation)',
      rationale:
        'Legal sign-off in P1 prevents the P2 charter being rebuilt after the first audit finding; the attestation locks copyleft attribution risk, proprietary-code-segregation posture, and training-data-inheritance citation before any seat is provisioned.',
      format: 'PDF',
      neededAt: 'baseline',
    },
    {
      id: 'devex-telemetry-export',
      label: 'DevEx telemetry export (DX, LinearB, Code Climate Velocity, GitHub Insights)',
      rationale:
        'Names the system-of-record for cycle time, review wait, and deploy frequency; without an explicit telemetry source the baseline triggers the wishlist-baseline anti-pattern and the metric must be flagged as not yet decision-grade.',
      format: 'structured-export',
      neededAt: 'data-discovery',
    },
  ],

  prepChecklist: [
    {
      id: 'confirm-first-cohort-bounded',
      label: 'Confirm first cohort is bounded — one engineering function or one repo set, not the whole engineering org',
      rationale:
        'The "everywhere-charter" anti-pattern ("give it to all 5,000 engineers at once") is the dominant AI Coding failure pattern; a Day 1 that opens with "we want every engineer more productive" produces a thin discovery report rather than a defensible cohort decision, and the P1 anti-pattern detector will flag it at the gate.',
    },
    {
      id: 'engage-repo-architect-before-enablement',
      label: 'Engage the Repo / Source Control Architect BEFORE the AI tool is enabled in the cohort’s repos',
      rationale:
        'Indexing posture is the privacy floor — Copilot / Cursor / Claude Code index private repos differently than public code, and proprietary-code segregation cannot be retrofitted after the model has seen the code. Engaging the Architect mid-pilot is too late; the audit has to scope the indexing surface against a measured baseline, not in response to incidents.',
    },
    {
      id: 'confirm-legal-counsel-license-posture',
      label: 'Confirm Legal Counsel sign-off on AI-generated code license posture (copyleft, proprietary segregation, training-data inheritance)',
      rationale:
        'License posture is a data-processing decision under most IP regimes; Legal sign-off in P1 prevents the P2 charter being rebuilt after the first audit finding and locks copyleft attribution citation before any AI-generated code merges to main.',
    },
    {
      id: 'identify-the-dissenter',
      label: 'Identify the dissenter — usually the senior tech lead who will surface defect-rate concerns',
      rationale:
        'Stakeholder maps without a dissenter are department RACIs; the "AI generates buggy code" objection is the single most common reason AI Coding programs stall at P3/P4. Surfacing the dissenter on Day 3 with documented mitigations turns a quiet blocker into a tractable conversation and the kill-criterion anchor.',
    },
    {
      id: 'author-falsifiable-cycle-time-hypothesis',
      label: 'Author a falsifiable hypothesis: which workflow type (boilerplate, refactor, new feature, debug) will show the largest PR-cycle-time delta?',
      rationale:
        'Anti-confirmation discipline. Workshops without a stated hypothesis and falsifiers entering Day 1 become confirmation work; the PR-cycle baseline on Day 2 inherits the confirmation bias and the P2 readiness recommendation becomes a foregone conclusion. The hypothesis also frames the dissenter’s falsifiable counter-claim (e.g. "defect rate will rise more than cycle time falls").',
    },
    {
      id: 'schedule-hr-engineering-skills-day-2-afternoon',
      label: 'Schedule HR / Engineering Skills Lead for Day 2 afternoon — prompt-literacy + AI-PR-review training plan cannot be deferred to P5',
      rationale:
        'Curriculum authoring has 4–6 week lead time; deferring it to P5 produces "seats provisioned, no curriculum, acceptance rates plateau" — the licence-push-without-backlog failure mode. Locking the HR / Engineering Skills slot at P1 kickoff is the difference between adoption that compounds and adoption that flat-lines.',
    },
    {
      id: 'capture-existing-ai-coding-footprint',
      label: 'Capture existing Copilot / Cursor / Claude Code usage telemetry before Day 3',
      rationale:
        'Most engineering orgs already have an unsanctioned AI Coding footprint or a prior pilot; surfacing actual WAU, acceptance rate, and PR-cycle deltas (the Apex broker bundle shows ~450 engineers on Copilot at 79% WAU and 26% PR cycle-time reduction) makes the dissenter’s objections answerable with data rather than rhetoric and informs the cohort-vs-tenant scope decision.',
    },
  ],
};
