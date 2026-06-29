import { azureRead } from '@/lib/data-plane/azureRead';
import {
  canonicalCioTowerTenantKey,
  toCioTowerMetricPacket,
  type CioTowerMetricPacket,
  type CioTowerMetricResultLike,
} from '@/lib/cio-tower/metric-packet';

export async function loadCioTowerMetricPackets(tenantKey: string): Promise<CioTowerMetricPacket[]> {
  const canonicalTenantKey = canonicalCioTowerTenantKey(tenantKey);
  const rows = await azureRead.query<CioTowerMetricResultLike>(
    `select mr.measure_key, mr.period, mr.basis, mr.scope, mr.value_numeric, mr.value_json,
            mr.source_fact_keys, mr.formula_version, m.label, m.description
       from cio_tower.measure_results mr
       left join cio_tower.measures m on m.measure_key = mr.measure_key
      where mr.tenant_key = $1
      order by mr.measure_key, mr.period`,
    [canonicalTenantKey],
    { missingTable: 'empty' },
  );
  return rows.map(toCioTowerMetricPacket);
}
