'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { COLORS, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { InboxNotificationItem } from '@/lib/admin/broker/notification-inbox-broker';

interface InboxResponse {
  ok?: boolean;
  items?: InboxNotificationItem[];
  unreadCount?: number;
}

function fmtDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function severityColor(severity: string): string {
  if (severity === 'critical') return '#CE5A3B';
  if (severity === 'warn') return '#C7861D';
  return COLORS.navy;
}

export function NotificationsInboxPage() {
  const [items, setItems] = useState<InboxNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inbox?limit=75', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as InboxResponse;
      setItems(Array.isArray(json.items) ? json.items : []);
      setUnreadCount(typeof json.unreadCount === 'number' ? json.unreadCount : 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const moduleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.sourceModule, (counts.get(item.sourceModule) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  async function markAllRead() {
    setSaving(true);
    try {
      await fetch('/api/admin/inbox', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '40px 48px 72px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}80`,
              marginBottom: 8,
            }}
          >
            Steward inbox
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 34,
              lineHeight: 1.1,
              fontWeight: 400,
              color: COLORS.ink,
            }}
          >
            Notifications
          </h1>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={saving || unreadCount === 0}
          style={{
            border: `1px solid ${COLORS.ink}22`,
            background: unreadCount === 0 ? `${COLORS.ink}08` : COLORS.ink,
            color: unreadCount === 0 ? `${COLORS.ink}66` : COLORS.white,
            borderRadius: 6,
            padding: '10px 14px',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: unreadCount === 0 ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving' : 'Mark all read'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        <Metric label="Unread" value={String(unreadCount)} />
        <Metric label="Total" value={String(items.length)} />
        <Metric label="Modules" value={String(moduleCounts.length)} />
        <Metric label="Newest" value={items[0] ? fmtDate(items[0].createdAt) : 'None'} compact />
      </div>

      <section
        aria-label="Notification list"
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 28, color: `${COLORS.ink}80`, fontFamily: TYPOGRAPHY.sans }}>
            Loading inbox...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 22, color: COLORS.ink, marginBottom: 8 }}>
              No notifications yet
            </div>
            <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}80` }}>
              Urgent events, digest summaries, and in-app delivery rows will land here.
            </div>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: 'grid',
                gridTemplateColumns: '10px minmax(0, 1fr) auto',
                gap: 14,
                padding: '16px 18px',
                borderBottom: `1px solid ${COLORS.ink}0f`,
                textDecoration: 'none',
                color: COLORS.ink,
                background: item.readAt ? COLORS.white : `${COLORS.navy}08`,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: severityColor(item.severity),
                  marginTop: 6,
                }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <strong style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14 }}>{item.title}</strong>
                  {!item.readAt ? (
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: COLORS.navy,
                      }}
                    >
                      Unread
                    </span>
                  ) : null}
                </span>
                <span style={{ display: 'block', fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}b3`, lineHeight: 1.45 }}>
                  {item.body}
                </span>
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}80`,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.sourceModule} · {fmtDate(item.createdAt)}
              </span>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div style={{ border: `1px solid ${COLORS.ink}14`, background: COLORS.white, borderRadius: 8, padding: 16 }}>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}66`,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: compact ? TYPOGRAPHY.sans : TYPOGRAPHY.serif,
          fontSize: compact ? 14 : 28,
          color: COLORS.ink,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
