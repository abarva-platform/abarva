// Phase 0 Origination — /programs/new
// Server wrapper. No async data needed; ProgramOriginationPage manages its own form state.

import { ProgramOriginationPage } from '@/components/programs/ProgramOriginationPage';

export const metadata = {
  title: 'New Program · Apex Retail Group',
};

export default function ProgramsNewPage() {
  return <ProgramOriginationPage tenantSlug="apex-retail" />;
}
