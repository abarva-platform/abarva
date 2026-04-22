'use client';

export function PersonaLensChip({
  persona,
  active,
  onClick,
}: {
  persona: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`intel-chip mono ${active ? 'blue' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {persona}
    </button>
  );
}
