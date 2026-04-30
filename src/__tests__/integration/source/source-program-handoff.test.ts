/** @jest-environment jsdom */

import type { ChatTurn } from '@/lib/shell/atlas-page-state';
import {
  __resetSourceProgramHandoffForTests,
  buildLinkSourcingEventToProgramHandoff,
  buildSpawnSourcingEventHandoff,
  consumeSourceProgramHandoff,
  persistSourceProgramHandoff,
} from '@/lib/source/source-program-handoff';

const EVENT_ID = 'apex-retail-ams-outsourcing-2026';
const sampleTurns: ChatTurn[] = [
  { id: 'u1', role: 'user', agentName: 'Nexus', text: 'We need a vendor selection event.', timestamp: 1 },
];

describe('source program handoff contract', () => {
  beforeEach(() => {
    __resetSourceProgramHandoffForTests();
  });

  it('builds a program-to-source handoff payload with a handoff marker', () => {
    const result = buildSpawnSourcingEventHandoff({
      programId: 'APX-CDP-2026',
      programName: 'CDP Activation',
      turns: sampleTurns,
      capturedAt: 100,
    });

    expect(result.sourceEventId).toBe(EVENT_ID);
    expect(result.route).toBe(`/source/events/${EVENT_ID}`);
    expect(result.marker.agentName).toBe('__handoff__');
    expect(result.payload.turns).toHaveLength(2);
    expect(result.payload.mode).toBe('program_spawned_source');
  });

  it('builds a source-to-program link handoff for the Apex event', () => {
    const result = buildLinkSourcingEventToProgramHandoff(EVENT_ID);

    expect(result).not.toBeNull();
    expect(result?.programCode).toBe('APX-CDP-2026');
    expect(result?.programRoute).toBe('/programs/apx-cdp-2026');
    expect(result?.marker.agentName).toBe('__handoff__');
  });

  it('returns null when no source-program link exists', () => {
    expect(buildLinkSourcingEventToProgramHandoff('unknown-event')).toBeNull();
  });

  it('round-trips fresh handoff turns through sessionStorage', () => {
    const result = buildSpawnSourcingEventHandoff({
      programId: 'APX-CDP-2026',
      programName: 'CDP Activation',
      turns: sampleTurns,
      capturedAt: Date.now(),
    });

    persistSourceProgramHandoff(result.payload);
    const consumed = consumeSourceProgramHandoff(EVENT_ID);

    expect(consumed?.map((turn) => turn.id)).toEqual(result.payload.turns.map((turn) => turn.id));
    expect(consumeSourceProgramHandoff(EVENT_ID)).toBeNull();
  });
});
