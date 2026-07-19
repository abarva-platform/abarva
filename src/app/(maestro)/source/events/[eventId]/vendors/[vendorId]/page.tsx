import { redirect } from "next/navigation";

export const metadata = { title: "Source · Event · AbarVa" };
export const dynamic = "force-dynamic";

export default async function SourceEventVendorPage({
  params,
}: {
  params: Promise<{ eventId: string; vendorId: string }>;
}) {
  const { eventId, vendorId } = await params;
  redirect(
    `/source/events/${encodeURIComponent(eventId)}?stage=responses&vendorId=${encodeURIComponent(
      vendorId,
    )}`,
  );
}
