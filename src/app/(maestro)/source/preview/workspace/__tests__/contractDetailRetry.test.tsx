/** @jest-environment jsdom */

import fs from "node:fs";
import path from "node:path";

/**
 * A deep link that met one cold-start failure said the contract could not be
 * loaded — and meant it, because the stored `"error"` made the guard treat that
 * contract as already handled. It recovered only when the reader happened to
 * open the same contract again from the register, since the fetch below the
 * guard ran whether or not the guard had allowed the attempt.
 *
 * These assertions are structural. The behaviour lives in a client component
 * whose full render needs the workspace shell, a portfolio and a session; the
 * two behavioural tests that do mount it are in the ECL browser suite and they
 * caught a first version of this fix that silently stopped fetching at all.
 */

const client = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx",
  ),
  "utf8",
);

describe("contract detail fetch", () => {
  it("decides synchronously whether to send a request", () => {
    // A state updater may not have run by the time the function returns, so
    // the request ledger cannot live in state. An earlier attempt at this fix
    // read a flag set inside setState and consequently never fetched.
    expect(client).toContain("const detailRequests = useRef<");
    expect(client).toContain(
      "const pending = detailRequests.current.get(contractId);",
    );
    expect(client).toContain(
      'if (pending === "loading" || pending === "loaded") return;',
    );
  });

  it("no longer treats any stored entry as already handled", () => {
    expect(client).not.toContain(
      "if (prev.contractDetail[contractId]) return prev",
    );
  });

  it("retries a transient failure before stating one", () => {
    expect(client).toContain("CONTRACT_DETAIL_RETRY_ATTEMPTS = 2");
    expect(client).toContain("CONTRACT_DETAIL_RETRY_DELAY_MS");
    expect(client).toContain("attempt(remaining - 1)");
    expect(client).toContain("if (remaining > 0)");
  });

  it("requeues one initial deep-link failure after request retries", () => {
    expect(client).toContain("initialDetailRetry = useRef");
    expect(client).toContain("INITIAL_CONTRACT_DETAIL_RETRY_DELAY_MS");
    expect(client).toContain('state.contractDetail[contractId] !== "error"');
    expect(client).toContain("fetchContractDetail(contractId)");
    expect(client).toContain("window.clearTimeout(retry)");
  });

  it("releases a contract after the attempts are spent, rather than latching", () => {
    // The surface must be able to say it failed, and a later open must be able
    // to try again instead of meeting a stored verdict.
    expect(client).toContain("detailRequests.current.delete(contractId)");
    expect(client).toContain('[contractId]: "error"');
  });

  it("marks a loaded contract so it is not requested twice", () => {
    expect(client).toContain(
      'detailRequests.current.set(contractId, "loaded")',
    );
  });
});
