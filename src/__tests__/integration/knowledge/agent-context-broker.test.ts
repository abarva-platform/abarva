import fs from 'fs';
import path from 'path';

import { buildEnterpriseAgentContextBundle } from '@/lib/knowledge/agent-context-broker';

const repoRoot = process.cwd();

describe('enterprise agent context broker', () => {
  it('returns tenant-scoped program and deliverable context for Nexus', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
      includeGraphNeighborhood: true,
    });

    expect(bundle.generatedFrom).toBe('enterprise_agent_context_broker_v1');
    expect(bundle.runtimeSafe).toBe(true);
    expect(bundle.directStoreAccess).toBe(false);
    expect(bundle.items.some((item) => item.kind === 'program')).toBe(true);
    expect(bundle.items.some((item) => item.kind === 'artifact')).toBe(true);
    expect(bundle.items.every((item) => item.tenantKey === 'apex-retail')).toBe(true);
    expect(bundle.graphNeighborhood.included).toBe(true);
    expect(bundle.graphNeighborhood.nodeCount).toBeGreaterThan(0);
  });

  it('returns evidence and graph candidates for Sentinel', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Sentinel',
      surface: 'intelligence',
      includeGraphNeighborhood: true,
    });

    expect(bundle.items.some((item) => item.kind === 'evidence')).toBe(true);
    expect(bundle.items.some((item) => item.kind === 'graph_candidate')).toBe(true);
    expect(bundle.citations.length).toBeGreaterThan(0);
    expect(bundle.items.filter((item) => item.kind === 'evidence').every((item) => item.linkedEvidence.length > 0)).toBe(true);
  });

  it('keeps Atlas on summary-level aggregate context by default', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Atlas',
      surface: 'tower',
    });

    expect(bundle.items.some((item) => item.kind === 'financial_metric')).toBe(true);
    expect(bundle.items.some((item) => item.kind === 'system')).toBe(true);
    expect(bundle.items.every((item) => item.sensitivity !== 'l4_raw')).toBe(true);
    expect(bundle.graphNeighborhood.included).toBe(false);
  });

  it('returns policy and readiness metadata for Steward', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Steward',
      surface: 'chat',
    });

    expect(bundle.items.some((item) => item.kind === 'policy_readiness')).toBe(true);
    expect(bundle.items.some((item) => item.kind === 'vendor_contract')).toBe(true);
    expect(bundle.items.find((item) => item.kind === 'policy_readiness')?.summary).toContain('tenant key: true');
  });

  it('blocks unknown tenants instead of fabricating context', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'unknown-tenant',
      agentName: 'Nexus',
      surface: 'programs',
    });

    expect(bundle.items).toHaveLength(0);
    expect(bundle.blockedItems).toHaveLength(1);
    expect(bundle.blockedItems[0].reason).toBe('unknown_tenant');
    expect(bundle.warnings[0]).toContain('Unknown tenant');
  });

  it('blocks raw L4 context unless explicitly allowed', () => {
    const blocked = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
    });
    const allowed = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Nexus',
      surface: 'programs',
      allowL4RawContext: true,
    });

    expect(blocked.blockedItems.some((item) => item.reason === 'l4_raw_not_allowed')).toBe(true);
    expect(allowed.blockedItems.some((item) => item.reason === 'l4_raw_not_allowed')).toBe(false);
    expect(allowed.items.every((item) => item.sensitivity !== 'l4_raw')).toBe(true);
  });

  it('marks unavailable requested domains as blocked', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'apex-retail',
      agentName: 'Steward',
      surface: 'chat',
      requestedDomains: ['operating_telemetry'],
    });

    expect(bundle.blockedItems.some((item) => item.requestedDomain === 'operating_telemetry')).toBe(true);
  });

  it('is not imported by app routes yet', () => {
    const routeFiles = [
      'src/app/api/chat/agent/route.ts',
      'src/app/api/v1/programs/[programId]/nexus/ask/route.ts',
      'src/app/api/v1/programs/[programId]/nexus/draft/route.ts',
    ];

    for (const routeFile of routeFiles) {
      const routeText = fs.readFileSync(path.join(repoRoot, routeFile), 'utf8');
      expect(routeText).not.toContain('agent-context-broker');
      expect(routeText).not.toContain('buildEnterpriseAgentContextBundle');
    }
  });
});
