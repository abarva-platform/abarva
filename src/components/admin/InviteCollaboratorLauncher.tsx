'use client';

/**
 * Client wrapper that owns the open-state for the Invite Collaborator
 * dialog. Mounted by the server `users-access/page.tsx`. The button is
 * a primary CTA that opens the dialog; the dialog renders a 4-step
 * controlled flow. Auto-opens when the parent URL carries
 * `?invite=open` so the proxy redirect from the deprecated
 * `/admin/invite` route lands directly on the dialog.
 *
 * Per docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md §5.5 Wave 1 PR-2.
 */

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { InviteCollaboratorDialog } from '@/components/setup/InviteCollaboratorDialog';

interface InviteCollaboratorLauncherProps {
  tenantName?: string;
  /**
   * Canonical tenant key (e.g. `apex-retail`). Threaded into the
   * dialog so the server action's audit row resolves to the correct
   * `clients.id` even if the admin is in the middle of switching
   * tenants.
   */
  tenantKey?: string;
}

export function InviteCollaboratorLauncher({ tenantName, tenantKey }: InviteCollaboratorLauncherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wantsAutoOpen = searchParams?.get('invite') === 'open';

  // `dismissed` tracks an explicit user close so we don't reopen the
  // dialog on every render while the `?invite=open` param is still in
  // the URL (e.g. during the closing animation, before router.replace
  // finishes). Each manual open increments `openCount`, which doubles
  // as the dialog key so internal step state resets fresh.
  const [dismissed, setDismissed] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  const manuallyOpen = openCount > 0 && !dismissed;
  const open = manuallyOpen || (wantsAutoOpen && !dismissed);

  const handleOpen = useCallback(() => {
    setDismissed(false);
    setOpenCount((n) => n + 1);
  }, []);

  const handleClose = useCallback(() => {
    setDismissed(true);
    if (wantsAutoOpen) {
      const next = new URLSearchParams(searchParams?.toString() ?? '');
      next.delete('invite');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname ?? '/admin/users-access');
    }
  }, [pathname, router, searchParams, wantsAutoOpen]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: SPACING.md,
        }}
      >
        <button
          type="button"
          onClick={handleOpen}
          data-testid="invite-collaborator-launcher"
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: COLORS.white,
            background: COLORS.ink,
            border: 'none',
            borderRadius: RADIUS.sm,
            padding: '10px 18px',
            cursor: 'pointer',
          }}
        >
          Invite collaborator
        </button>
      </div>
      <InviteCollaboratorDialog
        key={openCount}
        open={open}
        onClose={handleClose}
        tenantName={tenantName}
        tenantKey={tenantKey}
      />
    </>
  );
}
