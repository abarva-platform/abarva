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

// The approved global product nav. Stated here independently of the registry
// so a code change cannot quietly redefine the approved set — the two have to
// be changed together, on purpose.
//
// "Source" became "Source Optimize" + "Source New" in #7721, and Knowledge left
// the global nav before that. This contract still named the old set, and said
// so on every run that nobody was watching, because it runs in no workflow.
for (const required of [
  "Home",
  "Intelligence",
  "Moves",
  "Source Optimize",
  "Source New",
  "Tower",
]) {
  assert(registry.includes(`label: "${required}"`), `Missing canonical nav label: ${required}`);
}
for (const retired of ["Learn", "Knowledge"]) {
  assert(
    !registry.includes(`label: "${retired}"`),
    `${retired} must not be rendered as a global product nav item.`,
  );
}
assert(
  !registry.includes('href: "/home/learn"'),
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
// The compact mobile menu, asserted as a consequence rather than as a literal.
//
// This used to require the string "@media (max-width: 900px)". #7721 added a
// sixth nav item and moved the breakpoint to 1050px — a correct change that
// failed a contract pinned to the old number. A check that a right answer
// breaks is a check people learn to loosen.
//
// What actually has to hold is that exactly one of the two link sets is
// visible at any width: desktop links show by default and hide at some
// breakpoint, the mobile menu hides by default and shows at the SAME one.
// Whatever that number is, it is the same number.
function displayRules(css, selector) {
  const rules = [];
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g");
  for (const match of css.matchAll(pattern)) {
    const display = match[1].match(/display:\s*([a-z-]+)/)?.[1];
    if (!display) continue;
    // Which @media block, if any, encloses this rule: the nearest preceding
    // "@media (...) {" whose block has not closed before this point.
    const before = css.slice(0, match.index);
    let depth = 0;
    let breakpoint = null;
    for (let i = before.length - 1; i >= 0; i -= 1) {
      const ch = before[i];
      if (ch === "}") depth += 1;
      else if (ch === "{") {
        if (depth === 0) {
          const opener = before.slice(0, i);
          const media = opener.match(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)\s*$/);
          if (media) breakpoint = Number(media[1]);
          break;
        }
        depth -= 1;
      }
    }
    rules.push({ display, breakpoint });
  }
  return rules;
}

const desktopRules = displayRules(navCss, ".desktopLinks");
const mobileRules = displayRules(navCss, ".mobileMenu");

const desktopBase = desktopRules.find((r) => r.breakpoint === null);
const mobileBase = mobileRules.find((r) => r.breakpoint === null);
const desktopHidesAt = desktopRules
  .filter((r) => r.breakpoint !== null && r.display === "none")
  .map((r) => r.breakpoint);
const mobileShowsAt = mobileRules
  .filter((r) => r.breakpoint !== null && r.display !== "none")
  .map((r) => r.breakpoint);

assert(
  desktopBase !== undefined && desktopBase.display !== "none",
  "Canonical NexusTopNav must show the desktop links by default.",
);
assert(
  mobileBase !== undefined && mobileBase.display === "none",
  "Canonical NexusTopNav must hide the compact mobile menu by default.",
);
assert(
  desktopHidesAt.length === 1,
  `Canonical NexusTopNav must hide the desktop links at exactly one breakpoint (found ${desktopHidesAt.length}).`,
);
assert(
  mobileShowsAt.length === 1,
  `Canonical NexusTopNav must reveal the compact mobile menu at exactly one breakpoint (found ${mobileShowsAt.length}).`,
);
assert(
  desktopHidesAt.length === 1 &&
    mobileShowsAt.length === 1 &&
    desktopHidesAt[0] === mobileShowsAt[0],
  `Canonical NexusTopNav must swap desktop links and compact mobile menu at the same breakpoint (desktop hides at ${desktopHidesAt[0] ?? "nowhere"}px, mobile appears at ${mobileShowsAt[0] ?? "nowhere"}px) — any gap leaves a width with no navigation, or two.`,
);

if (failures.length > 0) {
  console.error("NEXUS navigation contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("NEXUS navigation contract passed.");
