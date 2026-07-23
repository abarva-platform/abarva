"use client";

// The 560px right-anchored drawer shell, shared by all four drawers.
//
// Geometry, transition and backdrop are transcribed from the design file
// (`.drawer` / `.backdrop`, CSS ~475–513). Everything else here is the
// accessibility contract the mockup omits and §6 of the handoff prompt
// requires: role="dialog", aria-modal, an accessible name, a focus trap,
// Escape-to-close, and focus restored to the trigger on close.

import { useCallback, useEffect, useRef } from "react";

import { cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function DrawerShell({
  open,
  onClose,
  eyebrow,
  eyebrowTone = "eTeal",
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: React.ReactNode;
  eyebrowTone?: "eTeal" | "eAmber" | "eRed" | "eGray";
  title: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Remember what had focus before the drawer opened, and give it back on close.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    return () => {
      restoreRef.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Trap focus inside the panel — without this, Tab walks straight out into
      // the page behind the backdrop, which is unreachable by pointer.
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return (
    <>
      <div
        className={cx(styles.backdrop, open && styles.open)}
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        className={cx(styles.drawer, open && styles.open)}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-hidden={open ? undefined : true}
        aria-labelledby="tcc-drawer-title"
        onKeyDown={onKeyDown}
      >
        {open ? (
          <>
            <header className={styles.drHead}>
              <div className={cx(styles.drEyebrow, styles[eyebrowTone])}>
                <span>{eyebrow}</span>
                <button
                  type="button"
                  className={styles.drClose}
                  onClick={onClose}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <h3 id="tcc-drawer-title">{title}</h3>
            </header>
            <div className={styles.drBody}>{children}</div>
            <footer className={styles.drFoot}>{footer}</footer>
          </>
        ) : null}
      </aside>
    </>
  );
}

/** The drawer's section heading, with the design's optional inline note. */
export function DrawerSection({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className={styles.drSec}>
      {children}
      {note ? <span className={styles.drSecNote}> {note}</span> : null}
    </div>
  );
}

/** One row of the drawer's four-up stat grid. */
export function DrawerStat({
  label,
  value,
  small,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
  tone?: "vTeal" | "vRed" | "vAmber";
}) {
  return (
    <div>
      <div className={styles.k}>{label}</div>
      <div className={cx(styles.v, small && styles.sm, tone && styles[tone])}>
        {value}
      </div>
    </div>
  );
}

/** A label/value row in the drawer body. */
export function DrawerRow({
  label,
  sub,
  value,
  valueColor,
}: {
  label: string;
  sub?: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className={cx(styles.drow, sub && styles.stacked)}>
      <span className={styles.dk}>
        {label}
        {sub ? <span className={styles.dsub}>{sub}</span> : null}
      </span>
      <span
        className={styles.dv}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
