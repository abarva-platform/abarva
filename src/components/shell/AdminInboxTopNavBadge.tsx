"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface InboxResponse {
  ok?: boolean;
  unreadCount?: number;
}

export function AdminInboxTopNavBadge() {
  if (process.env.NEXT_PUBLIC_ENABLE_ADMIN_INBOX_BADGE !== "true") {
    return null;
  }
  return <AdminInboxTopNavBadgeInner />;
}

function AdminInboxTopNavBadgeInner() {
  const [available, setAvailable] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inbox?limit=1", { cache: "no-store" });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        setAvailable(false);
        setUnreadCount(0);
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as InboxResponse;
      setAvailable(Boolean(json.ok));
      setUnreadCount(typeof json.unreadCount === "number" ? json.unreadCount : 0);
    } catch {
      setAvailable(false);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  if (!available) return null;

  const label = unreadCount > 0
    ? `Admin inbox, ${unreadCount} unread`
    : "Admin inbox, no unread notifications";

  return (
    <Link
      href="/admin/inbox"
      aria-label={label}
      title={label}
      style={{
        position: "relative",
        width: 32,
        height: 32,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textDecoration: "none",
        background: unreadCount > 0 ? "rgba(0,102,204,0.20)" : "transparent",
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 10,
          border: "1.6px solid currentColor",
          borderTop: "none",
          borderRadius: "0 0 3px 3px",
          position: "relative",
          transform: "translateY(1px)",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 1,
            right: 1,
            top: -5,
            height: 8,
            borderTop: "1.6px solid currentColor",
            borderLeft: "1.6px solid currentColor",
            transform: "skewY(-26deg)",
            transformOrigin: "left bottom",
          }}
        />
      </span>
      {unreadCount > 0 ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 17,
            height: 17,
            padding: "0 4px",
            borderRadius: 999,
            background: "#CE5A3B",
            color: "#FFFFFF",
            border: "2px solid #000000",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
