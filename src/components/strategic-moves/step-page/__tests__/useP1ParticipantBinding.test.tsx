/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useP1ParticipantBinding } from "../useP1ParticipantBinding";
import type { P1ParticipantBindingPreview } from "@/lib/programs/p1-participant-binding";
const preview: P1ParticipantBindingPreview = {
  moveId: "move-1",
  status: "available",
  current: { sponsorPersonId: null, leadPersonId: null },
  choices: [
    {
      personId: "person",
      name: "Declared participant",
      role: "Member",
      attribution: "declared_participant",
    },
  ],
  revision: "a".repeat(64),
  preservationRevision: "b".repeat(64),
  canConfirm: true,
  confirmed: false,
  auditId: null,
};
const command = {
  sponsorPersonId: "person",
  leadPersonId: "person",
  expectedRevision: preview.revision,
  requestId: "reviewed-request",
  rationale: "Explicit contact and lead",
};
const response = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as Response;
let fetcher: jest.Mock;
beforeEach(() => {
  fetcher = jest.fn(async () => response({ p1ParticipantBinding: preview }));
  global.fetch = fetcher;
});
it("does not read or write in the flag-off state", () => {
  renderHook(() => useP1ParticipantBinding("move-1", false));
  expect(fetcher).not.toHaveBeenCalled();
});
it("uses the server's authoritative head preview without a duplicate client read or hiding a failed read", () => {
  const first = renderHook(() =>
    useP1ParticipantBinding("move-1", true, preview),
  );
  expect(first.result.current.preview).toEqual(preview);
  first.unmount();
  const failed = renderHook(() =>
    useP1ParticipantBinding("move-1", true, null),
  );
  expect(failed.result.current.preview).toBeNull();
  expect(failed.result.current.loading).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
it("reads one same-Move preview and does not appoint on mount", async () => {
  const { result } = renderHook(() => useP1ParticipantBinding("move-1", true));
  await waitFor(() =>
    expect(result.current.preview?.revision).toBe(preview.revision),
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1].method).toBeUndefined();
});
it("adopts only matching stored contacts and audit after an explicit separate command", async () => {
  const { result } = renderHook(() => useP1ParticipantBinding("move-1", true));
  await waitFor(() => expect(result.current.preview).not.toBeNull());
  const after = {
    ...preview,
    current: { sponsorPersonId: "person", leadPersonId: "person" },
    confirmed: true,
    auditId: "audit",
  };
  fetcher.mockResolvedValueOnce(
    response({
      persisted: true,
      preservedBindings: true,
      auditId: "audit",
      p1ParticipantBinding: after,
    }),
  );
  await act(async () => {
    await result.current.confirm(command);
  });
  expect(result.current.preview?.confirmed).toBe(true);
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
    action: "confirm_p1_participant_bindings",
    phase: 1,
    ...command,
  });
});
it.each(["unknown", "rolled_back", "malformed_success"])(
  "holds readiness without automatically retrying on %s",
  async (kind) => {
    const { result } = renderHook(() =>
      useP1ParticipantBinding("move-1", true),
    );
    await waitFor(() => expect(result.current.preview).not.toBeNull());
    fetcher.mockResolvedValueOnce(
      kind === "malformed_success"
        ? response({
            persisted: true,
            preservedBindings: true,
            auditId: "audit",
            p1ParticipantBinding: { ...preview, confirmed: true },
          })
        : response({ detail: `Proven ${kind}; read before retrying` }, false),
    );
    await act(async () => {
      await expect(result.current.confirm(command)).rejects.toBeInstanceOf(
        Error,
      );
    });
    expect(result.current.preview).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  },
);
it("refuses a stale reviewed command before any POST", async () => {
  const { result } = renderHook(() => useP1ParticipantBinding("move-1", true));
  await waitFor(() => expect(result.current.preview).not.toBeNull());
  await expect(
    result.current.confirm({ ...command, expectedRevision: "stale" }),
  ).rejects.toBeInstanceOf(Error);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("cannot carry readiness across Move navigation or adopt another Move's preview", async () => {
  const { result, rerender } = renderHook(
    ({ moveId }) => useP1ParticipantBinding(moveId, true),
    { initialProps: { moveId: "move-1" } },
  );
  await waitFor(() => expect(result.current.preview).not.toBeNull());
  rerender({ moveId: "move-2" });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.preview).toBeNull();
  expect(result.current.error).not.toBeNull();
});
it("prevents a second POST while a same-tick confirmation is in flight", async () => {
  const { result } = renderHook(() => useP1ParticipantBinding("move-1", true));
  await waitFor(() => expect(result.current.preview).not.toBeNull());
  let finish!: (value: Response) => void;
  fetcher.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  await act(async () => {
    const first = result.current.confirm(command);
    await expect(result.current.confirm(command)).rejects.toBeInstanceOf(Error);
    finish(response({ detail: "Unknown outcome" }, false));
    await expect(first).rejects.toBeInstanceOf(Error);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
