import type { CSSProperties } from "react";

import {
  canonicalClientDisplayName,
  demoSafeClientText,
} from "@/lib/client-config";
import { MONO, PAGE_X, SANS, SERIF, V4 } from "./tokens";

/**
 * What Home shows when this client's governed record is not currently being served.
 *
 * It replaces an application error. The reader throws when the governed read returns no rows, and
 * that exception reached the browser on the opening client surface.
 *
 * The page states the situation and nothing else. It does not fall back to a stored copy of the
 * record: a stale figure presented as the current one is worse than no figure, and the reader has
 * no way to tell the two apart.
 */
export function HomeRecordNotServed({ tenantKey }: { tenantKey: string }) {
  const client = demoSafeClientText(
    canonicalClientDisplayName({ key: tenantKey }) ?? "this client",
  );
  return (
    <main style={shell}>
      <span style={eyebrow}>Home</span>
      <h1 style={headline}>
        {client}&rsquo;s governed record is not being served right now.
      </h1>
      <p style={body}>
        Home reads this client&rsquo;s record at the moment you open it, and
        that read returned nothing. Every figure on these pages is a filter over
        those rows, so there is nothing here to show you rather than something
        approximate.
      </p>
      <p style={body}>
        Nothing has been lost from your side and nothing here is stale &mdash;
        the surface is reporting the read, not remembering an older one. The
        other surfaces are unaffected.
      </p>
    </main>
  );
}

const shell: CSSProperties = {
  padding: `72px ${PAGE_X}px 90px`,
  maxWidth: 780,
  fontFamily: SANS,
  color: V4.ink,
};

const eyebrow: CSSProperties = {
  display: "block",
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: V4.slate,
};

const headline: CSSProperties = {
  margin: "14px 0 0",
  fontFamily: SERIF,
  fontSize: 34,
  fontWeight: 500,
  lineHeight: 1.18,
  textWrap: "balance",
};

const body: CSSProperties = {
  margin: "18px 0 0",
  fontSize: 15.5,
  lineHeight: 1.6,
  color: V4.inkSoft,
  maxWidth: "68ch",
};
