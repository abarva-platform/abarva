import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '../../../../');
const scriptPath = path.join(repoRoot, 'scripts/integration/hygiene_gate.sh');

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

  it('script has PASS/FAIL summary', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('HYGIENE GATE: PASS');
    expect(content).toContain('HYGIENE GATE: FAIL');
  });

  it('script does NOT contain destructive commands', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).not.toContain('git stash pop');
    expect(content).not.toContain('git stash drop');
    expect(content).not.toContain('git push');
    expect(content).not.toContain('rm -rf');
    expect(content).not.toContain('git reset --hard');
  });

  it('script checks TypeScript', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('tsc');
  });
});

describe('hygiene_gate.sh - invocation: --help', () => {
  it('--help exits 0 and prints usage', () => {
    const { execSync } = require('child_process');
    const result = execSync(`bash "${scriptPath}" --help`, { encoding: 'utf8' });
    expect(result).toContain('Usage');
    expect(result).toContain('--skip-build');
  });
});
