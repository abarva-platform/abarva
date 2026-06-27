import fs from "node:fs";
import path from "node:path";

describe("/api/v1/atlas execution mode visibility", () => {
  const chatRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/v1/atlas/chat/route.ts"),
    "utf8",
  );
  const askRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/v1/atlas/ask/route.ts"),
    "utf8",
  );
  const llmSource = fs.readFileSync(
    path.join(process.cwd(), "src/lib/atlas/llm.ts"),
    "utf8",
  );
  const observationsMigration = fs.readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20260627033000_atlas_observations_allow_tool_augmented.sql",
    ),
    "utf8",
  );

  it("exposes x-atlas-mode on chat and ask responses", () => {
    expect(chatRoute).toContain("'x-atlas-mode': result.atlasMode");
    expect(askRoute).toContain("'x-atlas-mode': result.atlasMode");
  });

  it("returns mode and fallback reason in the ask JSON payload", () => {
    expect(askRoute).toContain("atlasMode: result.atlasMode");
    expect(askRoute).toContain("fallbackReason: result.fallbackReason ?? null");
  });

  it("logs structured fallback mode events without hiding the reason", () => {
    expect(llmSource).toMatch(/event:\s*["']atlas_model_mode["']/);
    expect(llmSource).toMatch(/mode:\s*["']fallback["']/);
    expect(llmSource).toMatch(/fallbackReason:\s*modelName\s*\?\s*null\s*:/);
  });

  it("allows tool-augmented Atlas observations in the persisted route contract", () => {
    expect(observationsMigration).toContain(
      "atlas_observations_route_type_check",
    );
    expect(observationsMigration).toContain("'tool_augmented'");
  });
});
