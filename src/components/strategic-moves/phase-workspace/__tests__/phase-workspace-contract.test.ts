import * as fs from 'fs';
import * as path from 'path';

// The "chat can't break the workflow" contract, enforced.
// The phase-workspace surface must stay fully decoupled from the chat/agent
// layer, so a change to chat can never break the deterministic workflow. This
// test fails if any phase-workspace source file imports the agent/chat layer.

const DIR = path.join(__dirname, '..');

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        if (name !== '__tests__') walk(full);
      } else if (/\.(ts|tsx)$/.test(name)) {
        out.push(full);
      }
    }
  };
  walk(DIR);
  return out;
}

// Import specifiers that would couple the workflow surface to chat/agent.
const FORBIDDEN = [
  /from\s+['"][^'"]*\/agent\b/, // @/components/agent, @/lib/agent, ../agent
  /from\s+['"][^'"]*AgentDock/,
  /from\s+['"][^'"]*SentinelChat/,
  /from\s+['"][^'"]*\/nexus\b/i,
  /useClientContext|useFeature/, // no runtime context/flag hooks — pure props only
];

describe('phase-workspace ⟂ chat/agent (workflow works without chat)', () => {
  const files = sourceFiles();

  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(4);
  });

  it('no phase-workspace file imports the chat/agent layer or a runtime context hook', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const re of FORBIDDEN) {
        if (re.test(src)) offenders.push(`${path.basename(f)} :: ${re}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('components are pure props — no React state/effect/context hooks', () => {
    // Pure presentational surface: renders identically given the same props,
    // independent of any chat/agent runtime. Guards accidental coupling.
    const offenders: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      if (/\buseState\b|\buseEffect\b|\buseContext\b|\buseReducer\b/.test(src)) {
        offenders.push(path.basename(f));
      }
    }
    expect(offenders).toEqual([]);
  });
});
