// PR-5 proof: a completed deliverable persists through the artifacts repository
// contract (mapping is correct), and a gate-blocked result is refused.
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
import {
  captureP5MeasurementContractPlan,
  assertP5MeasurementContractPlanCurrent,
} from "@/lib/programs/p5-measurement-contract";
import { p5Hash } from "@/lib/data-plane/write-adapters/p5OutcomeHandoffAdapter";

const tenantPolicy = {} as TenantAiPolicy;

function okResult(): OrchestrationResult {
  const req = amsRfpRequest();
  return {
    ok: true,
    brief: getArtifactBrief(req),
    document: goodDocument(),
    quality: {
      pass: true,
      blockers: [],
      warnings: ["evidence underused"],
      metrics: {} as never,
    },
    passTrace: [
      {
        pass: "architect",
        maxTokens: 6000,
        highStakes: true,
        outputChars: 100,
        responseId: "msg_arch",
      },
      {
        pass: "synthesis",
        maxTokens: 16000,
        highStakes: true,
        outputChars: 100,
        responseId: "11111111-2222-3333-4444-555555555555",
      },
    ],
  } as OrchestrationResult;
}

describe("persistDeliverable", () => {
  it("carries one captured P5 plan into the rendered contract, immutable version and Office companion", async () => {
    const moveId = "11111111-1111-4111-a111-111111111111";
    const ctx = {
      clientId: "22222222-2222-4222-a222-222222222222",
      clientKey: "meridian",
      userId: "synthetic-operator",
    };
    const plan = {
      kind: "p5_measurement_handoff" as const,
      version: 1 as const,
      measures: [
        {
          leverId: "L1",
          ownerUserId: "receiving-participant",
          ownerRole: "Measurement owner",
          sourceReference: "Source A",
          comparator: "Comparator A",
          method: "Method A",
          cadence: "monthly" as const,
          firstReviewTrigger: "First mature cohort",
          exclusionRules: "No duplicate attribution",
          openConditions: "Source access review",
        },
      ],
    };
    const snapshot = captureP5MeasurementContractPlan(ctx, moveId, plan);
    const result = okResult();
    result.brief = getArtifactBrief({
      ...amsRfpRequest(),
      module: "moves",
      deliverableType: "value_measurement_contract",
    });
    result.document = {
      ...goodDocument(),
      title: "Measurement contract",
      clientDisplayName: "Synthetic organization",
      initiativeDisplayName: "Synthetic Move",
    };
    const originalSections = result.document.generatedSections.length;
    const save = jest
      .fn()
      .mockResolvedValue({ id: "generated-artifact-1", metadata: {} });
    const materialize = jest
      .fn()
      .mockResolvedValue({
        deliverableId: "contract-1",
        versionId: "version-1",
      });
    const companion = jest
      .fn()
      .mockResolvedValue({
        fileFormat: "docx",
        fileName: "measurement.docx",
        body: Buffer.from("local companion fixture"),
      });
    const saveCompanion = jest.fn();
    await persistDeliverable(
      result,
      {
        clientId: ctx.clientId,
        renderedBy: ctx.userId,
        userId: ctx.userId,
        tenantKey: ctx.clientKey,
        sourceArtifactRef: moveId,
        phase: 5,
        tenantPolicy,
        deliverableTypeKey: "value_measurement_contract",
        p5MeasurementContractPlan: snapshot,
      },
      {
        save: save as never,
        materializeDeliverableDraft: materialize as never,
        renderOfficeCompanion: companion as never,
        saveGeneratedOfficeCompanion: saveCompanion as never,
      },
    );
    const rendered = save.mock.calls[0][1];
    const stored = materialize.mock.calls[0][2];
    const proof = stored.structuredData.p5MeasurementContractPlan;
    expect(proof.plan).toEqual(plan);
    expect(proof.planHash).toBe(p5Hash(plan));
    expect(proof.contentHash).toBe(p5Hash(stored.content));
    expect(rendered.html).toBe(stored.content);
    for (const words of [
      "Source A",
      "Comparator A",
      "Method A",
      "Measurement owner",
      "monthly",
      "First mature cohort",
      "No duplicate attribution",
      "Source access review",
      snapshot.planHash,
    ])
      expect(stored.content).toContain(words);
    expect(stored.content).not.toContain("receiving-participant");
    expect(save.mock.calls[0][2].p5MeasurementContractPlan).toEqual(proof);
    expect(
      saveCompanion.mock.calls[0][1].metadata.p5MeasurementContractPlan,
    ).toEqual(proof);
    expect(
      companion.mock.calls[0][0].generatedSections.at(-1).bodyMarkdown,
    ).toContain("Comparator A");
    expect(() =>
      assertP5MeasurementContractPlanCurrent({
        ctx,
        moveId,
        plan,
        content: stored.content,
        structuredData: stored.structuredData,
      }),
    ).not.toThrow();
    expect(result.document.generatedSections).toHaveLength(originalSections);
    plan.measures[0].comparator = "Comparator B";
    expect(() =>
      assertP5MeasurementContractPlanCurrent({
        ctx,
        moveId,
        plan,
        content: stored.content,
        structuredData: stored.structuredData,
      }),
    ).toThrow("different saved definitions");
    expect(snapshot.plan.measures[0].comparator).toBe("Comparator A");
  });
  it("maps the document into the generated_artifacts contract and saves it", async () => {
    let savedInput: unknown;
    let savedRendered: unknown;
    const mockSave = (async (input: unknown, rendered: unknown) => {
      savedInput = input;
      savedRendered = rendered;
      return {
        id: "art-1",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;

    const rec = await persistDeliverable(
      okResult(),
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "evt-skyharbor-ams",
        tenantPolicy,
        evidenceLedgerIds: ["ev-1", "ev-2"],
      },
      { save: mockSave },
    );

    expect(rec.id).toBe("art-1");
    const input = savedInput as Record<string, unknown>;
    const rendered = savedRendered as Record<string, unknown>;
    expect(input.artifactType).toBe("source_board_pack"); // module=source
    expect(input.title).toBe(goodDocument().title);
    expect((input.sections as unknown[]).length).toBeGreaterThan(0);
    expect((input.facts as unknown[]).length).toBe(
      goodDocument().sourceRegister.length,
    );
    expect(rendered.outputFormat).toBe("docx");
    expect(typeof rendered.html).toBe("string");
    expect(rendered.html as string).toMatch(goodDocument().title);
    expect(rendered.blobSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(rendered.evidenceLedgerIds).toEqual(["ev-1", "ev-2"]);
    // generation_egress_audit is a UUID FK — link the first pass whose responseId is a
    // genuine audit UUID (Anthropic msg_ ids are skipped); null when none qualify.
    expect(rendered.generationEgressAudit).toBe(
      "11111111-2222-3333-4444-555555555555",
    );
    expect(rendered.qualityScore as number).toBeLessThan(1); // one warning → small penalty
    expect(rendered.qualityScore as number).toBeGreaterThanOrEqual(0.5);
  });

  it("persists the structured renderable doc in metadata for on-demand re-render", async () => {
    let extraMeta: unknown;
    const mockSave = (async (
      _input: unknown,
      _rendered: unknown,
      extra: unknown,
    ) => {
      extraMeta = extra;
      return {
        id: "art-meta",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;

    await persistDeliverable(
      okResult(),
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "evt",
        tenantPolicy,
      },
      { save: mockSave },
    );

    const meta = extraMeta as Record<string, unknown>;
    expect(meta).toBeDefined();
    expect(meta.renderableDoc).toBeDefined();
    expect((meta.renderableDoc as Record<string, unknown>).title).toBe(
      goodDocument().title,
    );
  });

  it("persists the canonical deliverable key for later client approval", async () => {
    let extraMeta: unknown;
    const mockSave = (async (
      _input: unknown,
      _rendered: unknown,
      extra: unknown,
    ) => {
      extraMeta = extra;
      return {
        id: "art-root",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;

    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "root_cause",
    });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: {
        ...goodDocument(),
        title: "FS Demo — Onboarding & KYC Agent-Assist Discovery",
      },
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    await persistDeliverable(
      result,
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "move:prog-1:phase:2",
        tenantPolicy,
      },
      { save: mockSave },
    );

    const meta = extraMeta as Record<string, unknown>;
    expect(meta.deliverableTypeKey).toBe("root_cause_worksheet");
    expect(meta.registryKey).toBe("root_cause_worksheet");
    expect(
      (meta.renderableDoc as Record<string, unknown>).deliverableTypeKey,
    ).toBe("root_cause_worksheet");
    expect(
      (meta.renderableDoc as Record<string, unknown>).deliverableType,
    ).toBe("root_cause");
  });

  it("materializes Moves generations into an unsigned deliverables_v2 draft and links the Office companion to that version", async () => {
    const mockSave = (async () =>
      ({
        id: "generated-artifact-1",
        clientId: "c1",
        metadata: {},
      }) as unknown as GeneratedArtifactRecord) as never;
    const materializeDeliverableDraft = jest.fn(async () => ({
      deliverableId: "deliverable-1",
      versionId: "version-1",
      status: "draft" as const,
    }));
    const saveGeneratedOfficeCompanion = jest.fn(async () => ({
      artifactId: "office-artifact-1",
      version: 1,
      blobPath: "moves/demo/move-1/generated/p1/charter/v1/charter.docx",
      blobStored: true,
    }));
    const renderOfficeCompanion = jest.fn(async () => ({
      body: Buffer.from("docx"),
      fileFormat: "docx" as const,
      fileName: "charter.docx",
    }));

    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "business_case",
    });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: {
        ...goodDocument(),
        title: "Generated Charter",
      },
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    const rec = await persistDeliverable(
      result,
      {
        clientId: "c1",
        userId: "user-1",
        renderedBy: "user-1",
        sourceArtifactRef: "81448568-b4cd-4254-9218-76f7e2974b61",
        tenantKey: "tenant-a",
        tenantPolicy,
        deliverableTypeKey: "charter",
      },
      {
        save: mockSave,
        materializeDeliverableDraft: materializeDeliverableDraft as never,
        saveGeneratedOfficeCompanion: saveGeneratedOfficeCompanion as never,
        renderOfficeCompanion: renderOfficeCompanion as never,
      },
    );

    expect(rec.id).toBe("generated-artifact-1");
    expect(materializeDeliverableDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "c1",
        clientKey: "tenant-a",
        userId: "user-1",
      }),
      "81448568-b4cd-4254-9218-76f7e2974b61",
      expect.objectContaining({
        deliverableTypeKey: "charter",
        title: "Generated Charter",
        signOff: false,
        structuredData: expect.objectContaining({
          source: "generated_by_orchestrator",
          generated_artifact_id: "generated-artifact-1",
          requiresOfficeCompanionScan: true,
        }),
      }),
    );
    expect(saveGeneratedOfficeCompanion).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "c1",
        clientKey: "tenant-a",
        userId: "user-1",
      }),
      expect.objectContaining({
        moveId: "81448568-b4cd-4254-9218-76f7e2974b61",
        phase: 1,
        artifactType: "charter_editable_docx",
        artifactFamily: "generated_deliverable",
        fileFormat: "docx",
        requireBlobStored: true,
        metadata: expect.objectContaining({
          deliverableId: "deliverable-1",
          versionId: "version-1",
          generatedArtifactId: "generated-artifact-1",
          outputRole: "docx_editable_phase_record",
        }),
      }),
    );
  });

  it("honors the queued registry key when the orchestrator type is shared by another Moves deliverable", async () => {
    let extraMeta: unknown;
    const mockSave = (async (
      _input: unknown,
      _rendered: unknown,
      extra: unknown,
    ) => {
      extraMeta = extra;
      return {
        id: "art-root-cause-shared-type",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;

    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "discovery_report",
    });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: {
        ...goodDocument(),
        title: "FS Demo — Commercial Lending Current-State Discovery",
      },
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    await persistDeliverable(
      result,
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "move:prog-1:phase:2",
        tenantPolicy,
        deliverableTypeKey: "root_cause_worksheet",
      },
      { save: mockSave },
    );

    const meta = extraMeta as Record<string, unknown>;
    expect(meta.deliverableTypeKey).toBe("root_cause_worksheet");
    expect(meta.registryKey).toBe("root_cause_worksheet");
    expect(meta.deliverableType).toBe("discovery_report");
    expect(
      (meta.renderableDoc as Record<string, unknown>).deliverableTypeKey,
    ).toBe("root_cause_worksheet");
    expect(
      (meta.renderableDoc as Record<string, unknown>).deliverableType,
    ).toBe("discovery_report");
  });

  it("prescribes docx for a narrative deliverable (rfp_package)", async () => {
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return {
        id: "a",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;
    await persistDeliverable(
      okResult(),
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "evt",
        tenantPolicy,
      },
      { save: mockSave },
    );
    expect(rendered?.outputFormat).toBe("docx");
  });

  it("prescribes xlsx for the financial model (estimate_model)", async () => {
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return {
        id: "a",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;

    // moves financial model → orchestrator deliverableType 'estimate_model'
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "estimate_model",
    });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: goodDocument(),
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    await persistDeliverable(
      result,
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "evt",
        tenantPolicy,
      },
      { save: mockSave },
    );
    expect(rendered?.outputFormat).toBe("xlsx");
  });

  it("honors an explicit outputFormat override", async () => {
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return {
        id: "a",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;
    await persistDeliverable(
      okResult(),
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "evt",
        tenantPolicy,
        outputFormat: "html",
      },
      { save: mockSave },
    );
    expect(rendered?.outputFormat).toBe("html");
  });

  it("does not change the governed final format when decision-storytelling renders an HTML preview", async () => {
    // moves_decision_storytelling can render a browser preview, but the governed
    // final artifact remains the profile's DOCX/PPTX/XLSX output. HTML is not
    // the client-final format.
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return {
        id: "a",
        clientId: "c1",
        metadata: {},
      } as unknown as GeneratedArtifactRecord;
    }) as never;

    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "business_case",
    });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: goodDocument(),
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    await persistDeliverable(
      result,
      {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "evt-lakeshore-legal",
        tenantPolicy,
        renderAsDeck: true,
        tenantKey: "lakeshore",
      },
      { save: mockSave },
    );

    expect(rendered?.outputFormat).toBe("docx");
    const reason = String(rendered?.quarantineReason ?? "");
    expect(reason).not.toMatch(/format_fit/);
  });

  it("refuses to persist a gate-blocked result", async () => {
    const blocked = {
      ok: false,
      brief: getArtifactBrief(amsRfpRequest()),
      passTrace: [],
      blockedReason: "quality gate blocked export: unsupported claims",
    } as OrchestrationResult;
    await expect(
      persistDeliverable(blocked, {
        clientId: "c1",
        renderedBy: "u1",
        sourceArtifactRef: "x",
        tenantPolicy,
      }),
    ).rejects.toThrow(/cannot persist|quality gate/);
  });
});
