import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Agent route prompt — L7 canonical answer key', () => {
  const routeSource = readFileSync(
    join(process.cwd(), 'src/app/api/chat/agent/route.ts'),
    'utf8',
  );

  it('renders a late answer-key block before page context', () => {
    expect(routeSource).toContain('buildAgentQualityAnswerKeyBlock');
    expect(routeSource).toContain('L7 CANONICAL ANSWER KEY');
    expect(routeSource).toContain('override generic voice doctrine for exact wording');
    expect(routeSource.indexOf('agentQualityAnswerKeyBlock')).toBeLessThan(
      routeSource.indexOf('"Page context:"'),
    );
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
  });
});
