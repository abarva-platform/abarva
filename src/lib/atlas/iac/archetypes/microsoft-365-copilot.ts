/**
 * Initiative archetype — Microsoft 365 Copilot.
 *
 * Microsoft 365 Copilot is Microsoft's generative-AI assistant embedded into
 * Word, Excel, PowerPoint, Outlook, Teams, and the Microsoft 365 app, plus
 * Business Chat ("Copilot Chat") grounded on tenant Graph content. Sources
 * cited here are real and verifiable: the Microsoft Work Trend Index (2023,
 * 2024, and 2025 editions), Microsoft FY24 and FY25 earnings calls (Satya
 * Nadella and Amy Hood prepared remarks), Forrester's Total Economic Impact
 * study commissioned by Microsoft (labelled as vendor-commissioned in the
 * source string per the honesty contract), Microsoft customer case studies,
 * and the Build / Ignite product announcements that introduced Copilot
 * Pages, Copilot agents, and the Copilot Wave 2 redesign.
 *
 * Where a claim could not be tied to a published, dated source, it is
 * omitted. Forrester TEI numbers are labelled "Forrester TEI commissioned by
 * Microsoft" so consumers see the vendor-commissioned status; the figures
 * themselves are kept tight and conservative.
 *
 * Review cadence: re-verify each source when a new Work Trend Index lands
 * (typically May), when Microsoft's quarterly earnings disclose new Copilot
 * paid-seat or growth signals, and when Microsoft Build or Ignite ships a
 * material Copilot product change.
 */

import type { InitiativeArchetype } from '../types';

export const microsoft365CopilotArchetype: InitiativeArchetype = {
  archetypeKey: 'microsoft_365_copilot',
  label: 'Microsoft 365 Copilot',
  category: 'ai-productivity',
  definition:
    'Microsoft 365 Copilot is Microsoft\'s generative-AI assistant embedded inside Word, Excel, PowerPoint, Outlook, Teams, OneNote, and Loop, plus Business Chat ("Copilot Chat") which reasons over tenant Microsoft Graph content. It generates drafts, summarises meetings and threads, edits documents, answers Graph-grounded questions, and — with Copilot Studio — lets enterprises build and publish custom agents that plug into the same surface.',

  adoptionMetrics: [
    {
      metric: 'global_knowledge_workers_using_genai_at_work',
      range: {
        label: 'planning-range',
        low: 75,
        high: 75,
        unit: '% of global knowledge workers reporting they use generative AI at work',
        cohort: 'knowledge workers surveyed across 31 countries by Microsoft and LinkedIn',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024 — "AI at Work Is Here. Now Comes the Hard Part."',
        date: '2024-05',
      },
    },
    {
      metric: 'genai_use_growth_year_over_year',
      range: {
        label: 'planning-range',
        low: 46,
        high: 75,
        unit: '% point growth: 46% in 2023 to 75% in 2024 of knowledge workers using AI at work',
        cohort: 'knowledge workers surveyed by Microsoft and LinkedIn (year-over-year compare)',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
        date: '2024-05',
      },
    },
    {
      metric: 'leaders_concerned_org_lacks_ai_vision',
      range: {
        label: 'planning-range',
        low: 60,
        high: 60,
        unit: '% of leaders worried their organisation lacks a plan and vision to implement AI',
        cohort: 'leaders surveyed in Microsoft and LinkedIn Work Trend Index 2024',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
        date: '2024-05',
      },
    },
    {
      metric: 'employees_bringing_own_ai_to_work_byoai',
      range: {
        label: 'planning-range',
        low: 78,
        high: 78,
        unit: '% of AI users bringing their own AI tools to work (BYOAI) when not provided by employer',
        cohort: 'AI users surveyed in Microsoft and LinkedIn Work Trend Index 2024',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
        date: '2024-05',
      },
    },
    {
      metric: 'copilot_users_time_saved_self_reported',
      range: {
        label: 'planning-range',
        low: 14,
        high: 14,
        unit: 'minutes/day saved by Copilot users (median self-report)',
        cohort: 'Microsoft 365 Copilot early-access customers tracked in WTI Special Report',
        sampleSize: 0,
        source: 'Microsoft Work Trend Index Special Report — "What Can Copilot\'s Earliest Users Teach Us About Generative AI at Work?"',
        date: '2023-11',
      },
    },
    {
      metric: 'copilot_users_feeling_more_productive',
      range: {
        label: 'planning-range',
        low: 70,
        high: 70,
        unit: '% of Copilot early users reporting they were more productive',
        cohort: 'Microsoft 365 Copilot early-access customers tracked in WTI Special Report',
        sampleSize: 0,
        source: 'Microsoft Work Trend Index Special Report — "What Can Copilot\'s Earliest Users Teach Us About Generative AI at Work?"',
        date: '2023-11',
      },
    },
    {
      metric: 'copilot_users_better_quality_of_work',
      range: {
        label: 'planning-range',
        low: 68,
        high: 68,
        unit: '% of Copilot early users reporting improved quality of their work',
        cohort: 'Microsoft 365 Copilot early-access customers tracked in WTI Special Report',
        sampleSize: 0,
        source: 'Microsoft Work Trend Index Special Report — "What Can Copilot\'s Earliest Users Teach Us About Generative AI at Work?"',
        date: '2023-11',
      },
    },
    {
      metric: 'tei_three_year_roi_modelled',
      range: {
        label: 'planning-range',
        low: 132,
        high: 353,
        unit: '% modelled three-year ROI range for a composite organisation',
        cohort: 'composite organisation interviewed across customers for a vendor-commissioned TEI',
        sampleSize: 0,
        source: 'Forrester TEI commissioned by Microsoft — "The Total Economic Impact Of Microsoft Copilot For Microsoft 365"',
        date: '2024-11',
      },
    },
  ],

  deploymentPatterns: [
    {
      pattern: 'in-app-copilot-side-pane',
      description:
        'Users invoke Copilot inside Word, Excel, PowerPoint, Outlook, and OneNote via the side pane or ribbon. This is the default deployment surface — drafting, summarising, rewriting, and editing inside the document the user is already in.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 75,
        high: 75,
        unit: '% of knowledge workers using AI at work in 2024 (most encounter Copilot through Microsoft 365 apps where licensed)',
        cohort: 'knowledge workers surveyed across 31 countries by Microsoft and LinkedIn',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
        date: '2024-05',
      },
      source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
      date: '2024-05',
    },
    {
      pattern: 'business-chat-graph-grounded',
      description:
        'Business Chat ("Copilot Chat" in the Microsoft 365 app and Teams) reasons over the tenant\'s Microsoft Graph — emails, files, chats, calendars — to answer questions and produce content grounded in the user\'s own data. Microsoft renamed and expanded this surface in the Wave 2 update.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'Microsoft 365 Copilot Wave 2 announcement audience',
        sampleSize: 0,
        source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents" (Jared Spataro)',
        date: '2024-09',
      },
      source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents" (Jared Spataro)',
      date: '2024-09',
    },
    {
      pattern: 'copilot-pages-collaborative-canvas',
      description:
        'Copilot Pages is a persistent, multiplayer canvas where the user and Copilot co-edit content grounded on Graph context. Microsoft positions Pages as "the first new artefact for the AI era" and made it generally available in the Wave 2 release.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'Microsoft 365 Copilot Wave 2 announcement audience',
        sampleSize: 0,
        source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents"',
        date: '2024-09',
      },
      source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents"',
      date: '2024-09',
    },
    {
      pattern: 'copilot-studio-agents-on-tenant-data',
      description:
        'Enterprises build custom agents in Copilot Studio that act over their own data and processes, then publish them into Microsoft 365 Copilot, Teams, and a stand-alone agent surface. Microsoft announced autonomous agents at Ignite 2024 and Build 2024.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure',
        cohort: 'Microsoft Ignite 2024 product announcement audience',
        sampleSize: 0,
        source: 'Microsoft — "New autonomous agents scale your team like never before" (Ignite 2024)',
        date: '2024-10',
      },
      source: 'Microsoft — "New autonomous agents scale your team like never before" (Ignite 2024)',
      date: '2024-10',
    },
    {
      pattern: 'teams-meeting-recap-and-intelligent-summary',
      description:
        'Copilot in Teams generates meeting recaps, action items, and intelligent summaries from the meeting transcript. The Teams surface is one of the highest-traffic Copilot deployment patterns Microsoft reports across earnings calls.',
      prevalenceInCohort: {
        label: 'planning-range',
        low: 0,
        high: 0,
        unit: 'no published prevalence figure for Teams Copilot specifically',
        cohort: 'Microsoft enterprise customers with Copilot deployed in Teams (cited as a high-usage surface across Microsoft FY24 and FY25 earnings)',
        sampleSize: 0,
        source: 'Microsoft Q4 FY24 earnings call — Satya Nadella prepared remarks on Copilot adoption',
        date: '2024-07',
      },
      source: 'Microsoft Q4 FY24 earnings call — Satya Nadella prepared remarks on Copilot adoption',
      date: '2024-07',
    },
  ],

  trendDirection: {
    direction: 'mainstream-scaling',
    six_month_signal:
      'Microsoft 365 Copilot expands from in-app productivity assistant to a multi-surface agent platform: Copilot Pages, Copilot Chat for tenant Graph reasoning, and Copilot Studio agents become the default authoring path; Microsoft increases deployed-seat disclosures and per-customer expansion language across quarterly earnings.',
    named_driver:
      'Microsoft 365 Copilot Wave 2 (September 2024) — Pages, Python in Excel, redesigned Business Chat — followed by Ignite 2024 autonomous agents announcements and Build 2024 Team Copilot disclosures.',
    source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents" (Jared Spataro)',
    date: '2024-09',
  },

  commonPitfalls: [
    {
      name: 'permissions-oversharing-via-graph',
      description:
        'Business Chat surfaces any Graph content the user has access to. Tenants with loose SharePoint and OneDrive permissions discover that Copilot makes pre-existing oversharing visible at speed. Microsoft\'s own guidance for Copilot readiness emphasises a permission-cleanup phase before broad rollout, and ships SharePoint Advanced Management to support it.',
      source: 'Microsoft Learn — "Microsoft 365 Copilot adoption — Get ready" (data and security readiness)',
      date: '2024-11',
    },
    {
      name: 'paid-seat-utilisation-drift',
      description:
        'Per-seat licensing makes underutilised seats a measurable cost. Microsoft\'s Copilot Dashboard (and the broader Viva Insights integration) is positioned for tracking seat usage; without an active reclamation loop, the gap between assigned seats and active users widens, and realised value lags the per-seat cost.',
      source: 'Microsoft — "Microsoft Copilot Dashboard helps you measure AI impact in your organization"',
      date: '2024-04',
    },
    {
      name: 'change-management-and-prompting-skills-underinvested',
      description:
        'The Work Trend Index reports a large gap between leaders who say AI is important and organisations with a plan to implement it. Enterprises that ship Copilot without prompting training, role-by-role use cases, and a measurable outcome target see usage flatten after the initial novelty.',
      source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
      date: '2024-05',
    },
    {
      name: 'tei-roi-numbers-are-vendor-commissioned',
      description:
        'Forrester\'s Total Economic Impact study of Microsoft Copilot is commissioned by Microsoft. Its modelled ROI applies to a composite organisation Forrester builds from customer interviews — useful for shaping a business case but should be presented as vendor-commissioned, not as an independent industry benchmark.',
      source: 'Forrester TEI commissioned by Microsoft — "The Total Economic Impact Of Microsoft Copilot For Microsoft 365"',
      date: '2024-11',
    },
  ],

  peerBenchmarks: [
    {
      cohortLabel: 'global knowledge workers, all industries',
      metric: 'genai_use_at_work_in_year',
      range: {
        label: 'planning-range',
        low: 75,
        high: 75,
        unit: '% using generative AI at work',
        cohort: 'knowledge workers, 31 countries, Microsoft and LinkedIn Work Trend Index 2024',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
        date: '2024-05',
      },
    },
    {
      cohortLabel: 'Microsoft 365 Copilot early users',
      metric: 'self_report_more_productive',
      range: {
        label: 'planning-range',
        low: 70,
        high: 70,
        unit: '% reporting more productive workflow with Copilot',
        cohort: 'Microsoft 365 Copilot early-access customers tracked in WTI Special Report',
        sampleSize: 0,
        source: 'Microsoft Work Trend Index Special Report — "What Can Copilot\'s Earliest Users Teach Us About Generative AI at Work?"',
        date: '2023-11',
      },
    },
    {
      cohortLabel: 'composite organisation, vendor-commissioned model',
      metric: 'three_year_roi_modelled',
      range: {
        label: 'planning-range',
        low: 132,
        high: 353,
        unit: '% modelled three-year ROI for a composite organisation',
        cohort: 'composite organisation built from interviewed customers',
        sampleSize: 0,
        source: 'Forrester TEI commissioned by Microsoft — "The Total Economic Impact Of Microsoft Copilot For Microsoft 365"',
        date: '2024-11',
      },
    },
    {
      cohortLabel: 'AI-using employees',
      metric: 'bring_your_own_ai_to_work',
      range: {
        label: 'planning-range',
        low: 78,
        high: 78,
        unit: '% of AI users bringing their own AI tools to work',
        cohort: 'AI users in Microsoft and LinkedIn Work Trend Index 2024',
        sampleSize: 31000,
        source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024',
        date: '2024-05',
      },
    },
  ],

  whatNext: [
    {
      name: 'copilot-pages-and-collaborative-artefacts-default',
      description:
        'Copilot Pages — multiplayer, AI-grounded canvases — become the default authoring artefact for cross-document work, sitting alongside Word docs and Excel workbooks rather than replacing them.',
      adoptionStatus: 'GA-recent',
      source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents"',
      date: '2024-09',
    },
    {
      name: 'copilot-studio-agents-across-tenants',
      description:
        'Enterprises move from a single Copilot to a portfolio of Copilot Studio agents on tenant data — IT, HR, finance, sales — published into Microsoft 365 Copilot and Teams. Microsoft announced autonomous agent capabilities at Ignite 2024.',
      adoptionStatus: 'limited-availability',
      source: 'Microsoft — "New autonomous agents scale your team like never before" (Ignite 2024)',
      date: '2024-10',
    },
    {
      name: 'team-copilot-shared-experience',
      description:
        'Team Copilot extends Copilot beyond a single user into shared team experiences — meeting facilitator, group chat agent, project manager — for Teams, Loop, and Planner. Announced at Microsoft Build 2024.',
      adoptionStatus: 'early-pilots',
      source: 'Microsoft — "New agent capabilities in Microsoft Copilot unlock business value" (Build 2024)',
      date: '2024-05',
    },
    {
      name: 'copilot-dashboard-and-measurement-becomes-standard',
      description:
        'Microsoft positions the Copilot Dashboard (and Viva Insights integration) as the canonical measurement surface for adoption, sentiment, and impact. Enterprises increasingly tie seat allocation to dashboard signals before expanding rollout.',
      adoptionStatus: 'GA-recent',
      source: 'Microsoft — "Microsoft Copilot Dashboard helps you measure AI impact in your organization"',
      date: '2024-04',
    },
  ],

  evidenceAnchors: [
    {
      claim:
        '75% of global knowledge workers reported using generative AI at work in 2024, up from 46% in 2023, across a 31-country survey by Microsoft and LinkedIn; 78% of AI users bring their own AI tools to work when not provided by their employer.',
      source: 'Microsoft and LinkedIn Work Trend Index Annual Report 2024 — "AI at Work Is Here. Now Comes the Hard Part."',
      date: '2024-05',
      url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part',
    },
    {
      claim:
        'Microsoft\'s Work Trend Index Special Report on Copilot\'s earliest users reported that 70% felt more productive, 68% said the quality of their work improved, and they saved a median of 14 minutes per day using Copilot.',
      source: 'Microsoft Work Trend Index Special Report — "What Can Copilot\'s Earliest Users Teach Us About Generative AI at Work?"',
      date: '2023-11',
      url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/copilots-earliest-users',
    },
    {
      claim:
        'Microsoft announced the Microsoft 365 Copilot Wave 2 release in September 2024, introducing Copilot Pages, Python in Excel, a redesigned Business Chat, and agents authored in Copilot Studio.',
      source: 'Microsoft — "Microsoft 365 Copilot Wave 2: Pages, Python in Excel, and agents" (Jared Spataro)',
      date: '2024-09',
      url: 'https://www.microsoft.com/en-us/microsoft-365/blog/2024/09/16/microsoft-365-copilot-wave-2-pages-python-in-excel-and-agents/',
    },
    {
      claim:
        'Microsoft announced autonomous agent capabilities in Copilot Studio at Ignite 2024, positioning enterprise-built agents as the way customers scale Copilot beyond a single assistant.',
      source: 'Microsoft — "New autonomous agents scale your team like never before" (Ignite 2024)',
      date: '2024-10',
      url: 'https://blogs.microsoft.com/blog/2024/10/21/new-autonomous-agents-scale-your-team-like-never-before/',
    },
    {
      claim:
        'A Forrester Total Economic Impact study commissioned by Microsoft modelled a three-year ROI range of 132%–353% for a composite organisation deploying Microsoft Copilot for Microsoft 365; the study is explicitly vendor-commissioned and uses Forrester\'s composite-organisation methodology.',
      source: 'Forrester TEI commissioned by Microsoft — "The Total Economic Impact Of Microsoft Copilot For Microsoft 365"',
      date: '2024-11',
      url: 'https://www.microsoft.com/en-us/microsoft-365/blog/2024/11/12/new-forrester-study-shows-microsoft-365-copilot-delivers-roi/',
    },
    {
      claim:
        'Microsoft introduced Team Copilot — a shared, multi-user Copilot experience for Teams, Loop, and Planner — at Microsoft Build 2024.',
      source: 'Microsoft — "New agent capabilities in Microsoft Copilot unlock business value" (Build 2024)',
      date: '2024-05',
      url: 'https://www.microsoft.com/en-us/microsoft-365/blog/2024/05/21/new-agent-capabilities-in-microsoft-copilot-unlock-business-value/',
    },
  ],

  lastReviewed: '2026-05-30',
};
