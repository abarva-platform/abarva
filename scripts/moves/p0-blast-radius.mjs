#!/usr/bin/env node
// P0 blast-radius diagnostic — READ-ONLY. This script performs NO writes.
//
// Before the integrity fix (PR #6541), the P0 phase page synthesized its input
// values from a stale hardcoded draft list and POSTed them back as
// authoritative capture. The route merged them over `program_modules` and, on
// phase 0, also mirrored them into `engagements.charter`.
//
// This reports which Moves were actually damaged, in which layer, and which are
// deterministically restorable from the preserved `charter.scaffold`. It is the
// evidence a repair pass would be built on — repair is a SEPARATE change and is
// deliberately not implemented here.
//
// A field is only called corrupt when ALL of these hold:
//   1. the live value is an exact known-boilerplate string
//   2. a scaffold source value exists
//   3. the scaffold value differs from the live value
// "Looks generic" is never sufficient. A client may legitimately write
// something bland, and guessing would be worse than reporting nothing.
//
// Usage:
//   node scripts/moves/p0-blast-radius.mjs            # summary
//   node scripts/moves/p0-blast-radius.mjs --detail   # per-field table
//   node scripts/moves/p0-blast-radius.mjs --json     # machine-readable
//
// NOTE: requires DATABASE_URL reachable from where it runs. The production
// Postgres sits inside the ACA VNet, so this runs as a Container Apps job or
// from inside the VNet — not from a laptop.

import process from "node:process";
import pg from "pg";
import {
  diagnoseMove,
  summarizeBlastRadius,
} from "../../src/lib/programs/p0-corruption-diagnostic.ts";

const DETAIL = process.argv.includes("--detail");
const AS_JSON = process.argv.includes("--json");

function asObject(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) ?? {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" ? value : {};
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required. This script only reads.");
    process.exit(2);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    // One read per layer. No transaction, no locks — this must be safe to run
    // against production while people are working.
    const { rows: engagements } = await client.query(`
      SELECT e.id, e.name, e.charter, c.client_key AS tenant_key
      FROM engagements e
      LEFT JOIN clients c ON c.id = e.client_id
      ORDER BY e.created_at
    `);

    const { rows: modules } = await client.query(`
      SELECT engagement_id, module_key, state_jsonb
      FROM program_modules
      WHERE phase_number = 0 AND module_key LIKE 'phase_0_%'
    `);

    const captureByMove = new Map();
    for (const row of modules) {
      const key = row.module_key.replace(/^phase_0_/, "");
      const state = asObject(row.state_jsonb);
      if (!captureByMove.has(row.engagement_id)) {
        captureByMove.set(row.engagement_id, {});
      }
      captureByMove.get(row.engagement_id)[key] =
        typeof state.value === "string" ? state.value : "";
    }

    const diagnoses = engagements.map((row) => {
      const charter = asObject(row.charter);
      return diagnoseMove({
        moveId: row.id,
        tenantKey: row.tenant_key ?? "(unknown)",
        moveName: row.name ?? "(unnamed)",
        scaffold: asObject(charter.scaffold),
        charter,
        captureValues: captureByMove.get(row.id) ?? {},
      });
    });

    const summary = summarizeBlastRadius(diagnoses);
    const affected = diagnoses.filter((d) => d.affected);

    if (AS_JSON) {
      console.log(JSON.stringify({ summary, affected }, null, 2));
      return;
    }

    console.log("\nP0 BLAST RADIUS — READ-ONLY DIAGNOSTIC (no writes performed)\n");
    console.log(`  Moves scanned                     ${summary.movesScanned}`);
    console.log(`  Moves affected                    ${summary.movesAffected}`);
    console.log(`  ... corrupt phase_0 capture rows   ${summary.movesWithCorruptCapture}`);
    console.log(`  ... corrupt charter mirror         ${summary.movesWithCorruptCharterMirror}`);
    console.log(`  Fully restorable from scaffold    ${summary.movesFullyRestorable}`);
    console.log(`  Needing human review              ${summary.movesNeedingReview}`);
    console.log(
      `  Tenants affected                  ${summary.tenantsAffected.join(", ") || "(none)"}`,
    );

    if (Object.keys(summary.corruptFieldCounts).length > 0) {
      console.log("\n  Corrupt field counts:");
      for (const [key, count] of Object.entries(summary.corruptFieldCounts).sort(
        (a, b) => b[1] - a[1],
      )) {
        console.log(`    ${String(count).padStart(4)}  ${key}`);
      }
    }

    if (summary.movesAffected === 0) {
      console.log(
        "\n  No deterministic corruption found. No repair candidates.\n",
      );
      return;
    }

    for (const move of affected) {
      console.log(`\n  ${move.moveName}  [${move.tenantKey}]  ${move.moveId}`);
      console.log(
        `    restorable: ${move.fullyRestorable ? "yes" : "NO — needs review"}`,
      );
      if (!DETAIL) continue;
      console.log(
        `    ${"field".padEnd(34)}${"scaffold".padEnd(12)}${"charter".padEnd(22)}capture`,
      );
      for (const f of move.fields) {
        if (
          f.captureAssessment === "clean" &&
          (f.charterAssessment === "clean" ||
            f.charterAssessment === "not_applicable")
        ) {
          continue;
        }
        const scaffold = f.scaffoldValue ? "present" : "MISSING";
        console.log(
          `    ${f.captureKey.padEnd(34)}${scaffold.padEnd(12)}${f.charterAssessment.padEnd(22)}${f.captureAssessment}`,
        );
      }
    }

    console.log(
      "\n  Repair is a separate, reviewed change. This script wrote nothing.\n",
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[p0-blast-radius] failed:", err);
  process.exit(1);
});
