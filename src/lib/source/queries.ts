import {
  getSourceArtifactSeed,
  getSourceDashboardSeed,
  getSourceEventSeed,
  getSourceValueSeed,
  listSourceEventSeed,
} from './mock-seed';
import type {
  AbarvaSourceDashboardData,
  SourceArtifactDetail,
  SourceValueLedgerSnapshot,
  SourcingEventDetail,
  SourcingEventSummary,
} from './types';
import { getStageOverride } from './stage-overrides';
import { SOURCE_STAGE_LABELS } from './constants';

// Canonical Source query boundary. Keep all temporary seed reads here so the
// new route family does not inherit legacy /programs mocks or preview pages.

export async function getSourceDashboardData(): Promise<AbarvaSourceDashboardData> {
  return getSourceDashboardSeed();
}

export async function listSourcingEvents(): Promise<SourcingEventSummary[]> {
  return listSourceEventSeed();
}

export async function getSourcingEvent(eventId: string): Promise<SourcingEventDetail | null> {
  const event = getSourceEventSeed(eventId);
  if (!event) return null;
  const override = getStageOverride(eventId);
  if (override) {
    return {
      ...event,
      currentStageKey: override,
      currentStageLabel: SOURCE_STAGE_LABELS[override],
    };
  }
  return event;
}

export async function getSourcingEventArtifact(eventId: string, artifactId: string): Promise<SourceArtifactDetail | null> {
  return getSourceArtifactSeed(eventId, artifactId);
}

export async function getSourceValueLedger(): Promise<SourceValueLedgerSnapshot> {
  return getSourceValueSeed();
}
