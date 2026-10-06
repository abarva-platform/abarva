// Source · d11 Response Checklist template
//
// Vendor-facing checklist of every required and optional response item
// from the RFP package (d09). Vendors mark Y/N + cite their evidence
// pointer (filename + page). Procurement uses this to gate response
// completeness (d15).
//
// Structure (6 sheets):
//   1. Guide                  — vendor-facing how-to, tab purpose,
//                               completion rules, and evidence rules
//   2. Cover                  — event metadata, vendor name slot,
//                               submission deadline placeholder
//   3. Mandatory Items        — locked requirement identity/category/scoring
//                               columns; vendor fills one normalized disposition
//                               plus narrative and evidence linkages
//   4. Optional / Recommended — same normalized shape, lower priority
//   5. Format Expectations    — locked: file types, naming conventions,
//                               page limits, redactions
//   6. Submission Sign-off    — vendor sign-off block (officer name,
//                               title, certification statements)
//
// The renderer is pure (payload → ExcelJS.Workbook). The payload binder
// extracts mandatory + optional items from the d09 RFP body when
// authored, or falls back to a baseline checklist keyed off the
// archetype.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  buildGuideSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';
import { sourceArtifactGovernanceBanner } from '@/lib/source/artifact-governance';
import {
  SOURCE_RESPONSE_DISPOSITIONS,
  type SourceRequirementCategory,
  type SourceRequirementLevel,
  type SourceResponseType,
} from '@/lib/source/vendor-response-matrix';

/** One row in either the Mandatory or Optional Items sheet. */
export interface ResponseChecklistItem {
  /** Stable id (e.g. "M-PRICING-01" or "O-SECURITY-03"). */
  id: string;
  /** Section in the RFP this item ties back to (e.g. "Pricing"). */
  section: string;
  /** Plain-language requirement text. */
  requirement: string;
  /** Normalized category preserved through evaluation and BAFO. */
  category?: SourceRequirementCategory;
  /** Whether the row gates compliance, contributes to scoring, or informs. */
  requirementLevel?: SourceRequirementLevel;
  /** Expected answer/evidence shape. */
  responseType?: SourceResponseType;
  /** Whether an affirmative response requires a traceable evidence citation. */
  evidenceRequired?: boolean;
  /** Stable evaluation criterion for scored rows. */
  evaluationCriterionId?: string | null;
}

/** Format-expectation row (locked). */
export interface FormatExpectation {
  topic: string;
  requirement: string;
}

export interface ResponseChecklistPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Submission deadline ISO; renders as a cover-sheet line. */
  submissionDeadline?: string;
  /** Mandatory items vendors MUST address. */
  mandatoryItems: ReadonlyArray<ResponseChecklistItem>;
  /** Optional / recommended items vendors should consider. */
  optionalItems: ReadonlyArray<ResponseChecklistItem>;
  /** Format expectations (locked). */
  formatExpectations: ReadonlyArray<FormatExpectation>;
  /** Certification statements to surface in the Sign-off sheet. */
  certifications: ReadonlyArray<string>;
}

interface ControlledColumn {
  header: string;
  key: string;
  width: number;
  locked?: boolean;
  validation?: 'claim-type' | 'location' | 'cost-type';
}

interface ControlledTemplate {
  name: string;
  purpose: string;
  columns: ReadonlyArray<ControlledColumn>;
  seedRows?: ReadonlyArray<Record<string, string>>;
  blankRows: number;
}

/** Build the workbook. */
export function buildResponseChecklistWorkbook(
  payload: ResponseChecklistPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Response Checklist · ${payload.eventCode}`;

  const governanceNotice = sourceArtifactGovernanceBanner('ai_draft', {
    artifactCode: 'd11',
  });
  buildGuideSheet(workbook, {
    title: `Guide · Vendor Response Control Pack`,
    audience: 'vendor',
    purpose:
      'Use this workbook to submit comparable, evidence-backed response content. Narrative files may supplement these tabs, but they do not replace required workbook fields.',
    completionRules: [
      'Complete every issued row with one normalized disposition: Comply, Partially Comply, Exception, or Not Applicable.',
      'Answer at the requirement-ID level. Free-text-only narrative files do not satisfy mandatory or scored rows.',
      'Use Evidence references for filename, tab, row, page, or exhibit citations; use the dedicated pricing, SLA, and exception references when applicable.',
      'A Comply response is not evaluation-ready when the row requires evidence and no evidence is cited.',
      'Partially Comply, Exception, and Not Applicable responses require a linked assumption or exception row.',
      'Do not rename, delete, reorder, or merge locked columns; altered templates may be rejected as non-compliant.',
      'Use Vendor note only for concise clarifications; material assumptions and exceptions belong in the required assumptions, pricing, SLA, transition, or commercial exception tables referenced by the RFP.',
      'Macros, external portal links, and scanned-only responses are not accepted as substitutes for completed fields.',
    ],
    tabDescriptions: [
      { tab: 'Cover', purpose: 'Event metadata, vendor name, and submission deadline.' },
      { tab: 'Mandatory Compliance', purpose: 'Required response checklist; every row must be addressed.' },
      { tab: 'Optional Items', purpose: 'Recommended response items that may strengthen scoring but do not gate completeness.' },
      { tab: 'Vendor Claims', purpose: 'Material claims bound to baselines, commitments, remedies, and evidence.' },
      { tab: 'Solution Approach', purpose: 'Service design, responsibilities, dependencies, and measurable outcomes.' },
      { tab: 'Pricing Response', purpose: 'Comparable run, change, transition, tooling, pass-through, and optional-service economics.' },
      { tab: 'Staffing & Location', purpose: 'Role, level, location, capacity, rate, and transition assumptions.' },
      { tab: 'SLA Commitments', purpose: 'Baseline, target, measurement, credit, cure, and chronic-failure remedy.' },
      { tab: 'Automation Commitments', purpose: 'Dated, measurable, commercially enforceable automation and productivity claims.' },
      { tab: 'Assumptions & Exclusions', purpose: 'Explicit assumptions, exclusions, dependencies, owners, and commercial effects.' },
      { tab: 'Transition Plan', purpose: 'Milestones, acceptance criteria, owners, dependencies, and payment linkage.' },
      { tab: 'Commercial Exceptions', purpose: 'Requested deviations, rationale, value effect, and fallback position.' },
      { tab: 'Evidence Checklist', purpose: 'Traceable evidence pointers for material claims and commitments.' },
      { tab: 'Format Expectations', purpose: 'Locked file, naming, page-limit, redaction, and submission-channel rules.' },
      { tab: 'Submission Sign-off', purpose: 'Authorized officer certification and submission attestations.' },
    ],
  });
  buildCoverSheet(workbook, {
    title: `Response Checklist · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    governanceNotice: {
      message: governanceNotice.message,
      detail: governanceNotice.detail,
    },
    instructions: [
      'Vendor of record: fill the Vendor name slot below before completing the checklist.',
      'Mandatory Compliance — every row requires a normalized disposition, response narrative, accountable owner, and the specified evidence linkages.',
      'Complete every applicable commercial, staffing, SLA, automation, assumption, transition, exception, and evidence tab.',
      'Format Expectations is locked. Submissions outside these conventions may be rejected.',
      'Submission Sign-off — an authorized officer must complete every certification before submission.',
    ],
  });
  // Vendor name slot + submission deadline.
  const cover = workbook.getWorksheet('Cover');
  if (cover) {
    cover.addRow([]);
    const r = cover.addRow(['Vendor name', '']);
    r.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };

    if (payload.submissionDeadline) {
      const d = cover.addRow(['Submission deadline', safeCell(payload.submissionDeadline)]);
      d.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    }
  }

  buildItemsSheet(workbook, 'Mandatory Compliance', payload.mandatoryItems, true);
  buildItemsSheet(workbook, 'Optional Items', payload.optionalItems, false);
  controlledTemplates().forEach((template) =>
    buildControlledTemplateSheet(workbook, template),
  );
  buildFormatExpectationsSheet(workbook, payload.formatExpectations);
  buildSignoffSheet(workbook, payload.certifications);
  applyWorkbookPrintContract(workbook);

  return workbook;
}

function applyWorkbookPrintContract(workbook: ExcelJS.Workbook): void {
  workbook.worksheets.forEach((sheet) => {
    const narrativeSheet = sheet.name === 'Guide' || sheet.name === 'Cover';
    sheet.pageSetup = {
      orientation: narrativeSheet ? 'portrait' : 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.45,
        bottom: 0.45,
        header: 0.2,
        footer: 0.2,
      },
    };
    sheet.headerFooter.oddFooter = `&L${safeCell(workbook.title ?? 'Vendor Response Control Pack')}&RPage &P of &N`;
  });
}

function buildItemsSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: ReadonlyArray<ResponseChecklistItem>,
  mandatory: boolean,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Requirement ID', key: 'id', width: 20 },
    { header: 'Requirement category', key: 'category', width: 26 },
    { header: 'RFP section', key: 'section', width: 22 },
    { header: 'Requirement statement', key: 'requirement', width: 58 },
    { header: 'Requirement level', key: 'level', width: 18 },
    { header: 'Response type', key: 'responseType', width: 22 },
    { header: 'Evaluation criterion ID', key: 'criterionId', width: 24 },
    { header: 'Evidence required', key: 'evidenceRequired', width: 18 },
    { header: 'Response disposition', key: 'disposition', width: 22 },
    { header: 'Response narrative', key: 'narrative', width: 48 },
    { header: 'Evidence reference(s)', key: 'evidence', width: 38 },
    { header: 'Pricing reference', key: 'pricingRef', width: 24 },
    { header: 'SLA / KPI reference', key: 'slaRef', width: 24 },
    { header: 'Assumption / exception reference', key: 'exceptionRef', width: 30 },
    { header: 'Vendor owner', key: 'vendorOwner', width: 24 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const item of rows) {
    const r = sheet.addRow({
      id: safeCell(item.id),
      category: safeCell(item.category ?? inferRequirementCategory(item.section)),
      section: safeCell(item.section),
      requirement: safeCell(item.requirement),
      level: item.requirementLevel ?? (mandatory ? 'Mandatory' : 'Informational'),
      responseType: item.responseType ?? 'Narrative',
      criterionId: safeCell(item.evaluationCriterionId ?? ''),
      evidenceRequired: item.evidenceRequired === false ? 'No' : 'Yes',
      disposition: '',
      narrative: '',
      evidence: '',
      pricingRef: '',
      slaRef: '',
      exceptionRef: '',
      vendorOwner: '',
    });
    // A:H is the buyer's issued contract. I:O is the vendor's answer.
    for (let column = 1; column <= 8; column += 1) {
      r.getCell(column).protection = { locked: true };
      r.getCell(column).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
      };
    }
    r.getCell('requirement').alignment = { wrapText: true, vertical: 'top' };
    r.getCell('narrative').alignment = { wrapText: true, vertical: 'top' };
    for (let column = 9; column <= 15; column += 1) {
      r.getCell(column).protection = { locked: false };
      r.getCell(column).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    sheet.getCell(`I${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${SOURCE_RESPONSE_DISPOSITIONS.join(',')}"`],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Response disposition',
      error:
        'Use Comply, Partially Comply, Exception, or Not Applicable.',
    };
    rowNum += 1;
  }

  return sheet;
}

function controlledTemplates(): ControlledTemplate[] {
  return [
    template('Vendor Claims', 'Register each material claim once and bind it to a baseline, measurable commitment, commercial remedy, and evidence.', [
      locked('Claim ID', 'claimId', 16),
      editable('Claim type', 'claimType', 22, 'claim-type'),
      editable('Service / workstream', 'service', 28),
      editable('Claim statement', 'claim', 46),
      editable('Current baseline', 'baseline', 28),
      editable('Measurement source', 'measurementSource', 30),
      editable('Committed outcome', 'outcome', 30),
      editable('Commitment date', 'commitmentDate', 18),
      editable('Commercial remedy', 'remedy', 30),
      editable('Evidence reference', 'evidence', 34),
    ], 20),
    template('Solution Approach', 'Describe how each in-scope service will operate, who owns it, what it depends on, and how success will be measured.', [
      locked('Approach ID', 'approachId', 16),
      editable('Service / workstream', 'service', 28),
      editable('Proposed approach', 'approach', 48),
      editable('Vendor responsibility', 'vendorResponsibility', 34),
      editable('Client dependency', 'clientDependency', 34),
      editable('Tooling / automation', 'tooling', 30),
      editable('Measurable outcome', 'outcome', 30),
      editable('Evidence reference', 'evidence', 34),
    ], 18),
    template('Pricing Response', 'Separate every cost component so run, change, transition, transformation, tooling, pass-through, and retained costs can be normalized.', [
      locked('Price line ID', 'priceLineId', 16),
      editable('Service / tower', 'service', 26),
      editable('Cost type', 'costType', 22, 'cost-type'),
      editable('Unit / basis', 'unit', 20),
      editable('Volume', 'volume', 14),
      editable('Unit rate', 'unitRate', 16),
      editable('Year 1 amount', 'year1', 18),
      editable('Term amount', 'term', 18),
      editable('Currency', 'currency', 12),
      editable('Escalation / index', 'escalation', 24),
      editable('Productivity credit', 'productivityCredit', 22),
      editable('SLA credit', 'slaCredit', 18),
      editable('Assumption / evidence', 'evidence', 36),
    ], 30),
    template('Staffing & Location', 'Expose the complete resource model, onshore/offshore mix, productive capacity, and rate basis behind the price.', [
      locked('Role line ID', 'roleLineId', 16),
      editable('Service / tower', 'service', 24),
      editable('Role', 'role', 28),
      editable('Level / skill', 'level', 22),
      editable('Location', 'location', 16, 'location'),
      editable('Country / city', 'countryCity', 22),
      editable('FTE', 'fte', 12),
      editable('Productive hours / FTE', 'hours', 20),
      editable('Rate / FTE / year', 'rate', 18),
      editable('Annual cost', 'annualCost', 18),
      editable('Start period', 'startPeriod', 16),
      editable('Transition action', 'transitionAction', 28),
      editable('Evidence reference', 'evidence', 32),
    ], 30),
    template('SLA Commitments', 'Make service outcomes enforceable by tying each target to its baseline, measurement rule, credit, cure, and chronic-failure remedy.', [
      locked('SLA ID', 'slaId', 16),
      editable('Service / tower', 'service', 24),
      editable('Metric', 'metric', 32),
      editable('Current baseline', 'baseline', 20),
      editable('Proposed target', 'target', 20),
      editable('Measurement period', 'period', 20),
      editable('Source system / report', 'source', 28),
      editable('Credit formula', 'creditFormula', 30),
      editable('Credit cap', 'creditCap', 18),
      editable('Cure window', 'cureWindow', 18),
      editable('Chronic miss remedy', 'chronicRemedy', 30),
      editable('Exclusions', 'exclusions', 28),
      editable('Evidence reference', 'evidence', 32),
    ], 24),
    {
      ...template('Automation Commitments', 'Do not score automation or productivity narrative unless the supplier converts it into a dated, measurable, commercially enforceable commitment.', [
        locked('Commitment ID', 'commitmentId', 18),
        editable('Claim type', 'claimType', 22, 'claim-type'),
        editable('Service / workstream', 'service', 28),
        editable('Current baseline', 'baseline', 24),
        editable('Measurement source', 'measurementSource', 30),
        editable('Committed outcome', 'outcome', 30),
        editable('Commitment date', 'commitmentDate', 18),
        editable('Commercial remedy', 'remedy', 32),
        editable('Evidence reference', 'evidence', 34),
      ], 11),
      seedRows: [{ commitmentId: 'AUTO-001', claimType: 'automation' }],
    },
    template('Assumptions & Exclusions', 'Make every pricing, scope, volume, dependency, and exclusion assumption explicit before evaluation.', [
      locked('Item ID', 'itemId', 16),
      editable('Type', 'type', 18),
      editable('Service / workstream', 'service', 26),
      editable('Assumption or exclusion', 'statement', 48),
      editable('Commercial effect', 'commercialEffect', 28),
      editable('Client action / dependency', 'clientAction', 32),
      editable('Owner', 'owner', 20),
      editable('Required-by date', 'requiredBy', 18),
      editable('Evidence reference', 'evidence', 32),
    ], 20),
    template('Transition Plan', 'Bind transition fees and payments to accepted knowledge-transfer, mobilization, cutover, and stabilization milestones.', [
      locked('Milestone ID', 'milestoneId', 16),
      editable('Phase', 'phase', 20),
      editable('Milestone / deliverable', 'milestone', 38),
      editable('Planned start', 'plannedStart', 16),
      editable('Planned finish', 'plannedFinish', 16),
      editable('Vendor owner', 'vendorOwner', 22),
      editable('Client owner', 'clientOwner', 22),
      editable('Dependency', 'dependency', 30),
      editable('Acceptance criteria', 'acceptance', 38),
      editable('Payment linkage', 'payment', 24),
      editable('Evidence reference', 'evidence', 32),
    ], 20),
    template('Commercial Exceptions', 'Capture every requested deviation from the RFP or contract position with value impact and a usable fallback.', [
      locked('Exception ID', 'exceptionId', 16),
      editable('RFP / term reference', 'reference', 24),
      editable('Requested exception', 'exception', 42),
      editable('Vendor rationale', 'rationale', 36),
      editable('Value / risk effect', 'effect', 28),
      editable('Vendor fallback', 'fallback', 34),
      editable('Buyer disposition', 'disposition', 22),
      editable('Evidence reference', 'evidence', 32),
    ], 18),
    template('Evidence Checklist', 'Give evaluators a direct file, sheet, row, page, exhibit, certificate, or system reference for each material response.', [
      locked('Evidence ID', 'evidenceId', 16),
      editable('Related item ID', 'relatedItemId', 18),
      editable('Claim / commitment supported', 'supportedItem', 42),
      editable('File name', 'fileName', 34),
      editable('Tab / page / row', 'pointer', 24),
      editable('Evidence date', 'evidenceDate', 16),
      editable('Evidence owner', 'owner', 22),
      editable('Confidentiality', 'confidentiality', 18),
      editable('Vendor note', 'note', 34),
    ], 30),
  ];
}

function template(
  name: string,
  purpose: string,
  columns: ReadonlyArray<ControlledColumn>,
  blankRows: number,
): ControlledTemplate {
  return { name, purpose, columns, blankRows };
}

function locked(header: string, key: string, width: number): ControlledColumn {
  return { header, key, width, locked: true };
}

function editable(
  header: string,
  key: string,
  width: number,
  validation?: ControlledColumn['validation'],
): ControlledColumn {
  return { header, key, width, validation };
}

function buildControlledTemplateSheet(
  workbook: ExcelJS.Workbook,
  templateSpec: ControlledTemplate,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(templateSpec.name, {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 2 }],
  });
  sheet.columns = templateSpec.columns.map((column) => ({
    key: column.key,
    width: column.width,
  }));
  sheet.addRow([templateSpec.purpose]);
  sheet.mergeCells(1, 1, 1, templateSpec.columns.length);
  sheet.getRow(1).height = 34;
  sheet.getCell('A1').alignment = { wrapText: true, vertical: 'middle' };
  sheet.getCell('A1').font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  const headerRow = sheet.addRow(templateSpec.columns.map((column) => column.header));
  applyHeaderRow(headerRow);

  const rows = [
    ...(templateSpec.seedRows ?? []),
    ...Array.from({ length: templateSpec.blankRows }, () => ({} as Record<string, string>)),
  ];
  rows.forEach((values, rowIndex) => {
    const row = sheet.addRow(
      templateSpec.columns.map((column) => safeCell(values[column.key] ?? '')),
    );
    row.height = 32;
    templateSpec.columns.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      cell.alignment = { wrapText: true, vertical: 'top' };
      cell.protection = { locked: Boolean(column.locked) };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: column.locked ? SOURCE_XLSX.LOCKED_FILL : SOURCE_XLSX.WARNING_FILL,
        },
      };
      applyControlledValidation(cell, column.validation, rowIndex + 3);
    });
  });
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: rows.length + 2, column: templateSpec.columns.length },
  };
  return sheet;
}

function applyControlledValidation(
  cell: ExcelJS.Cell,
  validation: ControlledColumn['validation'],
  rowNumber: number,
): void {
  if (!validation) return;
  const values: Record<NonNullable<ControlledColumn['validation']>, string> = {
    'claim-type': '"automation,productivity,transformation,efficiency,other"',
    location: '"Onshore,Nearshore,Offshore,Client site,Remote"',
    'cost-type': '"Recurring run,One-time,Transition,Transformation,Tooling,Governance,Pass-through,Optional service,Change-order unit rate,Retained client cost"',
  };
  cell.dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [values[validation]],
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Controlled response value',
    error: `Select a controlled value in row ${rowNumber}.`,
  };
}

function inferRequirementCategory(
  section: string,
): SourceRequirementCategory {
  const normalized = section.toLowerCase();
  if (/price|commercial|cost/.test(normalized)) return 'commercial and pricing';
  if (/sla|service level|performance/.test(normalized)) {
    return 'SLA and performance';
  }
  if (/staff|location|resource/.test(normalized)) return 'staffing and location';
  if (/transition|mobilization|cutover/.test(normalized)) return 'transition';
  if (/security|compliance|privacy/.test(normalized)) {
    return 'security and compliance';
  }
  if (/architecture|tool|technology/.test(normalized)) {
    return 'architecture and tooling';
  }
  if (/automation|productivity/.test(normalized)) {
    return 'automation and productivity';
  }
  if (/governance|reporting/.test(normalized)) return 'governance';
  if (/innovation|value/.test(normalized)) return 'innovation and value';
  if (/service management|incident|problem|change/.test(normalized)) {
    return 'service management';
  }
  return 'service scope';
}

function buildFormatExpectationsSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<FormatExpectation>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Format Expectations', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Topic', key: 'topic', width: 32 },
    { header: 'Requirement', key: 'requirement', width: 80 },
  ];
  applyHeaderRow(sheet.getRow(1));

  for (const row of rows) {
    const r = sheet.addRow({
      topic: safeCell(row.topic),
      requirement: safeCell(row.requirement),
    });
    applyLockedRow(r);
    r.getCell('requirement').alignment = { wrapText: true, vertical: 'top' };
    r.height = 32;
  }
  return sheet;
}

function buildSignoffSheet(
  workbook: ExcelJS.Workbook,
  certifications: ReadonlyArray<string>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Submission Sign-off', {
    views: [{ showGridLines: false }],
    properties: { defaultColWidth: 28 },
  });
  sheet.columns = [
    { header: 'Field', key: 'field', width: 36 },
    { header: 'Vendor input', key: 'value', width: 60 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const fields: Array<[string, string]> = [
    ['Vendor legal name', ''],
    ['Authorized signing officer (name + title)', ''],
    ['Officer email', ''],
    ['Officer phone', ''],
    ['Submission date', ''],
  ];
  for (const [field, val] of fields) {
    const r = sheet.addRow([safeCell(field), safeCell(val)]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
  }

  sheet.addRow([]);
  const certHeader = sheet.addRow(['Certification statements', '']);
  certHeader.getCell(1).font = {
    bold: true,
    color: { argb: SOURCE_XLSX.HEADER_FILL },
  };

  for (const cert of certifications) {
    const r = sheet.addRow([safeCell(cert), '']);
    r.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    r.getCell(2).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Confirmed,Declined"'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Certification',
      error: 'Each certification must be Confirmed or Declined.',
    };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.height = 32;
  }
  return sheet;
}
