// GET  /api/reasoning/demo-scenarios  — returns available scenario descriptors
// POST /api/reasoning/demo-scenarios  — body: { scenarioId: string }
//                                      executes the named scenario by mutating
//                                      in-memory reasoning + stage state.
//
// Three pre-built scenarios:
//   green-path  — advance AMS event to BAFO, waive all unmet gates, clear all contradictions
//   red-alert   — set AMS event back to RFI stage, activate 3+ contradictions
//   mid-review  — set AMS event to RFP stage, waive 2 gates, leave 2 unmet

import { clearWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { clearResolved, markResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { setStageOverride } from '@/lib/source/stage-overrides';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScenarioDescriptor {
  id: string;
  name: string;
  description: string;
  /** High-level bullet list of what the scenario sets up. */
  actions: string[];
}

// ─── Scenario registry ────────────────────────────────────────────────────────

const AMS_EVENT_ID = 'apex-retail-ams-outsourcing-2026';

// All BAFO-stage gate criteria that the green-path scenario should waive.
const BAFO_GATE_IDS = [
  'GATE-AMS-BAFO-01',
  'GATE-AMS-BAFO-02',
  'GATE-AMS-BAFO-03',
  'GATE-AMS-BAFO-04',
] as const;

// RFP-stage gate criteria (two waived, two left unmet for mid-review).
const RFP_GATE_IDS_WAIVED = ['GATE-AMS-SHL-01', 'GATE-AMS-SHL-02'] as const;

// AMS contradiction template IDs used across scenarios.
const ALL_AMS_CONTRADICTION_IDS = [
  'CON-AMS-001',
  'CON-AMS-002',
  'CON-AMS-003',
  'CON-AMS-004',
  'CON-AMS-005',
] as const;

// Three contradictions surfaced for red-alert (high severity first).
const RED_ALERT_ACTIVE_IDS = ['CON-AMS-001', 'CON-AMS-003', 'CON-AMS-005'] as const;

const SCENARIOS: readonly ScenarioDescriptor[] = [
  {
    id: 'green-path',
    name: 'Green path',
    description: 'Everything healthy — BAFO stage, all gates waived, no active contradictions.',
    actions: [
      'Set AMS event to orals_bafo stage',
      'Waive all 4 BAFO gate criteria',
      'Resolve all 5 AMS contradiction templates',
    ],
  },
  {
    id: 'red-alert',
    name: 'Red alert',
    description: 'Portfolio health critical — RFI stage, 3 high-severity contradictions active.',
    actions: [
      'Set AMS event back to rfp_rfi_package stage',
      'Clear all gate waivers',
      'Clear all contradiction resolutions',
      'Leave CON-AMS-001, CON-AMS-003, CON-AMS-005 active (unresolved)',
    ],
  },
  {
    id: 'mid-review',
    name: 'Mid-review',
    description: 'Realistic mid-cycle state — RFP stage, 2 gates waived, 2 unmet, 1 contradiction.',
    actions: [
      'Set AMS event to vendor_responses stage',
      'Waive GATE-AMS-SHL-01 and GATE-AMS-SHL-02',
      'Leave GATE-AMS-SHL-03 and GATE-AMS-RFI-03 unmet',
      'Resolve CON-AMS-001, CON-AMS-002, CON-AMS-004, CON-AMS-005 (leave CON-AMS-003 active)',
    ],
  },
] as const;

// ─── Scenario executors ───────────────────────────────────────────────────────

// In-memory waiver store mutated directly to avoid a round-trip HTTP call.
// We re-use the same Map that the gate-waiver route manages, by calling the
// exported POST-equivalent logic inline.
//
// Because we can't import the private Map, we call the public POST handler
// by constructing a synthetic Request object.
async function applyWaiver(criterionId: string): Promise<void> {
  const body = JSON.stringify({
    type: 'gate_waiver',
    criterionId,
    instanceId: AMS_EVENT_ID,
    reason: 'Demo scenario preset',
  });
  const req = new Request('http://localhost/api/reasoning/gate-waiver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  // Import inline to avoid a circular dependency at module scope.
  const { POST } = await import('@/app/api/reasoning/gate-waiver/route');
  await POST(req);
}

async function runGreenPath(): Promise<void> {
  // 1. Reset state to a clean slate first.
  clearWaivers();
  clearResolved();

  // 2. Advance stage to orals_bafo (matches BAFO in the lifecycle pattern).
  setStageOverride(AMS_EVENT_ID, 'orals_bafo');

  // 3. Waive all BAFO gate criteria.
  for (const gateId of BAFO_GATE_IDS) {
    await applyWaiver(gateId);
  }

  // 4. Resolve every AMS contradiction template.
  for (const cid of ALL_AMS_CONTRADICTION_IDS) {
    markResolved(cid);
  }
}

async function runRedAlert(): Promise<void> {
  // 1. Clear all waivers and resolved contradictions so the bad state is visible.
  clearWaivers();
  clearResolved();

  // 2. Roll stage back to rfp_rfi_package (matches RFI in the lifecycle pattern).
  setStageOverride(AMS_EVENT_ID, 'rfp_rfi_package');

  // Leaving RED_ALERT_ACTIVE_IDS unresolved — they will surface as active
  // contradictions in the portfolio health view.
  // Resolve only the two that are NOT part of the red-alert set so the rest
  // remain active and the count reads ≥ 3.
  const notActive = ALL_AMS_CONTRADICTION_IDS.filter(
    (id) => !(RED_ALERT_ACTIVE_IDS as readonly string[]).includes(id),
  );
  for (const cid of notActive) {
    markResolved(cid);
  }
}

async function runMidReview(): Promise<void> {
  // 1. Reset waivers and resolutions for a deterministic baseline.
  clearWaivers();
  clearResolved();

  // 2. Set stage to vendor_responses (sits between RFI and RFP in the display layer,
  //    corresponding to the RFP stage in the lifecycle pattern stage history).
  setStageOverride(AMS_EVENT_ID, 'vendor_responses');

  // 3. Waive two RFP-prerequisite gates.
  for (const gateId of RFP_GATE_IDS_WAIVED) {
    await applyWaiver(gateId);
  }

  // 4. Leave GATE-AMS-SHL-03 and GATE-AMS-RFI-03 unwaived (unmet) — no action needed.

  // 5. Resolve four contradictions; leave CON-AMS-003 active.
  const toResolve = ALL_AMS_CONTRADICTION_IDS.filter((id) => id !== 'CON-AMS-003');
  for (const cid of toResolve) {
    markResolved(cid);
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** GET — returns the scenario catalog (no side effects). */
export async function GET(): Promise<Response> {
  return jsonResponse({ scenarios: SCENARIOS }, 200);
}

/** POST — executes the requested scenario. */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'body must be an object' }, 400);
  }

  const { scenarioId } = body as { scenarioId?: unknown };

  if (typeof scenarioId !== 'string' || scenarioId.length === 0) {
    return jsonResponse({ error: 'scenarioId is required' }, 400);
  }

  try {
    switch (scenarioId) {
      case 'green-path':
        await runGreenPath();
        break;
      case 'red-alert':
        await runRedAlert();
        break;
      case 'mid-review':
        await runMidReview();
        break;
      default:
        return jsonResponse(
          {
            error: 'unknown_scenario',
            detail: `No scenario with id "${scenarioId}". Valid ids: ${SCENARIOS.map((s) => s.id).join(', ')}`,
          },
          400,
        );
    }
  } catch (err) {
    console.error('[POST /api/reasoning/demo-scenarios]', err);
    return jsonResponse({ error: 'internal_error' }, 500);
  }

  const descriptor = SCENARIOS.find((s) => s.id === scenarioId);
  return jsonResponse({ ok: true, scenarioId, name: descriptor?.name }, 200);
}

// Export the scenario list for use by the panel component (avoids a runtime fetch
// on first render — the panel also calls the GET endpoint for dynamic refreshes).
export { SCENARIOS };
