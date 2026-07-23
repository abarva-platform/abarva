// Retired legacy Tower URL.
//
// `/tower/legacy` used to expose the previous Tower surface while the Command
// Center was being reviewed. The previous page is now sunset from product
// runtime; keep this route only as a stale-link redirect.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RetiredTowerLegacyPage() {
  redirect("/tower");
}
