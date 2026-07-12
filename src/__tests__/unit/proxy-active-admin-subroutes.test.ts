import { NextRequest } from "next/server";

import {
  AUTH_REQUIRED_ROUTE_PATTERNS,
  PUBLIC_ROUTE_PATTERNS,
  isActiveAdminSubroute,
} from "@/proxy";
import { createRouteMatcher } from "@clerk/nextjs/server";

describe("proxy active admin subroutes", () => {
  const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);
  const isAuthRequiredRoute = createRouteMatcher([
    ...AUTH_REQUIRED_ROUTE_PATTERNS,
  ]);

  it("allows explicit candidate preview to render as an active admin subroute", () => {
    const request = new NextRequest(
      "https://app.abarva.ai/admin/candidate-preview",
    );

    expect(isAuthRequiredRoute(request)).toBe(true);
    expect(isPublicRoute(request)).toBe(false);
    expect(isActiveAdminSubroute(request.nextUrl.pathname)).toBe(true);
    expect(isActiveAdminSubroute("/admin/data-loads")).toBe(false);
  });
});
