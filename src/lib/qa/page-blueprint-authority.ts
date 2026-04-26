/**
 * PX1 — Page Blueprint Authority
 * Verifies that page blueprint docs exist and meet minimum structure requirements.
 * All checks are deterministic filesystem scans. No model calls.
 */

import * as fs from 'fs';
import * as path from 'path';

export type BlueprintCheckStatus = 'pass' | 'fail' | 'deferred';

export interface BlueprintCheck {
  checkId: string;
  pageName: string;
  description: string;
  status: BlueprintCheckStatus;
  detail: string;
  deterministicSeed: true;
}

export interface BlueprintAuthorityReport {
  reportId: string;
  blueprintCount: number;
  checks: BlueprintCheck[];
  passCount: number;
  failCount: number;
  deferredCount: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  caveat: string;
  deterministicSeed: true;
}

const BLUEPRINT_DIR = path.resolve(process.cwd(), 'docs/platform-design/page-blueprints');
const ENFORCEMENT_DIR = path.resolve(process.cwd(), 'docs/platform-design/experience-system');

const REQUIRED_BLUEPRINTS = [
  { file: 'PAGE_EXPERIENCE_BLUEPRINT_STANDARD.md', name: 'Blueprint Standard' },
  { file: 'PAGE_BLUEPRINT_INDEX.md', name: 'Blueprint Index' },
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

function checkBlueprintFile(fileName: string, pageName: string, baseDir: string, checkIdPrefix: string): BlueprintCheck[] {
  const filePath = path.join(baseDir, fileName);
  const checks: BlueprintCheck[] = [];

  // Check existence
  const exists = fs.existsSync(filePath);
  checks.push({
    checkId: `${checkIdPrefix}-exists`,
    pageName,
    description: `${pageName} blueprint file exists`,
    status: exists ? 'pass' : 'fail',
    detail: exists ? `Found: ${fileName}` : `Missing: ${fileName}`,
    deterministicSeed: true,
  });

  if (!exists) return checks;

  const content = fs.readFileSync(filePath, 'utf8');

  // Check minimum length (thin blueprint guard)
  const isSubstantial = content.length > 500;
  checks.push({
    checkId: `${checkIdPrefix}-substantial`,
    pageName,
    description: `${pageName} blueprint is not thin/empty`,
    status: isSubstantial ? 'pass' : 'fail',
    detail: isSubstantial ? `Length: ${content.length} chars` : `Too thin: ${content.length} chars`,
    deterministicSeed: true,
  });

  // Check for primary question
  const hasPrimaryQuestion =
    content.includes('Primary question') ||
    content.includes('primary question') ||
    content.includes('What needs') ||
    content.includes('How do we') ||
    content.includes('Which ') ||
    content.includes('Are AI') ||
    content.includes('Is AbarVa') ||
    content.includes('Can we demo') ||
    content.includes('How does AbarVa') ||
    content.includes('What sourcing') ||
    content.includes('What patterns');
  checks.push({
    checkId: `${checkIdPrefix}-primary-question`,
    pageName,
    description: `${pageName} blueprint has primary question`,
    status: hasPrimaryQuestion ? 'pass' : 'fail',
    detail: hasPrimaryQuestion ? 'Primary question found' : 'No primary question found',
    deterministicSeed: true,
  });

  // Check for agent reference
  const hasAgent =
    content.toLowerCase().includes('nexus') ||
    content.toLowerCase().includes('sentinel') ||
    content.toLowerCase().includes('steward') ||
    content.toLowerCase().includes('atlas');
  checks.push({
    checkId: `${checkIdPrefix}-agent`,
    pageName,
    description: `${pageName} blueprint names a primary agent`,
    status: hasAgent ? 'pass' : 'fail',
    detail: hasAgent ? 'Agent reference found' : 'No agent reference found',
    deterministicSeed: true,
  });

  // Check for data contract
  const hasDataContract =
    content.includes('Data Contract') ||
    content.includes('data contract') ||
    content.includes('Data contract');
  checks.push({
    checkId: `${checkIdPrefix}-data-contract`,
    pageName,
    description: `${pageName} blueprint has data contract`,
    status: hasDataContract ? 'pass' : 'fail',
    detail: hasDataContract ? 'Data contract section found' : 'No data contract section',
    deterministicSeed: true,
  });

  // Check for deterministic caveat
  const hasCaveat =
    content.toLowerCase().includes('deterministic') ||
    content.toLowerCase().includes('caveat') ||
    content.toLowerCase().includes('seed');
  checks.push({
    checkId: `${checkIdPrefix}-caveat`,
    pageName,
    description: `${pageName} blueprint includes deterministic/seed caveat`,
    status: hasCaveat ? 'pass' : 'fail',
    detail: hasCaveat ? 'Caveat found' : 'No caveat found',
    deterministicSeed: true,
  });

  // Check for acceptance criteria
  const hasAcceptance =
    content.includes('Acceptance') ||
    content.includes('acceptance criteria');
  checks.push({
    checkId: `${checkIdPrefix}-acceptance`,
    pageName,
    description: `${pageName} blueprint has acceptance criteria`,
    status: hasAcceptance ? 'pass' : 'fail',
    detail: hasAcceptance ? 'Acceptance criteria found' : 'No acceptance criteria',
    deterministicSeed: true,
  });

  return checks;
}

export function runPageBlueprintAuthorityCheck(): BlueprintAuthorityReport {
  const allChecks: BlueprintCheck[] = [];

  // Check each required blueprint
  REQUIRED_BLUEPRINTS.forEach((bp, idx) => {
    const prefix = `PX1-BP${String(idx + 1).padStart(2, '0')}`;
    const checks = checkBlueprintFile(bp.file, bp.name, BLUEPRINT_DIR, prefix);
    allChecks.push(...checks);
  });

  // Check enforcement docs exist
  const agentxPath = path.join(ENFORCEMENT_DIR, 'AGENT_CENTRIC_ENFORCEMENT_REVIEW.md');
  const agentxExists = fs.existsSync(agentxPath);
  allChecks.push({
    checkId: 'PX1-AGENTX',
    pageName: 'AGENTX Enforcement',
    description: 'AGENTX agent-centric enforcement review doc exists',
    status: agentxExists ? 'pass' : 'fail',
    detail: agentxExists ? 'AGENT_CENTRIC_ENFORCEMENT_REVIEW.md found' : 'Missing AGENT_CENTRIC_ENFORCEMENT_REVIEW.md',
    deterministicSeed: true,
  });

  const workflowPath = path.join(ENFORCEMENT_DIR, 'PAGE_WORKFLOW_ENFORCEMENT_RULES.md');
  const workflowExists = fs.existsSync(workflowPath);
  allChecks.push({
    checkId: 'PX1-WORKFLOW',
    pageName: 'Workflow Enforcement Rules',
    description: 'Page workflow enforcement rules doc exists',
    status: workflowExists ? 'pass' : 'fail',
    detail: workflowExists ? 'PAGE_WORKFLOW_ENFORCEMENT_RULES.md found' : 'Missing PAGE_WORKFLOW_ENFORCEMENT_RULES.md',
    deterministicSeed: true,
  });

  // Check AGENTX enforcement doc has enforcement content
  if (agentxExists) {
    const agentxContent = fs.readFileSync(agentxPath, 'utf8');
    // Match numbered rules (Rule N, AGENTX-RN) or enforcement sections/bullet items
    const numberedRules = (agentxContent.match(/Rule \d+|AGENTX-R\d+/g) || []).length;
    // Count enforcement bullet points and checks as evidence of enforcement content
    const enforcementLines = (agentxContent.match(/^- .+(must|shall|required|mandatory|rejection|enforcement|gate|check|rule|suppress)/gim) || []).length;
    const hasEnforcementSections = (agentxContent.match(/## .*(Enforcement|Strengthened|Addressed|Added|Improvements)/g) || []).length;
    const totalEnforcementEvidence = numberedRules + enforcementLines + hasEnforcementSections;
    allChecks.push({
      checkId: 'PX1-AGENTX-RULES',
      pageName: 'AGENTX Enforcement',
      description: 'AGENTX doc contains enforcement rules or enforcement sections',
      status: totalEnforcementEvidence >= 5 ? 'pass' : 'fail',
      detail: `Found ${numberedRules} numbered rules, ${enforcementLines} enforcement lines, ${hasEnforcementSections} enforcement sections (total: ${totalEnforcementEvidence})`,
      deterministicSeed: true,
    });
  }

  const passCount = allChecks.filter(c => c.status === 'pass').length;
  const failCount = allChecks.filter(c => c.status === 'fail').length;
  const deferredCount = allChecks.filter(c => c.status === 'deferred').length;

  return {
    reportId: 'PX1-BLUEPRINT-AUTHORITY-2026-04-26',
    blueprintCount: REQUIRED_BLUEPRINTS.length,
    checks: allChecks,
    passCount,
    failCount,
    deferredCount,
    overallStatus: failCount > 0 ? 'fail' : deferredCount > 0 ? 'partial' : 'pass',
    caveat: 'All checks are deterministic filesystem scans. No live rendering or model calls.',
    deterministicSeed: true,
  };
}

export function listRequiredBlueprints(): Array<{ file: string; name: string }> {
  return REQUIRED_BLUEPRINTS;
}
