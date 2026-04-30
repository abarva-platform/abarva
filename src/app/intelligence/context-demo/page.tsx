/**
 * /intelligence/context-demo · CB-4 + CB-5 wired together.
 *
 * Public demo page. Type a question, pick a tenant, see four
 * `ContextAssembledPanel`s side-by-side — one per
 * BrokerMode. Calls `POST /api/context/demo` with `mode='all'`.
 *
 * Per CONTEXT_BROKER_DESIGN.md §1 (premise): the panel is the
 * receipt; the four-mode comparison monetizes the panel.
 */

import { FourModeDemoSurface } from '@/components/context-broker/FourModeDemoSurface';

export const metadata = {
  title: 'Context broker · four-mode comparison · AbarVa',
};

export const dynamic = 'force-dynamic';

export default function ContextDemoPage() {
  return <FourModeDemoSurface />;
}
