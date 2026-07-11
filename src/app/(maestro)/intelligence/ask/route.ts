import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/intelligence";
  return NextResponse.redirect(destination);
}
