export interface CanonicalWorkspaceUrlInput {
  readonly currentHref: string;
  readonly selectedKind: string;
  readonly selectedId: string | null;
  readonly contractTab: string | null | undefined;
  readonly currentPage: string;
  readonly sourceClientKey?: string | null;
  readonly sourceProviderKey?: string | null;
}

/**
 * Build the only URL shape the Source workspace should expose.
 *
 * Workspace interactions stay client-side so a tab cannot mount a second
 * visual shell. The URL is still updated so reloads and shared links rebuild
 * the same page, contract, and tab.
 */
export function buildCanonicalWorkspaceUrl(
  input: CanonicalWorkspaceUrlInput,
): string {
  const url = new URL(input.currentHref, "https://app.abarva.ai");
  url.pathname = "/source";

  url.searchParams.delete("contractId");
  url.searchParams.delete("contractTab");
  url.searchParams.delete("tab");
  url.searchParams.delete("workspaceTab");

  if (input.selectedKind === "contract" && input.selectedId?.trim()) {
    url.searchParams.set("contractId", input.selectedId.trim());
    url.searchParams.set("contractTab", input.contractTab?.trim() || "Story");
  } else {
    url.searchParams.set("workspaceTab", input.currentPage.trim().toLowerCase());
  }

  if (input.sourceClientKey?.trim()) {
    url.searchParams.set("client", input.sourceClientKey.trim());
  }
  if (input.sourceProviderKey?.trim()) {
    url.searchParams.set("sourceProvider", input.sourceProviderKey.trim());
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
