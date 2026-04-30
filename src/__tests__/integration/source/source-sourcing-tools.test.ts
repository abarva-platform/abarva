import {
  advanceSourcingStageTool,
  compareVendorsTool,
  runBafoCheckTool,
} from '@/lib/source/sourcing-tools';
import { getSourcingEvent } from '@/lib/source/queries';

const EVENT_ID = 'apex-retail-ams-outsourcing-2026';
const BLOCKED_EVENT_ID = 'evt-source-data-ai-si-selection';

describe('source sourcing tools', () => {
  it('blocks advance when the target gate has hard unresolved blockers', async () => {
    const result = await advanceSourcingStageTool({ eventId: BLOCKED_EVENT_ID, toStage: 1 });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('expected blocked advance');
    expect(result.error).toBe('gate_blocked_hard');
    expect(result.artifacts[0]).toMatchObject({
      type: 'sourcing-stage-progress',
      severity: 'hard',
      status: 'unmet',
    });
  });

  it('can advance with explicit bypass and emits a refreshable stage artifact', async () => {
    const result = await advanceSourcingStageTool({
      eventId: EVENT_ID,
      toStage: 7,
      bypassGate: true,
      rationale: 'Founder demo override',
    });

    expect(result.success).toBe(true);
    expect(result.artifacts[0]).toMatchObject({
      type: 'sourcing-stage-changed',
      eventId: EVENT_ID,
      toStage: 7,
    });

    const event = await getSourcingEvent(EVENT_ID);
    expect(event?.currentStageKey).toBe('value_realization');
  });

  it('compares vendors into vendor cards and a BAFO scoreboard', async () => {
    const result = await compareVendorsTool({
      eventId: EVENT_ID,
      vendorIds: ['northstar-managed-services', 'arcvault-managed'],
    });

    expect(result.success).toBe(true);
    expect(result.artifacts.filter((artifact) => artifact.type === 'vendor-card')).toHaveLength(2);
    expect(result.artifacts.some((artifact) => artifact.type === 'bafo-scoreboard')).toBe(true);
  });

  it('runs a deterministic BAFO check and emits walkaway guidance', async () => {
    const result = await runBafoCheckTool({ eventId: EVENT_ID });

    expect(result.success).toBe(true);
    expect(result.artifacts[0]).toMatchObject({
      type: 'walkaway-signal',
      credibility: 'theatre',
    });
    expect(result.artifacts.some((artifact) => artifact.type === 'bafo-scoreboard')).toBe(true);
  });
});
