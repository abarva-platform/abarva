/**
 * ADMIN-DATA2 — Adapter contracts + types + fixture mode tests.
 *
 * Covers the 9 admin adapter modules under `src/lib/admin/data/`.
 * All adapters default to fixture mode; live mode throws
 * `AdminDataMigrationPendingError` until DATA10 lands.
 */

import {
  AdminDataMigrationPendingError,
  getAdminDataMode,
  isFixtureMode,
} from '@/lib/admin/data/admin-data-mode';
import {
  getAdminOverviewSnapshot,
  getAdminOverviewFixture,
} from '@/lib/admin/data/admin-overview-adapter';
import {
  getAdminUsers,
  getAdminUserDetail,
  getAdminInvites,
  getAdminRoleSummary,
  getAdminRoleMatrix,
  getAdminUsersFixture,
} from '@/lib/admin/data/admin-users-adapter';
import {
  getAdminConnectors,
  getAdminConnectorById,
  getAdminConnectorDetail,
  getAdminConnectorPilotBlockers,
  getAdminConnectorsFixture,
} from '@/lib/admin/data/admin-connectors-adapter';
import {
  getAdminDatasets,
  getAdminDatasetsByRung,
  getAdminDatasetById,
  getAdminDatasetDetail,
  getAdminDatasetApprovals,
  getAdminDatasetQuality,
  getAdminDatasetQualityScores,
  getAdminLoadedFiles,
  getAdminDatasetsFixture,
} from '@/lib/admin/data/admin-datasets-adapter';
import {
  getAdminBlockers,
  getAdminBlockerById,
  getAdminBlockerDetail,
  getAdminCriticalBlockers,
  getAdminBlockersFixture,
} from '@/lib/admin/data/admin-blockers-adapter';
import {
  getAdminAuditEvents,
  getAdminAuditLog,
  getAdminAuditEvent,
  getAdminAuditEventsFixture,
} from '@/lib/admin/data/admin-audit-log-adapter';
import {
  getAdminSetupProgress,
  getAdminSetupProgressFixture,
} from '@/lib/admin/data/admin-setup-progress-adapter';
import {
  getAdminAgentReadiness,
  getAdminAgentReadinessFixture,
} from '@/lib/admin/data/admin-agent-readiness-adapter';
import {
  getAdminProductionReadiness,
  getAdminProductionReadinessSnapshot,
  getAdminProductionReadinessFixture,
} from '@/lib/admin/data/admin-production-readiness-adapter';

const APEX = 'apex-retail';
const MERIDIAN = 'meridian';
const UNKNOWN = 'unknown-tenant';

describe('ADMIN-DATA2 · admin-data-mode', () => {
  const ORIGINAL_MODE = process.env.ADMIN_DATA_MODE;

  afterEach(() => {
    if (ORIGINAL_MODE === undefined) {
      delete process.env.ADMIN_DATA_MODE;
    } else {
      process.env.ADMIN_DATA_MODE = ORIGINAL_MODE;
    }
  });

  it('defaults ADMIN_DATA_MODE to fixture when env is unset', () => {
    delete process.env.ADMIN_DATA_MODE;
    expect(getAdminDataMode()).toBe('fixture');
    expect(isFixtureMode()).toBe(true);
  });

  it('returns fixture for unrecognized values', () => {
    process.env.ADMIN_DATA_MODE = 'bogus';
    expect(getAdminDataMode()).toBe('fixture');
  });

  it('returns live when ADMIN_DATA_MODE=live', () => {
    process.env.ADMIN_DATA_MODE = 'live';
    expect(getAdminDataMode()).toBe('live');
    expect(isFixtureMode()).toBe(false);
  });

  it('AdminDataMigrationPendingError has table + slice metadata', () => {
    const err = new AdminDataMigrationPendingError('admin_connectors');
    expect(err.name).toBe('AdminDataMigrationPendingError');
    expect(err.tableName).toBe('admin_connectors');
    expect(err.migrationSlice).toBe('ADMIN-DATA10');
    expect(err.message).toContain('admin_connectors');
  });

  it('AdminDataMigrationPendingError accepts custom slice', () => {
    const err = new AdminDataMigrationPendingError('foo', 'ADMIN-DATA42');
    expect(err.migrationSlice).toBe('ADMIN-DATA42');
  });

  it('live mode throws AdminDataMigrationPendingError from a representative adapter', async () => {
    process.env.ADMIN_DATA_MODE = 'live';
    await expect(getAdminConnectors(APEX)).rejects.toBeInstanceOf(
      AdminDataMigrationPendingError,
    );
  });
});

describe('ADMIN-DATA2 · admin-overview-adapter', () => {
  it('returns a snapshot for apex-retail', async () => {
    const snap = await getAdminOverviewSnapshot(APEX);
    expect(snap.tenant.slug).toBe(APEX);
    expect(snap.tenant.name).toBe('Apex Retail');
    expect(snap.setupSteps.length).toBeGreaterThan(0);
    expect(snap.recentActivity.length).toBeGreaterThan(0);
  });

  it('exposes cross-page counts as numbers', async () => {
    const snap = await getAdminOverviewSnapshot(APEX);
    expect(typeof snap.crossPageCounts.openBlockers).toBe('number');
    expect(typeof snap.crossPageCounts.datasetsPendingApproval).toBe('number');
    expect(typeof snap.crossPageCounts.connectorsNotConfigured).toBe('number');
    expect(typeof snap.crossPageCounts.invitesPending).toBe('number');
    expect(typeof snap.crossPageCounts.productionReadinessGatesFailing).toBe('number');
  });

  it('open blockers count matches blockers fixture (open status)', async () => {
    const snap = await getAdminOverviewSnapshot(APEX);
    const blockers = await getAdminBlockers(APEX);
    const openCount = blockers.filter((b) => b.status === 'open' || b.status === 'in_progress').length;
    expect(snap.crossPageCounts.openBlockers).toBe(openCount);
  });

  it('connectorsNotConfigured matches connectors fixture', async () => {
    const snap = await getAdminOverviewSnapshot(APEX);
    const connectors = await getAdminConnectors(APEX);
    const expected = connectors.filter((c) => c.status === 'not_configured').length;
    expect(snap.crossPageCounts.connectorsNotConfigured).toBe(expected);
  });

  it('returns empty setup steps for unknown tenants', async () => {
    const snap = await getAdminOverviewSnapshot(UNKNOWN);
    expect(snap.setupSteps).toEqual([]);
  });

  it('sync fixture helper returns snapshot synchronously', () => {
    const snap = getAdminOverviewFixture(APEX);
    expect(snap.tenant.slug).toBe(APEX);
  });
});

describe('ADMIN-DATA2 · admin-users-adapter', () => {
  it('returns 7 apex users', async () => {
    const users = await getAdminUsers(APEX);
    expect(users.length).toBe(7);
  });

  it('every user has required fields', async () => {
    const users = await getAdminUsers(APEX);
    for (const u of users) {
      expect(u.id).toBeDefined();
      expect(u.email).toMatch(/@/);
      expect(u.displayName).toBeDefined();
      expect(['maestro', 'client_viewer', 'observer']).toContain(u.primaryRole);
      expect(['active', 'invited', 'suspended']).toContain(u.status);
    }
  });

  it('returns user detail with permissions and recent activity', async () => {
    const detail = await getAdminUserDetail(APEX, 'usr_001');
    expect(detail).not.toBeNull();
    expect(detail!.permissions.length).toBeGreaterThan(0);
    expect(detail!.recentActivity.length).toBeGreaterThan(0);
  });

  it('returns null for unknown user id', async () => {
    expect(await getAdminUserDetail(APEX, 'nope')).toBeNull();
  });

  it('returns null for unknown tenant', async () => {
    expect(await getAdminUserDetail(UNKNOWN, 'usr_001')).toBeNull();
  });

  it('returns 3 invites for apex-retail', async () => {
    const invites = await getAdminInvites(APEX);
    expect(invites.length).toBe(3);
    expect(invites.filter((i) => i.status === 'pending').length).toBe(2);
    expect(invites.filter((i) => i.status === 'expired').length).toBe(1);
  });

  it('returns 6 role summaries for apex-retail', async () => {
    const summary = await getAdminRoleSummary(APEX);
    expect(summary.length).toBe(6);
    const ids = summary.map((s) => s.roleId);
    expect(ids).toContain('platform_admin');
    expect(ids).toContain('maestro');
    expect(ids).toContain('observer');
  });

  it('getAdminRoleMatrix is an alias of getAdminRoleSummary', async () => {
    const a = await getAdminRoleSummary(APEX);
    const b = await getAdminRoleMatrix(APEX);
    expect(a).toEqual(b);
  });

  it('returns empty list for unknown tenants', async () => {
    expect(await getAdminUsers(UNKNOWN)).toEqual([]);
    expect(await getAdminInvites(UNKNOWN)).toEqual([]);
    expect(await getAdminRoleSummary(UNKNOWN)).toEqual([]);
  });

  it('sync fixture helper returns rows synchronously', () => {
    expect(getAdminUsersFixture(APEX).length).toBe(7);
  });
});

describe('ADMIN-DATA2 · admin-connectors-adapter', () => {
  it('returns 6 connectors for apex-retail', async () => {
    const connectors = await getAdminConnectors(APEX);
    expect(connectors.length).toBe(6);
  });

  it('returns 2 connectors for meridian', async () => {
    const connectors = await getAdminConnectors(MERIDIAN);
    expect(connectors.length).toBe(2);
  });

  it('returns empty for unknown tenant', async () => {
    expect(await getAdminConnectors(UNKNOWN)).toEqual([]);
  });

  it('every connector has tenantSlug + status + steward guidance', async () => {
    const connectors = await getAdminConnectors(APEX);
    for (const c of connectors) {
      expect(c.tenantSlug).toBe(APEX);
      expect(['not_configured', 'configured_stub', 'blocked', 'deferred', 'active']).toContain(c.status);
      expect(c.stewardGuidance).toBeTruthy();
    }
  });

  it('preserves the configured_stub status for the contract management connector', async () => {
    const connector = await getAdminConnectorById(APEX, 'conn-apex-contract-mgmt');
    expect(connector?.status).toBe('configured_stub');
    expect(connector?.requiredForPilot).toBe(true);
  });

  it('preserves the not_configured status for the ERP connector', async () => {
    const connector = await getAdminConnectorById(APEX, 'conn-apex-erp');
    expect(connector?.status).toBe('not_configured');
    expect(connector?.blockerReason).toContain('ERP API credentials');
  });

  it('returns null for unknown connector id', async () => {
    expect(await getAdminConnectorById(APEX, 'nope')).toBeNull();
  });

  it('returns connector detail with config schema and sync attempts', async () => {
    const detail = await getAdminConnectorDetail(APEX, 'conn-apex-identity');
    expect(detail).not.toBeNull();
    expect(detail!.configSchema).not.toBeNull();
    expect(detail!.recentSyncAttempts.length).toBeGreaterThan(0);
    expect(detail!.healthTrend.length).toBeGreaterThan(0);
  });

  it('returns null detail for unknown connector', async () => {
    expect(await getAdminConnectorDetail(APEX, 'nope')).toBeNull();
  });

  it('lists pilot blockers (required_for_pilot && not configured_stub/active)', async () => {
    const blockers = await getAdminConnectorPilotBlockers(APEX);
    for (const b of blockers) {
      expect(b.requiredForPilot).toBe(true);
      expect(b.status).not.toBe('configured_stub');
      expect(b.status).not.toBe('active');
    }
  });

  it('sync fixture helper returns connectors', () => {
    expect(getAdminConnectorsFixture(APEX).length).toBe(6);
  });
});

describe('ADMIN-DATA2 · admin-datasets-adapter', () => {
  it('returns 15 datasets for apex-retail', async () => {
    const datasets = await getAdminDatasets(APEX);
    expect(datasets.length).toBe(15);
  });

  it('groups datasets by rung with the expected counts', async () => {
    const byRung = await getAdminDatasetsByRung(APEX);
    expect(byRung.loaded.length).toBe(3);
    expect(byRung.available.length).toBe(4);
    expect(byRung.usable.length).toBe(3);
    expect(byRung.agent_usable.length).toBe(3);
    expect(byRung.decision_grade.length).toBe(2);
  });

  it('returns empty buckets for unknown tenant', async () => {
    const byRung = await getAdminDatasetsByRung(UNKNOWN);
    expect(byRung.loaded).toEqual([]);
    expect(byRung.decision_grade).toEqual([]);
  });

  it('returns dataset by id', async () => {
    const ds = await getAdminDatasetById(APEX, 'apex_outcome_lock_v1');
    expect(ds?.rung).toBe('decision_grade');
    expect(ds?.approvalState).toBe('approved');
  });

  it('returns null for unknown dataset id', async () => {
    expect(await getAdminDatasetById(APEX, 'nope')).toBeNull();
  });

  it('returns dataset detail with provenance', async () => {
    const detail = await getAdminDatasetDetail(APEX, 'apex_outcome_lock_v1');
    expect(detail).not.toBeNull();
    expect(detail!.provenance.length).toBeGreaterThan(0);
    expect(detail!.approvalOwner).toContain('Sundaram');
  });

  it('filters approvals by status', async () => {
    const all = await getAdminDatasetApprovals(APEX);
    const pending = await getAdminDatasetApprovals(APEX, 'pending');
    const approved = await getAdminDatasetApprovals(APEX, 'approved');
    const rejected = await getAdminDatasetApprovals(APEX, 'rejected');
    expect(all.length).toBe(pending.length + approved.length + rejected.length);
    for (const r of pending) expect(r.status).toBe('pending');
  });

  it('returns dataset quality score for known dataset', async () => {
    const q = await getAdminDatasetQuality(APEX, 'apex_outcome_lock_v1');
    expect(q).not.toBeNull();
    expect(q!.datasetId).toBe('apex_outcome_lock_v1');
    expect(q!.overall).toBeGreaterThanOrEqual(0);
    expect(q!.overall).toBeLessThanOrEqual(100);
  });

  it('returns null quality score for unknown dataset', async () => {
    expect(await getAdminDatasetQuality(APEX, 'nope')).toBeNull();
  });

  it('returns quality scores for all datasets', async () => {
    const all = await getAdminDatasets(APEX);
    const scores = await getAdminDatasetQualityScores(APEX);
    expect(scores.length).toBe(all.length);
  });

  it('returns 10 loaded files for apex-retail', async () => {
    const files = await getAdminLoadedFiles(APEX);
    expect(files.length).toBe(10);
    const statuses = files.map((f) => f.status);
    expect(statuses).toContain('approved');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('missing');
  });

  it('returns empty datasets/files for unknown tenant', async () => {
    expect(await getAdminDatasets(UNKNOWN)).toEqual([]);
    expect(await getAdminLoadedFiles(UNKNOWN)).toEqual([]);
    expect(await getAdminDatasetApprovals(UNKNOWN)).toEqual([]);
  });

  it('sync fixture helper returns datasets', () => {
    expect(getAdminDatasetsFixture(APEX).length).toBe(15);
  });
});

describe('ADMIN-DATA2 · admin-blockers-adapter', () => {
  it('returns 4 blockers for apex-retail', async () => {
    const blockers = await getAdminBlockers(APEX);
    expect(blockers.length).toBe(4);
  });

  it('all blockers carry pilot/production impact flags', async () => {
    const blockers = await getAdminBlockers(APEX);
    for (const b of blockers) {
      expect(typeof b.pilotImpact).toBe('boolean');
      expect(typeof b.productionImpact).toBe('boolean');
      expect(b.unblockSteps.length).toBeGreaterThan(0);
    }
  });

  it('filters blockers by status', async () => {
    const open = await getAdminBlockers(APEX, 'open');
    expect(open.length).toBeGreaterThan(0);
    for (const b of open) expect(b.status).toBe('open');
  });

  it('returns null for unknown blocker id', async () => {
    expect(await getAdminBlockerById(APEX, 'nope')).toBeNull();
    expect(await getAdminBlockerDetail(APEX, 'nope')).toBeNull();
  });

  it('returns critical blockers only', async () => {
    const critical = await getAdminCriticalBlockers(APEX);
    for (const b of critical) expect(b.severity).toBe('critical');
  });

  it('preserves the blk-apex-001 evidence-upload blocker shape', async () => {
    const b = await getAdminBlockerById(APEX, 'blk-apex-001');
    expect(b?.severity).toBe('critical');
    expect(b?.affectedScope).toBe('pilot');
    expect(b?.ownerAgent).toBe('engineering');
  });

  it('returns empty array for unknown tenant', async () => {
    expect(await getAdminBlockers(UNKNOWN)).toEqual([]);
    expect(await getAdminCriticalBlockers(UNKNOWN)).toEqual([]);
  });

  it('sync fixture helper returns blockers', () => {
    expect(getAdminBlockersFixture(APEX).length).toBe(4);
  });
});

describe('ADMIN-DATA2 · admin-audit-log-adapter', () => {
  it('returns 20 events for apex-retail', async () => {
    const events = await getAdminAuditEvents(APEX);
    expect(events.length).toBe(20);
  });

  it('respects limit option', async () => {
    const events = await getAdminAuditEvents(APEX, { limit: 5 });
    expect(events.length).toBe(5);
  });

  it('filters by category', async () => {
    const approvals = await getAdminAuditEvents(APEX, { category: 'approval' });
    for (const e of approvals) expect(e.category).toBe('approval');
  });

  it('filters by since timestamp', async () => {
    const cutoff = '2026-04-22T00:00:00.000Z';
    const events = await getAdminAuditEvents(APEX, { since: cutoff });
    for (const e of events) {
      expect(Date.parse(e.createdAt)).toBeGreaterThanOrEqual(Date.parse(cutoff));
    }
  });

  it('getAdminAuditLog is an alias for getAdminAuditEvents', async () => {
    const a = await getAdminAuditEvents(APEX, { limit: 3 });
    const b = await getAdminAuditLog(APEX, { limit: 3 });
    expect(a).toEqual(b);
  });

  it('returns specific event by id', async () => {
    const event = await getAdminAuditEvent(APEX, 'a1');
    expect(event?.action).toBe('approved_decision_grade');
  });

  it('returns null for unknown event id', async () => {
    expect(await getAdminAuditEvent(APEX, 'nope')).toBeNull();
  });

  it('returns empty events for unknown tenant', async () => {
    expect(await getAdminAuditEvents(UNKNOWN)).toEqual([]);
  });

  it('sync fixture helper returns events', () => {
    expect(getAdminAuditEventsFixture(APEX).length).toBe(20);
  });
});

describe('ADMIN-DATA2 · admin-setup-progress-adapter', () => {
  it('returns 6 setup steps for apex-retail', async () => {
    const steps = await getAdminSetupProgress(APEX);
    expect(steps.length).toBe(6);
  });

  it('all 6 expected canonical step ids present', async () => {
    const steps = await getAdminSetupProgress(APEX);
    const ids = steps.map((s) => s.id).sort();
    expect(ids).toEqual(
      ['agent_readiness', 'architecture', 'connectors', 'data_trust', 'production_readiness', 'users_access'].sort(),
    );
  });

  it('every step has done|in_progress|pending status', async () => {
    const steps = await getAdminSetupProgress(APEX);
    for (const s of steps) {
      expect(['done', 'in_progress', 'pending']).toContain(s.status);
    }
  });

  it('returns empty for unknown tenant', async () => {
    expect(await getAdminSetupProgress(UNKNOWN)).toEqual([]);
  });

  it('sync fixture helper returns steps', () => {
    expect(getAdminSetupProgressFixture(APEX).length).toBe(6);
  });
});

describe('ADMIN-DATA2 · admin-agent-readiness-adapter', () => {
  it('returns top-gap entries for all 4 agents', async () => {
    const snap = await getAdminAgentReadiness(APEX);
    expect(snap.agents.length).toBe(4);
    const ids = snap.agents.map((a) => a.agentId).sort();
    expect(ids).toEqual(['atlas', 'nexus', 'sentinel', 'steward']);
  });

  it('returns 4×5 = 20 coverage cells', async () => {
    const snap = await getAdminAgentReadiness(APEX);
    expect(snap.coverageMatrix.length).toBe(20);
  });

  it('every coverage cell carries note + level', async () => {
    const snap = await getAdminAgentReadiness(APEX);
    for (const c of snap.coverageMatrix) {
      expect(c.note).toBeTruthy();
      expect(['decision_grade', 'partial', 'thin', 'none', 'full', 'absent']).toContain(c.level);
    }
  });

  it('returns empty matrix for unknown tenants', async () => {
    const snap = await getAdminAgentReadiness(UNKNOWN);
    expect(snap.agents).toEqual([]);
    expect(snap.coverageMatrix).toEqual([]);
  });

  it('sync fixture helper returns snapshot', () => {
    expect(getAdminAgentReadinessFixture(APEX).agents.length).toBe(4);
  });
});

describe('ADMIN-DATA2 · admin-production-readiness-adapter', () => {
  it('returns 3 tiles (demo/pilot/production)', async () => {
    const snap = await getAdminProductionReadiness(APEX);
    expect(snap.tiles.length).toBe(3);
    const scopes = snap.tiles.map((t) => t.scope).sort();
    expect(scopes).toEqual(['demo', 'pilot', 'production']);
  });

  it('demo tile is ready, production tile is blocked', async () => {
    const snap = await getAdminProductionReadiness(APEX);
    const demo = snap.tiles.find((t) => t.scope === 'demo');
    const prod = snap.tiles.find((t) => t.scope === 'production');
    expect(demo?.status).toBe('ready');
    expect(prod?.status).toBe('blocked');
  });

  it('snapshot includes blockers and history', async () => {
    const snap = await getAdminProductionReadiness(APEX);
    expect(snap.blockers.length).toBeGreaterThan(0);
    expect(snap.history.length).toBeGreaterThan(0);
  });

  it('snapshot for unknown tenant has empty fields', async () => {
    const snap = await getAdminProductionReadiness(UNKNOWN);
    expect(snap.tiles).toEqual([]);
    expect(snap.blockers).toEqual([]);
    expect(snap.history).toEqual([]);
  });

  it('getAdminProductionReadinessSnapshot is an alias', async () => {
    const a = await getAdminProductionReadiness(APEX);
    const b = await getAdminProductionReadinessSnapshot(APEX);
    expect(a).toEqual(b);
  });

  it('sync fixture helper returns snapshot', () => {
    expect(getAdminProductionReadinessFixture(APEX).tiles.length).toBe(3);
  });
});

describe('ADMIN-DATA2 · fixture parity (lifts existing seeds)', () => {
  it('connectors fixture preserves SAP S/4HANA vendor for ERP', async () => {
    const c = await getAdminConnectorById(APEX, 'conn-apex-erp');
    expect(c?.vendor).toContain('SAP');
  });

  it('connectors fixture preserves Coupa vendor for spend analytics', async () => {
    const c = await getAdminConnectorById(APEX, 'conn-apex-spend-analytics');
    expect(c?.vendor).toContain('Coupa');
  });

  it('connectors fixture preserves Icertis vendor for contract management', async () => {
    const c = await getAdminConnectorById(APEX, 'conn-apex-contract-mgmt');
    expect(c?.vendor).toContain('Icertis');
  });

  it('users fixture preserves Anand Sundaram as platform admin', async () => {
    const detail = await getAdminUserDetail(APEX, 'usr_001');
    expect(detail?.displayName).toBe('Anand Sundaram');
  });

  it('blockers fixture preserves model gateway as critical/founder', async () => {
    const b = await getAdminBlockerById(APEX, 'blk-apex-002');
    expect(b?.severity).toBe('critical');
    expect(b?.ownerAgent).toBe('founder');
  });

  it('audit-log fixture preserves a1 as approved_decision_grade', async () => {
    const e = await getAdminAuditEvent(APEX, 'a1');
    expect(e?.action).toBe('approved_decision_grade');
    expect(e?.actorDisplayName).toBe('Sundaram');
  });

  it('datasets fixture preserves apex_outcome_lock_v1 as decision_grade', async () => {
    const ds = await getAdminDatasetById(APEX, 'apex_outcome_lock_v1');
    expect(ds?.rung).toBe('decision_grade');
    expect(ds?.approvalState).toBe('approved');
  });

  it('setup-progress fixture preserves connectors as pending', async () => {
    const steps = await getAdminSetupProgress(APEX);
    const connectors = steps.find((s) => s.id === 'connectors');
    expect(connectors?.status).toBe('pending');
  });

  it('production-readiness fixture preserves history strip ordering', async () => {
    const snap = await getAdminProductionReadiness(APEX);
    expect(snap.history[0].at).toBe('2026-04-27');
  });
});
