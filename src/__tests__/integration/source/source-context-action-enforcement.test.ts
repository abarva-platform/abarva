import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import SourceValuePage from "@/app/(maestro)/source/value/page";

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

describe("Source context-used and action-enforcement slices", () => {
  it("archives /source/events into the governed workspace surface", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(maestro)/source/events/page.tsx"),
      "utf8",
    );

    expect(source).toContain('redirect("/source/preview/workspace")');
    expect(source).not.toContain("SourceEventsPortfolio");
    expect(source).not.toContain("SourceEventsAgentDockView");
  });

  it("renders event detail with the analytics canvas and deterministic context", async () => {
    const routeSource = readFileSync(
      join(process.cwd(), "src/app/(maestro)/source/events/[eventId]/page.tsx"),
      "utf8",
    );

    expect(routeSource).toContain("SourceAnalyticsCanvas");
    expect(routeSource).not.toContain("UniversalCanvasShell");
    expect(routeSource).not.toContain("simpleFrontEnabled");
    expect(routeSource).toContain("readEventFacts");
    expect(routeSource).toContain("hydrateTaskEvidenceState");
  });

  it("archives scorecard and artifact detail pages into canvas/workspace routes", () => {
    const scorecardSource = readFileSync(
      join(
        process.cwd(),
        "src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx",
      ),
      "utf8",
    );
    const artifactSource = readFileSync(
      join(
        process.cwd(),
        "src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx",
      ),
      "utf8",
    );

    expect(scorecardSource).toContain("stage=evaluation");
    expect(scorecardSource).not.toContain("ScorecardGovernancePanel");
    expect(artifactSource).toContain("/workspace?artifactId=");
    expect(artifactSource).not.toContain("SourceArtifactDrawer");
  });

  it("renders value ledger route with context and action layer", async () => {
    const html = renderToStaticMarkup(await SourceValuePage());

    expect(html).toContain("Source value ledger");
    expect(html).toContain("Context used");
    expect(html).toContain("Ava value ledger lead");
    expect(html).toContain("Action layer");
    expect(html).toContain("Show assumptions");
    expect(html).toContain("Ask Ava about this value ledger");
    expect(html).toContain("Submit (disabled until runtime)");
  });

  it("does not introduce model/chat/upload/workflow/approval runtime in the key source enforcement files", () => {
    const files = [
      "src/app/(maestro)/source/events/page.tsx",
      "src/app/(maestro)/source/events/[eventId]/page.tsx",
      "src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx",
      "src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx",
      "src/app/(maestro)/source/value/page.tsx",
      "src/components/source/SentinelAgentColumn.tsx",
      "src/components/source/SourceWorkingPane.tsx",
      "src/components/source/SourceArtifactDrawer.tsx",
    ]
      .map((filePath) => readFileSync(join(process.cwd(), filePath), "utf8"))
      .join("\n");

    expect(files).not.toMatch(
      /\\b(from\\s+['\"][^'\"]*(openai|claude|anthropic|ai-sdk|ai\\b)[^'\"]*['\"])\\b/gi,
    );
    expect(files).not.toMatch(
      /\\b(apiClient|parseUploadedFile|parseDocument|parseFile|uploadFile|uploadArtifact|uploadDocument)\\b/g,
    );
    expect(files).not.toMatch(
      /\\b(workflow\\s*engine|workflowEngine|approval\\s*engine|approvalEngine|runWorkflow\\b|runApproval\\b|approvalEngine\\b)/gi,
    );
  });
});
