/**
 * Source commercial summary surface — does it disclose confidence? (item
 * C-549, half (2), one row:
 * `generated-ui|Source|Commercial summary surface|confidence`)
 *
 * `docs/legal/AI_GENERATED_UI_CATALOG.md` is the document an auditor reads.
 * Its Source row for this component answered "Confidence / assumption
 * disclosure present?" with "Yes: deterministic/no-live-benchmark
 * limitation". The control catalog's coverage row for that claim already
 * deferred it ("limitation copy, not a formal confidence control yet"), so
 * the two documents disagreed about one surface and nothing measured which
 * was right.
 *
 * This file measures it. The real component is rendered over the real
 * builder, every text node a reader would see is searched for a confidence
 * value and for figures that contradict the limitation copy, and the module
 * graph is searched for anything that mounts the component. The legal row is
 * then held to what was observed: it may answer "Yes" exactly when the
 * limitation copy renders, nothing rendered beside it contradicts it, AND
 * something mounts the component where a reader can see it.
 *
 * WHY THE POSITIVE CONTROL COMES FIRST
 *
 * "No confidence value rendered" is vacuous if the render produced nothing.
 * The first case proves the render carries exactly what the legal row cited
 * as its evidence — the seeded-data strip and the no-live-benchmark footer —
 * and the verdicts a confidence value would sit beside, so their presence and
 * the absence of anything else is what the component does, not an empty page.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * Nothing is stubbed. It does not render the component because the component
 * is live — it is listed in `unreachable-components.json` and the third case
 * re-measures that — but because the legal row makes a claim about it, and a
 * claim about an unmounted screen is still a claim an auditor reads.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { renderToStaticMarkup } from 'react-dom/server';

import { SourceCommercialSummarySurface } from '@/components/source/SourceCommercialSummarySurface';
import { buildCommercialSummaryProps } from '@/lib/source/source-commercial-summary';

const COMPONENT_PATH = 'src/components/source/SourceCommercialSummarySurface.tsx';
const LEGAL_CATALOG = 'docs/legal/AI_GENERATED_UI_CATALOG.md';
const UNREACHABLE_BASELINE = 'docs/architecture/unreachable-components.json';

const CONTEXT = { eventId: 'evt-c549', eventName: 'C-549 measurement', stage: 'bafo', vendorCount: 2 };
const props = buildCommercialSummaryProps(CONTEXT);

/** Every text node of the rendered page, trimmed, in document order. */
const renderedText = renderToStaticMarkup(<SourceCommercialSummarySurface {...CONTEXT} />)
  .replace(/<[^>]+>/g, '\n')
  .split('\n')
  .map((node) => node.replace(/\s+/g, ' ').trim())
  .filter(Boolean);
const renderedPage = renderedText.join(' ');

/** Text that states how far a verdict can be trusted. */
const CONFIDENCE_TALK = /confiden|certaint|likelihood|probabilit/i;

/** A market-benchmark figure: a percentage stated against a benchmark or market. */
const BENCHMARK_FIGURE = /\d+(?:\.\d+)?\s*(?:[–-]\s*\d+(?:\.\d+)?)?\s*%.*(?:benchmark|market)|(?:benchmark|market).*\d+(?:\.\d+)?\s*%/i;

/** The limitation copy the legal row cited, as rendered. */
const LIMITATION_COPY = /no live market benchmarks/i;

const confidenceDisclosures = renderedText.filter((node) => CONFIDENCE_TALK.test(node));
const benchmarkFigures = renderedText.filter((node) => BENCHMARK_FIGURE.test(node));

/** Non-test source files under `src/` that import the component's module. */
function mountingFiles(): string[] {
  const root = join(process.cwd(), 'src');
  const specifier = /['"][^'"]*components\/source\/SourceCommercialSummarySurface['"]/;
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
 * The legal catalog's Source row for this component, split the way the
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
        module === 'Source' && (codePath ?? '').replace(/`/g, '').includes(COMPONENT_PATH),
    );
  expect(rows).toHaveLength(1);
  return rows[0];
}

describe('Source commercial summary surface — the confidence claim, measured', () => {
  it('renders what the legal row cited, and the verdicts a confidence value would sit beside', () => {
    expect(renderedText).toContain('Deterministic seeded data · No live model calls');
    expect(renderedPage).toMatch(LIMITATION_COPY);
    // Two vendors, each with a risk verdict and a BAFO-readiness verdict.
    for (const vendor of props.vendors) {
      expect(renderedText).toContain(vendor.vendorName);
      expect(renderedText).toContain(vendor.riskLevel);
    }
    expect(renderedText).toContain('Ready');
    expect(renderedText).toContain('Partial');
  });

  it('renders no confidence value, and a benchmark figure beside the copy that says there are no benchmarks', () => {
    expect(confidenceDisclosures).toEqual([]);
    // The seeded top opportunity is the one benchmark figure on the page. It
    // renders beside the footer that says no live market benchmarks are used,
    // so the limitation copy is contradicted on the surface it describes.
    expect(props.topOpportunity).not.toBeNull();
    expect(benchmarkFigures).toEqual([props.topOpportunity]);
    expect(renderedPage).toMatch(LIMITATION_COPY);
  });

  it('is mounted by nothing: no source file imports it, and the unreachable baseline lists it', () => {
    expect(mountingFiles()).toEqual([]);
    const baseline = readFileSync(join(process.cwd(), UNREACHABLE_BASELINE), 'utf8');
    expect(baseline).toContain(`"${COMPONENT_PATH}"`);
  });

  it('the legal catalog claims a disclosure exactly when an uncontradicted one renders where a reader can see it', () => {
    const [, , , , , confidenceCell] = legalRowForComponent();
    const readerSeesDisclosure =
      LIMITATION_COPY.test(renderedPage) && benchmarkFigures.length === 0 && mountingFiles().length > 0;
    // `startsWith('Yes')` is the predicate the control catalog gate uses to
    // decide that a legal row makes a claim it must account for.
    expect(confidenceCell.startsWith('Yes')).toBe(readerSeesDisclosure);
  });
});
