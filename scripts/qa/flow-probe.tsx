import fs from "node:fs";
import path from "node:path";
import { buildCurrentStateFlowView } from "../../src/lib/visual-system/projections/current-state-flow";
import { validateArchitectureView } from "../../src/lib/visual-system/architecture-view-contract";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";
const DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const tenantKey = f.replace(/\.json$/, "");
  const b = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as HomeReviewBundle;
  const ints = b.technologyEstate?.recordTypes.find((r) => r.objectType === "data_asset_or_integration");
  if (!ints) { console.log(tenantKey, "no integrations"); continue; }
  const v = buildCurrentStateFlowView({ tenantKey, tenantDisplayName: tenantKey, integrations: ints });
  const issues = validateArchitectureView(v);
  console.log(`\n== ${tenantKey}`);
  console.log("  title:", v.title);
  console.log("  context:", v.contextLine);
  console.log("  nodes:", v.nodes.length, " edges:", v.edges.length, " issues:", issues.length);
  issues.slice(0,5).forEach(i=>console.log("    ",i.level,i.message));
  const lanes = new Map<string, string[]>();
  v.nodes.forEach(n => lanes.set(n.layer, [...(lanes.get(n.layer)||[]), n.label]));
  for (const [l, ns] of lanes) console.log(`  [${l}] ${ns.join(" | ")}`);
  console.log("  top edges:", v.edges.sort((a,b)=>(b.weight||0)-(a.weight||0)).slice(0,4).map(e=>`${e.weight}× ${e.label}`).join("  ·  "));
}
