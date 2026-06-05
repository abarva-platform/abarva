import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'Request access', href: '/sign-in' },
  { label: 'Sign in', href: '/sign-in' },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="pub-footer" role="contentinfo">
      <div className="pub-footer__inner pub-footer__inner--lean">
        <div className="pub-footer__brand">
          <Link href="/" className="pub-footer__brand-link" aria-label="AbarVa home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg" alt="AbarVa" className="pub-footer__logo" />
          </Link>
          <p className="pub-footer__tagline">
            Decision intelligence for enterprise AI outcomes.
            <br />
            Publicly simple. Privately deep.
          </p>
        </div>

        <nav aria-label="Workspace access navigation">
          <p className="pub-footer__col-label">Access</p>
          <ul className="pub-footer__links" role="list">
            {PRODUCT_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="pub-footer__link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Access navigation">
          <p className="pub-footer__col-label">Access</p>
          <p className="pub-footer__access-copy">
            Training, client primers, corpus detail, datasets, generated artifacts, and
            workspace evidence remain behind authenticated access.
          </p>
        </nav>

        <nav aria-label="Trust navigation">
          <p className="pub-footer__col-label">Trust</p>
          <p className="pub-footer__access-copy">
            Responsible AI, model-card, subprocessors, and detailed product
            material are available inside authenticated workspaces.
          </p>
        </nav>
      </div>

      <div className="pub-footer__legal">
        <p className="pub-footer__copyright">© {year} AbarVa. All rights reserved.</p>
        <p className="pub-footer__copyright">Invite-only enterprise workspaces.</p>
      </div>
    </footer>
  );
}
