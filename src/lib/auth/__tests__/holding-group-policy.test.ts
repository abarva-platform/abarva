import {
  canApproveSpawn,
  canReadAggregate,
  canReadTransactionGrain,
  type HoldingGroupClientProfile,
} from '../holding-group-policy';

const l0: HoldingGroupClientProfile = {
  clientId: 'lakeshore-client',
  tenantKey: 'lakeshore-holdings',
  holdingGroupId: 'group-lakeshore',
  parentClientId: null,
  holdingGroupRole: 'l0_sponsor',
  aggregateVisibilityLevel: 'group_aggregate',
};

const morgan: HoldingGroupClientProfile = {
  clientId: 'morgan-client',
  tenantKey: 'morgan-street-holdings',
  holdingGroupId: 'group-lakeshore',
  parentClientId: 'lakeshore-client',
  holdingGroupRole: 'l1_holdco',
  aggregateVisibilityLevel: 'group_aggregate',
};

const unrelated: HoldingGroupClientProfile = {
  clientId: 'other-client',
  tenantKey: 'other',
  holdingGroupId: 'group-other',
  parentClientId: null,
  holdingGroupRole: 'standalone',
  aggregateVisibilityLevel: 'own_client',
};

describe('holding group policy', () => {
  it('lets L0 sponsor read same-group aggregate posture', () => {
    expect(canReadAggregate({ requester: l0, target: morgan })).toBe(true);
    expect(canApproveSpawn({ requester: l0, target: morgan })).toBe(true);
  });

  it('does not turn aggregate visibility into sibling transaction-grain access', () => {
    expect(canReadAggregate({ requester: l0, target: morgan })).toBe(true);
    expect(canReadTransactionGrain({ requester: l0, target: morgan })).toBe(false);
  });

  it('keeps unrelated clients isolated', () => {
    expect(canReadAggregate({ requester: l0, target: unrelated })).toBe(false);
    expect(canApproveSpawn({ requester: l0, target: unrelated })).toBe(false);
  });

  it('allows own-client transaction-grain reads', () => {
    expect(canReadTransactionGrain({ requester: morgan, target: morgan })).toBe(true);
  });
});
