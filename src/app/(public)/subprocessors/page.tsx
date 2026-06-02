import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { AiTrustPage, TrustCardGrid, TrustLinkStrip } from '@/components/public-site/AiTrustPage';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import {
  SUBPROCESSOR_COMMITMENTS,
  SUBPROCESSOR_LAST_UPDATED,
  SUBPROCESSOR_RECORDS,
  type SubprocessorUseStatus,
} from '@/lib/public-site/subprocessors-content';

export const metadata: Metadata = buildPageMetadata({
  title: 'Subprocessors',
  description:
    'AbarVa subprocessor and service-provider inventory for pilots, security review, and customer contracting.',
  openGraph: { url: CANONICAL_URLS.subprocessors },
});

const statusLabels: Record<SubprocessorUseStatus, string> = {
  active: 'Active',
  optional: 'Optional',
  legacy: 'Legacy compatibility',
};

const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
  background: '#fff',
};

const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 860,
  borderCollapse: 'collapse',
};

const headerCellStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
  color: 'var(--pub-ink, #000)',
  fontFamily: 'var(--pub-font-mono, monospace)',
  fontSize: 12,
  letterSpacing: 0,
  textAlign: 'left',
  textTransform: 'uppercase',
  verticalAlign: 'bottom',
};

const bodyCellStyle: CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
  color: 'var(--pub-slate, #5F5E5A)',
  fontFamily: 'var(--pub-font-sans, sans-serif)',
  fontSize: 14,
  lineHeight: 1.55,
  verticalAlign: 'top',
};

const providerCellStyle: CSSProperties = {
  ...bodyCellStyle,
  color: 'var(--pub-ink, #000)',
  fontWeight: 700,
};

const noteStyle: CSSProperties = {
  marginTop: 18,
  marginBottom: 32,
  color: 'var(--pub-slate, #5F5E5A)',
  fontFamily: 'var(--pub-font-sans, sans-serif)',
  fontSize: 15,
  lineHeight: 1.65,
};

function SubprocessorTable() {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th scope="col" style={headerCellStyle}>
              Provider
            </th>
            <th scope="col" style={headerCellStyle}>
              Role
            </th>
            <th scope="col" style={headerCellStyle}>
              Data categories
            </th>
            <th scope="col" style={headerCellStyle}>
              Status
            </th>
            <th scope="col" style={headerCellStyle}>
              Safeguards
            </th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSOR_RECORDS.map((record) => (
            <tr key={record.name}>
              <th scope="row" style={providerCellStyle}>
                {record.name}
              </th>
              <td style={bodyCellStyle}>{record.role}</td>
              <td style={bodyCellStyle}>{record.dataCategories}</td>
              <td style={bodyCellStyle}>{statusLabels[record.useStatus]}</td>
              <td style={bodyCellStyle}>{record.safeguards}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SubprocessorsPage() {
  return (
    <AiTrustPage
      eyebrow="Trust and legal"
      title="Subprocessors and service providers"
      intro="This inventory identifies third-party providers AbarVa may use to provide, secure, operate, bill, support, or measure the product. Customer agreements control the final committed provider set for a given engagement."
      updated={SUBPROCESSOR_LAST_UPDATED}
    >
      <SubprocessorTable />
      <p style={noteStyle}>
        Use status distinguishes default infrastructure from optional product paths and
        compatibility-era providers. Optional and legacy entries should be read with the
        customer contract, security exhibit, or private data-plane addendum for the
        applicable engagement.
      </p>
      <TrustCardGrid items={SUBPROCESSOR_COMMITMENTS} />
      <TrustLinkStrip />
    </AiTrustPage>
  );
}
