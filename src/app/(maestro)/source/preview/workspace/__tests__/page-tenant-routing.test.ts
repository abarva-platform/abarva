import { readFileSync } from "node:fs";
import { join } from "node:path";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/(maestro)/source/preview/workspace/page.tsx"),
  "utf8",
);

describe("Source workspace requested-client routing", () => {
  it("threads the explicit client request through server-side tenant resolution", () => {
    expect(pageSource).toContain("client?: string");
    expect(pageSource).toContain(
      "const requestedClient = params.client?.trim() || null;",
    );
    expect(pageSource).toContain("requestedClient,");
    expect(pageSource).toContain("allowFallback: !requestedClient");
    expect(pageSource).toContain("getActiveClientRow(tenant.appClientKey)");
  });

  it("does not fall back to the session tenant when an explicit client cannot resolve", () => {
    expect(pageSource).toContain('(!requestedClient ? tenancy.clientKey : "")');
  });

  it("threads contract deep links into the workspace client", () => {
    expect(pageSource).toContain("contractId?: string");
    expect(pageSource).toContain(
      "const requestedContractId = params.contractId?.trim() || null;",
    );
    expect(pageSource).toContain("initialContractId={requestedContractId}");
    expect(pageSource).toContain("initialContractTab={requestedContractTab}");
  });
});
