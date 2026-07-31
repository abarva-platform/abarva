#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const learnLayout = read("src/app/(maestro)/home/learn/layout.tsx");
const shim = read("src/components/shell/AppTopBar.tsx");
const nav = read("src/components/navigation/NexusTopNav.tsx");
const navCss = read("src/components/navigation/NexusTopNav.module.css");
const registry = read("src/components/shell/topbar-nav-items.ts");
const maestroChrome = read("src/components/chrome/MaestroChrome.tsx");
const knowledgeShell = read("src/components/knowledge/shell/KnowledgeShell.tsx");

assert(
  maestroChrome.includes("@/components/navigation/NexusTopNav"),
  "MaestroChrome must import the canonical NexusTopNav directly.",
);
assert(
  learnLayout.includes("MaestroChrome owns the single persisted NexusTopNav"),
  "/home/learn layout must delegate global navigation to MaestroChrome.",
);
assert(
  shim.includes("NexusTopNav as AppTopBar"),
  "AppTopBar must remain a compatibility shim over NexusTopNav.",
);
assert(
  fs.existsSync(path.join(root, "public/brand/nexus/abarva-nexus-navbar-dark-32h.svg")),
  "NEXUS dark nav lockup asset is missing.",
);

for (const required of ["Knowledge", "Intelligence", "Moves", "Source", "Tower"]) {
  assert(registry.includes(`label: "${required}"`), `Missing canonical nav label: ${required}`);
}
assert(
  !registry.includes('label: "Learn"') && !registry.includes('href: "/home/learn"'),
  "Learn must not be rendered as a global product nav item.",
);
assert(
  registry.includes('href: "/strategic-moves"'),
  "Moves must keep the existing /strategic-moves product route.",
);

const forbiddenInCanonicalNav = [
  "Active client",
  "Product modules",
  "OPTION2_NAV_LOGO",
  "canonicalClientDisplayName",
  "useClientContext",
  "Healthcare Demo",
  "Airline Demo",
  "Lakeshore Holdings",
  "Industrial Demo",
];
for (const forbidden of forbiddenInCanonicalNav) {
  assert(
    !nav.includes(forbidden),
    `Canonical NexusTopNav must not include legacy/global-brand text: ${forbidden}`,
  );
}

assert(
  nav.includes('aria-label="Primary"'),
  "Canonical NexusTopNav must expose aria-label=\"Primary\".",
);
assert(
  nav.includes("AbarVa NEXUS"),
  "Canonical NexusTopNav must render the AbarVa NEXUS lockup.",
);
assert(
  !knowledgeShell.includes("ModuleSwitcher") &&
    !knowledgeShell.includes('aria-label="Product modules"') &&
    !knowledgeShell.includes("{tenantKey}"),
  "KnowledgeShell must not render a second product module toolbar or tenant key.",
);
assert(
  navCss.includes("@media (max-width: 900px)") &&
    navCss.includes(".desktopLinks") &&
    navCss.includes("display: none") &&
    navCss.includes(".mobileMenu") &&
    navCss.includes("display: block"),
  "Canonical NexusTopNav must retain the approved compact mobile menu treatment.",
);

if (failures.length > 0) {
  console.error("NEXUS navigation contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("NEXUS navigation contract passed.");
