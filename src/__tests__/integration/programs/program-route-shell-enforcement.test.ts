// PROG-P1 · Route-family convergence enforcement.
//
// After PR #583 ("redirect legacy tenant routes to canonical programs pages"),
// the legacy /tenant/[tenantSlug]/programs/** routes are redirect wrappers.
// This test suite verifies:
//
//   1. Legacy tenant routes are redirect-only (no rendering logic).
//   2. Canonical routes under /programs/** use the expected shell components.
//   3. ProgramCanonShell.tsx retains the workflow orientation markers
//      (component is dormant but preserved for P7 cleanup).
//   4. No forbidden visual or runtime patterns in any of these files.
//
// DESROUTE5 compliance is maintained; assertions updated to the redirect
// architecture that shipped in #583.

import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('DESROUTE5 program route shell enforcement', () => {
  // Legacy tenant routes (redirect wrappers as of #583)
  const tenantProgramsRoute =
    'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx';
  const tenantProgramDetailRoute =
    'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx';
  const tenantProgramPhaseRoute =
    'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]/page.tsx';

  // Canonical routes (source of truth)
  const canonicalIndexRoute = 'src/app/programs/page.tsx';
  const canonicalDetailRoute = 'src/app/programs/[id]/page.tsx';

  // Shell component (preserved, dormant — P7 will decide fate)
  const shellComponent = 'src/components/programs/ProgramCanonShell.tsx';

  describe('legacy tenant routes are redirect wrappers', () => {
    it('tenant programs index redirects to /programs', () => {
      const src = read(tenantProgramsRoute);
      expect(src).toContain("redirect('/programs')");
    });

    it('tenant program detail redirects to canonical /programs/{slug}', () => {
      const src = read(tenantProgramDetailRoute);
      expect(src).toContain('redirect(');
      expect(src).toContain('/programs/');
    });

    it('tenant program phase redirects to canonical /programs/{slug}', () => {
      const src = read(tenantProgramPhaseRoute);
      expect(src).toContain('redirect(');
      expect(src).toContain('/programs/');
    });

    it('legacy routes do not render UI content directly', () => {
      // Redirect-only files should not contain JSX rendering returns
      const idx = read(tenantProgramsRoute);
      const detail = read(tenantProgramDetailRoute);
      const phase = read(tenantProgramPhaseRoute);
      // None should render a <div or <main (they return redirect(), not JSX)
      expect(idx).not.toMatch(/<(?:div|main|section|article)\b/);
      expect(detail).not.toMatch(/<(?:div|main|section|article)\b/);
      expect(phase).not.toMatch(/<(?:div|main|section|article)\b/);
    });
  });

  describe('canonical routes use expected shell components', () => {
    it('canonical programs index imports ProgramsIndexPage', () => {
      expect(read(canonicalIndexRoute)).toContain('ProgramsIndexPage');
    });

    it('canonical program detail imports ProgramDetailPage', () => {
      const src = read(canonicalDetailRoute);
      // Accept both ProgramDetailPage and ProgramCanonicalDetail
      expect(src.includes('ProgramDetailPage') || src.includes('ProgramCanonicalDetail')).toBe(true);
    });
  });

  describe('ProgramCanonShell.tsx workflow orientation markers', () => {
    it('workflow orientation signals are present in canonical shell', () => {
      const shell = read(shellComponent);
      expect(shell).toContain('Journey → Phase → Gate → Nexus next action');
      expect(shell).toContain('Deliverables/Evidence');
      expect(shell).toContain('Missions');
    });

    it('shell caveat avoids fake approvals and live actions', () => {
      const shell = read(shellComponent).toLowerCase();
      expect(shell).toContain('no fake approvals');
      expect(shell).toContain('live actions');
    });
  });

  describe('forbidden pattern guard', () => {
    it('route files avoid forbidden visual patterns and runtime/auth changes', () => {
      const combined = [
        tenantProgramsRoute,
        tenantProgramDetailRoute,
        canonicalIndexRoute,
        canonicalDetailRoute,
        shellComponent,
      ]
        .map(read)
        .join('\n')
        .toLowerCase();

      expect(combined).not.toContain('cyber');
      expect(combined).not.toContain('neon');
      expect(combined).not.toContain('generic sparkle');
      expect(combined).not.toContain('openai');
      expect(combined).not.toContain('anthropic');
    });
  });
});
