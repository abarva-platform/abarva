/**
 * Agent tool registry — F0.4 verification (Programs Strict Completion v1.2)
 *
 * Verifies the registry's surface filter, defence-in-depth surface gate
 * inside executeTool, and unhappy-path responses (unknown tool, handler
 * throws, surface mismatch).
 */

import {
  __testing__,
  executeTool,
  getRelevantTools,
  registerTool,
  surfaceMatches,
  toAnthropicToolDefinition,
  type AgentTool,
  type ToolContext,
  type ToolResult,
} from '../registry';

beforeEach(() => {
  __testing__.reset();
});

function makeCtx(surface: string): ToolContext {
  return {
    request: new Request('http://localhost/'),
    surface,
  };
}

function makeTool(overrides: Partial<AgentTool> & { name: string; surfaces: ReadonlyArray<string> }): AgentTool {
  return {
    description: overrides.description ?? overrides.name,
    input_schema: overrides.input_schema ?? { type: 'object' },
    handler: overrides.handler ?? (async () => ({ success: true, data: {} })),
    ...overrides,
  } as AgentTool;
}

describe('registry · getRelevantTools', () => {
  it('returns only tools whose surfaces include the current surface', () => {
    registerTool(makeTool({ name: 'a_tool', surfaces: ['/programs/new'] }));
    registerTool(makeTool({ name: 'b_tool', surfaces: ['/source/SRC-AMS-2026'] }));

    expect(getRelevantTools('/programs/new').map((t) => t.name)).toEqual(['a_tool']);
    expect(getRelevantTools('/source/SRC-AMS-2026').map((t) => t.name)).toEqual(['b_tool']);
    expect(getRelevantTools('/home')).toEqual([]);
  });

  it("'*' surfaces are visible to every route", () => {
    registerTool(makeTool({ name: 'global_tool', surfaces: ['*'] }));
    expect(getRelevantTools('/programs/new').map((t) => t.name)).toEqual(['global_tool']);
    expect(getRelevantTools('/anything-at-all').map((t) => t.name)).toEqual(['global_tool']);
  });

  it('refuses duplicate registrations', () => {
    const t = makeTool({ name: 'dup', surfaces: ['*'] });
    registerTool(t);
    expect(() => registerTool(t)).toThrow(/already registered/);
  });
});

describe('registry · toAnthropicToolDefinition', () => {
  it('strips surfaces + handler, keeps name/description/input_schema', () => {
    const tool = makeTool({
      name: 'foo',
      description: 'bar',
      input_schema: { type: 'object', properties: { x: { type: 'string' } } },
      surfaces: ['/programs/new'],
    });
    const out = toAnthropicToolDefinition(tool);
    expect(out).toEqual({
      name: 'foo',
      description: 'bar',
      input_schema: { type: 'object', properties: { x: { type: 'string' } } },
    });
    expect(out).not.toHaveProperty('handler');
    expect(out).not.toHaveProperty('surfaces');
  });
});

describe('registry · executeTool', () => {
  it('returns success when handler succeeds', async () => {
    registerTool(
      makeTool({
        name: 'echo',
        surfaces: ['/test'],
        handler: async (input) => ({
          success: true,
          data: { echoed: (input as { x: number }).x },
        }),
      }),
    );
    const result = await executeTool('echo', { x: 7 }, makeCtx('/test'));
    expect(result).toEqual({ success: true, data: { echoed: 7 } });
  });

  it('returns failure with recovery when tool name is unknown', async () => {
    const result = await executeTool('does_not_exist', {}, makeCtx('/test'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Tool not registered/);
      expect(result.recovery).toMatch(/draft the request/);
    }
  });

  it('refuses to execute a tool not registered for the current surface', async () => {
    registerTool(makeTool({ name: 'sensitive', surfaces: ['/programs/new'] }));
    const result = await executeTool('sensitive', {}, makeCtx('/home'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not available on surface/);
    }
  });

  it("'*' tools execute on any surface", async () => {
    registerTool(
      makeTool({
        name: 'global',
        surfaces: ['*'],
        handler: async () => ({ success: true, data: { ran: true } }),
      }),
    );
    const result = await executeTool('global', {}, makeCtx('/anywhere'));
    expect(result.success).toBe(true);
  });

  it('catches handler exceptions and returns a structured failure', async () => {
    registerTool(
      makeTool({
        name: 'kaboom',
        surfaces: ['*'],
        handler: async () => {
          throw new Error('something broke');
        },
      }),
    );
    const result = await executeTool('kaboom', {}, makeCtx('/test'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/threw: something broke/);
      expect(result.recovery).toMatch(/retry, or do you want/);
    }
  });

  it('passes the ToolContext through to the handler', async () => {
    let captured: ToolContext | undefined;
    registerTool(
      makeTool({
        name: 'inspect_ctx',
        surfaces: ['*'],
        handler: async (_input, ctx) => {
          captured = ctx;
          return { success: true, data: {} } satisfies ToolResult;
        },
      }),
    );
    await executeTool('inspect_ctx', {}, makeCtx('/programs/new'));
    expect(captured?.surface).toBe('/programs/new');
  });
});

describe('registry · surfaceMatches (path-glob support for /:id)', () => {
  it('exact-matches literal surface keys', () => {
    expect(surfaceMatches('/programs/new', '/programs/new')).toBe(true);
    expect(surfaceMatches('/programs/new', '/programs/apx-cdp-2026')).toBe(false);
  });

  it("'*' matches every surface", () => {
    expect(surfaceMatches('*', '/programs/new')).toBe(true);
    expect(surfaceMatches('*', '/anything-else')).toBe(true);
  });

  it('glob `:id` matches a single path segment', () => {
    expect(surfaceMatches('/programs/:id', '/programs/apx-cdp-2026')).toBe(true);
    expect(surfaceMatches('/programs/:id', '/programs/apx-cc-2026')).toBe(true);
  });

  it('glob `:id` does NOT capture the sibling `new` literal', () => {
    expect(surfaceMatches('/programs/:id', '/programs/new')).toBe(false);
  });

  it('glob requires same number of path segments', () => {
    expect(surfaceMatches('/programs/:id', '/programs/abc/details')).toBe(false);
    expect(surfaceMatches('/programs/:id', '/programs')).toBe(false);
  });

  it('glob with multiple segments composes', () => {
    expect(surfaceMatches('/programs/:id/report', '/programs/apx-cdp-2026/report')).toBe(true);
    expect(surfaceMatches('/programs/:id/report', '/programs/apx-cdp-2026/edit')).toBe(false);
  });

  it('rejects empty segment for `:id`', () => {
    expect(surfaceMatches('/programs/:id', '/programs/')).toBe(false);
  });
});

describe('registry · /:id-globbed tool registration', () => {
  it('getRelevantTools returns globbed tools for matching surfaces', () => {
    registerTool(
      makeTool({
        name: 'detail_only_tool',
        surfaces: ['/programs/:id'],
      }),
    );
    expect(
      getRelevantTools('/programs/apx-cdp-2026').map((t) => t.name),
    ).toEqual(['detail_only_tool']);
    expect(getRelevantTools('/programs/new').map((t) => t.name)).toEqual([]);
    expect(getRelevantTools('/home').map((t) => t.name)).toEqual([]);
  });

  it('executeTool surface gate uses the same glob semantics (defence in depth)', async () => {
    registerTool(
      makeTool({
        name: 'detail_advance',
        surfaces: ['/programs/:id'],
        handler: async () => ({ success: true, data: { ok: true } }),
      }),
    );

    const okResult = await executeTool('detail_advance', {}, makeCtx('/programs/apx-cdp-2026'));
    expect(okResult.success).toBe(true);

    const blocked = await executeTool('detail_advance', {}, makeCtx('/programs/new'));
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error).toMatch(/not available on surface/);
    }
  });
});
