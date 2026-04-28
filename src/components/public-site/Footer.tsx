import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'How it works', href: '/how-it-works/' },
  { label: 'Atlas', href: '/atlas/' },
  { label: 'Public surfaces', href: '/patterns/' },
];

const CORPUS_LINKS = [
  { label: 'Patterns', href: '/patterns/' },
  { label: 'Contradictions', href: '/contradictions/' },
  { label: 'Solutions', href: '/solutions/' },
  { label: 'Editorial', href: '/editorial/' },
  { label: 'Digest', href: '/digest/' },
];

const ARCHITECTURE_LINKS = [
  { label: 'Overview', href: '/architecture/' },
  { label: 'Knowledge fabric', href: '/architecture/knowledge-fabric/' },
  { label: 'Agents', href: '/architecture/agents/' },
  { label: 'Data plane', href: '/architecture/data-plane/' },
  { label: 'Synthesis', href: '/architecture/synthesis/' },
  { label: 'Governance', href: '/architecture/governance/' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="pub-footer" role="contentinfo">
      <div className="pub-footer__inner">
        <div className="pub-footer__brand">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="pub-footer__wordmark">
              <span style={{ color: 'var(--pub-ink)' }}>Abar</span>
              <span style={{ color: 'var(--pub-signal)' }}>Va</span>
            </span>
          </Link>
          <p className="pub-footer__tagline">
            A knowledge layer for AI programs.
            <br />
            60 patterns. 30 signals. 10 contradictions.
          </p>
        </div>

        <nav aria-label="Product navigation">
          <p className="pub-footer__col-label">Product</p>
          <ul className="pub-footer__links" role="list">
            {PRODUCT_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="pub-footer__link">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Corpus navigation">
          <p className="pub-footer__col-label">Corpus</p>
          <ul className="pub-footer__links" role="list">
            {CORPUS_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="pub-footer__link">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Architecture navigation">
          <p className="pub-footer__col-label">Architecture</p>
          <ul className="pub-footer__links" role="list">
            {ARCHITECTURE_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="pub-footer__link">{label}</Link>
              </li>
            ))}
          </ul>
          <p className="pub-footer__col-label" style={{ marginTop: '28px' }}>Contact</p>
          <ul className="pub-footer__links" role="list">
            <li>
              <Link href="/contact/" className="pub-footer__link">Talk to us</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="pub-footer__legal">
        <p className="pub-footer__copyright">
          © {year} AbarVa. All rights reserved.
        </p>
        <ul className="pub-footer__legal-links" role="list">
          <li>
            <Link href="/privacy/" className="pub-footer__legal-link">Privacy</Link>
          </li>
          <li>
            <Link href="/terms/" className="pub-footer__legal-link">Terms</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
