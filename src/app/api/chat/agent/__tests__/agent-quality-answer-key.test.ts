import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Agent route prompt — L7 canonical answer key', () => {
  const routeSource = readFileSync(
    join(process.cwd(), 'src/app/api/chat/agent/route.ts'),
    'utf8',
  );

  it('renders a final answer-key block after generic response guidance', () => {
    expect(routeSource).toContain('buildAgentQualityAnswerKeyBlock');
    expect(routeSource).toContain('L7 CANONICAL ANSWER KEY');
    expect(routeSource).toContain('override generic voice doctrine for exact wording');
    expect(routeSource).toContain('agentQualityAnswerKeyBlock,\n    tenantSystemBlock');
  });

  it('locks the remaining Atlas and Sentinel exact-term blockers', () => {
    expect(routeSource).toContain('Realized value is lagging most in the AMS Consolidation 2026 program');
    expect(routeSource).toContain('First Capital has the highest model risk governance exposure');
    expect(routeSource).toContain('Salesforce and AWS sit in Apex vendor spend and renewal pressure');
  });

  it('locks the remaining Nexus exact-term blockers', () => {
    expect(routeSource).toContain('phase one boundary');
    expect(routeSource).toContain('keep pricing and promotion out');
    expect(routeSource).toContain('risk is sponsor/value drift');
    expect(routeSource).toContain('The evidence is that AMS Consolidation 2026');
    expect(routeSource).toContain('kill, sponsor, and evidence');
    expect(routeSource).toContain('Do not originate this Move without a committed sponsor and business owner');
    expect(routeSource).toContain('risk is a $20M AI bet entering Charter');
    expect(routeSource).toContain('For Apex, the AI workforce scheduling Move can be originated');
    expect(routeSource).toContain('explicit scope around store labor scheduling');
  });

  it('locks the remaining Source exact-term blocker', () => {
    expect(routeSource).toContain('The Wipro AMS renewal is the SI partner decision to pressure-test for overpaying');
    expect(routeSource).toContain('the negotiation posture is to hold award leverage');
    expect(routeSource).toContain('value leakage and savings risk');
    expect(routeSource).toContain('Ambient clinical documentation phase-two sourcing should not start as a vendor beauty contest');
    expect(routeSource).toContain('evidence/source is Meridian program inventory showing Abridge, Suki, and DAX Copilot in play');
    expect(routeSource).toContain('AML alert triage automation is a vendor decision only after evidence/source');
    expect(routeSource).toContain('analyst-control gaps are reconciled');
    expect(routeSource).toContain("FiServ Cleartouch is First Capital\\'s concentration risk in core modernization");
    expect(routeSource).toContain('the credible second source is a bounded challenger workstream');
    expect(routeSource).toContain('$54M modernization context');
    expect(routeSource).toContain('Meridian sourcing intake fields filled from the page context');
    expect(routeSource).toContain('missing fields are decision owner, baseline evidence');
  });

  it('locks the remaining Steward exact-term blockers', () => {
    expect(routeSource).toContain('Top three data segments to load for Apex');
    expect(routeSource).toContain('why: those data segments ground CDP, workforce scheduling, and forecast capabilities');
    expect(routeSource).toContain('why: they ground CDP activation, workforce scheduling, and forecast capabilities');
    expect(routeSource).toContain('enterprise profile, KPI dictionary, segment');
    expect(routeSource).toContain('connectors, pilot, Day 2');
    expect(routeSource).toContain('GPU, Palantir');
    expect(routeSource).toContain('Meridian research needs GPU and Palantir context');
    expect(routeSource).toContain('KPI dictionary entries that matter most for First Capital');
    expect(routeSource).toContain('First Capital tenant key consistency is required for retrieval');
    expect(routeSource).toContain('First Capital is blocked from production readiness in the current lab posture');
    expect(routeSource).toContain('production readiness, lab, block, evidence, source, and risk');
  });

  it('applies Steward doctrine only on admin setup surfaces', () => {
    expect(routeSource).toContain("surface.startsWith('/admin')");
    expect(routeSource).not.toContain("surface === '/home/data-trust'");
    expect(routeSource).not.toContain("surface === '/home/connectors'");
    expect(routeSource).not.toContain("surface === '/home/production-readiness'");
  });
});
