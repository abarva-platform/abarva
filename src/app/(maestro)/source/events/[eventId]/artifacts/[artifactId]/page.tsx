import { redirect } from "next/navigation";

export const metadata = { title: "Source · Workspace · AbarVa" };
export const dynamic = "force-dynamic";

export default async function SourceEventArtifactPage({
  params,
}: {
  params: Promise<{ eventId: string; artifactId: string }>;
}) {
  const { eventId, artifactId } = await params;
  redirect(
    `/source/events/${encodeURIComponent(eventId)}/workspace?artifactId=${encodeURIComponent(
      artifactId,
    )}`,
  );
}
