import { SHELL } from '@/lib/shell/shell-tokens';
import { LinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';

interface LinkedProgramBadgeProps {
  view: LinkedProgramBadgeView;
}

export function LinkedProgramBadge({ view }: LinkedProgramBadgeProps) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 12px',
      backgroundColor: SHELL.BLUE_BG,
      border: `1px solid ${SHELL.INK_MID}`,
      borderRadius: '4px',
      fontSize: '11px',
      color: SHELL.INK_MID,
      fontFamily: SHELL.SANS,
    }}>
      <span style={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        LINKED PROGRAMME
      </span>
      <span style={{ color: SHELL.INK, fontWeight: 500 }}>
        {view.programCode} · {view.programName}
      </span>
      {view.routeHint ? (
        <a
          href={view.routeHint}
          style={{ color: SHELL.INK_MID, textDecoration: 'underline', fontSize: '11px' }}
        >
          {view.ctaLabel}
        </a>
      ) : (
        <span style={{ color: SHELL.INK_SOFT }}>{view.ctaLabel}</span>
      )}
    </div>
  );
}
