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
    expect(pageSource).toContain(
      "sourceClientKey={tenant?.appClientKey ?? activeClient?.key ?? tenantKey}",
    );
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

  it("guards the ECL provider query override behind an explicit environment flag", () => {
    expect(pageSource).toContain("provider?: string");
    expect(pageSource).toContain("sourceProvider?: string");
    expect(pageSource).toContain(
      'SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE !== "true"',
    );
    expect(pageSource).toContain('normalized === "ecl_projection_db"');
    expect(pageSource).toContain("params.sourceProvider ?? params.provider");
    expect(pageSource).toContain("requestedSourceProvider");
  });
});
