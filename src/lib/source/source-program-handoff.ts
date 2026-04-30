import type { ChatTurn } from '@/lib/shell/atlas-page-state';
import { buildLinkedProgramBadgeView } from './linked-program-badge-view';
import { getLinksForProgram, getLinksForSourceEvent, type SourceProgramLink } from './source-program-link';

const STORAGE_KEY = 'abarva.sourceProgramHandoff';
const FRESH_WINDOW_MS = 90_000;

export type SourceProgramHandoffMode = 'program_spawned_source' | 'source_linked_program';

export interface SourceProgramHandoffPayload {
  mode: SourceProgramHandoffMode;
  programId: string;
  programName: string;
  sourceEventId: string;
  sourceEventName: string;
  route: string;
  turns: ChatTurn[];
  capturedAt: number;
}

export interface SpawnSourcingEventInput {
  programId: string;
  programName: string;
  sourceEventId?: string;
  sourceEventName?: string;
  turns?: ChatTurn[];
  capturedAt?: number;
}

export interface SpawnSourcingEventResult {
  sourceEventId: string;
  route: string;
  marker: ChatTurn;
  payload: SourceProgramHandoffPayload;
  link: SourceProgramLink | null;
}

export interface LinkSourcingEventToProgramResult {
  sourceEventId: string;
  programCode: string;
  programRoute: string | null;
  marker: ChatTurn;
  link: SourceProgramLink | null;
}

export function buildProgramToSourcingHandoffMarker(
  programName: string,
  sourceEventName: string,
): ChatTurn {
  return {
    id: `source_handoff_${Date.now().toString(36)}`,
    role: 'agent',
    agentName: '__handoff__',
    text:
      `Sourcing event opened from **${programName}**. ` +
      `Sentinel is now running **${sourceEventName}** with the program context attached.`,
    timestamp: Date.now(),
  };
}

export function buildSourceToProgramHandoffMarker(
  sourceEventName: string,
  programName: string,
): ChatTurn {
  return {
    id: `program_handoff_${Date.now().toString(36)}`,
    role: 'agent',
    agentName: '__handoff__',
    text:
      `Source linked **${sourceEventName}** back to **${programName}**. ` +
      'Nexus can use the commercial context in the program canvas.',
    timestamp: Date.now(),
  };
}

export function buildSpawnSourcingEventHandoff(
  input: SpawnSourcingEventInput,
): SpawnSourcingEventResult {
  const link = getLinksForProgram(input.programId)[0] ?? null;
  const sourceEventId = input.sourceEventId ?? link?.sourceEventId ?? 'apex-retail-ams-outsourcing-2026';
  const sourceEventName = input.sourceEventName ?? 'AMS Vendor Consolidation 2026';
  const route = `/source/events/${sourceEventId}`;
  const marker = buildProgramToSourcingHandoffMarker(input.programName, sourceEventName);
  const turns = [...(input.turns ?? []), marker];

  return {
    sourceEventId,
    route,
    marker,
    link,
    payload: {
      mode: 'program_spawned_source',
      programId: input.programId,
      programName: input.programName,
      sourceEventId,
      sourceEventName,
      route,
      turns,
      capturedAt: input.capturedAt ?? Date.now(),
    },
  };
}

export function buildLinkSourcingEventToProgramHandoff(
  sourceEventId: string,
): LinkSourcingEventToProgramResult | null {
  const link = getLinksForSourceEvent(sourceEventId)[0] ?? null;
  const badge = buildLinkedProgramBadgeView(sourceEventId);
  if (!link || !badge) return null;

  return {
    sourceEventId,
    programCode: link.linkedProgramCode,
    programRoute: badge.routeHint,
    marker: buildSourceToProgramHandoffMarker(sourceEventId, badge.programName),
    link,
  };
}

export function persistSourceProgramHandoff(payload: SourceProgramHandoffPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Handoff is a continuity aid; navigation can proceed without it.
  }
}

export function consumeSourceProgramHandoff(sourceEventId: string): ChatTurn[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);

    const parsed = JSON.parse(raw) as Partial<SourceProgramHandoffPayload>;
    if (!parsed || parsed.sourceEventId !== sourceEventId) return null;
    if (typeof parsed.capturedAt !== 'number') return null;
    if (Date.now() - parsed.capturedAt > FRESH_WINDOW_MS) return null;
    if (!Array.isArray(parsed.turns)) return null;

    return parsed.turns.filter(
      (turn): turn is ChatTurn =>
        turn != null &&
        typeof (turn as ChatTurn).id === 'string' &&
        ((turn as ChatTurn).role === 'user' || (turn as ChatTurn).role === 'agent') &&
        typeof (turn as ChatTurn).text === 'string',
    );
  } catch {
    return null;
  }
}

export function __resetSourceProgramHandoffForTests(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
