import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260524170000_decision_dossier_v1.sql'),
  'utf8',
);
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.decision_threads/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.decision_thread_links/);
assert.match(migration, /source_event_code_backfill_audit/);
assert.match(migration, /ALTER TABLE public\.decision_threads ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /can_read_tenant_by_key\(client_id\)/);

const autoLinker = fs.readFileSync(
  path.join(root, 'src/lib/decisions/auto-linker.ts'),
  'utf8',
);
assert.match(autoLinker, /ensureThreadForMove/);
assert.match(autoLinker, /ensureThreadForSourceEvent/);
assert.match(autoLinker, /ensureThreadForTower/);
assert.match(autoLinker, /linkGeneratedArtifactToDecisionThread/);
assert.match(autoLinker, /getDecisionThreadDossier/);

const dossierPage = fs.readFileSync(
  path.join(root, 'src/app/(maestro)/dossier/[threadId]/page.tsx'),
  'utf8',
);
assert.match(dossierPage, /Unified decision dossier/);
assert.match(dossierPage, /Intelligence/);
assert.match(dossierPage, /Moves/);
assert.match(dossierPage, /Source/);
assert.match(dossierPage, /Tower/);
assert.match(dossierPage, /Export as Board Pack/);

const adminPage = fs.readFileSync(
  path.join(root, 'src/app/(maestro)/admin/dossiers/page.tsx'),
  'utf8',
);
assert.match(adminPage, /Decision Dossiers/);
assert.match(adminPage, /Cross-surface decision threads/);

const backfill = fs.readFileSync(
  path.join(root, 'scripts/migration/source-event-code-backfill.ts'),
  'utf8',
);
assert.match(backfill, /generateCanonicalSourceEventCode/);
assert.match(backfill, /APEX-APEX/);
assert.match(backfill, /source_event_code_backfill_audit/);

const moveDetail = fs.readFileSync(
  path.join(root, 'src/components/strategic-moves/StrategicMoveDetailView.tsx'),
  'utf8',
);
assert.match(moveDetail, /View in Dossier/);

const sourceCanvas = fs.readFileSync(
  path.join(root, 'src/components/source/canvas/UniversalCanvasShell.tsx'),
  'utf8',
);
assert.match(sourceCanvas, /View in Dossier/);

console.log('P22 decision dossier smoke passed');
