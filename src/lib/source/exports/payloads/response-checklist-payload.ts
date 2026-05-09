// Source · d11 Response Checklist payload binder
//
// Pulls runtime context from the substrate + the upstream artifact
// bodies (d09 RFP package when authored), and produces a typed payload
// the renderer consumes.
//
// Strategy:
//   1. Mandatory + optional items — best-effort parse of the d09 body
//      looking for "Mandatory items" / "Required items" sections and
//      "Optional items" / "Recommended items" sections. Each bullet
//      becomes one checklist item; the section heading becomes the
//      "Section" column. Missing-or-sparse d09 falls through to a
//      baseline checklist keyed off the archetype.
//   2. Format expectations — defaults are sensible procurement-wide
//      conventions; tenant-level config can override later.
//   3. Certifications — defaults cover the standard "we have authority
//      to bind / we accept the locked assumption set" sign-off block.
//
// This binder is intentionally lenient: when d09 isn't authored, the
// download still produces a useful starter checklist.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  FormatExpectation,
  ResponseChecklistItem,
  ResponseChecklistPayload,
} from '../renderers/response-checklist';

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

function parseChecklistFromRfp(md: string): ParsedChecklist {
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
