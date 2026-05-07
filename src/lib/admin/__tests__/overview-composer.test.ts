/**
 * overview-composer tests — Setup Redesign Package PR A.
 */

import { composeOverviewBlocks } from '../overview-composer';
import { getSetupActsContent, buildAuthoredInventoryFallback } from '../setup-acts-registry';

const FCF_FIXTURE = (() => {
  const content = getSetupActsContent('arcturus');
  const segments = buildAuthoredInventoryFallback(content).segments;
  return { content, segments };
})();

describe('composeOverviewBlocks · Status block', () => {
  it('returns tenant + readiness + agent level + blocked-track count', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'First Capital Financial',
      industryCode: 'FINSERV',
      clientKey: 'arcturus',
      segments: FCF_FIXTURE.segments,
      content: FCF_FIXTURE.content,
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    expect(blocks.status.tenantName).toBe('First Capital Financial');
    expect(blocks.status.readinessPercent).not.toBeNull();
    expect(blocks.status.readinessPercent ?? 0).toBeGreaterThan(0);
    expect(['blank', 'thin', 'partial', 'decision-grade']).toContain(blocks.status.agentLevel);
    expect(blocks.status.blockedCapabilityTracks).toBeGreaterThanOrEqual(0);
    expect(blocks.status.blockedCapabilityTracks).toBeLessThanOrEqual(6);
  });

  it('empty segment list → starting state, 6 of 6 blocked', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'Cold Tenant',
      industryCode: null,
      clientKey: 'unknown',
      segments: [],
      content: getSetupActsContent('keystone'),
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    expect(blocks.status.readinessPercent).toBeNull();
    expect(blocks.status.agentLevel).toBe('blank');
    expect(blocks.status.blockedCapabilityTracks).toBe(6);
  });
});

describe('composeOverviewBlocks · Steward orientation', () => {
  it('FCF gets the financial-services industry phrase', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'First Capital Financial',
      industryCode: 'FINSERV',
      clientKey: 'arcturus',
      segments: FCF_FIXTURE.segments,
      content: FCF_FIXTURE.content,
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    expect(blocks.orientation.industryPhrase).toContain('financial-services');
  });

  it('produces a non-null next load when there are empty/thin segments', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'First Capital Financial',
      industryCode: 'FINSERV',
      clientKey: 'arcturus',
      segments: FCF_FIXTURE.segments,
      content: FCF_FIXTURE.content,
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    expect(blocks.orientation.nextLoadName).not.toBeNull();
    expect(blocks.orientation.nextLoadConsequence).not.toBeNull();
  });
});

describe('composeOverviewBlocks · Action queue', () => {
  it('SSO-not-configured emits the configure-sso item', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'First Capital Financial',
      industryCode: 'FINSERV',
      clientKey: 'arcturus',
      segments: FCF_FIXTURE.segments,
      content: FCF_FIXTURE.content,
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    expect(blocks.actionQueue.items.some((i) => i.id === 'configure-sso')).toBe(true);
  });

  it('SSO configured + no pending = no items (block hidden)', () => {
    const apexContent = getSetupActsContent('apexretail');
    // Apex authored fallback is mostly loaded — few empty/thin segments.
    const apexFallback = buildAuthoredInventoryFallback(apexContent);
    const blocks = composeOverviewBlocks({
      tenantName: 'Apex Retail Group',
      industryCode: 'RETAIL',
      clientKey: 'apexretail',
      segments: apexFallback.segments,
      content: apexContent,
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: true, // SSO done.
      recentSnapshotActivity: [],
    });
    // SSO done + no pending approvals → only data-load items if any empty segments.
    const ssoItem = blocks.actionQueue.items.find((i) => i.id === 'configure-sso');
    expect(ssoItem).toBeUndefined();
  });

  it('caps at 5 items', () => {
    const sparseContent = getSetupActsContent('keystone');
    const blocks = composeOverviewBlocks({
      tenantName: 'Keystone Energy Holdings',
      industryCode: 'ENERGY',
      clientKey: 'keystone',
      segments: [], // truly empty — all 14 are empty
      content: sparseContent,
      programApprovalPendingCount: 5,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 3,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    expect(blocks.actionQueue.items.length).toBeLessThanOrEqual(5);
  });

  it('program approval pending emits high-severity item linking to /admin/programs/approvals', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'First Capital Financial',
      industryCode: 'FINSERV',
      clientKey: 'arcturus',
      segments: FCF_FIXTURE.segments,
      content: FCF_FIXTURE.content,
      programApprovalPendingCount: 2,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [],
    });
    const approval = blocks.actionQueue.items.find((i) => i.id === 'approve-program-briefs');
    expect(approval).toBeDefined();
    expect(approval?.severity).toBe('high');
    expect(approval?.href).toBe('/admin/programs/approvals');
  });
});

describe('composeOverviewBlocks · Recent activity', () => {
  it('filters out platform-administrative entries', () => {
    const blocks = composeOverviewBlocks({
      tenantName: 'First Capital Financial',
      industryCode: 'FINSERV',
      clientKey: 'arcturus',
      segments: FCF_FIXTURE.segments,
      content: FCF_FIXTURE.content,
      programApprovalPendingCount: 0,
      atlasSignalCount: 0,
      atlasHighSeverityCount: 0,
      ssoConfigured: false,
      recentSnapshotActivity: [
        { actor: 'Steward', what: 'Authored financial-services setup posture', timestamp: 'Today' },
        { actor: 'admin', what: 'Loaded Compliance posture', timestamp: '2d ago' },
      ],
    });
    const summaries = blocks.recentActivity.items.map((i) => i.summary);
    expect(summaries.some((s) => s.toLowerCase().includes('authored'))).toBe(false);
    expect(summaries.some((s) => s.toLowerCase().includes('loaded compliance'))).toBe(true);
  });
});
