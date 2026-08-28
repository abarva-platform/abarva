import { redirect } from "next/navigation";

export const metadata = { title: "Source · AbarVa" };
export const dynamic = "force-dynamic";

type SourcePortfolioSearchParams = {
  client?: string;
  sourceProvider?: string;
  contractId?: string;
  contractTab?: string;
};

const FORWARDED_PARAMS: Array<keyof SourcePortfolioSearchParams> = [
  "client",
  "sourceProvider",
  "contractId",
  "contractTab",
];

function sourceWorkspaceRedirectUrl(params: SourcePortfolioSearchParams): string {
  const query = new URLSearchParams();

  for (const key of FORWARDED_PARAMS) {
    const value = params[key];
    if (typeof value === "string" && value.trim().length > 0) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return `/source/preview/workspace${queryString ? `?${queryString}` : ""}`;
}

/**
 * Compatibility route for the retired Source portfolio book.
 *
 * Source now has one contract/vendor count surface: the governed workspace.
 * Keeping this redirect preserves old links without rendering a second Source
 * home backed by a different read model.
 */
export default async function SourcePortfolioRoute({
  searchParams,
}: {
  searchParams: Promise<SourcePortfolioSearchParams>;
}) {
  redirect(sourceWorkspaceRedirectUrl(await searchParams));
}
