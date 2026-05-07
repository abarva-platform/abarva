/**
 * PageHead · Setup canon page-head primitive.
 *
 * Eyebrow (mono, signal-blue, uppercase) + Fraunces 500 H1 + Inter
 * lede. Per `Setup Admin · Module.html` design handoff.
 */

import { SETUP, SETUP_TYPE } from '@/lib/admin/setup-tokens';

export interface PageHeadProps {
  eyebrow: string;
  title: string;
  lede?: string;
}

export function PageHead({ eyebrow, title, lede }: PageHeadProps) {
  return (
    <header
      data-setup-page-head
      style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4 }}
    >
      <p style={{ ...SETUP_TYPE.pageEyebrow, margin: '0 0 10px' }}>{eyebrow}</p>
      <h1 style={SETUP_TYPE.pageH1}>{title}</h1>
      {lede ? <p style={{ ...SETUP_TYPE.pageLede, marginTop: 6, color: SETUP.inkSoft }}>{lede}</p> : null}
    </header>
  );
}
