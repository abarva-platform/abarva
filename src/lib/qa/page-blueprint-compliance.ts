/**
 * PX2 — Page Blueprint Compliance Validator
 * Extends PX1 with stricter section-level checks — verifying each of the 10 mandatory
 * sections exists in each blueprint file. All checks are deterministic filesystem scans.
 * No model calls. No network calls.
 */

import * as fs from 'fs';
import * as path from 'path';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'deferred' | 'missing';

export interface BlueprintSectionCheck {
  section: string;
  required: boolean;
  status: ComplianceStatus;
  detail: string;
}

export interface BlueprintComplianceRecord {
  blueprintFile: string;
  pageName: string;
  exists: boolean;
  overallStatus: ComplianceStatus;
  sectionChecks: BlueprintSectionCheck[];
  deterministicSeed: true;
}

export interface PageBlueprintComplianceReport {
  reportId: string;
  totalBlueprints: number;
  compliantCount: number;
  nonCompliantCount: number;
  missingCount: number;
  deferredCount: number;
  records: BlueprintComplianceRecord[];
  uiWorkOrderRequirements: string[];
  overallStatus: 'pass' | 'fail' | 'partial';
  caveat: string;
  deterministicSeed: true;
}

const BLUEPRINT_DIR = path.resolve(process.cwd(), 'docs/platform-design/page-blueprints');

const REQUIRED_SECTIONS = [
  { section: '1. Page Identity', keywords: ['Route', 'Primary agent', 'Demo data'] },
  { section: '2. Job-to-be-Done', keywords: ['Job-to-be-Done', '10 seconds', 'decision', 'First 10'] },
  { section: '3. Data Contract', keywords: ['Data Contract', 'Must not claim', 'Available today', 'Missing'] },
  { section: '4. Layout', keywords: ['Layout', '┌', 'canvas', 'rail', 'header'] },
  { section: '5. Workflow Sequence', keywords: ['Workflow Sequence', 'Unlocks', 'Blocks'] },
  { section: '6. Agent-Centric', keywords: ['Agent-Centric', 'Context used', 'Confidence', 'Recommended next action'] },
  { section: '7. Visual Canon', keywords: ['Visual Canon', 'off-white', 'teal'] },
  { section: '8. Interaction Model', keywords: ['Interaction Model', 'Tabs', 'Drawer', 'Empty state'] },
  { section: '9. Acceptance Criteria', keywords: ['Acceptance Criteria', '- [ ]'] },
  { section: '10. Route Ownership', keywords: ['Route Ownership', 'Route file', 'Expected shell', 'Legacy risk'] },
];

const TARGET_BLUEPRINTS = [
  { file: 'HOME_PAGE_BLUEPRINT.md', name: 'Home Page' },
  { file: 'PROGRAMS_PAGE_BLUEPRINT.md', name: 'Programs Page' },
  { file: 'PROGRAM_DETAIL_PAGE_BLUEPRINT.md', name: 'Program Detail Page' },
  { file: 'SOURCE_PAGE_BLUEPRINT.md', name: 'Source Page' },
  { file: 'SOURCE_EVENT_PAGE_BLUEPRINT.md', name: 'Source Event Page' },
  { file: 'INTELLIGENCE_PAGE_BLUEPRINT.md', name: 'Intelligence Page' },
  { file: 'CONTROL_TOWER_PAGE_BLUEPRINT.md', name: 'Control Tower Page' },
  { file: 'ADMIN_SETUP_PAGE_BLUEPRINT.md', name: 'Admin Setup Page' },
  { file: 'PRODUCTION_READINESS_PAGE_BLUEPRINT.md', name: 'Production Readiness Page' },
  { file: 'ARCHITECTURE_PAGE_BLUEPRINT.md', name: 'Architecture Page' },
];

export const UI_WORK_ORDER_REQUIREMENTS = [
  'Blueprint followed: yes/no (with reference to blueprint file)',
  'Blueprint deviations: list any intentional deviations',
  'Design canon followed: yes/no',
  'Agent-centric enforcement followed: yes/no (reference AGENTX rules)',
  'Deterministic/live caveat preserved: yes/no',
  'Canonical logo used: yes/no',
];

function checkBlueprintSections(content: string): BlueprintSectionCheck[] {
  return REQUIRED_SECTIONS.map(({ section, keywords }) => {
    const matchCount = keywords.filter(kw => content.includes(kw)).length;
    const passes = matchCount >= 2;
    return {
      section,
      required: true,
      status: passes ? 'compliant' : 'non_compliant',
      detail: passes
        ? `${matchCount}/${keywords.length} keywords found`
        : `Only ${matchCount}/${keywords.length} keywords found (need at least 2): ${keywords.join(', ')}`,
    };
  });
}

function checkBlueprint(
  blueprintFile: string,
  pageName: string,
): BlueprintComplianceRecord {
  const filePath = path.join(BLUEPRINT_DIR, blueprintFile);
  const exists = fs.existsSync(filePath);

  if (!exists) {
    return {
      blueprintFile,
      pageName,
      exists: false,
      overallStatus: 'missing',
      sectionChecks: REQUIRED_SECTIONS.map(({ section }) => ({
        section,
        required: true,
        status: 'missing',
        detail: `Blueprint file not found: ${blueprintFile}`,
      })),
      deterministicSeed: true,
    };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const sectionChecks = checkBlueprintSections(content);
  const nonCompliantSections = sectionChecks.filter(s => s.status !== 'compliant');
  const overallStatus: ComplianceStatus =
    nonCompliantSections.length === 0 ? 'compliant' : 'non_compliant';

  return {
    blueprintFile,
    pageName,
    exists: true,
    overallStatus,
    sectionChecks,
    deterministicSeed: true,
  };
}

export function runPageBlueprintComplianceCheck(): PageBlueprintComplianceReport {
  const records: BlueprintComplianceRecord[] = TARGET_BLUEPRINTS.map(({ file, name }) =>
    checkBlueprint(file, name),
  );

  const compliantCount = records.filter(r => r.overallStatus === 'compliant').length;
  const nonCompliantCount = records.filter(r => r.overallStatus === 'non_compliant').length;
  const missingCount = records.filter(r => r.overallStatus === 'missing').length;
  const deferredCount = records.filter(r => r.overallStatus === 'deferred').length;

  const overallStatus =
    missingCount > 0 || nonCompliantCount > 0
      ? 'fail'
      : deferredCount > 0
      ? 'partial'
      : 'pass';

  return {
    reportId: 'PX2-BLUEPRINT-COMPLIANCE-2026-04-26',
    totalBlueprints: TARGET_BLUEPRINTS.length,
    compliantCount,
    nonCompliantCount,
    missingCount,
    deferredCount,
    records,
    uiWorkOrderRequirements: UI_WORK_ORDER_REQUIREMENTS,
    overallStatus,
    caveat:
      'All checks are deterministic filesystem keyword scans. No live rendering, no model calls, no network calls.',
    deterministicSeed: true,
  };
}

export function getUIWorkOrderRequirements(): string[] {
  return UI_WORK_ORDER_REQUIREMENTS;
}

export function getNonCompliantBlueprints(
  report: PageBlueprintComplianceReport,
): BlueprintComplianceRecord[] {
  return report.records.filter(
    r => r.overallStatus === 'non_compliant' || r.overallStatus === 'missing',
  );
}
