const finalMessage = jest.fn();
const stream = jest.fn(() => ({ finalMessage }));
const create = jest.fn();

jest.mock("@/lib/integrations/ai-egress/anthropic-direct", () => ({
  getAnthropicDirectClient: () => ({
    messages: { create, stream },
  }),
}));

import { governedArchitectureToolCall } from "../architecture-egress-adapter";

describe("governedArchitectureToolCall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("streams large forced-tool responses and returns final stop diagnostics", async () => {
    finalMessage.mockResolvedValue({
      model: "claude-opus-4-7",
      stop_reason: "end_turn",
      usage: { output_tokens: 12_345 },
      content: [
        {
          type: "tool_use",
          id: "tool-1",
          name: "emit_architecture_model",
          input: { engagement: "Commercial Lending Agent Assist" },
        },
      ],
    });

    const result = await governedArchitectureToolCall({
      model: "claude-opus-4-7",
      maxTokens: 32_000,
      system: "system",
      userMessage: "user",
      tool: {
        name: "emit_architecture_model",
        description: "emit",
        input_schema: { type: "object" },
      },
    });

    expect(create).not.toHaveBeenCalled();
    expect(stream).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 32_000,
        tool_choice: { type: "tool", name: "emit_architecture_model" },
      }),
    );
    expect(finalMessage).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      toolInput: { engagement: "Commercial Lending Agent Assist" },
      modelId: "claude-opus-4-7",
      stopReason: "end_turn",
      outputTokens: 12_345,
    });
  });
});
