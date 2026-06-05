'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const NAV_LINKS: readonly { label: string; href: string }[] = [];

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        rafRef.current = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <nav
      className={`pub-topnav ${scrolled ? 'pub-topnav--solid' : 'pub-topnav--transparent'}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link href="/" className="pub-topnav__wordmark" aria-label="AbarVa home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg"
          alt="AbarVa"
          className="pub-topnav__wordmark-logo"
        />
      </Link>

      <ul className="pub-topnav__nav" role="list">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={href} className="pub-topnav__nav-item pub-topnav__nav-item--hide-sm">
            <Link href={href} className="pub-topnav__link">
              {label}
            </Link>
          </li>
        ))}
        <li className="pub-topnav__nav-item">
          <Link href="/sign-in" className="pub-topnav__signin">
            Sign in
          </Link>
        </li>
        <li className="pub-topnav__nav-item">
          <Link href="/sign-in" className="pub-topnav__cta">
            Request access
          </Link>
        </li>
      </ul>
    </nav>
  );
}
