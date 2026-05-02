import { readFileSync } from 'node:fs';
import { HOME_VIEW } from '@/lib/home/shell-home-fixture';
import {
  PRESSURE_AI_CLOUD_SPEND,
  PRESSURE_DETAIL_AI_CLOUD_SPEND,
  TOWER_INDEX_VIEW,
} from '@/lib/tower/shell-tower-fixture';
import { ACTIVITY_AGENT_VOICE, ACTIVITY_LOG } from '@/lib/tower/shell-activity-fixture';
import { RISK_AGENT_VOICE, RISK_ITEMS } from '@/lib/tower/shell-lens-fixture';

const MONEY_PATTERN = /\$\s?\d/i;

function flatten(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flatten).join('\n');
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).map(flatten).join('\n');
  return '';
}

describe('Tower financial output firewall', () => {
  it('keeps public Tower and Home fixtures free of exact dollar values', () => {
    const visibleCopy = [
      HOME_VIEW.topPressure,
      HOME_VIEW.agentQuote,
      HOME_VIEW.actions,
      PRESSURE_AI_CLOUD_SPEND,
      PRESSURE_DETAIL_AI_CLOUD_SPEND,
      TOWER_INDEX_VIEW.agentQuote,
      TOWER_INDEX_VIEW.actions,
      ACTIVITY_LOG,
      ACTIVITY_AGENT_VOICE,
      RISK_ITEMS,
      RISK_AGENT_VOICE,
    ].map(flatten).join('\n');

    expect(visibleCopy).not.toMatch(MONEY_PATTERN);
    expect(visibleCopy).toContain('exact values hidden');
    expect(visibleCopy).toContain('material');
  });

  it('makes Tower synthesis access-aware and bypasses stale unsanitized caches', () => {
    const routeSource = readFileSync('src/app/api/tower/synthesis/route.ts', 'utf8');
    const clientSource = readFileSync('src/components/tower/AtlasSynthesisQuote.tsx', 'utf8');

    expect(routeSource).toContain('loadUserProgramAccessPolicy');
    expect(routeSource).toContain('formatRestrictedOutputPolicyForPrompt');
    expect(routeSource).toContain('sanitizeRestrictedFinancialText');
    expect(routeSource).toContain('atlas:v2:${policyCacheKey}');
    expect(routeSource).toContain('X-Restricted-Output');
    expect(clientSource).toContain('tower:tower:v2:restricted-safe');
  });
});
