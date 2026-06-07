import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("AI egress provider contract for Sentinel and Source", () => {
  it("keeps Sentinel reasoning calls on the Anthropic audit provider", () => {
    const source = read("src/lib/agents/sentinel-reasoning/model.ts");

    expect(source).toContain("callModel({");
    expect(source).toContain("provider: 'anthropic'");
    expect(source).toContain("route: 'azure-foundry-private'");
    expect(source).not.toContain("provider: 'openai'");
  });

  it("keeps Source artifact generation on the Anthropic audit preflight", () => {
    const route = read(
      "src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-openai/route.ts",
    );
    const promptRegistry = read(
      "src/lib/source/agent-generation/prompt-registry.ts",
    );

    expect(route).toContain("preflightAnthropicDirectClient");
    expect(route).toContain('workflow: "source-artifact-generate"');
    expect(route).toContain("process.env.ANTHROPIC_API_KEY");
    expect(route).toContain("preflight.client.messages.create");
    expect(promptRegistry).toContain('const DEFAULT_MODEL = "claude-sonnet-4-6"');

    expect(route).not.toContain("preflightOpenAIDirectClient");
    expect(route).not.toContain("process.env.OPENAI_API_KEY");
    expect(route).not.toContain("preflight.client.responses.create");
  });
});
