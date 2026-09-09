import SourceEventDetailPage from "../page";

export const dynamic = "force-dynamic";

export default async function SourceEventSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requested = (await searchParams) ?? {};
  return SourceEventDetailPage({
    params,
    searchParams: Promise.resolve({
      ...requested,
      stage: typeof requested.stage === "string" ? requested.stage : "value",
      workspace:
        typeof requested.workspace === "string"
          ? requested.workspace
          : "approvals",
    }),
  });
}
