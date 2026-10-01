import type {
  AnthropicDirectClient,
  AnthropicMessageStreamParams,
  ContentBlock,
} from '@/lib/integrations/ai-egress';
import { __testing__, registerTool, type ToolContext } from '../tools/registry';
import { runToolUseLoop } from './toolUseLoop';

// Drives the loop with a scripted Anthropic client. Each scripted turn is the
// final message content that turn returns, plus the text deltas it streams.
// The request for every turn is snapshotted at call time: the loop keeps
// appending to one messages array, so a stored reference would show turn 1
// with turn 2's history.
type ScriptedTurn = { content: ContentBlock[]; text?: string[] };
type ToolChoice = AnthropicMessageStreamParams['tool_choice'];

function scriptedClient(turns: ScriptedTurn[]) {
  const requests: AnthropicMessageStreamParams[] = [];
  const client = {
    messages: {
      stream(params: AnthropicMessageStreamParams) {
        requests.push(structuredClone(params));
        const turn = turns[requests.length - 1];
        if (!turn) throw new Error(`no scripted turn ${requests.length}`);
        let onText: ((delta: string) => void) | undefined;
        return {
          on(event: string, handler: (delta: string) => void) {
            if (event === 'text') onText = handler;
            return this;
          },
          async finalMessage() {
            for (const delta of turn.text ?? []) onText?.(delta);
            return { content: turn.content };
          },
        };
      },
    },
  } as unknown as AnthropicDirectClient;
  return { client, requests };
}

const SURFACE = '/programs/new';

const toolUse = (id: string, input: Record<string, unknown> = {}) =>
  ({ type: 'tool_use', id, name: 'commit_program', input }) as unknown as ContentBlock;
const text = (value: string) =>
  ({ type: 'text', text: value, citations: null }) as unknown as ContentBlock;

const toolContext = { request: new Request('http://localhost/test'), surface: SURFACE } as ToolContext;
const FORCED: ToolChoice = {
  type: 'tool',
  name: 'commit_program',
};

function run(turns: ScriptedTurn[], initialToolChoice?: ToolChoice) {
  const { client, requests } = scriptedClient(turns);
  const written: string[] = [];
  const tool = __testing__.list().find((t) => t.name === 'commit_program')!;
  const result = runToolUseLoop({
    client,
    model: 'test-model',
    maxTokens: 256,
    system: 'system prompt',
    messages: [{ role: 'user', content: 'Create the program.' }],
    tools: [tool],
    initialToolChoice,
    toolContext,
    writer: { write: (chunk) => written.push(chunk) },
  });
  return { result, requests, written };
}

describe('runToolUseLoop', () => {
  const handled: unknown[] = [];

  beforeEach(() => {
    __testing__.reset();
    handled.length = 0;
    registerTool<{ name?: string }>({
      name: 'commit_program',
      description: 'Commit the drafted program.',
      input_schema: { type: 'object', properties: { name: { type: 'string' } } },
      surfaces: [SURFACE],
      handler: async (input) => {
        handled.push(input);
        return { success: true, data: { programId: 'prog-1' } };
      },
    });
  });

  it('sends the explicit initial tool choice on the first model turn only', async () => {
    const { result, requests } = run(
      [{ content: [toolUse('tu-1', { name: 'Fleet' })] }, { content: [text('Registered.')] }],
      FORCED,
    );

    await expect(result).resolves.toMatchObject({ turns: 2, exhausted: false });
    expect(requests).toHaveLength(2);
    expect(requests[0].tool_choice).toEqual(FORCED);
    expect(requests[1]).not.toHaveProperty('tool_choice');
    // The tools stay offered on the follow-up turn; only the forcing is dropped.
    expect(requests[1].tools?.map((t) => t.name)).toEqual(['commit_program']);
  });

  it('does not repeat the forced choice across a chain of tool turns', async () => {
    const { result, requests } = run(
      [
        { content: [toolUse('tu-1')] },
        { content: [toolUse('tu-2')] },
        { content: [text('Both landed.')] },
      ],
      FORCED,
    );

    await expect(result).resolves.toMatchObject({ turns: 3, exhausted: false });
    expect(requests.map((request) => 'tool_choice' in request)).toEqual([true, false, false]);
  });

  it('sends no tool_choice key at all when none is given', async () => {
    const { result, requests } = run([{ content: [text('Nothing to commit yet.')] }]);

    await expect(result).resolves.toMatchObject({ turns: 1, toolInvocations: [] });
    expect(requests[0]).not.toHaveProperty('tool_choice');
    expect(requests[0].tools?.map((t) => t.name)).toEqual(['commit_program']);
  });

  it('runs the tool before the next turn and hands that turn the tool result', async () => {
    const { result, requests, written } = run(
      [
        { content: [toolUse('tu-1', { name: 'Fleet' })] },
        { content: [text('Registered.')], text: ['Regis', 'tered.'] },
      ],
      FORCED,
    );

    const outcome = await result;
    expect(handled).toEqual([{ name: 'Fleet' }]);
    expect(outcome.toolInvocations.map(({ name, success }) => ({ name, success }))).toEqual([
      { name: 'commit_program', success: true },
    ]);
    const history = requests[1].messages;
    expect(history.map((message) => message.role)).toEqual(['user', 'assistant', 'user']);
    expect(history[2].content).toEqual([
      {
        type: 'tool_result',
        tool_use_id: 'tu-1',
        content: JSON.stringify({ success: true, data: { programId: 'prog-1' } }),
        is_error: false,
      },
    ]);
    // The confirmation text is the turn AFTER the tool result.
    expect(written.join('')).toBe('Registered.');
  });
});
