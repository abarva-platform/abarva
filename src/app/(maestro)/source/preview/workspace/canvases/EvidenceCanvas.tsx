'use client';

import { DataTable } from '../DataTable';
import type { SourceWorkspaceVM } from '../buildViewModel';

export function EvidenceCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  if (vm.evCoverage) {
    return (
      <DataTable
        title="Context coverage by domain"
        note="Which governed reads actually returned rows for this tenant."
        binding="read-adapter portfolio load"
        columns={vm.covCols}
        rows={vm.covRows}
        footnote="Missing is never rendered as zero anywhere in Source."
      />
    );
  }
  if (vm.evSystems) {
    return (
      <DataTable
        title="Source systems"
        note="Every figure in Source resolves to one of these tables."
        binding="source.* canonical tables"
        columns={vm.sysCols}
        rows={vm.sysRows}
        footnote="Row counts are for this tenant, at page load."
      />
    );
  }
  if (vm.evDocs) {
    return (
      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px', fontSize: 13, color: '#5f5e5a', lineHeight: 1.65, maxWidth: '100ch' }}>
        Document evidence (doc.extraction) is not pre-loaded for the whole portfolio — it would require a per-contract fan-out at page load. Open a specific contract&rsquo;s Evidence tab to fetch its real document extractions.
      </div>
    );
  }
  if (vm.evConflicts) {
    return (
      <DataTable
        title="Conflicting values"
        note="Rows where sem.* extraction disagreed with the register — annual_value_conflict_flag or total_committed_value_conflict_flag is set."
        binding="source.contract_360 conflict flags"
        columns={vm.conflictCols}
        rows={vm.conflictRows}
        footnote="Resolved values (resolved_annual_value / resolved_total_committed_value) are what computeVendorConcentration and summarizePortfolio currently read — see the fixture audit for the one known gap where they use the raw field instead."
      />
    );
  }
  if (vm.evMissing) {
    return (
      <DataTable
        title="Missing evidence and its consequence"
        note="What Source cannot assert today, and why."
        binding="read-adapter portfolio load"
        columns={vm.missingCols}
        rows={vm.missingRows}
        footnote="Unknown is not zero."
      />
    );
  }
  return null;
}
