import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("/api/chat diagnostic route model and context contract", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "src/app/api/chat/route.ts"),
    "utf8",
  );

  it("uses OpenAI and loader-backed tenant context instead of legacy static Meridian facts", () => {
    expect(routeSource).toContain("createIntelligenceAskOpenAIText");
    expect(routeSource).toContain("buildTenantContextBlock");
    expect(routeSource).toContain("x-abarva-model-provider");

    expect(routeSource).not.toContain("@/data/meridian");
    expect(routeSource).not.toContain("preflightAnthropicDirectClient");
    expect(routeSource).not.toContain("claude-");
  });

  it("does not embed stale Meridian profile facts in the diagnostic prompt", () => {
    expect(routeSource).not.toMatch(/23 hospitals/i);
    expect(routeSource).not.toMatch(/Charlotte/i);
    expect(routeSource).not.toMatch(/Blue Ridge/i);
    expect(routeSource).not.toMatch(/actual data/i);
    expect(routeSource).toMatch(/loader-backed context/i);
  });
});
