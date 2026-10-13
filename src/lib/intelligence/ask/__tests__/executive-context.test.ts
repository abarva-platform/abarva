jest.mock("server-only", () => ({}));
const getAuditedAnthropicClient = jest.fn();
jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { prepareExecutiveContext } from "../executive-context";
import { synthesizeStream } from "../synthesizer";

it("uses the policy's conservative readiness floor and does not promote source readiness", () => {
  const source = {
    id: "test-source",
    type: "TENANT" as const,
    name: "Evidence",
    detail: "Provisional source",
    confidence: 0.8,
  };
  const result = prepareExecutiveContext(
    [source],
    CANONICAL_TENANT_KEYS[0],
    "test-tenant",
  );
  expect(result.sources).toEqual([source]);
  expect(result.bundle.agentReadyCount).toBe(0);
  expect(result.bundle.usable[0].agent_readiness_status).toBe("not_reviewed");
  expect(result.bundle.usable[0].retrievability).toBe("committed_not_indexed");
  expect(result.decisionGuard).toContain(
    "Every supplied company source is provisional",
  );
});

it("excludes every blocked source, including ungovernable session context", () => {
  const result = prepareExecutiveContext(
    [{ id: "s", type: "TENANT", name: "Evidence", detail: "Private context" }],
    CANONICAL_TENANT_KEYS[0],
    null,
    "Private session context",
  );
  expect(result.sources).toEqual([]);
  expect(result.bundle.blocked).toHaveLength(2);
});

it("never sends blocked sources or ungated supplemental data to Claude", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test";
  try {
    getAuditedAnthropicClient.mockResolvedValue({
      auditId: "test",
      client: {
        messages: {
          create: async () => ({
            async *[Symbol.asyncIterator]() {
              yield {
                type: "content_block_delta",
                delta: {
                  type: "text_delta",
                  text: "Validate first.\n\nKeep the original prose.",
                },
              };
            },
          }),
        },
      },
    });
    let input: { system: string; user: string } | undefined;
    let output = "";
    for await (const delta of synthesizeStream({
      tenantId: "test-tenant",
      tenantClientKey: "noncanonical-test-key",
      intent: "general_synthesis",
      query: "Which decision should we validate?",
      modelAuthoredOutput: true,
      richText: true,
      sources: [
        {
          id: "s",
          type: "TENANT",
          name: "Evidence",
          detail: "BLOCKED_SECRET_MARKER",
        },
      ],
      factAvailabilityBlock: "UNGATED_SECRET_MARKER",
      userContextBlock: "UNGATED_SECRET_MARKER",
      onModelInput: (parts) => {
        input = parts;
      },
    }))
      output += delta;
    expect(input).toBeDefined();
    expect(`${input!.system}\n${input!.user}`).not.toContain("SECRET_MARKER");
    expect(input!.system).toContain(
      "EVIDENCE RULE FOR THIS ANSWER",
    );
    expect(input!.system).toContain("These rules bind EVERY visible field");
    expect(input!.system).toContain("even when a supplied source contains them");
    expect(input!.system).toContain("User-requested option counts");
    expect(input!.system).toContain("incremental annual benefit covers all annualized");
    expect(input!.system).toContain("ONE capability in the opening and exhibit title");
    expect(input!.system.indexOf("EVIDENCE RULE FOR THIS ANSWER")).toBeGreaterThan(
      input!.system.indexOf("EXHIBIT PROTOCOL"),
    );
    expect(input!.user).toContain("EVIDENCE RULE FOR THIS ANSWER");
    expect(input!.user.indexOf("EVIDENCE RULE FOR THIS ANSWER")).toBeGreaterThan(
      input!.user.indexOf("FOLLOW-UP DECISION TEST"),
    );
    expect(input!.user.indexOf("FIRST RESPONSE WORD BUDGET")).toBeGreaterThan(
      input!.user.indexOf("EVIDENCE RULE FOR THIS ANSWER"),
    );
    expect(output).toBe("Validate first.\n\nKeep the original prose.");
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  }
});
