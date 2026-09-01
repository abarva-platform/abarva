/**
 * @jest-environment jsdom
 */

/**
 * The distance-to-target distribution.
 *
 * A fifty-row table answers "what is this metric doing". It cannot answer "is this enterprise near
 * or far", which is what a reader asks of a metric set before any individual metric.
 *
 * These tests assert the chart *draws*, not that the section exists. The renewal chart on this
 * surface shipped blank past a green suite twice -- once because the container measured a parent
 * that had no layout, once because the bars animated in on mount -- and both times the tests
 * covered the header, the axis labels and the caption. Everything except the marks.
 */
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import { MetricDistance, buildMetricDistribution } from "../MetricDistance";
import type { EstateRow } from "../page-tables";

function metric(
  baseline: number | string | null,
  target: number | string | null,
): EstateRow {
  return {
    metricName: `m${Math.random()}`,
    baselineValue: baseline,
    targetValue: target,
  };
}

/** Distances of 0%, 20%, 50% and 90% -- one in each of four bands. */
const spread: EstateRow[] = [
  metric(100, 100),
  metric(80, 100),
  metric(50, 100),
  metric(10, 100),
  metric(40, 100),
];

describe("the distribution", () => {
  it("places a metric by how far it sits from its own target", () => {
    const dist = buildMetricDistribution(spread);
    expect(dist.measured).toBe(5);
    expect(dist.bands.find((b) => b.label === "At target")?.count).toBe(1);
    expect(dist.bands.find((b) => b.label === "10–25%")?.count).toBe(1);
    expect(dist.far).toBe(3);
  });

  it("counts a metric missing a baseline or a target rather than dropping it", () => {
    const dist = buildMetricDistribution([
      ...spread,
      metric(null, 100),
      metric(80, null),
    ]);
    expect(dist.total).toBe(7);
    expect(dist.measured).toBe(5);
  });

  it("says so on the page, so the distribution is not read as the whole set", () => {
    const { container } = render(
      <MetricDistance
        metrics={[...spread, metric(null, 100), metric(80, null)]}
      />,
    );
    expect(container.textContent ?? "").toMatch(
      /5 of 7 measures declare both/i,
    );
    expect(container.textContent ?? "").toMatch(
      /counted here rather than dropped/i,
    );
  });
});

describe("the chart itself", () => {
  it("draws bars, not just axes", () => {
    render(<MetricDistance metrics={spread} />);
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(
      document.querySelectorAll(
        "svg .recharts-rectangle, svg .recharts-bar-rectangle",
      ).length,
    ).toBeGreaterThan(2);
  });

  it("renders nothing where the rows are a list rather than a distribution", () => {
    // Two occupied bands is a list; the table beside this says it better.
    const { container } = render(
      <MetricDistance metrics={[metric(100, 100), metric(80, 100)]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when no metrics are served", () => {
    const { container } = render(<MetricDistance metrics={undefined} />);
    expect(container.innerHTML).toBe("");
  });
});
