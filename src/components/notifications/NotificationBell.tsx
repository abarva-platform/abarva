'use client';

// Priority 2 item 4 · notification bell + feed.
// Polls /api/notifications on a 60s interval. Shows an unread badge for
// notifications NOT authored by the calling user. Click opens an inline
// feed panel; feed links jump to /home/queue for action.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  kind: 'task-assigned' | 'task-done' | 'approval' | 'phase-gate';
  actorName: string | null;
  actorEmail: string | null;
  subject: string;
  programCode: string | null;
  deliverableCode: string | null;
  timestamp: string;
  href: string;
  forCaller: boolean;
}

const READ_KEY = 'abarva.notifications.lastRead';

function getLastRead(): string {
  if (typeof window === 'undefined') return new Date(0).toISOString();
  return window.localStorage.getItem(READ_KEY) ?? new Date(0).toISOString();
}

function setLastRead(iso: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(READ_KEY, iso);
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [lastRead, setLastReadState] = useState<string>(() => getLastRead());
  const pollRef = useRef<number | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchItems();
    pollRef.current = window.setInterval(fetchItems, 60_000);
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
  }, [fetchItems]);

  const unreadCount = items.filter((n) => !n.forCaller && n.timestamp > lastRead).length;

  function togglePanel() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && items.length > 0) {
      const newestTs = items[0].timestamp;
      setLastRead(newestTs);
      setLastReadState(newestTs);
    }
  }

  return (
    <>
      <style>{bellCss}</style>
      <div className="nb-root">
        <button
          type="button"
          className="nb-btn"
          onClick={togglePanel}
          aria-label={`Notifications${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
          aria-expanded={open}
        >
          <span className="nb-icon" aria-hidden="true">🔔</span>
          {unreadCount > 0 ? <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
        </button>
        {open ? (
          <div className="nb-panel" role="dialog" aria-label="Notifications">
            <div className="nb-panel-head">
              <span className="nb-panel-title">Notifications</span>
              <button type="button" className="nb-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            {items.length === 0 ? (
              <p className="nb-empty">Nothing new. Assign a task or approve a decision to start the feed.</p>
            ) : (
              <ul className="nb-list">
                {items.slice(0, 20).map((n) => (
                  <li key={n.id} className={`nb-item kind-${n.kind} ${!n.forCaller && n.timestamp > lastRead ? 'unread' : ''}`}>
                    <Link href={n.href} className="nb-item-link" onClick={() => setOpen(false)}>
                      <span className={`nb-dot ${n.kind}`} aria-hidden="true" />
                      <div className="nb-item-body">
                        <strong>{n.subject}</strong>
                        <span className="nb-meta">
                          {n.actorName ? `${n.actorName} · ` : ''}
                          {n.programCode ? `${n.programCode} · ` : ''}
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="nb-panel-foot">
              <Link href="/home/queue" onClick={() => setOpen(false)}>View queue →</Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

const bellCss = `
.nb-root { position: relative; display: inline-flex; align-items: center; }
.nb-btn {
  position: relative; padding: 7px 10px; border-radius: 999px;
  background: transparent; border: 1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.85); cursor: pointer;
  font-size: 13px; line-height: 1;
}
.nb-btn:hover { background: rgba(255,255,255,0.08); }
.nb-icon { display: inline-block; }
.nb-badge {
  position: absolute; top: -3px; right: -3px; min-width: 16px; height: 16px;
  border-radius: 999px; background: #CE5A3B; color: #FFFFFF;
  font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 4px; border: 2px solid #0a0a0b;
}
.nb-panel {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 340px; max-height: 480px; overflow: hidden;
  display: flex; flex-direction: column;
  background: #FFFFFF; color: #1a1612;
  border: 1px solid rgba(26,22,18,0.12);
  border-radius: 12px; box-shadow: 0 16px 40px rgba(10,10,11,0.14);
  z-index: 80; font-family: 'DM Sans', sans-serif;
}
.nb-panel-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 14px; border-bottom: 1px solid rgba(26,22,18,0.08);
}
.nb-panel-title {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #0e9f8c; font-weight: 700;
}
.nb-close {
  width: 22px; height: 22px; border-radius: 50%; border: none;
  background: rgba(26,22,18,0.06); color: #1a1612; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 11px;
}
.nb-empty { padding: 24px 14px; margin: 0; font-size: 13px; color: #6d625a; font-style: italic; text-align: center; }
.nb-list { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1; }
.nb-item { border-bottom: 1px solid rgba(26,22,18,0.04); }
.nb-item:last-child { border-bottom: 0; }
.nb-item.unread { background: rgba(14,159,140,0.04); }
.nb-item-link { display: flex; gap: 10px; padding: 10px 14px; text-decoration: none; color: inherit; }
.nb-item-link:hover { background: rgba(26,22,18,0.03); }
.nb-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
  background: #0e9f8c;
}
.nb-dot.task-assigned { background: #F5C54A; }
.nb-dot.task-done { background: #3FB27F; }
.nb-dot.approval { background: #0e9f8c; }
.nb-dot.phase-gate { background: #9B6DFF; }
.nb-item-body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.nb-item-body strong { font-size: 13px; color: #1a1612; }
.nb-meta { font-size: 11px; color: #8a7e72; }
.nb-panel-foot {
  border-top: 1px solid rgba(26,22,18,0.08); padding: 10px 14px;
  text-align: right;
}
.nb-panel-foot a {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; color: #0e9f8c;
  text-decoration: none; font-weight: 700;
}
.nb-panel-foot a:hover { text-decoration: underline; }
`;
