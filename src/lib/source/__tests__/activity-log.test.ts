/**
 * The decision-trail reader.
 *
 * Its previous contract returned `ActivityEntry[]`, so a failed read and an
 * event with no recorded decisions were the same value. On an approval
 * surface that resolves the ambiguity toward the reassuring answer: "nothing
 * was decided" rather than "we could not reach the decision log".
 *
 * These cases exist because a mutation check on the rendering component could
 * not catch the reader regressing — the component never calls it. A guard that
 * only one layer tests is a guard with an untested layer.
 */

const state: { error: { message: string } | null; rows: unknown[] | null } = {
  error: null,
  rows: [],
};

const readClient = {
  from: () => readClient,
  select: () => readClient,
  eq: () => readClient,
  order: () => readClient,
  limit: async () => ({ data: state.rows, error: state.error }),
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => readClient,
}));

import { listSourceEventActivityEntries } from "../activity-log";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "a1",
    event_id: "event-1",
    client_key: "example-client",
    actor_user_id: "user-1",
    actor_display_name: "A. Reviewer",
    actor_role: "procurement",
    action_type: "source_event_approved",
    action_label: "Approved intake",
    stage_key: "intake",
    artifact_code: null,
    criterion_id: null,
    reason: "Scope and baseline confirmed.",
    metadata: null,
    occurred_at: "2026-09-18T12:00:00.000Z",
    created_at: "2026-09-18T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  state.error = null;
  state.rows = [];
});

describe("listSourceEventActivityEntries", () => {
  it("reports a failed read as a failure, not as an empty trail", async () => {
    state.error = { message: "connection refused" };

    const result = await listSourceEventActivityEntries("event-1");

    expect(result.ok).toBe(false);
    // The distinction the caller needs in order to say the right thing.
    expect(result).not.toEqual({ ok: true, entries: [] });
  });

  it("reports a genuinely empty trail as a success with no entries", async () => {
    state.rows = [];

    const result = await listSourceEventActivityEntries("event-1");

    expect(result).toEqual({ ok: true, entries: [] });
  });

  it("carries actor, action and reason into the entry a reader sees", async () => {
    state.rows = [row()];

    const result = await listSourceEventActivityEntries("event-1");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected a successful read");
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].actor).toBe("A. Reviewer · procurement");
    expect(result.entries[0].body).toContain("Approved intake");
    expect(result.entries[0].body).toContain("Scope and baseline confirmed.");
    expect(result.entries[0].at).toBe("2026-09-18T12:00:00.000Z");
  });

  it("renders the automation actor as aVa instead of internal role vocabulary", async () => {
    state.rows = [
      row({
        actor_display_name: "User",
        actor_role: "maestro",
      }),
    ];

    const result = await listSourceEventActivityEntries("event-1");

    if (!result.ok) throw new Error("expected a successful read");
    expect(result.entries[0].actor).toBe("aVa");
    expect(result.entries[0].actor).not.toContain("maestro");
  });

  it("uses governed stage and artifact names instead of storage keys", async () => {
    state.rows = [
      row({
        stage_key: "scope",
        artifact_code: "d05_scope_memo",
        criterion_id: null,
      }),
    ];

    const result = await listSourceEventActivityEntries("event-1");

    if (!result.ok) throw new Error("expected a successful read");
    expect(result.entries[0].body).toContain("Stage: Scope");
    expect(result.entries[0].body).toContain(
      "Artifact: Scope Memo with Boundaries",
    );
    expect(result.entries[0].body).not.toContain("d05_scope_memo");
  });

  it("humanizes unknown decision keys instead of exposing snake case", async () => {
    state.rows = [
      row({
        stage_key: "special_review",
        artifact_code: "custom_packet",
        criterion_id: "commercial_readiness",
      }),
    ];

    const result = await listSourceEventActivityEntries("event-1");

    if (!result.ok) throw new Error("expected a successful read");
    expect(result.entries[0].body).toContain("Stage: Special review");
    expect(result.entries[0].body).toContain("Artifact: Custom packet");
    expect(result.entries[0].body).toContain(
      "Criterion: Commercial readiness",
    );
    expect(result.entries[0].body).not.toContain("_");
  });

  it("does not invent an actor when none was recorded", async () => {
    state.rows = [row({ actor_display_name: null, actor_role: null, actor_user_id: null })];

    const result = await listSourceEventActivityEntries("event-1");

    if (!result.ok) throw new Error("expected a successful read");
    expect(result.entries[0].actor).toBeUndefined();
  });

  it("does not expose an internal person UUID when no display identity was recorded", async () => {
    state.rows = [
      row({
        actor_display_name: null,
        actor_role: null,
        actor_user_id: "11111111-2222-4333-8444-555555555555",
      }),
    ];

    const result = await listSourceEventActivityEntries("event-1");

    if (!result.ok) throw new Error("expected a successful read");
    expect(result.entries[0].actor).toBe("Recorded user");
    expect(result.entries[0].actor).not.toContain("11111111");
  });

  it("treats a null payload as empty rather than throwing", async () => {
    state.rows = null;

    const result = await listSourceEventActivityEntries("event-1");

    expect(result).toEqual({ ok: true, entries: [] });
  });

  it("returns a string timestamp even when the driver hands back a Date", async () => {
    // U-002: the column is timestamptz and the row type claimed `string`.
    // Nothing enforced that claim, and the unconverted value reached a React
    // child, which throws and takes the whole event workspace down.
    state.rows = [row({ occurred_at: new Date("2026-09-18T12:00:00.000Z") })];

    const result = await listSourceEventActivityEntries("event-1");

    if (!result.ok) throw new Error("expected a successful read");
    expect(typeof result.entries[0].at).toBe("string");
    expect(result.entries[0].at).toBe("2026-09-18T12:00:00.000Z");
  });
});
