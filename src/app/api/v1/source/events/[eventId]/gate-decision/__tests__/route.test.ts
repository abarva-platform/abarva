// Gate-decision route proof: assess → Maestro decision → persist approval artifact;
// enforces the rationale-on-gaps hard rule (422); returns assessment + resolved + id.
const tenancy = { clientId: 'c1', clientKey: 'skyharbor-air', userId: 'maestro' };
let persisted: ApprovalLike | null = null;
interface ApprovalLike { id: string }

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not tenancy'); }),
}));
jest.mock('@/lib/source/stage-gate/approval-artifact', () => ({
  persistApprovalArtifact: jest.fn(async () => { persisted = { id: 'appr-1' }; return persisted; }),
}));

import { POST } from '../route';
import { getAmsStageGate } from '@/lib/source/stage-gate/ams-stage-gates';

function req(body: unknown): import('next/server').NextRequest {
  return { json: async () => body } as unknown as import('next/server').NextRequest;
}
function params(eventId: string) { return { params: Promise.resolve({ eventId }) }; }

// the two minimum-viable keys for rfp_design (leaves recommended gaps → ready_with_gaps)
const mvKeys = getAmsStageGate('rfp_design')!.requirements.filter((r) => r.tier === 'minimum_viable').map((r) => r.key);

beforeEach(() => { persisted = null; });

describe('POST gate-decision', () => {
  it('400 on unknown stage', async () => {
    const res = await POST(req({ stageKey: 'nope', action: 'approve' }), params('evt-1'));
    expect(res.status).toBe(400);
  });

  it('422 when approving with gaps without a rationale (hard rule)', async () => {
    const res = await POST(req({ stageKey: 'rfp_design', satisfiedRequirementKeys: mvKeys, action: 'approve_with_gaps' }), params('evt-1'));
    expect(res.status).toBe(422);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBe('invalid_decision');
    expect(String(json.detail)).toMatch(/rationale/i);
    expect(persisted).toBeNull(); // nothing persisted on a rejected decision
  });

  it('200 + persists approval artifact when override has a rationale', async () => {
    const res = await POST(req({ stageKey: 'rfp_design', satisfiedRequirementKeys: mvKeys, action: 'approve_with_gaps', rationale: 'Exec deadline; finalize weights in parallel.' }), params('evt-1'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect((json.resolved as Record<string, unknown>).gateStatus).toBe('maestro_override_approved');
    expect((json.resolved as Record<string, unknown>).allowIssueReady).toBe(false);
    expect(json.approvalArtifactId).toBe('appr-1');
    expect((json.guidance as Record<string, unknown>).verdict).toBe('Ready with gaps');
  });

  it('clean approve (all satisfied) → ready + issue-ready allowed', async () => {
    const all = getAmsStageGate('rfp_design')!.requirements.map((r) => r.key);
    const res = await POST(req({ stageKey: 'rfp_design', satisfiedRequirementKeys: all, action: 'approve' }), params('evt-1'));
    const json = (await res.json()) as Record<string, unknown>;
    expect((json.resolved as Record<string, unknown>).gateStatus).toBe('ready');
    expect((json.resolved as Record<string, unknown>).allowIssueReady).toBe(true);
  });
});
