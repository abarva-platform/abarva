import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildP0PhaseCaptureValues,
  persistP0PhaseCaptureFromSource,
} from "../p0-phase-capture";
import {
  evaluatePhaseCapture,
  phaseCaptureModuleKey,
} from "../phase-capture-contract";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

const mockCorrectionTransaction = jest.fn();
const mockCorrectionPolicy = jest.fn();
const mockCorrectionConnection = jest.fn(
  (
    ctx?: import("@/lib/data-plane/tenantConnectionResolver").TenantConnectionScope,
    _env?: NodeJS.ProcessEnv,
    _options?: import("@/lib/data-plane/tenantConnectionResolver").TenantConnectionResolutionOptions,
  ): Pick<
    import("@/lib/data-plane/tenantConnectionResolver").TenantConnectionResolution,
    "candidates"
  > => {
    void _env;
    void _options;
    return { candidates: ctx ? ["mock-tenant-connection"] : [] };
  },
);
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    mockCorrectionPolicy(...args),
}));
jest.mock("@/lib/data-plane/tenantConnectionResolver", () => ({
  ...jest.requireActual<
    typeof import("@/lib/data-plane/tenantConnectionResolver")
  >("@/lib/data-plane/tenantConnectionResolver"),
  resolveTenantDatabaseConnection: (
    ...args: Parameters<
      typeof import("@/lib/data-plane/tenantConnectionResolver").resolveTenantDatabaseConnection
    >
  ) => mockCorrectionConnection(...args),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => false),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
  resolveDatabaseUrlCandidates: (env: NodeJS.ProcessEnv) =>
    jest
      .requireActual<
        typeof import("@/lib/data-plane/postgresCompat")
      >("@/lib/data-plane/postgresCompat")
      .resolveDatabaseUrlCandidates(env),
  withAzureWriteTransaction: (...args: unknown[]) =>
    mockCorrectionTransaction(...args),
}));

describe("P0 origination charter -> phase capture", () => {
  const labelled =
    "Business trigger: A declared operating change.\nIts source remains attached.\n\nProblem statement: A distinct observed problem.\nThe next paragraph stays verbatim.";
  it("maps explicitly labelled signal paragraphs separately and preserves continuation lines", () => {
    const values = buildP0PhaseCaptureValues(
      { problemStatement: labelled },
      { separateDeclaredSignal: true },
    );
    expect(values.business_trigger).toBe(
      "A declared operating change.\nIts source remains attached.",
    );
    expect(values.problem_statement).toBe(
      "A distinct observed problem.\nThe next paragraph stays verbatim.",
    );
  });
  it("retains the unlabelled and flag-off mapping exactly", () => {
    const plain = { problemStatement: "The approved original intake text." };
    expect(
      buildP0PhaseCaptureValues(plain, { separateDeclaredSignal: true }),
    ).toEqual(buildP0PhaseCaptureValues(plain));
    expect(
      buildP0PhaseCaptureValues({ problemStatement: labelled })
        .business_trigger,
    ).toBe(labelled);
    expect(
      buildP0PhaseCaptureValues({ problemStatement: labelled })
        .problem_statement,
    ).toBe(labelled);
  });
  it.each([
    "Problem statement: Only a problem was declared.",
    "Business trigger:\nProblem statement: A problem only.",
    "Business trigger: First.\nBusiness trigger: Conflicting.\nProblem statement: A problem.",
  ])(
    "does not invent a complete signal from an incomplete or ambiguous declaration: %s",
    (text) => {
      const values = buildP0PhaseCaptureValues(
        { problemStatement: text },
        { separateDeclaredSignal: true },
      );
      expect(values.business_trigger).toBe("");
      expect(evaluatePhaseCapture(0, values).complete).toBe(false);
    },
  );
  it("binds the split to the existing tenant intake flag on the normal persistence path", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
    const inserted: Array<Record<string, unknown>> = [];
    const builder: {
      select: jest.Mock;
      eq: jest.Mock;
      in: jest.Mock;
      insert: jest.Mock;
    } = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      in: jest.fn(async () => ({ data: [], error: null })),
      insert: jest.fn(async (row: Record<string, unknown>) => {
        inserted.push(row);
        return { error: null };
      }),
    };
    jest
      .mocked(getAzureWriteFluentClient)
      .mockReturnValue({ from: jest.fn(() => builder) } as never);
    const ctx = {
      clientId: "tenant-a",
      clientKey: "tenant-a",
      userId: "user-a",
    };
    const result = await persistP0PhaseCaptureFromSource(ctx, "move-a", {
      problemStatement: labelled,
      targetOutcome: "A declared outcome",
      timelineHorizon: "A known foundation",
      charter: {
        scaffold: {
          scope_in: "Declared scope",
          scope_out: "Excluded scope",
          sponsor_candidate: "Sponsor role",
          evidence_family: "Known sources",
          outcomes_success: "Success criteria",
          discovery_questions: "Validation questions",
        },
      },
    });
    expect(result.persisted).toBe(true);
    expect(isFeatureEnabled).toHaveBeenCalledWith(
      { clientId: "tenant-a", clientKey: "tenant-a" },
      "moves_extended_intake_fields_v1",
    );
    const fields = Object.fromEntries(
      inserted.map((row) => {
        const state = row.state_jsonb as {
          capture_section_key: string;
          value: string;
        };
        return [state.capture_section_key, state.value];
      }),
    );
    expect(fields.business_trigger).not.toBe(fields.problem_statement);
    expect(fields.business_trigger).toBe(
      "A declared operating change.\nIts source remains attached.",
    );
    jest.mocked(isFeatureEnabled).mockReturnValue(false);
  });
  it("maps the ten Start a Move fields into the durable P0 capture contract", () => {
    const values = buildP0PhaseCaptureValues({
      name: "Member Service Agent Assist",
      problemStatement:
        "Members experience long calls because agents navigate multiple systems.",
      targetOutcome:
        "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
      timelineHorizon:
        "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
      charter: {
        scaffold: {
          problem_statement:
            "Members experience long calls because agents navigate multiple systems.",
          archetype: "Contact Center Agent Assist",
          sponsor_candidate:
            "Chief Digital and Information Officer with VP Operations.",
          scope_in:
            "Claims status, prior auth, eligibility, benefits, CRM history, knowledge lookup.",
          scope_out: "Clinical decisions and appeals adjudication.",
          evidence_family:
            "Member-service metrics, call transcripts, CRM history, claims/auth/benefits samples, knowledge base, systems inventory.",
          value_hypothesis:
            "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
          outcomes_success:
            "Lower handle time and fewer transfers, validated against a P2 baseline.",
          discovery_questions:
            "Hypothesis: most repeat contacts trace to a handful of intents. Question: which systems do agents use per intent?",
          foundation_readiness:
            "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
        },
      },
    });

    expect(values.business_trigger).toContain("Members experience long calls");
    expect(values.problem_statement).toContain("Members experience long calls");
    expect(values.affected_function_process).toContain("Claims status");
    expect(values.scope_out).toContain("Clinical decisions");
    expect(values.initial_value_hypothesis).toContain(
      "Reduce avoidable handle time",
    );
    expect(values.outcomes_success).toContain("Lower handle time");
    expect(values.discovery_questions).toContain("Hypothesis");
    expect(values.stakeholder_owner_view).toContain("Chief Digital");
    expect(values.known_evidence).toContain("Member-service metrics");
    expect(values.missing_evidence_open_questions).toContain(
      "P1/P2 must validate",
    );
    expect(values.recommendation_to_advance).toContain("Advance to P1 Charter");

    const evaluation = evaluatePhaseCapture(0, values);
    expect(evaluation.complete).toBe(true);
    expect(evaluation.missing).toEqual([]);
  });

  it("still reads the legacy blended scope_boundary field for Moves originated before the scope split", () => {
    const values = buildP0PhaseCaptureValues({
      name: "Legacy Move",
      problemStatement: "Problem statement.",
      charter: {
        scaffold: {
          problem_statement: "Problem statement.",
          scope_boundary: "In: claims status. Out: clinical decisions.",
        },
      },
    });

    expect(values.affected_function_process).toContain("claims status");
  });

  it("stays incomplete when the saved charter is missing required P0 inputs", () => {
    const values = buildP0PhaseCaptureValues({
      name: "Thin Move",
      problemStatement: "Problem only.",
      charter: { scaffold: { problem_statement: "Problem only." } },
    });

    const evaluation = evaluatePhaseCapture(0, values);
    expect(evaluation.complete).toBe(false);
    expect(evaluation.missing).toContain("Initial value hypothesis");
    expect(evaluation.missing).toContain("Outcome owner and stakeholder view");
    expect(evaluation.missing).toContain("Known evidence");
  });
});

describe("P0 source fallback preserves recorded capture", () => {
  const source = {
    problemStatement:
      "Business trigger: Original declared trigger.\nProblem statement: Original declared problem.",
    targetOutcome: "Declared outcome",
    timelineHorizon: "Known foundation",
    charter: {
      scaffold: {
        scope_in: "Declared scope",
        scope_out: "Excluded scope",
        sponsor_candidate: "Proposed sponsor role",
        evidence_family: "Original sources",
        outcomes_success: "Success criteria",
        discovery_questions: "Validation questions",
      },
    },
  };
  const reviewed = {
    ...buildP0PhaseCaptureValues(source, { separateDeclaredSignal: true }),
    business_trigger: "Reviewed trigger with its source retained.",
    stakeholder_owner_view: "Reviewed owner role and caveat retained.",
    known_evidence: "Reviewed source references retained exactly.",
    recommendation_to_advance: "Reviewed recommendation and caveat retained.",
  };
  function writer(values: Record<string, unknown>, error: unknown = null) {
    const writes: Array<Record<string, unknown>> = [];
    const rows = Object.entries(values).map(([key, value]) => ({
      id: key,
      module_key: phaseCaptureModuleKey(0, key),
      state_jsonb: { value },
    }));
    const query: Record<string, unknown> = {};
    query.select = jest.fn(() => query);
    query.eq = jest.fn(() => query);
    query.in = jest.fn(async () => ({ data: rows, error }));
    query.update = jest.fn((payload) => {
      writes.push(payload);
      return query;
    });
    query.insert = jest.fn(async (payload) => {
      writes.push(payload);
      return { error: null };
    });
    query.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ error: null }).then(resolve);
    jest
      .mocked(getAzureWriteFluentClient)
      .mockReturnValue({ from: jest.fn(() => query) } as never);
    return { writes, query };
  }
  afterEach(() => jest.mocked(isFeatureEnabled).mockReturnValue(false));

  it("reports the one missing recommendation without overwriting any of eleven recorded fields", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
    const captured = { ...reviewed, recommendation_to_advance: "" };
    const { writes } = writer(captured);
    const result = await persistP0PhaseCaptureFromSource(
      { clientId: "tenant-a", userId: "user-a" },
      "move-a",
      source,
    );
    expect(result).toEqual({
      complete: false,
      missing: ["Recommendation to advance"],
      values: captured,
      persisted: false,
    });
    expect(writes).toEqual([]);
    for (const key of Object.keys(captured))
      expect(result.values[key]).toBe(captured[key as keyof typeof captured]);
  });
  it("preserves deliberately blank existing capture instead of restoring old source words", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
    const captured = Object.fromEntries(
      Object.keys(reviewed).map((key) => [key, ""]),
    );
    const { writes } = writer(captured);
    const result = await persistP0PhaseCaptureFromSource(
      { clientId: "tenant-a", userId: "user-a" },
      "move-a",
      source,
    );
    expect(result.values).toEqual(captured);
    expect(result.complete).toBe(false);
    expect(result.persisted).toBe(false);
    expect(writes).toEqual([]);
  });
  it("reads the complete stored capture even when the old source scaffold is incomplete", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
    const { writes } = writer(reviewed);
    const result = await persistP0PhaseCaptureFromSource(
      { clientId: "tenant-a", userId: "user-a" },
      "move-a",
      { problemStatement: "Thin source" },
    );
    expect(result).toEqual({
      complete: true,
      missing: [],
      values: reviewed,
      persisted: false,
    });
    expect(writes).toEqual([]);
  });
  it("refuses a failed or malformed stored read instead of treating it as a new Move", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
    const unavailable = writer(
      reviewed,
      new Error("stored capture unavailable"),
    );
    await expect(
      persistP0PhaseCaptureFromSource(
        { clientId: "tenant-a", userId: "user-a" },
        "move-a",
        source,
      ),
    ).rejects.toThrow("stored capture unavailable");
    expect(unavailable.writes).toEqual([]);
    const malformed = writer({
      ...reviewed,
      business_trigger: { unknown: true },
    });
    await expect(
      persistP0PhaseCaptureFromSource(
        { clientId: "tenant-a", userId: "user-a" },
        "move-a",
        source,
      ),
    ).rejects.toThrow("stored capture value unavailable");
    expect(malformed.writes).toEqual([]);
  });
  it("retains the legacy source fallback with the flag disabled", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(false);
    const { writes } = writer(reviewed);
    const result = await persistP0PhaseCaptureFromSource(
      { clientId: "tenant-a", userId: "user-a" },
      "move-a",
      source,
    );
    expect(result.persisted).toBe(true);
    expect(result.values.business_trigger).toBe(source.problemStatement);
    expect(writes).toHaveLength(11);
  });
});

// Pure model and in-memory transaction proof; no database connection is made.
import {
  previewP0ReviewedCaptureCorrection,
  p0SignatureRevision,
} from "../p0-reviewed-capture-correction";
import {
  restoreP0ReviewedCapture,
  type P0CorrectionCommand,
} from "@/lib/data-plane/write-adapters/p0ReviewedCaptureCorrectionAdapter";
import type { PhaseSnapshot } from "../types.db";
import { getPhaseCaptureSections } from "../phase-capture-contract";

function reviewedCorrectionFixture() {
  const charter = {
    business_trigger: "Reviewed trigger",
    sponsor_candidate: "Reviewed owner",
    known_evidence: "Reviewed evidence",
    recommendation_to_advance: "Reviewed recommendation",
    preserved: "Keep source",
  };
  const program = {
    id: "move-correction",
    client_id: "tenant-correction",
    current_phase: 1,
    lifecycle_state: "submitted_for_approval",
    charter,
  };
  const snapshot = {
    id: "snapshot-correction",
    engagement_id: program.id,
    phase_number: 0,
    phase_name: null,
    snapshot_jsonb: { humanRationale: "Recorded approval words" },
    locked_by_user_id: "actor-correction",
    locked_at: "2026-10-12T11:00:00Z",
    approval_status: "approved",
    created_at: "2026-10-12T11:00:00Z",
  };
  const signed = {
    id: "brief-correction",
    engagement_id: program.id,
    deliverable_type_key: "origination_brief",
    status: "signed_off",
    current_version: 1,
    signed_off_version: 1,
    signed_off_by: snapshot.locked_by_user_id,
    signed_off_at: snapshot.locked_at,
    requires_revalidation: false,
    structured_data: { signedWords: "Immutable version one" },
    extra_binding: "Keep all columns",
  };
  const requests = [
    {
      id: "request-correction",
      program_id: program.id,
      request_status: "pending",
      brief_snapshot: { original: true },
    },
  ];
  const modules = getPhaseCaptureSections(0).map((section) => ({
    id: `module-${section.key}`,
    engagement_id: program.id,
    phase_number: 0,
    module_key: phaseCaptureModuleKey(0, section.key),
    status: "completed",
    state_jsonb: { value: `Stored ${section.key}`, untouched: "Keep metadata" },
  }));
  modules.push(
    ...["p0_signal_step", "p0_owner_evidence_step"].map((key) => ({
      id: `module-${key}`,
      engagement_id: program.id,
      phase_number: 0,
      module_key: phaseCaptureModuleKey(0, key),
      status: "completed",
      state_jsonb: {
        untouched: "Keep metadata",
        value: JSON.stringify({
          version: 1,
          entries:
            key === "p0_signal_step"
              ? {
                  business_trigger: {
                    text: charter.business_trigger,
                    source: "team",
                    status: "accepted",
                  },
                }
              : {
                  stakeholder_owner_view: {
                    text: charter.sponsor_candidate,
                    source: "team",
                    status: "accepted",
                  },
                  known_evidence: {
                    text: charter.known_evidence,
                    source: "team",
                    status: "accepted",
                  },
                },
        }),
      },
    })),
  );
  modules.push({
    id: "p1-module",
    engagement_id: program.id,
    phase_number: 1,
    module_key: phaseCaptureModuleKey(1, "scope_outcome"),
    status: "completed",
    state_jsonb: {
      value: "Preserve completed P1 capture",
      untouched: "Keep basis metadata",
    },
  });
  const ctx = {
    clientId: program.client_id,
    clientKey: "tenant-correction",
    userId: snapshot.locked_by_user_id,
  };
  const canonicalSnapshot = {
    id: snapshot.id,
    engagementId: program.id,
    phaseNumber: 0,
    phaseName: null,
    snapshot: snapshot.snapshot_jsonb,
    lockedByUserId: snapshot.locked_by_user_id,
    lockedAt: snapshot.locked_at,
    approvalStatus: "approved",
    createdAt: snapshot.created_at,
  } as PhaseSnapshot;
  const previewInput = () => ({
    program: { id: program.id, currentPhase: program.current_phase, charter },
    actorId: ctx.userId,
    modules: modules
      .filter((row) => row.phase_number === 0)
      .map((row) => ({
        id: row.id,
        moduleKey: row.module_key,
        status: row.status,
        state: row.state_jsonb,
      })),
    snapshots: [canonicalSnapshot],
    signedBrief: signed,
  });
  const preview = previewP0ReviewedCaptureCorrection(previewInput());
  if (preview.state !== "available")
    throw new Error("test correction fixture unavailable");
  const command: P0CorrectionCommand = {
    expectedRevision: preview.captureRevision,
    sourceRevision: preview.sourceRevision,
    snapshotId: preview.snapshotId,
    snapshotRevision: preview.snapshotRevision,
    signatureRevision: preview.signatureRevision,
    rationale: "Restore the retained reviewed source.",
  };
  return {
    program,
    snapshot,
    signed,
    requests,
    modules,
    ctx,
    canonicalSnapshot,
    previewInput,
    preview,
    command,
  };
}

describe("retained reviewed P0 capture correction", () => {
  beforeEach(() => {
    jest.mocked(isFeatureEnabled).mockReturnValue(true);
    mockCorrectionPolicy.mockResolvedValue({
      clientId: "tenant-correction",
      userId: "actor-correction",
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockCorrectionConnection.mockReturnValue({
      candidates: ["mock-tenant-connection"],
    });
    mockCorrectionTransaction.mockReset();
  });
  it("previews only four retained fields while preserving all other capture words", () => {
    const fixture = reviewedCorrectionFixture();
    expect(fixture.preview.fields.map((field) => field.key)).toEqual([
      "business_trigger",
      "stakeholder_owner_view",
      "known_evidence",
      "recommendation_to_advance",
    ]);
    expect(fixture.preview.fields.map((field) => field.retained)).toEqual([
      "Reviewed trigger",
      "Reviewed owner",
      "Reviewed evidence",
      "Reviewed recommendation",
    ]);
    fixture.preview.fields.forEach((field) => {
      fixture.modules.find(
        (row) => row.id === field.moduleId,
      )!.state_jsonb.value = field.retained;
    });
    expect(previewP0ReviewedCaptureCorrection(fixture.previewInput())).toEqual({
      state: "consistent",
    });
  });
  it.each([
    "phase",
    "actor",
    "latest",
    "foreign",
    "signature",
    "version",
    "revalidation",
    "source",
    "sidecar",
    "sidecar_words",
    "snapshot_actor",
    "duplicate",
    "malformed",
  ])("refuses an unverified %s preview", (failure) => {
    const f = reviewedCorrectionFixture();
    const input = f.previewInput();
    if (failure === "phase") input.program.currentPhase = 2;
    if (failure === "actor") input.actorId = "another-actor";
    if (failure === "latest")
      input.snapshots.unshift({
        ...f.canonicalSnapshot,
        approvalStatus: "pending",
      });
    if (failure === "foreign")
      input.snapshots[0] = {
        ...f.canonicalSnapshot,
        engagementId: "another-move",
      };
    if (failure === "signature")
      input.signedBrief.signed_off_by = "another-actor";
    if (failure === "version") input.signedBrief.current_version = 2;
    if (failure === "revalidation")
      input.signedBrief.requires_revalidation = true;
    if (failure === "source") input.program.charter.business_trigger = "";
    if (failure === "sidecar")
      input.modules.find((row) =>
        row.moduleKey.endsWith("p0_signal_step"),
      )!.state.value = "{}";
    if (failure === "snapshot_actor")
      input.snapshots[0].lockedByUserId = "other-recorded-approver";
    if (failure === "sidecar_words")
      input.modules.find((row) =>
        row.moduleKey.endsWith("p0_signal_step"),
      )!.state.value = JSON.stringify({
        version: 1,
        entries: {
          business_trigger: {
            text: "Different accepted words",
            source: "team",
            status: "accepted",
          },
        },
      });
    if (failure === "duplicate") input.modules.push(input.modules[0]);
    if (failure === "malformed")
      (input.modules[0].state as Record<string, unknown>).value = 42;
    expect(previewP0ReviewedCaptureCorrection(input).state).not.toBe(
      "available",
    );
  });
  function transactionFixture(failure?: string) {
    const f = reviewedCorrectionFixture();
    const before = structuredClone({
      program: f.program,
      snapshot: f.snapshot,
      signed: f.signed,
      requests: f.requests,
      modules: f.modules,
    });
    let rows = structuredClone(before);
    let audited = false;
    let auditValues: Record<string, unknown> | undefined;
    const auditSchema = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260430140000_program_audit_log.sql",
      ),
      "utf8",
    );
    const identityTypes = new Map(
      [
        ...auditSchema.matchAll(
          /^\s*(program_id|engagement_id)\s+(TEXT|UUID)\b/gm,
        ),
      ].map((match) => [match[1], match[2]]),
    );
    if (
      identityTypes.get("program_id") !== "TEXT" ||
      identityTypes.get("engagement_id") !== "UUID"
    )
      throw new Error("Declared audit identity schema changed");
    const statements: string[] = [];
    const connection = {
      release: jest.fn(),
      query: jest.fn(async (sql: string, params: unknown[] = []) => {
        statements.push(sql);
        if (
          sql === "BEGIN ISOLATION LEVEL SERIALIZABLE" ||
          sql.startsWith("SET LOCAL")
        )
          return { command: "BEGIN", rows: [], rowCount: 0 };
        if (sql === "ROLLBACK") {
          rows = structuredClone(before);
          audited = false;
          auditValues = undefined;
          return { command: "ROLLBACK", rows: [], rowCount: 0 };
        }
        if (sql === "COMMIT") {
          if (failure === "commit") throw new Error("commit_unconfirmed");
          return { command: "COMMIT", rows: [], rowCount: 0 };
        }
        if (sql.startsWith("UPDATE program_modules")) {
          const row = rows.modules.find((item) => item.id === params[1])!;
          row.state_jsonb = JSON.parse(String(params[0]));
          if (failure === "update_readback")
            row.state_jsonb.value = "Unconfirmed update";
          return {
            command: "UPDATE",
            rows: [structuredClone(row)],
            rowCount: 1,
          };
        }
        if (sql.startsWith("INSERT INTO program_audit_log")) {
          if (failure === "audit") throw new Error("audit_insert_failed");
          const insert = sql.match(
            /program_audit_log\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/,
          );
          if (!insert) throw new Error("Audit insert bindings unavailable");
          const columns = insert[1].split(",").map((value) => value.trim());
          const bindings = insert[2].split(",").map((value) => value.trim());
          const programBinding = bindings[columns.indexOf("program_id")];
          const engagementBinding = bindings[columns.indexOf("engagement_id")];
          // The schema requires TEXT and UUID; one uncast parameter cannot infer both.
          if (
            /^\$\d+$/.test(programBinding) &&
            programBinding === engagementBinding &&
            identityTypes.get("program_id") !==
              identityTypes.get("engagement_id")
          )
            throw Object.assign(
              new Error(
                "inconsistent types deduced for parameter " + programBinding,
              ),
              { code: "42P08", detail: "text versus uuid" },
            );
          auditValues = Object.fromEntries(
            columns.map((column, index) => {
              const parameter = bindings[index].match(
                /^\$(\d+)(?:::\w+(?:\[\])?)?$/,
              );
              if (!parameter) throw new Error("Audit parameter unavailable");
              return [column, params[Number(parameter[1]) - 1]];
            }),
          );
          audited = true;
          return {
            command: "INSERT",
            rows: [{ id: "audit-correction" }],
            rowCount: 1,
          };
        }
        if (audited && failure === "program_preserved")
          rows.program.lifecycle_state = "approved";
        if (audited && failure === "snapshot_preserved")
          rows.snapshot.snapshot_jsonb.humanRationale = "Changed approval";
        if (audited && failure === "signed_preserved")
          rows.signed.extra_binding = "Changed signed row";
        if (audited && failure === "request_preserved")
          rows.requests[0].request_status = "approved";
        if (audited && failure === "sidecar_preserved")
          rows.modules.find((row) =>
            row.module_key.endsWith("p0_signal_step"),
          )!.state_jsonb.value = "Changed sidecar";
        if (audited && failure === "p1_preserved")
          rows.modules.find(
            (row) => row.phase_number === 1,
          )!.state_jsonb.value = "Changed P1 words";
        if (audited && failure === "status_preserved")
          rows.modules[0].status = "in_progress";
        const selected = sql.includes("FROM engagements")
          ? [rows.program]
          : sql.includes("FROM phase_snapshots")
            ? [rows.snapshot]
            : sql.includes("FROM deliverables_v2")
              ? [rows.signed]
              : sql.includes("FROM program_approval_requests")
                ? rows.requests
                : sql.includes("FROM program_modules")
                  ? rows.modules
                  : [];
        return {
          command: "SELECT",
          rows: structuredClone(selected),
          rowCount: selected.length,
        };
      }),
    };
    const actual = jest.requireActual<
      typeof import("@/lib/data-plane/postgresCompat")
    >("@/lib/data-plane/postgresCompat");
    mockCorrectionTransaction.mockImplementation(
      (connectionString, work, options) =>
        actual.withAzureWriteTransaction(connectionString, work, {
          ...options,
          connect: async () => connection as never,
        }),
    );
    return {
      f,
      before,
      statements,
      connection,
      get stored() {
        return rows;
      },
      get audited() {
        return audited;
      },
      get auditValues() {
        return auditValues;
      },
    };
  }
  it("commits exact retained input and audit together, with preserved statuses, sidecars and approval bindings", async () => {
    const t = transactionFixture();
    const result = await restoreP0ReviewedCapture(
      t.f.ctx,
      t.f.program.id,
      t.f.command,
    );
    expect(result).toMatchObject({
      persisted: true,
      correctionAuditId: "audit-correction",
      signedOffVersion: 1,
      preservedBindings: true,
    });
    expect(t.statements[0]).toBe("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(t.statements.at(-1)).toBe("COMMIT");
    expect(t.audited).toBe(true);
    expect(t.stored.program).toEqual(t.before.program);
    expect(t.stored.snapshot).toEqual(t.before.snapshot);
    expect(t.stored.signed).toEqual(t.before.signed);
    expect(t.stored.requests).toEqual(t.before.requests);
    const changed = new Set(t.f.preview.fields.map((field) => field.moduleId));
    expect(t.stored.modules.filter((row) => !changed.has(row.id))).toEqual(
      t.before.modules.filter((row) => !changed.has(row.id)),
    );
    for (const field of t.f.preview.fields) {
      const after = t.stored.modules.find((row) => row.id === field.moduleId)!;
      expect(after.state_jsonb.value).toBe(field.retained);
      expect(after.status).toBe("completed");
      expect(after.state_jsonb.untouched).toBe("Keep metadata");
      expect(result.values[field.key]).toBe(field.retained);
    }
  });
  it("binds both schema-typed audit identities to the same Move without conflicting parameter inference", async () => {
    const t = transactionFixture();
    const result = await restoreP0ReviewedCapture(
      { ...t.f.ctx, role: "admin" },
      t.f.program.id,
      t.f.command,
    );
    expect(t.auditValues).toMatchObject({
      tenant_key: t.f.ctx.clientKey,
      program_id: t.f.program.id,
      engagement_id: t.f.program.id,
      actor_id: t.f.ctx.userId,
      actor_role: "admin",
      action: "phase_capture_reviewed_input_corrected",
      from_state: t.f.preview.captureRevision,
      to_state: result.revision,
      rationale: t.f.command.rationale,
      evidence_refs: expect.arrayContaining([
        t.f.snapshot.id,
        t.f.signed.id,
        t.f.preview.sourceRevision,
        ...t.f.preview.fields.map((field) => field.moduleId),
      ]),
    });
    expect(t.statements.at(-1)).toBe("COMMIT");
  });
  it("uses the declared synthetic shared transport through the real resolver and transaction boundary", async () => {
    const declarations =
      await import("../../../../datasets/tenant-inputs/tenant-input-registry.json");
    const synthetic = declarations.activeTenants.find(
      (tenant) =>
        tenant.packets.length > 0 &&
        tenant.packets.every(
          (packet) => packet.classification === "synthetic-demo",
        ),
    );
    if (!synthetic) throw new Error("Declared synthetic fixture required");
    const t = transactionFixture();
    t.f.ctx.clientKey = synthetic.tenantKey;
    const previousEnv = process.env;
    const fixtureUrl = "postgresql://fixture:fixture@localhost:1/fixture";
    process.env = { NODE_ENV: "test", DATABASE_URL: fixtureUrl };
    const actualResolver = jest.requireActual<
      typeof import("@/lib/data-plane/tenantConnectionResolver")
    >("@/lib/data-plane/tenantConnectionResolver");
    mockCorrectionConnection.mockImplementation(
      actualResolver.resolveTenantDatabaseConnection,
    );
    try {
      // The scoped resolver has no URL in this established synthetic shape.
      expect(
        actualResolver.resolveTenantDatabaseConnection(t.f.ctx).candidates,
      ).toEqual([]);
      const result = await restoreP0ReviewedCapture(
        t.f.ctx,
        t.f.program.id,
        t.f.command,
      );
      expect(result).toMatchObject({
        persisted: true,
        correctionAuditId: "audit-correction",
        preservedBindings: true,
      });
      expect(mockCorrectionTransaction).toHaveBeenCalledWith(
        fixtureUrl,
        expect.any(Function),
        { includeReads: true },
      );
      expect(t.statements[0]).toBe("BEGIN ISOLATION LEVEL SERIALIZABLE");
      expect(t.statements.at(-1)).toBe("COMMIT");
      expect(t.stored.program).toEqual(t.before.program);
      expect(t.stored.snapshot).toEqual(t.before.snapshot);
      expect(t.stored.signed).toEqual(t.before.signed);
      expect(t.stored.requests).toEqual(t.before.requests);
    } finally {
      process.env = previousEnv;
    }
  });
  it("prefers declared tenant URLs and refuses shared transport for private, unknown or explicitly bound deployments", async () => {
    const actualResolver = jest.requireActual<
      typeof import("@/lib/data-plane/tenantConnectionResolver")
    >("@/lib/data-plane/tenantConnectionResolver");
    mockCorrectionConnection.mockImplementation(
      actualResolver.resolveTenantDatabaseConnection,
    );
    const { resolveP0ReviewedCaptureConnection } =
      await import("@/lib/data-plane/write-adapters/p0ReviewedCaptureCorrectionAdapter");
    const declarations =
      await import("../../../../datasets/tenant-inputs/tenant-input-registry.json");
    const { TENANT_KEY_ALIASES, canonicalTenantKey } =
      await import("@/lib/tenant-keys");
    const synthetic = declarations.activeTenants.find(
      (tenant) =>
        tenant.packets.length > 0 &&
        tenant.packets.every(
          (packet) => packet.classification === "synthetic-demo",
        ),
    );
    if (!synthetic) throw new Error("Declared synthetic fixture required");
    const ctx = {
      ...reviewedCorrectionFixture().ctx,
      clientKey: synthetic.tenantKey,
    };
    const shared = "postgresql://fixture:fixture@localhost:1/shared";
    const scoped = "postgresql://fixture:fixture@localhost:1/scoped";
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      DATABASE_URL: shared,
      ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK: "true",
    };
    const tenantName = actualResolver.tenantDatabaseEnvNamesForScope(ctx)[0];
    expect(
      resolveP0ReviewedCaptureConnection(ctx, { ...env, [tenantName]: scoped }),
    ).toBe(scoped);
    expect(resolveP0ReviewedCaptureConnection(ctx, env)).toBe(shared);
    expect(
      resolveP0ReviewedCaptureConnection(ctx, { NODE_ENV: "test" }),
    ).toBeUndefined();
    expect(
      resolveP0ReviewedCaptureConnection(
        { ...ctx, clientKey: "unregistered-private-fixture" },
        env,
      ),
    ).toBeUndefined();
    expect(
      resolveP0ReviewedCaptureConnection(ctx, {
        ...env,
        ABARVA_ACTIVE_CLIENT_KEY: ctx.clientKey,
      }),
    ).toBeUndefined();
    expect(
      resolveP0ReviewedCaptureConnection(ctx, {
        ...env,
        ABARVA_ACTIVE_CLIENT_ID: "another-plane",
      }),
    ).toBeUndefined();
    const alias = Object.keys(TENANT_KEY_ALIASES).find(
      (candidate) =>
        candidate !== ctx.clientKey &&
        canonicalTenantKey(candidate) === ctx.clientKey,
    );
    if (!alias) throw new Error("Declared tenant alias fixture required");
    expect(
      resolveP0ReviewedCaptureConnection(
        { ...ctx, clientKey: alias },
        { ...env, [tenantName]: scoped },
      ),
    ).toBe(scoped);
    expect(
      resolveP0ReviewedCaptureConnection(
        { ...ctx, clientKey: alias },
        { ...env, ABARVA_ACTIVE_CLIENT_ID: "another-plane" },
      ),
    ).toBeUndefined();
    const aliasName = actualResolver.tenantDatabaseEnvNamesForScope({
      ...ctx,
      clientKey: alias,
    })[0];
    expect(
      resolveP0ReviewedCaptureConnection(
        { ...ctx, clientKey: alias },
        { ...env, [aliasName]: scoped },
      ),
    ).toBe(scoped);
    expect(mockCorrectionTransaction).not.toHaveBeenCalled();
  });
  it.each([
    "expectedRevision",
    "sourceRevision",
    "snapshotId",
    "snapshotRevision",
    "signatureRevision",
  ] as const)("refuses a stale %s without writing", async (field) => {
    const t = transactionFixture();
    await expect(
      restoreP0ReviewedCapture(t.f.ctx, t.f.program.id, {
        ...t.f.command,
        [field]:
          field === "expectedRevision"
            ? "stale"
            : field === "snapshotId"
              ? "foreign-snapshot"
              : "a".repeat(64),
      }),
    ).rejects.toMatchObject({
      code: "correction_stale_binding",
      transactionOutcome: "rolled_back",
    });
    expect(t.statements.some((sql) => sql.startsWith("UPDATE"))).toBe(false);
    expect(t.stored).toEqual(t.before);
  });
  it.each([
    "update_readback",
    "audit",
    "program_preserved",
    "snapshot_preserved",
    "signed_preserved",
    "request_preserved",
    "sidecar_preserved",
    "status_preserved",
    "p1_preserved",
  ])("rolls every correction back when %s fails", async (failure) => {
    const t = transactionFixture(failure);
    await expect(
      restoreP0ReviewedCapture(t.f.ctx, t.f.program.id, t.f.command),
    ).rejects.toMatchObject({ transactionOutcome: "rolled_back" });
    expect(t.statements).toContain("ROLLBACK");
    expect(t.statements).not.toContain("COMMIT");
    expect(t.stored).toEqual(t.before);
    expect(t.audited).toBe(false);
  });
  it("reports an unknown outcome if commit confirmation is lost", async () => {
    const t = transactionFixture("commit");
    await expect(
      restoreP0ReviewedCapture(t.f.ctx, t.f.program.id, t.f.command),
    ).rejects.toMatchObject({ transactionOutcome: "unknown" });
  });
  it.each([
    "permission",
    "actor",
    "tenant",
    "allowed-move",
    "phase",
    "flag",
    "intake-flag",
    "connection",
  ])("checks current %s authority before any write", async (failure) => {
    const t = transactionFixture();
    if (failure === "permission")
      mockCorrectionPolicy.mockResolvedValue({
        clientId: t.f.ctx.clientId,
        userId: t.f.ctx.userId,
        programIdsAllowed: null,
        canApproveGates: false,
      });
    if (failure === "actor") t.f.ctx.userId = "new-actor";
    if (failure === "tenant") t.f.ctx.clientId = "other-tenant";
    if (failure === "allowed-move")
      mockCorrectionPolicy.mockResolvedValue({
        clientId: t.f.ctx.clientId,
        userId: t.f.ctx.userId,
        programIdsAllowed: ["other-move"],
        canApproveGates: true,
      });
    if (failure === "phase") t.stored.program.current_phase = 2;
    if (failure === "flag")
      jest.mocked(isFeatureEnabled).mockReturnValue(false);
    if (failure === "intake-flag")
      jest
        .mocked(isFeatureEnabled)
        .mockImplementation(
          (_ctx, flag) => flag !== "moves_extended_intake_fields_v1",
        );
    if (failure === "connection")
      mockCorrectionConnection.mockReturnValue({ candidates: [] });
    await expect(
      restoreP0ReviewedCapture(t.f.ctx, t.f.program.id, t.f.command),
    ).rejects.toBeInstanceOf(Error);
    expect(t.statements.some((sql) => sql.startsWith("UPDATE"))).toBe(false);
  });
  it("binds signed version changes to a new signature revision", () => {
    const f = reviewedCorrectionFixture();
    expect(p0SignatureRevision({ ...f.signed, current_version: 2 })).not.toBe(
      f.preview.signatureRevision,
    );
  });
});
