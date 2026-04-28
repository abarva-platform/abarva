'use client';

/**
 * CompareWithDropdown — small ghost affordance on instance detail pages
 * that deep-links to the two-instance comparison view.
 *
 * Renders a styled `<select>` whose options are the known catalogue ids
 * (source events + programs) minus the current instance, grouped by kind.
 * Selecting an option navigates to `/source/compare?a={current}&b={selected}`.
 *
 * AbarVa palette only — matches the `ExplainQuotePill` ghost-button style.
 */

import { useRouter } from 'next/navigation';
import { useId, useMemo } from 'react';

import { prepareCompareOptions } from '@/lib/reasoning/compare-options-helpers';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface CompareWithDropdownProps {
  /** Instance id of the page hosting the dropdown — pre-fills the `?a=` slot. */
  currentInstanceId: string;
  /** Full catalogue, typically `getAllInstanceIds()` from instance-resolver. */
  allOtherIds: { sourceEvents: string[]; programs: string[] };
}

export function CompareWithDropdown({
  currentInstanceId,
  allOtherIds,
}: CompareWithDropdownProps) {
  const router = useRouter();
  const labelId = useId();

  const { groups, totalCount } = useMemo(
    () => prepareCompareOptions(currentInstanceId, allOtherIds),
    [currentInstanceId, allOtherIds],
  );

  if (totalCount === 0) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const target = event.target.value;
    if (!target) return;
    const a = encodeURIComponent(currentInstanceId);
    const b = encodeURIComponent(target);
    router.push(`/source/compare?a=${a}&b=${b}`);
  };

  return (
    <span
      data-testid="compare-with-dropdown"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginLeft: 6,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: SHELL.INK_MUTED,
        background: 'transparent',
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        verticalAlign: 'baseline',
      }}
    >
      <label htmlFor={labelId} style={{ cursor: 'pointer' }}>
        Compare with
      </label>
      <select
        id={labelId}
        defaultValue=""
        onChange={handleChange}
        title="Compare this instance with another — opens the side-by-side reasoning view"
        style={{
          background: 'transparent',
          border: 'none',
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: SHELL.INK_MUTED,
          cursor: 'pointer',
          padding: '0 2px',
          outline: 'none',
        }}
      >
        <option value="" disabled>
          select…
        </option>
        {groups.map((group) => (
          <optgroup key={group.kind} label={group.label}>
            {group.options.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </span>
  );
}
