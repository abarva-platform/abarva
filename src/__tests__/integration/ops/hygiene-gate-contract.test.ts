import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * What this suite is for, measured rather than asserted.
 *
 * These cases read the gate's source text, which normally means they report
 * staleness and nothing else. The question was whether they are redundant
 * against the behavioural suite that runs the gate in a scratch repository.
 *
 * Nine mutations were applied to the gate and both suites run separately:
 *
 *   only this suite caught   remove --help handling; remove the shebang;
 *                            delete section 1 (git hygiene, which is where
 *                            the conflict-marker check lives)
 *   only behaviour caught    remove --skip-build; delete section 3 (secret
 *                            hygiene); delete section 6 (stash hygiene)
 *   both caught              delete section 2 (JSON manifests + duplicate
 *                            slices); delete section 4 (TypeScript)
 *
 * So neither suite subsumes the other, and folding this one into the
 * behavioural suite would lose three guards. What this suite answers is
 * whether the gate still DECLARES its contract -- its flags, its shebang,
 * and sections the behavioural fixture does not name. What the behavioural
 * suite answers is whether each check reaches the right verdict when run.
 *
 * The one case below that does not read source text is the verdict case: it
 * runs the verdict function, because the strings it used to grep for moved
 * into a sourced file and the grep went red while the behaviour was intact.
 */

const repoRoot = path.resolve(__dirname, '../../../../');
const scriptPath = path.join(repoRoot, 'scripts/integration/hygiene_gate.sh');

/**
 * Shell source with comments and quoted strings removed.
 *
 * The destructive-command case below scans for commands the gate must never
 * run. Scanned over raw text it cannot tell a command from prose about a
 * command, and the gate contains exactly that: a warning whose message tells
 * the operator "do not run git stash pop". That false positive is not
 * cosmetic -- see the case for what it cost.
 *
 * Approximate by design: it strips full-line comments, trailing comments,
 * and single- and double-quoted spans. The fixtures below pin both
 * directions, so an approximation that drifts fails rather than passing
 * quietly.
 */
function shellCodeOnly(source: string): string {
  return source
    .split('\n')
    .map((line) => (line.trimStart().startsWith('#') ? '' : line))
    .join('\n')
    // Quoted spans first, so a '#' inside a string is not read as a comment.
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/(^|\s)#.*$/gm, '$1');
}

/** Commands this gate promises never to run. */
const DESTRUCTIVE = [
  'git stash pop',
  'git stash drop',
  'git push',
  'rm -rf',
  'git reset --hard',
] as const;

describe('hygiene_gate.sh - contract', () => {
  it('script file exists', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('script is non-empty', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('script has shebang line', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.startsWith('#!/')).toBe(true);
  });

  it('script contains --help flag handling', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('--help');
  });

  it('script contains --skip-build flag', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('--skip-build');
  });

  it('script checks for conflict markers', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('<<<<<<<');
  });

  it('script checks JSON manifests', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('build-slices.json');
    expect(content).toContain('production-readiness.json');
  });

  it('script checks for duplicate slices', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    const hasDupCheck = content.includes('duplicate') || content.includes('DUP');
    expect(hasDupCheck).toBe(true);
  });

  it('script produces a PASS/FAIL verdict', () => {
    // This used to grep the gate for the literal strings 'HYGIENE GATE: PASS'
    // and 'HYGIENE GATE: FAIL'. The verdict moved into a sourced reporting
    // unit so it could be tested by running it, and the grep went red while
    // the behaviour was intact -- which is the tell that it was measuring the
    // text rather than the gate.
    //
    // Run instead. Three arguments, three verdicts, and each one has to be
    // the verdict for that state rather than merely a non-empty string.
    const report = path.join(repoRoot, 'scripts/integration/hygiene_gate_report.sh');
    const verdict = (fails: number, warns: number): string =>
      execFileSync('bash', ['-c', `. "${report}"; hygiene_verdict_line ${fails} ${warns}`], {
        encoding: 'utf8',
      }).trim();

    expect(verdict(0, 0)).toBe('HYGIENE GATE: PASS');
    expect(verdict(1, 0)).toBe('HYGIENE GATE: FAIL');
    // And a run with findings must not be reported as a clean pass.
    expect(verdict(0, 2)).not.toBe('HYGIENE GATE: PASS');
    expect(verdict(0, 2)).toContain('WARNINGS');
  });

  describe('script does NOT run destructive commands', () => {
    // One case per command, not five assertions in one case.
    //
    // As five assertions, the first failure ended the case and the rest
    // never ran. That is not hypothetical: the 'git stash pop' assertion
    // was failing on a false positive, and while it was red a real
    // `git push origin main` was added to the gate and the suite's output
    // did not change -- same one failure, same message. A red assertion had
    // silently disabled the four guards behind it.
    it.each(DESTRUCTIVE)('does not run %s', (command) => {
      const code = shellCodeOnly(fs.readFileSync(scriptPath, 'utf8'));
      expect(code).not.toContain(command);
    });

    it('does not mistake prose about a command for the command', () => {
      // The false positive itself. The gate warns the operator not to run
      // `git stash pop`; saying so is the opposite of doing it.
      const prose = [
        '#!/usr/bin/env bash',
        '# never run git push here',
        'warn "Stash stack is not safe - do not run git stash pop"',
        "echo 'rm -rf would be wrong'",
      ].join('\n');

      const code = shellCodeOnly(prose);
      for (const command of DESTRUCTIVE) {
        expect(code).not.toContain(command);
      }
    });

    it('still catches the real thing', () => {
      // The negative control for the stripper. Without it, a stripper that
      // removed everything would satisfy every case above.
      const real = ['#!/usr/bin/env bash', 'git push origin main', 'rm -rf /tmp/x'].join('\n');
      const code = shellCodeOnly(real);

      expect(code).toContain('git push');
      expect(code).toContain('rm -rf');
    });

    it('does not strip the code it is supposed to scan', () => {
      // The other way the stripper could be wrong: over-stripping the real
      // gate until there is nothing left to find anything in.
      const code = shellCodeOnly(fs.readFileSync(scriptPath, 'utf8'));
      expect(code).toContain('git status');
      expect(code.length).toBeGreaterThan(500);
    });
  });

  it('script checks TypeScript', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('tsc');
  });
});

describe('hygiene_gate.sh - invocation: --help', () => {
  it('--help exits 0 and prints usage', () => {
    const result = execSync(`bash "${scriptPath}" --help`, { encoding: 'utf8' });
    expect(result).toContain('Usage');
    expect(result).toContain('--skip-build');
  });
});
