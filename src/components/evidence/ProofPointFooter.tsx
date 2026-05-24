import Link from 'next/link';
import type { EvidenceProofPointCount, EvidenceSurface } from '@/lib/evidence/ledger';

export interface ProofPointFooterProps {
  surface: EvidenceSurface;
  artifactRef: string;
  counts: EvidenceProofPointCount;
}

export function ProofPointFooter({ surface, artifactRef, counts }: ProofPointFooterProps) {
  const href = `/evidence-ledger?surface=${encodeURIComponent(surface)}&artifact_ref=${encodeURIComponent(artifactRef)}`;
  const details = [
    `${counts.tenantRecords} from tenant records`,
    `${counts.corpusPatterns} from corpus`,
    `${counts.documentExtracts} from documents`,
    `${counts.notEnoughData} marked not enough data`,
  ].filter((part) => !part.startsWith('0 '));

  return (
    <footer
      data-proof-point-footer="true"
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid #e4e7ec',
        fontSize: 12,
        color: '#475467',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <Link
        href={href}
        style={{
          color: counts.total > 0 ? '#175cd3' : '#667085',
          fontWeight: 800,
          textDecoration: 'none',
        }}
      >
        {counts.total} proof {counts.total === 1 ? 'point' : 'points'}
      </Link>
      {details.length > 0 && <span>{details.join(' · ')}</span>}
      {counts.total === 0 && <span>No ledger-backed evidence yet.</span>}
    </footer>
  );
}
