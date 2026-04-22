import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import {
  parseActualMetricsBlock,
  parseDecisionBlocks,
  parseGateApprovalBlock,
  stripActualMetricsBlock,
  stripDecisionBlocks,
  stripGateApprovalBlock,
} from '@/lib/agent/parse';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const DEMO_SOURCE = 'demo_turn_history_seed';
const LOCAL_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'] as const;

type Sender = 'agent' | 'user';

interface ExistingTurnRow {
  sender: Sender;
  text: string;
}

interface EngagementRow {
  id: string;
  graph_node_id: string | null;
  name: string;
  sponsor_person_id: string | null;
  current_phase: number;
  gates_passed: Array<Record<string, unknown>> | null;
  decisions: Array<Record<string, unknown>> | null;
  actual_metrics: Record<string, unknown> | null;
  outcome_fee_usd: number | null;
}

interface MetricProfile {
  metric: string;
  baseline: string;
  actual: string;
  source: string;
}

interface EngagementProfile {
  key: string;
  queryNames: string[];
  displayName: string;
  organization: string;
  sponsorName: string;
  sponsorTitle: string;
  objective: string;
  forcingEvent: string;
  painStatement: string;
  scopeLine: string;
  firstWin: string;
  stakeholders: string;
  constraints: string;
  baselineLens: string;
  diagnosisSummary: string;
  rootCause: string;
  optionA: string;
  optionB: string;
  optionC: string;
  recommendation: string;
  decisionMaker: string;
  thirtyDayTarget: string;
  executeRisk: string;
  verifySummary: string;
  metrics: MetricProfile[];
}

interface SeedTurnDraft {
  phase: number;
  sender: Sender;
  modeLabel: string | null;
  rawText: string;
  createdAt: string;
}

interface PersistTurnRow {
  phase: number;
  sender: Sender;
  modeLabel: string | null;
  text: string;
  createdAt: string;
}

interface StructuredEffects {
  gateApprovals: Array<{
    phase: number;
    approval_text: string;
    summary: string;
    signed_at: string;
  }>;
  decisions: Array<{
    summary: string;
    rationale: string;
    decision_maker: string;
    impact: string;
    logged_at: string;
  }>;
  actualMetrics: Array<{
    items: Array<{ metric: string; actual_value: string; measurement_date?: string; source?: string }>;
    captured_at: string;
  }>;
}

const PROFILES: EngagementProfile[] = [
  {
    key: 'meridian_analytics_modernization',
    queryNames: ['Meridian Analytics Modernization'],
    displayName: 'Meridian Analytics Modernization',
    organization: 'Meridian Health System',
    sponsorName: 'Sarah Chen',
    sponsorTitle: 'CIO',
    objective: 'modernize analytics delivery so operational leaders can trust one metric spine',
    forcingEvent: 'board pressure after finance and operations surfaced competing versions of margin and utilization metrics',
    painStatement: 'Meridian keeps relitigating the same dashboard numbers because the data model, reporting workflow, and steward ownership are split across teams.',
    scopeLine: 'Start with enterprise analytics finance, access, and service-line scorecards; keep EHR workflow redesign out of this phase.',
    firstWin: 'a board-ready finance and operations scorecard with one agreed metric spine in 2-3 weeks',
    stakeholders: 'CIO, finance VP, analytics director, service-line ops leaders, and the data steward council',
    constraints: 'No EHR disruption, no net-new enterprise platform purchase before the June steering review, and limited analytics engineering bandwidth.',
    baselineLens: 'dashboard cycle time, metric dispute rate, and manually reconciled report hours',
    diagnosisSummary: 'This is not a tooling-only problem. It is a governance and semantic-model fragmentation problem that keeps re-creating manual reconciliation.',
    rootCause: 'semantic definitions drift by business unit, stewardship is nominal not binding, and analytics engineering is routing around process pressure with one-off logic',
    optionA: 'stewardship-first reset with a locked enterprise metric dictionary before platform changes',
    optionB: 'platform-led rebuild around a new semantic layer with governance following behind it',
    optionC: 'parallel semantic-model lock plus two-scorecard pilot with explicit data owner commitments',
    recommendation: 'Option C because Meridian needs a visible proof point fast without pretending governance can wait.',
    decisionMaker: 'Sarah Chen',
    thirtyDayTarget: 'lock the first 20 board metrics, cut one scorecard release cycle from 11 days to 4, and name owners for every exception queue',
    executeRisk: 'finance and service-line leaders may each defend their local metric logic unless Sarah forces one arbitration path',
    verifySummary: 'Success is fewer metric disputes, faster reporting cycles, and sponsor signoff that the board packet is no longer being reworked manually.',
    metrics: [
      { metric: 'Board packet rebuild hours', baseline: '118 hours / month', actual: '44 hours / month', source: 'Finance PMO time-study' },
      { metric: 'Metric dispute rate', baseline: '31% of KPI reviews', actual: '9% of KPI reviews', source: 'Executive scorecard review log' },
      { metric: 'Monthly scorecard release cycle', baseline: '11 business days', actual: '4 business days', source: 'Analytics release tracker' },
    ],
  },
  {
    key: 'arcturus_wealth_platform',
    queryNames: ['Arcturus Wealth Platform Modernization', 'Arcturus Wealth Platform'],
    displayName: 'Arcturus Wealth Platform Modernization',
    organization: 'First Capital Financial',
    sponsorName: 'James Park',
    sponsorTitle: 'CTO',
    objective: 'modernize the wealth platform without breaking advisor workflows or regulatory reporting continuity',
    forcingEvent: 'advisor teams are still building shadow workbooks because the current platform cannot support alt-asset reporting at scale',
    painStatement: 'The platform works just well enough to survive, but every release inherits manual workarounds, slow data movement, and regulatory reporting anxiety.',
    scopeLine: 'Focus on the wealth data model, advisor workflow, and reporting continuity. Avoid core banking scope creep.',
    firstWin: 'a narrowed release path that cuts shadow-workbook dependency on the most painful reporting workflow',
    stakeholders: 'CTO, wealth operations lead, advisor platform lead, compliance, and finance transformation',
    constraints: 'No advisor-facing disruption in quarter close windows and no regulatory reporting miss during migration waves.',
    baselineLens: 'advisor workbook hours, reporting lag, release windows, and exception tickets',
    diagnosisSummary: 'Arcturus has a platform modernization problem that is amplified by reporting dependency and release-window fragility.',
    rootCause: 'the data model is brittle, reporting logic is embedded in side workflows, and modernization planning keeps underweighting migration sequencing risk',
    optionA: 'incremental wrapper strategy around the current platform',
    optionB: 'full platform and data-stack modernization in one integrated program',
    optionC: 'two-speed path with reporting continuity first and advisor workflow rebuild second',
    recommendation: 'Option C because it lowers regulatory exposure while still moving the platform to a modern control plane.',
    decisionMaker: 'James Park',
    thirtyDayTarget: 'lock the reporting-continuity blueprint, freeze the first migration scope, and name the release owner for each wealth workflow',
    executeRisk: 'if Arcturus lets release governance remain implicit, the same shadow-workbook behaviors will survive the platform rebuild',
    verifySummary: 'Success is fewer manual reporting workbooks, faster close-cycle publishing, and sponsor confidence that no control obligations slipped.',
    metrics: [
      { metric: 'Advisor shadow workbook hours', baseline: '340 hours / week', actual: '128 hours / week', source: 'Advisor ops survey' },
      { metric: 'Alt-asset reporting lag', baseline: '3 business days', actual: 'same day', source: 'Wealth reporting ops' },
      { metric: 'Release-window defects', baseline: '17 / quarter', actual: '5 / quarter', source: 'Platform release log' },
    ],
  },
  {
    key: 'apex_hr_erp',
    queryNames: ['Apex Retail HR ERP Replacement', 'Apex Retail HR ERP'],
    displayName: 'Apex Retail HR ERP Replacement',
    organization: 'Apex Retail Group',
    sponsorName: 'Maria Delgado',
    sponsorTitle: 'CHRO',
    objective: 'replace the aging HR ERP and remove store-manager reconciliation work from the operating model',
    forcingEvent: 'the legacy platform is approaching vendor support end-of-life while store managers are spending real labor time reconciling broken data flows',
    painStatement: 'Apex is paying twice: once for old technology and again for the labor managers spend cleaning up what the system should handle.',
    scopeLine: 'Replace core HR and workforce transactions first. Keep payroll redesign and broad finance integration in a later wave.',
    firstWin: 'remove the manual reconciliation loop for the highest-volume store manager workflow',
    stakeholders: 'CHRO, store operations, IT applications, payroll operations, and field leadership',
    constraints: 'No payroll interruption, no peak-season cutover, and limited tolerance for training-heavy process changes.',
    baselineLens: 'manual reconciliation hours, HR case backlog, field correction tickets, and store-manager time loss',
    diagnosisSummary: 'The ERP issue is part platform debt, part broken operating process. Replacing the system without redesigning the field exception path will preserve the pain.',
    rootCause: 'critical HR workflows rely on brittle batch logic, exception ownership is unclear, and store teams have normalized manual correction as part of the job',
    optionA: 'lift-and-shift replacement with minimal process redesign',
    optionB: 'HR core replacement plus exception-workflow redesign in the same wave',
    optionC: 'phased replacement starting with high-volume workflows and exception routing',
    recommendation: 'Option C because Apex needs operational safety plus visible labor-time recovery before taking on the whole platform.',
    decisionMaker: 'Maria Delgado',
    thirtyDayTarget: 'lock the first workflow wave, cut one high-volume correction queue by 40%, and prove store managers are spending less time reconciling',
    executeRisk: 'if field enablement arrives late, managers will keep local spreadsheets alive even after the platform changes land',
    verifySummary: 'Success is less manual HR cleanup, lower case backlog, and a cleaner store-manager operating week.',
    metrics: [
      { metric: 'Manual reconciliation hours', baseline: '8,400 hours / week', actual: '3,050 hours / week', source: 'Field labor audit' },
      { metric: 'HR case backlog', baseline: '12,600 open cases', actual: '4,200 open cases', source: 'HR service center queue' },
      { metric: 'Store correction tickets', baseline: '4,800 / month', actual: '1,550 / month', source: 'ITSM queue' },
    ],
  },
  {
    key: 'contact_center_ai',
    queryNames: ['Contact Center AI Transformation'],
    displayName: 'Contact Center AI Transformation',
    organization: 'Apex Retail Group',
    sponsorName: 'Leah Brooks',
    sponsorTitle: 'VP Customer Care',
    objective: 'reduce service cost while lifting CSAT and agent productivity through voice and chat AI',
    forcingEvent: 'service cost pressure collided with holiday-volume growth and inconsistent agent productivity across regions',
    painStatement: 'Apex is absorbing rising contact volume with uneven tooling, long handle times, and limited confidence in deflection quality.',
    scopeLine: 'Voice routing, agent assist, and supervisor QA loops are in scope. CRM replacement is not.',
    firstWin: 'prove deflection and agent-assist value on the highest-volume queue without hurting CSAT',
    stakeholders: 'VP Customer Care, digital lead, operations analytics, QA supervisors, and regional contact-center managers',
    constraints: 'Holiday readiness matters, Spanish-language quality cannot regress, and QA leaders need a visible override path.',
    baselineLens: 'average handle time, deflection rate, CSAT, and agent productivity',
    diagnosisSummary: 'Apex has enough volume and signal to win here, but the risk is quality drift if the team chases savings without governance and QA discipline.',
    rootCause: 'routing logic is inconsistent, agent workflows are fragmented, and the QA loop is too manual to stabilize model behavior quickly',
    optionA: 'agent-assist only with manual routing left untouched',
    optionB: 'voice and chat deflection first, with agent-assist deferred',
    optionC: 'paired deflection plus agent-assist rollout with a stronger QA loop',
    recommendation: 'Option C because the cost and experience gains compound when deflection and agent-assist are tuned together.',
    decisionMaker: 'Leah Brooks',
    thirtyDayTarget: 'stabilize the first production queues, reach 24% deflection, and give supervisors a live QA dashboard with weekly retraining cadence',
    executeRisk: 'Spanish-language quality can become the headline problem if Apex scales faster than the tuning loop can absorb',
    verifySummary: 'Success is visible cost reduction, higher agent throughput, and CSAT that holds or improves.',
    metrics: [
      { metric: 'Average handle time', baseline: '11.8 minutes', actual: '8.9 minutes', source: 'Contact center BI' },
      { metric: 'Deflection rate', baseline: '7%', actual: '26%', source: 'Voice and chat routing analytics' },
      { metric: 'CSAT', baseline: '78', actual: '82', source: 'Post-contact survey' },
    ],
  },
  {
    key: 'unified_cdp',
    queryNames: ['Unified Customer Data Platform'],
    displayName: 'Unified Customer Data Platform',
    organization: 'Apex Retail Group',
    sponsorName: 'Jake Chen',
    sponsorTitle: 'Chief Digital Officer',
    objective: 'consolidate seven customer data sources into a single view and activation spine',
    forcingEvent: 'marketing, loyalty, and merchandising are each segmenting customers from different source systems with conflicting definitions',
    painStatement: 'Apex cannot talk about the customer like one company because identity, consent, and activation are fragmented across seven systems.',
    scopeLine: 'Identity, priority source integration, and top audience activation are in scope. Full martech replacement is not.',
    firstWin: 'deliver one trusted customer ID and a small set of activation audiences with clear source ownership',
    stakeholders: 'CDO, CMO, loyalty lead, merchandising analytics, privacy, and data engineering',
    constraints: 'Consent and privacy logic must stay explicit, and merchandising will not tolerate a long blackout window for audience activation.',
    baselineLens: 'duplicate customer records, activation latency, audience mismatch, and campaign attribution confidence',
    diagnosisSummary: 'The CDP problem is really identity plus governance. Apex is paying for tools, but the customer model is still politically split.',
    rootCause: 'source ownership is fragmented, identity rules differ by team, and activation use cases are running ahead of the core model',
    optionA: 'identity-first foundation with activation delayed',
    optionB: 'activation-first quick win on top of the current fragmented model',
    optionC: 'two-speed build with identity core plus a small activation pilot',
    recommendation: 'Option C because Apex needs proof of activation value without compromising the long-term identity spine.',
    decisionMaker: 'Jake Chen',
    thirtyDayTarget: 'lock the seven-source ingestion plan, name the identity owner, and launch the first two audience use cases from a single view',
    executeRisk: 'if privacy review is treated as a late-stage check, the activation pilot will stall after the technical work is already done',
    verifySummary: 'Success is fewer duplicate records, faster activation, and a customer view the digital and marketing teams actually trust.',
    metrics: [
      { metric: 'Duplicate customer profiles', baseline: '18.4%', actual: '4.9%', source: 'Identity audit' },
      { metric: 'Audience activation latency', baseline: '9 days', actual: '1.5 days', source: 'Campaign operations log' },
      { metric: 'Attributed repeat-visit lift', baseline: '0.0 pts', actual: '+2.1 pts', source: 'CRM + commerce analytics' },
    ],
  },
  {
    key: 'store_associate_productivity',
    queryNames: ['Store Associate Productivity'],
    displayName: 'Store Associate Productivity',
    organization: 'Apex Retail Group',
    sponsorName: 'Nina Patel',
    sponsorTitle: 'VP Store Operations',
    objective: 'introduce AI-assisted workflows for 40K store associates without adding field complexity',
    forcingEvent: 'store leaders are under pressure to recover labor time while sales conversion and basket size remain uneven across formats',
    painStatement: 'Associates are spending too much time chasing tasks, exceptions, and knowledge that should already be in their hand.',
    scopeLine: 'Tasking, replenishment, and exception handling are in scope. Labor scheduling and full store-system redesign are not.',
    firstWin: 'recover daily associate time on the most repetitive workflows in a pilot cohort of stores',
    stakeholders: 'VP Store Operations, field enablement, merchandising ops, IT product, and district leaders',
    constraints: 'No extra training burden in peak periods and no rollout that feels like another corporate overlay to store managers.',
    baselineLens: 'task-search time, replenishment completion, conversion, and basket size',
    diagnosisSummary: 'The productivity gap is driven less by effort than by workflow friction and tool fragmentation at the store edge.',
    rootCause: 'tasking is scattered, exception logic is unclear, and store managers have normalized local workarounds to keep the floor moving',
    optionA: 'analytics-only visibility with no workflow intervention',
    optionB: 'workflow copilot on top of current tasking tools',
    optionC: 'workflow copilot plus exception-routing redesign for a bounded pilot cohort',
    recommendation: 'Option C because Apex needs felt store-floor change, not just another dashboard.',
    decisionMaker: 'Nina Patel',
    thirtyDayTarget: 'pilot 60 stores, cut task-search time materially, and prove the workflow copilot reduces manager exception load',
    executeRisk: 'if the exception path is vague, stores will revert to text messages and local spreadsheets immediately',
    verifySummary: 'Success is faster task completion, better conversion, and field leaders asking to scale rather than resisting.',
    metrics: [
      { metric: 'Associate task-search time', baseline: '23 minutes / shift', actual: '15 minutes / shift', source: 'Store observation study' },
      { metric: 'On-time replenishment completion', baseline: '61%', actual: '76%', source: 'Store tasking analytics' },
      { metric: 'Conversion rate', baseline: '28.2%', actual: '30.1%', source: 'Store operations KPI pack' },
    ],
  },
  {
    key: 'demand_forecasting_ai',
    queryNames: ['Demand Forecasting AI'],
    displayName: 'Demand Forecasting AI',
    organization: 'Apex Retail Group',
    sponsorName: 'Tom Alvarez',
    sponsorTitle: 'VP Merchandising Analytics',
    objective: 'improve forecast accuracy, same-store sales, and inventory turns through AI-driven demand planning',
    forcingEvent: 'stockouts and markdowns were both rising, which made it obvious the planning process was wrong in two directions at once',
    painStatement: 'Apex was missing demand in the right places while also carrying too much inventory in the wrong ones.',
    scopeLine: 'SKU-store-week forecasting, replenishment handoff, and planning governance are in scope. Network redesign is not.',
    firstWin: 'prove forecast accuracy improvement on a pilot cohort of categories and stores with visible inventory-turns impact',
    stakeholders: 'VP Merchandising Analytics, supply chain planning, finance, store ops, and merchandising leadership',
    constraints: 'Planning leaders need auditability, finance wants attested value, and category teams will push back if the model feels opaque.',
    baselineLens: 'forecast accuracy, stockouts, markdowns, same-store sales, and inventory turns',
    diagnosisSummary: 'The issue was never just model quality. It was the missing connection between forecast logic, planning decisions, and store execution.',
    rootCause: 'historic planning loops were too slow, exception handling was manual, and forecast outputs were not trusted enough to change behavior',
    optionA: 'model-first improvement with current planning workflows left alone',
    optionB: 'planning-process redesign first with only light model changes',
    optionC: 'paired model and planning-workflow redesign with category-specific governance',
    recommendation: 'Option C because forecast value only lands when planning teams trust and operationalize the signal.',
    decisionMaker: 'Tom Alvarez',
    thirtyDayTarget: 'lock the category pilot set, stabilize daily exception handling, and prove the model can move planning decisions inside one cycle',
    executeRisk: 'if category leads cannot explain why the model moved a decision, they will override it and the outcome proof will evaporate',
    verifySummary: 'Success is better forecast accuracy, fewer stockouts, less markdown pressure, and inventory turns that actually improve.',
    metrics: [
      { metric: 'Forecast accuracy', baseline: '68%', actual: '81%', source: 'Planning analytics' },
      { metric: 'Stockout events', baseline: '100 index', actual: '72 index', source: 'Store and replenishment telemetry' },
      { metric: 'Inventory turns', baseline: '6.4x', actual: '7.3x', source: 'Merchandising finance pack' },
    ],
  },
];

function resolveDbUrl(): string {
  return (
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.POSTGRES_URL ??
    LOCAL_DB_URL
  );
}

function createDbClient(): Client {
  const connectionString = resolveDbUrl();
  const isLocal = connectionString.includes('127.0.0.1') || connectionString.includes('localhost');
  return isLocal
    ? new Client({ connectionString })
    : new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

function isoAt(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

function appendDecisionBlock(
  text: string,
  decision: { summary: string; rationale: string; decision_maker: string; impact: string },
): string {
  return `${text}\n\n<decision_logged>\n${JSON.stringify(decision, null, 2)}\n</decision_logged>`;
}

function appendGateApprovalBlock(
  text: string,
  gate: { phase: number; approval_text: string; summary: string },
): string {
  return `${text}\n\n<gate_approval>\n${JSON.stringify(gate, null, 2)}\n</gate_approval>`;
}

function appendActualMetricsBlock(
  text: string,
  items: Array<{ metric: string; actual_value: string; measurement_date?: string; source?: string }>,
): string {
  return `${text}\n\n<actual_metrics>\n${JSON.stringify({ items }, null, 2)}\n</actual_metrics>`;
}

function buildPhasePairs(
  profile: EngagementProfile,
  phase: number,
  includeGateApproval: boolean,
): Array<[string, string]> {
  const metricA = profile.metrics[0];
  const metricB = profile.metrics[1];
  const metricC = profile.metrics[2];
  const phaseLabel = PHASE_LABELS[phase] ?? `Phase ${phase}`;

  if (phase === 0) {
    let pair6Agent = appendDecisionBlock(
      `That's helpful. I'm locking the success lens around ${profile.baselineLens}. That gives us a way to talk about ${profile.objective} without drifting into generic transformation language.`,
      {
        summary: `Use ${profile.baselineLens} as the Phase 0 success lens`,
        rationale: `It translates ${profile.objective} into metrics the sponsor can defend in a gate review.`,
        decision_maker: profile.decisionMaker,
        impact: 'Charter and first diagnostic cuts will anchor on this metric spine.',
      },
    );
    let pair7Agent = appendDecisionBlock(
      `Good. I also want the working team constrained to ${profile.firstWin}. That's small enough to move quickly and big enough to prove the program has teeth.`,
      {
        summary: `Bound the first wave to ${profile.firstWin}`,
        rationale: 'A tight first-win scope gives Nexus a realistic path to a felt result in 2-3 weeks.',
        decision_maker: profile.decisionMaker,
        impact: 'Phase 1 diagnostic and sponsor updates stay focused instead of sprawling.',
      },
    );
    let pair8Agent = `I think we have enough to call ${phaseLabel} complete. Here's the charter spine I would write now: ${profile.painStatement} In scope: ${profile.scopeLine} Stakeholders: ${profile.stakeholders} Success lens: ${profile.baselineLens}.`;
    if (includeGateApproval) {
      pair8Agent = appendGateApprovalBlock(pair8Agent, {
        phase,
        approval_text: `Approved. Move ${profile.displayName} into Diagnose.`,
        summary: `Phase ${phase} approved with scope anchored to ${profile.firstWin}.`,
      });
    } else {
      pair8Agent += ' I still want one more sponsor answer before we log approval: who breaks the tie if finance and operations disagree on the baseline?';
    }

    return [
      [
        `${profile.sponsorName} here. We need to kick off ${profile.displayName}. ${profile.forcingEvent}. ${profile.painStatement}`,
        `Understood. I see the forcing event, the business pain, and the sponsor pressure. If we do this well, the first visible win should be ${profile.firstWin}. Before I lock the charter spine, what's the one metric your team would defend in an executive review?`,
      ],
      [
        `If I had to pick one lens, it would be ${metricA.metric}. Right now we're sitting at ${metricA.baseline}, which is not acceptable.`,
        `Good. ${metricA.metric} at ${metricA.baseline} gives us the anchor. I also want the surrounding context: ${metricB.metric} is ${metricB.baseline}, and ${metricC.metric} is ${metricC.baseline}. When those move together, the story becomes much harder to dispute.`,
      ],
      [
        `The sponsor dynamic is straightforward on paper and messy in reality. ${profile.stakeholders}.`,
        `That's exactly the kind of political map I needed. It says the technical work matters, but the operating compromise matters just as much. I want the charter to reflect that this is a decision-rights problem, not just a system upgrade.`,
      ],
      [
        `Scope-wise, ${profile.scopeLine}`,
        `Good boundary. That keeps us on the business proof path. I do not want this to accidentally become a catch-all transformation with no clean gate language.`,
      ],
      [
        `Constraints are real: ${profile.constraints}`,
        `That gives me the execution guardrails. We need a plan that respects those constraints instead of assuming the organization will bend for the work.`,
      ],
      [
        `The baseline conversation usually derails because each team defends a different number. That's what I want to avoid.`,
        pair6Agent,
      ],
      [
        `Then let's keep the first win tight. ${profile.firstWin} feels like the right proving ground.`,
        pair7Agent,
      ],
      [
        includeGateApproval
          ? `Approved. Move it forward. ${profile.firstWin} is the right boundary and ${profile.baselineLens} is the right scorecard.`
          : `Before I approve, I need one more pass on who arbitrates the baseline when the functions disagree.`,
        pair8Agent,
      ],
    ];
  }

  if (phase === 1) {
    let pair5Agent = appendDecisionBlock(
      `The first-win scope should be ${profile.firstWin}. It is narrow enough to diagnose honestly and broad enough to reveal whether ${profile.rootCause}.`,
      {
        summary: `Constrain Phase 1 to ${profile.firstWin}`,
        rationale: `That scope is the smallest credible lens on ${profile.objective}.`,
        decision_maker: profile.decisionMaker,
        impact: 'The diagnostic work will target one sponsor-owned proving ground instead of a full-enterprise sweep.',
      },
    );
    let pair8Agent = `That gets us to a hard diagnosis: ${profile.diagnosisSummary} Root cause: ${profile.rootCause}. The measured lens is ${metricA.metric}, ${metricB.metric}, and ${metricC.metric}.`;
    if (includeGateApproval) {
      pair8Agent = appendGateApprovalBlock(pair8Agent, {
        phase,
        approval_text: `Approved. The diagnosis is clear enough to move into Design.`,
        summary: `Phase ${phase} approved with root cause anchored to ${profile.rootCause}.`,
      });
    } else {
      pair8Agent += ' I want one more challenge session before I call Diagnose complete.';
    }

    return [
      [
        `Let's pressure-test the diagnosis. What's your honest read on why ${profile.painStatement.toLowerCase()}?`,
        `My honest read: ${profile.diagnosisSummary} The symptom shows up in ${metricA.metric}, but the real story is the operating model underneath it.`,
      ],
      [
        `That matches what the team is feeling. The most common complaint is that the work keeps routing around itself.`,
        `Exactly. That's a routing and accountability smell, not just a tooling complaint. When I map it back to the baseline, the issue compounds across ${profile.baselineLens}.`,
      ],
      [
        `If you had to name the root cause in one line, what would you say?`,
        `I'd say this: ${profile.rootCause}. That's the sentence I would defend in front of the sponsor.`,
      ],
      [
        `How does this compare to what you've seen elsewhere?`,
        `In similar programs, the failure pattern isn't that people ignore the problem. It's that they try to solve it everywhere at once and never create a falsifiable first win.`,
      ],
      [
        `So where would you start if we wanted the clearest signal fast?`,
        pair5Agent,
      ],
      [
        `That first-win boundary makes sense. What would success in Diagnose look like?`,
        `Diagnose succeeds if we can quantify the current drag, tie it to one operating cause, and give the sponsor a design decision that feels inevitable rather than speculative.`,
      ],
      [
        includeGateApproval
          ? `I'm comfortable with that diagnosis. It is specific enough to design against.`
          : `I want one more cut of the evidence before we move out of Diagnose.`,
        `Good. Then the design brief should test three things: path choice, owner model, and what we refuse to do in the first wave.`,
      ],
      [
        includeGateApproval
          ? `Approved. Move ${profile.displayName} into Design.`
          : `Give me one more proof point on the baseline and then we can decide.`,
        pair8Agent,
      ],
    ];
  }

  if (phase === 2) {
    let pair4Agent = appendDecisionBlock(
      `I would recommend ${profile.recommendation}. It matches the constraints, gives us a faster proof point, and avoids pretending the organization can absorb every change at once.`,
      {
        summary: `Recommend ${profile.recommendation}`,
        rationale: `It best balances ${profile.constraints.toLowerCase()} with the need for a visible first win.`,
        decision_maker: profile.decisionMaker,
        impact: 'The design brief can now converge on one preferred path with explicit tradeoffs.',
      },
    );
    let pair6Agent = appendDecisionBlock(
      `I'm also locking the first execution target around ${profile.thirtyDayTarget}. If the team cannot hit that, the design was not actionable enough.`,
      {
        summary: `Use ${profile.thirtyDayTarget} as the first execution proving point`,
        rationale: 'The 30-day target is the fastest test of whether the chosen path translates into owned work.',
        decision_maker: profile.decisionMaker,
        impact: 'Phase 3 planning will carry named owners, milestones, and a non-negotiable early proving point.',
      },
    );
    let pair8Agent = `Then we're aligned on the design. Options considered: ${profile.optionA}; ${profile.optionB}; ${profile.optionC}. Recommended path: ${profile.recommendation}. Critical tradeoff: speed versus breadth, and we are deliberately choosing proof over sprawl.`;
    if (includeGateApproval) {
      pair8Agent = appendGateApprovalBlock(pair8Agent, {
        phase,
        approval_text: `Approved. Lock the design and start execution planning.`,
        summary: `Phase ${phase} approved with ${profile.recommendation} as the selected path.`,
      });
    } else {
      pair8Agent += ' I still want one more pass on owners before I call Design complete.';
    }

    return [
      [
        `Walk me through the honest option set. What are the viable paths?`,
        `There are only three credible paths from here. ${profile.optionA}. ${profile.optionB}. ${profile.optionC}. Each can work; they just fail in different ways.`,
      ],
      [
        `Which one would you rule out first?`,
        `I'd rule out the path that looks clean on paper but ignores the organizational constraint. In this case that's the one that assumes the team can absorb full breadth before the first win is visible.`,
      ],
      [
        `Then what's your recommendation?`,
        pair4Agent,
      ],
      [
        `What's the tradeoff I am accepting if I choose that path?`,
        `You're accepting a narrower first wave in exchange for a much higher probability of sponsor-visible proof. That's the right bargain here.`,
      ],
      [
        `Okay. If we choose it, what do you need nailed down before Execute starts?`,
        `Three things: named owners, a 30-day target, and the one dependency the team is not allowed to hand-wave.`,
      ],
      [
        `Let's make the 30-day target explicit then.`,
        pair6Agent,
      ],
      [
        includeGateApproval
          ? `That's clear enough. I'm ready to lock the design.`
          : `I agree with the path. I just need the owner map tightened before we move.`,
        `Perfect. That means Execute should start from a plan the sponsor can actually govern, not a vague set of workstreams.`,
      ],
      [
        includeGateApproval
          ? `Approved. Move ${profile.displayName} into Execute.`
          : `Send me the owner map and I should be able to approve after that.`,
        pair8Agent,
      ],
    ];
  }

  if (phase === 3) {
    let pair4Agent = appendDecisionBlock(
      `I'm logging the execution decision this way: ${profile.thirtyDayTarget}. That's the line I want every workstream lead repeating back.`,
      {
        summary: `Anchor Phase 3 on ${profile.thirtyDayTarget}`,
        rationale: 'It gives the program an operational proving point instead of a generic activity list.',
        decision_maker: profile.decisionMaker,
        impact: 'Milestones, owners, and escalation paths will now align to one measurable month-one outcome.',
      },
    );
    let pair8Agent = `Execution is in a credible place. The critical path is ${profile.thirtyDayTarget}, and the main watch-out is ${profile.executeRisk}.`;
    if (includeGateApproval) {
      pair8Agent = appendGateApprovalBlock(pair8Agent, {
        phase,
        approval_text: `Approved. Execute is complete enough to move into verification.`,
        summary: `Phase ${phase} approved with the critical path anchored to ${profile.thirtyDayTarget}.`,
      });
    } else {
      pair8Agent += ' We are not at gate yet because the team still has to prove the critical path is under control.';
    }

    return [
      [
        `Give me the execution readout. Are we actually moving or just opening workstreams?`,
        `We're moving, but the distinction that matters is whether the work is landing against the month-one proof point. Right now the answer is yes, with one visible risk.`,
      ],
      [
        `What's the risk you're most worried about?`,
        `The risk is ${profile.executeRisk}. It won't announce itself as a crisis immediately; it will show up as slower-than-expected execution and sponsor anxiety unless we manage it directly.`,
      ],
      [
        `What needs to happen in the next 30 days for you to call this on track?`,
        `I need to see ${profile.thirtyDayTarget}. If the team hits that, the program is translating design into owned work. If it misses, we revisit the plan rather than rationalize the miss.`,
      ],
      [
        `Log that as the operating commitment.`,
        pair4Agent,
      ],
      [
        `Where do owners tend to get fuzzy on work like this?`,
        `Usually around dependencies and exception paths. Everyone thinks someone else owns the blocker until the date slips. That's why I want the owner map repeated back in every weekly review.`,
      ],
      [
        `Then assume I'm reviewing this next Friday. What will I ask first?`,
        `You will ask whether the 30-day target is still real, who owns the most fragile dependency, and what changed since last week that should alter your confidence.`,
      ],
      [
        includeGateApproval
          ? `That sounds right. I'm comfortable saying Execute is complete enough to verify.`
          : `Not yet. I want to see one more milestone land before I call Execute complete.`,
        `Fair. Then the team should treat the next checkpoint as a credibility test, not a routine status readout.`,
      ],
      [
        includeGateApproval
          ? `Approved. Move ${profile.displayName} into Verify.`
          : `Let's hold the gate until the next milestone lands cleanly.`,
        pair8Agent,
      ],
    ];
  }

  let pair6Agent = appendActualMetricsBlock(
    `I'm ready to call the outcome using measured evidence, not storytelling. ${profile.verifySummary}`,
    profile.metrics.map((metric) => ({
      metric: metric.metric,
      actual_value: metric.actual,
      measurement_date: new Date().toISOString().slice(0, 10),
      source: `${metric.source} · ${DEMO_SOURCE}`,
    })),
  );
  pair6Agent = appendDecisionBlock(pair6Agent, {
    summary: `Use ${metricA.metric}, ${metricB.metric}, and ${metricC.metric} as the verified outcome pack`,
    rationale: 'Those metrics tie the value story back to the baseline the sponsor approved earlier in the program.',
    decision_maker: profile.decisionMaker,
    impact: 'The verify readout now has an attested metric spine instead of a narrative-only summary.',
  });

  let pair8Agent = `Here's the verify readout in one line: ${profile.verifySummary} Baseline to actual moved from ${metricA.baseline} to ${metricA.actual}, ${metricB.baseline} to ${metricB.actual}, and ${metricC.baseline} to ${metricC.actual}.`;
  if (includeGateApproval) {
    pair8Agent = appendGateApprovalBlock(pair8Agent, {
      phase,
      approval_text: `Approved. Outcome verification is complete.`,
      summary: `Phase ${phase} approved with verified outcome movement across ${metricA.metric}, ${metricB.metric}, and ${metricC.metric}.`,
    });
  } else {
    pair8Agent += ' We still need the attestor to sign the outcome pack before I call Verify complete.';
  }

  return [
    [
      `We're at verification now. What do the results actually say?`,
      `The result is credible because the baseline was locked early and the measured movement is consistent across multiple lenses, not just one headline number.`,
    ],
    [
      `Start with the blunt version. Did we actually solve the problem?`,
      `Yes, with nuance. We solved the core business problem enough to justify the program, and we can name the areas where the gains were stronger or weaker without hand-waving.`,
    ],
    [
      `Which metric matters most in the readout?`,
      `The headline metric is ${metricA.metric}, but it only means something because ${metricB.metric} and ${metricC.metric} moved in the same direction.`,
    ],
    [
      `What surprised you in the results?`,
      `The upside was that the operating change landed faster than expected once the first workflow proved itself. The caution is that the sustainability discipline still matters — none of these gains are self-maintaining.`,
    ],
    [
      `What would you tell the attestor to focus on?`,
      `I would tell them to look for three things: whether the baseline is clean, whether the actuals are measured the same way, and whether the change can survive normal operating pressure.`,
    ],
    [
      `Then give me the measured readout.`,
      pair6Agent,
    ],
    [
      includeGateApproval
        ? `That's enough for me. I can sign the verify pack.`
        : `I need the attestor confirmation before I sign the verify pack.`,
      `Understood. Then I would package the readout exactly that way: evidence first, honest variance second, and next actions third.`,
    ],
    [
      includeGateApproval
        ? `Approved. Close the verification stage.`
        : `Hold the gate until the attestor confirms the pack.`,
      pair8Agent,
    ],
  ];
}

function buildTurnsForEngagement(profile: EngagementProfile, engagement: EngagementRow): SeedTurnDraft[] {
  const activePhase = Math.max(0, Math.min(engagement.current_phase, 5));
  const maxSeedPhase = Math.min(activePhase, 4);
  const drafts: SeedTurnDraft[] = [];

  for (let phase = 0; phase <= maxSeedPhase; phase += 1) {
    const includeGateApproval = phase < activePhase || (activePhase >= 5 && phase === 4);
    const pairs = buildPhasePairs(profile, phase, includeGateApproval);
    const phaseStartOffset = (maxSeedPhase - phase + 1) * 8 * DAY_MS;

    pairs.forEach(([userText, agentText], pairIndex) => {
      const turnOffset = phaseStartOffset - pairIndex * 8 * HOUR_MS;
      const userCreatedAt = isoAt(turnOffset);
      const agentCreatedAt = isoAt(turnOffset - 2 * HOUR_MS);
      const modeLabel = PHASE_LABELS[phase] ?? `Phase ${phase}`;

      drafts.push({
        phase,
        sender: 'user',
        modeLabel: null,
        rawText: userText,
        createdAt: userCreatedAt,
      });
      drafts.push({
        phase,
        sender: 'agent',
        modeLabel,
        rawText: agentText,
        createdAt: agentCreatedAt,
      });
    });
  }

  return drafts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function extractStructuredEffects(rawText: string, createdAt: string): {
  cleanedText: string;
  gateApproval: StructuredEffects['gateApprovals'][number] | null;
  decisions: StructuredEffects['decisions'];
  actualMetrics: StructuredEffects['actualMetrics'][number] | null;
} {
  const gate = parseGateApprovalBlock(rawText);
  const decisions = parseDecisionBlocks(rawText);
  const actual = parseActualMetricsBlock(rawText);

  let cleanedText = rawText;
  cleanedText = stripGateApprovalBlock(cleanedText);
  cleanedText = stripDecisionBlocks(cleanedText);
  cleanedText = stripActualMetricsBlock(cleanedText);
  cleanedText = cleanedText.trim();

  const gateApproval = gate
    ? {
        ...gate,
        signed_at: createdAt,
      }
    : null;

  const decisionRows = decisions.map((decision) => ({
    ...decision,
    logged_at: createdAt,
  }));

  const actualMetrics = actual
    ? {
        items: actual.items,
        captured_at: createdAt,
      }
    : null;

  return {
    cleanedText,
    gateApproval,
    decisions: decisionRows,
    actualMetrics,
  };
}

async function findEngagement(client: Client, profile: EngagementProfile): Promise<EngagementRow | null> {
  const { rows } = await client.query<EngagementRow>(
    `
      select
        id,
        graph_node_id,
        name,
        sponsor_person_id,
        current_phase,
        gates_passed,
        decisions,
        actual_metrics,
        outcome_fee_usd
      from engagements
      where lower(name) = any($1::text[])
      order by updated_at desc nulls last, created_at desc
      limit 1
    `,
    [profile.queryNames.map((name) => name.toLowerCase())],
  );

  return rows[0] ?? null;
}

async function getExistingTurnKeys(client: Client, engagementId: string): Promise<Set<string>> {
  const { rows } = await client.query<ExistingTurnRow>(
    `
      select sender, text
      from turns
      where engagement_id = $1
    `,
    [engagementId],
  );

  return new Set(rows.map((row) => `${row.sender}:::${row.text}`));
}

async function insertTurns(
  client: Client,
  engagementId: string,
  drafts: SeedTurnDraft[],
): Promise<{
  insertedTurns: number;
  structuredEffects: StructuredEffects;
}> {
  const existingKeys = await getExistingTurnKeys(client, engagementId);
  const inserts: PersistTurnRow[] = [];
  const structuredEffects: StructuredEffects = {
    gateApprovals: [],
    decisions: [],
    actualMetrics: [],
  };

  for (const draft of drafts) {
    const extracted = extractStructuredEffects(draft.rawText, draft.createdAt);
    const dedupeKey = `${draft.sender}:::${extracted.cleanedText}`;
    if (!existingKeys.has(dedupeKey)) {
      inserts.push({
        phase: draft.phase,
        sender: draft.sender,
        modeLabel: draft.modeLabel,
        text: extracted.cleanedText,
        createdAt: draft.createdAt,
      });
      existingKeys.add(dedupeKey);
    }

    if (extracted.gateApproval) structuredEffects.gateApprovals.push(extracted.gateApproval);
    structuredEffects.decisions.push(...extracted.decisions);
    if (extracted.actualMetrics) structuredEffects.actualMetrics.push(extracted.actualMetrics);
  }

  if (inserts.length > 0) {
    const values: Array<unknown> = [];
    const tuples = inserts.map((turn, index) => {
      const base = index * 7;
      values.push(
        engagementId,
        turn.phase,
        turn.sender,
        turn.text,
        turn.modeLabel,
        JSON.stringify({
          source: DEMO_SOURCE,
          seeded_at: new Date().toISOString(),
        }),
        turn.createdAt,
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::jsonb, $${base + 7}::timestamptz)`;
    });

    await client.query(
      `
        insert into turns (
          engagement_id,
          phase,
          sender,
          text,
          mode_label,
          retrieved_refs,
          created_at
        )
        values ${tuples.join(', ')}
      `,
      values,
    );
  }

  return {
    insertedTurns: inserts.length,
    structuredEffects,
  };
}

function mergeGateApprovals(
  existing: Array<Record<string, unknown>> | null,
  gateApprovals: StructuredEffects['gateApprovals'],
  sponsorPersonId: string | null,
): Array<Record<string, unknown>> {
  const current = [...(existing ?? [])];
  const seen = new Set(current.map((gate) => `${gate.phase}:${gate.status}`));

  for (const gate of gateApprovals) {
    const key = `${gate.phase}:approved`;
    if (seen.has(key)) continue;
    current.push({
      phase: gate.phase,
      status: 'approved',
      signed_at: gate.signed_at,
      signed_by: sponsorPersonId,
      approval_text: gate.approval_text,
      summary: gate.summary,
      source: DEMO_SOURCE,
    });
    seen.add(key);
  }

  return current.sort((a, b) => {
    const aPhase = typeof a.phase === 'number' ? a.phase : 0;
    const bPhase = typeof b.phase === 'number' ? b.phase : 0;
    return aPhase - bPhase;
  });
}

function mergeDecisions(
  existing: Array<Record<string, unknown>> | null,
  decisions: StructuredEffects['decisions'],
): Array<Record<string, unknown>> {
  const current = [...(existing ?? [])];
  const seen = new Set(current.map((decision) => String(decision.summary ?? '')));

  for (const decision of decisions) {
    if (seen.has(decision.summary)) continue;
    current.push({
      ...decision,
      source: DEMO_SOURCE,
    });
    seen.add(decision.summary);
  }

  return current;
}

async function applyStructuredEffects(
  client: Client,
  engagement: EngagementRow,
  effects: StructuredEffects,
): Promise<void> {
  const nextGates = mergeGateApprovals(engagement.gates_passed, effects.gateApprovals, engagement.sponsor_person_id);
  const nextDecisions = mergeDecisions(engagement.decisions, effects.decisions);

  let nextActualMetrics = engagement.actual_metrics;
  if ((!engagement.actual_metrics || Object.keys(engagement.actual_metrics).length === 0) && effects.actualMetrics.length > 0) {
    nextActualMetrics = {
      ...effects.actualMetrics[effects.actualMetrics.length - 1],
      source: DEMO_SOURCE,
    };
  }

  await client.query(
    `
      update engagements
      set
        gates_passed = $2::jsonb,
        decisions = $3::jsonb,
        actual_metrics = $4::jsonb,
        updated_at = now()
      where id = $1
    `,
    [
      engagement.id,
      JSON.stringify(nextGates),
      JSON.stringify(nextDecisions),
      JSON.stringify(nextActualMetrics ?? {}),
    ],
  );
}

async function seedProfile(client: Client, profile: EngagementProfile): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query(`select pg_advisory_xact_lock(hashtext($1))`, [profile.displayName]);

    const engagement = await findEngagement(client, profile);
    if (!engagement) {
      await client.query('COMMIT');
      console.log(`- skip · ${profile.displayName} · engagement not found`);
      return;
    }

    const drafts = buildTurnsForEngagement(profile, engagement);
    const result = await insertTurns(client, engagement.id, drafts);
    await applyStructuredEffects(client, engagement, result.structuredEffects);

    const { rows } = await client.query<{ count: string }>(
      `select count(*)::text as count from turns where engagement_id = $1`,
      [engagement.id],
    );

    await client.query('COMMIT');
    console.log(
      `✓ ${engagement.name} · inserted ${result.insertedTurns} turns · total ${rows[0]?.count ?? '0'} · /engagements/${engagement.graph_node_id ?? engagement.id}`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const client = createDbClient();
  await client.connect();

  try {
    console.log(`ℹ Using database ${resolveDbUrl().includes('127.0.0.1') || resolveDbUrl().includes('localhost') ? 'local-fallback' : 'configured-url'}`);
    for (const profile of PROFILES) {
      await seedProfile(client, profile);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
