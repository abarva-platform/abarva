import type { SourceAgentContextBundle, SourceContextUsed } from './agent-context';
import type { SourceAgentMission } from './agent-mission-types';
import type {
  CommercialMissionQueue,
  CommercialMissionQueueInput,
  CommercialMissionQueueItem,
} from './commercial-mission-queue';

export interface SourceCommercialMissionAdapterInput {
  commercialQueue: CommercialMissionQueue;
  existingMissions?: SourceAgentMission[];
  contextBundle?: SourceAgentContextBundle;
  generatedAt?: string;
}

export interface SourceCommercialMissionBuildInput {
  queueInput: CommercialMissionQueueInput;
  existingMissions?: SourceAgentMission[];
  contextBundle?: SourceAgentContextBundle;
  generatedAt?: string;
}

export interface SourceCommercialMissionAdapterResult {
  eventId: string;
  stage: string;
  generatedAt: string;
  adaptedMissions: SourceAgentMission[];
  duplicateSuppressedCount: number;
  sourceQueueCount: number;
  sourceQueueCriticalCount: number;
  sourceQueueBlockedCount: number;
  sourceQueueItems: CommercialMissionQueueItem[];
  summary: string;
}

export interface SourceCommercialMissionSummary {
  eventId: string;
  generatedAt: string;
  total: number;
  byAgent: Record<'nexus' | 'sentinel' | 'atlas' | 'steward', number>;
  byPriority: Record<'critical' | 'high' | 'medium' | 'low', number>;
  blockedCount: number;
  duplicateSuppressedCount: number;
  summary: string;
}

export interface SourceCommercialMissionMarkdownInput {
  result: SourceCommercialMissionAdapterResult;
  contextUsed?: SourceContextUsed[];
}
