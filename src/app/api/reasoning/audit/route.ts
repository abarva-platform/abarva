// GET /api/reasoning/audit
// Aggregates entries from the three in-memory reasoning stores:
//   1. Gate waivers   — waiverStore in /api/reasoning/gate-waiver/route.ts
//   2. Contradiction resolutions — getResolvedEntries() from contradiction-resolution-state
//   3. Synthesis feedback — getRecentSynthesisEvents() filtered to events with feedback
//
// Returns AuditEntry[] sorted by timestamp descending.
// Pre-seeded with 5–8 demo entries so the page is never empty.

import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';

export const dynamic = 'force-dynamic';

// ─── Shared waiver store ──────────────────────────────────────────────────────
// The gate-waiver route owns this Map; we re-export a reference so the audit
// route can read it without duplicating state. The gate-waiver module is
// imported here purely for its side effect of registering the Map in the
// module cache — both routes share the same module singleton at runtime.
//
// Because Next.js bundles each route file separately for Edge/Node, we keep a
// module-level Map in THIS file too as a write target. Gate-waiver POSTs also
// call `recordWaiver` (exported below) to push into this shared buffer.
//
// For the demo this is fine: both are Node.js server processes sharing the
// same V8 heap. The audit page reads both the gate-waiver buffer exported
// here AND the pre-seed below.

interface WaiverRecord {
  instanceId: string;
  criterionId: string;
  reason: string;
  waivedAt: string;
}

// Module-level store — populated by the gate-waiver route via `recordWaiver`.
export const waiverAuditBuffer: WaiverRecord[] = [];

export function recordWaiver(record: WaiverRecord): void {
  waiverAuditBuffer.push(record);
}

/** Clear the waiver audit buffer — used by the demo-reset endpoint. */
export function clearWaiverAuditBuffer(): void {
  waiverAuditBuffer.length = 0;
}

// ─── AuditEntry type ─────────────────────────────────────────────────────────

export type AuditEntryType =
  | 'gate_waiver'
  | 'contradiction_resolved'
  | 'synthesis_feedback';

export interface AuditEntry {
  id: string;
  type: AuditEntryType;
  actor: string;
  instanceId: string;
  detail: string;
  timestamp: string;
}

// ─── Demo pre-seed ────────────────────────────────────────────────────────────
// Timestamps spread across the past 48 h so the page is never empty.
// These entries are appended once at module-load time and never change.

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

const DEMO_ENTRIES: AuditEntry[] = [
  {
    id: 'audit_demo_01',
    type: 'gate_waiver',
    actor: 'demo-user',
    instanceId: 'contact-center-ai',
    detail: 'Gate criterion "pilot-nps-threshold" waived — NPS data delayed by vendor',
    timestamp: hoursAgo(2),
  },
  {
    id: 'audit_demo_02',
    type: 'contradiction_resolved',
    actor: 'demo-user',
    instanceId: 'demand-forecasting',
    detail: 'Contradiction "conflicting-scope-signals" marked resolved',
    timestamp: hoursAgo(5),
  },
  {
    id: 'audit_demo_03',
    type: 'synthesis_feedback',
    actor: 'demo-user',
    instanceId: 'cdp-implementation',
    detail: 'Synthesis feedback: thumbs-up on synthesis event tlm_demo_03',
    timestamp: hoursAgo(8),
  },
  {
    id: 'audit_demo_04',
    type: 'gate_waiver',
    actor: 'demo-user',
    instanceId: 'store-assoc-productivity',
    detail: 'Gate criterion "security-review-sign-off" waived — expedited for Prat demo',
    timestamp: hoursAgo(14),
  },
  {
    id: 'audit_demo_05',
    type: 'contradiction_resolved',
    actor: 'demo-user',
    instanceId: 'contact-center-ai',
    detail: 'Contradiction "timeline-velocity-mismatch" marked resolved',
    timestamp: hoursAgo(22),
  },
  {
    id: 'audit_demo_06',
    type: 'synthesis_feedback',
    actor: 'demo-user',
    instanceId: 'demand-forecasting',
    detail: 'Synthesis feedback: thumbs-down on synthesis event tlm_demo_06',
    timestamp: hoursAgo(31),
  },
  {
    id: 'audit_demo_07',
    type: 'gate_waiver',
    actor: 'demo-user',
    instanceId: 'cdp-implementation',
    detail: 'Gate criterion "data-governance-approval" waived — governance board on recess',
    timestamp: hoursAgo(40),
  },
  {
    id: 'audit_demo_08',
    type: 'contradiction_resolved',
    actor: 'demo-user',
    instanceId: 'store-assoc-productivity',
    detail: 'Contradiction "resource-constraint-conflict" marked resolved',
    timestamp: hoursAgo(47),
  },
];

// ─── Aggregation ──────────────────────────────────────────────────────────────

function buildLiveEntries(): AuditEntry[] {
  const entries: AuditEntry[] = [];

  // 1. Gate waivers from the live buffer
  for (const w of waiverAuditBuffer) {
    entries.push({
      id: `waiver::${w.instanceId}::${w.criterionId}`,
      type: 'gate_waiver',
      actor: 'demo-user',
      instanceId: w.instanceId,
      detail: `Gate criterion "${w.criterionId}" waived — ${w.reason}`,
      timestamp: w.waivedAt,
    });
  }

  // 2. Contradiction resolutions
  for (const r of getResolvedEntries()) {
    // Convention: id is `{instanceId}::{templateId}` or bare templateId
    const parts = r.id.split('::');
    const instanceId = parts.length >= 2 ? parts[0] : 'unknown';
    const templateId = parts.length >= 2 ? parts.slice(1).join('::') : r.id;
    entries.push({
      id: `resolved::${r.id}`,
      type: 'contradiction_resolved',
      actor: 'demo-user',
      instanceId,
      detail: `Contradiction "${templateId}" marked resolved`,
      timestamp: r.resolvedAt,
    });
  }

  // 3. Synthesis feedback signals
  const feedbackEvents = getRecentSynthesisEvents(500).filter(
    (e) => e.feedback !== undefined,
  );
  for (const e of feedbackEvents) {
    entries.push({
      id: `feedback::${e.id}`,
      type: 'synthesis_feedback',
      actor: 'demo-user',
      instanceId: e.instanceId,
      detail: `Synthesis feedback: thumbs-${e.feedback} on synthesis event ${e.id}`,
      timestamp: e.feedbackTimestamp ?? e.timestamp,
    });
  }

  return entries;
}

function idSet(entries: AuditEntry[]): Set<string> {
  return new Set(entries.map((e) => e.id));
}

function mergeWithDemo(live: AuditEntry[]): AuditEntry[] {
  const liveIds = idSet(live);
  const demo = DEMO_ENTRIES.filter((d) => !liveIds.has(d.id));
  return [...live, ...demo].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(): Promise<Response> {
  const live = buildLiveEntries();
  const merged = mergeWithDemo(live);
  return jsonResponse(merged);
}
