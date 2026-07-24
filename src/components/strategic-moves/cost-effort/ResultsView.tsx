// Cost & Effort wizard — results view (brief §9.4). Renders whatever the
// `/run` execution service returned — no client-side recomputation, this
// component only formats and displays real, already-persisted numbers.

import * as React from "react";
import { Card, Chip, KeyValue } from "../phase-workspace/primitives";
import type { EstimateRunGroupedBucketJson, EstimateRunResultJson } from "./types";

function usd(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function BucketTable({ title, buckets, currency }: { title: string; buckets: EstimateRunGroupedBucketJson[]; currency: string }) {
  if (buckets.length === 0) return null;
  return (
    <div className="pw-kv-group" style={{ marginTop: 8 }}>
      <div className="pw-kv-k" style={{ marginBottom: 4 }}>
        {title}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.key} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <td style={{ padding: "4px 8px 4px 0" }}>{b.label}</td>
              <td style={{ padding: "4px 0", textAlign: "right", whiteSpace: "nowrap" }}>{usd(b.totalCostCents, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsView({ result, currency }: { result: EstimateRunResultJson; currency: string }): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-testid="cost-effort-results">
      <Card kicker="Estimate results" title="Range of magnitude (ROM)" note={`Model v${result.modelVersion} · ${result.scenarioKey} scenario`}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <KeyValue k="Low">{usd(result.range.lowCents, currency)}</KeyValue>
          <KeyValue k="Expected">{usd(result.range.expectedCents, currency)}</KeyValue>
          <KeyValue k="High">{usd(result.range.highCents, currency)}</KeyValue>
        </div>
        <div style={{ marginTop: 8 }}>
          <Chip tone="blue">{result.range.policyName} range policy · score {result.range.score}/10</Chip>
        </div>
      </Card>

      <Card kicker="Effort" title="Total effort" note="Raw and factor-adjusted expected hours">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <KeyValue k="Raw hours">{result.totals.totalRawHours.toLocaleString()}</KeyValue>
          <KeyValue k="Expected hours">{result.totals.totalExpectedHours.toLocaleString()}</KeyValue>
          <KeyValue k="Labor cost">{usd(result.totals.totalLaborCostCents, currency)}</KeyValue>
          <KeyValue k="Technology / third-party cost">{usd(result.technologyThirdPartyCostCents, currency)}</KeyValue>
        </div>
        {result.totals.gapCount > 0 ? (
          <div style={{ marginTop: 8 }}>
            <Chip tone="amber">{result.totals.gapCount} line item(s) have an unresolved role rate — honest gap, not fabricated</Chip>
          </div>
        ) : null}
      </Card>

      <Card kicker="Breakdown" title="Cost by activity pack">
        <BucketTable title="" buckets={result.costByActivityPack} currency={currency} />
      </Card>

      <Card kicker="Breakdown" title="Cost by role">
        <BucketTable title="" buckets={result.costByRole} currency={currency} />
      </Card>

      <Card kicker="Breakdown" title="Change, training, adoption &amp; governance">
        {result.changeAdoptionBreakdown.length > 0 ? (
          <BucketTable title="" buckets={result.changeAdoptionBreakdown} currency={currency} />
        ) : (
          <span className="pw-note">No change/training/adoption/governance activity packs are in scope for this archetype.</span>
        )}
      </Card>

      <Card kicker="Breakdown" title="Internal vs. external / cash vs. absorbed capacity" note="Uses each role's internal_external_default — a disclosed planning simplification, not a treasury cash-flow determination.">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <KeyValue k="Internal (absorbed capacity)">{usd(result.internalVsExternal.internalCostCents, currency)}</KeyValue>
          <KeyValue k="External (cash)">{usd(result.internalVsExternal.externalCostCents, currency)}</KeyValue>
          {result.internalVsExternal.unknownCostCents > 0 ? (
            <KeyValue k="Unknown">{usd(result.internalVsExternal.unknownCostCents, currency)}</KeyValue>
          ) : null}
        </div>
      </Card>

      <Card kicker="Breakdown" title="One-time vs. recurring">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <KeyValue k="One-time">{usd(result.oneTimeVsRecurring.oneTimeCostCents, currency)}</KeyValue>
          <KeyValue k="Recurring">{usd(result.oneTimeVsRecurring.recurringCostCents, currency)}</KeyValue>
        </div>
      </Card>

      <Card kicker="Rate-card coverage" title={`${result.rateCardCoverage.coveragePct}% direct/inherited coverage`}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <KeyValue k="Direct">{result.rateCardCoverage.directCount}</KeyValue>
          <KeyValue k="Inherited">{result.rateCardCoverage.inheritedCount}</KeyValue>
          <KeyValue k="Missing">{result.rateCardCoverage.missingCount}</KeyValue>
        </div>
      </Card>

      {result.topAssumptions.length > 0 ? (
        <Card kicker="Disclosure" title="Top assumptions">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {result.topAssumptions.map((a, i) => (
              <li key={i} style={{ fontSize: 13 }}>
                {a}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.topUncertaintyDrivers.length > 0 ? (
        <Card kicker="Disclosure" title="Top uncertainty drivers">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {result.topUncertaintyDrivers.map((a, i) => (
              <li key={i} style={{ fontSize: 13 }}>
                {a}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
