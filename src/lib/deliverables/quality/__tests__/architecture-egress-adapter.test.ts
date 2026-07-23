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

  it("retries a transient Anthropic overload with bounded backoff", async () => {
    jest.useFakeTimers();
    finalMessage
      .mockRejectedValueOnce({
        status: 529,
        error: { type: "overloaded_error", message: "Overloaded" },
      })
      .mockResolvedValueOnce({
        model: "claude-opus-4-7",
        stop_reason: "end_turn",
        usage: { output_tokens: 10_000 },
        content: [
          {
            type: "tool_use",
            input: { engagement: "Commercial Lending Agent Assist" },
          },
        ],
      });

    const resultPromise = governedArchitectureToolCall({
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
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        toolInput: { engagement: "Commercial Lending Agent Assist" },
      }),
    );
    expect(stream).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("does not retry a non-transient request error", async () => {
    finalMessage.mockRejectedValueOnce({
      status: 400,
      error: { type: "invalid_request_error", message: "Invalid schema" },
    });

    await expect(
      governedArchitectureToolCall({
        model: "claude-opus-4-7",
        maxTokens: 32_000,
        system: "system",
        userMessage: "user",
        tool: {
          name: "emit_architecture_model",
          description: "emit",
          input_schema: { type: "object" },
        },
      }),
    ).rejects.toEqual(
      expect.objectContaining({ status: 400 }),
    );
    expect(stream).toHaveBeenCalledTimes(1);
  });
});
