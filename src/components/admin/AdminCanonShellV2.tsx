import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { COLORS } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminSidebar } from './AdminSidebar';
import { AppShell } from '@/components/shell/AppShell';
import { SetupChatRail } from './SetupChatRail';
import { StewardDockPane } from './StewardDockPane';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  /**
   * Right-rail content. Three supported variants:
   *   1. `<SetupChatRail />` (legacy alias) — auto-promoted to the new
   *      AgentDock-backed Steward chat dock; the shell switches to a 2-col
   *      [sidebar | dock(workspace=children)] layout, where the dock owns
   *      the resizable chat lane via the shared <AgentDock>.
   *   2. Any other ReactNode — rendered in the legacy 28vw right rail
   *      (no chat lane resize, used by static-rail admin pages like
   *      /admin/connectors and /admin/users-access).
   *   3. Omitted — no rail; main column spans the available width.
   */
  agentRail?: ReactNode;
  /**
   * Tenant name for the top bar. Server-component callers should resolve
   * via getActiveClientRow() and pass the name here.
   */
  tenantName?: string;
}

/**
 * Detect whether the supplied agentRail node is the canonical Steward
 * chat rail. We compare element types directly so renames in user code
 * surface as type errors rather than silently regressing layout.
 */
function isStewardChatRail(node: ReactNode): node is ReactElement {
  if (!isValidElement(node)) return false;
  return node.type === SetupChatRail;
}

export function AdminCanonShellV2({
  children,
  agentRail,
  tenantName = 'Apex Retail Group',
}: AdminCanonShellV2Props) {
  const useChatDock = isStewardChatRail(agentRail);

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'Setup / Admin',
      }}
    >
      <style>
        {`
          @media (max-width: 900px) {
            [data-admin-shell="canon-v2"] {
              grid-template-columns: minmax(0, 1fr) !important;
              height: auto !important;
              min-height: calc(100vh - 48px) !important;
              overflow: visible !important;
            }
            [data-admin-shell="canon-v2"] [data-admin-main-scroll] {
              overflow: visible !important;
            }
            [data-admin-shell="canon-v2"] [data-admin-agent-rail],
            [data-admin-shell="canon-v2"] [data-admin-chat-dock] {
              display: none !important;
            }
          }
        `}
      </style>

      {/* ── Layout A · chat-dock (Steward AgentDock owns the right lane) ─── */}
      {useChatDock ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px minmax(0, 1fr)',
            flex: 1,
            minHeight: 0,
            height: 'calc(100vh - 48px)',
            overflow: 'hidden',
            background: SHELL.PAPER,
          }}
          data-admin-shell="canon-v2"
          data-admin-shell-mode="chat-dock"
        >
          <AdminSidebar />
          <div
            data-admin-chat-dock
            style={{ minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden', background: COLORS.cream }}
          >
            <StewardDockPane
              workspace={
                <div
                  data-admin-main-scroll
                  style={{
                    overflowY: 'auto',
                    minWidth: 0,
                    minHeight: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {children}
                </div>
              }
            />
          </div>
        </div>
      ) : (
        // ── Layout B · legacy 3-col (sidebar | main | static rail) ────────
        // Canonical 3-zone dimensions: gridTemplateColumns: '280px 1fr 320px'
        // (sidebar=280px, main=1fr, agent-rail=320px per ADMIN_LAYOUT_DIMS)
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: agentRail
              ? '280px 1fr 320px'
              : '280px minmax(0, 1fr)',
            flex: 1,
            minHeight: 0,
            height: 'calc(100vh - 48px)',
            overflow: 'hidden',
            background: SHELL.PAPER,
          }}
          data-admin-shell="canon-v2"
          data-admin-shell-mode="static-rail"
        >
          <AdminSidebar />
          <div
            data-admin-main-scroll
            style={{ overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </div>
          {agentRail ? (
            <aside
              aria-label="Steward setup agent"
              data-admin-agent-rail
              style={{
                minWidth: 0,
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                borderLeft: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              {agentRail}
            </aside>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
