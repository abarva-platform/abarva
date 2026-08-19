import { resolveEvidence } from "../evidence-resolver";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { EnterpriseSignalPacket } from "@/lib/home/preview/types";

const emptyPacket = { signals: [], contextItems: [] } as unknown as EnterpriseSignalPacket;

describe("resolveEvidence", () => {
  it("resolves a real sig_* id to its signal statement and kind", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    const signal = bundle!.thesis.signalPacket.signals[0];
    const resolved = resolveEvidence([signal.id], bundle!.thesis.signalPacket);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ id: signal.id, statement: signal.statement, origin: "signal", signalKind: signal.kind });
  });

  it("resolves a real ctx_* id to its context statement, with no signalKind", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    const context = bundle!.thesis.signalPacket.contextItems[0];
    const resolved = resolveEvidence([context.id], bundle!.thesis.signalPacket);
    expect(resolved[0]).toMatchObject({ id: context.id, statement: context.statement, origin: "context" });
    expect(resolved[0].signalKind).toBeUndefined();
  });

  it("marks an id with no match as unresolved rather than throwing or omitting it", () => {
    const resolved = resolveEvidence(["sig_does_not_exist"], emptyPacket);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].unresolved).toBe(true);
    expect(resolved[0].statement).toContain("sig_does_not_exist");
  });

  it("preserves order and count across a mix of resolved and unresolved ids", () => {
    const bundle = getHomeReviewBundle("skyharbor-air");
    const signal = bundle!.thesis.signalPacket.signals[0];
    const resolved = resolveEvidence([signal.id, "nope"], bundle!.thesis.signalPacket);
    expect(resolved.map((r) => r.id)).toEqual([signal.id, "nope"]);
    expect(resolved[0].unresolved).toBeUndefined();
    expect(resolved[1].unresolved).toBe(true);
  });
});
