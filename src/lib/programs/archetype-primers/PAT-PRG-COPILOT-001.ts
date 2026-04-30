// PR-OV2-3a-COPILOT: M365 Copilot deployment archetype primer (PAT-PRG-COPILOT-001).

import type { ArchetypePrimer } from './types';

export const M365_COPILOT_PRIMER: ArchetypePrimer = {
  patternId: 'PAT-PRG-COPILOT-001',
  displayName: 'M365 Copilot Deployment',

  p1OutcomeStatement:
    'Phase 1 closes when four artifacts survive scrutiny: (1) a first-cohort ' +
    'workflow inventory naming a single function (Marketing, Finance, Legal, ' +
    'Customer Success — not "everyone") with three measurable workflows and ' +
    'their inputs/outputs; (2) a time-spent-on-task baseline for those three ' +
    'workflows captured BEFORE Copilot is enabled in the cohort tenant, because ' +
    'a baseline measured after enablement is no longer a baseline; (3) a ' +
    'SharePoint / OneDrive oversharing audit with a named remediation owner, ' +
    'because Copilot surfaces whatever the user already had latent access to ' +
    'and oversharing exposure is irreversible the moment the index is built; ' +
    '(4) a stakeholder map that explicitly names the dissenter who will say ' +
    '"we already have ChatGPT licenses; this is duplicate spend." P1 is not a ' +
    'vendor evaluation — Microsoft is locked in by the enterprise agreement and ' +
    'P2 owns rollout-design tradeoffs. P1 is the proof that the cohort, the ' +
    'baseline, and the oversharing posture are real before any license is ' +
    'turned on.',

  smes: [
    {
      role: 'Champions Network Lead',
      rationale:
        'Owns the 1:N champion structure (~1 champion per 20 users) that turns deployment into adoption; if a champions network is not authored in P1, P5 adoption fades silently 4–6 weeks after rollout and the value case dies in the next quarterly review.',
      neededAt: 'kickoff',
      escalationHint:
        'If no Champions Network Lead is named on the program team, escalate to the HR / Change Management Lead at P0 close to confirm coverage before Day 1; treating champions as a P5 activity is the dominant adoption-fade anti-pattern.',
    },
    {
      role: 'Cohort Function Leader',
      rationale:
        'First cohort’s exec sponsor (e.g. Marketing VP, Finance Controller, Customer Success VP) — owns the workflow integration and the operational decision to incentivize Copilot use over the existing path; without their attestation the workflows in the inventory are aspirational.',
      neededAt: 'kickoff',
      escalationHint:
        'If the cohort sponsor cannot attend Day 1, defer Day 1 rather than running it without functional authority — a workflow inventory locked without the function leader reopens at P2 and the baseline has to be re-pulled.',
    },
    {
      role: 'M365 Architect / Workplace Productivity Lead',
      rationale:
        'Owns the M365 tenant configuration, the Microsoft Graph content sources Copilot will index, and the dependency map between SharePoint, OneDrive, Teams, and Exchange; required to scope the oversharing audit to the surfaces Copilot will actually reach.',
      neededAt: 'data-discovery',
      escalationHint:
        'If the M365 estate is partly managed by an MSP, request the MSP solution architect for Day 1 and have them attest to the indexed-content map in writing; do not proceed without authoritative tenant knowledge.',
    },
    {
      role: 'SharePoint / Permissions Owner',
      rationale:
        'Owns the oversharing audit; without this role Copilot will surface anonymous-link content, broken-inheritance libraries, and stale-group-membership documents the moment it is enabled, and the resulting governance incidents erode CISO trust faster than any value can build.',
      neededAt: 'data-discovery',
      escalationHint:
        'If the SharePoint estate is owned by a federated set of site-collection admins, name a single accountable Permissions Owner before Day 2 to avoid the audit being a department RACI rather than a measured baseline.',
    },
    {
      role: 'Privacy Counsel / DPO',
      rationale:
        'Sensitive-data exposure and data-residency posture for content embeddings — Copilot’s semantic index inherits sensitivity-label gaps and DLP gaps; without privacy-side coverage in P1 the P2 charter is built without lawful-basis sign-off and is rebuilt after the first audit finding.',
      neededAt: 'data-discovery',
      escalationHint:
        'If Privacy Counsel is unavailable, the DPO is an acceptable substitute for the Day 2 oversharing review; if neither is named, block oversharing-audit publication and log the absence as a P2 readiness risk.',
    },
    {
      role: 'HR / Change Management Lead',
      rationale:
        'Owns the prompt-literacy curriculum and the incentive design that turns "Copilot is available" into "Copilot is used"; deferring this to P5 is the most common adoption-fade pathway because curriculum authorship has 4–6 week lead time and cannot be backfilled after rollout.',
      neededAt: 'baseline',
      escalationHint:
        'If HR / Change is unavailable, request a named L&D / Talent Development partner with curriculum authoring authority; do not run Day 2 afternoon without change-side coverage.',
    },
    {
      role: 'Security / IT Sponsor (the dissenter)',
      rationale:
        'The inevitable dissenter — typically the IT lead or CISO delegate who says "we already have ChatGPT licenses; this is duplicate spend." Surfacing them in P1 turns a P3/P4 blocker into a Day 3 conversation with documented rationale; a stakeholder map without this dissenter is a department RACI.',
      neededAt: 'synthesis-prep',
    },
  ],

  templates: [
    {
      id: 'copilot-first-cohort-workshop-guide',
      title: 'Copilot first-cohort + workflow-inventory workshop facilitator guide',
      kind: 'workshop_facilitator_guide',
      description:
        'Run-of-show + prompts for the Day 1 session: forces a single-function cohort decision, surfaces three measurable workflows with named inputs/outputs, and seeds the time-spent-on-task baseline scope before any license is enabled.',
      satisfiesEvidenceItems: [
        'p0-seed-ingested',
        'validated-problem-statement',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'time-spent-on-task-baseline-spreadsheet',
      title: 'Time-spent-on-task baseline spreadsheet',
      kind: 'baseline_spreadsheet',
      description:
        'Per-workflow per-cohort-member rows with minute-level time-on-task, capture method (diary / telemetry / structured self-report), source, grain, owner, and known caveats — populated BEFORE Copilot is enabled in the cohort tenant so the baseline is defensible.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'sharepoint-oversharing-audit-template',
      title: 'SharePoint / OneDrive oversharing audit capture template',
      kind: 'capture_template',
      description:
        'Per-site-collection rows for anonymous-link counts, broken-inheritance libraries, stale-group memberships, sensitive-content surfaces (HR, Finance, Legal, M&A), DLP/sensitivity-label coverage, and the named remediation owner with target remediation date.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'champions-network-charter-template',
      title: 'Champions network charter template (1:N structure)',
      kind: 'document',
      description:
        'Defines the 1:N champion structure for the first cohort (~1 champion per 20 users), names champions per sub-team, sets the check-in cadence with the Champions Network Lead, and locks the escalation path for adoption-blocker signal back into the program.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'prompt-literacy-curriculum-template',
      title: 'Prompt-literacy curriculum + check-in cadence template',
      kind: 'document',
      description:
        'Onboarding curriculum scaffold for the first cohort — prompt patterns by workflow, anti-patterns to avoid, hands-on exercises with the cohort’s actual content, and the weekly champion-led check-in cadence for the first 8 weeks post-enablement.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'stakeholder-map-named',
      ],
    },
    {
      id: 'copilot-stakeholder-interview-script',
      title: 'Copilot stakeholder + dissenter interview script',
      kind: 'interview_script',
      description:
        'Sequenced prompts for cohort sponsor / Permissions Owner / dissenter 1:1s; surfaces decision rights, oversharing exposure tolerance, "we already have ChatGPT" objections, and the falsifiers that would change the P0 cohort or value hypothesis.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'validated-problem-statement',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'copilot-discovery-report-template',
      title: 'M365 Copilot Discovery Report template',
      kind: 'document',
      description:
        'Final P1 deliverable scaffold: first-cohort workflow inventory, time-spent baseline with bias-and-distribution caveats, oversharing audit findings with named remediation owner, champions network charter, stakeholder map with named dissenter, contradictions log, and P2 readiness recommendation.',
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
      id: 'copilot-first-cohort-and-workflow-inventory',
      title: 'Copilot first-cohort + workflow inventory (Day 1)',
      description:
        'Three-hour decision workshop where the Cohort Function Leader, M365 Architect, and Champions Network Lead lock a single-function first cohort (not "everyone") and name the top three workflows with measurable inputs and outputs. Output is the workflow inventory the rest of P1 will baseline against and the cohort the oversharing audit will be scoped to.',
      durationHours: 3,
      attendees: [
        'Cohort Function Leader',
        'M365 Architect / Workplace Productivity Lead',
        'Champions Network Lead',
      ],
      usesTemplates: [
        'copilot-first-cohort-workshop-guide',
        'champions-network-charter-template',
      ],
    },
    {
      id: 'oversharing-and-baseline-day',
      title: 'Oversharing audit + time-spent baseline (Day 2)',
      description:
        'Four-hour split-session day. Morning (2h) with SharePoint / Permissions Owner + Privacy Counsel + M365 Architect runs the oversharing audit across the cohort’s indexed surfaces and names the remediation owner. Afternoon (2h) with Champions Network Lead + HR / Change Management Lead pulls the time-spent-on-task baseline for the top three workflows BEFORE any Copilot license is enabled, and drafts the prompt-literacy curriculum.',
      durationHours: 4,
      attendees: [
        'SharePoint / Permissions Owner',
        'Privacy Counsel / DPO',
        'M365 Architect / Workplace Productivity Lead',
        'Champions Network Lead',
        'HR / Change Management Lead',
      ],
      usesTemplates: [
        'sharepoint-oversharing-audit-template',
        'time-spent-on-task-baseline-spreadsheet',
        'prompt-literacy-curriculum-template',
      ],
    },
    {
      id: 'champions-and-readiness-validation',
      title: 'Champions roster + P2 readiness validation (Day 3)',
      description:
        'Two-hour synthesis-prep session: Champions Network Lead presents the validated 1:N champions roster; Cohort Function Leader confirms the workflow inventory still holds against Day 1–2 evidence; the Security / IT Sponsor (dissenter) is interviewed on the "duplicate ChatGPT" objection. Closes with a draft P2 readiness recommendation (proceed / re-scope cohort / remediate-first / stop).',
      durationHours: 2,
      attendees: [
        'Champions Network Lead',
        'Cohort Function Leader',
        'Security / IT Sponsor (the dissenter)',
      ],
      usesTemplates: [
        'copilot-stakeholder-interview-script',
        'copilot-discovery-report-template',
      ],
    },
  ],

  dataAssets: [
    {
      id: 'first-cohort-workflow-inventory',
      label: 'First cohort top-3 workflow inventory with named inputs/outputs',
      rationale:
        'Anchors the rest of P1 in three measurable workflows from a single function rather than a generic "knowledge worker productivity" hypothesis; without this artifact the time-spent baseline has no scope and the value case is unattributable post-rollout.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'sharepoint-oversharing-findings',
      label: 'SharePoint / OneDrive oversharing audit findings with named remediation owners',
      rationale:
        'Required to make the Synthesis (P2) "remediate-first vs. constrained-pilot" decision honestly; once Copilot is enabled in a cohort tenant, the semantic index makes any oversharing exposure surface to every user in the cohort, so the audit is gating rather than informational.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
    {
      id: 'time-spent-on-task-baseline',
      label: 'Time-spent-on-task baseline per workflow per cohort member (minute-level)',
      rationale:
        'Minute-level granularity matters — a workflow with 12-minute median that drops to 9 minutes under Copilot is a different program than one with 45-minute median dropping to 38; aggregate "20% productivity gain" claims fail the quarterly value-realisation review and the program loses sponsor air-cover.',
      format: 'spreadsheet',
      neededAt: 'baseline',
    },
    {
      id: 'champions-roster-1n-structure',
      label: 'Champions roster — 1:N structure, ~1 champion per 20 users, with named individuals per sub-team',
      rationale:
        'Names the human network that turns deployment into adoption; an unnamed champions roster is a department RACI and the stakeholder-map anti-pattern detector will flag it at the P1 gate.',
      format: 'structured-export',
      neededAt: 'synthesis-prep',
    },
    {
      id: 'existing-copilot-or-genai-usage',
      label: 'Existing Copilot / generative-AI usage telemetry (DAU, WAU, drop-off, prompt patterns) — if any prior pilot',
      rationale:
        'Most enterprises have a prior unsanctioned ChatGPT footprint or an earlier Copilot pilot; surfacing the actual DAU/WAU/drop-off pattern (Apex’s broker bundle shows corporate Copilot at 44% penetration with 28% drop-off and frontline at 32% / 68% — the Adoption Cliff) makes the dissenter’s "we already have AI" objection answerable with data rather than rhetoric.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'sensitivity-label-and-dlp-coverage',
      label: 'Sensitivity label + DLP coverage map across cohort-indexed content',
      rationale:
        'Copilot output inherits the sensitivity label of its source content; gaps in label coverage become governance incidents within weeks of activation, and the Privacy Counsel needs this map to attest the lawful-basis posture for content embeddings.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
  ],

  prepChecklist: [
    {
      id: 'confirm-first-cohort-measurable-workflow',
      label: 'Confirm the first cohort has a single function and three measurable workflows BEFORE Day 1',
      rationale:
        'The "everywhere-charter" anti-pattern is the dominant Copilot failure pattern; a Day 1 that opens with "we want everyone to be more productive" produces a thin discovery report rather than a defensible cohort decision, and the P1 anti-pattern detector will flag it at the gate.',
    },
    {
      id: 'engage-sharepoint-owner-before-enablement',
      label: 'Engage the SharePoint / Permissions Owner BEFORE Copilot is enabled in the cohort tenant',
      rationale:
        'Oversharing surfaces become irreversible once Copilot has indexed them — the semantic index makes anonymous-link content, broken-inheritance libraries, and stale-group documents discoverable by any cohort user. Engaging the Permissions Owner mid-pilot is too late; remediation has to happen against a measured baseline, not in response to incidents.',
    },
    {
      id: 'confirm-privacy-counsel-content-embedding-posture',
      label: 'Confirm Privacy Counsel sign-off on content-embedding posture and data-residency for the cohort tenant',
      rationale:
        'Content embeddings are a data-processing operation under most privacy regimes; Privacy Counsel sign-off in P1 prevents the P2 charter being rebuilt after the first audit finding and locks lawful-basis citation before transcripts of cohort interactions accumulate.',
    },
    {
      id: 'identify-the-dissenter',
      label: 'Identify the named dissenter — usually the IT lead or CISO delegate who says "we already have ChatGPT licenses; this is duplicate spend"',
      rationale:
        'Stakeholder maps without a dissenter are department RACIs; the "duplicate AI" objection is the single most common reason Copilot programs stall at P3/P4. Surfacing the dissenter on Day 3 with documented rationale turns a quiet blocker into a tractable conversation.',
    },
    {
      id: 'author-falsifiable-time-spent-hypothesis',
      label: 'Author a falsifiable hypothesis: which of the top three workflows will show the largest time-spent-on-task delta, and what evidence would change the answer?',
      rationale:
        'Anti-confirmation discipline. Workshops without a stated hypothesis and falsifiers entering Day 1 become confirmation work; the time-spent baseline on Day 2 inherits the confirmation bias and the P2 readiness recommendation becomes a foregone conclusion.',
    },
    {
      id: 'schedule-hr-change-management-day-2-afternoon',
      label: 'Schedule HR / Change Management Lead for Day 2 afternoon — prompt-literacy curriculum work cannot be deferred to P5',
      rationale:
        'Curriculum authoring has 4–6 week lead time; deferring it to P5 produces "licenses available, no curriculum, adoption flat-lines" — the licence-push-without-backlog failure mode. Locking the HR / Change slot at P1 kickoff is the difference between adoption that holds and adoption that fades.',
    },
    {
      id: 'capture-existing-genai-footprint',
      label: 'Capture existing Copilot / ChatGPT / generative-AI usage telemetry before Day 3',
      rationale:
        'The dissenter’s "we already have AI" objection is unanswerable without data; surfacing actual DAU/WAU/drop-off and prompt patterns from the existing footprint turns a rhetorical objection into a measurable one and informs the cohort-vs-tenant scope decision.',
    },
  ],
};
