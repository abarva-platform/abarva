// AUD2 - Unified Audit Event Read Model tests.
//
// Deterministic, file-pure suite for the AUD2 read model. No network
// calls, no model providers, no migrations, no time-of-day dependence.

import {
  DECISION_BEARING_EVENT_TYPES,
  EVIDENCE_USING_EVENT_TYPES,
  STATE_CHANGE_EVENT_TYPES,
  UNIFIED_AUDIT_ACTOR_KINDS,
  UNIFIED_AUDIT_AGENTS,
  UNIFIED_AUDIT_EVENT_TYPES,
  buildUnifiedAuditEventSeed,
  getAuditEventsByTrace,
  getAuditEventsByType,
  getAuditEventsByWorkObject,
  summarizeUnifiedAuditEvents,
  validateAuditEvent,
  type UnifiedAuditEvent,
  type UnifiedAuditEventType,
} from '@/lib/architecture/unified-audit-events';

// ---------------------------------------------------------------------
// Determinism + shape
// ---------------------------------------------------------------------

describe('buildUnifiedAuditEventSeed · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildUnifiedAuditEventSeed());
    const second = JSON.stringify(buildUnifiedAuditEventSeed());
    const third = JSON.stringify(buildUnifiedAuditEventSeed());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('returns at least 30 seed events', () => {
    expect(buildUnifiedAuditEventSeed().length).toBeGreaterThanOrEqual(30);
  });

  it('every event is tagged createdFrom: deterministic_unified_audit_seed', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      expect(event.createdFrom).toBe('deterministic_unified_audit_seed');
    }
  });

  it('every event id is unique and prefixed audit-seed-', () => {
    const events = buildUnifiedAuditEventSeed();
    const ids = events.map((event) => event.id);
    expect(new Set(ids).size).toBe(events.length);
    for (const id of ids) {
      expect(id.startsWith('audit-seed-')).toBe(true);
    }
  });

  it('every traceId is prefixed trace-seed-', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      expect(event.traceId.startsWith('trace-seed-')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Event-type coverage
// ---------------------------------------------------------------------

describe('buildUnifiedAuditEventSeed · event type coverage', () => {
  it('canonical event-type tuple is in canonical order with 15 entries', () => {
    expect(UNIFIED_AUDIT_EVENT_TYPES).toEqual([
      'agent_recommendation',
      'agent_handoff',
      'evidence_used',
      'evidence_blocked',
      'tool_invocation',
      'model_gateway_decision',
      'gate_check',
      'gate_transition',
      'deliverable_generated',
      'deliverable_approved',
      'deliverable_superseded',
      'user_action',
      'readiness_update',
      'route_smoke_result',
      'governance_decision',
    ]);
    expect(UNIFIED_AUDIT_EVENT_TYPES.length).toBe(15);
  });

  it('every canonical event type is covered by at least one seed event', () => {
    const events = buildUnifiedAuditEventSeed();
    for (const eventType of UNIFIED_AUDIT_EVENT_TYPES) {
      const matching = events.filter((event) => event.eventType === eventType);
      expect(matching.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all 3 actor kinds are represented', () => {
    const events = buildUnifiedAuditEventSeed();
    const kinds = new Set(events.map((event) => event.actor.kind));
    for (const kind of UNIFIED_AUDIT_ACTOR_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
  });

  it('all 4 agents appear in events that have an agent', () => {
    const events = buildUnifiedAuditEventSeed();
    const agents = new Set(events.map((event) => event.agent).filter(Boolean));
    for (const agent of UNIFIED_AUDIT_AGENTS) {
      expect(agents.has(agent)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-event invariants
// ---------------------------------------------------------------------

describe('buildUnifiedAuditEventSeed · per-event invariants', () => {
  it('every event has non-empty traceId, tenantKey, workObject.id', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      expect(event.traceId.length).toBeGreaterThan(0);
      expect(event.tenantKey.length).toBeGreaterThan(0);
      expect(event.workObject.id.length).toBeGreaterThan(0);
      expect(event.workObject.label.length).toBeGreaterThan(0);
      expect(event.workObject.kind.length).toBeGreaterThan(0);
    }
  });

  it('every event carries immutable: true', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      expect(event.immutable).toBe(true);
    }
  });

  it('every event carries an allowed timestampSource', () => {
    const allowed = new Set<UnifiedAuditEvent['timestampSource']>([
      'monotonic_clock',
      'persisted_event_time',
    ]);
    for (const event of buildUnifiedAuditEventSeed()) {
      expect(allowed.has(event.timestampSource)).toBe(true);
    }
  });

  it('evidence-using event types have non-null evidenceBasis with non-empty rationale', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      if (!EVIDENCE_USING_EVENT_TYPES.includes(event.eventType)) continue;
      expect(event.evidenceBasis).not.toBeNull();
      expect(typeof event.evidenceBasis?.rationale).toBe('string');
      expect((event.evidenceBasis?.rationale ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('decision-bearing event types have non-null, non-empty decisionRationale', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      if (!DECISION_BEARING_EVENT_TYPES.includes(event.eventType)) continue;
      expect(event.decisionRationale).not.toBeNull();
      expect((event.decisionRationale ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('state-change event types have non-null beforeAfter with at least one fieldsChanged', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      if (!STATE_CHANGE_EVENT_TYPES.includes(event.eventType)) continue;
      expect(event.beforeAfter).not.toBeNull();
      expect((event.beforeAfter?.fieldsChanged ?? []).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

describe('validateAuditEvent', () => {
  const sampleValid = (): UnifiedAuditEvent => ({
    id: 'audit-seed-test-1',
    tenantKey: 'acme',
    actor: { kind: 'agent', id: 'sentinel' },
    agent: 'sentinel',
    workObject: { kind: 'pattern', id: 'pilot-purgatory', label: 'Pilot purgatory' },
    eventType: 'tool_invocation',
    beforeAfter: null,
    evidenceBasis: null,
    missingInputs: [],
    decisionRationale: null,
    traceId: 'trace-seed-test-1',
    timestampSource: 'monotonic_clock',
    immutable: true,
    createdFrom: 'deterministic_unified_audit_seed',
  });

  it('every seed event passes validation', () => {
    for (const event of buildUnifiedAuditEventSeed()) {
      const result = validateAuditEvent(event);
      expect(result.reasons).toEqual([]);
      expect(result.isValid).toBe(true);
    }
  });

  it('rejects events missing tenantKey', () => {
    const event = { ...sampleValid(), tenantKey: '' };
    const result = validateAuditEvent(event);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('tenantKey'))).toBe(true);
  });

  it('rejects events missing traceId', () => {
    const event = { ...sampleValid(), traceId: '' };
    const result = validateAuditEvent(event);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('traceId'))).toBe(true);
  });

  it('rejects evidence-using event types without evidenceBasis', () => {
    const event: UnifiedAuditEvent = {
      ...sampleValid(),
      eventType: 'evidence_used',
      evidenceBasis: null,
    };
    const result = validateAuditEvent(event);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('evidenceBasis'))).toBe(true);
  });

  it('rejects decision-bearing event types without decisionRationale', () => {
    const event: UnifiedAuditEvent = {
      ...sampleValid(),
      eventType: 'agent_recommendation',
      decisionRationale: null,
      evidenceBasis: { evidenceIds: ['e1'], rationale: 'because' },
    };
    const result = validateAuditEvent(event);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('decisionRationale'))).toBe(true);
  });

  it('rejects state-change event types without beforeAfter', () => {
    const event: UnifiedAuditEvent = {
      ...sampleValid(),
      eventType: 'gate_transition',
      beforeAfter: null,
      decisionRationale: 'decision recorded',
    };
    const result = validateAuditEvent(event);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('beforeAfter'))).toBe(true);
  });

  it('rejects state-change event types with empty fieldsChanged', () => {
    const event: UnifiedAuditEvent = {
      ...sampleValid(),
      eventType: 'readiness_update',
      beforeAfter: { before: {}, after: {}, fieldsChanged: [] },
    };
    const result = validateAuditEvent(event);
    expect(result.isValid).toBe(false);
    expect(result.reasons.some((r) => r.includes('fieldsChanged'))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeUnifiedAuditEvents', () => {
  it('totalEvents matches input length', () => {
    const events = buildUnifiedAuditEventSeed();
    const summary = summarizeUnifiedAuditEvents(events);
    expect(summary.totalEvents).toBe(events.length);
  });

  it('byEventType reconciles to totalEvents', () => {
    const summary = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    const sum = (Object.values(summary.byEventType) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(summary.totalEvents);
  });

  it('byActorKind reconciles to totalEvents', () => {
    const summary = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    const sum = (Object.values(summary.byActorKind) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(summary.totalEvents);
  });

  it('byAgent only counts events with an agent and never exceeds totalEvents', () => {
    const events = buildUnifiedAuditEventSeed();
    const summary = summarizeUnifiedAuditEvents(events);
    const sum = (Object.values(summary.byAgent) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    const eventsWithAgent = events.filter((event) => Boolean(event.agent)).length;
    expect(sum).toBe(eventsWithAgent);
    expect(sum).toBeLessThanOrEqual(summary.totalEvents);
  });

  it('exposes every canonical event type key on byEventType', () => {
    const summary = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    for (const eventType of UNIFIED_AUDIT_EVENT_TYPES) {
      expect(typeof summary.byEventType[eventType]).toBe('number');
    }
  });

  it('exposes every canonical actor kind key on byActorKind', () => {
    const summary = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    for (const kind of UNIFIED_AUDIT_ACTOR_KINDS) {
      expect(typeof summary.byActorKind[kind]).toBe('number');
    }
  });

  it('exposes every canonical agent key on byAgent', () => {
    const summary = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    for (const agent of UNIFIED_AUDIT_AGENTS) {
      expect(typeof summary.byAgent[agent]).toBe('number');
    }
  });

  it('uniqueTenants and uniqueTraceIds are sorted and deduplicated', () => {
    const summary = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    const sortedTenants = [...summary.uniqueTenants].sort();
    expect(summary.uniqueTenants).toEqual(sortedTenants);
    expect(new Set(summary.uniqueTenants).size).toBe(summary.uniqueTenants.length);
    const sortedTraces = [...summary.uniqueTraceIds].sort();
    expect(summary.uniqueTraceIds).toEqual(sortedTraces);
    expect(new Set(summary.uniqueTraceIds).size).toBe(summary.uniqueTraceIds.length);
  });

  it('eventsWithEvidenceBasis equals number of events with non-null evidenceBasis', () => {
    const events = buildUnifiedAuditEventSeed();
    const summary = summarizeUnifiedAuditEvents(events);
    const expected = events.filter((event) => event.evidenceBasis !== null).length;
    expect(summary.eventsWithEvidenceBasis).toBe(expected);
  });

  it('eventsWithBeforeAfter equals number of events with non-null beforeAfter', () => {
    const events = buildUnifiedAuditEventSeed();
    const summary = summarizeUnifiedAuditEvents(events);
    const expected = events.filter((event) => event.beforeAfter !== null).length;
    expect(summary.eventsWithBeforeAfter).toBe(expected);
  });

  it('defaults to summarizing the canonical seed when called with no arguments', () => {
    const explicit = summarizeUnifiedAuditEvents(buildUnifiedAuditEventSeed());
    const implicit = summarizeUnifiedAuditEvents();
    expect(JSON.stringify(implicit)).toBe(JSON.stringify(explicit));
  });
});

// ---------------------------------------------------------------------
// Helper partitioning
// ---------------------------------------------------------------------

describe('getAuditEventsByType / getAuditEventsByWorkObject / getAuditEventsByTrace', () => {
  it('getAuditEventsByType returns only events whose eventType matches', () => {
    for (const eventType of UNIFIED_AUDIT_EVENT_TYPES) {
      for (const event of getAuditEventsByType(eventType)) {
        expect(event.eventType).toBe(eventType);
      }
    }
  });

  it('getAuditEventsByWorkObject returns only events for the matching workObject id', () => {
    const events = buildUnifiedAuditEventSeed();
    const target = events[0].workObject.id;
    const filtered = getAuditEventsByWorkObject(target);
    expect(filtered.length).toBeGreaterThan(0);
    for (const event of filtered) {
      expect(event.workObject.id).toBe(target);
    }
  });

  it('getAuditEventsByTrace returns only events for the matching trace id', () => {
    const events = buildUnifiedAuditEventSeed();
    const target = events[0].traceId;
    const filtered = getAuditEventsByTrace(target);
    expect(filtered.length).toBeGreaterThan(0);
    for (const event of filtered) {
      expect(event.traceId).toBe(target);
    }
  });

  it('helpers default to the canonical seed when called with no events argument', () => {
    const eventType: UnifiedAuditEventType = 'agent_recommendation';
    const explicit = getAuditEventsByType(eventType, buildUnifiedAuditEventSeed());
    const implicit = getAuditEventsByType(eventType);
    expect(implicit.length).toBe(explicit.length);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · unified-audit-events.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/unified-audit-events.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth / Supabase runtime', () => {
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

  it('does not invent dollar amounts', () => {
    const serialized = JSON.stringify(buildUnifiedAuditEventSeed());
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not invent live runtime claims', () => {
    const serialized = JSON.stringify(buildUnifiedAuditEventSeed());
    // No live citations of branded vendors
    expect(serialized).not.toMatch(/openai/i);
    expect(serialized).not.toMatch(/anthropic/i);
    expect(serialized).not.toMatch(/cohere/i);
    expect(serialized).not.toMatch(/databricks/i);
  });
});
