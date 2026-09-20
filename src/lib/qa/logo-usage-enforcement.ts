import * as fs from 'fs';
import * as path from 'path';

import {
  resolvePathStatus,
  type PathDispositionRegister,
} from './path-disposition';

export type LogoCheckStatus =
  | 'pass'
  | 'fail'
  | 'deferred'
  | 'removed'
  | 'not_applicable';

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
  removedCount: number;
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

export const CANONICAL_LOGO_ASSET = 'public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg';
export const CANONICAL_LOGO_COMPONENT = 'src/components/abarva/AbarVaLogo.tsx';

const RETIRED_ROOT_LOGO_ASSETS = [
  'public/brand/abarva-logo-inverse.svg',
  'public/brand/abarva-logo-lockup-v2.svg',
  'public/brand/abarva-logo.svg',
  'public/brand/abarva-monogram-v-blue.svg',
  'public/brand/abarva-monogram-v-white.svg',
  'public/brand/abarva-wordmark-color.svg',
  'public/brand/abarva-wordmark-monoblack.svg',
  'public/brand/abarva-wordmark-monoblue.svg',
];

const RETIRED_TOPBAR_VARIANTS = [
  'src/components/shell/AppTopBarEditorial.tsx',
  'src/components/shell/AppTopBarTwoBar.tsx',
];

/** Every path this report expects to be gone, in one list for the register. */
export const RETIRED_BRAND_PATHS = [
  ...RETIRED_ROOT_LOGO_ASSETS,
  ...RETIRED_TOPBAR_VARIANTS,
];

const BRAND_RETIREMENT_COMMIT = 'f1d8bc95c';
const BRAND_RETIREMENT_SLICE = 'BRAND1 option-2 nav logo adoption (#3108)';

function retiredByBrand1(
  note: string,
  restoredAt?: { commit: string; note: string },
) {
  return {
    retired: {
      scope: 'path' as const,
      commit: BRAND_RETIREMENT_COMMIT,
      slice: BRAND_RETIREMENT_SLICE,
      replacement: CANONICAL_LOGO_ASSET,
      note,
      ...(restoredAt ? { restoredAt } : {}),
    },
  };
}

/**
 * Why each of these paths is expected to be absent, with the commit.
 *
 * Before T-528 the two lists above were bare arrays and the checks below said
 * "correctly absent" or "still exists" — the right verdict in both directions
 * with none of the evidence behind it. A reader could not tell a deliberate
 * retirement from a list somebody guessed at.
 *
 * Every commit here was derived with `git log origin/main` and confirmed with
 * `git merge-base --is-ancestor`. All ten paths were added by `5d795a397`
 * (2026-05-30) and deleted by `f1d8bc95c` (2026-06-05). Seven stayed gone.
 * Three came back and are on the tree today, so they resolve to `fail` and
 * carry the restoring commit with them.
 *
 * Those three failures belong to T-504, which owns which brand assets are
 * canonical. This register names the evidence; it does not decide, and it
 * must not be cleared by widening the allowed set.
 */
export const BRAND_PATH_REGISTER: PathDispositionRegister = {
  // Absent, and no commit on this history has ever added or removed it —
  // re-measured with `git log origin/main --diff-filter=AD` rather than
  // trusting the row that reported it. So nothing retired it, and the
  // "retired in Wave 29 SHELL8" sentence this check used to print was an
  // attribution with nothing behind it.
  //
  // `undecided` rather than `retired` for exactly that reason: the honest
  // statement is that the path is absent and nobody has ruled on whether it
  // should exist. Naming a wave that cannot be shown to have done it is the
  // defect, not the fix for it.
  'src/components/chrome/TopBar.tsx': {
    undecided: {
      owner: 'T-532',
      note:
        'It sits in neither RETIRED_ROOT_LOGO_ASSETS nor RETIRED_TOPBAR_VARIANTS, so no '
        + 'brand decision covers it either. Whether a chrome TopBar should exist is a '
        + 'shell question, not a brand one.',
    },
  },
  'public/brand/abarva-logo-inverse.svg': retiredByBrand1(
    'Root-level inverse mark from the pre-option-2 brand.',
    {
      commit: '8b556c126',
      note:
        'restored by a Home v2 fix that repointed frame asset paths at the ' +
        'root-level brand files rather than at the option-2 asset directory',
    },
  ),
  'public/brand/abarva-logo-lockup-v2.svg': retiredByBrand1(
    'Root-level v2 lockup from the pre-option-2 brand.',
    {
      commit: '6ebe6d4a9',
      note:
        'came back inside a large squashed merge that restored it without a ' +
        'brand decision being recorded anywhere',
    },
  ),
  'public/brand/abarva-logo.svg': retiredByBrand1(
    'Root-level primary mark from the pre-option-2 brand.',
    {
      commit: '6ebe6d4a9',
      note:
        'came back inside a large squashed merge that restored it without a ' +
        'brand decision being recorded anywhere',
    },
  ),
  'public/brand/abarva-monogram-v-blue.svg': retiredByBrand1(
    'Root-level V monogram from the pre-option-2 brand.',
  ),
  'public/brand/abarva-monogram-v-white.svg': retiredByBrand1(
    'Root-level V monogram from the pre-option-2 brand.',
  ),
  'public/brand/abarva-wordmark-color.svg': retiredByBrand1(
    'Root-level wordmark from the pre-option-2 brand.',
  ),
  'public/brand/abarva-wordmark-monoblack.svg': retiredByBrand1(
    'Root-level wordmark from the pre-option-2 brand.',
  ),
  'public/brand/abarva-wordmark-monoblue.svg': retiredByBrand1(
    'Root-level wordmark from the pre-option-2 brand.',
  ),
  'src/components/shell/AppTopBarEditorial.tsx': retiredByBrand1(
    'Experimental top-bar variant carrying the pre-option-2 lockup.',
  ),
  'src/components/shell/AppTopBarTwoBar.tsx': retiredByBrand1(
    'Experimental top-bar variant carrying the pre-option-2 lockup.',
  ),
};

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
    description: 'Canonical logo SVG asset exists at public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg',
    status: logoExists ? 'pass' : 'deferred',
    detail: logoExists ? 'Logo asset found' : 'Deferred — public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg not yet present; BRAND1 must land first',
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

  // Check 4: the disposition of the legacy chrome TopBar.
  //
  // This printed "correctly absent — retired in Wave 29 SHELL8" and reported
  // `pass`. Re-measured, no commit on this history has ever added or removed
  // the path, so no wave retired it and the attribution was invented. The
  // answer now comes from BRAND_PATH_REGISTER like the ten paths beside it,
  // which is what stops a call-site sentence from standing in for evidence.
  const topBarPath = 'src/components/chrome/TopBar.tsx';
  const topBar = resolvePathStatus(
    topBarPath,
    checkFileExists(topBarPath),
    BRAND_PATH_REGISTER,
    'BRAND_PATH_REGISTER',
  );
  checks.push({
    checkId: 'BRAND2-C4',
    targetFile: topBarPath,
    description: 'Legacy chrome TopBar disposition is declared, not asserted',
    status: topBar.status,
    detail: topBar.detail,
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

  // The disposition comes from BRAND_PATH_REGISTER, not from a sentence
  // written here. A call-site sentence is how "correctly absent" came to stand
  // over ten paths without naming the commit that removed any of them.
  for (const retiredAsset of RETIRED_ROOT_LOGO_ASSETS) {
    const { status, detail } = resolvePathStatus(
      retiredAsset,
      checkFileExists(retiredAsset),
      BRAND_PATH_REGISTER,
      'BRAND_PATH_REGISTER',
    );
    checks.push({
      checkId: `BRAND2-C9-${path.basename(retiredAsset).replace(/[^a-z0-9]/gi, '')}`,
      targetFile: retiredAsset,
      description: 'Retired root-level brand asset is absent so stale paths cannot resolve',
      status,
      detail,
      deterministicSeed: true,
    });
  }

  for (const retiredVariant of RETIRED_TOPBAR_VARIANTS) {
    const { status, detail } = resolvePathStatus(
      retiredVariant,
      checkFileExists(retiredVariant),
      BRAND_PATH_REGISTER,
      'BRAND_PATH_REGISTER',
    );
    checks.push({
      checkId: `BRAND2-C10-${path.basename(retiredVariant).replace(/[^a-z0-9]/gi, '')}`,
      targetFile: retiredVariant,
      description: 'Retired experimental AppTopBar variant is absent',
      status,
      detail,
      deterministicSeed: true,
    });
  }

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const deferredCount = checks.filter(c => c.status === 'deferred').length;
  const removedCount = checks.filter(c => c.status === 'removed').length;

  return {
    reportId: 'BRAND2-ENFORCEMENT-2026-04-26',
    canonicalLogoPath: CANONICAL_LOGO_ASSET,
    canonicalComponentPath: CANONICAL_LOGO_COMPONENT,
    checks,
    passCount,
    failCount,
    deferredCount,
    removedCount,
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
    ...RETIRED_ROOT_LOGO_ASSETS,
    ...RETIRED_TOPBAR_VARIANTS,
    'src/app/(maestro)/layout.tsx',
    'src/app/layout.tsx',
  ];
}
