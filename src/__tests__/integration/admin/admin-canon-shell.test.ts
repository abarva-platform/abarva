// DES8 · AdminCanonShell tests.
//
// Pure type/source tests. No jsdom rendering, no DOM, no model
// calls. Verifies the component exports, prop-shape coverage of the
// workflow contract, and AbarVa color hygiene.

import * as fs from 'fs';
import * as path from 'path';

import {
  AdminCanonShell,
  type AdminAgentKey,
  type AdminCanonShellProps,
  type AdminCanonShellWorkflowMeta,
} from '@/components/admin/AdminCanonShell';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentPath = path.join(
  repoRoot,
  'src/components/admin/AdminCanonShell.tsx'
);
const componentSource = fs.readFileSync(componentPath, 'utf8');

describe('AdminCanonShell · exports', () => {
  test('AdminCanonShell exports as a function', () => {
    expect(typeof AdminCanonShell).toBe('function');
  });

  test('AdminCanonShellProps shape carries title and children', () => {
    const props: AdminCanonShellProps = {
      title: 'Production Readiness',
      children: null,
    };
    expect(props.title).toBe('Production Readiness');
    expect(props.children).toBeNull();
  });

  test('AdminCanonShellWorkflowMeta shape carries pageQuestion and primaryAgent', () => {
    const meta: AdminCanonShellWorkflowMeta = {
      pageQuestion: 'Is the platform ready for pilot?',
      primaryAgent: 'steward',
    };
    expect(meta.pageQuestion).toBe('Is the platform ready for pilot?');
    expect(meta.primaryAgent).toBe('steward');
  });

  test('AdminAgentKey accepts the four canonical admin agents', () => {
    const agents: AdminAgentKey[] = ['nexus', 'sentinel', 'atlas', 'steward'];
    expect(agents).toHaveLength(4);
    expect(agents).toEqual(['nexus', 'sentinel', 'atlas', 'steward']);
  });
});

describe('AdminCanonShell · AbarVa color hygiene', () => {
  test('source contains warm off-white surface #FBFAF7', () => {
    expect(componentSource).toContain('#FBFAF7');
  });

  test('source contains navy accent #1B2B5C', () => {
    expect(componentSource).toContain('#1B2B5C');
  });

  test('source does NOT contain teal #14B8A6', () => {
    expect(componentSource).not.toContain('#14B8A6');
  });

  test('source does NOT contain teal #0E9F8C', () => {
    expect(componentSource).not.toContain('#0E9F8C');
  });

  test('source does NOT contain solid black background #0A0A0A', () => {
    expect(componentSource).not.toContain('#0A0A0A');
  });

  test('source does NOT contain Sanskrit characters (Devanagari block)', () => {
    expect(componentSource).not.toMatch(/[ऀ-ॿ]/);
  });
});

describe('AdminCanonShell · workflow contract coverage', () => {
  test('source references pageQuestion (workflow contract field)', () => {
    expect(componentSource).toContain('pageQuestion');
  });

  test('source references primaryAgent (workflow contract field)', () => {
    expect(componentSource).toContain('primaryAgent');
  });

  test('source references recommendedNextAction or recommended action language', () => {
    expect(
      componentSource.includes('recommendedNextAction') ||
        componentSource.toLowerCase().includes('recommended')
    ).toBe(true);
  });
});
