// The columns the evidence loader reads from `program_modules`.
//
// The loader selected `updated_at`, which that table does not have. The query
// failed, the failure was swallowed as "this tenant has no saved inputs", and
// no saved phase input was ever part of a deliverable's governed evidence —
// while every test passed, because each one stubbed the table and none
// checked the columns against it. The list lives here so a test can.

export const PROGRAM_MODULE_EVIDENCE_COLUMNS = [
  "id",
  "module_key",
  "module_name",
  "phase_number",
  "module_order",
  "status",
  "state_jsonb",
  "started_at",
  "completed_at",
  "created_at",
] as const;
