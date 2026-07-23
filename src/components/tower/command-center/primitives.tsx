"use client";

// Tower Command Center v2 — shared presentational primitives.
//
// Transcribed from the repeated markup gestures in
// docs/design/tower/command-center-2026-07-23/tower-command-center-design.html
// (`pips()`, `.chip`, `.card`, `.dot`, `miniMeter()`). Kept in one file so the
// six views render the same anatomy instead of drifting into six versions of it.

import type { ReactNode } from "react";

import type {
  TowerAiKind,
  TowerLaneKey,
  TowerUsageStatus,
} from "@/lib/tower/command-center/types";

import styles from "./TowerCommandCenter.module.css";

export type Tone = "teal" | "amber" | "red" | "gray" | "blue";

/** `cx(a, b && c)` — join truthy class names. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ── lane vocabulary ────────────────────────────────────────────────────────

export const LANE_WORD: Record<TowerLaneKey, string> = {
  fund: "Fund",
  fix: "Fix",
  freeze: "Freeze",
  stop: "Stop",
  watch: "Watch",
};

export const LANE_TONE: Record<TowerLaneKey, Tone> = {
  fund: "teal",
  fix: "amber",
  freeze: "red",
  stop: "red",
  watch: "gray",
};

/** CSS-module class for a lane, e.g. `laneFund`. */
export function laneClass(lane: TowerLaneKey): string {
  const key = `lane${lane.charAt(0).toUpperCase()}${lane.slice(1)}`;
  return styles[key] ?? "";
}

/** Chart-safe hex for a lane. Recharts cannot resolve CSS custom properties. */
export const LANE_HEX: Record<TowerLaneKey, string> = {
  fund: "#1d9e75",
  fix: "#ba7517",
  freeze: "#a32d2d",
  stop: "#a32d2d",
  watch: "#b4b2a9",
};

/** Chart-safe hex per AI spend type — matches the design's `col` maps. */
export const AI_KIND_HEX: Record<TowerAiKind, string> = {
  funded: "#0f6e56",
  embedded: "#0066CC",
  candidate: "#b4b2a9",
  governance: "#ba7517",
  platform: "#444441",
};

export const AI_KIND_WORD: Record<TowerAiKind, string> = {
  funded: "Funded",
  embedded: "Embedded",
  candidate: "Candidate",
  governance: "Governance",
  platform: "Platform",
};

export const AI_KIND_CHIP_TONE: Record<TowerAiKind, Tone> = {
  funded: "teal",
  embedded: "blue",
  candidate: "gray",
  governance: "amber",
  platform: "gray",
};

// ── atoms ──────────────────────────────────────────────────────────────────

export function Dot({
  tone,
  style,
}: {
  tone: Tone;
  style?: React.CSSProperties;
}) {
  return (
    <span className={cx(styles.dot, styles[tone])} style={style} aria-hidden />
  );
}

const CHIP_TONE_CLASS: Record<Tone, string> = {
  teal: "cTeal",
  amber: "cAmber",
  red: "cRed",
  gray: "cGray",
  blue: "cBlue",
};

export function Chip({
  tone,
  mono,
  children,
}: {
  tone: Tone;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        styles.chip,
        styles[CHIP_TONE_CLASS[tone]],
        mono && styles.cMono,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Proof pips — three bars, `level` of them filled.
 *
 * Transcribed from the design's `pips(level, tone)`: 3 fills teal, 1–2 amber,
 * 0 leaves all three neutral. Carries a text alternative because the fill count
 * is the entire meaning and colour alone would not convey it.
 */
export function Pips({ level }: { level: number }) {
  const clamped = Math.max(0, Math.min(3, Math.round(level)));
  const toneClass = clamped >= 3 ? "tl" : clamped >= 1 ? "am" : "rd";
  return (
    <span
      className={styles.pips}
      role="img"
      aria-label={`Proof level ${clamped} of 3`}
    >
      {[0, 1, 2].map((i) => (
        <i key={i} className={i < clamped ? styles[toneClass] : undefined} />
      ))}
    </span>
  );
}

export const USAGE_TONE: Record<TowerUsageStatus, Tone> = {
  strong: "teal",
  weak: "amber",
  none: "red",
};

/** The design's `miniMeter(v)` — a 52px bar plus the numeral. */
export function MiniMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    v >= 66
      ? "var(--canon-teal)"
      : v >= 40
        ? "var(--canon-amber)"
        : "var(--canon-red)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        justifyContent: "flex-end",
      }}
    >
      <span
        style={{
          width: 52,
          height: 5,
          borderRadius: 3,
          background: "var(--canon-gray-100)",
          overflow: "hidden",
          display: "inline-block",
        }}
        aria-hidden
      >
        <i
          style={{
            display: "block",
            height: "100%",
            width: `${v}%`,
            background: color,
            borderRadius: 3,
          }}
        />
      </span>
      <span
        style={{
          fontFamily: "var(--abarva-mono)",
          fontSize: 11.5,
          color: "var(--canon-gray-700)",
        }}
      >
        {v}
      </span>
    </span>
  );
}

/** A value the mart does not carry. Never a zero, never a guess. */
export function Unknown({ label = "Not recorded" }: { label?: string }) {
  return (
    <span
      className={styles.unknownValue}
      title="No governed value for this tenant"
    >
      {label}
    </span>
  );
}

// ── card shell ─────────────────────────────────────────────────────────────

export function Card({
  eyebrow,
  title,
  right,
  headId,
  bodyClassName,
  bodyStyle,
  style,
  children,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  headId?: string;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <section className={styles.card} style={style} aria-labelledby={headId}>
      {(eyebrow || title || right) && (
        <header className={styles.cardH} id={headId}>
          {eyebrow ? <span className={styles.chK}>{eyebrow}</span> : null}
          {title ? <span className={styles.chT}>{title}</span> : null}
          {right ? <span className={styles.chR}>{right}</span> : null}
        </header>
      )}
      <div className={cx(styles.cardB, bodyClassName)} style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}

/** The view header row: serif title, optional sub-nav, right-aligned hint. */
export function ViewHead({
  title,
  sub,
  children,
  hint,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className={styles.vhead}>
      <h2 className={styles.vh}>{title}</h2>
      {sub ? <span className={styles.vsub}>{sub}</span> : null}
      {children}
      <span className={styles.vspace} />
      {hint ? (
        <span className={styles.vhint}>
          <Dot tone="gray" /> {hint}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Segmented sub-navigation inside a tab. A real radiogroup, not bare buttons —
 * the mockup's `<button>`s carry no state to assistive tech.
 */
export function SubNav<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  onChange: (next: T) => void;
}) {
  return (
    <div className={styles.subnav} role="radiogroup" aria-label={label}>
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          className={cx(styles.subbtn, value === id && styles.on)}
          onClick={() => onChange(id)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
