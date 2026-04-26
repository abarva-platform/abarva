import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('DESROUTE5 program route shell enforcement', () => {
  const programsRoute = 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx';
  const programDetailRoute =
    'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx';
  const shellComponent = 'src/components/programs/ProgramCanonShell.tsx';

  it('program routes exist and import ProgramCanonShell', () => {
    expect(fs.existsSync(path.join(process.cwd(), programsRoute))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), programDetailRoute))).toBe(true);
    expect(read(programsRoute)).toContain('ProgramCanonShell');
    expect(read(programDetailRoute)).toContain('ProgramCanonShell');
  });

  it('detail route continues to use ProgramCanonicalDetail', () => {
    const source = read(programDetailRoute);
    expect(source).toContain('ProgramCanonicalDetail');
  });

  it('workflow orientation signals are present in canonical shell', () => {
    const shell = read(shellComponent);
    expect(shell).toContain('Journey → Phase → Gate → Nexus next action');
    expect(shell).toContain('Deliverables/Evidence');
    expect(shell).toContain('Missions');
  });

  it('modified route files avoid forbidden visual patterns and runtime/auth changes', () => {
    const combined = `${read(programsRoute)}\n${read(programDetailRoute)}\n${read(shellComponent)}`.toLowerCase();
    expect(combined).not.toContain('cyber');
    expect(combined).not.toContain('neon');
    expect(combined).not.toContain('generic sparkle');
    expect(combined).not.toContain('openai');
    expect(combined).not.toContain('anthropic');
  });

  it('shell caveat avoids fake approvals/live actions', () => {
    const shell = read(shellComponent).toLowerCase();
    expect(shell).toContain('no fake approvals');
    expect(shell).toContain('live actions');
  });
});
