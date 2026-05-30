/**
 * Initiative archetype — AI-led product development.
 *
 * Covers the pattern variously labelled "vibe coding," AI-first prototyping,
 * and AI-led PRD-to-prototype workflows in which a non-engineer or a single
 * engineer drives end-to-end product development through natural-language
 * instructions to a model rather than through a traditional spec→design→
 * implement cycle. Surfaces include Replit Agent, v0 by Vercel, Lovable,
 * Bolt.new, and Anysphere/Cursor's Agent mode used in this style.
 *
 * Honesty discipline: this is a harder archetype to source rigorously than
 * the named-product archetypes. Numeric figures are restricted to claims
 * that map to a primary, dated, verifiable source. Where no such source
 * exists for a number, the figure is omitted and the archetype relies on
 * qualitative deployment patterns, pitfalls, and "what next" anchored to
 * cited product launches and named-driver statements.
 *
 * Review cadence: re-verify when Y Combinator publishes new batch statistics,
 * when a tracked vendor (Replit, Vercel, Lovable, Bolt) discloses updated
 * usage figures, or whenever the next Stack Overflow Developer Survey lands.
 */

import type { InitiativeArchetype } from '../types';

export const aiLedProductDevelopmentArchetype: InitiativeArchetype = {
  archetypeKey: 'ai_led_product_development',
  label: 'AI-led product development',
  category: 'ai-product-dev',
  definition:
    'A product-development pattern — popularly labelled "vibe coding" after Andrej Karpathy\'s February 2025 framing — in which a single operator (often a non-engineer or solo engineer) drives end-to-end build of a working product by instructing an AI agent in natural language, rather than authoring code through a traditional spec → design → implement cycle. Surfaces include Replit Agent, v0 by Vercel, Lovable, Bolt.new, and Cursor Agent used in this mode.',

  adoptionMetrics: [
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
      metric: 'yc_w25_ai_written_code_share',
      range: {
        label: 'planning-range',
        low: 95,
        high: 100,
        unit: '% of codebase written by AI, for ~25% of YC Winter 2025 batch companies (Garry Tan on-record)',
        cohort: 'Y Combinator Winter 2025 batch (~280 companies)',
        sampleSize: 280,
        source: 'Garry Tan (Y Combinator CEO) — public interview/remarks on YC W25 batch coding mix',
        date: '2025-03',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'prompt-to-prototype-replit-agent',
      description:
        'A user describes the product they want in natural language and Replit Agent provisions a runnable, hosted app — code, environment, database — without the user authoring code directly. Replit launched Agent in September 2024 as the named productized surface for this pattern.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'Replit Agent early-access users at launch',
        sampleSize: 0,
        source: 'Replit blog — "Introducing Replit Agent"',
        date: '2024-09',
      },
      source: 'Replit blog — "Introducing Replit Agent"',
      date: '2024-09',
    },
    {
      pattern: 'prompt-to-ui-v0-vercel',
      description:
        'A user describes a UI in natural language and v0 by Vercel generates React/Next.js component code that can be copied into a project or deployed. Vercel positions v0 as a generative-UI surface aimed at the prompt-to-product workflow.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'v0 users at the GA announcement',
        sampleSize: 0,
        source: 'Vercel blog — "Generative user interfaces" (v0)',
        date: '2024-10',
      },
      source: 'Vercel blog — "Generative user interfaces" (v0)',
      date: '2024-10',
    },
    {
      pattern: 'full-stack-prompt-to-app-lovable-bolt',
      description:
        'Lovable and Bolt.new produce full-stack web apps from a single natural-language prompt — generating frontend, backend wiring, and database schema in one pass — and host the resulting app for the user without the user touching the code. Both products launched publicly in 2024 and disclosed rapid early growth.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-feature prevalence figure',
        cohort: 'Lovable and Bolt.new users at GA',
        sampleSize: 0,
        source: 'Bolt.new launch announcement (StackBlitz) and Lovable launch announcement',
        date: '2024-10',
      },
      source: 'Bolt.new launch announcement (StackBlitz) and Lovable launch announcement',
      date: '2024-10',
    },
    {
      pattern: 'agent-mode-in-existing-ide',
      description:
        'Operators use agent modes inside conventional editors — Cursor Agent, Claude Code, Aider — to drive product development through prompts rather than direct authoring. The pattern overlaps with traditional AI-coding but the workflow is different: the operator describes intent and reviews diffs rather than writing code.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published per-pattern prevalence figure',
        cohort: 'developers using agent-mode features inside AI-first IDEs',
        sampleSize: 0,
        source: 'Cursor changelog — Agent mode release notes',
        date: '2024-11',
      },
      source: 'Cursor changelog — Agent mode release notes',
      date: '2024-11',
    },
  ],

  trendDirection: {
    direction: 'emerging',
    six_month_signal:
      'The "vibe coding" label and pattern enter mainstream tech discourse following Andrej Karpathy\'s February 2025 framing; Y Combinator publicly cites a meaningful share of its current batch as predominantly AI-written; productized surfaces (Replit Agent, v0, Lovable, Bolt.new) move from launch to broad availability and start to disclose user growth.',
    named_driver:
      'Andrej Karpathy\'s February 2025 framing of "vibe coding" — the term that crystallized the pattern in public discourse — combined with the September–October 2024 productized launches of Replit Agent, v0 by Vercel, Lovable, and Bolt.new.',
    source: 'Andrej Karpathy — "vibe coding" public post (February 2025)',
    date: '2025-02',
  },

  commonPitfalls: [
    {
      name: 'no-architect-no-architecture',
      description:
        'When the operator does not understand the generated code or the runtime, decisions about data modeling, authentication, secrets handling, and deployment topology become implicit and unreviewable. Pilots that ship without a named technical owner accumulate hidden architectural debt that surfaces under real load.',
      source: 'Andrej Karpathy — "vibe coding" public post (acknowledging the operator does not read all generated code)',
      date: '2025-02',
    },
    {
      name: 'security-and-secrets-handling',
      description:
        'Prompt-to-app surfaces auto-generate database schemas, API keys, and authentication patterns; if the operator does not read what was generated, secrets can be hard-coded, RLS can be missing, and tenant isolation can be broken in ways that only surface in production. Replit, Vercel, and similar vendors publish guidance specifically calling this out.',
      source: 'Replit blog — "Introducing Replit Agent" (production-readiness caveats)',
      date: '2024-09',
    },
    {
      name: 'over-trust-in-accuracy',
      description:
        'Stack Overflow 2024 reports only 43% of developers trust the accuracy of AI tools — an operator who is not a developer is even less equipped to detect subtle generated-code bugs. Production rollouts of prompt-built products without code review and automated tests compound this risk.',
      source: 'Stack Overflow Developer Survey 2024',
      date: '2024-07',
    },
    {
      name: 'rewrite-treadmill-when-model-context-fills',
      description:
        'Prompt-to-app surfaces work well at the zero-to-one stage; as the codebase grows beyond the model\'s effective context window, prompts that previously produced clean diffs start producing inconsistent or regressive output, and the operator can find themselves rewriting working code to escape the loop. Documented anecdotally in vendor launch posts and Karpathy\'s framing.',
      source: 'Andrej Karpathy — "vibe coding" public post',
      date: '2025-02',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'professional developers, all industries',
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
      cohortLabel: 'early-stage startups (YC W25 batch)',
      metric: 'ai_written_code_share',
      range: {
        label: 'planning-range',
        low: 95,
        high: 100,
        unit: '% of codebase written by AI, for ~25% of YC W25 companies (Garry Tan on-record)',
        cohort: 'Y Combinator Winter 2025 batch (~280 companies)',
        sampleSize: 280,
        source: 'Garry Tan (Y Combinator CEO) — public remarks on YC W25 batch coding mix',
        date: '2025-03',
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
      name: 'productized-prompt-to-app-platforms-go-mainstream',
      description:
        'Replit Agent, v0 by Vercel, Lovable, and Bolt.new move from launch to broad availability with enterprise controls (SSO, audit, deployment to controlled environments), and start showing up in the build-vs-buy conversation for internal tools and prototypes.',
      adoptionStatus: 'GA-recent',
      source: 'Replit, Vercel, Lovable, Bolt.new public launch posts (Sept–Oct 2024)',
      date: '2024-10',
    },
    {
      name: 'vibe-coding-enters-mainstream-discourse',
      description:
        'Andrej Karpathy\'s February 2025 "vibe coding" post crystallized the label; it shows up in YC batch announcements, vendor positioning, and CIO discussions about whether to staff PMs against the pattern.',
      adoptionStatus: 'early-pilots',
      source: 'Andrej Karpathy — "vibe coding" public post',
      date: '2025-02',
    },
    {
      name: 'enterprise-guardrails-and-handoff-patterns-emerge',
      description:
        'Enterprises that allow prompt-to-app for prototypes establish a "graduation" gate — code review, security review, architecture sign-off — before any prompt-built artifact moves to production. The pattern emerges in vendor documentation and CIO playbooks during 2025.',
      adoptionStatus: 'early-pilots',
      source: 'Replit blog — "Introducing Replit Agent" (production-readiness caveats)',
      date: '2024-09',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        'Andrej Karpathy publicly framed "vibe coding" in February 2025 — describing a workflow where the operator instructs the model in natural language, accepts diffs without reading all generated code, and treats the model output as the primary artifact. This post is the named driver for the label entering mainstream discourse.',
      source: 'Andrej Karpathy — "vibe coding" public post on X',
      date: '2025-02',
      url: 'https://x.com/karpathy/status/1886192184808149383',
    },
    {
      claim:
        'Replit launched Replit Agent in September 2024 as a productized prompt-to-app surface — a natural-language interface that provisions a runnable, hosted application end-to-end.',
      source: 'Replit blog — "Introducing Replit Agent"',
      date: '2024-09',
      url: 'https://blog.replit.com/introducing-replit-agent',
    },
    {
      claim:
        'Vercel ships v0 as a generative-UI product targeting prompt-to-UI workflows; the underlying SDK and product are documented on Vercel\'s blog and product pages.',
      source: 'Vercel blog — "Generative user interfaces" (v0)',
      date: '2024-10',
      url: 'https://vercel.com/blog/announcing-vercel-ai-sdk-3-generative-ui',
    },
    {
      claim:
        'StackBlitz launched Bolt.new in October 2024 as a browser-native prompt-to-fullstack-app surface; the launch announcement documents the product and its early growth.',
      source: 'StackBlitz blog — "Introducing Bolt.new"',
      date: '2024-10',
      url: 'https://blog.stackblitz.com/posts/introducing-bolt-new/',
    },
    {
      claim:
        'Y Combinator CEO Garry Tan stated on the record that roughly 25% of YC Winter 2025 batch companies had 95%+ of their codebase written by AI — a public datapoint anchoring how far the pattern has progressed in early-stage startups.',
      source: 'Garry Tan (Y Combinator CEO) — public remarks on YC W25 batch coding mix',
      date: '2025-03',
    },
  ],

  lastReviewed: '2026-05-30',
};
