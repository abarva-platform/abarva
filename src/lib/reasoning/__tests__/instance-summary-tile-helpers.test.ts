/**
 * Tests for the small helpers exported from `InstanceSummaryTile`.
 *
 * Only the pure helpers are tested here — JSX rendering is covered by the
 * surrounding pages' integration smoke tests.
 */

import { pickTopMission } from '@/components/_shared/InstanceSummaryTile';
import type { DerivedMission } from '@/lib/reasoning/mission-derivation';

function makeMission(over: Partial<DerivedMission> & { id: string; label: string }): DerivedMission {
  return {
    id: over.id,
    instanceId: over.instanceId ?? 'instance-x',
    instanceDisplayId: over.instanceDisplayId ?? 'INSTANCE-X',
    instanceLabel: over.instanceLabel ?? 'Instance X',
    patternId: over.patternId ?? 'PAT-X',
    stageId: over.stageId ?? 'Stage-1',
    criterionId: over.criterionId ?? 'crit-1',
    label: over.label,
    description: over.description ?? '',
    gateType: over.gateType ?? 'hard',
    priority: over.priority ?? 'high',
    evaluationHint: over.evaluationHint ?? '',
  };
}

describe('pickTopMission', () => {
  test('returns null when no missions are provided', () => {
    expect(pickTopMission([])).toBeNull();
  });

  test('returns the first mission when the list is already priority-sorted', () => {
    // `deriveMissionsFromInstance` returns missions sorted high → low, so the
    // head IS the canonical top mission. The helper deliberately preserves
    // that contract — it does not re-sort.
    const high = makeMission({ id: 'a', label: 'Upload BAFO comparison', priority: 'high' });
    const medium = makeMission({ id: 'b', label: 'Confirm pricing schedule', priority: 'medium' });
    const low = makeMission({ id: 'c', label: 'Document approval', priority: 'low' });

    const top = pickTopMission([high, medium, low]);
    expect(top).not.toBeNull();
    expect(top?.id).toBe('a');
    expect(top?.label).toBe('Upload BAFO comparison');
  });
});
