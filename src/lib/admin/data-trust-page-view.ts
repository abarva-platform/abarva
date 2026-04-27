import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';

export interface TrustLadderRung {
  id: string;
  label: string;
  count: number;
  description: string;
}

export interface DataTrustPageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: ContextLiveStatus;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: EvidenceStrength;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  ladder: ReadonlyArray<TrustLadderRung>;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
}

const TRUST_LADDER: ReadonlyArray<TrustLadderRung> = [
  { id: 'loaded', label: 'Loaded', count: 14, description: 'Documents/datasets present in the workspace' },
  { id: 'available', label: 'Available', count: 11, description: 'Parsed, indexed, browseable' },
  { id: 'usable', label: 'Usable evidence', count: 7, description: 'Cited in Steward editorial cards' },
  { id: 'agent_usable', label: 'Agent-usable', count: 4, description: 'Approved for agent context' },
  { id: 'decision_grade', label: 'Decision-grade', count: 2, description: 'Approved for decisions/gates' },
];

export function buildDataTrustPageView(): DataTrustPageView {
  return {
    eyebrow: 'Data trust posture',
    title: 'Data Trust',
    subtitle:
      'How loaded data becomes usable evidence — and what is not yet usable. Counts trace to the deterministic evidence manifest.',
    context: {
      tenant: 'Apex Retail',
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: 'Steward editorial · Trust ladder',
      body:
        'Loaded artifacts are present from seed. Usable evidence is partial. Decision-grade evidence requires approved datasets and source-of-truth confirmations not yet in place.',
      contextUsed: ['evidence manifest', 'dataset approval model', 'no-raw-copy enforcement'],
      evidenceStrength: 'partial',
      blocker: 'Decision-grade approvals pending',
      primaryAction: { label: 'Review datasets', href: '/admin/data-trust#datasets' },
    },
    ladder: TRUST_LADDER,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open evidence ledger',
    primaryActionHref: '/admin/data-trust#evidence',
    deterministicSeed: true,
  };
}
