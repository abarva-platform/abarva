import { redirect } from "next/navigation";

export const metadata = { title: "Source · Event · AbarVa" };
export const dynamic = "force-dynamic";

export default async function SourceEventReportPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/source/events/${encodeURIComponent(eventId)}`);
}
