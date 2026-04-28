/**
 * TowerMissionQueue — portfolio-level pending-mission queue rendered on the
 * Control Tower (CIO-of-staff Atlas view).
 *
 * This is the executive answer to "what should we do next, across the
 * company?" It pulls auto-derived missions from every program and source
 * event in the portfolio, filtered to the decisive (medium-and-above) tier,
 * and ranks them so the top of the queue is always the most consequential
 * pending hard gate.
 *
 * Server component — calls the pure `getPortfolioMissions` helper at render
 * time and hands the result to the shared `MissionList`. AbarVa palette
 * only; styling comes from `SHELL` shell tokens via `MissionList`.
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { MissionList } from '@/components/_shared/MissionList';
import { getPortfolioMissions } from '@/lib/agent/agent-mission-derived';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';

const WRAPPER: CSSProperties = {
  display: 'grid',
  gap: 6,
};

const SUBTITLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

export interface TowerMissionQueueProps {
  /**
   * Maximum number of missions to render. Defaults to 8 — large enough to
   * fill the column on a typical executive desktop without scrolling, small
   * enough to keep the queue scannable.
   */
  readonly limit?: number;
}

export function TowerMissionQueue({ limit = 8 }: TowerMissionQueueProps = {}) {
  const missions = getPortfolioMissions(limit);
  const programCount = APEX_RETAIL_PROGRAM_INSTANCES.length;
  const sourceCount = SOURCE_EVENT_INSTANCES.length;

  return (
    <div style={WRAPPER} data-testid="tower-mission-queue">
      <MissionList
        missions={missions}
        title="Portfolio missions · pending high-priority gates"
        maxRows={limit}
        showInstancePrefix
        emptyState="All portfolio gates satisfied · Atlas is monitoring"
      />
      <p style={SUBTITLE}>
        Auto-derived from gate criteria across all {programCount} program
        {programCount === 1 ? '' : 's'} and {sourceCount} source event
        {sourceCount === 1 ? '' : 's'}
      </p>
    </div>
  );
}

export default TowerMissionQueue;
