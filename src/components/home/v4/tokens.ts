/**
 * Home v4 design tokens, transcribed from the approved Claude Design document
 * `Home v4 - Record and Reading.dc.html`. Values are copied, not re-derived: this file exists so
 * the translation has one place where a design value lives, rather than the same hex repeated
 * across a dozen components where it can drift one component at a time.
 */

export const V4 = {
  paper: "#faf7f1",
  cream: "#f5f1eb",
  surface: "#ffffff",
  ink: "#000000",
  inkSoft: "#2c2b28",
  navy: "#0c1a3a",
  navyHover: "#16305c",
  slate: "#5F5E5A",
  stone: "#888780",
  blue: "#0066CC",
  /** Reserved for open exposures. Never decorative -- it means "rated high severity on the
   * client's own risk register", and using it for emphasis would make that meaningless. */
  red: "#a32d2d",
  /** Reserved for absence: what the record does not establish. Same discipline as red. */
  amber: "#ba7517",
  green: "#1d9e75",
  rule: "rgba(136,135,128,0.28)",
  ruleSoft: "rgba(136,135,128,0.2)",
  ruleStrong: "rgba(136,135,128,0.45)",
} as const;

export const SERIF = "Fraunces,Georgia,serif";
export const SANS = "Inter,system-ui,sans-serif";
export const MONO = "'JetBrains Mono',ui-monospace,monospace";

/** The eyebrow/label treatment used throughout the design: mono, small, wide-tracked, uppercase. */
export const eyebrow = (color: string = V4.slate) =>
  ({
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color,
  }) as const;

/** Band headings share one scale; only the colour distinguishes their meaning. */
export const bandHeading = (color: string = V4.ink) =>
  ({
    fontFamily: SERIF,
    fontSize: "clamp(22px,1.9vw,28px)",
    fontWeight: 500,
    letterSpacing: "-0.024em",
    margin: 0,
    color,
  }) as const;

/** Horizontal page padding for full-bleed bands. The design uses 56px consistently. */
export const PAGE_X = 56;
