import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const migration = fs.readFileSync(
  path.join(
    root,
    "supabase/migrations/20260524173000_source_value_proof_loop_v1.sql",
  ),
  "utf8",
);
assert.match(
  migration,
  /CREATE TABLE IF NOT EXISTS public\.source_value_states/,
);
assert.match(
  migration,
  /CREATE TABLE IF NOT EXISTS public\.source_value_chain/,
);
assert.match(
  migration,
  /state_layer IN \('baseline', 'intervention', 'negotiated', 'realized'\)/,
);
assert.match(
  migration,
  /COALESCE\(array_length\(evidence_ledger_ids, 1\), 0\) >= 2/,
);
assert.match(migration, /state_layer <> 'realized'/);
assert.match(migration, /prevent_realized_source_value_state_update/);
assert.match(
  migration,
  /ALTER TABLE public\.source_value_states ENABLE ROW LEVEL SECURITY/,
);

const service = fs.readFileSync(
  path.join(root, "src/lib/source/value-chain.ts"),
  "utf8",
);
assert.match(service, /computeBaseline/);
assert.match(service, /recordIntervention/);
assert.match(service, /recordNegotiatedOutcome/);
assert.match(service, /attestRealized/);
assert.match(service, /getValueChain/);
assert.match(service, /computeCumulativeSavings/);
assert.match(
  service,
  /Baseline cannot be recorded without at least 2 Evidence Ledger citations/,
);
assert.match(
  service,
  /Realized value cannot be recorded without CFO attestation/,
);

const eventValuePage = fs.readFileSync(
  path.join(root, "src/app/(maestro)/source/events/[eventId]/value/page.tsx"),
  "utf8",
);
assert.match(eventValuePage, /Procurement value proof loop/);
assert.match(eventValuePage, /Baseline/);
assert.match(eventValuePage, /Intervention/);
assert.match(eventValuePage, /Negotiated/);
assert.match(eventValuePage, /Realized/);

const sourceValueLedgerPage = fs.readFileSync(
  path.join(root, "src/app/(maestro)/source/value/page.tsx"),
  "utf8",
);
assert.match(sourceValueLedgerPage, /SourceValueLedger/);
assert.match(sourceValueLedgerPage, /canViewFinancialValues/);

const cfoPage = fs.readFileSync(
  path.join(root, "src/app/(maestro)/admin/cfo-attestation/page.tsx"),
  "utf8",
);
assert.match(cfoPage, /CFO Attestation/);
assert.match(cfoPage, /blocks realized/);

assert.match(eventValuePage, /Source Value Proof/);

console.log("P23 source value proof smoke passed");
