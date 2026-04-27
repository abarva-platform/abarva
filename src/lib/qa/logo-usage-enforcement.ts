import * as fs from 'fs';
import * as path from 'path';

export type LogoCheckStatus = 'pass' | 'fail' | 'deferred' | 'not_applicable';

export interface LogoUsageCheck {
  checkId: string;
  targetFile: string;
  description: string;
  status: LogoCheckStatus;
  detail: string;
  deterministicSeed: true;
}

export interface LogoUsageEnforcementReport {
  reportId: string;
  canonicalLogoPath: string;
  canonicalComponentPath: string;
  checks: LogoUsageCheck[];
  passCount: number;
  failCount: number;
  deferredCount: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  bannedPatterns: string[];
  caveat: string;
  deterministicSeed: true;
}

export const BANNED_LOGO_PATTERNS = [
  '#14B8A6',   // teal hex
  'ॐ',          // Sanskrit
  'sparkle',   // generic AI sparkle
  'network-icon', // old network icon class
];

export const CANONICAL_LOGO_ASSET = 'public/brand/abarva-logo.svg';
export const CANONICAL_LOGO_COMPONENT = 'src/components/brand/AbarVaLogo.tsx';

const ROOT = process.cwd();

function checkFileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readFileIfExists(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

export function runLogoUsageEnforcement(): LogoUsageEnforcementReport {
  const checks: LogoUsageCheck[] = [];

  // Check 1: canonical logo asset exists
  // Deferred (not fail) when missing — BRAND1 is a known prerequisite, not a codebase defect
  const logoExists = checkFileExists(CANONICAL_LOGO_ASSET);
  checks.push({
    checkId: 'BRAND2-C1',
    targetFile: CANONICAL_LOGO_ASSET,
    description: 'Canonical logo SVG asset exists at public/brand/abarva-logo.svg',
    status: logoExists ? 'pass' : 'deferred',
    detail: logoExists ? 'Logo asset found' : 'Deferred — public/brand/abarva-logo.svg not yet present; BRAND1 must land first',
    deterministicSeed: true,
  });

  // Check 2: canonical logo component exists
  const componentExists = checkFileExists(CANONICAL_LOGO_COMPONENT);
  checks.push({
    checkId: 'BRAND2-C2',
    targetFile: CANONICAL_LOGO_COMPONENT,
    description: 'Canonical AbarVaLogo component exists',
    status: componentExists ? 'pass' : 'deferred',
    detail: componentExists ? 'AbarVaLogo.tsx found' : 'Deferred — BRAND1 must land first',
    deterministicSeed: true,
  });

  // Check 3: logo asset is non-empty (real SVG)
  if (logoExists) {
    const stat = fs.statSync(path.join(ROOT, CANONICAL_LOGO_ASSET));
    const isReal = stat.size > 1000;
    checks.push({
      checkId: 'BRAND2-C3',
      targetFile: CANONICAL_LOGO_ASSET,
      description: 'Logo SVG asset is a real asset (>1KB)',
      status: isReal ? 'pass' : 'fail',
      detail: `Size: ${stat.size} bytes`,
      deterministicSeed: true,
    });
  }

  // Check 4: legacy TopBar.tsx retired (SHELL8) — absence is the expected state
  const topBarContent = readFileIfExists('src/components/chrome/TopBar.tsx');
  checks.push({
    checkId: 'BRAND2-C4',
    targetFile: 'src/components/chrome/TopBar.tsx',
    description: 'Legacy TopBar.tsx retired in SHELL8 — should be absent',
    status: topBarContent ? 'fail' : 'pass',
    detail: topBarContent
      ? 'TopBar.tsx still exists — expected to be absent after SHELL8 cleanup. Remove the file.'
      : 'TopBar.tsx correctly absent — retired in Wave 29 SHELL8.',
    deterministicSeed: true,
  });

  // Check 5: AbarVaAppShell does not use teal
  const shellContent = readFileIfExists('src/components/abarva/AbarVaAppShell.tsx');
  if (shellContent) {
    const hasTeal = shellContent.includes('#14B8A6');
    checks.push({
      checkId: 'BRAND2-C5',
      targetFile: 'src/components/abarva/AbarVaAppShell.tsx',
      description: 'AbarVaAppShell does not use banned teal color',
      status: hasTeal ? 'fail' : 'pass',
      detail: hasTeal ? 'Found #14B8A6 in AbarVaAppShell — must be removed' : 'No teal found',
      deterministicSeed: true,
    });
  }

  // Check 6: AbarVaLogo component does not use banned patterns
  if (componentExists) {
    const compContent = readFileIfExists(CANONICAL_LOGO_COMPONENT)!;
    for (const banned of BANNED_LOGO_PATTERNS) {
      const found = compContent.includes(banned);
      checks.push({
        checkId: `BRAND2-C6-${banned.replace(/[^a-z0-9]/gi, '')}`,
        targetFile: CANONICAL_LOGO_COMPONENT,
        description: `AbarVaLogo does not contain banned pattern: ${banned}`,
        status: found ? 'fail' : 'pass',
        detail: found ? `Found banned pattern "${banned}" in AbarVaLogo` : `No "${banned}" found`,
        deterministicSeed: true,
      });
    }
  }

  // Check 7: main app layout does not hardcode old wordmark
  const layoutContent = readFileIfExists('src/app/(maestro)/layout.tsx') ||
                        readFileIfExists('src/app/layout.tsx');
  if (layoutContent) {
    const hasHardcodedWordmark = layoutContent.includes('"Abar"') && layoutContent.includes('"Va"');
    checks.push({
      checkId: 'BRAND2-C7',
      targetFile: 'src/app/layout.tsx',
      description: 'App layout does not hand-code AbarVa wordmark with separate Abar/Va spans',
      status: hasHardcodedWordmark ? 'fail' : 'pass',
      detail: hasHardcodedWordmark
        ? 'Found hardcoded "Abar"+"Va" spans — should use AbarVaLogo component'
        : 'No hardcoded wordmark spans found',
      deterministicSeed: true,
    });
  }

  // Check 8: DES9 brand lock is deferred (will be applied by DES9 lane)
  checks.push({
    checkId: 'BRAND2-C8',
    targetFile: 'src/components/abarva/AbarVaAppShell.tsx',
    description: 'App shell imports AbarVaLogo (DES9 brand lock)',
    status: shellContent?.includes('AbarVaLogo') ? 'pass' : 'deferred',
    detail: shellContent?.includes('AbarVaLogo')
      ? 'AbarVaLogo import found in shell'
      : 'Deferred — DES9 app shell brand lock will wire this',
    deterministicSeed: true,
  });

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const deferredCount = checks.filter(c => c.status === 'deferred').length;

  return {
    reportId: 'BRAND2-ENFORCEMENT-2026-04-26',
    canonicalLogoPath: CANONICAL_LOGO_ASSET,
    canonicalComponentPath: CANONICAL_LOGO_COMPONENT,
    checks,
    passCount,
    failCount,
    deferredCount,
    overallStatus: failCount > 0 ? 'fail' : deferredCount > 0 ? 'partial' : 'pass',
    bannedPatterns: BANNED_LOGO_PATTERNS,
    caveat: 'All checks are deterministic filesystem scans. BRAND1 and DES9 must land before deferred checks resolve.',
    deterministicSeed: true,
  };
}

export function getBannedLogoPatterns(): string[] {
  return BANNED_LOGO_PATTERNS;
}

export function listLogoEnforcementTargetFiles(): string[] {
  // TopBar.tsx removed from target list — retired in Wave 29 (SHELL8).
  return [
    CANONICAL_LOGO_ASSET,
    CANONICAL_LOGO_COMPONENT,
    'src/components/abarva/AbarVaAppShell.tsx',
    'src/app/(maestro)/layout.tsx',
    'src/app/layout.tsx',
  ];
}
