/**
 * Restricted-financial redaction must run on every surface, including
 * `/intelligence`.
 *
 * The redaction sink lives inside the agent route's `ReadableStream` start
 * handler, so a unit test of `sanitizeRestrictedFinancialText` proves nothing
 * about whether the route reaches it. This suite extracts the real `start`
 * body from `route.ts`, transpiles it, and runs it with the REAL
 * `createRestrictedFinancialTextStreamer` and a real restricted policy — the
 * control has to actually execute. A sibling suite
 * (`agent-visible-stream-controls.test.ts`) stubs the streamer to a
 * pass-through because it is asserting the autonomous-decision scrub; nothing
 * there exercises redaction.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { createAutonomousDecisionTextStreamer } from "@/lib/ai-liability/human-decision-controls";
import { createRestrictedFinancialTextStreamer } from "@/lib/agent/restricted-output-policy";

type StreamController = {
  enqueue(chunk: Uint8Array): void;
  close(): void;
};

/** A user with no entitlement to exact financial values. */
const RESTRICTED_POLICY = { outputPolicy: { exactFinancialValues: false } };
/** A user who may see them. */
const ENTITLED_POLICY = { outputPolicy: { exactFinancialValues: true } };

function streamStartBody(): string {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );
  const file = ts.createSourceFile(
    "route.ts",
    route,
    ts.ScriptTarget.Latest,
    true,
  );
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
          ts.isMethodDeclaration(property) &&
          property.name.getText(file) === "start",
      );
      body = start?.body?.getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!body) throw new Error("Agent route stream start handler not found");
  return body;
}

async function runVisibleStream(options: {
  chunks: string[];
  surface: string;
  policy: { outputPolicy: { exactFinancialValues: boolean } } | null;
}): Promise<string> {
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
    // The real streamer, not a pass-through. This is the control under test.
    createRestrictedFinancialTextStreamer,
    userAccessPolicy: options.policy,
    createAutonomousDecisionTextStreamer,
    surface: options.surface,
    contextBundleArtifact: "",
    shouldRunProviderOverloadDrill: () => false,
    request: {},
    runToolUseLoop: async ({
      writer,
      toolContext,
    }: {
      writer: { write(text: string): void };
      toolContext: { writer: { write(text: string): void } };
    }) => {
      writer.write(options.chunks[0]);
      for (const chunk of options.chunks.slice(1))
        toolContext.writer.write(chunk);
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
    programAccessPolicy: options.policy,
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
  const start = new Function(
    ...names,
    source,
  )(...Object.values(scope)) as (controller: StreamController) => Promise<void>;
  await start(controller);
  return new TextDecoder().decode(
    Buffer.concat(output.map((chunk) => Buffer.from(chunk))),
  );
}

describe("restricted-financial redaction on the agent stream", () => {
  // `/intelligence` is the surface the bypass singled out. `/tower` is a
  // control surface that was never bypassed — if it ever regresses, this
  // catches that too.
  it.each(["/intelligence", "intelligence", "/tower"])(
    "redacts an exact money value on surface %s",
    async (surface) => {
      const answer = await runVisibleStream({
        chunks: ["Contract renewal is $22.1K this year."],
        surface,
        policy: RESTRICTED_POLICY,
      });
      expect(answer).not.toContain("$22.1K");
      expect(answer).toContain("[restricted financial value]");
    },
  );

  it("redacts a money value split across stream chunks on /intelligence", async () => {
    const answer = await runVisibleStream({
      chunks: ["Contract renewal is $22", ".1K this year."],
      surface: "/intelligence",
      policy: RESTRICTED_POLICY,
    });
    // The live-observed leak this guards: the tail of a split token escaping
    // as "[restricted financial value].1K".
    expect(answer).not.toMatch(/22|\.1K/);
    expect(answer).toContain("[restricted financial value]");
  });

  it("flushes a held money token at stream end on /intelligence", async () => {
    const answer = await runVisibleStream({
      chunks: ["Total exposure is $4.8 million"],
      surface: "/intelligence",
      policy: RESTRICTED_POLICY,
    });
    expect(answer).toBe("Total exposure is [restricted financial value]");
  });

  it("redacts tool-side writes on /intelligence, not just model deltas", async () => {
    const answer = await runVisibleStream({
      chunks: ["Summary: ", "the vendor quoted $310,000."],
      surface: "/intelligence",
      policy: RESTRICTED_POLICY,
    });
    expect(answer).not.toContain("310,000");
    expect(answer).toContain("[restricted financial value]");
  });

  it("passes exact values through for an entitled user on /intelligence", async () => {
    const answer = await runVisibleStream({
      chunks: ["Contract renewal is $22.1K this year."],
      surface: "/intelligence",
      policy: ENTITLED_POLICY,
    });
    expect(answer).toBe("Contract renewal is $22.1K this year.");
    expect(answer).not.toContain("[restricted financial value]");
  });
});
