import {
  assertValidLifecycleTransition,
  getAuthoritativeVersion,
  projectLifecycleState,
  type LifecycleEventProjectionRow,
} from "../deliverable-lifecycle";

const event = (
  event_type: LifecycleEventProjectionRow["event_type"],
  patch: Partial<LifecycleEventProjectionRow> = {},
): LifecycleEventProjectionRow => ({
  event_type,
  origin: null,
  decision: null,
  exception_flag: false,
  source_file_checksum: null,
  created_at: "2026-07-23T00:00:00Z",
  ...patch,
});

describe("deliverable lifecycle projection", () => {
  it("projects valid ai draft approval flow", () => {
    const events = [
      event("version_created", { origin: "ai_generated" }),
      event("submitted_for_review"),
      event("approval_granted", { decision: "approved" }),
    ];
    expect(projectLifecycleState(events)).toBe("human_approved");
  });

  it("projects client-uploaded approved-final exception to client_final", () => {
    const events = [
      event("version_created", { origin: "client_uploaded" }),
      event("marked_authoritative", {
        origin: "client_uploaded",
        decision: "client_final",
        exception_flag: true,
      }),
    ];
    expect(projectLifecycleState(events)).toBe("client_final");
  });

  it("projects revocation back to in_review", () => {
    const events = [
      event("version_created", { origin: "ai_generated" }),
      event("submitted_for_review"),
      event("approval_granted", { decision: "approved" }),
      event("approval_revoked", { decision: "rejected" }),
    ];
    expect(projectLifecycleState(events)).toBe("in_review");
  });

  it("projects supersession as terminal", () => {
    const events = [
      event("version_created", { origin: "ai_generated" }),
      event("submitted_for_review"),
      event("approval_granted", { decision: "approved" }),
      event("authority_replaced"),
      event("superseded"),
    ];
    expect(projectLifecycleState(events)).toBe("superseded");
  });
});

describe("deliverable lifecycle transition validation", () => {
  it("accepts every valid transition in the Phase 1 table", () => {
    expect(
      assertValidLifecycleTransition(null, {
        eventType: "version_created",
        origin: "ai_generated",
      }),
    ).toBe("ai_draft");
    expect(
      assertValidLifecycleTransition(null, {
        eventType: "version_created",
        origin: "client_uploaded",
      }),
    ).toBe("in_review");
    expect(assertValidLifecycleTransition("ai_draft", { eventType: "submitted_for_review" })).toBe(
      "in_review",
    );
    expect(assertValidLifecycleTransition("in_review", { eventType: "changes_requested" })).toBe(
      "changes_requested",
    );
    expect(assertValidLifecycleTransition("in_review", { eventType: "approval_granted" })).toBe(
      "human_approved",
    );
    expect(
      assertValidLifecycleTransition("human_approved", {
        eventType: "marked_authoritative",
        decision: "client_final",
      }),
    ).toBe("client_final");
    expect(assertValidLifecycleTransition("human_approved", { eventType: "approval_revoked" })).toBe(
      "in_review",
    );
    expect(assertValidLifecycleTransition("client_final", { eventType: "superseded" })).toBe(
      "superseded",
    );
  });

  it("rejects explicitly invalid transitions", () => {
    expect(() =>
      assertValidLifecycleTransition("ai_draft", {
        eventType: "marked_authoritative",
        decision: "client_final",
      }),
    ).toThrow("invalid_lifecycle_transition");
    expect(() =>
      assertValidLifecycleTransition("changes_requested", { eventType: "approval_granted" }),
    ).toThrow("invalid_lifecycle_transition");
    expect(() =>
      assertValidLifecycleTransition("superseded", { eventType: "approval_revoked" }),
    ).toThrow("superseded_terminal");
    expect(() =>
      assertValidLifecycleTransition("human_approved", {
        eventType: "version_created",
        origin: "ai_generated",
      }),
    ).toThrow("duplicate_version_created");
  });
});

describe("getAuthoritativeVersion", () => {
  function client(events: LifecycleEventProjectionRow[], pointerState = "human_approved") {
    return {
      from: jest.fn((table: string) => {
        if (table === "deliverables_v2") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                signed_off_version: 2,
                authoritative_lifecycle_state: pointerState,
                authoritative_flag_source: "normal_flow",
                approved_artifact_id: null,
                requires_revalidation: false,
              },
              error: null,
            }),
          };
        }
        if (table === "deliverable_lifecycle_events") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: events, error: null }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };
  }

  it("returns the pointer only when the event projection agrees", async () => {
    const result = await getAuthoritativeVersion(
      client([
        event("version_created", { origin: "ai_generated" }),
        event("submitted_for_review"),
        event("approval_granted", { decision: "approved" }),
      ]) as never,
      "deliverable-1",
    );
    expect(result).toEqual(
      expect.objectContaining({ version: 2, lifecycleCurrentState: "human_approved" }),
    );
  });

  it("fails closed when the pointer is stale", async () => {
    const result = await getAuthoritativeVersion(
      client([
        event("version_created", { origin: "ai_generated" }),
        event("submitted_for_review"),
        event("approval_granted", { decision: "approved" }),
        event("approval_revoked", { decision: "rejected" }),
      ]) as never,
      "deliverable-1",
    );
    expect(result).toBeNull();
  });
});
