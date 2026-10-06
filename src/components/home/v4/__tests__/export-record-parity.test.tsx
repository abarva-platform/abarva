/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { HomeV4App } from "../HomeV4App";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

it("keeps the full export on the page's provider and record version", () => {
  const bundle = getHomeReviewBundle("meridian-health");
  if (!bundle) throw new Error("Home fixture missing");

  render(
    <HomeV4App
      bundle={bundle}
      tenantKey="meridian-health"
      requestedProvider="legacy"
      recordToken="opened-record-token"
    />,
  );

  expect(
    screen.getByRole("link", { name: "Export full Home walkthrough as PDF" }),
  ).toHaveAttribute(
    "href",
    "/api/home/walkthrough-export?tenant=meridian-health&provider=legacy&context=opened-record-token&format=pdf",
  );
});
