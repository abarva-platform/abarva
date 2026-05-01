import {
  detectCrossTenantWriteIntent,
  formatCrossTenantWriteRefusal,
} from '../tenant-guardrails';

describe('tenant guardrails', () => {
  it('blocks Apex program creation while locked to Meridian', () => {
    const intent = detectCrossTenantWriteIntent({
      activeClientKey: 'meridian',
      activeClientName: 'Meridian Health System',
      message: 'create this same program for Apex Retail and use the Apex CIO as sponsor',
    });

    expect(intent).toMatchObject({
      activeClientKey: 'meridian',
      requestedClientKey: 'apexretail',
    });
    expect(formatCrossTenantWriteRefusal(intent!)).toContain('No record was created');
  });

  it('blocks common Apex typo in cross-tenant write requests', () => {
    const intent = detectCrossTenantWriteIntent({
      activeClientKey: 'meridian',
      activeClientName: 'Meridian Health System',
      message: 'can you create a record for aopex retail with the Apex CIO',
    });

    expect(intent).toMatchObject({
      activeClientKey: 'meridian',
      requestedClientKey: 'apexretail',
    });
  });

  it('does not block same-tenant origination', () => {
    expect(
      detectCrossTenantWriteIntent({
        activeClientKey: 'meridian',
        activeClientName: 'Meridian Health System',
        message: 'create this same program for Meridian and use the CIO as sponsor',
      }),
    ).toBeNull();
  });

  it('does not block read-only comparison phrasing without write intent', () => {
    expect(
      detectCrossTenantWriteIntent({
        activeClientKey: 'meridian',
        activeClientName: 'Meridian Health System',
        message: 'how is this different from Apex Retail?',
      }),
    ).toBeNull();
  });
});
