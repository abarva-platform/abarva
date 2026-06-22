import {
  buildAtlasSynthesisPrompt,
  composeAtlasSynthesisUserMessage,
  type AtlasSynthesisSnapshot,
} from './route';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';
import { loadTenantTowerPortfolio } from '@/lib/reasoning/tenant-tower-portfolio';

describe('Tower Atlas synthesis prompt', () => {
  it('inherits the shared agent output contract', () => {
    const prompt = buildAtlasSynthesisPrompt(
      'USER CONTEXT',
      'ACCESS POLICY',
      'RESTRICTED OUTPUT',
      'DEMO CONTEXT',
    );

    expect(prompt).toContain('AGENT OUTPUT CONTRACT v2026-06-05');
    expect(prompt).toContain('Surface family: tower');
    expect(prompt).toContain('lead-bullets, lead-table, stat-stack, sequential-steps, or brief-narrative');
    expect(prompt).toContain('do not emit raw markdown emphasis markers');
    expect(prompt).toContain('do not show raw pattern, use-case, vendor, database field, or artifact IDs');
    expect(prompt).toContain('Prefer lead-bullets for the Tower quote');
    expect(prompt).toContain('CONSULTANT ANSWER SHAPE');
    expect(prompt).toContain('Read: the direct recommendation or judgment');
    expect(prompt).toContain('Evidence: the specific tenant facts');
    expect(prompt).toContain('Implication: what this means for the executive decision');
    expect(prompt).toContain('Next move: the owner, artifact, gate');
  });
});

describe('composeAtlasSynthesisUserMessage — P0 cross-tenant invariants', () => {
  const emptySnap: AtlasSynthesisSnapshot = {
    programCount: 0,
    sourceEventCount: 0,
    pendingGateCount: 0,
    activeBlockerCount: 0,
    programs: [],
    sourceEvents: [],
  };

  it('uses the tenant display name in the message header — Meridian', () => {
    const msg = composeAtlasSynthesisUserMessage('Meridian Health', emptySnap);
    expect(msg).toContain('Portfolio snapshot for Meridian Health:');
    expect(msg).not.toContain('Apex Retail');
  });

  it('uses the tenant display name in the message header — First Capital', () => {
    const msg = composeAtlasSynthesisUserMessage('First Capital Financial', emptySnap);
    expect(msg).toContain('Portfolio snapshot for First Capital Financial:');
    expect(msg).not.toContain('Apex Retail');
  });

  it('uses the tenant display name in the message header — Apex Retail', () => {
    const msg = composeAtlasSynthesisUserMessage('Apex Retail Group', emptySnap);
    expect(msg).toContain('Portfolio snapshot for Apex Retail Group:');
  });

  it('emits an honest empty-state message when the portfolio is empty — never Apex content', () => {
    const msg = composeAtlasSynthesisUserMessage('Meridian Health', emptySnap);
    expect(msg).toContain('No active programs or source events');
    expect(msg).toContain('Do NOT fabricate');
    expect(msg).not.toContain('APX-');
    expect(msg).not.toContain('SRC-AMS-2026');
  });

  it('snapshot test: Meridian tenant with no portfolio gets Meridian content — never Apex', () => {
    const portfolio = loadTenantTowerPortfolio({ clientKey: 'meridian' });
    const ctx = buildTowerSynthesisContext(
      portfolio.programInstances,
      portfolio.sourceEventInstances,
    );
    const snap = ctx.instanceSnapshot as unknown as AtlasSynthesisSnapshot;
    const msg = composeAtlasSynthesisUserMessage('Meridian Health', snap);

    expect(msg).toContain('Meridian Health');
    expect(msg).not.toContain('Apex Retail');
    expect(msg).not.toContain('APX-CDP-2026');
    expect(msg).not.toContain('SRC-AMS-2026');
  });

  it('snapshot test: First Capital tenant with no portfolio gets First Capital content — never Apex', () => {
    const portfolio = loadTenantTowerPortfolio({ clientKey: 'arcturus' });
    const ctx = buildTowerSynthesisContext(
      portfolio.programInstances,
      portfolio.sourceEventInstances,
    );
    const snap = ctx.instanceSnapshot as unknown as AtlasSynthesisSnapshot;
    const msg = composeAtlasSynthesisUserMessage('First Capital Financial', snap);

    expect(msg).toContain('First Capital Financial');
    expect(msg).not.toContain('Apex Retail');
    expect(msg).not.toContain('APX-CDP-2026');
    expect(msg).not.toContain('SRC-AMS-2026');
  });

  it('snapshot test: unknown tenant gets honest empty — never Apex content as silent default', () => {
    const portfolio = loadTenantTowerPortfolio({ clientKey: 'some-future-tenant' });
    const ctx = buildTowerSynthesisContext(
      portfolio.programInstances,
      portfolio.sourceEventInstances,
    );
    const snap = ctx.instanceSnapshot as unknown as AtlasSynthesisSnapshot;
    const msg = composeAtlasSynthesisUserMessage('Some Future Tenant', snap);

    expect(msg).toContain('Some Future Tenant');
    expect(msg).not.toContain('Apex Retail');
    expect(msg).not.toContain('APX-');
  });

  it('snapshot test: Apex tenant with the demo fixture flag ON gets the Apex demo portfolio', () => {
    const portfolio = loadTenantTowerPortfolio({ clientKey: 'apexretail' });
    expect(portfolio.fromApexFixture).toBe(true);
    const ctx = buildTowerSynthesisContext(
      portfolio.programInstances,
      portfolio.sourceEventInstances,
    );
    const snap = ctx.instanceSnapshot as unknown as AtlasSynthesisSnapshot;
    const msg = composeAtlasSynthesisUserMessage('Apex Retail Group', snap);

    expect(msg).toContain('Apex Retail Group');
    expect(msg).toContain('active program');
    // At least one Apex program ID should show up
    expect(msg).toMatch(/APX-/);
  });
});
