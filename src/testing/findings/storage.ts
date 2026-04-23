import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type FindingsCycleBundle,
  type SessionAssessment,
  type TurnEvent,
  validateCycleBundle,
  validateCycleId,
  validateSessionAssessment,
  validateTurnEvent,
  validateTurnEvents,
} from './schema';

export interface FindingsStorageOptions {
  rootDir?: string;
}

export interface FindingsWriteResult {
  cycleId: string;
  cycleDir: string;
  eventsPath: string;
  assessmentPath: string;
}

export const DEFAULT_FINDINGS_ROOT = join(process.cwd(), 'reports', 'test-cycles');

export function getFindingsRootDir(options: FindingsStorageOptions = {}): string {
  return options.rootDir ?? DEFAULT_FINDINGS_ROOT;
}

export function getCycleDirectory(cycleId: string, options: FindingsStorageOptions = {}): string {
  return join(getFindingsRootDir(options), validateCycleId(cycleId));
}

export function getCycleDropDirectory(cycleId: string, options: FindingsStorageOptions = {}): string {
  return join(getCycleDirectory(cycleId, options), 'incoming');
}

export function getTurnEventsPath(cycleId: string, options: FindingsStorageOptions = {}): string {
  return join(getCycleDirectory(cycleId, options), 'turn-events.json');
}

export function getSessionAssessmentPath(cycleId: string, options: FindingsStorageOptions = {}): string {
  return join(getCycleDirectory(cycleId, options), 'session-assessment.json');
}

export function appendTurnEvent(event: unknown, options: FindingsStorageOptions = {}): FindingsWriteResult {
  const normalized = validateTurnEvent(event);
  const existing = readTurnEvents(normalized.cycle_id, options);
  const events = [...existing, normalized].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  writeTurnEvents(normalized.cycle_id, events, options);
  return describeWrite(normalized.cycle_id, options);
}

export function writeTurnEvents(cycleId: string, events: unknown, options: FindingsStorageOptions = {}): FindingsWriteResult {
  const validatedCycleId = validateCycleId(cycleId);
  const normalizedEvents = validateTurnEvents(events).map((event) => {
    if (event.cycle_id !== validatedCycleId) {
      throw new Error(`turn event cycle mismatch: expected ${validatedCycleId}, received ${event.cycle_id}`);
    }
    return event;
  });
  const eventsPath = getTurnEventsPath(validatedCycleId, options);
  ensureDirectory(getCycleDirectory(validatedCycleId, options));
  writeFileSync(eventsPath, `${JSON.stringify(normalizedEvents, null, 2)}\n`);
  return describeWrite(validatedCycleId, options);
}

export function writeSessionAssessment(assessment: unknown, options: FindingsStorageOptions = {}): FindingsWriteResult {
  const normalized = validateSessionAssessment(assessment);
  const assessmentPath = getSessionAssessmentPath(normalized.cycle_id, options);
  ensureDirectory(getCycleDirectory(normalized.cycle_id, options));
  writeFileSync(assessmentPath, `${JSON.stringify(normalized, null, 2)}\n`);
  return describeWrite(normalized.cycle_id, options);
}

export function writeCycleBundle(bundle: unknown, options: FindingsStorageOptions = {}): FindingsWriteResult {
  const normalized = validateCycleBundle(bundle);
  writeTurnEvents(normalized.cycle_id, normalized.turn_events, options);
  writeSessionAssessment(normalized.session_assessment, options);
  return describeWrite(normalized.cycle_id, options);
}

export function readTurnEvents(cycleId: string, options: FindingsStorageOptions = {}): TurnEvent[] {
  const path = getTurnEventsPath(cycleId, options);
  if (!existsSync(path)) return [];
  return validateTurnEvents(JSON.parse(readFileSync(path, 'utf8')) as unknown);
}

export function readSessionAssessment(cycleId: string, options: FindingsStorageOptions = {}): SessionAssessment | null {
  const path = getSessionAssessmentPath(cycleId, options);
  if (!existsSync(path)) return null;
  return validateSessionAssessment(JSON.parse(readFileSync(path, 'utf8')) as unknown);
}

export function readCycleBundle(cycleId: string, options: FindingsStorageOptions = {}): FindingsCycleBundle | null {
  const events = readTurnEvents(cycleId, options);
  const assessment = readSessionAssessment(cycleId, options);
  if (events.length === 0 && !assessment) return null;
  if (!assessment) {
    throw new Error(`Missing session assessment for ${cycleId}`);
  }
  return validateCycleBundle({
    cycle_id: cycleId,
    turn_events: events,
    session_assessment: assessment,
  });
}

function describeWrite(cycleId: string, options: FindingsStorageOptions): FindingsWriteResult {
  return {
    cycleId,
    cycleDir: getCycleDirectory(cycleId, options),
    eventsPath: getTurnEventsPath(cycleId, options),
    assessmentPath: getSessionAssessmentPath(cycleId, options),
  };
}

function ensureDirectory(dir: string): void {
  mkdirSync(dir, { recursive: true });
}
