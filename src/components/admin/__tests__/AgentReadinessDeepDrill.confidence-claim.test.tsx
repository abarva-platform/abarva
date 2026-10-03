/**
 * Agent readiness drill-down — does it disclose confidence? (item C-549,
 * half (2), one row: `generated-ui|Setup|Agent readiness drill-down|confidence`)
 *
 * `docs/legal/AI_GENERATED_UI_CATALOG.md` is the document an auditor reads.
 * Its Setup row for this component answered "Confidence / assumption
 * disclosure present?" with "Yes: deterministic source caption and generated
 * timestamp". A caption saying the view is not live execution, and a
 * hardcoded date, say where the page came from; neither tells a reader how
 * far to trust any readiness verdict on it. The control catalog's coverage
 * row for that claim already deferred it ("formal confidence coverage remain
 * follow-on"), so the two documents disagreed about one surface and nothing
 * measured which was right.
 *
 * This file measures it. The real component is rendered over the real
 * builder, every text node a reader would see is searched for a confidence
 * value or an assumption, and the module graph is searched for anything that
 * mounts the component. The legal row is then held to what was observed: it
 * may answer "Yes" exactly when the component renders a confidence
 * disclosure AND something mounts it where a reader can see it.
 *
 * WHY THE POSITIVE CONTROL COMES FIRST
 *
 * "No confidence disclosure rendered" is vacuous if the render produced
 * nothing. The first case proves the render carries exactly what the legal
 * row cited as its evidence — the caption and the date — so their presence
 * and the absence of anything else is what the component does, not an empty
 * page.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * Nothing is stubbed. It does not render the component because the
 * component is live — it is listed in `unreachable-components.json` and the
 * third case re-measures that — but because the legal row makes a claim
 * about it, and a claim about an unmounted screen is still a claim an
 * auditor reads.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { renderToStaticMarkup } from 'react-dom/server';

import { AgentReadinessDeepDrill } from '@/components/admin/AgentReadinessDeepDrill';
import { buildAgentReadinessDeepDrill } from '@/lib/admin/agent-readiness-deep-drill';

const COMPONENT_PATH = 'src/components/admin/AgentReadinessDeepDrill.tsx';
const LEGAL_CATALOG = 'docs/legal/AI_GENERATED_UI_CATALOG.md';
const UNREACHABLE_BASELINE = 'docs/architecture/unreachable-components.json';

const drill = buildAgentReadinessDeepDrill();

/** Every text node of the rendered page, trimmed, in document order. */
const renderedText = renderToStaticMarkup(<AgentReadinessDeepDrill />)
  .replace(/<[^>]+>/g, '\n')
  .split('\n')
  .map((node) => node.trim())
  .filter(Boolean);

/**
 * Text that speaks to how far a verdict can be trusted: a confidence or
 * certainty word, an assumption, or a percentage.
 */
const CONFIDENCE_TALK = /confiden|certaint|assum|\d+(?:\.\d+)?\s*%/i;

/**
 * The drill's own confidence factors that report the capability as not in
 * place. Text belonging to one of these is a statement that confidence is
 * missing, which is not a disclosure of it.
 */
const UNWIRED_CONFIDENCE_FACTORS = drill.agents
  .flatMap((agent) => agent.factors)
  .filter((factor) => /confiden/i.test(factor.factor))
  .filter((factor) => factor.status === 'deferred' || factor.status === 'blocked');

const UNWIRED_CONFIDENCE_TEXT = new Set(
  UNWIRED_CONFIDENCE_FACTORS.flatMap((factor) => [factor.factor, factor.note]),
);

/** Rendered text a reader could take as a confidence or assumption disclosure. */
const confidenceDisclosures = renderedText.filter(
  (node) => CONFIDENCE_TALK.test(node) && !UNWIRED_CONFIDENCE_TEXT.has(node),
);

/** Non-test source files under `src/` that import the component's module. */
function mountingFiles(): string[] {
  const root = join(process.cwd(), 'src');
  const specifier = /['"][^'"]*components\/admin\/AgentReadinessDeepDrill['"]/;
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
        walk(full);
      } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
        const path = relative(process.cwd(), full);
        if (path === COMPONENT_PATH) continue;
        if (specifier.test(readFileSync(full, 'utf8'))) found.push(path);
      }
    }
  };
  walk(root);
  return found;
}

/**
 * The legal catalog's Setup row for this component, split the way the
 * control catalog gate splits it: pipe-separated cells, code paths
 * de-backticked.
 */
function legalRowForComponent(): string[] {
  const rows = readFileSync(join(process.cwd(), LEGAL_CATALOG), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('|'))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim()),
    )
    .filter(
      ([module, , codePath]) =>
        module === 'Setup' && (codePath ?? '').replace(/`/g, '').includes(COMPONENT_PATH),
    );
  expect(rows).toHaveLength(1);
  return rows[0];
}

describe('Agent readiness drill-down — the confidence claim, measured', () => {
  it('renders what the legal row cited: the prepared-review caption and the generated date', () => {
    expect(drill.deterministicSourceCaption.length).toBeGreaterThan(0);
    expect(renderedText).toContain(drill.deterministicSourceCaption);
    expect(renderedText).toContain(drill.generatedAt);
    // Neither of them is itself confidence talk, so they cannot be what a
    // "Yes" rests on under the predicate below.
    expect(CONFIDENCE_TALK.test(drill.deterministicSourceCaption)).toBe(false);
    expect(CONFIDENCE_TALK.test(drill.generatedAt)).toBe(false);
  });

  it('renders no confidence value or assumption: the only confidence text is its own factor saying confidence is not wired', () => {
    expect(UNWIRED_CONFIDENCE_FACTORS.length).toBeGreaterThan(0);
    // The factor text is on the page, so the filter above removes something
    // real rather than nothing.
    for (const factor of UNWIRED_CONFIDENCE_FACTORS) {
      expect(renderedText).toContain(factor.note);
    }
    expect(confidenceDisclosures).toEqual([]);
  });

  it('is mounted by nothing: no source file imports it, and the unreachable baseline lists it', () => {
    expect(mountingFiles()).toEqual([]);
    const baseline = readFileSync(join(process.cwd(), UNREACHABLE_BASELINE), 'utf8');
    expect(baseline).toContain(`"${COMPONENT_PATH}"`);
  });

  it('the legal catalog claims a confidence disclosure exactly when one renders where a reader can see it', () => {
    const [, , , , , confidenceCell] = legalRowForComponent();
    const readerSeesDisclosure = confidenceDisclosures.length > 0 && mountingFiles().length > 0;
    // `startsWith('Yes')` is the predicate the control catalog gate uses to
    // decide that a legal row makes a claim it must account for.
    expect(confidenceCell.startsWith('Yes')).toBe(readerSeesDisclosure);
  });
});
