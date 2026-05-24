import type { GeneratedArtifactType } from './types';

export interface ArtifactTriggerEvent {
  clientId: string;
  sourceArtifactRef: string;
  artifactType: GeneratedArtifactType;
  reason: string;
  queuedAt: string;
}

export function artifactTriggerForMoveInsert(args: {
  clientId: string;
  moveId: string;
}): ArtifactTriggerEvent {
  return {
    clientId: args.clientId,
    sourceArtifactRef: args.moveId,
    artifactType: 'move_board_pack',
    reason: 'move_instances insert',
    queuedAt: new Date().toISOString(),
  };
}

export function artifactTriggerForSourceConfirmation(args: {
  clientId: string;
  sourceEventId: string;
}): ArtifactTriggerEvent {
  return {
    clientId: args.clientId,
    sourceArtifactRef: args.sourceEventId,
    artifactType: 'source_board_pack',
    reason: 'source_events status confirmed',
    queuedAt: new Date().toISOString(),
  };
}

export function artifactTriggerForWatchlistEntry(args: {
  clientId: string;
  watchlistEntryId: string;
  killFitness: number;
}): ArtifactTriggerEvent | null {
  if (args.killFitness <= 80) return null;
  return {
    clientId: args.clientId,
    sourceArtifactRef: args.watchlistEntryId,
    artifactType: 'watchlist_review_pack',
    reason: 'watchlist kill_fitness over 80',
    queuedAt: new Date().toISOString(),
  };
}

