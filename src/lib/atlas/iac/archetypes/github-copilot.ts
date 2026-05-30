/**
 * Initiative archetype — GitHub Copilot.
 *
 * Sources cited here must be real and verifiable. Every figure is expressed
 * as a planning range; numbers come from published reports — GitHub's own
 * research, the Stack Overflow Developer Survey, and Microsoft's Work Trend
 * Index. Where a claim could not be tied to a real, dated source, it is
 * omitted.
 *
 * Review cadence: re-verify all sources and `lastReviewed` on the first of
 * each quarter, or whenever the next Octoverse / Developer Survey lands.
 */

import type { InitiativeArchetype } from '../types';

export const githubCopilotArchetype: InitiativeArchetype = {
  archetypeKey: 'github_copilot',
  label: 'GitHub Copilot',
  category: 'ai-coding',
  definition:
    'GitHub Copilot is an AI pair programmer integrated into IDEs (VS Code, JetBrains, Visual Studio, Neovim) and into GitHub itself (Copilot Chat, code review, Workspaces). It produces inline code suggestions, generates whole functions from comments, answers code questions in chat, and increasingly performs agentic tasks across the SDLC under the Copilot brand.',

  adoptionMetrics: [
    {
      metric: 'developer_use_in_year',
      range: {
        label: 'planning-range',
        low: 76,
        high: 76,
        unit: '%',
        cohort: 'professional developers responding to the Stack Overflow Developer Survey',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
    },
    {
      metric: 'github_copilot_paid_users',
      range: {
        label: 'planning-range',
        low: 1_800_000,
        high: 1_800_000,
        unit: 'paid users',
        cohort: 'GitHub Copilot paid subscribers as disclosed by Microsoft',
        sampleSize: 0,
        source: 'Microsoft Q2 FY24 earnings call (Satya Nadella prepared remarks)',
        date: '2024-01',
      },
    },
    {
      metric: 'task_completion_speedup_controlled_study',
      range: {
        label: 'planning-range',
        low: 55,
        high: 55,
        unit: '% faster',
        cohort: '95 developers in a GitHub-run randomized controlled study completing an HTTP server task',
        sampleSize: 95,
        source: 'GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness"',
        date: '2022-09',
      },
    },
    {
      metric: 'self_reported_productivity_gain',
      range: {
        label: 'planning-range',
        low: 60,
        high: 75,
        unit: '% of developers reporting they are more productive',
        cohort: 'developers using GitHub Copilot, self-report survey',
        sampleSize: 2047,
        source: 'GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness"',
        date: '2022-09',
      },
    },
    {
      metric: 'ai_tool_use_in_dev_workflow',
      range: {
        label: 'planning-range',
        low: 62,
        high: 62,
        unit: '% currently using AI tools in their development process',
        cohort: 'all developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
    },
    {
      metric: 'trust_in_ai_tool_accuracy',
      range: {
        label: 'planning-range',
        low: 43,
        high: 43,
        unit: '% who say they trust the accuracy of AI tools in their development workflow',
        cohort: 'developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'ide-inline-completion',
      description:
        'Developers accept tab-completions inline as they type in VS Code, JetBrains, Visual Studio, or Neovim. This is the default deployment surface and the one most use disclosures refer to.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 76,
        high: 76,
        unit: '% of professional developers reporting current or planned use of AI in their workflow',
        cohort: 'professional developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
    },
    {
      pattern: 'copilot-chat-in-ide',
      description:
        'Developers use Copilot Chat panels inside the IDE for explanations, refactors, test scaffolding, and error debugging. GitHub repositions Chat as the gateway to agentic Copilot features such as code review and workspace tasks.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 81,
        high: 81,
        unit: '% of surveyed developers reporting increased productivity with GitHub Copilot',
        cohort: 'developers who used GitHub Copilot for at least three months',
        sampleSize: 2047,
        source: 'GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness"',
        date: '2022-09',
      },
      source: 'GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness"',
      date: '2022-09',
    },
    {
      pattern: 'copilot-for-pull-requests-and-review',
      description:
        'Teams enable Copilot code review on pull requests so the model produces a first-pass review with suggested edits before human reviewers engage. GitHub announced the feature broadly at Universe 2024.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'GitHub Universe 2024 keynote disclosures',
        sampleSize: 0,
        source: 'GitHub Universe 2024 — "Bringing developer choice to GitHub Copilot" (Thomas Dohmke keynote)',
        date: '2024-10',
      },
      source: 'GitHub Universe 2024 — "Bringing developer choice to GitHub Copilot" (Thomas Dohmke keynote)',
      date: '2024-10',
    },
    {
      pattern: 'multi-model-routing',
      description:
        'GitHub Copilot supports model choice at the seat level — OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, and Google Gemini are all selectable. Enterprise admins can constrain which models a tenant uses.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'GitHub Universe 2024 announcement audience',
        sampleSize: 0,
        source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
        date: '2024-10',
      },
      source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
      date: '2024-10',
    },
    {
      pattern: 'copilot-workspace-task-driven',
      description:
        'Copilot Workspace is a task-driven environment where the developer specifies an issue or intent and the agent proposes a spec, a plan, code changes, and tests, with human review at each step. Available in technical preview from GitHub.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'technical preview — no broad prevalence figure',
        cohort: 'Copilot Workspace technical preview waitlist participants',
        sampleSize: 0,
        source: 'GitHub Next — Copilot Workspace technical preview announcement',
        date: '2024-04',
      },
      source: 'GitHub Next — Copilot Workspace technical preview announcement',
      date: '2024-04',
    },
  ],

  trendDirection: {
    direction: 'mainstream-scaling',
    six_month_signal:
      'GitHub Copilot expands from inline completion to agentic SDLC tasks (Workspace, Copilot for PRs, Copilot Extensions), and the brand stretches to cover multi-model routing across OpenAI, Anthropic, and Google.',
    named_driver:
      'GitHub Universe 2024 announcements — multi-model Copilot, Copilot code review, Copilot Workspace, and Copilot Extensions.',
    source: 'GitHub Universe 2024 — Thomas Dohmke keynote',
    date: '2024-10',
  },

  commonPitfalls: [
    {
      name: 'security-of-generated-code-not-reviewed',
      description:
        'Generated suggestions can introduce vulnerabilities or insecure patterns when accepted without review. NYU researchers found a meaningful share of Copilot completions contained security weaknesses in the studied corpus; teams need code review and security tooling on top of acceptance.',
      source: 'Pearce et al., "Asleep at the Keyboard? Assessing the Security of GitHub Copilot’s Code Contributions" (IEEE S&P 2022)',
      date: '2022-05',
    },
    {
      name: 'license-and-attribution-exposure',
      description:
        'Suggestions can closely match training-set code. GitHub ships a duplicate-detection filter ("public code") that admins must enable for enterprise tenants; teams that leave it off accept license-exposure risk.',
      source: 'GitHub Docs — "Configuring GitHub Copilot in your organization" (duplicate-detection filter)',
      date: '2024-11',
    },
    {
      name: 'seat-utilization-drift',
      description:
        'Paid seats that go unused are a routinely-cited governance problem in published Copilot rollouts. Enterprises need a seat-usage telemetry and reclamation loop or per-seat cost outruns realized benefit.',
      source: 'GitHub Docs — "Reviewing usage data for GitHub Copilot Business"',
      date: '2024-09',
    },
    {
      name: 'over-trust-in-accuracy',
      description:
        'Stack Overflow 2024 reports that only 43% of developers trust the accuracy of AI tools; pairing low trust with broad rollout produces friction and rework if quality is not measured at the team level.',
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'professional developers, all industries',
      metric: 'developer_use_in_year',
      range: {
        label: 'planning-range',
        low: 76,
        high: 76,
        unit: '% using or planning to use AI tools in development',
        cohort: 'professional developers, Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
    },
    {
      cohortLabel: 'developers using AI tools',
      metric: 'productivity_self_report',
      range: {
        label: 'planning-range',
        low: 81,
        high: 81,
        unit: '% reporting more productive workflow with Copilot',
        cohort: 'GitHub Copilot users who responded to the GitHub research survey',
        sampleSize: 2047,
        source: 'GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness"',
        date: '2022-09',
      },
    },
    {
      cohortLabel: 'AI-tool-using developers',
      metric: 'trust_in_accuracy',
      range: {
        label: 'planning-range',
        low: 43,
        high: 43,
        unit: '% who trust the accuracy of AI tools',
        cohort: 'developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
    },
  ],

  whatNext: [
    {
      name: 'copilot-workspace-general-availability',
      description:
        'Copilot Workspace progresses from technical preview toward general availability, formalizing task-driven agentic flows (issue → plan → diff → tests) inside GitHub.',
      adoptionStatus: 'limited-availability',
      source: 'GitHub Next — Copilot Workspace technical preview announcement',
      date: '2024-04',
    },
    {
      name: 'copilot-multi-model-routing-default',
      description:
        'Model choice (OpenAI, Anthropic Claude, Google Gemini) becomes a standard feature inside Copilot; enterprises increasingly route by task type and admin policy.',
      adoptionStatus: 'GA-recent',
      source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
      date: '2024-10',
    },
    {
      name: 'copilot-extensions-marketplace',
      description:
        'Third-party Copilot Extensions let vendors (Sentry, Datadog, Stripe, etc.) plug their context into Copilot Chat; the marketplace ships publicly.',
      adoptionStatus: 'GA-recent',
      source: 'GitHub Universe 2024 — Copilot Extensions general availability announcement',
      date: '2024-10',
    },
    {
      name: 'copilot-code-review-on-prs',
      description:
        'Copilot performs a first-pass review on pull requests, posting suggested edits before human reviewers engage. Rolled out from public preview at GitHub Universe 2024.',
      adoptionStatus: 'limited-availability',
      source: 'GitHub Universe 2024 — Thomas Dohmke keynote',
      date: '2024-10',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        '76% of professional developers report current or planned use of AI tools in their development process, and 62% are currently using them.',
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
      url: 'https://survey.stackoverflow.co/2024/ai',
    },
    {
      claim:
        'GitHub Copilot paid subscribers reached 1.8 million as of Microsoft Q2 FY24 earnings, growing 30% quarter-over-quarter.',
      source: 'Microsoft Q2 FY24 earnings call — Satya Nadella prepared remarks',
      date: '2024-01',
      url: 'https://www.microsoft.com/en-us/Investor/earnings/FY-2024-Q2/press-release-webcast',
    },
    {
      claim:
        'In a GitHub-run randomized controlled study, developers using Copilot completed an HTTP server task 55% faster than the control group.',
      source: 'GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness"',
      date: '2022-09',
      url: 'https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/',
    },
    {
      claim:
        'GitHub announced multi-model Copilot (Claude 3.5 Sonnet, Gemini 1.5 Pro, OpenAI o1-preview) and Copilot code review on pull requests at GitHub Universe 2024.',
      source: 'GitHub Universe 2024 — Thomas Dohmke keynote and product blog',
      date: '2024-10',
      url: 'https://github.blog/2024-10-29-bringing-developer-choice-to-copilot/',
    },
    {
      claim:
        'Pearce et al. examined Copilot-generated code in a controlled corpus and reported that a non-trivial fraction of completions contained security weaknesses, underlining the need for code review and security tooling on top of acceptance.',
      source: 'Pearce et al., "Asleep at the Keyboard? Assessing the Security of GitHub Copilot’s Code Contributions" (IEEE Symposium on Security and Privacy 2022)',
      date: '2022-05',
      url: 'https://arxiv.org/abs/2108.09293',
    },
  ],

  lastReviewed: '2026-05-30',
};
