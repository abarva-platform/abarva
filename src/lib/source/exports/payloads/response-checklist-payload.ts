// Source · d11 Response Checklist payload binder
//
// Pulls runtime context from the substrate + the upstream artifact
// bodies (d09 RFP package when authored), and produces a typed payload
// the renderer consumes.
//
// Strategy:
//   1. Requirement rows — preserve the issued d09 Requirement Response
//      Matrix when present. Older mandatory/optional bullet sections remain
//      a compatibility fallback. Missing-or-sparse d09 uses the existing
//      archetype-aware baseline checklist.
//   2. Format expectations — defaults are sensible procurement-wide
//      conventions; tenant-level config can override later.
//   3. Certifications — defaults cover the standard "we have authority
//      to bind / we accept the locked assumption set" sign-off block.
//
// This binder remains lenient when d09 is not authored, but it never replaces
// an issued matrix with the generic fallback when matrix rows are available.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  FormatExpectation,
  ResponseChecklistItem,
  ResponseChecklistPayload,
} from '../renderers/response-checklist';
import {
  SOURCE_REQUIREMENT_CATEGORIES,
  SOURCE_REQUIREMENT_LEVELS,
  SOURCE_RESPONSE_TYPES,
  type SourceRequirementCategory,
  type SourceRequirementLevel,
  type SourceResponseType,
} from '@/lib/source/vendor-response-matrix';

/** Build the payload from event substrate. */
export function buildResponseChecklistPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): ResponseChecklistPayload {
  const d09 = ctx.artifactStates.find((a) => a.artifactCode === 'd09_rfp_pack');

  const parsed = d09?.body ? parseChecklistFromRfp(d09.body) : null;
  const mandatoryItems = parsed?.mandatory.length
    ? parsed.mandatory
    : defaultMandatoryItems(ctx.event.archetype);
  const optionalItems = parsed?.optional.length
    ? parsed.optional
    : defaultOptionalItems();

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    submissionDeadline: undefined, // future: pull from event metadata
    mandatoryItems,
    optionalItems,
    formatExpectations: defaultFormatExpectations(),
    certifications: defaultCertifications(),
  };
}

// ── RFP parsing ────────────────────────────────────────────────────────────

interface ParsedChecklist {
  mandatory: ResponseChecklistItem[];
  optional: ResponseChecklistItem[];
}

export function parseChecklistFromRfp(md: string): ParsedChecklist {
  const matrixRows = parseRequirementMatrix(md);
  if (matrixRows.length > 0) {
    return {
      mandatory: matrixRows.filter(
        (row) => row.requirementLevel !== 'Informational',
      ),
      optional: matrixRows.filter(
        (row) => row.requirementLevel === 'Informational',
      ),
    };
  }

  const lines = md.split('\n');
  const mandatory: ResponseChecklistItem[] = [];
  const optional: ResponseChecklistItem[] = [];

  type Bucket = 'mandatory' | 'optional' | null;
  let bucket: Bucket = null;
  let currentSection = 'General';
  let mIdx = 1;
  let oIdx = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    // Heading detection
    if (/^#{1,3}\s/.test(trimmed)) {
      const header = trimmed.replace(/^#+\s+/, '');
      if (/\b(mandatory|required)\s+(items|requirements|sections)?\b/i.test(header)) {
        bucket = 'mandatory';
        currentSection = header;
        continue;
      }
      if (/\b(optional|recommended|nice[-\s]to[-\s]have)\b/i.test(header)) {
        bucket = 'optional';
        currentSection = header;
        continue;
      }
      // Switching to an unrelated heading resets the bucket.
      bucket = null;
      currentSection = header;
      continue;
    }
    if (bucket === null) continue;
    // Section anchor inside the bucket: "**Pricing**"
    const sectionAnchor = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (sectionAnchor && sectionAnchor[1]) {
      currentSection = sectionAnchor[1].trim();
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bullet || !bullet[1]) continue;
    const requirement = bullet[1].trim();
    if (bucket === 'mandatory') {
      mandatory.push({
        id: `M-${stableShortHash(requirement)}-${String(mIdx++).padStart(2, '0')}`,
        section: shortenSection(currentSection),
        requirement,
      });
    } else {
      optional.push({
        id: `O-${stableShortHash(requirement)}-${String(oIdx++).padStart(2, '0')}`,
        section: shortenSection(currentSection),
        requirement,
      });
    }
  }
  return { mandatory, optional };
}

function parseRequirementMatrix(md: string): ResponseChecklistItem[] {
  const lines = md.split('\n');
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headers = parseMarkdownTableRow(lines[index] ?? '');
    if (
      headers.length < 4 ||
      !isMarkdownSeparator(lines[index + 1] ?? '')
    ) {
      continue;
    }

    const headerIndex = new Map(
      headers.map((header, column) => [normalizeHeader(header), column]),
    );
    const requirementIdColumn = findColumn(headerIndex, [
      'requirement id',
      'item id',
    ]);
    const requirementColumn = findColumn(headerIndex, [
      'requirement statement',
      'requirement',
    ]);
    if (requirementIdColumn === null || requirementColumn === null) continue;

    const categoryColumn = findColumn(headerIndex, [
      'requirement category',
      'category',
    ]);
    const sectionColumn = findColumn(headerIndex, [
      'rfp section',
      'section',
    ]);
    const levelColumn = findColumn(headerIndex, [
      'mandatory scored informational',
      'requirement level',
      'level',
    ]);
    const responseTypeColumn = findColumn(headerIndex, ['response type']);
    const evidenceRequiredColumn = findColumn(headerIndex, [
      'evidence required',
    ]);
    const criterionColumn = findColumn(headerIndex, [
      'evaluation criterion id',
      'criterion id',
    ]);
    const rows: ResponseChecklistItem[] = [];

    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const sourceLine = lines[rowIndex] ?? '';
      if (!sourceLine.trim().startsWith('|')) break;
      const cells = parseMarkdownTableRow(sourceLine);
      const id = cellAt(cells, requirementIdColumn);
      const requirement = cellAt(cells, requirementColumn);
      if (!id || !requirement) continue;

      const section = cellAt(cells, sectionColumn) || 'General';
      const category = parseCategory(cellAt(cells, categoryColumn), section);
      const requirementLevel = parseRequirementLevel(
        cellAt(cells, levelColumn),
      );
      rows.push({
        id,
        category,
        section,
        requirement,
        requirementLevel,
        responseType: parseResponseType(
          cellAt(cells, responseTypeColumn),
          category,
        ),
        evidenceRequired: parseEvidenceRequired(
          cellAt(cells, evidenceRequiredColumn),
          requirementLevel,
        ),
        evaluationCriterionId: cellAt(cells, criterionColumn) || null,
      });
    }

    if (rows.length > 0) return rows;
  }
  return [];
}

function parseMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  return trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) =>
      cell
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\*\*/g, '')
        .trim(),
    );
}

function isMarkdownSeparator(line: string): boolean {
  const cells = parseMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[/_-]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findColumn(
  headerIndex: ReadonlyMap<string, number>,
  names: readonly string[],
): number | null {
  for (const name of names) {
    const column = headerIndex.get(name);
    if (column !== undefined) return column;
  }
  return null;
}

function cellAt(cells: readonly string[], column: number | null): string {
  return column === null ? '' : (cells[column] ?? '').trim();
}

function parseCategory(
  value: string,
  section: string,
): SourceRequirementCategory {
  const exact = SOURCE_REQUIREMENT_CATEGORIES.find(
    (category) => category.toLowerCase() === value.toLowerCase(),
  );
  if (exact) return exact;
  return inferCategory(`${value} ${section}`);
}

function inferCategory(value: string): SourceRequirementCategory {
  const normalized = value.toLowerCase();
  if (/price|commercial|cost/.test(normalized)) return 'commercial and pricing';
  if (/sla|service level|performance/.test(normalized)) {
    return 'SLA and performance';
  }
  if (/staff|location|resource/.test(normalized)) return 'staffing and location';
  if (/transition|cutover|mobilization/.test(normalized)) return 'transition';
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

function parseRequirementLevel(value: string): SourceRequirementLevel {
  const level = SOURCE_REQUIREMENT_LEVELS.find(
    (candidate) => candidate.toLowerCase() === value.toLowerCase(),
  );
  if (level) return level;
  if (/score/i.test(value)) return 'Scored';
  if (/inform|optional|recommend/i.test(value)) return 'Informational';
  return 'Mandatory';
}

function parseResponseType(
  value: string,
  category: SourceRequirementCategory,
): SourceResponseType {
  const type = SOURCE_RESPONSE_TYPES.find(
    (candidate) => candidate.toLowerCase() === value.toLowerCase(),
  );
  if (type) return type;
  if (category === 'commercial and pricing') return 'Pricing';
  if (category === 'SLA and performance') return 'SLA / KPI';
  if (category === 'staffing and location') return 'Staffing';
  if (category === 'transition') return 'Transition';
  if (category === 'security and compliance') return 'Security';
  return 'Narrative';
}

function parseEvidenceRequired(
  value: string,
  requirementLevel: SourceRequirementLevel,
): boolean {
  if (/^(no|n|false)$/i.test(value.trim())) return false;
  if (/^(yes|y|true|required)$/i.test(value.trim())) return true;
  return requirementLevel !== 'Informational';
}

function shortenSection(heading: string): string {
  return heading.replace(/[#*]+/g, '').trim().slice(0, 32);
}

function stableShortHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) & 0xfff_fff;
  }
  return hash.toString(16).slice(0, 5).toUpperCase();
}

// ── Defaults ───────────────────────────────────────────────────────────────

function defaultMandatoryItems(archetype: string | null): ResponseChecklistItem[] {
  const family = (archetype ?? '').toLowerCase();
  const base: ResponseChecklistItem[] = [
    {
      id: 'M-EXEC-01',
      section: 'Executive summary',
      requirement: 'Executive summary (≤ 2 pages) with proposed solution, key value drivers, and primary differentiators.',
    },
    {
      id: 'M-CORP-01',
      section: 'Corporate',
      requirement: 'Corporate overview: legal entity, ownership, financial stability, last 3 years of annual revenue.',
    },
    {
      id: 'M-CORP-02',
      section: 'Corporate',
      requirement: 'Insurance certificates (general liability, errors & omissions, cyber) with coverage minimums.',
    },
    {
      id: 'M-PRICING-01',
      section: 'Pricing',
      requirement: 'Pricing workbook (d19) submitted using the locked assumption set without modifications to Sheet 2.',
    },
    {
      id: 'M-PRICING-02',
      section: 'Pricing',
      requirement: 'Pricing notes (d19, Sheet 5) flagging any assumption you wish to challenge before BAFO.',
    },
    {
      id: 'M-SECURITY-01',
      section: 'Security',
      requirement: 'SOC 2 Type II report covering the proposed delivery scope (or equivalent ISO 27001 attestation).',
    },
    {
      id: 'M-SECURITY-02',
      section: 'Security',
      requirement: 'Data-handling matrix: where data resides, access controls, encryption posture, sub-processor list.',
    },
    {
      id: 'M-LEGAL-01',
      section: 'Legal',
      requirement: 'Redlines against our standard MSA + DPA template, with rationale per redline.',
    },
    {
      id: 'M-LEGAL-02',
      section: 'Legal',
      requirement: 'Acknowledgement of intellectual property terms (work product, derivative rights) as drafted.',
    },
    {
      id: 'M-OPS-01',
      section: 'Operating model',
      requirement: 'Proposed operating model: org chart, FTE blend (onshore / offshore), shift coverage, escalation path.',
    },
    {
      id: 'M-OPS-02',
      section: 'Operating model',
      requirement: 'SLA matrix mapped to our tier definitions (d04) with credits and remedies per breach.',
    },
    {
      id: 'M-TRANS-01',
      section: 'Transition',
      requirement: 'Transition plan with milestones, transition costs (one-time and run-rate uplift), and exit obligations.',
    },
    {
      id: 'M-REF-01',
      section: 'References',
      requirement: 'Three (3) reference customers in a comparable scope tier; willing to take a 30-min reference call.',
    },
  ];
  if (family.includes('cloud') || family.includes('infrastructure')) {
    base.push({
      id: 'M-CLOUD-01',
      section: 'Cloud',
      requirement: 'Migration approach (lift-and-shift vs replatform vs refactor) per application class with risk + cost trade-offs.',
    });
    base.push({
      id: 'M-CLOUD-02',
      section: 'Cloud',
      requirement: 'Egress cost estimate at steady state and during migration cutover windows.',
    });
  }
  if (family.includes('ams') || family.includes('managed')) {
    base.push({
      id: 'M-AMS-01',
      section: 'Service catalog',
      requirement: 'Detailed service catalog with response SLAs, restoration SLAs, and resolution SLAs per ticket priority.',
    });
  }
  return base;
}

function defaultOptionalItems(): ResponseChecklistItem[] {
  // Optional items are intentionally archetype-agnostic for now —
  // procurement-wide best practices that apply regardless of sourcing
  // family. Future slice can vary by archetype if a need emerges.
  return [
    {
      id: 'O-INNOV-01',
      section: 'Innovation',
      requirement: 'Roadmap of platform / tooling investments planned over the contract term that benefit this engagement.',
    },
    {
      id: 'O-AI-01',
      section: 'AI / automation',
      requirement: 'Use of AI / automation in delivery (ticket summarization, anomaly detection, knowledge search) with measurable productivity claims.',
    },
    {
      id: 'O-ESG-01',
      section: 'ESG',
      requirement: 'Sustainability commitments (carbon footprint of delivery, RE100 status, supplier diversity).',
    },
    {
      id: 'O-VALUE-01',
      section: 'Value engineering',
      requirement: 'Value-engineering ideas not asked for in the RFP that could materially improve TCO or service quality.',
    },
    {
      id: 'O-SHARED-01',
      section: 'Commercial',
      requirement: 'Optional alternative pricing model (consumption / outcome-based / shared-risk) with mechanics described in d19 Sheet 5.',
    },
  ];
}

function defaultFormatExpectations(): FormatExpectation[] {
  return [
    {
      topic: 'File formats',
      requirement: 'Narrative responses as searchable PDF (no scans). Pricing workbook as native xlsx. Sign-off as PDF.',
    },
    {
      topic: 'Filename convention',
      requirement: '{vendor}__{eventCode}__{artifact}.{ext}, e.g. acme__MERI-CLOUD-2026__pricing.xlsx',
    },
    {
      topic: 'Page limit',
      requirement: 'Executive summary ≤ 2 pages. Each major narrative section ≤ 8 pages. Total narrative ≤ 60 pages excluding appendices.',
    },
    {
      topic: 'Redactions',
      requirement: 'Trade-secret redactions allowed if accompanied by a redaction log. Procurement may request unredacted review under NDA.',
    },
    {
      topic: 'Embedded content',
      requirement: 'No embedded macros, no external links to vendor portals as substitute for response content.',
    },
    {
      topic: 'Submission channel',
      requirement: 'Upload via the AbarVa Source canvas (vendor invite link). Email and physical media are not accepted.',
    },
    {
      topic: 'Late submissions',
      requirement: 'Submissions received after the deadline will be evaluated only at procurement’s discretion and may be disqualified.',
    },
  ];
}

function defaultCertifications(): string[] {
  return [
    'The undersigned officer is authorized to bind the Vendor to the terms of this submission.',
    'All pricing in d19 is firm for 90 days from the submission deadline.',
    'The Vendor accepts the locked assumption set in d19 Sheet 2 (or has flagged exceptions in Sheet 5).',
    'No undisclosed conflicts of interest exist between the Vendor and the buyer’s evaluation panel.',
    'All sub-processors and offshore resources have been disclosed in the Security data-handling matrix.',
  ];
}
