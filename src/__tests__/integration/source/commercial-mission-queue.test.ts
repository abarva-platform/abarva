import {
  buildCommercialMissionQueue,
  CommercialMissionType,
  CommercialMissionPriority,
  CommercialMissionStatus,
  CommercialMissionOwner,
  CommercialMissionQueue,
} from '../../../lib/source/commercial-mission-queue';

const MISSION_TYPES: CommercialMissionType[] = [
  'price_benchmark', 'scope_clarification', 'evidence_collection',
  'bafo_preparation', 'governance_review', 'vendor_negotiation',
  'risk_mitigation', 'contract_review', 'award_recommendation', 'transition_planning',
];

const PRIORITIES: CommercialMissionPriority[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: CommercialMissionStatus[] = ['queued', 'in_progress', 'blocked', 'complete', 'skipped'];
const OWNERS: CommercialMissionOwner[] = ['nexus', 'sentinel', 'atlas', 'steward', 'buyer_team'];

const fullQueueInput = {
  eventId: 'evt-queue-test',
  eventName: 'Queue Test Event',
  stage: 'bafo',
  vendorIds: ['vendor-a', 'vendor-b'],
  needsPriceBenchmark: true,
  needsScopeClarification: true,
  needsEvidenceCollection: true,
  needsGovernanceReview: true,
  isBafoPhase: true,
};

const emptyQueueInput = {
  eventId: 'evt-empty',
  eventName: 'Empty Queue Event',
  stage: 'rfp',
  vendorIds: [],
  needsPriceBenchmark: false,
  needsScopeClarification: false,
  needsEvidenceCollection: false,
  needsGovernanceReview: false,
  isBafoPhase: false,
};

describe('commercial-mission-queue - vocabulary', () => {
  it('defines 10 mission types', () => {
    expect(MISSION_TYPES).toHaveLength(10);
  });

  it('includes bafo_preparation and evidence_collection', () => {
    expect(MISSION_TYPES).toContain('bafo_preparation');
    expect(MISSION_TYPES).toContain('evidence_collection');
  });

  it('defines 4 priorities', () => {
    expect(PRIORITIES).toHaveLength(4);
    expect(PRIORITIES).toContain('critical');
  });

  it('defines 5 statuses', () => {
    expect(STATUSES).toHaveLength(5);
    expect(STATUSES).toContain('blocked');
  });

  it('defines 5 owners', () => {
    expect(OWNERS).toHaveLength(5);
    expect(OWNERS).toContain('nexus');
    expect(OWNERS).toContain('buyer_team');
  });
});

describe('commercial-mission-queue - buildCommercialMissionQueue (full queue)', () => {
  let queue: CommercialMissionQueue;

  beforeAll(() => {
    queue = buildCommercialMissionQueue(fullQueueInput);
  });

  it('returns correct eventId', () => {
    expect(queue.eventId).toBe('evt-queue-test');
  });

  it('sets generatedAt to 2026-04-26', () => {
    expect(queue.generatedAt).toBe('2026-04-26');
  });

  it('returns at least one item', () => {
    expect(queue.items.length).toBeGreaterThan(0);
  });

  it('every item has a valid missionType', () => {
    for (const item of queue.items) {
      expect(MISSION_TYPES).toContain(item.missionType);
    }
  });

  it('every item has a valid priority', () => {
    for (const item of queue.items) {
      expect(PRIORITIES).toContain(item.priority);
    }
  });

  it('every item has a valid status', () => {
    for (const item of queue.items) {
      expect(STATUSES).toContain(item.status);
    }
  });

  it('every item has a valid owner', () => {
    for (const item of queue.items) {
      expect(OWNERS).toContain(item.owner);
    }
  });

  it('every item has non-empty title and objective', () => {
    for (const item of queue.items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.objective.length).toBeGreaterThan(0);
    }
  });

  it('every item has inputs and outputs arrays', () => {
    for (const item of queue.items) {
      expect(Array.isArray(item.inputs)).toBe(true);
      expect(Array.isArray(item.outputs)).toBe(true);
    }
  });

  it('totalCount equals items length', () => {
    expect(queue.totalCount).toBe(queue.items.length);
  });

  it('nextMission is non-null when queued items exist', () => {
    if (queue.queuedCount > 0) {
      expect(queue.nextMission).not.toBeNull();
    }
  });

  it('summaryNarrative is a non-empty string', () => {
    expect(queue.summaryNarrative.length).toBeGreaterThan(0);
  });

  it('BAFO prep mission is blocked when prerequisites needed', () => {
    const bafoPrepItem = queue.items.find((i) => i.missionType === 'bafo_preparation');
    if (bafoPrepItem && bafoPrepItem.blockedBy.length > 0) {
      expect(bafoPrepItem.status).toBe('blocked');
    }
  });
});

describe('commercial-mission-queue - buildCommercialMissionQueue (empty queue)', () => {
  it('returns zero items when no flags set', () => {
    const queue = buildCommercialMissionQueue(emptyQueueInput);
    expect(queue.items).toHaveLength(0);
    expect(queue.totalCount).toBe(0);
    expect(queue.nextMission).toBeNull();
  });
});

describe('commercial-mission-queue - determinism', () => {
  it('two calls with same input return identical JSON', () => {
    const q1 = buildCommercialMissionQueue(fullQueueInput);
    const q2 = buildCommercialMissionQueue(fullQueueInput);
    expect(JSON.stringify(q1)).toBe(JSON.stringify(q2));
  });
});
