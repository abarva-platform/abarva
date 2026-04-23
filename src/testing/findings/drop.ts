import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type FindingsStorageOptions,
  getCycleDropDirectory,
  getSessionAssessmentPath,
  getTurnEventsPath,
  readCycleBundle,
  writeCycleBundle,
} from './storage';
import { validateCycleId, validateSessionAssessment, validateTurnEvents } from './schema';

export interface IngestedDropResult {
  cycleId: string;
  sourceDirectory: string;
  turnEventCount: number;
  wroteAssessment: boolean;
  output: {
    eventsPath: string;
    assessmentPath: string;
  };
}

export function ingestCycleFromDrop(cycleId: string, options: FindingsStorageOptions = {}): IngestedDropResult {
  const validatedCycleId = validateCycleId(cycleId);
  const sourceDirectory = getCycleDropDirectory(validatedCycleId, options);
  ensureDropDirectory(sourceDirectory);

  const eventFile = findFirstExistingFile(sourceDirectory, ['turn-events.json', 'turn-events.ndjson']);
  const assessmentFile = findFirstExistingFile(sourceDirectory, ['session-assessment.json']);

  if (!eventFile && !assessmentFile) {
    throw new Error(`No drop files found in ${sourceDirectory}`);
  }

  const prior = readCycleBundle(validatedCycleId, options);
  const turnEvents = eventFile
    ? loadTurnEvents(join(sourceDirectory, eventFile))
    : prior?.turn_events ?? [];
  const assessment = assessmentFile
    ? validateSessionAssessment(JSON.parse(readFileSync(join(sourceDirectory, assessmentFile), 'utf8')) as unknown)
    : prior?.session_assessment;

  if (!assessment) {
    throw new Error(`Drop ingest for ${validatedCycleId} requires session-assessment.json or an existing assessment.`);
  }

  writeCycleBundle(
    {
      cycle_id: validatedCycleId,
      turn_events: turnEvents,
      session_assessment: assessment,
    },
    options,
  );

  return {
    cycleId: validatedCycleId,
    sourceDirectory,
    turnEventCount: turnEvents.length,
    wroteAssessment: true,
    output: {
      eventsPath: getTurnEventsPath(validatedCycleId, options),
      assessmentPath: getSessionAssessmentPath(validatedCycleId, options),
    },
  };
}

function loadTurnEvents(path: string) {
  const raw = readFileSync(path, 'utf8');
  if (path.endsWith('.ndjson')) {
    const parsed = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
    return validateTurnEvents(parsed);
  }
  return validateTurnEvents(JSON.parse(raw) as unknown);
}

function findFirstExistingFile(directory: string, candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (existsSync(join(directory, candidate))) return candidate;
  }
  return null;
}

function ensureDropDirectory(directory: string): void {
  mkdirSync(directory, { recursive: true });
}
