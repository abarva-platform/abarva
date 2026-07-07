"use client";

import { useCallback } from "react";
import { useClerk } from "@clerk/nextjs";
import { clearActiveClientContext } from "@/lib/auth/client-context-storage";

/**
 * Canonical sign-out hook.
 *
 * History: the in-app top-bar Sign-out button was wired with the deprecated
 * Clerk `signOut(callback)` overload + `router.push("/signed-out")` (soft
 * client-side transition). Two problems:
 *
 *   1. The soft transition kept the same React tree mounted; Clerk's session
 *      cleanup (DELETE /v1/sessions/<id>/remove) could be cancelled when the
 *      AppTopBar unmounted.
 *   2. `void signOut(...)` discarded the returned promise — any error in the
 *      underlying call was swallowed silently, so the button "appeared" to
 *      work while the Clerk session persisted.
 *
 * The modern `signOut({ redirectUrl })` form awaits the session-destroy POST
 * and then forces a full-page navigation, which is what
 * `window.Clerk.signOut().then(()=>window.location.href='/signed-out')`
 * does manually — and that workaround is the only thing that worked during
 * the 2026-05-13 audit.
 *
 * Every sign-out button in the shell (AppTopBar, AppRail, ClientChrome,
 * AbarvaNav) should call this hook rather than re-implement the cookie-clear +
 * Clerk-call ordering.
 */
export function useSignOut(redirectUrl: string = "/signed-out") {
  const { signOut } = useClerk();
  return useCallback(async () => {
    clearActiveClientContext();
    await signOut({ redirectUrl });
  }, [signOut, redirectUrl]);
}
