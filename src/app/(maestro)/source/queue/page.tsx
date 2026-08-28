import { redirect } from "next/navigation";

export const metadata = { title: "Source · AbarVa" };
export const dynamic = "force-dynamic";

/**
 * Compatibility route for the retired Decision Queue home.
 *
 * Source now has one entry surface: the governed workspace. Keeping this redirect
 * preserves old links without rendering a second, competing Source home.
 */
export default function SourceDecisionQueuePage() {
  redirect("/source/preview/workspace");
}
