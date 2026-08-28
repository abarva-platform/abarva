'use client';

import { DataTable } from '../DataTable';
import type { SourceWorkspaceVM } from '../buildViewModel';

export function ListLens({ vm }: { vm: SourceWorkspaceVM }) {
  if (vm.isContractList) {
    return (
      <DataTable
        title="Contract register — saved view"
        note="Row click opens Contract 360. Filtered client-side over the same governed register already loaded for this page — no separate query or dataset."
        binding="SourceRenewalExposure + SourceSourcingLeverage"
        columns={vm.listCols}
        rows={vm.listRows}
        footnote="Saved views are filters on the governed register, not separate datasets."
      />
    );
  }
  if (vm.isVendorList) {
    return (
      <DataTable
        title="Vendors — category view"
        note="Row click opens Vendor 360."
        binding="SourceVendorConcentration"
        columns={vm.vendorCols}
        rows={vm.vendorListRows}
        footnote="Vendor rollups aggregate reconciled contract records at canonical vendor_ref, so duplicate legal entities cannot change portfolio totals."
      />
    );
  }
  return null;
}
