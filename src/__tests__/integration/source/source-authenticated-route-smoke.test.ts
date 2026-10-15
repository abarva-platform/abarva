import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

jest.mock("next/navigation", () => ({
  usePathname: () => "/source/events/evt-source-data-ai-si-selection",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      primaryEmailAddress: {
        emailAddress: "maya.desai@apex-retail.example.com",
      },
      publicMetadata: {
        moduleAccess: ["setup", "programs", "source", "intelligence", "tower"],
      },
      firstName: "Maya",
      lastName: "Desai",
    },
  }),
  useClerk: () => ({ signOut: jest.fn() }),
}));

const sourceRouteFiles = [
  "src/app/(maestro)/source/page.tsx",
  "src/app/(maestro)/source/queue/page.tsx",
  "src/app/(maestro)/source/events/[eventId]/page.tsx",
];

function readWorkspaceFile(filePath: string) {
  return readFileSync(join(process.cwd(), filePath), "utf8");
}

function surfaceImports(filePath: string, source: string) {
  const parsed = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest);
  return parsed.statements.flatMap((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      return [];
    const modulePath = statement.moduleSpecifier.text;
    const bindings = statement.importClause?.namedBindings;
    const isViewerAccessPolicy =
      filePath === "src/proxy.ts" &&
      modulePath === "@/lib/demo-library/policy" &&
      !statement.importClause?.name &&
      bindings &&
      ts.isNamedImports(bindings) &&
      bindings.elements.length === 1 &&
      bindings.elements[0].name.text === "isDemoVisitorRoute" &&
      !bindings.elements[0].propertyName;
    return isViewerAccessPolicy ? [] : [modulePath];
  });
}

describe("Source authenticated route smoke", () => {
  it("exempts only the middleware's exact viewer-access policy import", () => {
    const policy =
      'import { isDemoVisitorRoute } from "@/lib/demo-library/policy"';
    expect(surfaceImports("src/proxy.ts", policy)).toEqual([]);
    expect(surfaceImports(sourceRouteFiles[0], policy)).toEqual([
      "@/lib/demo-library/policy",
    ]);
    expect(
      surfaceImports(
        "src/proxy.ts",
        policy.replace("isDemoVisitorRoute", "mockData"),
      ),
    ).toEqual(["@/lib/demo-library/policy"]);
    expect(
      surfaceImports("src/proxy.ts", policy.replace("/policy", "/mock")),
    ).toEqual(["@/lib/demo-library/mock"]);
  });
  it("keeps Source routes behind the authenticated route matcher", () => {
    const proxySource = readWorkspaceFile("src/proxy.ts");

    expect(proxySource).toContain('"/source(.*)"');
    expect(proxySource).toContain("authRequiredRoutes(request)");
    expect(proxySource).toContain("createSignInRedirect(request)");
    expect(proxySource).toContain('"/api/auth/demo-code-sign-in(.*)"');
    expect(proxySource).toContain("PUBLIC_ROUTE_PATTERNS");
  });

  it("keeps Source in explicit client-param access routing without blanket stripping", () => {
    const proxySource = readWorkspaceFile("src/proxy.ts");

    expect(proxySource).toContain("shouldStripUnauthorizedClientParam(");
    expect(proxySource).toContain("Source is intentionally not included here");
    expect(proxySource).not.toContain('pathname === "/source"');
    expect(proxySource).not.toContain('pathname.startsWith("/source/")');
  });

  it("keeps the dashboard and event canvas route files present", () => {
    for (const filePath of sourceRouteFiles) {
      expect(existsSync(join(process.cwd(), filePath))).toBe(true);
    }
  });

  it("keeps the retired queue implementation out of the Source entry surface", () => {
    const queueRouteSource = readWorkspaceFile(
      "src/app/(maestro)/source/queue/page.tsx",
    );
    const componentSource = readWorkspaceFile(
      "src/components/source/SourceIndexPage.tsx",
    );

    expect(queueRouteSource).not.toContain("SourceDecisionQueueView");
    expect(componentSource).toContain("AMS Vendor Consolidation 2026");
    expect(componentSource).toContain("SOURCE_INDEX_VIEW");
    expect(componentSource).not.toMatch(/fetch\(|openai|claude|anthropic/i);
  });

  it("keeps the authenticated Source event route on the analytics canvas path", () => {
    const routeSource = readWorkspaceFile(
      "src/app/(maestro)/source/events/[eventId]/page.tsx",
    );
    const stageSource = readWorkspaceFile(
      "src/components/source/canvas/analytics/ScopeAnalyticsStage.tsx",
    );

    expect(routeSource).toContain("SourceAnalyticsCanvas");
    expect(routeSource).not.toContain("UniversalCanvasShell");
    expect(routeSource).not.toContain("workspaceExplorerEnabled");
    expect(routeSource).not.toContain("simpleFrontEnabled");
    expect(stageSource).toContain("Check intelligence");
    expect(stageSource).toContain("Intelligence explorer");
  });

  it("documents the current auth test boundary without weakening auth", () => {
    const paths = [
      "src/proxy.ts",
      ...sourceRouteFiles,
      "src/components/source/SentinelEngagementCanvas.tsx",
      "src/components/source/SourceDataReadinessPanel.tsx",
    ];
    const sources = paths.map(readWorkspaceFile).join("\n");

    expect(sources).not.toMatch(
      /from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i,
    );
    expect(sources).not.toMatch(
      /from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i,
    );
    for (const filePath of paths) {
      for (const modulePath of surfaceImports(
        filePath,
        readWorkspaceFile(filePath),
      )) {
        expect(modulePath).not.toMatch(
          /ProgramSurface|programs\/mock|preview|demo/i,
        );
      }
    }
    expect(sources).not.toMatch(
      /\b(parseUploadedFile|parseDocument|uploadFile|createScorecardUi|openArtifactDrawer)\b/,
    );
    expect(sources).not.toMatch(/\bauth\.protect\s*=\s*undefined\b/);
    expect(sources).not.toMatch(/\bclerkMiddleware\s*=\s*undefined\b/);
  });
});
