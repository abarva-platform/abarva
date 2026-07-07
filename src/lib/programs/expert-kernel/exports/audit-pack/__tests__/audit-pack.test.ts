import {
  buildMoveAuditPack,
  renderMoveAuditPackHtml,
} from '../index';
import type { MoveBusinessCaseInput } from '../../../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../../function-identity';

const GENERATED_ON = '2026-06-01';

const RETAIL_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  tenant_key: 'apexretail',
  tenant_name: 'Apex Retail',
  name: 'Reduce store labor overage without hurting service levels',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'workforce_labor' },
  baseline_metrics: [
    {
      metric_name: 'Schedule adherence',
      value: 83,
      unit: 'percent',
      source: 'Workforce management baseline',
      as_of: '2026-05-01',
    },
  ],
};

const UNBOUND_MOVE: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  tenant_key: 'apexretail',
  tenant_name: 'Apex Retail',
  name: 'Unclassified local workflow idea',
  charter: {},
  baseline_metrics: [],
};

describe('buildMoveAuditPack', () => {
  it('builds all ten required audit sections for a bound Move', () => {
    const pack = buildMoveAuditPack(RETAIL_MOVE, GENERATED_ON);
    expect(pack.bound).toBe(true);
    expect(pack.sections.map((section) => section.title)).toEqual([
      'Move charter',
      'Business case',
      'Diagnose evidence',
      'Design decisions and dissent log',
      'Gate evidence per phase',
      'Vendor SOW and BAA chain',
      'AI Governance attestation',
      'Realized vs projected',
      'Pattern matches with corpus citations',
      'Peer-source citations',
    ]);
    expect(pack.sections).toHaveLength(10);
    expect(pack.evidenceCount).toBeGreaterThan(0);
    expect(pack.gapCount).toBeGreaterThan(0);
  });

  it('surfaces missing contract, governance, and realized-value records as explicit gaps', () => {
    const pack = buildMoveAuditPack(RETAIL_MOVE, GENERATED_ON);
    const gaps = pack.sections.flatMap((section) => section.gaps).join('\n');
    expect(gaps).toContain('Vendor SOW terms are not bound');
    expect(gaps).toContain('AI Governance Council attestation is not bound');
    expect(gaps).toContain('Realized value ledger is not bound');
  });

  it('renders a self-contained HTML audit pack', () => {
    const html = renderMoveAuditPackHtml(RETAIL_MOVE, GENERATED_ON);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Per-Move Audit Pack');
    expect(html).toContain('Reduce store labor overage');
    expect(html).toContain('Vendor SOW and BAA chain');
    expect(html).toContain('Pattern matches with corpus citations');
  });

  it('is deterministic for the same Move and date', () => {
    const a = renderMoveAuditPackHtml(RETAIL_MOVE, GENERATED_ON);
    const b = renderMoveAuditPackHtml(RETAIL_MOVE, GENERATED_ON);
    expect(a).toBe(b);
  });

  it('renders an honest unbound pack instead of fabricating a business case', () => {
    const pack = buildMoveAuditPack(UNBOUND_MOVE, GENERATED_ON);
    expect(pack.bound).toBe(false);
    if (!pack.bound) {
      expect(pack.unboundReason).toContain('curated Domain Function Pack');
      expect(pack.sections).toHaveLength(10);
      expect(pack.sections.slice(1).every((section) => section.status === 'blocked')).toBe(true);
    }
    const html = renderMoveAuditPackHtml(UNBOUND_MOVE, GENERATED_ON);
    expect(html).toContain('NOT RUN');
    expect(html).toContain('curated Domain Function Pack');
  });
});
