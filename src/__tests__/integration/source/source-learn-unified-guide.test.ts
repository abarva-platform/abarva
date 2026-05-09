import fs from 'node:fs';
import path from 'node:path';

import { LEARN_NAV, findLearnNavItem } from '@/lib/home/learn-nav';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('Source primer · folded into unified /home/learn guide', () => {
  it('global learn nav now contains a Source group with welcome + chapters + glossary', () => {
    const groups = LEARN_NAV.map((g) => g.group);
    expect(groups).toContain('Source');

    const sourceGroup = LEARN_NAV.find((g) => g.group === 'Source');
    expect(sourceGroup).toBeTruthy();
    const slugs = sourceGroup!.items.map((i) => i.slug);

    // Framing pages.
    expect(slugs).toContain('source/welcome');
    expect(slugs).toContain('source/intake');
    expect(slugs).toContain('source/sentinel');
    expect(slugs).toContain('source/glossary');

    // Case study anchor.
    expect(slugs).toContain('source/case-study');

    // 11 stage chapters.
    for (const chapter of [
      'strategy',
      'scope',
      'rfp',
      'responses',
      'evaluation',
      'pricing',
      'bafo',
      'decision',
      'selection',
      'transition',
      'value',
    ]) {
      expect(slugs).toContain(`source/${chapter}`);
    }
  });

  it('Source group sits between Strategic Moves and Reference', () => {
    const order = LEARN_NAV.map((g) => g.group);
    const idxMoves = order.indexOf('Strategic Moves');
    const idxSource = order.indexOf('Source');
    const idxReference = order.indexOf('Reference');
    expect(idxMoves).toBeGreaterThan(-1);
    expect(idxSource).toBeGreaterThan(idxMoves);
    expect(idxReference).toBeGreaterThan(idxSource);
  });

  it('case-study chapters are flagged for visual indent under the case-study anchor', () => {
    const sourceGroup = LEARN_NAV.find((g) => g.group === 'Source')!;
    const anchor = sourceGroup.items.find((i) => i.slug === 'source/case-study');
    expect(anchor?.kind).toBe('caseStudy');

    const strategy = sourceGroup.items.find((i) => i.slug === 'source/strategy');
    expect(strategy?.indent).toBe(true);
    expect(strategy?.stageBadge).toBe('01');
  });

  it('findLearnNavItem resolves Source slugs', () => {
    expect(findLearnNavItem('source/welcome')?.label).toMatch(/Welcome/i);
    expect(findLearnNavItem('source/strategy')?.stageBadge).toBe('01');
    expect(findLearnNavItem('source/value')?.stageBadge).toBe('11');
  });

  it('LearnSideNav renders stageBadge alongside phaseBadge and supports indent', () => {
    const sideNav = read('src/components/home/learn/LearnSideNav.tsx');
    // Side nav now reads stage fields too, not just phase fields.
    expect(sideNav).toContain('item.stageColor');
    expect(sideNav).toContain('item.stageBadge');
    // Indent treatment for case-study chapters.
    expect(sideNav).toContain('item.indent === true');
    // Amber badge color for stage 8.
    expect(sideNav).toContain("amber:");
  });

  it('/home/learn/source/<slug> route dispatches Source primer components', () => {
    const route = read('src/app/(maestro)/home/learn/[section]/[slug]/page.tsx');
    expect(route).toContain("section === 'source'");
    expect(route).toContain('SourceWelcomeSection');
    expect(route).toContain('SourceIntakeSection');
    expect(route).toContain('SourceSentinelSection');
    expect(route).toContain('SourceGlossarySection');
    // Chapter slugs handled by fallback while case-study PR is in flight.
    expect(route).toContain('SourceChapterFallback');
    expect(route).toContain('case-study');
  });

  it('legacy /source/learn pages redirect into the unified guide', () => {
    const root = read('src/app/(maestro)/source/learn/page.tsx');
    expect(root).toContain("from 'next/navigation'");
    expect(root).toContain('redirect');
    expect(root).toContain('/home/learn/source/welcome');

    const slug = read('src/app/(maestro)/source/learn/[slug]/page.tsx');
    expect(slug).toContain('redirect');
    expect(slug).toContain('/home/learn/source/');

    // Layout no longer mounts the standalone Source primer chrome.
    const layout = read('src/app/(maestro)/source/learn/layout.tsx');
    expect(layout).not.toContain('SourceLearnSideNav');
    expect(layout).not.toContain('AppTopBar');
  });

  it('legacy Source learn nav module is annotated as deprecated', () => {
    const legacy = read('src/lib/source/learn/learn-nav.ts');
    expect(legacy).toMatch(/DEPRECATED/i);
    expect(legacy).toContain('src/lib/home/learn-nav.ts');
  });
});
