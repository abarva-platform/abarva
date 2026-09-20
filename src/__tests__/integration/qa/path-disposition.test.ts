/**
 * T-524 — shared path disposition.
 *
 * The defect this covers: src/components/intelligence/IntelligenceRouteShell.tsx
 * carried two dispositions at once. The blueprint report declared it removed
 * (its containing directory deleted by 0c6a86c51); the route-shell report, in
 * the same tree on the same commit, called it "a Wave-20 SHELL7 component ...
 * not yet integrated". Both cannot be true, and the second was a guess.
 */

import {
  resolvePathStatus,
  SHARED_PATH_DISPOSITIONS,
  type PathDispositionRegister,
} from '../../../lib/qa/path-disposition';
import {
  ROUTE_SHELL_PATH_REGISTER,
  runActiveRouteShellVerification,
} from '../../../lib/qa/active-route-shell-verification';
import {
  BLUEPRINT_PATH_REGISTER,
  runIntelTowerBlueprintVerification,
} from '../../../lib/qa/intelligence-tower-blueprint-verification';

const SHARED_PATH = 'src/components/intelligence/IntelligenceRouteShell.tsx';

const FIXTURE: PathDispositionRegister = {
  'a/retired-file.ts': {
    retired: {
      scope: 'path',
      commit: 'abc123def',
      slice: 'a named slice',
      replacement: 'a/replacement.ts',
      note: 'Removed on purpose.',
    },
  },
  'a/retired-dir-file.ts': {
    retired: {
      scope: 'containing-directory',
      commit: 'abc123def',
      slice: 'a named slice',
      replacement: null,
      note: 'The directory went; this file never landed.',
    },
  },
  'a/pending-file.ts': {
    pending: { slice: 'SLICE9', note: 'Not built yet.' },
  },
  'a/undecided-file.ts': {
    undecided: { owner: 'T-000', note: 'Nobody has ruled on this.' },
  },
};

describe('resolvePathStatus — an absence is declared, never inferred', () => {
  it('absent + declared retired by path -> removed, naming the commit', () => {
    const { status, detail } = resolvePathStatus('a/retired-file.ts', false, FIXTURE);
    expect(status).toBe('removed');
    expect(detail).toContain('abc123def');
    expect(detail).toContain('Replacement: a/replacement.ts');
  });

  it('absent + retired by containing-directory says the file never landed', () => {
    const { status, detail } = resolvePathStatus('a/retired-dir-file.ts', false, FIXTURE);
    expect(status).toBe('removed');
    expect(detail).toContain('never appeared on this history');
    expect(detail).toContain('Replacement: none');
  });

  it('absent + declared pending -> deferred, naming the slice', () => {
    const { status, detail } = resolvePathStatus('a/pending-file.ts', false, FIXTURE);
    expect(status).toBe('deferred');
    expect(detail).toContain('SLICE9');
  });

  it('absent + undecided -> deferred, naming the owner and claiming nothing', () => {
    const { status, detail } = resolvePathStatus('a/undecided-file.ts', false, FIXTURE);
    expect(status).toBe('deferred');
    expect(detail).toContain('T-000');
    expect(detail).toContain('Nothing is pending');
  });

  it('absent + nothing declared -> fail, asking for the declaration', () => {
    const { status, detail } = resolvePathStatus('a/undeclared.ts', false, FIXTURE);
    expect(status).toBe('fail');
    expect(detail).toContain('nothing declares why');
  });

  it('present + nothing declared -> pass', () => {
    expect(resolvePathStatus('a/undeclared.ts', true, FIXTURE).status).toBe('pass');
  });

  it('present + declared retired -> fail, because the register went stale', () => {
    // The direction that matters: a register is only worth having if it can be
    // wrong in both directions. A retired file coming back must not read pass.
    const { status, detail } = resolvePathStatus('a/retired-file.ts', true, FIXTURE);
    expect(status).toBe('fail');
    expect(detail).toContain('but the file is present');
  });

  it('present + declared pending -> pass, since the slice landed', () => {
    expect(resolvePathStatus('a/pending-file.ts', true, FIXTURE).status).toBe('pass');
  });

  it('names the register it was given, so the reader knows what to edit', () => {
    // Two registers share this resolver. A message saying "declare it in the
    // register" sends the reader looking for which one.
    const undeclared = resolvePathStatus('a/undeclared.ts', false, FIXTURE, 'MY_REGISTER');
    expect(undeclared.detail).toContain('Declare it in MY_REGISTER');

    const restored = resolvePathStatus('a/retired-file.ts', true, FIXTURE, 'MY_REGISTER');
    expect(restored.detail).toContain('remove the MY_REGISTER entry');
  });
});

describe('the two verifiers cannot disagree about a shared path', () => {
  it('both registers take the shared entry from the same object', () => {
    expect(ROUTE_SHELL_PATH_REGISTER[SHARED_PATH]).toBe(
      SHARED_PATH_DISPOSITIONS[SHARED_PATH],
    );
    expect(BLUEPRINT_PATH_REGISTER[SHARED_PATH]).toBe(
      SHARED_PATH_DISPOSITIONS[SHARED_PATH],
    );
  });

  it('both reports resolve the shared path to removed, not pending', () => {
    const shellCheck = runActiveRouteShellVerification().checks.find(
      (c) => c.route === SHARED_PATH,
    );
    const blueprintCheck = runIntelTowerBlueprintVerification().checks.find((c) =>
      c.detail.includes(SHARED_PATH),
    );

    expect(shellCheck).toBeDefined();
    expect(blueprintCheck).toBeDefined();
    expect(shellCheck!.status).toBe('removed');
    expect(blueprintCheck!.status).toBe('removed');
    expect(shellCheck!.detail).toContain('0c6a86c51');
    // Each report points at its own register, not the other's.
    const undeclaredShell = resolvePathStatus(
      'src/components/nothing/Declared.tsx',
      false,
      ROUTE_SHELL_PATH_REGISTER,
      'ROUTE_SHELL_PATH_REGISTER',
    );
    expect(undeclaredShell.detail).toContain('ROUTE_SHELL_PATH_REGISTER');
    expect(blueprintCheck!.detail).toContain('0c6a86c51');
  });
});
