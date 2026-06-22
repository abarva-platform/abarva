// WIRE proof: the Deliverable Quality Contract is a blocking step in
// persistDeliverable. A failing artifact is NOT saved client-ready — it is
// quarantined as an internal draft. Tenant-agnostic; same path for every client.
import { persistDeliverable } from '../persistence';
import type { OrchestrationResult } from '../orchestrator';
import { getArtifactBrief } from '../artifact-brief-registry';
import { amsRfpRequest, goodDocument } from '../__fixtures__/ams-rfp';
import type { GeneratedArtifactRecord } from '@/lib/artifacts/repository';
import type { TenantAiPolicy } from '@/lib/integrations/ai-egress';
import { FIRST_CAPITAL_ARCHITECTURE } from '@/lib/visual-system/__fixtures__/first-capital-architecture';

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
    // Architecture artifacts now fail the story-led/visual gate when the prose
    // path emits no current-state/story/visual signals — any blocked_* reason.
    expect(String(rendered.quarantineReason)).toMatch(/^blocked_/);
  });

  it('does NOT quarantine in observe-only mode (records but does not block)', async () => {
    const rendered = await persistWith({ enforceQualityContract: false });
    expect(rendered.quarantined).toBe(false);
    expect(rendered.quarantineReason).toBeNull();
  });

  it('renders the architecture exhibit when renderViaProfile + a model is supplied', async () => {
    const rendered = await persistWith({
      renderViaProfile: true,
      structuredModels: { architectureModel: FIRST_CAPITAL_ARCHITECTURE },
    });
    expect(rendered.outputFormat).toBe('html');
    expect(String(rendered.html)).toContain('Target state (to-be)');
  });

  it('counts model-produced exhibits toward exhibit enforcement (no missing-exhibit block)', async () => {
    const rendered = await persistWith({
      enforceQualityContract: true,
      structuredModels: { architectureModel: FIRST_CAPITAL_ARCHITECTURE },
    });
    expect(String(rendered.quarantineReason ?? '')).not.toMatch(/blocked_missing_exhibits/);
  });
});
