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
    expect(workspaceClientSource).toContain(
      "sourceProviderKey?: SourceWorkspaceProviderMode | null",
    );
    expect(workspaceClientSource).toContain("function buildContractApiUrl");
    expect(workspaceClientSource).toContain('params.set("client", client)');
    expect(workspaceClientSource).toContain(
      'params.set("sourceProvider", provider)',
    );
    expect(workspaceClientSource).toContain(
      "fetch(buildContractApiUrl(contractId, sourceClientKey, sourceProviderKey))",
    );
    expect(workspaceClientSource).toContain('"/optimization"');
    expect(workspaceClientSource).toContain("{ opportunityId }");
  });

  it("resolves explicit clients inside the contract-detail API instead of using only the session default", () => {
    expect(contractDetailRouteSource).toContain("new URL(request.url)");
    expect(contractDetailRouteSource).toContain("appClientKeyForTenant");
    expect(contractDetailRouteSource).toContain(
      "checkTenantAccessByKey(requestedClientKey)",
    );
    expect(contractDetailRouteSource).toContain("requestedClientKey !== tenancy.clientKey");
    expect(contractDetailRouteSource).toContain(
      "return NextResponse.json({ error: 'unknown_client' }, { status: 404 })",
    );
    expect(contractDetailRouteSource).toContain(
      "loadSourceWorkspacePortfolio",
    );
    expect(contractDetailRouteSource).toContain(
      "sourceProviderFromRequest(requestUrl)",
    );
  });

  it("resolves explicit clients inside the optimization API before creating an event", () => {
    expect(optimizationRouteSource).toContain("new URL(request.url)");
    expect(optimizationRouteSource).toContain("appClientKeyForTenant");
    expect(optimizationRouteSource).toContain(
      "checkTenantAccessByKey(requestedClientKey)",
    );
    expect(optimizationRouteSource).toContain("requestedClientKey !== tenancy.clientKey");
    expect(optimizationRouteSource).toContain(
      '{ ok: false, error: "unknown_client" }',
    );
  });
});
