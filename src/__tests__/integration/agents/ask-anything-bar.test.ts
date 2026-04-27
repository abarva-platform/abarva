// AskAnythingBar — universal GPT-style bottom toolbar for every agent
// surface. Source-grep + runtime contract checks; no rendering, no
// model calls, no fetch.

import * as fs from 'fs';
import * as path from 'path';
import { AskAnythingBar } from '../../../components/agent/AskAnythingBar';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/agent/AskAnythingBar.tsx'),
  'utf8',
);
const canonicalDetailSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/ProgramCanonicalDetail.tsx'),
  'utf8',
);

describe('AskAnythingBar · component contract', () => {
  it('exports a function component', () => {
    expect(typeof AskAnythingBar).toBe('function');
  });

  it('uses the GPT-style pattern: textarea + spell check + Enter submits + Shift+Enter newline', () => {
    expect(componentSource).toContain('<textarea');
    expect(componentSource).toContain('spellCheck');
    expect(componentSource).toContain("event.key === 'Enter'");
    expect(componentSource).toContain('event.shiftKey');
    expect(componentSource).toContain('event.preventDefault()');
  });

  it('auto-grows the textarea up to a max height, then scrolls', () => {
    expect(componentSource).toContain('autoGrow');
    expect(componentSource).toContain('scrollHeight');
    expect(componentSource).toContain('MAX_HEIGHT_PX');
  });

  it('renders a viewport-fixed bottom bar above the page footer', () => {
    expect(componentSource).toContain("position: 'fixed'");
    expect(componentSource).toContain('bottom: 0');
    expect(componentSource).toContain('zIndex: 50');
  });

  it('shows a mono eyebrow scoped to the agent and surface', () => {
    expect(componentSource).toContain('Ask {agentName}');
    expect(componentSource).toContain('scoped to');
    // All four canonical agents are nameable on the bar.
    expect(componentSource).toContain("nexus: 'Nexus'");
    expect(componentSource).toContain("sentinel: 'Sentinel'");
    expect(componentSource).toContain("atlas: 'Atlas'");
    expect(componentSource).toContain("steward: 'Steward'");
  });

  it('renders a Send button that is deterministic-disabled for now', () => {
    expect(componentSource).toContain('aria-label="Send"');
    expect(componentSource).toContain('disabled');
    expect(componentSource).toContain('Live ask deferred');
  });

  it('does not import model/runtime/persistence APIs', () => {
    expect(componentSource).not.toContain('openai');
    expect(componentSource).not.toContain('anthropic');
    expect(componentSource).not.toContain('claude');
    expect(componentSource).not.toContain('@/lib/models');
    expect(componentSource).not.toContain('@/lib/ai');
    expect(componentSource).not.toContain('supabase');
    expect(componentSource).not.toContain('fetch(');
  });

  it('uses the AbarVa locked palette and avoids banned tokens', () => {
    expect(componentSource).toContain('#132B4F');
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
    expect(componentSource.toLowerCase()).not.toContain('cyber');
    expect(componentSource.toLowerCase()).not.toContain('chatbot');
    expect(componentSource.toLowerCase()).not.toContain('avatar');
  });
});

describe('AskAnythingBar · mounted on Programs detail', () => {
  it('the canonical Program detail page mounts the AskAnythingBar', () => {
    expect(canonicalDetailSource).toContain('AskAnythingBar');
    expect(canonicalDetailSource).toContain('agent="nexus"');
    expect(canonicalDetailSource).toContain('scopeLabel');
  });

  it('the page reserves bottom padding so the fixed bar does not cover the footer', () => {
    // 160px bottom padding leaves room for the bar's ~120px footprint.
    expect(canonicalDetailSource).toContain("padding: '24px 28px 160px'");
  });
});
