import fs from "node:fs";
import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
(async () => {
  const r = await buildCanonicalTenantDataReport({ repoRoot: process.cwd(), tenantKeys: ["meridian-health","skyharbor-air"] });
  const out: Record<string, unknown> = {};
  const byType = new Map<string, typeof r.canonicalRecords>();
  for (const rec of r.canonicalRecords) {
    if (!byType.has(rec.objectType)) byType.set(rec.objectType, [] as never);
    byType.get(rec.objectType)!.push(rec as never);
  }
  for (const [t, rows] of [...byType].sort()) {
    const attrs = new Map<string, {types:Set<string>, filled:number}>();
    for (const row of rows) {
      for (const [k, v] of Object.entries(row.attributes ?? {})) {
        if (!attrs.has(k)) attrs.set(k, {types:new Set(), filled:0});
        const a = attrs.get(k)!;
        a.types.add((v as {valueType?:string})?.valueType ?? "unknown");
        const val = (v as {value?:unknown})?.value;
        if (val !== null && val !== undefined && String(val).trim() !== "") a.filled++;
      }
    }
    const relTypes = new Map<string, number>();
    for (const row of rows) for (const rel of row.relationships ?? []) {
      relTypes.set(rel.relationshipType ?? "?", (relTypes.get(rel.relationshipType ?? "?") ?? 0) + 1);
    }
    out[t] = {
      domain: rows[0].domain,
      total: rows.length,
      byTenant: Object.fromEntries(["meridian-health","skyharbor-air"].map(k => [k, rows.filter(x=>x.tenantKey===k).length])),
      evidenceRefs: rows.reduce((n,x)=>n+(x.evidenceReferences?.length??0),0),
      attributes: [...attrs].map(([k,a])=>({name:k, valueTypes:[...a.types], fillRate: Math.round(100*a.filled/rows.length)})),
      relationships: [...relTypes].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,n])=>({type:k,count:n})),
    };
  }
  fs.writeFileSync("/tmp/canonical-schema.json", JSON.stringify(out, null, 2));
  console.log("types:", Object.keys(out).length, "records:", r.canonicalRecords.length);
})();
