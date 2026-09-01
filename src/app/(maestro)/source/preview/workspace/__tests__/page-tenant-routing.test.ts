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

const loadingSource = readFileSync(
  join(process.cwd(), "src/app/(maestro)/source/workspace/loading.tsx"),
  "utf8",
);

const loaderSource = readFileSync(
  join(process.cwd(), "src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx"),
  "utf8",
);

const portfolioApiSource = readFileSync(
  join(process.cwd(), "src/app/api/source/workspace/portfolio/route.ts"),
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
    expect(pageSource).toContain("tenantKey={tenantKey}");
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

  it("renders Source 360 through a client portfolio loader instead of blocking on the heavy read", () => {
    expect(pageSource).toContain("<WorkspaceClientLoader");
    expect(pageSource).not.toContain("loadSourceWorkspacePortfolio(");
    expect(loaderSource).toContain("/api/source/workspace/portfolio");
    expect(loaderSource).toContain("SourceWorkspaceLoadingShell");
    expect(loaderSource).toContain("<WorkspaceClient");
    expect(pageSource).not.toContain(
      "const portfolio = tenantKey\n    ? await loadSourceWorkspacePortfolio(",
    );
  });

  it("renders the Source 360 route loading shell during route transitions", () => {
    expect(loadingSource).toContain("SourceWorkspaceLoadingShell");
    expect(loadingSource).toContain("export default function Loading()");
    expect(loadingSource).not.toContain("loadSourceWorkspacePortfolio");
  });

  it("keeps portfolio loading tenant-guarded inside the API route", () => {
    expect(portfolioApiSource).toContain("requireTenancy()");
    expect(portfolioApiSource).toContain("checkTenantAccessByKey(requestedClientKey)");
    expect(portfolioApiSource).toContain("loadSourceWorkspacePortfolio(");
    expect(portfolioApiSource).toContain("sourceProviderKey");
  });

  it("keeps repeated portfolio reads coalesced behind a tenant-scoped cache", () => {
    expect(portfolioApiSource).toContain(
      "SOURCE_WORKSPACE_PORTFOLIO_CACHE_TTL_MS",
    );
    expect(portfolioApiSource).toContain("const portfolioCache = new Map");
    expect(portfolioApiSource).toContain("checkTenantAccessByKey(requestedClientKey)");
    expect(portfolioApiSource.indexOf("checkTenantAccessByKey(requestedClientKey)")).toBeLessThan(
      portfolioApiSource.indexOf("loadCachedPortfolio({"),
    );
    expect(portfolioApiSource).toContain("tenantKey,");
    expect(portfolioApiSource).toContain("asOfDateIso,");
    expect(portfolioApiSource).toContain('requestedProvider ?? "default"');
    expect(portfolioApiSource).toContain("X-Source-Portfolio-Cache");
    expect(portfolioApiSource).toContain('Cache-Control": "private, no-store"');
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
