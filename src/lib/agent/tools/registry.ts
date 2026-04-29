// Agent tool registry · F0.4 of Programs Strict Completion v1.2
//
// Closes Crawl Obs #1 (Steward "Try again" lies), #35 (A/B/C ambiguity),
// #18 (Advance to P4 button bypasses gates) — at the architectural level.
//
// Tool-use shape makes "claimed without doing" structurally impossible.
// When the user requests an action, the agent emits a `tool_use` block;
// the route invokes the tool's handler; only after the tool returns
// success does the agent generate the natural-language confirmation.
//
// Per kickoff §4 F0.4: scope is interactive routes only. Synthesis
// routes do not register tools.

import type Anthropic from '@anthropic-ai/sdk';

/**
 * Result returned by a tool handler. Loop wraps this into a
 * tool_result content block for the next agent turn.
 */
export type ToolResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string; recovery?: string };

/**
 * Runtime context handed to every tool handler. Tools that need auth or
 * tenancy can read it without re-resolving session state mid-loop.
 */
export interface ToolContext {
  /** Current request — useful for re-using auth headers when the handler calls back into our own API. */
  request: Request;
  /** The surface that registered this tool, e.g. '/programs/new'. */
  surface: string;
  /** Optional structured surface context the route already resolved. */
  surfaceContext?: Record<string, unknown>;
  /**
   * Optional out-of-band sink to the response stream. Tool handlers that
   * need to surface a side-channel hint to the client (e.g. a navigation
   * sentinel like `[[program-created:<id>]]`) write through this. The
   * default is undefined; routes that opt in pass the same writer used
   * by the tool-use loop.
   */
  writer?: { write(text: string): void };
}

/**
 * Tool definition. `surfaces` controls where this tool is available;
 * `getRelevantTools(routeContext)` filters the registry to a subset
 * matching the current surface.
 */
export interface AgentTool<I = unknown> {
  name: string;
  description: string;
  /** JSON Schema for the tool's input. Mirrors Anthropic's `Tool.input_schema`. */
  input_schema: Record<string, unknown>;
  /** Set of surface paths/patterns this tool is exposed on. Use `'*'` for global tools (rare). */
  surfaces: ReadonlyArray<string>;
  /** Server-side handler. Returns ToolResult; the loop converts it to a `tool_result` block. */
  handler: (input: I, ctx: ToolContext) => Promise<ToolResult>;
}

const REGISTRY: AgentTool[] = [];

export function registerTool<I>(tool: AgentTool<I>): void {
  if (REGISTRY.some((t) => t.name === tool.name)) {
    throw new Error(`Tool already registered: ${tool.name}`);
  }
  REGISTRY.push(tool as AgentTool);
}

/**
 * Returns the tool definitions visible to a given surface. Tools opt
 * into surfaces explicitly; `'*'` means globally available.
 */
export function getRelevantTools(surface: string): AgentTool[] {
  return REGISTRY.filter(
    (tool) => tool.surfaces.includes('*') || tool.surfaces.includes(surface),
  );
}

/**
 * Convert a typed AgentTool into the shape Anthropic's messages API
 * expects under `tools: []`.
 */
export function toAnthropicToolDefinition(tool: AgentTool): Anthropic.Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as Anthropic.Tool['input_schema'],
  };
}

/**
 * Resolve and execute a tool by name. Returns a typed ToolResult; the
 * caller (toolUseLoop) maps it to a tool_result content block.
 */
export async function executeTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = REGISTRY.find((t) => t.name === name);
  if (!tool) {
    return {
      success: false,
      error: `Tool not registered: ${name}`,
      recovery:
        "I'd need a tool I don't have access to in order to actually do that. " +
        'Want me to draft the request for you to send manually?',
    };
  }
  // Surface gate — defence in depth. The agent should only see tools
  // for its current surface, but if a tool name leaks across surfaces
  // we fail closed rather than executing it.
  if (!tool.surfaces.includes('*') && !tool.surfaces.includes(ctx.surface)) {
    return {
      success: false,
      error: `Tool ${name} is not available on surface ${ctx.surface}`,
      recovery: 'This action is not allowed from the current surface.',
    };
  }
  try {
    return await tool.handler(input as never, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Tool ${name} threw: ${message}`,
      recovery:
        'The action failed unexpectedly. Want me to retry, or do you want to take a different path?',
    };
  }
}

// Test-only access to the registry. Never imported from production code.
export const __testing__ = {
  reset(): void {
    REGISTRY.length = 0;
  },
  list(): AgentTool[] {
    return [...REGISTRY];
  },
};
