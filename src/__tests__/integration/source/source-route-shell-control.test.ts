import fs from 'node:fs';
import path from 'node:path';

function exists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('SHELL5 source route shell control (Wave S1 — AppShell migration)', () => {
  const sentinelAgentColumn = 'src/components/source/SentinelAgentColumn.tsx';
  const sourceWorkingPane = 'src/components/source/SourceWorkingPane.tsx';
  const sourceCommercialEventSection = 'src/components/source/SourceCommercialEventSection.tsx';
  const sourceIndexRoute = 'src/app/(maestro)/source/page.tsx';
  const sourceEventDetailRoute = 'src/app/(maestro)/source/events/[eventId]/page.tsx';

  it('SentinelAgentColumn.tsx exists (Wave S1 shell replacement)', () => {
    expect(exists(sentinelAgentColumn)).toBe(true);
  });

  it('SourceWorkingPane.tsx exists (Wave S1 working pane wrapper)', () => {
    expect(exists(sourceWorkingPane)).toBe(true);
  });

  it('SourceCommercialEventSection.tsx exists', () => {
    expect(exists(sourceCommercialEventSection)).toBe(true);
  });

  it('source index route file exists', () => {
    expect(exists(sourceIndexRoute)).toBe(true);
  });

  it('source event detail route file exists', () => {
    expect(exists(sourceEventDetailRoute)).toBe(true);
  });

  it('SentinelAgentColumn.tsx does not contain dark teal color #14B8A6', () => {
    const source = read(sentinelAgentColumn);
    expect(source).not.toContain('#14B8A6');
    expect(source).not.toContain('#14b8a6');
  });

  it('SourceWorkingPane.tsx uses SHELL tokens, not hardcoded legacy colors', () => {
    const source = read(sourceWorkingPane);
    expect(source).toContain('SHELL');
    expect(source).not.toContain('#FBFAF7');
    expect(source).not.toContain('#060a12');
  });

  it('SentinelAgentColumn.tsx contains SOURCE orientation (Sentinel identity)', () => {
    const source = read(sentinelAgentColumn);
    expect(source).toContain('Sentinel');
    expect(source).toContain('Validator');
  });

  it('SourceCommercialEventSection.tsx exists and is non-empty (importable)', () => {
    expect(exists(sourceCommercialEventSection)).toBe(true);
    const source = read(sourceCommercialEventSection);
    expect(source.length).toBeGreaterThan(0);
  });

  it('event detail route wires SentinelAgentColumn', () => {
    const source = read(sourceEventDetailRoute);
    expect(source).toContain('SentinelAgentColumn');
  });
});
