import {
  confirmationMatchesCurrentEvent,
  hasCurrentStrategyOwnerConfirmation,
  strategyBasisReady,
  strategyConfirmationVersion,
} from "../strategy-confirmation";

let storedActivity: Record<string, unknown> | null = null;
let readFailure = false;
const filters: Record<string, unknown> = {};
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: (table: string) => {
      if (table !== "source_event_activity") throw new Error("wrong table");
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => { filters[key] = value; return chain; },
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({
          data: storedActivity && filters.event_id === event.id && filters.client_key === event.client_key
            ? storedActivity : null,
          error: readFailure ? { message: "read failed" } : null,
        }),
      };
      return chain;
    },
  }),
}));

const event = {
  id: "event-1",
  client_key: "tenant-1",
  approval_policy_code: "self_v1",
  decision_owner: "Event Owner",
  trigger_description: "Synthetic renewal planning",
  scope_description: "Scope boundary: Planning scope only\nValue target: Hypothetical service improvement",
  estimated_value_usd: null,
  updated_at: "2026-09-28T12:00:00.123Z",
};

describe("Strategy owner confirmation", () => {
  beforeEach(() => {
    storedActivity = null;
    readFailure = false;
    for (const key of Object.keys(filters)) delete filters[key];
  });
  it("is bound to the current mandate, owner, policy and event revision", () => {
    const version = strategyConfirmationVersion(event);
    expect(version).not.toBe(strategyConfirmationVersion({ ...event, trigger_description: "Changed mandate" }));
    expect(version).not.toBe(strategyConfirmationVersion({ ...event, decision_owner: "Different owner" }));
    expect(version).not.toBe(strategyConfirmationVersion({ ...event, approval_policy_code: "legacy_signed_scope_v1" }));
    expect(version).not.toBe(strategyConfirmationVersion({ ...event, updated_at: "2026-09-28T12:01:00.123Z" }));
  });

  it("requires a real owner, mandate and planning value thesis before confirmation", () => {
    expect(strategyBasisReady(event)).toBe(true);
    expect(strategyBasisReady({ ...event, decision_owner: "" })).toBe(false);
    expect(strategyBasisReady({ ...event, trigger_description: "", scope_description: "" })).toBe(false);
    expect(strategyBasisReady({ ...event, scope_description: "Scope boundary: Planning scope only" })).toBe(false);
    expect(strategyBasisReady({ ...event, scope_description: "Scope boundary: Planning scope only", estimated_value_usd: "100" })).toBe(true);
  });

  it("accepts only an actual matching owner decision for a SELF event", () => {
    const row = {
      action_type: "strategy_owner_confirmed",
      stage_key: "strategy",
      metadata: { version: strategyConfirmationVersion(event) },
    };
    expect(confirmationMatchesCurrentEvent(event, row)).toBe(true);
    expect(confirmationMatchesCurrentEvent(event, { ...row, metadata: { version: "stale" } })).toBe(false);
    expect(confirmationMatchesCurrentEvent({ ...event, approval_policy_code: "legacy_signed_scope_v1" }, row)).toBe(false);
    expect(confirmationMatchesCurrentEvent(event, { ...row, action_type: "evidence_answered" })).toBe(false);
  });

  it("reads a tenant-scoped matching receipt and fails closed on missing or failed reads", async () => {
    expect(await hasCurrentStrategyOwnerConfirmation(event)).toBe(false);
    storedActivity = {
      action_type: "strategy_owner_confirmed",
      stage_key: "strategy",
      metadata: { version: strategyConfirmationVersion(event) },
    };
    expect(await hasCurrentStrategyOwnerConfirmation(event)).toBe(true);
    expect(filters).toMatchObject({ event_id: "event-1", client_key: "tenant-1", action_type: "strategy_owner_confirmed" });
    expect(await hasCurrentStrategyOwnerConfirmation({ ...event, trigger_description: "changed" })).toBe(false);
    readFailure = true;
    await expect(hasCurrentStrategyOwnerConfirmation(event)).rejects.toThrow("read failed");
  });
});
