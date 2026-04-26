// TOOL3 - Tool Invocation Audit Read Model tests.
//
// Deterministic, file-pure suite. No model providers, no network, no
// live tool execution. Mirrors the TOOL2 test conventions.

import {
  TOOL_INVOCATION_ACTORS,
  TOOL_INVOCATION_DECISIONS,
  buildToolInvocationAuditSeed,
  getBlockedToolInvocations,
  getToolInvocationsByAgent,
  summarizeToolInvocationAudits,
  validateToolInvocationAudit,
  type ToolInvocationActor,
  type ToolInvocationAuditRecord,
  type ToolInvocationDecision,
  type ToolInvocationRisk,
  type ToolInvocationScope,
} from '@/lib/architecture/tool-invocation-audit';
import { listAgentTools } from '@/lib/architecture/tool-registry-mvp';

const ALL_DECISIONS: readonly ToolInvocationDecision[] = TOOL_INVOCATION_DECISIONS;
const ALL_ACTORS: readonly ToolInvocationActor[] = TOOL_INVOCATION_ACTORS;
const ALL_RISKS: readonly ToolInvocationRisk[] = ['low', 'medium', 'high', 'critical'];
const ALL_SCOPES: readonly ToolInvocationScope[] = ['platform', 'tenant', 'workspace'];

// ---------------------------------------------------------------------
// Determinism + canonical shape.
// ---------------------------------------------------------------------

describe('buildToolInvocationAuditSeed · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildToolInvocationAuditSeed());
    const second = JSON.stringify(buildToolInvocationAuditSeed());
    const third = JSON.stringify(buildToolInvocationAuditSeed());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('every record carries createdFrom: deterministic_tool_invocation_audit_seed', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      expect(record.createdFrom).toBe('deterministic_tool_invocation_audit_seed');
    }
  });

  it('record ids are unique and follow tool-audit-seed-{n} shape', () => {
    const ids = buildToolInvocationAuditSeed().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^tool-audit-seed-\d+$/);
    }
  });

  it('audit event ids are unique and follow audit-event-seed-{n} shape', () => {
    const auditIds = buildToolInvocationAuditSeed().map((r) => r.auditEventId);
    expect(new Set(auditIds).size).toBe(auditIds.length);
    for (const auditId of auditIds) {
      expect(auditId).toMatch(/^audit-event-seed-\d+$/);
    }
  });
});

// ---------------------------------------------------------------------
// Coverage: 24+ records, all decisions, all actors, all 16 tool ids.
// ---------------------------------------------------------------------

describe('seed coverage', () => {
  it('contains at least 24 records', () => {
    expect(buildToolInvocationAuditSeed().length).toBeGreaterThanOrEqual(24);
  });

  it('covers all 7 decisions with at least 2 records each', () => {
    const seed = buildToolInvocationAuditSeed();
    for (const decision of ALL_DECISIONS) {
      const count = seed.filter((r) => r.decision === decision).length;
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it('represents all 6 actors at least once', () => {
    const seed = buildToolInvocationAuditSeed();
    for (const actor of ALL_ACTORS) {
      const count = seed.filter((r) => r.actor === actor).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all 16 canonical TOOL2 tool ids at least once', () => {
    const seed = buildToolInvocationAuditSeed();
    const seenToolIds = new Set(seed.map((r) => r.toolId));
    const canonicalToolIds = new Set(listAgentTools().map((t) => t.id));
    expect(canonicalToolIds.size).toBe(16);
    for (const toolId of canonicalToolIds) {
      expect(seenToolIds.has(toolId)).toBe(true);
    }
  });

  it('every toolId in the seed is a registered canonical TOOL2 tool', () => {
    const canonicalToolIds = new Set(listAgentTools().map((t) => t.id));
    for (const record of buildToolInvocationAuditSeed()) {
      expect(canonicalToolIds.has(record.toolId)).toBe(true);
    }
  });

  it('records appear at every scope (platform, tenant, workspace)', () => {
    const seed = buildToolInvocationAuditSeed();
    for (const scope of ALL_SCOPES) {
      const count = seed.filter((r) => r.scope === scope).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('contains at least 4 records at high or critical risk', () => {
    const seed = buildToolInvocationAuditSeed();
    const escalated = seed.filter(
      (r) => r.riskLevel === 'high' || r.riskLevel === 'critical',
    );
    expect(escalated.length).toBeGreaterThanOrEqual(4);
  });

  it('includes at least one record per risk level', () => {
    const seed = buildToolInvocationAuditSeed();
    for (const risk of ALL_RISKS) {
      const count = seed.filter((r) => r.riskLevel === risk).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------
// Per-record invariants.
// ---------------------------------------------------------------------

describe('per-record invariants', () => {
  it('every blocked record has a non-empty blockedReason', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      if (record.decision === 'blocked') {
        expect(record.blockedReason).toBeDefined();
        expect((record.blockedReason ?? '').trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every deferred record has a non-empty deferredReason', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      if (record.decision === 'deferred') {
        expect(record.deferredReason).toBeDefined();
        expect((record.deferredReason ?? '').trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every failed record has a non-empty failureReason', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      if (record.decision === 'failed') {
        expect(record.failureReason).toBeDefined();
        expect((record.failureReason ?? '').trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every write-shaped tool invocation has a non-null evidenceBasis', () => {
    const writeShapedToolIds = new Set(
      listAgentTools()
        .filter((t) => t.readWriteMode === 'write' || t.readWriteMode === 'export')
        .map((t) => t.id),
    );
    for (const record of buildToolInvocationAuditSeed()) {
      if (writeShapedToolIds.has(record.toolId)) {
        expect(record.evidenceBasis).not.toBeNull();
        expect(record.evidenceBasis?.evidenceIds.length ?? 0).toBeGreaterThan(0);
        expect((record.evidenceBasis?.rationale ?? '').trim().length).toBeGreaterThan(0);
        expect((record.evidenceBasis?.policyReferenceKey ?? '').trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every record has a non-empty tenantKey', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      expect(record.tenantKey.trim().length).toBeGreaterThan(0);
    }
  });

  it('every record has a non-empty policyMatched in the canonical shape', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      expect(record.policyMatched.trim().length).toBeGreaterThan(0);
      expect(record.policyMatched).toMatch(/^tool_registry\.v1\.[a-z_]+\.audit_required$/);
    }
  });

  it('every record has a non-empty auditEventId', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      expect(record.auditEventId.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// validateToolInvocationAudit.
// ---------------------------------------------------------------------

describe('validateToolInvocationAudit', () => {
  function baseValidRecord(): ToolInvocationAuditRecord {
    return {
      id: 'tool-audit-seed-1',
      toolId: 'tool.search_vector.v1',
      actor: 'nexus',
      tenantKey: 'acme',
      scope: 'tenant',
      decision: 'allowed',
      riskLevel: 'low',
      evidenceBasis: null,
      auditEventId: 'audit-event-seed-1',
      policyMatched: 'tool_registry.v1.search_vector.audit_required',
      createdFrom: 'deterministic_tool_invocation_audit_seed',
    };
  }

  it('validates every seed record', () => {
    for (const record of buildToolInvocationAuditSeed()) {
      const result = validateToolInvocationAudit(record);
      expect(result.isValid).toBe(true);
      expect(result.reasons).toEqual([]);
    }
  });

  it('rejects an empty tenantKey', () => {
    const record: ToolInvocationAuditRecord = { ...baseValidRecord(), tenantKey: '' };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('tenantkey'))).toBe(true);
  });

  it('rejects whitespace-only tenantKey', () => {
    const record: ToolInvocationAuditRecord = { ...baseValidRecord(), tenantKey: '   ' };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
  });

  it('rejects blocked decision without blockedReason', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      decision: 'blocked',
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('blockedReason'))).toBe(true);
  });

  it('rejects deferred decision without deferredReason', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      decision: 'deferred',
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('deferredReason'))).toBe(true);
  });

  it('rejects failed decision without failureReason', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      decision: 'failed',
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('failureReason'))).toBe(true);
  });

  it('rejects a write-shaped tool with null evidenceBasis', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      toolId: 'tool.write_program_action.v1',
      actor: 'steward',
      decision: 'completed',
      riskLevel: 'high',
      evidenceBasis: null,
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('evidenceBasis'))).toBe(true);
  });

  it('rejects a write-shaped tool with empty evidenceBasis.evidenceIds', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      toolId: 'tool.write_program_action.v1',
      actor: 'steward',
      decision: 'completed',
      riskLevel: 'high',
      evidenceBasis: {
        evidenceIds: [],
        rationale: 'Steward write with no evidence basis at all.',
        policyReferenceKey: 'tool_registry.v1.write_program_action.audit_required',
      },
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('evidenceIds'))).toBe(true);
  });

  it('accepts a read-shaped tool with null evidenceBasis', () => {
    const record: ToolInvocationAuditRecord = baseValidRecord();
    expect(validateToolInvocationAudit(record).isValid).toBe(true);
  });

  it('rejects an id that does not match the canonical shape', () => {
    const record: ToolInvocationAuditRecord = { ...baseValidRecord(), id: 'wrong-id' };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('id does not match'))).toBe(true);
  });

  it('rejects a toolId that does not match the canonical shape', () => {
    const record: ToolInvocationAuditRecord = { ...baseValidRecord(), toolId: 'not-a-tool' };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('toolid'))).toBe(true);
  });

  it('rejects an unknown actor', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      actor: 'rogue_actor' as unknown as ToolInvocationActor,
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('actor'))).toBe(true);
  });

  it('rejects an unknown decision', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      decision: 'maybe' as unknown as ToolInvocationDecision,
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('decision'))).toBe(true);
  });

  it('rejects an empty auditEventId', () => {
    const record: ToolInvocationAuditRecord = { ...baseValidRecord(), auditEventId: '' };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
  });

  it('rejects an empty policyMatched', () => {
    const record: ToolInvocationAuditRecord = { ...baseValidRecord(), policyMatched: '' };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
  });

  it('rejects a wrong createdFrom sentinel', () => {
    const record: ToolInvocationAuditRecord = {
      ...baseValidRecord(),
      createdFrom:
        'wrong_sentinel' as unknown as 'deterministic_tool_invocation_audit_seed',
    };
    const result = validateToolInvocationAudit(record);
    expect(result.isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------
// summarizeToolInvocationAudits.
// ---------------------------------------------------------------------

describe('summarizeToolInvocationAudits', () => {
  it('totals reconcile to the seed length', () => {
    const summary = summarizeToolInvocationAudits();
    const seed = buildToolInvocationAuditSeed();
    expect(summary.totalRecords).toBe(seed.length);

    const decisionTotal = ALL_DECISIONS.reduce((acc, d) => acc + summary.byDecision[d], 0);
    const actorTotal = ALL_ACTORS.reduce((acc, a) => acc + summary.byActor[a], 0);
    const riskTotal = ALL_RISKS.reduce((acc, r) => acc + summary.byRisk[r], 0);
    expect(decisionTotal).toBe(seed.length);
    expect(actorTotal).toBe(seed.length);
    expect(riskTotal).toBe(seed.length);
  });

  it('blockedCount matches byDecision.blocked', () => {
    const summary = summarizeToolInvocationAudits();
    expect(summary.blockedCount).toBe(summary.byDecision.blocked);
  });

  it('failedCount matches byDecision.failed', () => {
    const summary = summarizeToolInvocationAudits();
    expect(summary.failedCount).toBe(summary.byDecision.failed);
  });

  it('uniqueTools contains at least 16 distinct tool ids', () => {
    const summary = summarizeToolInvocationAudits();
    expect(summary.uniqueTools.length).toBeGreaterThanOrEqual(16);
  });

  it('uniqueTools is sorted ascending', () => {
    const summary = summarizeToolInvocationAudits();
    const sorted = [...summary.uniqueTools].sort();
    expect(summary.uniqueTools).toEqual(sorted);
  });

  it('uniqueTenants is sorted ascending and de-duplicated', () => {
    const summary = summarizeToolInvocationAudits();
    expect(new Set(summary.uniqueTenants).size).toBe(summary.uniqueTenants.length);
    const sorted = [...summary.uniqueTenants].sort();
    expect(summary.uniqueTenants).toEqual(sorted);
  });

  it('returns a zero-counted summary on an empty input list', () => {
    const summary = summarizeToolInvocationAudits([]);
    expect(summary.totalRecords).toBe(0);
    expect(summary.blockedCount).toBe(0);
    expect(summary.failedCount).toBe(0);
    expect(summary.uniqueTools).toEqual([]);
    expect(summary.uniqueTenants).toEqual([]);
    for (const decision of ALL_DECISIONS) {
      expect(summary.byDecision[decision]).toBe(0);
    }
    for (const actor of ALL_ACTORS) {
      expect(summary.byActor[actor]).toBe(0);
    }
    for (const risk of ALL_RISKS) {
      expect(summary.byRisk[risk]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------
// Filter helpers.
// ---------------------------------------------------------------------

describe('getBlockedToolInvocations', () => {
  it('returns only blocked records', () => {
    const blocked = getBlockedToolInvocations();
    expect(blocked.length).toBeGreaterThanOrEqual(2);
    for (const record of blocked) {
      expect(record.decision).toBe('blocked');
    }
  });

  it('count matches summary.blockedCount', () => {
    const blocked = getBlockedToolInvocations();
    const summary = summarizeToolInvocationAudits();
    expect(blocked.length).toBe(summary.blockedCount);
  });
});

describe('getToolInvocationsByAgent', () => {
  it('returns only records for the requested actor', () => {
    for (const actor of ALL_ACTORS) {
      const subset = getToolInvocationsByAgent(actor);
      for (const record of subset) {
        expect(record.actor).toBe(actor);
      }
    }
  });

  it('partitions the seed without loss', () => {
    const seed = buildToolInvocationAuditSeed();
    const recovered = ALL_ACTORS.flatMap((actor) => [...getToolInvocationsByAgent(actor)]);
    expect(recovered.length).toBe(seed.length);
  });
});

// ---------------------------------------------------------------------
// Module hygiene + no-execution evidence.
// ---------------------------------------------------------------------

describe('module hygiene · tool-invocation-audit.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/tool-invocation-audit.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('does not actually execute any tool: no await, no shell, no fs writes', () => {
    expect(codeOnly).not.toMatch(/\bawait\b/);
    expect(codeOnly).not.toMatch(/writeFile/);
    expect(codeOnly).not.toMatch(/appendFile/);
    expect(codeOnly).not.toMatch(/createWriteStream/);
    expect(codeOnly).not.toMatch(/child_process/);
    expect(codeOnly).not.toMatch(/\bspawn\(/);
    expect(codeOnly).not.toMatch(/\bexec\(/);
    expect(codeOnly).not.toMatch(/execSync/);
  });
});

// ---------------------------------------------------------------------
// Type-shape sanity.
// ---------------------------------------------------------------------

describe('type-shape sanity', () => {
  it('a ToolInvocationAuditRecord can be constructed from a seed entry', () => {
    const records: readonly ToolInvocationAuditRecord[] = buildToolInvocationAuditSeed();
    const first = records[0];
    expect(typeof first.id).toBe('string');
    expect(typeof first.toolId).toBe('string');
    expect(typeof first.actor).toBe('string');
  });

  it('TOOL_INVOCATION_DECISIONS contains the canonical 7 decisions in canonical order', () => {
    expect(TOOL_INVOCATION_DECISIONS).toEqual([
      'proposed',
      'allowed',
      'blocked',
      'deferred',
      'completed',
      'failed',
      'dismissed',
    ]);
  });

  it('TOOL_INVOCATION_ACTORS contains the canonical 6 actors in canonical order', () => {
    expect(TOOL_INVOCATION_ACTORS).toEqual([
      'nexus',
      'sentinel',
      'atlas',
      'steward',
      'system',
      'admin',
    ]);
  });
});
