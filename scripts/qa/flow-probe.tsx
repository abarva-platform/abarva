import fs from "node:fs";
import path from "node:path";
import { buildCurrentStateFlowView } from "../../src/lib/visual-system/projections/current-state-flow";
import { validateArchitectureView } from "../../src/lib/visual-system/architecture-view-contract";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";
const DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const t = f.replace(/\.json$/, "");
  const b = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as HomeReviewBundle;
  const ints = b.technologyEstate?.recordTypes.find((r) => r.objectType === "data_asset_or_integration");
  const apps = b.technologyEstate?.recordTypes.find((r) => r.objectType === "application_system");
  if (!ints) continue;
  const v = buildCurrentStateFlowView({ tenantKey: t, tenantDisplayName: t, integrations: ints, applications: apps });
  const issues = validateArchitectureView(v);
  console.log(`\n${"=".repeat(72)}\n== ${t}   ${v.nodes.length} nodes · ${v.edges.length} edges · ${issues.filter(i=>i.level==="error").length} errors`);
  console.log("   title:", v.title);
  console.log("   ctx:  ", v.contextLine);
  const lanes = new Map<string, string[]>();
  v.nodes.forEach((n) => lanes.set(n.layer, [...(lanes.get(n.layer) ?? []), `${n.label} (${n.note})`]));
  for (const [l, ns] of lanes) {
    console.log(`   [${v.laneLabels?.[l] ?? l}]`);
    ns.forEach((n) => console.log(`       ${n}`));
  }
  issues.filter(i=>i.level==="error").slice(0,4).forEach(i=>console.log("   ERROR:", i.message));
}
