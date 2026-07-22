import {
  insertArtifactAcceptance,
  listArtifactAcceptances,
  getLatestArtifactAcceptance,
  getLatestArtifactAcceptancesByArtifactIds,
} from "../artifact-acceptances";

const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "acceptance-1",
  artifact_id: "artifact-1",
  event_id: "event-1",
  stage_key: "responses",
  artifact_state: "approved_for_external_use",
  authoritative_version_id: "artifact-1",
  artifact_role: "evidence",
  content_drift_status: "current",
  gate_precondition_status: "ready",
  downstream_context_policy: "restricted",
  diff_summary: null,
  approval_rationale: "Vendor coverage matrix reviewed.",
  accepted_by: "clerk-user-1",
  accepted_at: "2026-07-22T00:00:00.000Z",
  created_at: "2026-07-22T00:00:00.000Z",
  ...overrides,
});

/** A minimal chainable fake matching the subset of the fluent client this module uses. */
function fakeDb(opts: {
  insertResult?: { data: unknown; error: unknown };
  selectResult?: { data: unknown; error: unknown };
}) {
  const insertCall = jest.fn();
  const chain: Record<string, unknown> = {
    insert: (payload: unknown) => {
      insertCall(payload);
      return chain;
    },
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    single: async () => opts.insertResult ?? { data: null, error: null },
    maybeSingle: async () => opts.selectResult ?? { data: null, error: null },
  };
  // `listArtifactAcceptances` awaits the query directly (no terminal
  // .single()/.maybeSingle() call) — make the chain itself awaitable.
  (chain as unknown as { then: unknown }).then = (
    resolve: (value: unknown) => unknown,
  ) => resolve(opts.selectResult ?? { data: [], error: null });
  return {
    from: jest.fn(() => chain),
    insertCall,
  };
}

describe("artifact-acceptances repository", () => {
  it("inserts an acceptance and maps the row back to camelCase", async () => {
    const db = fakeDb({ insertResult: { data: row(), error: null } });
    const result = await insertArtifactAcceptance(
      {
        artifactId: "artifact-1",
        eventId: "event-1",
        stageKey: "responses",
        artifactState: "approved_for_external_use",
        authoritativeVersionId: "artifact-1",
        artifactRole: "evidence",
        contentDriftStatus: "current",
        gatePreconditionStatus: "ready",
        downstreamContextPolicy: "restricted",
        approvalRationale: "Vendor coverage matrix reviewed.",
        acceptedBy: "clerk-user-1",
      },
      db as never,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.record).toEqual({
      id: "acceptance-1",
      artifactId: "artifact-1",
      eventId: "event-1",
      stageKey: "responses",
      artifactState: "approved_for_external_use",
      authoritativeVersionId: "artifact-1",
      artifactRole: "evidence",
      contentDriftStatus: "current",
      gatePreconditionStatus: "ready",
      downstreamContextPolicy: "restricted",
      diffSummary: null,
      approvalRationale: "Vendor coverage matrix reviewed.",
      acceptedBy: "clerk-user-1",
      acceptedAt: "2026-07-22T00:00:00.000Z",
      createdAt: "2026-07-22T00:00:00.000Z",
    });
    expect(db.insertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        artifact_id: "artifact-1",
        approval_rationale: "Vendor coverage matrix reviewed.",
        diff_summary: null,
      }),
    );
  });

  it("returns ok:false with the DB error message on insert failure, never throws", async () => {
    const db = fakeDb({
      insertResult: { data: null, error: { message: "constraint violation" } },
    });
    const result = await insertArtifactAcceptance(
      {
        artifactId: "artifact-1",
        eventId: "event-1",
        stageKey: "responses",
        artifactState: "ai_draft",
        authoritativeVersionId: "artifact-1",
        artifactRole: "evidence",
        contentDriftStatus: "unknown",
        gatePreconditionStatus: "not_ready",
        downstreamContextPolicy: "restricted",
        approvalRationale: "x",
        acceptedBy: "clerk-user-1",
      },
      db as never,
    );
    expect(result).toEqual({ ok: false, error: "constraint violation" });
  });

  it("getLatestArtifactAcceptance returns null when none exists, never throws", async () => {
    const db = fakeDb({ selectResult: { data: null, error: null } });
    await expect(
      getLatestArtifactAcceptance("artifact-none", db as never),
    ).resolves.toBeNull();
  });

  it("getLatestArtifactAcceptance maps a found row", async () => {
    const db = fakeDb({ selectResult: { data: row(), error: null } });
    const result = await getLatestArtifactAcceptance("artifact-1", db as never);
    expect(result?.id).toBe("acceptance-1");
    expect(result?.artifactState).toBe("approved_for_external_use");
  });

  it("listArtifactAcceptances returns an empty array on a query error, never throws", async () => {
    const db = fakeDb({ selectResult: { data: null, error: { message: "boom" } } });
    await expect(listArtifactAcceptances("artifact-1", db as never)).resolves.toEqual([]);
  });

  it("getLatestArtifactAcceptancesByArtifactIds short-circuits on an empty id list", async () => {
    const db = fakeDb({});
    const result = await getLatestArtifactAcceptancesByArtifactIds([], db as never);
    expect(result.size).toBe(0);
    expect(db.from).not.toHaveBeenCalled();
  });

  it("getLatestArtifactAcceptancesByArtifactIds keeps only the first (latest) row per artifact", async () => {
    const db = fakeDb({
      selectResult: {
        data: [
          row({ id: "a-2", artifact_id: "artifact-1", accepted_at: "2026-07-22T02:00:00.000Z" }),
          row({ id: "a-1", artifact_id: "artifact-1", accepted_at: "2026-07-22T01:00:00.000Z" }),
          row({ id: "b-1", artifact_id: "artifact-2", accepted_at: "2026-07-22T01:30:00.000Z" }),
        ],
        error: null,
      },
    });
    const result = await getLatestArtifactAcceptancesByArtifactIds(
      ["artifact-1", "artifact-2"],
      db as never,
    );
    expect(result.get("artifact-1")?.id).toBe("a-2");
    expect(result.get("artifact-2")?.id).toBe("b-1");
  });
});
