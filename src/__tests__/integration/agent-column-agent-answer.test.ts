import fs from 'node:fs';
import path from 'node:path';

// AgentColumn (src/components/shell/AgentColumn.tsx) has no existing render
// test harness — it's a "use client" component wired to useAtlasPageState +
// useAgentStream, which would need substantial mocking to mount in isolation.
// Mirrors the established convention for this same real-live-surface pairing
// (see atlas-page-state-timeout.test.ts's source-literal assertions against
// AtlasPageStateProvider.tsx) rather than inventing a new harness.
describe('AgentColumn renders a governed AvaAnswerPacket on a ChatTurn', () => {
  it('imports AgentAnswerRenderer and threads turn.agentAnswer through ChatBubble', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/shell/AgentColumn.tsx'),
      'utf8',
    );

    expect(source).toContain(
      'import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";',
    );
    expect(source).toContain('agentAnswer={turn.agentAnswer}');
    expect(source).toContain('agentAnswer?: AvaAnswerPacket;');
    expect(source).toContain('<AgentAnswerRenderer');
    expect(source).toContain('showProse={false}');
  });
});
