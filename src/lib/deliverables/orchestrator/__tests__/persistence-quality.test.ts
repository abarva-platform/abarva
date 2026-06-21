// WIRE proof: the Deliverable Quality Contract is a blocking step in
// persistDeliverable. A failing artifact is NOT saved client-ready — it is
// quarantined as an internal draft. Tenant-agnostic; same path for every client.
import { persistDeliverable } from '../persistence';
import type { OrchestrationResult } from '../orchestrator';
import { getArtifactBrief } from '../artifact-brief-registry';
import { amsRfpRequest, goodDocument } from '../__fixtures__/ams-rfp';
import type { GeneratedArtifactRecord } from '@/lib/artifacts/repository';
import type { TenantAiPolicy } from '@/lib/integrations/ai-egress';

const tenantPolicy = {} as TenantAiPolicy;

// An architecture deliverable requires rendered exhibits; the prose fixture has
// none that match — so the contract resolves blocked_missing_exhibits.
function archResult(): OrchestrationResult {
  const req = amsRfpRequest();
  const brief = { ...getArtifactBrief(req), deliverableType: 'target_architecture' };
  return {
    ok: true,
    brief,
    document: goodDocument(),
    quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
    passTrace: [],
  } as OrchestrationResult;
}

async function persistWith(opts: Record<string, unknown>) {
  let rendered: Record<string, unknown> | undefined;
  const save = (async (_i: unknown, r: unknown) => {
    rendered = r as Record<string, unknown>;
    return { id: 'a', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
  }) as never;
  await persistDeliverable(
    archResult(),
    { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'evt', tenantPolicy, ...opts },
    { save },
  );
  return rendered!;
}

describe('persistDeliverable — quality contract enforcement', () => {
  it('quarantines a failing artifact as internal draft when enforcement is on', async () => {
    const rendered = await persistWith({ enforceQualityContract: true });
    expect(rendered.quarantined).toBe(true);
    expect(String(rendered.quarantineReason)).toMatch(/blocked_missing_exhibits/);
  });

  it('does NOT quarantine in observe-only mode (records but does not block)', async () => {
    const rendered = await persistWith({ enforceQualityContract: false });
    expect(rendered.quarantined).toBe(false);
    expect(rendered.quarantineReason).toBeNull();
  });
});
