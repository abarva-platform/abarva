// Wiring proof for the editable Office companion's phase.
//
// `resolveGeneratedCompanionPhase` can be correct and unused: the value it
// returns only matters if persistence actually files the companion under it.
// These cases drive the REAL `persistDeliverable` with the companion save
// injected and assert the phase it is called with, so reverting persistence to a
// key-derived phase fails here even though the resolver's own suite still passes.
jest.mock("@/lib/deliverables/deck-from-result", () => ({
  buildDeckHtmlFromDocument: jest.fn(
    () => "<html><body>Executive deck</body></html>",
  ),
}));

import { persistDeliverable } from "../persistence";
import type { OrchestrationResult } from "../orchestrator";
import { getArtifactBrief } from "../artifact-brief-registry";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";

const tenantPolicy = {} as TenantAiPolicy;
const MOVE_ID = "81448568-b4cd-4254-9218-76f7e2974b61";

function companionDeps() {
  const saveGeneratedOfficeCompanion = jest.fn(async () => ({
    artifactId: "office-artifact-1",
    version: 1,
    blobPath: "moves/demo/move-1/generated/p1/charter/v1/charter.docx",
    blobStored: true,
  }));
  return {
    saveGeneratedOfficeCompanion,
    deps: {
      save: (async () =>
        ({
          id: "generated-artifact-1",
          clientId: "c1",
          metadata: {},
        }) as unknown as GeneratedArtifactRecord) as never,
      materializeDeliverableDraft: (async () => ({
        deliverableId: "deliverable-1",
        versionId: "version-1",
        status: "draft" as const,
      })) as never,
      saveGeneratedOfficeCompanion: saveGeneratedOfficeCompanion as never,
      renderOfficeCompanion: (async () => ({
        body: Buffer.from("docx"),
        fileFormat: "docx" as const,
        fileName: "charter.docx",
      })) as never,
    },
  };
}

function okResult(): OrchestrationResult {
  const req = amsRfpRequest({ module: "moves", deliverableType: "business_case" });
  return {
    ok: true,
    brief: getArtifactBrief(req),
    document: { ...goodDocument(), title: "Generated Charter" },
    quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
    passTrace: [],
  } as OrchestrationResult;
}

async function companionSaveArgs(opts: { phase?: number }) {
  const { saveGeneratedOfficeCompanion, deps } = companionDeps();
  await persistDeliverable(
    okResult(),
    {
      clientId: "c1",
      userId: "user-1",
      renderedBy: "user-1",
      sourceArtifactRef: MOVE_ID,
      tenantKey: "tenant-a",
      tenantPolicy,
      deliverableTypeKey: "charter",
      ...(opts.phase !== undefined ? { phase: opts.phase } : {}),
    },
    deps,
  );
  expect(saveGeneratedOfficeCompanion).toHaveBeenCalledTimes(1);
  const call = saveGeneratedOfficeCompanion.mock.calls[0] as unknown as [
    unknown,
    { phase: number; metadata: Record<string, unknown> },
  ];
  return call[1];
}

describe("persistDeliverable — the companion is filed under the DECLARED phase", () => {
  it("files the companion under the declared phase, not the key's registry phase", async () => {
    // `charter` is a P1 registry key, so a declared P4 can only come from opts.phase.
    expect(
      DELIVERABLE_REGISTRY.find((s) => s.deliverableTypeKey === "charter")?.phase,
    ).toBe(1);
    const args = await companionSaveArgs({ phase: 4 });
    expect(args.phase).toBe(4);
    expect(args.metadata.companionPhaseBasis).toBe("declared");
  });

  it("falls back to the key's registry phase when no phase was declared", async () => {
    const args = await companionSaveArgs({});
    expect(args.phase).toBe(1);
    expect(args.metadata.companionPhaseBasis).toBe("registry_key");
  });

  it("records a declared P0 as declared", async () => {
    const args = await companionSaveArgs({ phase: 0 });
    expect(args.phase).toBe(0);
    expect(args.metadata.companionPhaseBasis).toBe("declared");
  });
});
