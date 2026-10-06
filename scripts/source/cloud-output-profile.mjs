const check = (condition, message) => {
  if (!condition) throw new Error(message);
};

export function reconcileCloudOutputProfile(rows, calculationRunIds) {
  const expectedRuns = [...new Set(calculationRunIds)].sort();
  check(expectedRuns.length === calculationRunIds.length && expectedRuns.length > 0,
    "Calculation run scope is invalid");
  const byRun = new Map(expectedRuns.map((id) => [id, []]));
  for (const row of rows) {
    check(byRun.has(row.calculation_run_id), "Calculation output escaped the scoped run set");
    byRun.get(row.calculation_run_id).push(row);
  }
  const historical = expectedRuns.some((id) => byRun.get(id).length === 2);
  let pricedHistorical = 0;
  for (const id of expectedRuns) {
    const outputs = byRun.get(id);
    check(outputs.length === (historical ? 2 : 1), "Calculation output count differs by run");
    const evidence = outputs.filter((row) => row.output_key === "evidence_row_count");
    check(evidence.length === 1 && !evidence[0].priced,
      "Evidence-count output is missing, duplicated, or priced");
    if (historical) {
      const prior = outputs.filter((row) => row.output_key === "calculated_amount_usd");
      check(prior.length === 1, "Unexpected historical calculation output key");
      if (prior[0].priced) pricedHistorical += 1;
    }
  }
  check(pricedHistorical === 0 || pricedHistorical === expectedRuns.length,
    "Historical calculation outputs are only partly unsized");
  return {
    mode: historical ? "historical_dual_output" : "current_evidence_only",
    output_rows: rows.length,
    evidence_count_rows: expectedRuns.length,
    historical_amount_rows: historical ? expectedRuns.length : 0,
    historical_priced_rows: pricedHistorical,
  };
}
