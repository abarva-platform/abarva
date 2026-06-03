#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertContains(path, text, label = text) {
  const body = read(path);
  if (!body.includes(text)) {
    throw new Error(`${path} is missing ${label}`);
  }
}

const route = "src/app/(maestro)/admin/ops/page.tsx";
const model = "src/lib/admin/ops-surface.ts";
const sidebar = "src/lib/admin/admin-shell-config.ts";
const home = "src/lib/admin/home-overview-v2.ts";
const inventory = "src/lib/admin/admin-surface-completeness.ts";
const runbook = "docs/runbooks/admin-ops-surface.md";
const release = "docs/releases/records/2026-06-03-admin-ops-surface.md";

assertContains(route, "export const dynamic = \"force-dynamic\"");
assertContains(route, "This page does\n              not execute production jobs directly", "no direct execution copy");
assertContains(model, "buildAdminOpsSurfaceModel");
assertContains(model, "reindex-search-corpus");
assertContains(model, "migration-dry-run");
assertContains(model, "defender-quarantine-replay");
assertContains(sidebar, "Ops Console");
assertContains(sidebar, "href: \"/admin/ops\"");
assertContains(home, "href: '/admin/ops'");
assertContains(inventory, "panelId: 'ops-console'");
assertContains(runbook, "No direct production execution");
assertContains(release, "2026-06-03-admin-ops-surface");

console.log("Admin ops surface verifier passed.");
