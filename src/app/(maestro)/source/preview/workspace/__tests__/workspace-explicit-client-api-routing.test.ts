import fs from "node:fs";
import path from "node:path";

const workspaceClientSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx",
  ),
  "utf8",
);

const contractDetailRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/api/source/workspace/contract/[contractId]/route.ts",
  ),
  "utf8",
);

const optimizationRouteSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/api/source/workspace/contract/[contractId]/optimization/route.ts",
  ),
  "utf8",
);

describe("Source workspace explicit-client API routing", () => {
  it("passes the resolved source client into contract-detail and optimization fetches", () => {
    expect(workspaceClientSource).toContain("sourceClientKey?: string | null");
    expect(workspaceClientSource).toContain("function buildContractApiUrl");
    expect(workspaceClientSource).toContain('params.set("client", client)');
    expect(workspaceClientSource).toContain(
      "fetch(buildContractApiUrl(contractId, sourceClientKey))",
    );
    expect(workspaceClientSource).toContain(
      'buildContractApiUrl(contractId, sourceClientKey, "/optimization"',
    );
  });

  it("resolves explicit clients inside the contract-detail API instead of using only the session default", () => {
    expect(contractDetailRouteSource).toContain("new URL(request.url)");
    expect(contractDetailRouteSource).toContain("requestedClient,");
    expect(contractDetailRouteSource).toContain("allowFallback: !requestedClient");
    expect(contractDetailRouteSource).toContain(
      "getActiveClientRow(tenant.appClientKey)",
    );
    expect(contractDetailRouteSource).toContain(
      "(!requestedClient ? tenancy.clientKey : '')",
    );
  });

  it("resolves explicit clients inside the optimization API before creating an event", () => {
    expect(optimizationRouteSource).toContain("new URL(request.url)");
    expect(optimizationRouteSource).toContain("requestedClient,");
    expect(optimizationRouteSource).toContain("allowFallback: !requestedClient");
    expect(optimizationRouteSource).toContain(
      "getActiveClientRow(tenant.appClientKey)",
    );
    expect(optimizationRouteSource).toContain(
      '(!requestedClient ? tenancy.clientKey : "")',
    );
  });
});
