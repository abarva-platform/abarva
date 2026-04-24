'use client';

// SkeletonScreen · File 10 §10.1 P0
//
// Replaces generic spinners across surfaces. Matched-to-component heights
// so the perceived layout doesn't jump on load. Three shapes cover most
// cases: line (text row), card (surface block), grid (deliverable grid).
//
// Usage:
//   <SkeletonLine width="60%" />
//   <SkeletonCard lines={4} />
//   <SkeletonGrid rows={3} cols={2} />
//
// Animation is a subtle shimmer; disabled via prefers-reduced-motion
// per the repo's accessibility baseline.

interface SkeletonLineProps {
  /** Width as CSS string (e.g. "60%", "220px"). */
  width?: string;
  /** Height in px. Defaults to 14 — a single line of body text. */
  height?: number;
  /** Extra margin-top. */
  marginTop?: number;
}

export function SkeletonLine({ width = '100%', height = 14, marginTop = 0 }: SkeletonLineProps) {
  return (
    <>
      <style>{skeletonCss}</style>
      <div
        className="skeleton-line"
        style={{
          width,
          height,
          marginTop,
          borderRadius: height / 2,
        }}
        aria-hidden="true"
      />
    </>
  );
}

interface SkeletonCardProps {
  /** Number of text lines to simulate inside the card. */
  lines?: number;
  /** Optional explicit height; otherwise derived from line count. */
  height?: number;
}

export function SkeletonCard({ lines = 3, height }: SkeletonCardProps) {
  return (
    <>
      <style>{skeletonCss}</style>
      <div
        className="skeleton-card"
        style={{
          padding: 18,
          borderRadius: 14,
          background: '#FFFFFF',
          border: '1px solid rgba(26,22,18,0.08)',
          height,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        role="status"
        aria-label="Loading"
      >
        <SkeletonLine width="40%" height={12} />
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonLine key={i} width={`${90 - i * 10}%`} marginTop={4} />
        ))}
      </div>
    </>
  );
}

interface SkeletonGridProps {
  rows: number;
  cols: number;
  /** Card lines per cell. */
  cellLines?: number;
  /** Gap in px. */
  gap?: number;
}

export function SkeletonGrid({ rows, cols, cellLines = 3, gap = 14 }: SkeletonGridProps) {
  const total = rows * cols;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
      }}
      role="status"
      aria-label="Loading grid"
    >
      {Array.from({ length: total }, (_, i) => (
        <SkeletonCard key={i} lines={cellLines} />
      ))}
    </div>
  );
}

const skeletonCss = `
  .skeleton-line {
    background: linear-gradient(
      90deg,
      rgba(26,22,18,0.06) 0%,
      rgba(26,22,18,0.12) 50%,
      rgba(26,22,18,0.06) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s linear infinite;
  }
  @keyframes skeleton-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton-line { animation: none; background: rgba(26,22,18,0.1); }
  }
`;
