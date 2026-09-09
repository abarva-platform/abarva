import SourceEventDetailPage from "../page";

export const dynamic = "force-dynamic";

export default async function SourceEventSummaryPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return SourceEventDetailPage({
    params,
    searchParams: Promise.resolve({
      stage: "value",
      workspace: "approvals",
    }),
  });
}
