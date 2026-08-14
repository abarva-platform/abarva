import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260524170000_decision_dossier_v1.sql"),
  "utf8",
);
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.decision_threads/);
assert.match(
  migration,
  /CREATE TABLE IF NOT EXISTS public\.decision_thread_links/,
);
assert.match(migration, /source_event_code_backfill_audit/);
assert.match(
  migration,
  /ALTER TABLE public\.decision_threads ENABLE ROW LEVEL SECURITY/,
);
assert.match(migration, /can_read_tenant_by_key\(client_id\)/);

const autoLinker = fs.readFileSync(
  path.join(root, "src/lib/decisions/auto-linker.ts"),
  "utf8",
);
assert.match(autoLinker, /ensureThreadForMove/);
assert.match(autoLinker, /ensureThreadForSourceEvent/);
assert.match(autoLinker, /ensureThreadForTower/);
assert.match(autoLinker, /linkGeneratedArtifactToDecisionThread/);
assert.match(autoLinker, /getDecisionThreadDossier/);

const originationSubmit = fs.readFileSync(
  path.join(root, "src/lib/programs/origination-submit.ts"),
  "utf8",
);
assert.match(originationSubmit, /originatingIntelligenceSessionId/);
assert.match(originationSubmit, /ensureThreadForMove/);
assert.match(
  originationSubmit,
  /Move created from Intelligence Shape Move handoff/,
);

const dossierPage = fs.readFileSync(
  path.join(root, "src/app/(maestro)/dossier/[threadId]/page.tsx"),
  "utf8",
);
assert.match(dossierPage, /Unified decision dossier/);
assert.match(dossierPage, /Intelligence/);
assert.match(dossierPage, /Moves/);
assert.match(dossierPage, /Source/);
assert.match(dossierPage, /Tower/);
assert.match(dossierPage, /Export as Board Pack/);

const adminPage = fs.readFileSync(
  path.join(root, "src/app/(maestro)/admin/dossiers/page.tsx"),
  "utf8",
);
assert.match(adminPage, /Decision Dossiers/);
assert.match(adminPage, /Cross-surface decision threads/);

const backfill = fs.readFileSync(
  path.join(root, "scripts/migration/source-event-code-backfill.ts"),
  "utf8",
);
assert.match(backfill, /generateCanonicalSourceEventCode/);
assert.match(backfill, /APEX-APEX/);
assert.match(backfill, /source_event_code_backfill_audit/);

const originationSubmitContract = fs.readFileSync(
  path.join(root, "src/lib/programs/origination-submit.ts"),
  "utf8",
);
assert.match(originationSubmitContract, /decisionThreadId/);
assert.match(
  originationSubmitContract,
  /Move created from Intelligence Shape Move handoff/,
);

const agentRoute = fs.readFileSync(
  path.join(root, "src/app/api/chat/agent/route.ts"),
  "utf8",
);
assert.match(agentRoute, /Pronoun resolution/);
assert.match(agentRoute, /the Move we just created/);

const sourceEventRoute = fs.readFileSync(
  path.join(root, "src/app/(maestro)/source/events/[eventId]/page.tsx"),
  "utf8",
);
assert.match(sourceEventRoute, /SourceAnalyticsCanvas/);
assert.doesNotMatch(sourceEventRoute, /UniversalCanvasShell/);

console.log("P22 decision dossier smoke passed");
