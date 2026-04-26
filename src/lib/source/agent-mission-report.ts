import {
  buildSourceAgentMissions,
  prioritizeSourceAgentMissions,
  summarizeSourceAgentMissions,
} from './agent-missions';
import type {
  SourceAgentMission,
  SourceAgentMissionInput,
  SourceAgentMissionPriority,
  SourceAgentMissionState,
} from './agent-mission-types';
import type {
  SourceSuggestedAgentAction,
} from './multi-agent-types';

export const SOURCE_AGENT_MISSION_REPORT_VERSION = 'source-agent-mission-report/v1';

export interface SourceAgentMissionReportAgentCounts {
  nexus: number;
  sentinel: number;
  atlas: number;
  steward: number;
}

export interface SourceAgentMissionReportContextUsedSummary {
  eventStateUsed: boolean;
  patternPackUsed?: string;
  patternSectionCount: number;
  artifactCount: number;
  uploadedFileCount: number;
  citationCount: number;
  valueLedgerUsed: boolean;
  scorecardUsed: boolean;
  missingContext: string[];
}

export interface SourceAgentMissionReport {
  reportId: string;
  reportVersion: typeof SOURCE_AGENT_MISSION_REPORT_VERSION;
  generatedAt: string;
  sourceEventId?: string;
  sourceEventName?: string;
  missionCount: number;
  countByAgent: SourceAgentMissionReportAgentCounts;
  countByPriority: Record<SourceAgentMissionPriority, number>;
  countByState: Record<SourceAgentMissionState, number>;
  topMissions: SourceAgentMission[];
  criticalMissions: SourceAgentMission[];
  blockers: string[];
  defers: string[];
  handoffs: string[];
  recommendedNextAction: string;
  suggestedActions: SourceSuggestedAgentAction[];
  contextUsedSummary: SourceAgentMissionReportContextUsedSummary;
  explicitOutOfScope: string[];
  missions: SourceAgentMission[];
  summary: string;
}

const EXPLICIT_OUT_OF_SCOPE = [
  'model calls',
  'chat UI',
  'API routes',
  'upload/parsing',
  'event canvas expansion',
  'scorecard UI',
  'artifact drawer UI',
  'value ledger UI',
  'vendor flow',
  'AI/RFP generation',
  'scheduler/background jobs',
  'persistence',
  'workflow engine',
  'approval engine',
  '/programs integration',
  '/preview or /demo surfaces',
];

export function createSourceAgentMissionReport(
  input: SourceAgentMissionInput,
): SourceAgentMissionReport {
  return getSourceAgentMissionReadableReport(input);
}

export function getSourceAgentMissionReadableReport(
  input: SourceAgentMissionInput,
): SourceAgentMissionReport {
  const missions = prioritizeSourceAgentMissions(buildSourceAgentMissions(input));
  const topMissions = getTopSourceAgentMissions(missions);
  const criticalMissions = missions.filter((mission) => mission.priority === 'critical');
  const blockers = unique(missions
    .filter((mission) => mission.state === 'blocked' || mission.blockerReason)
    .map((mission) => mission.blockerReason ?? mission.summary));
  const defers = unique(missions
    .filter((mission) => mission.state === 'deferred')
    .map((mission) => mission.blockerReason ?? mission.summary));
  const handoffs = unique(missions
    .filter((mission) => mission.handoffTarget)
    .map((mission) => `${mission.agentName} -> ${mission.handoffTarget}: ${mission.title}`));
  const recommendedNextAction = topMissions[0]?.recommendedAction
    ?? input.contextBundle.nextAction
    ?? 'Review Source mission readiness before adding UI or model behavior.';
  const report: SourceAgentMissionReport = {
    reportId: createReportId(input),
    reportVersion: SOURCE_AGENT_MISSION_REPORT_VERSION,
    generatedAt: getGeneratedAt(input),
    sourceEventId: input.contextBundle.sourcingEvent?.id,
    sourceEventName: input.contextBundle.sourcingEvent?.name,
    missionCount: missions.length,
    countByAgent: countByAgent(missions),
    countByPriority: countByPriority(missions),
    countByState: countByState(missions),
    topMissions,
    criticalMissions,
    blockers,
    defers,
    handoffs,
    recommendedNextAction,
    suggestedActions: uniqueActions(missions.flatMap((mission) => mission.suggestedActions)),
    contextUsedSummary: summarizeContextUsed(missions),
    explicitOutOfScope: [...EXPLICIT_OUT_OF_SCOPE],
    missions,
    summary: summarizeSourceAgentMissions(missions),
  };

  return report;
}

export function formatSourceAgentMissionReportAsMarkdown(
  report: SourceAgentMissionReport,
): string {
  const lines = [
    '# Source Agent Mission Report',
    '',
    `Report version: ${report.reportVersion}`,
    `Report id: ${report.reportId}`,
    `Generated at: ${report.generatedAt}`,
    report.sourceEventId ? `Source event id: ${report.sourceEventId}` : 'Source event id: portfolio',
    report.sourceEventName ? `Source event: ${report.sourceEventName}` : undefined,
    '',
    '## Summary',
    '',
    report.summary,
    `Recommended next action: ${report.recommendedNextAction}`,
    '',
    '## Counts',
    '',
    `Mission count: ${report.missionCount}`,
    `By agent: Nexus ${report.countByAgent.nexus}; Sentinel ${report.countByAgent.sentinel}; Atlas ${report.countByAgent.atlas}; Steward ${report.countByAgent.steward}`,
    `By priority: critical ${report.countByPriority.critical}; high ${report.countByPriority.high}; medium ${report.countByPriority.medium}; low ${report.countByPriority.low}`,
    `By state: blocked ${report.countByState.blocked}; active ${report.countByState.active}; waiting ${report.countByState.waiting}; deferred ${report.countByState.deferred}; proposed ${report.countByState.proposed}`,
    '',
    '## Top Missions',
    '',
    ...formatMissionList(report.topMissions),
    '',
    '## Critical Missions',
    '',
    ...formatMissionList(report.criticalMissions),
    '',
    '## Blockers',
    '',
    ...formatBullets(report.blockers),
    '',
    '## Defers',
    '',
    ...formatBullets(report.defers),
    '',
    '## Handoffs',
    '',
    ...formatBullets(report.handoffs),
    '',
    '## Suggested Actions',
    '',
    ...report.suggestedActions.map((action) => (
      `- ${action.label} (${action.agentName}): ${action.description}${action.enabled ? '' : ` [disabled: ${action.disabledReason ?? 'unavailable'}]`}`
    )),
    '',
    '## Context Used',
    '',
    `Event state used: ${report.contextUsedSummary.eventStateUsed ? 'yes' : 'no'}`,
    `Pattern pack: ${report.contextUsedSummary.patternPackUsed ?? 'none'}`,
    `Pattern sections: ${report.contextUsedSummary.patternSectionCount}`,
    `Artifacts: ${report.contextUsedSummary.artifactCount}`,
    `Uploaded files: ${report.contextUsedSummary.uploadedFileCount}`,
    `Citations: ${report.contextUsedSummary.citationCount}`,
    `Scorecard used: ${report.contextUsedSummary.scorecardUsed ? 'yes' : 'no'}`,
    `Value ledger used: ${report.contextUsedSummary.valueLedgerUsed ? 'yes' : 'no'}`,
    '',
    'Missing context:',
    ...formatBullets(report.contextUsedSummary.missingContext),
    '',
    '## Remediations',
    '',
    ...formatBullets(getSourceAgentMissionRemediations(report)),
    '',
    '## Explicitly Out Of Scope',
    '',
    ...report.explicitOutOfScope.map((item) => `- ${item}`),
  ].filter((line): line is string => line !== undefined);

  return `${lines.join('\n')}\n`;
}

export function getSourceAgentMissionRemediations(
  report: SourceAgentMissionReport,
): string[] {
  return unique([
    report.recommendedNextAction,
    ...report.criticalMissions.map((mission) => mission.recommendedAction),
    ...report.topMissions.map((mission) => mission.recommendedAction),
    ...report.missions
      .filter((mission) => mission.blockerReason || mission.state === 'waiting' || mission.state === 'deferred')
      .map((mission) => mission.recommendedAction),
  ]);
}

export function getTopSourceAgentMissions(
  reportOrMissions: SourceAgentMissionReport | SourceAgentMission[],
  limit = 5,
): SourceAgentMission[] {
  const missions = Array.isArray(reportOrMissions)
    ? reportOrMissions
    : reportOrMissions.missions;

  return prioritizeSourceAgentMissions(missions).slice(0, limit);
}

export function summarizeSourceAgentMissionReport(
  report: SourceAgentMissionReport,
): string {
  const highest = report.topMissions[0];
  return [
    `${report.missionCount} Source agent missions`,
    `${report.countByPriority.critical} critical`,
    `${report.countByPriority.high} high`,
    `${report.countByPriority.medium} medium`,
    `${report.countByPriority.low} low.`,
    highest ? `Highest priority: ${highest.agentName} - ${highest.title}.` : 'No top mission.',
  ].join(' ');
}

function countByAgent(missions: SourceAgentMission[]): SourceAgentMissionReportAgentCounts {
  return {
    nexus: missions.filter((mission) => mission.agentName === 'nexus').length,
    sentinel: missions.filter((mission) => mission.agentName === 'sentinel').length,
    atlas: missions.filter((mission) => mission.agentName === 'atlas').length,
    steward: missions.filter((mission) => mission.agentName === 'steward').length,
  };
}

function countByPriority(
  missions: SourceAgentMission[],
): Record<SourceAgentMissionPriority, number> {
  return {
    critical: missions.filter((mission) => mission.priority === 'critical').length,
    high: missions.filter((mission) => mission.priority === 'high').length,
    medium: missions.filter((mission) => mission.priority === 'medium').length,
    low: missions.filter((mission) => mission.priority === 'low').length,
  };
}

function countByState(
  missions: SourceAgentMission[],
): Record<SourceAgentMissionState, number> {
  return {
    proposed: missions.filter((mission) => mission.state === 'proposed').length,
    active: missions.filter((mission) => mission.state === 'active').length,
    waiting: missions.filter((mission) => mission.state === 'waiting').length,
    blocked: missions.filter((mission) => mission.state === 'blocked').length,
    completed: missions.filter((mission) => mission.state === 'completed').length,
    dismissed: missions.filter((mission) => mission.state === 'dismissed').length,
    escalated: missions.filter((mission) => mission.state === 'escalated').length,
    deferred: missions.filter((mission) => mission.state === 'deferred').length,
  };
}

function summarizeContextUsed(missions: SourceAgentMission[]): SourceAgentMissionReportContextUsedSummary {
  const used = missions.flatMap((mission) => mission.contextUsed);
  return {
    eventStateUsed: used.some((context) => context.eventStateUsed),
    patternPackUsed: firstDefined(used.map((context) => context.patternPackUsed)),
    patternSectionCount: unique(used.flatMap((context) => context.patternSectionsUsed)).length,
    artifactCount: unique(used.flatMap((context) => context.artifactsUsed)).length,
    uploadedFileCount: unique(used.flatMap((context) => context.uploadedFilesUsed)).length,
    citationCount: unique(used.flatMap((context) => context.citationsUsed)).length,
    valueLedgerUsed: used.some((context) => context.valueLedgerUsed),
    scorecardUsed: used.some((context) => context.scorecardUsed),
    missingContext: unique(used.flatMap((context) => context.missingContext)),
  };
}

function createReportId(input: SourceAgentMissionInput): string {
  return [
    'source-agent-mission-report',
    input.contextBundle.sourcingEvent?.id ?? 'portfolio',
    getGeneratedAt(input).replace(/[^0-9a-z]/gi, ''),
  ].join(':');
}

function getGeneratedAt(input: SourceAgentMissionInput): string {
  return input.generatedAt
    ?? input.workflowValidationReport?.generatedAt
    ?? input.contextValidationReport?.generatedAt
    ?? input.multiAgentBriefing?.generatedAt
    ?? '2026-04-26T00:00:00.000Z';
}

function formatMissionList(missions: SourceAgentMission[]): string[] {
  if (missions.length === 0) return ['- None.'];

  return missions.map((mission) => (
    `- ${mission.priority} / ${mission.state} / ${mission.agentName}: ${mission.title} - ${mission.recommendedAction}`
  ));
}

function formatBullets(values: string[]): string[] {
  if (values.length === 0) return ['- None.'];
  return values.map((value) => `- ${value}`);
}

function uniqueActions(actions: SourceSuggestedAgentAction[]): SourceSuggestedAgentAction[] {
  const byId = new Map<string, SourceSuggestedAgentAction>();
  for (const action of actions) {
    byId.set(action.id, action);
  }
  return Array.from(byId.values());
}

function firstDefined<T>(values: Array<T | undefined>): T | undefined {
  return values.find((value): value is T => value !== undefined);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}
