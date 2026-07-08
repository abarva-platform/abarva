import * as fs from 'fs';
import * as path from 'path';
import {
  buildPromotionReviewRequest,
  enterprisePromotionStatus,
  isAutoPromotableToEnterprise,
} from '../enterprise-promotion';

describe('enterprise-promotion guardrail (increment 11)', () => {
  it('status always requires human review and never reports a promoted state', () => {
    const s = enterprisePromotionStatus();
    expect(s.humanReviewRequired).toBe(true);
    expect(s.state).toBe('not_added');
    expect(s.clientLabel.toLowerCase()).toContain('not added yet');
    const r = enterprisePromotionStatus({ reviewRequested: true });
    expect(r.state).toBe('review_requested');
    expect(r.humanReviewRequired).toBe(true);
    // there is no code path that yields a "promoted"/"added" state
    expect(['not_added', 'review_requested']).toContain(r.state);
  });

  it('nothing is ever auto-promotable — even if an object claims eligibility', () => {
    expect(isAutoPromotableToEnterprise({ moveScopedOnly: true, enterprisePromotion: 'not_eligible' })).toBe(false);
    // a spoofed object cannot flip the answer
    expect(isAutoPromotableToEnterprise({ moveScopedOnly: false, enterprisePromotion: 'eligible' })).toBe(false);
  });

  it('a promotion request records intent only (pending review, never approved)', () => {
    const req = buildPromotionReviewRequest({
      moveId: 'm1',
      targetPhase: 3,
      requestedBy: 'p1',
      requestedAt: '2026-07-08T00:00:00.000Z',
    });
    expect(req.status).toBe('pending_review');
    expect(JSON.stringify(req)).not.toMatch(/approved|promoted|enterprise_context_added/);
  });
});

describe('governance source-scan: Move-scoped + no auto-promotion', () => {
  const programsDir = path.join(__dirname, '..', '..'); // src/lib/programs
  const store = fs.readFileSync(path.join(programsDir, 'approved-inputs-pack-store.ts'), 'utf8');

  it('the approved-pack store is Move-scoped on both write and read', () => {
    // write inserts tenant_key + program_id
    expect(store).toMatch(/tenant_key:\s*input\.tenantKey/);
    expect(store).toMatch(/program_id:\s*input\.moveId/);
    // read filters by tenant_key + program_id
    expect(store).toMatch(/\.eq\("tenant_key"/);
    expect(store).toMatch(/\.eq\("program_id"/);
  });

  it('no phase-templates source writes to enterprise/tenant context', () => {
    const dir = path.join(__dirname, '..');
    const offenders: string[] = [];
    for (const name of fs.readdirSync(dir)) {
      if (!/\.ts$/.test(name)) continue;
      const src = fs.readFileSync(path.join(dir, name), 'utf8');
      // No writes to enterprise/tenant-context stores from the deterministic layer.
      if (/enterprise_context|tenant_context|promoteToEnterprise|addToEnterprise/.test(src)) {
        offenders.push(name);
      }
    }
    expect(offenders).toEqual([]);
  });
});
