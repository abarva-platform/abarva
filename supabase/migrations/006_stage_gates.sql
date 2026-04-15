-- Stage gate architecture
-- Adds gate metadata to engagement_phases for hard/soft gate tracking.
-- Gate TYPE is configured in solution-config.ts (code), not the DB.
-- These DB columns store the gate state for multi-approver phases.

-- Add gate type and approver config columns
ALTER TABLE engagement_phases
  ADD COLUMN IF NOT EXISTS gate_type TEXT DEFAULT 'hard',
  ADD COLUMN IF NOT EXISTS approvers_required TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approvals_received JSONB DEFAULT '[]';

-- Add admin_override flag to phase_approvals
ALTER TABLE phase_approvals
  ADD COLUMN IF NOT EXISTS is_admin_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- Index for fast lookup of pending approvals
CREATE INDEX IF NOT EXISTS idx_phase_approvals_phase_id ON phase_approvals(phase_id);
CREATE INDEX IF NOT EXISTS idx_engagement_phases_gate_type ON engagement_phases(gate_type);

COMMENT ON COLUMN engagement_phases.gate_type IS 'hard | soft — hard gates require approval, soft gates allow client override';
COMMENT ON COLUMN engagement_phases.approvers_required IS 'For multi-approver phases: array of role names required (e.g. {cfo, cto, coo})';
COMMENT ON COLUMN engagement_phases.approvals_received IS 'Tracks partial approvals for multi-approver phases';
COMMENT ON COLUMN phase_approvals.is_admin_override IS 'TRUE when bypassed by admin (Anand Sundaram) without client approval';
