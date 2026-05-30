/**
 * Initiative archetype — Cursor.
 *
 * Cursor (by Anysphere) is an AI-first IDE forked from VS Code. Sources cited
 * here are real and verifiable: Anysphere/Cursor's own blog posts and funding
 * announcements, Andreessen Horowitz's published investment notes, the Stack
 * Overflow Developer Survey 2024 (which separately measures Cursor adoption),
 * and a small number of CEO/co-founder interviews where ARR or user counts
 * are stated on the record.
 *
 * Where a number could not be tied to a primary, dated, verifiable source it
 * is omitted. Secondary tech press recaps without a primary source are not
 * cited.
 *
 * Review cadence: re-verify each source on the next Stack Overflow Developer
 * Survey release, the next Anysphere funding announcement, or whenever
 * Cursor publishes an updated usage figure on its blog.
 */

import type { InitiativeArchetype } from '../types';

export const cursorArchetype: InitiativeArchetype = {
  archetypeKey: 'cursor',
  label: 'Cursor',
  category: 'ai-coding',
  definition:
    'Cursor is an AI-first code editor built and shipped by Anysphere, originally forked from VS Code and re-architected around model-assisted editing — inline completion, multi-file edits ("Composer"), an agent mode that drives end-to-end tasks, and Cursor Tab for predictive next-edit suggestions. It is positioned alongside GitHub Copilot and Claude Code as a primary surface for AI-assisted coding.',

  adoptionMetrics: [
    {
      metric: 'cursor_use_in_year',
      range: {
        label: 'planning-range',
        low: 1.2,
        high: 1.2,
        unit: '% of professional developers reporting Cursor use in the past year',
        cohort: 'professional developers responding to the Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024 — AI section, "AI search and developer tools"',
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
      metric: 'anysphere_annualized_revenue',
      range: {
        label: 'planning-range',
        low: 100_000_000,
        high: 100_000_000,
        unit: 'USD annualized revenue disclosed at the Series B round',
        cohort: 'Anysphere (Cursor) as disclosed in the Series B announcement and a16z investment note',
        sampleSize: 0,
        source: 'Andreessen Horowitz — "Investing in Anysphere" (Cursor Series B note)',
        date: '2024-12',
      },
    },
    {
      metric: 'series_b_funding_amount',
      range: {
        label: 'planning-range',
        low: 105_000_000,
        high: 105_000_000,
        unit: 'USD raised at $2.6B valuation, Series B',
        cohort: 'Anysphere Series B led by Thrive Capital with Andreessen Horowitz participation',
        sampleSize: 0,
        source: 'Andreessen Horowitz — "Investing in Anysphere" (Cursor Series B note)',
        date: '2024-12',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'cursor-as-primary-ide',
      description:
        'Developers install Cursor in place of (or alongside) VS Code as their primary editor. Cursor inherits the VS Code extension ecosystem, which is what makes adoption frictionless for VS Code users — the published positioning on the Cursor site and in funding coverage.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 1.2,
        high: 1.2,
        unit: '% of professional developers reporting Cursor use in the past year',
        cohort: 'professional developers responding to Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024 — AI section',
        date: '2024-07',
      },
      source: 'Stack Overflow Developer Survey 2024 — AI section',
      date: '2024-07',
    },
    {
      pattern: 'cursor-tab-predictive-next-edit',
      description:
        'Cursor Tab predicts the developer\'s next edit — not just completion at the cursor, but the next change anywhere in the file — and lets the developer accept it with a single keystroke. Anysphere positions this as Cursor\'s flagship differentiator in its launch and feature notes.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'Cursor users at Series B disclosure',
        sampleSize: 0,
        source: 'Cursor blog — "Cursor Tab" feature post',
        date: '2024-09',
      },
      source: 'Cursor blog — "Cursor Tab" feature post',
      date: '2024-09',
    },
    {
      pattern: 'composer-multi-file-edits',
      description:
        'Composer is Cursor\'s multi-file edit surface — the developer states an intent in natural language and Cursor proposes coordinated edits across multiple files with a single diff to review. Documented on the Cursor product site and in changelog notes.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'Cursor users with Composer enabled',
        sampleSize: 0,
        source: 'Cursor changelog — Composer general availability',
        date: '2024-10',
      },
      source: 'Cursor changelog — Composer general availability',
      date: '2024-10',
    },
    {
      pattern: 'agent-mode-end-to-end-tasks',
      description:
        'Cursor Agent mode runs multi-step tasks autonomously inside the editor — reading the repo, running commands, editing files, and iterating. Positioned as the agentic counterpart to Cursor Tab and Composer.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'Cursor users with Agent mode enabled',
        sampleSize: 0,
        source: 'Cursor changelog — Agent mode release notes',
        date: '2024-11',
      },
      source: 'Cursor changelog — Agent mode release notes',
      date: '2024-11',
    },
    {
      pattern: 'multi-model-routing',
      description:
        'Cursor lets developers select among OpenAI, Anthropic Claude, and Google Gemini models per task; enterprise tenants can constrain which models are available. Documented on the Cursor model selection page.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'Cursor users with model selection exposed',
        sampleSize: 0,
        source: 'Cursor documentation — Models page',
        date: '2024-11',
      },
      source: 'Cursor documentation — Models page',
      date: '2024-11',
    },
  ],

  trendDirection: {
    direction: 'mainstream-scaling',
    six_month_signal:
      'Cursor expands from inline completion and Tab into agentic multi-file workflows (Composer, Agent mode) and is increasingly cited alongside GitHub Copilot as a primary surface for AI coding. Anysphere\'s funding trajectory and disclosed revenue growth signal continued investment in agentic features and enterprise controls.',
    named_driver:
      'Anysphere Series B at $2.6B valuation (Dec 2024), with disclosed $100M ARR, led by Thrive Capital with Andreessen Horowitz participation — explicitly tied to scaling Cursor\'s agent features and enterprise readiness.',
    source: 'Andreessen Horowitz — "Investing in Anysphere" (Cursor Series B note)',
    date: '2024-12',
  },

  commonPitfalls: [
    {
      name: 'multi-file-edit-blast-radius',
      description:
        'Composer and Agent mode can propose coordinated changes across many files; accepting a diff without reviewing the full blast radius can introduce regressions that span modules. Reviewers need to read the whole diff, not just the touched file, and CI must gate the merge.',
      source: 'Cursor changelog — Composer general availability',
      date: '2024-10',
    },
    {
      name: 'data-handling-and-privacy-mode',
      description:
        'By default Cursor sends code to the model provider; Cursor\'s Privacy Mode opts the tenant out of having prompts/code retained for training. Enterprise rollouts that do not enable Privacy Mode or do not enforce it via SSO group policy carry retention-risk exposure.',
      source: 'Cursor documentation — Privacy & Security page (Privacy Mode)',
      date: '2024-10',
    },
    {
      name: 'over-trust-in-accuracy',
      description:
        'Stack Overflow 2024 reports only 43% of developers trust the accuracy of AI tools. Cursor users accepting Tab predictions and Composer diffs without inspection compound this — pairing the editor with required code review and test coverage is what keeps the productivity gain from becoming rework.',
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
    },
    {
      name: 'license-and-attribution-exposure',
      description:
        'Like other code-generation tools, Cursor suggestions can closely resemble training-set code. Cursor does not currently ship a duplicate-detection filter analogous to GitHub Copilot\'s; legal and security teams should weigh acceptance policies for high-risk repositories.',
      source: 'Cursor documentation — Privacy & Security page',
      date: '2024-10',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'professional developers, all industries',
      metric: 'cursor_use_in_year',
      range: {
        label: 'planning-range',
        low: 1.2,
        high: 1.2,
        unit: '% reporting Cursor use in their development workflow',
        cohort: 'professional developers, Stack Overflow Developer Survey 2024',
        sampleSize: 65437,
        source: 'Stack Overflow Developer Survey 2024 — AI section',
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
      cohortLabel: 'AI coding tools — vendor revenue scale',
      metric: 'annualized_revenue',
      range: {
        label: 'planning-range',
        low: 100_000_000,
        high: 100_000_000,
        unit: 'USD ARR disclosed at Anysphere Series B',
        cohort: 'Anysphere (Cursor)',
        sampleSize: 0,
        source: 'Andreessen Horowitz — "Investing in Anysphere"',
        date: '2024-12',
      },
    },
  ],

  whatNext: [
    {
      name: 'cursor-agent-mode-general-availability',
      description:
        'Cursor Agent mode progresses from initial release toward broader availability and richer tool use, formalizing autonomous multi-step task execution inside the editor.',
      adoptionStatus: 'GA-recent',
      source: 'Cursor changelog — Agent mode release notes',
      date: '2024-11',
    },
    {
      name: 'enterprise-controls-and-privacy-mode-default',
      description:
        'Anysphere expands enterprise controls — SSO, audit logging, group-policy enforcement of Privacy Mode — as Cursor moves up-market into regulated buyers. Disclosed as a priority in the Series B announcement.',
      adoptionStatus: 'limited-availability',
      source: 'Andreessen Horowitz — "Investing in Anysphere" (Cursor Series B note)',
      date: '2024-12',
    },
    {
      name: 'multi-model-routing-by-task-default',
      description:
        'Cursor users increasingly route by task type — Claude for refactors, OpenAI for completion, Gemini for long-context tasks — rather than single-provider lock-in. Mirrors GitHub Copilot\'s multi-model move at Universe 2024.',
      adoptionStatus: 'GA-recent',
      source: 'Cursor documentation — Models page',
      date: '2024-11',
    },
    {
      name: 'composer-as-primary-multi-file-surface',
      description:
        'Composer becomes the default surface for non-trivial edits, displacing single-file inline completion as the unit of work for experienced Cursor users.',
      adoptionStatus: 'GA-recent',
      source: 'Cursor changelog — Composer general availability',
      date: '2024-10',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'Anysphere (Cursor) raised a $105M Series B at a $2.6B valuation led by Thrive Capital with Andreessen Horowitz participation, with disclosed annualized revenue of approximately $100M.',
      source: 'Andreessen Horowitz — "Investing in Anysphere" (Cursor Series B investment note)',
      date: '2024-12',
      url: 'https://a16z.com/announcement/investing-in-anysphere/',
    },
    {
      claim:
        'Stack Overflow Developer Survey 2024 separately reports Cursor among the AI search and developer tools developers have used in the past year, alongside the 62% of developers currently using AI tools in development and 43% who trust their accuracy.',
      source: 'Stack Overflow Developer Survey 2024 — AI section',
      date: '2024-07',
      url: 'https://survey.stackoverflow.co/2024/ai',
    },
    {
      claim:
        'Cursor Tab — predictive next-edit suggestion across the file — is positioned as Cursor\'s flagship differentiator and is documented on the Cursor product blog.',
      source: 'Cursor blog — "Cursor Tab"',
      date: '2024-09',
      url: 'https://www.cursor.com/blog/tab-update',
    },
    {
      claim:
        'Composer (multi-file edits) and Agent mode (end-to-end autonomous tasks) are documented in the Cursor changelog as the agentic surfaces above Tab and inline completion.',
      source: 'Cursor changelog',
      date: '2024-11',
      url: 'https://www.cursor.com/changelog',
    },
    {
      claim:
        'Cursor provides a Privacy Mode that opts the tenant out of model-provider training retention; enterprise teams enable it via group policy.',
      source: 'Cursor documentation — Privacy & Security',
      date: '2024-10',
      url: 'https://docs.cursor.com/account/privacy',
    },
  ],

  lastReviewed: '2026-05-30',
};
