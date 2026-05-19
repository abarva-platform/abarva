// /product · public Product overview.
//
// The marketing nav's "Platform → Product" link lands here. This page
// is publicly accessible (see `PUBLIC_ROUTE_PATTERNS` in `src/proxy.ts`)
// because a logged-out visitor needs to see what AbarVa is — the four
// surfaces (Intelligence · Moves · Source · Tower), the Move lifecycle,
// the substrate, the differentiators — before signing in.
//
// Renders the shared `<ProductMarketingPage>` with its built-in
// `DEFAULT_SPOTLIGHT` ("your active client" / "your client") so the
// page reads naturally for an unauth visitor. Signed-in users see the
// same marketing surface here; tenant-personalized cockpit pages live
// inside the (maestro) shell.

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { ProductMarketingPage } from '@/components/product/ProductMarketingPage';

export const metadata = {
  title: 'Product · AbarVa',
  description:
    'AbarVa — Intelligence, Moves, Source, Tower. Four surfaces that turn AI investment from a wish list into a costed, evidence-backed plan.',
};

export const dynamic = 'force-static';

export default function ProductRoutePage() {
  return (
    <>
      <MarketingNav ctaHref="/sign-in" ctaLabel="Request demo" />
      <ProductMarketingPage />
    </>
  );
}
