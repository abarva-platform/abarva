import Link from 'next/link';
import type { PatternSeed } from '@/lib/public-site/public-patterns';
import { getDomainLabel, getRelatedPatterns } from '@/lib/public-site/public-patterns';

interface PatternMetadataSidebarProps {
  pattern: PatternSeed;
}

const TIER_LABELS: Record<PatternSeed['tier'], string> = {
  M: 'Meta',
  authoritative: 'Authoritative',
  validated: 'Validated',
};

export function PatternMetadataSidebar({ pattern }: PatternMetadataSidebarProps) {
  const confidencePct = Math.round(pattern.confidence * 100);
  const related = getRelatedPatterns(pattern);

  return (
    <aside className="pub-pattern-metadata-sidebar" aria-label="Pattern metadata">
      <dl className="pub-pattern-metadata-sidebar__list">
        <div className="pub-pattern-metadata-sidebar__item">
          <dt className="pub-pattern-metadata-sidebar__label">Category</dt>
          <dd className="pub-pattern-metadata-sidebar__value">
            <span className="pub-pattern-metadata-sidebar__badge">
              {getDomainLabel(pattern.domain)}
            </span>
          </dd>
        </div>

        <div className="pub-pattern-metadata-sidebar__item">
          <dt className="pub-pattern-metadata-sidebar__label">Tier</dt>
          <dd className="pub-pattern-metadata-sidebar__value">
            {TIER_LABELS[pattern.tier] ?? pattern.tier}
          </dd>
        </div>

        <div className="pub-pattern-metadata-sidebar__item">
          <dt className="pub-pattern-metadata-sidebar__label">Confidence</dt>
          <dd className="pub-pattern-metadata-sidebar__value">
            <div className="pub-pattern-metadata-sidebar__confidence">
              <div
                className="pub-pattern-metadata-sidebar__confidence-track"
                role="progressbar"
                aria-valuenow={confidencePct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Confidence score ${confidencePct}%`}
              >
                <div
                  className="pub-pattern-metadata-sidebar__confidence-fill"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span className="pub-pattern-metadata-sidebar__confidence-number">
                {confidencePct}%
              </span>
            </div>
          </dd>
        </div>

        {pattern.vertical && (
          <div className="pub-pattern-metadata-sidebar__item">
            <dt className="pub-pattern-metadata-sidebar__label">Vertical</dt>
            <dd className="pub-pattern-metadata-sidebar__value">{pattern.vertical}</dd>
          </div>
        )}

        {related.length > 0 && (
          <div className="pub-pattern-metadata-sidebar__item pub-pattern-metadata-sidebar__item--related">
            <dt className="pub-pattern-metadata-sidebar__label">Related patterns</dt>
            <dd className="pub-pattern-metadata-sidebar__value">
              <ul className="pub-pattern-metadata-sidebar__related-list" role="list">
                {related.map((rel) => (
                  <li key={rel.id} className="pub-pattern-metadata-sidebar__related-item">
                    <Link
                      href={`/patterns/${rel.slug}/`}
                      className="pub-pattern-metadata-sidebar__related-link"
                    >
                      {rel.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
