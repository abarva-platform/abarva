// toolUseLoop · F0.4 multi-turn tool-use streaming
//
// Anthropic's tool-use streaming is a multi-turn loop, not a single
// paused stream. When the model emits a `tool_use` block:
//   1. The current turn's stream completes
//   2. We invoke the tool's handler
//   3. We start a NEW completion request with `tool_result` appended
//      to the conversation history
//   4. That new stream may contain text (the agent's natural-language
//      confirmation) or another `tool_use` block (if the agent needs
//      to chain tools)
//   5. Loop until the turn produces no tool_use blocks
//
// This module wraps that loop so route handlers can declare:
//   tools: [commit_program]
// and stream the result without thinking about turn management.
//
// Per kickoff §4 F0.4: the loop is the structural mechanism that makes
// "Registered ✅ but DB write failed" impossible — the agent's
// confirmation text is generated AFTER the tool result is known.

import type Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlock,
  ContentBlockParam,
  MessageParam,
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages';
import type { AgentTool, ToolContext, ToolResult } from '../tools/registry';
import { executeTool, toAnthropicToolDefinition } from '../tools/registry';

/**
 * Hard cap on tool-use iterations per request. Each turn is a full
 * Anthropic completion. 6 is generous: the typical Steward flow is
 * one tool call (commit_program) so 1 iteration covers the success
 * case; 6 leaves room for retries / chained tools without runaway.
 */
const MAX_TOOL_TURNS = 6;

/**
 * Writer abstraction so callers (route handlers using ReadableStream)
 * can plug in their own text-output sink.
 */
export interface StreamWriter {
  /** Send a text chunk to the client. Concatenates onto the response stream. */
  write(text: string): void;
}

export interface ToolUseLoopArgs {
  client: Anthropic;
  model: string;
  maxTokens: number;
  system: string;
  messages: ReadonlyArray<MessageParam>;
  tools: ReadonlyArray<AgentTool>;
  toolContext: ToolContext;
  writer: StreamWriter;
}

export interface ToolUseLoopResult {
  /** Number of turns the loop ran (≥1). */
  turns: number;
  /** Tools invoked this request, in invocation order. */
  toolInvocations: Array<{
    name: string;
    success: boolean;
    durationMs: number;
  }>;
  /** True if the loop exited because it hit MAX_TOOL_TURNS. */
  exhausted: boolean;
}

function isToolUse(block: ContentBlock): block is ToolUseBlock {
  return block.type === 'tool_use';
}

/**
 * Run the tool-use loop, streaming text to `args.writer` as it arrives.
 *
 * Resolves once the agent's response has no further tool_use blocks
 * (or the iteration cap is reached). Errors propagate; callers should
 * close the underlying ReadableStream in a finally.
 */
export async function runToolUseLoop(args: ToolUseLoopArgs): Promise<ToolUseLoopResult> {
  const {
    client,
    model,
    maxTokens,
    system,
    tools,
    toolContext,
    writer,
  } = args;

  const messages: MessageParam[] = [...args.messages];
  const anthropicTools = tools.map(toAnthropicToolDefinition);
  const toolInvocations: ToolUseLoopResult['toolInvocations'] = [];

  for (let turn = 1; turn <= MAX_TOOL_TURNS; turn++) {
    const streamArgs: Anthropic.MessageStreamParams = {
      model,
      max_tokens: maxTokens,
      system,
      messages,
      ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
    };

    const stream = client.messages.stream(streamArgs);

    // Forward text deltas to the client as they arrive.
    stream.on('text', (delta: string) => {
      writer.write(delta);
    });

    const finalMessage = await stream.finalMessage();

    // Collect tool_use blocks emitted in this turn.
    const toolUses = finalMessage.content.filter(isToolUse);

    if (toolUses.length === 0) {
      // No tools requested → the agent's response is final.
      return { turns: turn, toolInvocations, exhausted: false };
    }

    // Execute each tool. Results are wrapped into tool_result blocks
    // and appended to the conversation history for the next turn.
    const toolResultBlocks: ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const startedAt = Date.now();
      const result: ToolResult = await executeTool(tu.name, tu.input, toolContext);
      toolInvocations.push({
        name: tu.name,
        success: result.success,
        durationMs: Date.now() - startedAt,
      });
      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(result),
        is_error: !result.success,
      });
    }

    // Append the assistant's full message (including tool_use blocks)
    // followed by a user message carrying the tool_result blocks.
    messages.push({
      role: 'assistant',
      content: finalMessage.content as ContentBlockParam[],
    });
    messages.push({
      role: 'user',
      content: toolResultBlocks,
    });

    // Loop again — the agent will now generate its natural-language
    // confirmation (or chain to another tool).
  }

  // Hit the iteration cap. Surface a graceful note to the user; the
  // route's caller can also inspect `exhausted: true` for telemetry.
  writer.write(
    "\n\n_(I made several tool calls and need to stop here. Want me to summarize what landed?)_",
  );
  return { turns: MAX_TOOL_TURNS, toolInvocations, exhausted: true };
}
