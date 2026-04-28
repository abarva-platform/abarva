'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Patterns', href: '/patterns/' },
  { label: 'Contradictions', href: '/contradictions/' },
  { label: 'Editorial', href: '/editorial/' },
  { label: 'Architecture', href: '/architecture/' },
] as const;

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
        <span className="pub-topnav__wordmark-text">
          <span className="pub-topnav__wordmark-abar">Abar</span>
          <span className="pub-topnav__wordmark-va">Va</span>
        </span>
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
          <Link href="/atlas/" className="pub-topnav__cta">
            Try Atlas →
          </Link>
        </li>
      </ul>
    </nav>
  );
}
