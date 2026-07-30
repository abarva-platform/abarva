import { gateEnvelope } from "../state/gate-utils";
import type { ConsumptionEnvelope } from "@/lib/knowledge/providers/types";

function envelope<T>(
  overrides: Partial<
    Pick<
      ConsumptionEnvelope<T>,
      "availabilityState" | "authorityState" | "freshnessState" | "data"
    >
  >,
): Pick<
  ConsumptionEnvelope<T>,
  "availabilityState" | "authorityState" | "freshnessState" | "data"
> {
  return {
    availabilityState: "available",
    authorityState: "accepted",
    freshnessState: "current",
    data: null,
    ...overrides,
  };
}

describe("gateEnvelope", () => {
  it("blocks rendering when availabilityState is not_loaded, even if data is somehow present", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "not_loaded",
        data: { fake: true } as unknown,
      }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.tone).toBe("blocked");
  });

  it("never treats a missing value as zero -- not_measured blocks rendering with an honest title", () => {
    const decision = gateEnvelope(
      envelope({ availabilityState: "not_measured", data: null }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.title).toBe("Not measured");
    expect(decision.body.toLowerCase()).toContain("absent");
    expect(decision.body.toLowerCase()).not.toContain("zero value");
  });

  it("blocks conflicting/disagreeing sources rather than picking one silently", () => {
    const decision = gateEnvelope(
      envelope({ availabilityState: "conflicting", data: null }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.tone).toBe("gap");
    expect(decision.title).toBe("Sources disagree");
  });

  it("blocks withheld/restricted content and never leaks it as renderable", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "withheld",
        data: { secret: "classified" } as unknown,
      }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.tone).toBe("restricted");
  });

  it("treats not_applicable as its own distinct state, never as 'clean' or zero", () => {
    const decision = gateEnvelope(
      envelope({ availabilityState: "not_applicable", data: null }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.title).toBe("Not assessed");
    expect(decision.body.toLowerCase()).toContain("not the same as clean");
  });

  it("does not render available data whose authority is only 'candidate' unless explicitly allowed", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "available",
        authorityState: "candidate",
        data: { v: 1 },
      }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.tone).toBe("candidate");
  });

  it("allows candidate content to render only when the caller explicitly opts in", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "available",
        authorityState: "candidate",
        data: { v: 1 },
      }),
      { allowCandidate: true },
    );
    expect(decision.renderable).toBe(true);
  });

  it("does not render 'proposed' authority as accepted", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "available",
        authorityState: "proposed",
        data: { v: 1 },
      }),
    );
    expect(decision.renderable).toBe(false);
    expect(decision.title.toLowerCase()).toContain("proposed");
  });

  it("does not render 'disputed' authority as accepted", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "available",
        authorityState: "disputed",
        data: { v: 1 },
      }),
    );
    expect(decision.renderable).toBe(false);
  });

  it("renders available+accepted data, but marks stale freshness visibly rather than hiding it", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "available",
        authorityState: "accepted",
        freshnessState: "stale",
        data: { v: 1 },
      }),
    );
    expect(decision.renderable).toBe(true);
    expect(decision.tone).toBe("stale");
    expect(decision.title).toBe("Needs refresh");
  });

  it("renders cleanly when available, accepted, and current with no caveats", () => {
    const decision = gateEnvelope(
      envelope({
        availabilityState: "available",
        authorityState: "accepted",
        freshnessState: "current",
        data: { v: 1 },
      }),
    );
    expect(decision.renderable).toBe(true);
    expect(decision.tone).toBe("neutral");
  });

  it("blocks when data is null even if availabilityState claims available (defensive: never trust availability alone)", () => {
    const decision = gateEnvelope(
      envelope({ availabilityState: "available", data: null }),
    );
    expect(decision.renderable).toBe(false);
  });
});
