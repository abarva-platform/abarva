import type { ProbabilisticValueForecast } from '../../probabilistic';
import {
  type DeckMeta,
  type DeckSlide,
  type FooterFact,
  coverSlide,
  escapeHtml as esc,
  heroExhibitHtml,
  lede,
  renderDeckDocument,
  slideShell,
} from './deck-shell';
import { CHART, compactUsd } from './svg-charts';

export interface ProbabilisticForecastRendererInput {
  forecast: ProbabilisticValueForecast;
  moveLabel: string;
  tenantLabel: string;
  tenantKey: string;
  generatedOn: string;
}

const SLIDE_COUNT = 4;

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function usd(value: number): string {
  return compactUsd(value);
}

function sectionSlide(input: {
  id: string;
  slideNo: number;
  navLabel: string;
  sectionNo: number;
  takeaway: string;
  hero: string;
  footer: FooterFact[];
  moveLabel: string;
}): string {
  return slideShell({
    id: input.id,
    slideNo: input.slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: input.moveLabel,
    navLabel: input.navLabel,
    sectionNo: input.sectionNo,
    takeaway: input.takeaway,
    hero: input.hero,
    footer: input.footer,
  });
}

function confidenceBandText(forecast: ProbabilisticValueForecast): string {
  return (
    `80% probability between ${usd(forecast.threeYearNpv.p10)} and ` +
    `${usd(forecast.threeYearNpv.p90)} on 3-year NPV`
  );
}

function fanChart(forecast: ProbabilisticValueForecast): string {
  const W = 760;
  const H = 340;
  const padL = 68;
  const padR = 34;
  const padT = 34;
  const padB = 58;
  const rows = forecast.yearly;
  const allValues = rows.flatMap((row) => [
    row.netDist.p10,
    row.netDist.p50,
    row.netDist.p90,
  ]);
  const min = Math.min(0, ...allValues);
  const max = Math.max(1, ...allValues);
  const span = max - min || 1;
  const x = (index: number): number =>
    padL + (index / Math.max(1, rows.length - 1)) * (W - padL - padR);
  const y = (value: number): number =>
    padT + (1 - (value - min) / span) * (H - padT - padB);
  const points = (key: 'p10' | 'p50' | 'p90'): string =>
    rows.map((row, index) => `${x(index)},${y(row.netDist[key])}`).join(' ');
  const upper = points('p90');
  const lower = rows
    .map((row, index) => `${x(index)},${y(row.netDist.p10)}`)
    .reverse()
    .join(' ');
  const zeroY = y(0);

  let svg =
    `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" ` +
    `aria-label="Fan chart of yearly net value P10 P50 and P90 bands" ` +
    `xmlns="http://www.w3.org/2000/svg">` +
    `<title>Fan chart of yearly net value P10 P50 and P90 bands</title>` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  for (let i = 0; i <= 4; i += 1) {
    const value = min + (span / 4) * i;
    const gy = y(value);
    svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${CHART.grid}" stroke-width="1"/>`;
    svg += `<text x="${padL - 10}" y="${gy + 4}" text-anchor="end" font-size="10" fill="${CHART.inkSoft}" font-family="JetBrains Mono, ui-monospace">${esc(usd(value))}</text>`;
  }

  svg += `<line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="${CHART.ink}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
  svg += `<polygon points="${upper} ${lower}" fill="${CHART.accentSoft}" opacity="0.95"/>`;
  svg += `<polyline points="${points('p90')}" fill="none" stroke="${CHART.accent}" stroke-width="2" opacity="0.62"/>`;
  svg += `<polyline points="${points('p50')}" fill="none" stroke="${CHART.ink}" stroke-width="3"/>`;
  svg += `<polyline points="${points('p10')}" fill="none" stroke="${CHART.bad}" stroke-width="2" opacity="0.72"/>`;

  rows.forEach((row, index) => {
    const cx = x(index);
    svg += `<line x1="${cx}" y1="${padT}" x2="${cx}" y2="${H - padB}" stroke="${CHART.grid}" stroke-width="1" opacity="0.45"/>`;
    svg += `<text x="${cx}" y="${H - 26}" text-anchor="middle" font-size="11" font-weight="700" fill="${CHART.ink}" font-family="DM Sans, Inter, sans-serif">Y${row.year}</text>`;
    svg += `<text x="${cx}" y="${y(row.netDist.p50) - 8}" text-anchor="middle" font-size="10" font-weight="800" fill="${CHART.ink}" font-family="JetBrains Mono, ui-monospace">${esc(usd(row.netDist.p50))}</text>`;
  });

  svg += `<g transform="translate(${padL},${H - 12})">`;
  svg += `<rect x="0" y="-10" width="14" height="8" fill="${CHART.accentSoft}"/><text x="20" y="-2" font-size="10" fill="${CHART.inkSoft}">P10-P90 band</text>`;
  svg += `<line x1="126" y1="-6" x2="146" y2="-6" stroke="${CHART.ink}" stroke-width="3"/><text x="153" y="-2" font-size="10" fill="${CHART.inkSoft}">P50 median</text>`;
  svg += `</g></svg>`;
  return svg;
}

function driverBars(forecast: ProbabilisticValueForecast): string {
  const max = Math.max(
    0.01,
    ...forecast.topVarianceDrivers.map((driver) => driver.elasticity),
  );
  return (
    `<div class="data-table" style="padding:16px 18px">` +
    forecast.topVarianceDrivers
      .map((driver, index) => {
        const width = Math.max(4, (driver.elasticity / max) * 100);
        return (
          `<div style="display:grid;grid-template-columns:150px 1fr 60px;gap:12px;align-items:center;margin:${index === 0 ? 0 : 14}px 0">` +
          `<strong>${esc(driver.input)}</strong>` +
          `<span style="height:12px;background:${CHART.cream};border:1px solid ${CHART.grid};border-radius:999px;overflow:hidden">` +
          `<span style="display:block;height:100%;width:${width.toFixed(1)}%;background:${index === 0 ? CHART.bad : CHART.accent}"></span>` +
          `</span>` +
          `<span style="font-family:JetBrains Mono,ui-monospace;text-align:right">${driver.elasticity.toFixed(2)}</span>` +
          `<span></span><span style="grid-column:2 / 4;color:${CHART.inkSoft};font-size:12px">${esc(driver.note)}</span>` +
          `</div>`
        );
      })
      .join('') +
    `</div>`
  );
}

function probabilityCards(forecast: ProbabilisticValueForecast): string {
  const cards = [
    ['3-year P10', usd(forecast.threeYearNpv.p10)],
    ['3-year P50', usd(forecast.threeYearNpv.p50)],
    ['3-year P90', usd(forecast.threeYearNpv.p90)],
    ['Net-positive odds', pct(forecast.probNetPositive3yr)],
    ['Target-hit odds', pct(forecast.probHitTarget)],
  ];
  return (
    `<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px">` +
    cards
      .map(
        ([label, value]) =>
          `<div style="border:1px solid ${CHART.grid};border-radius:5px;padding:13px;background:${CHART.cream}">` +
          `<div style="font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${CHART.inkSoft}">${esc(label)}</div>` +
          `<div style="font-family:JetBrains Mono,ui-monospace;font-size:18px;font-weight:800;margin-top:5px">${esc(value)}</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`
  );
}

function renderForecastSlide(input: ProbabilisticForecastRendererInput): string {
  const { forecast } = input;
  return sectionSlide({
    id: 'probabilistic-forecast',
    slideNo: 2,
    navLabel: 'Forecast band',
    sectionNo: 1,
    moveLabel: input.moveLabel,
    takeaway:
      `${confidenceBandText(forecast)}; median case is ${usd(forecast.threeYearNpv.p50)}.`,
    hero:
      lede(
        'The forecast is now a distribution, not a single haircut number. P10 is the downside case, P50 is the median case, and P90 is the upside case across the simulated futures.',
      ) +
      heroExhibitHtml(
        'Exhibit 1 — Yearly net-value fan chart',
        fanChart(forecast),
        `Trials: ${forecast.threeYearNpv.samples.toLocaleString()} · seed ${forecast.threeYearNpv.seed}.`,
      ),
    footer: [
      { key: 'So what', val: 'The CFO can see downside tail and upside range in the same artifact.' },
      { key: 'Decision role', val: 'Investment approval and risk shaping.' },
      { key: 'Evidence', val: 'Generated from the probabilistic forecast kernel.' },
    ],
  });
}

function renderDecisionSlide(input: ProbabilisticForecastRendererInput): string {
  const { forecast } = input;
  return sectionSlide({
    id: 'decision-probabilities',
    slideNo: 3,
    navLabel: 'Decision odds',
    sectionNo: 2,
    moveLabel: input.moveLabel,
    takeaway:
      `${pct(forecast.probNetPositive3yr)} probability of net-positive 3-year NPV; ${pct(forecast.probHitTarget)} probability of hitting the locked target.`,
    hero:
      lede(
        'This separates the two board questions: how often the Move clears zero, and how often it clears the target that was locked in the business case.',
      ) +
      heroExhibitHtml('Exhibit 2 — Decision probability strip', probabilityCards(forecast)),
    footer: [
      { key: 'So what', val: 'A positive median is not enough; target-hit probability shows ambition risk.' },
      { key: 'Owner', val: 'CFO + sponsor.' },
      { key: 'Next gate', val: 'Tighten the assumptions that move the odds before funding.' },
    ],
  });
}

function renderDriversSlide(input: ProbabilisticForecastRendererInput): string {
  const top = input.forecast.topVarianceDrivers[0];
  return sectionSlide({
    id: 'variance-drivers',
    slideNo: 4,
    navLabel: 'Variance drivers',
    sectionNo: 3,
    moveLabel: input.moveLabel,
    takeaway: top
      ? `Top driver: ${top.input}; reduce that uncertainty before debating the median.`
      : 'No variance drivers surfaced; the forecast is effectively deterministic.',
    hero:
      lede(
        'Variance decomposition tells the team which assumption to tighten first. That is the actionability upgrade over a static sensitivity table.',
      ) +
      heroExhibitHtml('Exhibit 3 — Top variance drivers', driverBars(input.forecast)),
    footer: [
      { key: 'So what', val: 'Focus diligence on the input that actually widens the downside tail.' },
      { key: 'Decision role', val: 'Pre-funding diligence and redesign.' },
      { key: 'Next move', val: top ? `Run an evidence sprint on ${top.input}.` : 'Preserve deterministic case.' },
    ],
  });
}

export function renderProbabilisticForecastHtml(
  input: ProbabilisticForecastRendererInput,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Probabilistic Value Forecast',
    moveLabel: input.moveLabel,
    tenantLabel: input.tenantLabel,
    tenantKey: input.tenantKey,
    generatedOn: input.generatedOn,
    verdict: {
      label: 'DISTRIBUTION',
      sub: confidenceBandText(input.forecast),
    },
    documentTitle: `${input.moveLabel} · Probabilistic Value Forecast`,
  };
  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'P10/P50/P90 forecast and variance drivers',
      render: () =>
        coverSlide({
          brand: meta.brand,
          eyebrow: 'Moves · Board-grade artifact',
          title: input.moveLabel,
          tenantLine: `${input.tenantLabel} · ${input.tenantKey}`,
          lede:
            'The Move forecast is now **probabilistic**: downside, median, upside, target-hit odds, and variance drivers in one artifact.',
          meta: [
            { label: '3-year P50', value: usd(input.forecast.threeYearNpv.p50) },
            { label: '80% band', value: `${usd(input.forecast.threeYearNpv.p10)} to ${usd(input.forecast.threeYearNpv.p90)}` },
            { label: 'Net-positive odds', value: pct(input.forecast.probNetPositive3yr) },
          ],
          hint: 'Use the left rail or arrow keys to move through the forecast.',
        }),
    },
    {
      id: 'probabilistic-forecast',
      navLabel: 'Forecast band',
      navPreview: confidenceBandText(input.forecast),
      render: () => renderForecastSlide(input),
    },
    {
      id: 'decision-probabilities',
      navLabel: 'Decision odds',
      navPreview: `${pct(input.forecast.probNetPositive3yr)} net-positive odds`,
      render: () => renderDecisionSlide(input),
    },
    {
      id: 'variance-drivers',
      navLabel: 'Variance drivers',
      navPreview: input.forecast.topVarianceDrivers[0]?.input ?? 'Deterministic',
      render: () => renderDriversSlide(input),
    },
  ];
  return renderDeckDocument(meta, slides);
}
