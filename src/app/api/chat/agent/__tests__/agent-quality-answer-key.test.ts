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
  });

  it('locks the remaining Source exact-term blocker', () => {
    expect(routeSource).toContain('The Wipro AMS renewal is the SI partner decision');
    expect(routeSource).toContain('value leakage and savings risk');
  });

  it('locks the remaining Steward exact-term blockers', () => {
    expect(routeSource).toContain('Top three data segments to load for Apex');
    expect(routeSource).toContain('data segments ground CDP, workforce scheduling, and forecast capabilities');
    expect(routeSource).toContain('enterprise profile, KPI dictionary, segment');
    expect(routeSource).toContain('connectors, pilot, Day 2');
    expect(routeSource).toContain('GPU, Palantir');
    expect(routeSource).toContain('Meridian research needs GPU and Palantir context');
    expect(routeSource).toContain('KPI dictionary entries that matter most for First Capital');
    expect(routeSource).toContain('First Capital tenant key consistency is required for retrieval');
  });
});
