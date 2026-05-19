'use client';

// Expert Review Console — the reviewer's verdict form.
//
// A client component so the assumption-key checkboxes can be toggled before
// submit; the submit itself is a Server Action (`recordExpertReviewAction`).
// Locked design system: cream surface, serif headings, DM Sans body, black
// (ink) primary button + ghost reset.

import { useState } from 'react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/lib/design/design-tokens';
import {
  EXPERT_REVIEWER_ROLES,
  EXPERT_REVIEW_VERDICTS,
} from '@/lib/programs/expert-kernel';

export interface ExpertReviewFormAssumption {
  key: string;
  statement: string;
}

const LABEL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: COLORS.ink,
  display: 'block',
  marginBottom: SPACING.xs,
};

const FIELD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  width: '100%',
  padding: `${SPACING.sm} ${SPACING.md}`,
  border: `1px solid ${COLORS.ink}33`,
  borderRadius: RADIUS.sm,
  background: COLORS.white,
  boxSizing: 'border-box',
};

export function ExpertReviewForm({
  assumptions,
  action,
}: {
  assumptions: ExpertReviewFormAssumption[];
  action: (formData: FormData) => void;
}) {
  const [touchedKeys, setTouchedKeys] = useState<Set<string>>(new Set());

  function toggleKey(key: string) {
    setTouchedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <form
      action={action}
      style={{
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}22`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label htmlFor="reviewerId" style={LABEL}>
            Reviewer
          </label>
          <input
            id="reviewerId"
            name="reviewerId"
            required
            placeholder="name or identity"
            style={FIELD}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label htmlFor="role" style={LABEL}>
            Expert lens
          </label>
          <select id="role" name="role" required style={FIELD} defaultValue="cfo">
            {EXPERT_REVIEWER_ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="verdict" style={LABEL}>
          Verdict
        </label>
        <select
          id="verdict"
          name="verdict"
          required
          style={FIELD}
          defaultValue="credible_with_conditions"
        >
          {EXPERT_REVIEW_VERDICTS.map((v) => (
            <option key={v.verdict} value={v.verdict}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="note" style={LABEL}>
          Rationale (required)
        </label>
        <textarea
          id="note"
          name="note"
          required
          rows={3}
          placeholder="What you challenged or blessed, and why."
          style={{ ...FIELD, resize: 'vertical', fontFamily: TYPOGRAPHY.sans }}
        />
      </div>

      <div>
        <span style={LABEL}>Assumptions this review touches</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
          {assumptions.map((a) => (
            <label
              key={a.key}
              style={{
                display: 'flex',
                gap: SPACING.sm,
                alignItems: 'flex-start',
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: COLORS.ink,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={touchedKeys.has(a.key)}
                onChange={() => toggleKey(a.key)}
                style={{ marginTop: 2 }}
              />
              <span>
                <code
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: COLORS.navy,
                  }}
                >
                  {a.key}
                </code>
                {' — '}
                {a.statement}
              </span>
            </label>
          ))}
        </div>
        {/* The checked keys are submitted as one hidden CSV field. */}
        <input
          type="hidden"
          name="assumptionKeys"
          value={[...touchedKeys].join(',')}
        />
      </div>

      <div>
        <label htmlFor="requiredActions" style={LABEL}>
          Required actions before promotion (one per line)
        </label>
        <textarea
          id="requiredActions"
          name="requiredActions"
          rows={2}
          placeholder="e.g. Capture the cost-per-contact baseline"
          style={{ ...FIELD, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: SPACING.sm }}>
        <button
          type="submit"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: COLORS.white,
            background: COLORS.ink,
            border: `1px solid ${COLORS.ink}`,
            borderRadius: RADIUS.sm,
            padding: `${SPACING.sm} ${SPACING.lg}`,
            cursor: 'pointer',
          }}
        >
          Submit review
        </button>
        <button
          type="reset"
          onClick={() => setTouchedKeys(new Set())}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: COLORS.ink,
            background: 'transparent',
            border: `1px solid ${COLORS.ink}55`,
            borderRadius: RADIUS.sm,
            padding: `${SPACING.sm} ${SPACING.lg}`,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
