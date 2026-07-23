// Tower — archived legacy surface.
//
// The Tower page as it stood before the Command Center became primary on
// 2026-07-23. Always served here, regardless of `tower_command_center_v2`, so
// the previous surface stays reachable for side-by-side comparison and as a
// verifiable rollback target.
//
// This is the ONLY place today that still mounts `AtlasChatPanel` for Tower —
// the approved Command Center design has no chat slot. Do not remove this route
// until that is resolved.

import { TowerLegacySurface } from "@/components/tower/TowerLegacySurface";

export const metadata = { title: "Tower (previous) · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TowerLegacyPage({
  searchParams,
}: PageProps = {}) {
  return <TowerLegacySurface searchParams={searchParams} />;
}
