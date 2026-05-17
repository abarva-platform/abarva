// Slice 1.4 — Source event fixture for proposal normalization tests.
//
// Tenant-grounded example: Apex Retail AMS Vendor Consolidation 2026 — three
// vendors at BAFO with deliberately incomparable proposals so the normalization
// model has divergence, exposure, and undisclosed gaps to surface.

import type { ProposalNormalizationInput } from './proposal-normalization-types';

export const APEX_AMS_PROPOSAL_FIXTURE: ProposalNormalizationInput = {
  eventId: 'SRC-APX-AMS-2026',
  eventName: 'Apex Retail — AMS Vendor Consolidation 2026',
  stage: 'BAFO',
  generatedAt: '2026-05-16T00:00:00.000Z',
  proposals: [
    {
      vendorId: 'vendor-northpeak',
      vendorName: 'NorthPeak Services',
      dimensions: [
        {
          key: 'scope_exceptions',
          statement: 'No exceptions — full application portfolio in scope.',
        },
        {
          key: 'assumptions',
          statement: 'Ticket volume assumed at 4,200/month based on 2025 baseline.',
        },
        {
          key: 'rates',
          statement: 'Fixed rate for the full term, no escalation.',
        },
        {
          key: 'accelerators',
          statement: 'AIOps triage accelerator guaranteed at go-live.',
        },
        {
          key: 'ip_terms',
          statement: 'Customer owns all generated outputs; vendor retains no reuse rights.',
        },
        {
          key: 'security_posture',
          statement: 'SOC 2 Type II and ISO 27001 certified; data resident in US.',
        },
        {
          key: 'transition_approach',
          statement: '90-day transition with 30-day dual-run included.',
        },
        {
          key: 'sla_xla',
          statement: 'P1 restore guaranteed 4h with service credits as remedy.',
        },
      ],
    },
    {
      vendorId: 'vendor-bluemaster',
      vendorName: 'BlueMaster Global',
      dimensions: [
        {
          key: 'scope_exceptions',
          statement: 'Legacy mainframe apps excluded — out of scope.',
          exposureUsd: 180000,
          caveats: ['Excludes 6 legacy apps', 'Re-pricing on inclusion'],
        },
        {
          key: 'assumptions',
          statement: 'Ticket volume subject to change after discovery phase.',
          caveats: ['Volume re-baselined at month 3', 'Change order if +15%'],
        },
        {
          key: 'rates',
          statement: 'Rate card with 4% annual escalation.',
          exposureUsd: 95000,
        },
        {
          key: 'accelerators',
          statement: 'Automation roadmap described but delivery is best effort.',
        },
        {
          key: 'ip_terms',
          statement: 'Vendor may use anonymized data to improve its models.',
          exposureUsd: 0,
          caveats: ['Opt-out available on request'],
        },
        {
          key: 'security_posture',
          statement: 'SOC 2 pending certification; data residency to be determined.',
          caveats: ['Certification expected Q4'],
        },
        {
          key: 'transition_approach',
          statement: '120-day transition; dual-run billed as time and materials.',
          exposureUsd: 140000,
        },
        // sla_xla intentionally omitted — undisclosed gap.
      ],
    },
    {
      vendorId: 'vendor-summit',
      vendorName: 'Summit Managed Ops',
      dimensions: [
        {
          key: 'scope_exceptions',
          statement: 'No exclusion — entire estate covered.',
        },
        {
          key: 'assumptions',
          statement: 'Ticket volume assumed at 4,000/month.',
        },
        {
          key: 'rates',
          statement: 'Blended rate with 2% escalation after year one.',
          exposureUsd: 40000,
        },
        {
          key: 'accelerators',
          statement: 'Self-heal accelerator guaranteed with measurable targets.',
        },
        {
          key: 'ip_terms',
          statement: 'Customer owns outputs; vendor fully indemnifies IP claims.',
        },
        {
          key: 'security_posture',
          statement: 'SOC 2 Type II certified; data resident in US and EU.',
        },
        {
          key: 'transition_approach',
          statement: '75-day transition with dual-run included at no additional cost.',
        },
        {
          key: 'sla_xla',
          statement: 'P1 restore 4h; XLA experience score tracked with credits.',
        },
      ],
    },
  ],
};
