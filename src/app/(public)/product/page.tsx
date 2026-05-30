// /product · public Product overview.
//
// The public nav's "Platform → Product" link lands here. This page
// is publicly accessible (see `PUBLIC_ROUTE_PATTERNS` in `src/proxy.ts`)
// because a logged-out visitor needs to see what AbarVa is — the four
// surfaces (Intelligence · Moves · Source · Tower), the Move lifecycle,
// the substrate, the differentiators — before signing in.
//
// Renders the shared public layout plus `<ProductMarketingPage>`.
// Logged-out visitors get the default spotlight; signed-in users get the
// active-client spotlight without needing a duplicate authenticated route.

import { currentUser } from "@clerk/nextjs/server";
import { ProductMarketingPage } from "@/components/product/ProductMarketingPage";
import { getActiveClientKey, getActiveClientRow } from "@/lib/active-client";
import {
  canonicalClientDisplayName,
  getClientOption,
} from "@/lib/client-config";

export const metadata = {
  title: "Product · AbarVa",
  description:
    "AbarVa — Intelligence, Moves, Source, Tower. Four surfaces that turn AI investment from a wish list into a costed, evidence-backed plan.",
};

export const dynamic = "force-dynamic";

export default async function ProductRoutePage() {
  const user = await currentUser().catch(() => null);
  if (!user) {
    return <ProductMarketingPage />;
  }

  const activeClientKey = await getActiveClientKey().catch(() => null);
  const activeClient = activeClientKey
    ? await getActiveClientRow(activeClientKey).catch(() => null)
    : null;
  const fallbackClient = activeClientKey
    ? getClientOption(activeClientKey)
    : null;
  const clientName =
    canonicalClientDisplayName({
      key: activeClient?.key ?? activeClientKey,
      name: activeClient?.name ?? fallbackClient?.name,
    }) ?? "AbarVa Client";
  const clientShortName = fallbackClient?.shortName ?? clientName;

  return (
    <ProductMarketingPage
      spotlight={{
        clientName,
        clientShortName,
      }}
    />
  );
}
