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
   *   2. Any other ReactNode — available from an on-demand Guidance
   *      drawer. It no longer consumes a permanent right column; Maestro
   *      admin pages are content-first by default.
   *   3. Omitted — no rail; main column spans the available width.
   */
  agentRail?: ReactNode;
  /**
   * Tenant name for the top bar. REQUIRED. Server-component callers must
   * resolve via `resolveAdminTenant()` (preferred) or `getActiveClientRow()`
   * and pass the resulting display name here.
   *
   * No default is supplied: a previous default of 'Apex Retail Group' caused
   * cross-tenant leak (LEAK-B, ADMIN_HOME_FULL_TEST_2026-05-30 §2/§6/§7) on
   * pages that forgot to thread the prop. For non-tenant surfaces (the
   * unauthorized admin shell, public docs/engineering pages) pass an
   * explicit neutral string like 'AbarVa Admin' or 'AbarVa Docs'.
   */
  tenantName: string;
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
  tenantName,
}: AdminCanonShellV2Props) {
  const useChatDock = isStewardChatRail(agentRail);

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'Admin workspace',
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
            [data-admin-shell="canon-v2"] [data-admin-guidance-drawer],
            [data-admin-shell="canon-v2"] [data-admin-chat-dock] {
              display: none !important;
            }
          }
          [data-admin-guidance-drawer] > summary {
            list-style: none;
          }
          [data-admin-guidance-drawer] > summary::-webkit-details-marker {
            display: none;
          }
          [data-admin-guidance-drawer]:not([open]) {
            width: auto !important;
            border-radius: 999px !important;
            overflow: visible !important;
          }
          [data-admin-guidance-drawer]:not([open]) > summary {
            height: 52px;
            padding: 0 18px !important;
            border-bottom: 0 !important;
            border-radius: 999px;
              background: ${SHELL.INK} !important;
              color: ${SHELL.CARD_WHITE} !important;
            box-shadow: 0 12px 28px rgba(0,0,0,0.24);
          }
        `}
      </style>

      {/* ── Layout A · chat-dock (Steward AgentDock owns the right lane) ─── */}
      {useChatDock ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px minmax(0, 1fr)',
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
              surface="admin-steward-content-first-v1"
              defaultMode="collapsed"
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
        // ── Layout B · content-first (sidebar | main) + optional guidance ──
        // Static AgentRail content is still available, but no longer takes a
        // permanent 320px column from Maestro work pages.
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px minmax(0, 1fr)',
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
            <details
              aria-label="Page guidance"
              data-admin-agent-rail
              data-admin-guidance-drawer
              style={{
                position: 'fixed',
                right: 24,
                bottom: 24,
                zIndex: 860,
                width: 320,
                maxWidth: 'calc(100vw - 48px)',
                maxHeight: 'min(720px, calc(100vh - 96px))',
                overflow: 'auto',
                border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                borderRadius: 8,
                background: SHELL.CARD_WHITE,
                boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
              }}
            >
              <summary
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  fontWeight: 800,
                  color: SHELL.INK,
                  background: SHELL.CARD_WHITE,
                  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                }}
              >
                <span>Guidance</span>
                <span aria-hidden="true" style={{ fontFamily: SHELL.MONO, fontSize: 11 }}>
                  ?
                </span>
              </summary>
              <div style={{ maxHeight: 'calc(min(720px, 100vh - 96px) - 48px)', overflow: 'auto' }}>
                {agentRail}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
