import { notFound } from 'next/navigation';
import { buildAiVendorView, getAllVendorIds } from '@/lib/tower/ai-vendor-fixture';
import { AiVendorDetailPage } from '@/components/tower/AiVendorDetailPage';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ vendorId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorId } = await params;
  const vendor = buildAiVendorView(vendorId);
  return { title: vendor ? `${vendor.vendorName} · AI Control Tower` : 'Vendor · Tower' };
}

export function generateStaticParams() {
  return getAllVendorIds().map((vendorId) => ({ vendorId }));
}

export default async function Page({ params }: Props) {
  const { vendorId } = await params;
  const vendor = buildAiVendorView(vendorId);
  if (!vendor) notFound();
  return <AiVendorDetailPage vendorId={vendorId} />;
}
