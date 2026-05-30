// Tower ingest · Workday HCM
//
// Source-of-truth column names for the workforce extract. Pinned to match
// the columns documented on the How-to-fill sheet of
// `public/templates/tower/workday-hcm/template.xlsx`.
//
// Field semantics:
// - `employee_id`:    PII-flagged at the source. For real customer ingests
//                     this MUST be a Layer-2 redacted / hashed value before
//                     it reaches this layer. Synthetic-pilot data uses
//                     generator IDs like `EMP-NW-00001`.
// - `function`:       Top-level org function. Must match one of
//                     `WORKDAY_FUNCTION_ENUM`.
// - `sub_function`:   Optional sub-function name; free-text.
// - `location`:       Site / region code, free-text.
// - `level`:          Career level (free-text — orgs vary widely).
// - `contractor_flag`: boolean true for contingent workers, false for FTE.
// - `start_date`:     hire / contract-start date (ISO YYYY-MM-DD).
// - `attrition_date`: null if active, ISO date if departed.
// - `attrition_reason`: voluntary | involuntary | end_of_contract | other.

export const WORKDAY_FUNCTION_ENUM = [
  'Customer Care',
  'Stores',
  'Merchandising',
  'Supply Chain',
  'Marketing',
  'Finance',
  'HR',
  'IT',
  'Data & Analytics',
  'Legal',
  'Other',
] as const;

export type WorkdayFunction = (typeof WORKDAY_FUNCTION_ENUM)[number];

export const ATTRITION_REASON_ENUM = [
  'voluntary',
  'involuntary',
  'end_of_contract',
  'other',
] as const;

export type AttritionReason = (typeof ATTRITION_REASON_ENUM)[number];

export interface WorkdayWorkforceRow {
  employee_id: string;
  function: WorkdayFunction;
  sub_function: string | null;
  location: string | null;
  level: string | null;
  contractor_flag: boolean;
  start_date: string; // YYYY-MM-DD
  attrition_date: string | null;
  attrition_reason: AttritionReason | null;
}

export interface WorkdayParseError {
  rowIndex: number; // 1-based row number in the source sheet (excludes header)
  field: string;
  message: string;
  raw?: unknown;
}

export interface WorkdayParseResult {
  rows: WorkdayWorkforceRow[];
  errors: WorkdayParseError[];
  rowsTotal: number;
}

export interface WorkdayValidationSummary {
  rowsValid: number;
  rowsRejected: number;
  errors: WorkdayParseError[];
  contractorCount: number;
  fteCount: number;
  functionsSeen: Set<WorkdayFunction>;
  earliestStart: string | null;
  latestAttrition: string | null;
}
