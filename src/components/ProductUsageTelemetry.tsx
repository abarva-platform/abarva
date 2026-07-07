'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { usePostHog } from 'posthog-js/react';
import {
  deriveProductUsageModule,
  normalizeTelemetryText,
  safePathFromHref,
} from '@/lib/telemetry/product-usage';

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function clickedElement(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  return target.closest(
    'a,button,input,select,textarea,label,summary,[role="button"],[role="menuitem"],[data-track-click]',
  ) ?? target;
}

function elementText(element: Element): string | null {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return null;
  }
  const explicit =
    element.getAttribute('data-track-label') ??
    element.getAttribute('aria-label') ??
    element.getAttribute('title');
  if (explicit) return normalizeTelemetryText(explicit);
  if (element.matches('a,button,[role="button"],[role="menuitem"],summary')) {
    return normalizeTelemetryText(element.textContent);
  }
  if (element.matches('[data-track-click]')) {
    return normalizeTelemetryText(
      element.getAttribute('data-track-label') ??
        element.getAttribute('aria-label') ??
        element.textContent,
    );
  }
  return null;
}

function AnonymousProductUsageTelemetry() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!pathname || !posthog) return;

    const qs = searchParams?.toString() ?? '';
    const currentUrl = `${window.location.origin}${pathname}${qs ? `?${qs}` : ''}`;
    const productModule = deriveProductUsageModule(pathname);
    const ref = searchParams?.get('ref');

    if (ref) {
      posthog.identify(ref, {
        name: ref,
        first_seen: new Date().toISOString(),
      });
    }

    posthog.capture('$pageview', {
      $current_url: currentUrl,
      route: pathname,
      module: productModule,
      signed_in: false,
      client_id: null,
      default_client_id: null,
      role: null,
      persona_title: null,
      client_locked: null,
    });
  }, [pathname, posthog, searchParams]);

  useEffect(() => {
    if (!posthog) return;

    function onClick(event: MouseEvent) {
      const element = clickedElement(event.target);
      if (!element) return;
      const productModule = deriveProductUsageModule(window.location.pathname);
      const anchor = element.closest('a[href]') as HTMLAnchorElement | null;
      posthog.capture('abarva.product_click', {
        route: window.location.pathname,
        module: productModule,
        signed_in: false,
        client_id: null,
        default_client_id: null,
        tag: element.tagName.toLowerCase(),
        role_attr: element.getAttribute('role'),
        type_attr: element.getAttribute('type'),
        element_id: element.id || null,
        test_id: element.getAttribute('data-testid'),
        track_id: element.getAttribute('data-track-id'),
        label: elementText(element),
        href: safePathFromHref(anchor?.href),
        button: event.button,
        meta_key: event.metaKey,
        ctrl_key: event.ctrlKey,
      });
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [posthog]);

  return null;
}

function SignedInProductUsageTelemetry() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const { user, isLoaded } = useUser();
  const publicMetadata = user?.publicMetadata as Record<string, unknown> | null | undefined;

  const identity = useMemo(() => {
    if (!isLoaded || !user) return null;
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      null;
    return {
      id: user.id,
      email,
      role: metadataString(publicMetadata, 'role'),
      legacyRole: metadataString(publicMetadata, 'legacyRole'),
      clientId: metadataString(publicMetadata, 'clientId'),
      defaultClientId: metadataString(publicMetadata, 'defaultClientId'),
      personaName: metadataString(publicMetadata, 'personaName'),
      personaTitle: metadataString(publicMetadata, 'personaTitle'),
      accountType: metadataString(publicMetadata, 'accountType'),
      clientLocked: publicMetadata?.clientLocked === true,
      platformAdmin: publicMetadata?.platformAdmin === true,
    };
  }, [isLoaded, publicMetadata, user]);

  useEffect(() => {
    if (!pathname || !posthog) return;

    const qs = searchParams?.toString() ?? '';
    const currentUrl = `${window.location.origin}${pathname}${qs ? `?${qs}` : ''}`;
    const productModule = deriveProductUsageModule(pathname);

    if (identity) {
      posthog.identify(identity.id, {
        email: identity.email,
        role: identity.role,
        legacy_role: identity.legacyRole,
        client_id: identity.clientId,
        default_client_id: identity.defaultClientId,
        persona_name: identity.personaName,
        persona_title: identity.personaTitle,
        account_type: identity.accountType,
        client_locked: identity.clientLocked,
        platform_admin: identity.platformAdmin,
      });
    } else {
      const ref = searchParams?.get('ref');
      if (ref) {
        posthog.identify(ref, {
          name: ref,
          first_seen: new Date().toISOString(),
        });
      }
    }

    posthog.capture('$pageview', {
      $current_url: currentUrl,
      route: pathname,
      module: productModule,
      signed_in: Boolean(identity),
      client_id: identity?.clientId ?? null,
      default_client_id: identity?.defaultClientId ?? null,
      role: identity?.role ?? null,
      persona_title: identity?.personaTitle ?? null,
      client_locked: identity?.clientLocked ?? null,
    });
  }, [identity, pathname, posthog, searchParams]);

  useEffect(() => {
    if (!posthog || !identity) return;
    const clickIdentity = identity;

    function onClick(event: MouseEvent) {
      const element = clickedElement(event.target);
      if (!element) return;
      const productModule = deriveProductUsageModule(window.location.pathname);
      const anchor = element.closest('a[href]') as HTMLAnchorElement | null;
      posthog.capture('abarva.product_click', {
        route: window.location.pathname,
        module: productModule,
        client_id: clickIdentity.clientId,
        default_client_id: clickIdentity.defaultClientId,
        role: clickIdentity.role,
        persona_name: clickIdentity.personaName,
        persona_title: clickIdentity.personaTitle,
        client_locked: clickIdentity.clientLocked,
        tag: element.tagName.toLowerCase(),
        role_attr: element.getAttribute('role'),
        type_attr: element.getAttribute('type'),
        element_id: element.id || null,
        test_id: element.getAttribute('data-testid'),
        track_id: element.getAttribute('data-track-id'),
        label: elementText(element),
        href: safePathFromHref(anchor?.href),
        button: event.button,
        meta_key: event.metaKey,
        ctrl_key: event.ctrlKey,
      });
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [identity, posthog]);

  return null;
}

export default function ProductUsageTelemetry({ clerkEnabled = true }: { clerkEnabled?: boolean }) {
  const telemetry = clerkEnabled ? <SignedInProductUsageTelemetry /> : <AnonymousProductUsageTelemetry />;

  return <Suspense fallback={null}>{telemetry}</Suspense>;
}
