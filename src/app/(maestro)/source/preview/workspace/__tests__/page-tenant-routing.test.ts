import { readFileSync } from "node:fs";
import { join } from "node:path";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/(maestro)/source/workspace/page.tsx"),
  "utf8",
);

const previewPageSource = readFileSync(
  join(process.cwd(), "src/app/(maestro)/source/preview/workspace/page.tsx"),
  "utf8",
);

describe("Source workspace requested-client routing", () => {
  it("threads the explicit client request through server-side tenant resolution", () => {
    expect(pageSource).toContain("client?: string");
    expect(pageSource).toContain(
      "const requestedClient = params.client?.trim() || null;",
    );
    expect(pageSource).toContain(
      "const requestedClientKey = appClientKeyForTenant(requestedClient);",
    );
    expect(pageSource).toContain("if (requestedClient && !requestedClientKey)");
    expect(pageSource).toContain("checkTenantAccessByKey(requestedClientKey)");
    expect(pageSource).toContain("requestedClientKey ??");
    expect(pageSource).toContain("sourceClientKey={tenantKey}");
  });

  it("does not fall back to the session tenant when an explicit client cannot resolve", () => {
    expect(pageSource).toContain('from "next/navigation"');
    expect(pageSource).toContain("notFound();");
    expect(pageSource).toContain("<SourceWorkspaceTenantAccessDenied />");
    expect(pageSource).toContain("No Source contracts");
    expect(pageSource).not.toContain(
      '(!requestedClient ? tenancy.clientKey : "")',
    );
    expect(pageSource).not.toContain("requestedClient,");
    expect(pageSource).not.toContain("allowFallback: !requestedClient");
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

  it("uses the governed Source cube as-of date unless the operator overrides it", () => {
    expect(pageSource).toContain("SOURCE_V4_CUBE_AS_OF_DATE");
    expect(pageSource).toContain("SOURCE_WORKSPACE_DEFAULT_AS_OF");
    expect(pageSource).toContain("params.asOf?.trim() || defaultAsOf");
    expect(pageSource).not.toContain("new Date().toISOString()");
  });

  it("streams a Source 360 shell before the heavy portfolio read resolves", () => {
    expect(pageSource).toContain('import { Suspense } from "react";');
    expect(pageSource).toContain("const portfolioPromise = tenantKey");
    expect(pageSource).toContain("loadSourceWorkspacePortfolio(");
    expect(pageSource).toContain(
      "fallback={<SourceWorkspaceLoadingShell tenantName={tenantName} />}",
    );
    expect(pageSource).toContain("<SourceWorkspaceDataBoundary");
    expect(pageSource).toContain("portfolioPromise={portfolioPromise}");
    expect(pageSource).toContain("Preparing the governed contract book.");
    expect(pageSource).not.toContain(
      "const portfolio = tenantKey\n    ? await loadSourceWorkspacePortfolio(",
    );
  });

  it("keeps the historical preview route as a query-preserving redirect only", () => {
    expect(previewPageSource).toContain("SourceWorkspacePreviewRedirect");
    expect(previewPageSource).toContain(
      'redirect(`/source/workspace${queryString ? `?${queryString}` : ""}`);',
    );
    expect(previewPageSource).not.toContain("loadSourceWorkspacePortfolio(");
    expect(previewPageSource).not.toContain("<WorkspaceClient");
  });
});
