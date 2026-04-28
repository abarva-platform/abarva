import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const repoRoot = path.resolve(__dirname, '../../../../');
const scriptPath = path.join(repoRoot, 'scripts/integration/validate_demo_pack_report.py');

describe('validate_demo_pack_report.py - contract', () => {
  it('script file exists', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('script is non-empty', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.length).toBeGreaterThan(200);
  });

  it('script has --help flag', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('--help');
  });

  it('script has --json flag', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('--json');
  });

  it('script checks for PR number', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('PR number');
  });

  it('script checks for Run Metrics', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('Run Metrics');
  });

  it('script checks for hygiene gate', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('hygiene gate');
  });

  it('script does NOT mutate files', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    // No write mode opens — either no open() at all, or never opened with 'w'
    // More targeted: no write mode opens
    expect(content).not.toMatch(/open\([^)]+['"]\s*w\s*['"]/);
  });

  it('script has no network calls', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).not.toContain('urllib');
    expect(content).not.toContain('requests');
    expect(content).not.toContain('http.client');
  });
});

describe('validate_demo_pack_report.py - --help invocation', () => {
  it('--help exits 0 and prints required sections', () => {
    const result = execSync(`python3 "${scriptPath}" --help`, { encoding: 'utf8' });
    expect(result).toContain('PR number');
    expect(result).toContain('Usage');
  });
});

describe('validate_demo_pack_report.py - validation logic (TypeScript mirror)', () => {
  // Mirror the required sections from the Python script
  const REQUIRED_SECTIONS = [
    'PR number', 'merge commit', 'lanes completed', 'route',
    'readiness', 'hygiene gate', 'CI', 'Vercel', 'build', 'Run Metrics', 'next',
  ];

  function mirrorValidate(content: string): { valid: boolean; errors: string[] } {
    const lower = content.toLowerCase();
    const errors: string[] = [];
    for (const section of REQUIRED_SECTIONS) {
      if (!lower.includes(section.toLowerCase())) {
        errors.push(`Missing: ${section}`);
      }
    }
    if (!/[#]?\d+/.test(content)) {
      errors.push('No PR number pattern');
    }
    return { valid: errors.length === 0, errors };
  }

  it('valid report with all required sections passes', () => {
    const validReport = `
# Final Report

PR number: #999
merge commit: abc1234
lanes completed: LIVE1, LIVE2, LIVE3
route coverage: all 12 routes verified
readiness updated: yes
hygiene gate: PASS
git diff --check: clean
conflict marker scan: clean
JSON manifests: valid
tsc: clean
eslint: 0 warnings
CI: green
Vercel: deployed
build: success
Run Metrics: elapsed 45min, subagent count 8, tests 200
next recommended pack: Wave 14
    `;
    const result = mirrorValidate(validReport);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('report missing PR number fails', () => {
    const badReport = `
merge commit: abc1234
lanes completed: LIVE1
route coverage: ok
readiness updated: yes
hygiene gate: PASS
CI: green
Vercel: ok
build: ok
Run Metrics: elapsed 10min
next recommended: Wave 14
    `;
    // Missing 'PR number' text
    const result = mirrorValidate(badReport);
    expect(result.valid).toBe(false);
  });

  it('report missing Run Metrics fails', () => {
    const badReport = `
PR number: #888
merge commit: abc
lanes completed: ok
route coverage: ok
readiness: ok
hygiene gate: ok
CI: ok
Vercel: ok
build: ok
next: Wave 14
    `;
    const result = mirrorValidate(badReport);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Run Metrics'))).toBe(true);
  });

  it('empty report fails all checks', () => {
    const result = mirrorValidate('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(5);
  });
});
