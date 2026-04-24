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

// Canonical Source query boundary. Keep all temporary seed reads here so the
// new route family does not inherit legacy /programs mocks or preview pages.

export async function getSourceDashboardData(): Promise<AbarvaSourceDashboardData> {
  return getSourceDashboardSeed();
}

export async function listSourcingEvents(): Promise<SourcingEventSummary[]> {
  return listSourceEventSeed();
}

export async function getSourcingEvent(eventId: string): Promise<SourcingEventDetail | null> {
  return getSourceEventSeed(eventId);
}

export async function getSourcingEventArtifact(eventId: string, artifactId: string): Promise<SourceArtifactDetail | null> {
  return getSourceArtifactSeed(eventId, artifactId);
}

export async function getSourceValueLedger(): Promise<SourceValueLedgerSnapshot> {
  return getSourceValueSeed();
}
