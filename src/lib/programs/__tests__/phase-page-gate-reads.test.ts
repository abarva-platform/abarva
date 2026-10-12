import {
  createPhasePageGateReads,
  createPhasePageReadSet,
} from "@/lib/programs/phase-page-gate-reads";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { evaluateGate } from "@/lib/programs/governance";

jest.mock("@/lib/programs/governance", () => ({ evaluateGate: jest.fn() }));

const ctx: TenancyCtx = { clientId: "tenant-a", userId: "user-a" };
const result: Awaited<ReturnType<typeof evaluateGate>> = {
  pass: false,
  failedChecks: [
    { check: "evidence", severity: "hard", reason: "Awaiting evidence" },
  ],
  requiresApproval: false,
  approverRole: null,
};

describe("phase page gate reads", () => {
  it("shares a pending gate across the effective-phase and displayed-gate readers", async () => {
    let resolve!: (value: typeof result) => void;
    const read = jest.fn(
      () =>
        new Promise<typeof result>((done) => {
          resolve = done;
        }),
    );
    const gate = createPhasePageGateReads(ctx, "move-a", read);
    const effective = gate(ctx, "move-a", 2, 3, { allowHistoricalPhase: true });
    const displayed = gate(ctx, "move-a", 2, 3, { allowHistoricalPhase: true });
    expect(read).toHaveBeenCalledTimes(1);
    resolve(result);
    expect(await effective).toBe(result);
    expect(await displayed).toBe(result);
  });

  it("delivers the same failed read to every consumer without retrying or replacing it", async () => {
    const error = new Error("read unavailable");
    const read = jest.fn(async () => {
      throw error;
    });
    const gate = createPhasePageGateReads(ctx, "move-a", read);
    const values = await Promise.allSettled([
      gate(ctx, "move-a", 2, 3),
      gate(ctx, "move-a", 2, 3),
    ]);
    expect(values).toEqual([
      { status: "rejected", reason: error },
      { status: "rejected", reason: error },
    ]);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("keeps phase transitions and historical permission distinct", async () => {
    const read = jest.fn(async () => result);
    const gate = createPhasePageGateReads(ctx, "move-a", read);
    await gate(ctx, "move-a", 1, 2);
    await gate(ctx, "move-a", 2, 3);
    await gate(ctx, "move-a", 2, 3, { allowHistoricalPhase: true });
    expect(read).toHaveBeenCalledTimes(3);
  });

  it("refuses a different tenancy context or Move before reading", async () => {
    const read = jest.fn(async () => result);
    const gate = createPhasePageGateReads(ctx, "move-a", read);
    await expect(
      gate({ ...ctx, clientId: "tenant-b" }, "move-a", 2, 3),
    ).rejects.toThrow("scope mismatch");
    await expect(gate(ctx, "move-b", 2, 3)).rejects.toThrow("scope mismatch");
    expect(read).not.toHaveBeenCalled();
  });

  it("starts a fresh read set for every request", async () => {
    const read = jest.fn(async () => result);
    await createPhasePageGateReads(ctx, "move-a", read)(ctx, "move-a", 2, 3);
    await createPhasePageGateReads(ctx, "move-a", read)(ctx, "move-a", 2, 3);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("shares pending source reads across different gate transitions", async () => {
    const readSet = createPhasePageReadSet(ctx, "move-a");
    let finish!: (value: string[]) => void;
    const source = jest.fn(
      () =>
        new Promise<string[]>((resolve) => {
          finish = resolve;
        }),
    );
    const reader = jest.fn(async (_ctx, _id, _from, _to, options) => {
      await options.readSet(ctx, "move-a", "modules", source);
      return result;
    });
    const gate = createPhasePageGateReads(ctx, "move-a", reader, readSet);
    const gates = [gate(ctx, "move-a", 1, 2), gate(ctx, "move-a", 2, 3)];
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(source).toHaveBeenCalledTimes(1);
    finish(["same canonical state"]);
    expect(await Promise.all(gates)).toEqual([result, result]);
    expect(reader).toHaveBeenCalledTimes(2);
  });

  it("shares the same source rejection and keeps a new request independent", async () => {
    const error = new Error("source unavailable");
    const source = jest.fn(async () => {
      throw error;
    });
    const readSet = createPhasePageReadSet(ctx, "move-a");
    const reads = await Promise.allSettled([
      readSet(ctx, "move-a", "modules", source),
      readSet(ctx, "move-a", "modules", source),
    ]);
    expect(reads).toEqual([
      { status: "rejected", reason: error },
      { status: "rejected", reason: error },
    ]);
    expect(source).toHaveBeenCalledTimes(1);
    await expect(
      createPhasePageReadSet(ctx, "move-a")(ctx, "move-a", "modules", source),
    ).rejects.toBe(error);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("refuses source scope drift before consulting a cached result", async () => {
    const source = jest.fn(async () => []);
    const readSet = createPhasePageReadSet(ctx, "move-a");
    await readSet(ctx, "move-a", "modules", source);
    await expect(
      readSet({ ...ctx }, "move-a", "modules", source),
    ).rejects.toThrow("scope mismatch");
    await expect(readSet(ctx, "move-b", "modules", source)).rejects.toThrow(
      "scope mismatch",
    );
    expect(source).toHaveBeenCalledTimes(1);
  });

  it("keeps distinct sources separate and bypasses sharing for an explicit client", async () => {
    const source = jest.fn(async () => []);
    const readSet = createPhasePageReadSet(ctx, "move-a");
    await readSet(ctx, "move-a", "modules", source);
    await readSet(ctx, "move-a", "snapshots", source);
    expect(source).toHaveBeenCalledTimes(2);
    const reader = jest.fn<
      ReturnType<typeof evaluateGate>,
      Parameters<typeof evaluateGate>
    >(async () => result);
    const gate = createPhasePageGateReads(ctx, "move-a", reader, readSet);
    const client = {} as NonNullable<
      Parameters<typeof evaluateGate>[4]
    >["supabase"];
    await gate(ctx, "move-a", 2, 3, { supabase: client });
    await gate(ctx, "move-a", 2, 3, { supabase: client });
    expect(reader).toHaveBeenCalledTimes(2);
    expect(reader.mock.calls[0]?.[4]).toEqual({ supabase: client });
  });
});
