import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type FindingsDeltaEntry,
  type FindingsDeltaReport,
  type MismatchSeverity,
  type SessionAssessment,
  type TurnEvent,
  fingerprintForEvent,
  severityRank,
} from './schema';
import { type FindingsStorageOptions, getCycleDirectory, readCycleBundle } from './storage';

interface CollapsedFinding {
  fingerprint: string;
  event: TurnEvent;
}

export function compareCycles(
  previousCycleId: string,
  currentCycleId: string,
  options: FindingsStorageOptions = {},
): FindingsDeltaReport {
  const previous = readCycleBundle(previousCycleId, options);
  const current = readCycleBundle(currentCycleId, options);

  if (!previous || !current) {
    throw new Error(`Cannot compare cycles: missing previous (${previousCycleId}) or current (${currentCycleId}) bundle.`);
  }

  const previousFindings = collapseFindings(previous.turn_events);
  const currentFindings = collapseFindings(current.turn_events);
  const allFingerprints = Array.from(new Set([...previousFindings.keys(), ...currentFindings.keys()])).sort();

  const resolved: FindingsDeltaEntry[] = [];
  const persistent: FindingsDeltaEntry[] = [];
  const regression: FindingsDeltaEntry[] = [];
  const discovered: FindingsDeltaEntry[] = [];

  for (const fingerprint of allFingerprints) {
    const previousFinding = previousFindings.get(fingerprint) ?? null;
    const currentFinding = currentFindings.get(fingerprint) ?? null;
    const previousSeverity = previousFinding?.event.mismatch_severity ?? null;
    const currentSeverity = currentFinding?.event.mismatch_severity ?? null;

    const previousRank = severityValue(previousSeverity);
    const currentRank = severityValue(currentSeverity);
    const entry = buildDeltaEntry(fingerprint, previousFinding?.event ?? null, currentFinding?.event ?? null);

    if (previousRank > 0 && currentRank === 0) {
      resolved.push(entry);
      continue;
    }

    if (previousRank === 0 && currentRank > 0) {
      if (previousFinding) regression.push(entry);
      else discovered.push(entry);
      continue;
    }

    if (previousRank > 0 && currentRank > 0) {
      if (currentRank > previousRank) regression.push(entry);
      else persistent.push(entry);
    }
  }

  return {
    previous_cycle_id: previousCycleId,
    current_cycle_id: currentCycleId,
    generated_at: new Date().toISOString(),
    summary: {
      resolved: resolved.length,
      persistent: persistent.length,
      regression: regression.length,
      new: discovered.length,
    },
    assessment_delta: {
      previous_recommendation: previous.session_assessment.overall_recommendation,
      current_recommendation: current.session_assessment.overall_recommendation,
    },
    resolved,
    persistent,
    regression,
    new: discovered,
  };
}

export function writeCycleDeltaReport(
  previousCycleId: string,
  currentCycleId: string,
  options: FindingsStorageOptions = {},
): { path: string; report: FindingsDeltaReport } {
  const report = compareCycles(previousCycleId, currentCycleId, options);
  const outputDirectory = getCycleDirectory(currentCycleId, options);
  const outputPath = join(outputDirectory, `delta-from-${previousCycleId}.json`);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  return { path: outputPath, report };
}

function collapseFindings(events: TurnEvent[]): Map<string, CollapsedFinding> {
  const collapsed = new Map<string, CollapsedFinding>();
  for (const event of events) {
    const fingerprint = fingerprintForEvent(event);
    const existing = collapsed.get(fingerprint);
    if (!existing) {
      collapsed.set(fingerprint, { fingerprint, event });
      continue;
    }
    const existingRank = severityRank(existing.event.mismatch_severity);
    const nextRank = severityRank(event.mismatch_severity);
    if (nextRank > existingRank || (nextRank === existingRank && event.timestamp > existing.event.timestamp)) {
      collapsed.set(fingerprint, { fingerprint, event });
    }
  }
  return collapsed;
}

function buildDeltaEntry(
  fingerprint: string,
  previousEvent: TurnEvent | null,
  currentEvent: TurnEvent | null,
): FindingsDeltaEntry {
  const source = currentEvent ?? previousEvent;
  if (!source) {
    throw new Error(`Cannot build delta entry for empty fingerprint ${fingerprint}`);
  }
  return {
    fingerprint,
    category: currentEvent?.category ?? previousEvent?.category ?? source.category,
    persona: currentEvent?.persona ?? previousEvent?.persona ?? source.persona,
    url: currentEvent?.url ?? previousEvent?.url ?? source.url,
    action: currentEvent?.action ?? previousEvent?.action ?? source.action,
    expected: currentEvent?.expected ?? previousEvent?.expected ?? source.expected,
    previous_severity: previousEvent?.mismatch_severity ?? null,
    current_severity: currentEvent?.mismatch_severity ?? null,
    previous_actual: previousEvent?.actual ?? null,
    current_actual: currentEvent?.actual ?? null,
    notes: uniqueNotes(previousEvent, currentEvent),
  };
}

function uniqueNotes(previousEvent: TurnEvent | null, currentEvent: TurnEvent | null): string[] {
  return Array.from(
    new Set(
      [previousEvent?.notes, currentEvent?.notes]
        .map((note) => note?.trim())
        .filter((note): note is string => Boolean(note)),
    ),
  );
}

function severityValue(severity: MismatchSeverity | null): number {
  return severity ? severityRank(severity) : 0;
}

export function assessmentSummary(assessment: SessionAssessment): string {
  return `${assessment.persona} · ${assessment.overall_recommendation} · blockers=${assessment.top_blockers.length}`;
}
