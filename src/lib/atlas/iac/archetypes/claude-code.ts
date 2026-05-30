/**
 * Initiative archetype — Claude Code.
 *
 * Claude Code is Anthropic's command-line and IDE-embedded coding agent.
 * Sources cited are real and verifiable: Anthropic's own product pages,
 * launch posts and engineering blog, and the Stack Overflow Developer Survey
 * (which breaks out Claude usage in development workflows). Where a claim
 * could not be tied to a published, dated source, it is omitted.
 *
 * Review cadence: re-verify each source when a new Anthropic model launches
 * or a new Stack Overflow Developer Survey publishes.
 */

import type { InitiativeArchetype } from '../types';

export const claudeCodeArchetype: InitiativeArchetype = {
  archetypeKey: 'claude_code',
  label: 'Claude Code',
  category: 'ai-coding',
  definition:
    'Claude Code is Anthropic\'s agentic coding tool — a CLI that runs in a developer\'s terminal alongside an IDE, plus an editor integration, that reads and edits code, runs commands, and drives end-to-end development tasks with the Claude model family. It is positioned as an agentic peer to GitHub Copilot and Cursor.',

  adoptionMetrics: [
    {
      metric: 'developer_use_in_year',
      range: {
        label: 'planning-range',
        low: 30,
        high: 30,
        unit: '% who have used Claude in their development process this year (any Claude product)',
        cohort: 'professional developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
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
        unit: '% who trust the accuracy of AI tools in their development workflow',
        cohort: 'developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
      },
    },
    {
      metric: 'enterprise_pilot_signals_named_customers',
      range: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'named enterprise adopters disclosed by Anthropic at launch',
        cohort: 'launch-day customer stories on the Claude 3.5 Sonnet announcement (Bridgewater, Snowflake, Replit, Notion)',
        sampleSize: 0,
        source: 'Anthropic — "Introducing Claude 3.5 Sonnet"',
        date: '2024-06',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'cli-agent-in-terminal',
      description:
        'Developers run Claude Code as a terminal companion to their existing IDE. It reads the repo, runs commands, edits files, and explains its work. This is the primary surface Anthropic ships and documents.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'Claude Code research-preview users at launch',
        sampleSize: 0,
        source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku" (Claude Code research preview)',
        date: '2024-10',
      },
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku" (Claude Code research preview)',
      date: '2024-10',
    },
    {
      pattern: 'agentic-coding-on-real-tasks',
      description:
        'Claude Code is positioned for multi-step engineering tasks — reading codebases, editing across files, running tests, and iterating. Anthropic cites internal use during development of Claude 3.5 Sonnet (new) for refactors and bug fixes.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'Anthropic engineering teams during Claude 3.5 Sonnet (new) development',
        sampleSize: 0,
        source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
        date: '2024-10',
      },
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
      date: '2024-10',
    },
    {
      pattern: 'swe-bench-verified-benchmark-positioning',
      description:
        'Anthropic positions Claude on the SWE-bench Verified benchmark — a curated subset of real GitHub issues — as a proxy for end-to-end coding-agent quality. Claude 3.5 Sonnet (new) was disclosed at 49.0% on SWE-bench Verified at launch.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 49,
        high: 49,
        unit: '% of SWE-bench Verified tasks solved',
        cohort: 'SWE-bench Verified benchmark (500 problems)',
        sampleSize: 500,
        source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
        date: '2024-10',
      },
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
      date: '2024-10',
    },
    {
      pattern: 'embedded-into-third-party-coding-tools',
      description:
        'Claude is selectable as a backing model in third-party coding tools, including GitHub Copilot\'s multi-model surface and Cursor. This is a Claude-model deployment pattern, not Claude Code itself, but is the most common way teams encounter Claude in development today.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'GitHub Copilot enterprise tenants offered multi-model routing at Universe 2024',
        sampleSize: 0,
        source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
        date: '2024-10',
      },
      source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
      date: '2024-10',
    },
  ],

  trendDirection: {
    direction: 'emerging',
    six_month_signal:
      'Claude Code transitions from research preview toward broader availability and pairs with Anthropic\'s computer-use capability; meanwhile Claude becomes a default selectable model inside GitHub Copilot and Cursor.',
    named_driver:
      'October 2024 Anthropic launch of upgraded Claude 3.5 Sonnet, Claude 3.5 Haiku, computer use, and the Claude Code research preview.',
    source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
    date: '2024-10',
  },

  commonPitfalls: [
    {
      name: 'agent-takes-irreversible-actions',
      description:
        'A CLI agent that can run commands and edit files can also delete files, push branches, or run destructive scripts if invoked without guardrails. Anthropic\'s own guidance emphasizes running Claude Code with the smallest scope and reversible commands.',
      source: 'Anthropic Docs — Claude Code overview (guardrails and permission model)',
      date: '2024-10',
    },
    {
      name: 'data-leakage-via-agent-context',
      description:
        'Agentic tools read source, environment, and shell context to do their work. Without explicit allow/deny lists and review, sensitive secrets or proprietary code can be sent to the model. Enterprise rollouts need a data-handling policy and tenant-scoped configuration.',
      source: 'Anthropic — "Claude Enterprise plan" overview (data isolation commitments)',
      date: '2024-09',
    },
    {
      name: 'over-trust-in-accuracy',
      description:
        'Stack Overflow 2024 reports only 43% of developers trust the accuracy of AI tools — accepting an agent\'s diff without read-back or test coverage compounds risk for codebases that Claude Code has just edited.',
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
    },
    {
      name: 'benchmark-to-real-task-gap',
      description:
        'SWE-bench Verified pass rates are a useful proxy but do not generalize to all enterprise codebases. Teams that take a 49% benchmark and apply it to capacity planning will mis-size their pilot.',
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
      date: '2024-10',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'professional developers, all industries',
      metric: 'developer_use_of_claude_in_year',
      range: {
        label: 'planning-range',
        low: 30,
        high: 30,
        unit: '% who used Claude in their development process during the year',
        cohort: 'professional developers, Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024',
        date: '2024-07',
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
    {
      cohortLabel: 'SWE-bench Verified benchmark (proxy)',
      metric: 'swe_bench_verified_pass_rate',
      range: {
        label: 'planning-range',
        low: 49,
        high: 49,
        unit: '% of SWE-bench Verified tasks solved by Claude 3.5 Sonnet (new) at launch',
        cohort: 'SWE-bench Verified benchmark (500 curated GitHub issues)',
        sampleSize: 500,
        source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
        date: '2024-10',
      },
    },
  ],

  whatNext: [
    {
      name: 'claude-code-from-research-preview-to-broad-availability',
      description:
        'Claude Code progresses from research preview to broader availability with billing, SSO, and enterprise admin controls suitable for managed rollouts.',
      adoptionStatus: 'limited-availability',
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku" (Claude Code research preview announcement)',
      date: '2024-10',
    },
    {
      name: 'claude-as-default-model-in-third-party-coding-tools',
      description:
        'Claude becomes a routinely-selectable default model in GitHub Copilot and Cursor; enterprises route by task type rather than by single-provider lock-in.',
      adoptionStatus: 'GA-recent',
      source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
      date: '2024-10',
    },
    {
      name: 'computer-use-paired-with-coding-agents',
      description:
        'Anthropic\'s computer-use capability — letting Claude operate a desktop directly — is positioned as a building block alongside Claude Code, with public beta access announced for developers.',
      adoptionStatus: 'early-pilots',
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
      date: '2024-10',
    },
    {
      name: 'enterprise-plan-data-controls-formalized',
      description:
        'Anthropic\'s Claude Enterprise plan formalizes SSO, audit logging, data residency, and zero-retention commitments, making Claude Code more procurement-viable for regulated enterprises.',
      adoptionStatus: 'GA-recent',
      source: 'Anthropic — "Introducing the Claude Enterprise plan"',
      date: '2024-09',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'Anthropic announced the Claude Code research preview alongside an upgraded Claude 3.5 Sonnet (reported at 49.0% on SWE-bench Verified) and Claude 3.5 Haiku.',
      source: 'Anthropic — "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku"',
      date: '2024-10',
      url: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
    },
    {
      claim:
        'Anthropic launched the Claude Enterprise plan with SSO, audit logs, and data-retention controls aimed at regulated enterprise deployments.',
      source: 'Anthropic — "Introducing the Claude Enterprise plan"',
      date: '2024-09',
      url: 'https://www.anthropic.com/news/introducing-the-claude-enterprise-plan',
    },
    {
      claim:
        'At launch, Claude 3.5 Sonnet was cited by named enterprise adopters including Bridgewater, Snowflake, Replit, and Notion.',
      source: 'Anthropic — "Introducing Claude 3.5 Sonnet"',
      date: '2024-06',
      url: 'https://www.anthropic.com/news/claude-3-5-sonnet',
    },
    {
      claim:
        'GitHub announced that Anthropic\'s Claude 3.5 Sonnet is selectable inside GitHub Copilot as part of multi-model routing.',
      source: 'GitHub blog — "Bringing developer choice to Copilot with Anthropic\'s Claude 3.5 Sonnet, Google\'s Gemini 1.5 Pro, and OpenAI\'s o1-preview"',
      date: '2024-10',
      url: 'https://github.blog/2024-10-29-bringing-developer-choice-to-copilot/',
    },
    {
      claim:
        '30% of professional developers reported using Claude in their development workflow in the Stack Overflow Developer Survey 2024, alongside 62% who said they currently use AI tools in their development process.',
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
      url: 'https://survey.stackoverflow.co/2024/ai',
    },
  ],

  lastReviewed: '2026-05-30',
};
