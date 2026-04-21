-- Programs foundation · schema for the Programs page (Packet 13 §13.4).
--
-- Additive-only per session lock. UI says "programs"; DB stays
-- `engagements`. Every new table FKs to `engagements(id)`. Column
-- extensions use ADD COLUMN IF NOT EXISTS so re-applying is safe.
--
-- Scope covered:
--   • 10 new tables · program threads, Maestro oversight, phase
--     snapshots, 17-module state, founder approvals, pattern matches,
--     program_modules, milestones, work items, risks
--   • Column extensions on engagements (archetype, origin, oversight,
--     current module, phase lock), engagement_participants (authority,
--     touchpoints), engagement_topics (linked modules, pattern match,
--     priority)

-- ── 1 · program_threads — conversations within a program ───────────────
CREATE TABLE IF NOT EXISTS program_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  title TEXT,
  phase_number INT,
  module_key TEXT,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active','paused','archived')),
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_turn_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_program_threads_engagement ON program_threads(engagement_id, last_turn_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_program_threads_user ON program_threads(user_id);

-- ── 2 · maestro_oversight_flags — human-in-the-loop flags ──────────────
CREATE TABLE IF NOT EXISTS maestro_oversight_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'decision_required','approval_needed','quality_concern',
    'risk_detected','policy_violation','scope_drift'
  )),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('critical','warning','info')),
  raised_by TEXT NOT NULL CHECK (raised_by IN ('maestro','nexus','system','user')),
  raised_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  headline TEXT NOT NULL,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maestro_flags_engagement_open
  ON maestro_oversight_flags(engagement_id, severity, created_at DESC)
  WHERE resolved_at IS NULL;

-- ── 3 · phase_snapshots — point-in-time state captures per gate ────────
CREATE TABLE IF NOT EXISTS phase_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  phase_name TEXT,
  snapshot_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  locked_at TIMESTAMPTZ,
  approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft','pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, phase_number, created_at)
);
CREATE INDEX IF NOT EXISTS idx_phase_snapshots_engagement_phase
  ON phase_snapshots(engagement_id, phase_number, created_at DESC);

-- ── 4 · module_state_log — audit trail for 17-module transitions ───────
CREATE TABLE IF NOT EXISTS module_state_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT NOT NULL,
  changed_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  changed_by_agent TEXT,
  notes TEXT,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_module_state_log_engagement_module
  ON module_state_log(engagement_id, module_key, created_at DESC);

-- ── 5 · founder_approval_requests — CXO/sponsor touchpoints ────────────
CREATE TABLE IF NOT EXISTS founder_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'phase_gate','budget_change','scope_change','vendor_selection',
    'program_close','risk_acceptance','milestone_slip'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','approved','denied','expired','withdrawn'
  )),
  requested_by_user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  approver_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  approver_role TEXT,
  headline TEXT NOT NULL,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_notes TEXT,
  deadline_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_founder_approval_engagement_status
  ON founder_approval_requests(engagement_id, status, deadline_at NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_founder_approval_approver_pending
  ON founder_approval_requests(approver_user_id, created_at DESC)
  WHERE status = 'pending';

-- ── 6 · pattern_match_logs — Genome pattern → program matches ──────────
CREATE TABLE IF NOT EXISTS pattern_match_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  pattern_key TEXT NOT NULL,
  match_confidence NUMERIC(5,4),
  match_context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_action TEXT,
  acted_upon BOOLEAN NOT NULL DEFAULT false,
  acted_upon_at TIMESTAMPTZ,
  acted_upon_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  matched_by_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pattern_match_engagement_confidence
  ON pattern_match_logs(engagement_id, match_confidence DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_pattern_match_pattern ON pattern_match_logs(pattern_key);

-- ── 7 · program_modules — per-program state for each of 17 modules ─────
CREATE TABLE IF NOT EXISTS program_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  module_name TEXT NOT NULL,
  phase_number INT NOT NULL,
  module_order INT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started','in_progress','blocked','completed','skipped'
  )),
  state_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, module_key)
);
CREATE INDEX IF NOT EXISTS idx_program_modules_engagement_phase
  ON program_modules(engagement_id, phase_number, module_order);

-- ── 8 · program_milestones — time-anchored checkpoints ─────────────────
CREATE TABLE IF NOT EXISTS program_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  actual_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN (
    'upcoming','at_risk','hit','missed','cancelled'
  )),
  phase_number INT,
  module_key TEXT,
  owner_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_program_milestones_engagement_target
  ON program_milestones(engagement_id, target_date);

-- ── 9 · program_work_items — workstream/use_case/solution/task tree ────
CREATE TABLE IF NOT EXISTS program_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES program_work_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'workstream','use_case','solution','execution_plan','task'
  )),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','in_progress','blocked','done','cancelled'
  )),
  priority TEXT CHECK (priority IN ('critical','high','medium','low')),
  assigned_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  module_key TEXT,
  phase_number INT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_program_work_items_engagement_status
  ON program_work_items(engagement_id, status, due_date NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_program_work_items_parent
  ON program_work_items(parent_id) WHERE parent_id IS NOT NULL;

-- ── 10 · program_risks — risk register per program ─────────────────────
CREATE TABLE IF NOT EXISTS program_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  likelihood TEXT NOT NULL DEFAULT 'medium' CHECK (likelihood IN ('low','medium','high')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','mitigating','accepted','transferred','closed'
  )),
  mitigation_plan TEXT,
  owner_user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  phase_number INT,
  module_key TEXT,
  identified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_program_risks_engagement_open
  ON program_risks(engagement_id, likelihood, impact)
  WHERE status IN ('open','mitigating');

-- ── Column extensions on engagements ───────────────────────────────────
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS program_archetype TEXT
  CHECK (program_archetype IS NULL OR program_archetype IN (
    'strategic_transformation','workflow_automation','platform_modernization',
    'ai_product_enablement','operational_optimization'
  ));
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS origin_source TEXT
  CHECK (origin_source IS NULL OR origin_source IN (
    'tower_triggered','user_initiated','intelligence_promoted'
  ));
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS origin_source_ref UUID;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS maestro_oversight_level TEXT
  DEFAULT 'partial'
  CHECK (maestro_oversight_level IS NULL OR maestro_oversight_level IN ('full','partial','none'));
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS founder_approval_required BOOLEAN DEFAULT false;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS current_module_key TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS phase_locked_at TIMESTAMPTZ;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS phase_locked_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL;

-- ── Column extensions on engagement_participants ───────────────────────
-- Hot-filter columns kept discrete for index efficiency:
--   approval_authority — "find sponsors across all programs" · founder dashboards
--   last_touchpoint_at — "participants not touched in 30 days" · Maestro sweep
-- Occasional-read state (touchpoint_count, per-user UI prefs) lives in
-- view_state jsonb (added below from Packet 13 §13.4 canonical).
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS approval_authority TEXT
  CHECK (approval_authority IS NULL OR approval_authority IN (
    'sponsor','approver','contributor','observer'
  ));
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS last_touchpoint_at TIMESTAMPTZ;

-- NOTE: engagement_topics (catalog) extensions have been REMOVED in favor
-- of existing columns:
--   · linked_modules → phase_playbook JSONB (already present in 040)
--   · pattern_match_key → key_patterns TEXT[] (already present in 040)
--   · priority_in_program → engagement_topics_map (join, not catalog)

-- ── Spec-canonical columns (Packet 13 §13.4) ───────────────────────────
-- compliance/data-governance on engagements, per-user view_state +
-- notification_preferences on participants, pattern promotion state
-- machine on the topics catalog (Packet 4 DRAFT → PILOT → MATURE).

-- engagements · governance + soft-delete
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS data_residency_region TEXT
  CHECK (data_residency_region IS NULL OR data_residency_region IN (
    'us','us-east','us-west','eu','eu-west','eu-central','apac','ca','uk','au'
  ));
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS retention_policy_years INT DEFAULT 7;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- engagement_participants · role-adaptive rendering + notifications
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS view_state JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- engagement_topics · pattern promotion state machine
ALTER TABLE engagement_topics ADD COLUMN IF NOT EXISTS promotion_state TEXT
  DEFAULT 'draft'
  CHECK (promotion_state IS NULL OR promotion_state IN ('draft','pilot','mature','deprecated'));
ALTER TABLE engagement_topics ADD COLUMN IF NOT EXISTS deployment_count INT NOT NULL DEFAULT 0;
ALTER TABLE engagement_topics ADD COLUMN IF NOT EXISTS successful_deployment_count INT NOT NULL DEFAULT 0;
ALTER TABLE engagement_topics ADD COLUMN IF NOT EXISTS last_successful_deployment_at TIMESTAMPTZ;
ALTER TABLE engagement_topics ADD COLUMN IF NOT EXISTS canonical_shape_json JSONB;

-- Indexes on the new governance / state columns
CREATE INDEX IF NOT EXISTS idx_engagements_archived ON engagements(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_engagements_deleted ON engagements(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_engagement_topics_promotion ON engagement_topics(promotion_state, last_successful_deployment_at DESC NULLS LAST);
