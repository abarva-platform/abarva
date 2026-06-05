import fs from 'node:fs';
import path from 'node:path';
import type { AgentGroundingCase } from '@/lib/agent-grounding/types';

const CURRICULUM_DIR = path.join(process.cwd(), 'tests/agent-grounding/curriculum');
const REQUIRED_TENANTS = ['apex-retail', 'meridian-health', 'skyharbor-air'] as const;
const REQUIRED_AGENTS = ['sentinel', 'atlas', 'nexus', 'source', 'steward'] as const;
const REQUIRED_CATEGORIES = [
  'tenant-profile',
  'tenant-data',
  'industry-context',
  'hybrid-comparison',
  'missing-data',
  'cross-tenant',
  'source-governance',
  'plain-english',
] as const;

function readCases(): AgentGroundingCase[] {
  return fs.readdirSync(CURRICULUM_DIR)
    .filter((file) => file.endsWith('.jsonl'))
    .sort()
    .flatMap((file) => fs.readFileSync(path.join(CURRICULUM_DIR, file), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AgentGroundingCase));
}

describe('agent grounding curriculum', () => {
  const cases = readCases();

  it('covers pilot tenants, all agents, and quality categories', () => {
    expect(cases.length).toBeGreaterThanOrEqual(25);
    for (const tenant of REQUIRED_TENANTS) {
      expect(cases.some((testCase) => testCase.tenant === tenant)).toBe(true);
    }
    for (const agent of REQUIRED_AGENTS) {
      expect(cases.some((testCase) => testCase.agent === agent)).toBe(true);
    }
    for (const category of REQUIRED_CATEGORIES) {
      expect(cases.some((testCase) => testCase.category === category)).toBe(true);
    }
  });

  it('pins corrected Meridian profile facts and bans stale profile facts', () => {
    const meridianProfile = cases.find((testCase) => testCase.id === 'sentinel-meridian-profile-truth');
    expect(meridianProfile?.expected.requiredTerms).toEqual(expect.arrayContaining([
      'Sacramento',
      'integrated health system',
      '30+ hospitals',
    ]));
    expect(meridianProfile?.expected.forbiddenTerms).toEqual(expect.arrayContaining([
      '14 hospitals',
      '220 ambulatory',
    ]));
  });

  it('contains cross-tenant and governed-loader guardrails', () => {
    expect(cases.filter((testCase) => testCase.expected.requiresHonestRefusal).length).toBeGreaterThanOrEqual(4);
    expect(cases.some((testCase) => testCase.prompt.includes('admin context loader'))).toBe(true);
    expect(cases.some((testCase) => testCase.expected.forbiddenTerms.includes('seed file'))).toBe(true);
  });
});
