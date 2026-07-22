import fs from 'node:fs';
import path from 'node:path';

// AskAnythingBar (src/components/agent/AskAnythingBar.tsx) is the actual
// viewport-fixed "Ask aVa" bar mounted on every agent surface, including
// Source event pages — confirmed via live browser verification (direct
// network-request inspection showed it POSTs to nexus/ask, and DOM
// inspection showed neither AgentColumn's ChatBubble nor a "Conversation"
// thread render on that page; only AskAnythingBar's transient
// currentResponse/currentResponseParts/currentAgentAnswer state does).
// No existing render-test harness for this "use client" component — mirrors
// the same source-literal-assertion convention used elsewhere in this file
// set for AtlasPageStateProvider.tsx / AgentColumn.tsx.
describe('AskAnythingBar renders a governed AvaAnswerPacket from transient Atlas state', () => {
  it('reads currentAgentAnswer and renders AgentAnswerRenderer when present', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/agent/AskAnythingBar.tsx'),
      'utf8',
    );

    expect(source).toContain(
      "import { AgentAnswerRenderer } from '@/components/agent-answer/AgentAnswerRenderer';",
    );
    expect(source).toContain('const agentAnswer = pageState?.currentAgentAnswer;');
    expect(source).toContain('responseParts.length > 0 || agentAnswer');
    expect(source).toContain('<AgentAnswerRenderer answer={agentAnswer} showProse={false} />');
  });
});
