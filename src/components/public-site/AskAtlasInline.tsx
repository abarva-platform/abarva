import Link from 'next/link';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

export function AskAtlasInline() {
  return (
    <aside className="pub-ask-atlas-inline" aria-label="Ask Ava about this pattern">
      <div className="pub-ask-atlas-inline__body">
        <p className="pub-ask-atlas-inline__copy">
          Want to see how this pattern plays out in your context?
        </p>
        <Link
          href={CANONICAL_URLS.atlas}
          className="pub-ask-atlas-inline__cta"
          aria-label="Ask Ava — opens the assistant"
        >
          Ask Ava →
        </Link>
      </div>
    </aside>
  );
}
