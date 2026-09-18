import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { createAutonomousDecisionTextStreamer } from "@/lib/ai-liability/human-decision-controls";

type StreamController = {
  enqueue(chunk: Uint8Array): void;
  close(): void;
};

function streamStartBody(): string {
  const route = readFileSync(join(process.cwd(), "src/app/api/chat/agent/route.ts"), "utf8");
  const file = ts.createSourceFile("route.ts", route, ts.ScriptTarget.Latest, true);
  let body: string | undefined;
  function visit(node: ts.Node) {
    if (
      ts.isNewExpression(node) &&
      node.expression.getText(file) === "ReadableStream" &&
      node.arguments?.[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const start = node.arguments[0].properties.find(
        (property): property is ts.MethodDeclaration =>
          ts.isMethodDeclaration(property) && property.name.getText(file) === "start",
      );
      body = start?.body?.getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!body) throw new Error("Agent route stream start handler not found");
  return body;
}

async function runVisibleStream(chunks: string[], direct: boolean): Promise<string> {
  const output: Uint8Array[] = [];
  const controller: StreamController = {
    enqueue: (chunk) => output.push(chunk),
    close: () => undefined,
  };
  const scope = {
    pendingAgentOutput: "",
    bufferedOutput: "",
    encoder: new TextEncoder(),
    demoSafeClientText: (text: string) => text,
    createRestrictedFinancialTextStreamer: () => ({
      push: (text: string) => text,
      flush: () => "",
    }),
    userAccessPolicy: null,
    isDirectClaudeSurface: () => direct,
    createAutonomousDecisionTextStreamer,
    surface: direct ? "/home" : "/intelligence",
    contextBundleArtifact: "",
    shouldRunProviderOverloadDrill: () => false,
    request: {},
    runToolUseLoop: async ({ writer, toolContext }: {
      writer: { write(text: string): void };
      toolContext: { writer: { write(text: string): void } };
    }) => {
      writer.write(chunks[0]);
      for (const chunk of chunks.slice(1)) toolContext.writer.write(chunk);
    },
    anthropicClient: {},
    getAgentResponseTokenBudget: () => 100,
    systemPrompt: "",
    conversationHistory: [],
    userMessage: { role: "user", content: "test" },
    tools: [],
    initialToolChoice: undefined,
    body: { surfaceContext: {} },
    activeClientKey: null,
    tenancy: null,
    sourceAccessPolicy: null,
    programAccessPolicy: null,
    sourceAvaTelemetryGateActive: false,
    isProviderOverloadLike: () => false,
    formatProviderOverloadFallback: () => "",
    agentName: "Nexus",
    tenantName: "Test tenant",
    validateSynthesisOutput: () => ({ violations: [] }),
    categoryPlaybook: null,
    stagePlaybook: null,
    checkSentinelVoice: () => ({ violations: [] }),
    canUseSupabaseViolationBackend: () => false,
    recordViolations: () => undefined,
  };
  const source = ts.transpileModule(
    `async function start(controller: unknown) ${streamStartBody()}\nreturn start;`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const names = Object.keys(scope);
  const start = new Function(...names, source)(...Object.values(scope)) as (
    controller: StreamController,
  ) => Promise<void>;
  await start(controller);
  return new TextDecoder().decode(Buffer.concat(output.map((chunk) => Buffer.from(chunk))));
}

describe("agent visible stream controls", () => {
  it.each([true, false])("scrubs model and tool text on direct=%s", async (direct) => {
    const answer = await runVisibleStream(
      ["Nexus approved the award. ", "The model selected the vendor."],
      direct,
    );
    expect(answer).toContain("The AI advisor recommended for human review the award.");
    expect(answer).toContain("the AI-assisted workflow recommended for human review the vendor.");
    expect(answer).not.toMatch(/Nexus approved|model selected/i);
  });

  it.each([true, false])("scrubs a phrase split across output chunks on direct=%s", async (direct) => {
    const answer = await runVisibleStream(["Nexus appro", "ved the award."], direct);
    expect(answer).toBe("The AI advisor recommended for human review the award.");
    expect(answer).not.toContain("Nexus approved");
  });

  it.each([true, false])("holds a split name and flushes an unfinished sentence on direct=%s", async (direct) => {
    const answer = await runVisibleStream(["Nex", "us approved the award"], direct);
    expect(answer).toBe("The AI advisor recommended for human review the award");
  });

  it("preserves ordinary text while withholding an unfinished control phrase", async () => {
    const answer = await runVisibleStream(
      ["The evidence is ready. AbarVa dec", "ided the outcome."],
      true,
    );
    expect(answer).toBe("The evidence is ready. The client decision owner reviewed the outcome.");
  });
});
