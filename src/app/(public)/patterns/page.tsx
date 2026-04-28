import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import {
  getPublicPatterns,
  getPublicPatternCategories,
  getDomainLabel,
} from '@/lib/public-site/public-patterns';
import { PatternCard } from '@/components/public-site/PatternCard';

export const metadata: Metadata = buildPageMetadata({
  title: '60 Patterns. Every claim cited.',
  description:
    'The complete AbarVa pattern library. 60 patterns across AI programs, sourcing, CDP, architecture, and more — each with evidence and confidence scores.',
  openGraph: {
    url: CANONICAL_URLS.patternIndex,
  },
});

export default function PatternsPage() {
  const patterns = getPublicPatterns();
  const categories = getPublicPatternCategories();
  const totalCount = patterns.length;

  return (
    <main className="pub-patterns-index">
      <div className="pub-patterns-index__container">
        <header className="pub-patterns-index__header">
          <h1 className="pub-patterns-index__title">
            {totalCount} Patterns. Every claim cited.
          </h1>
          <p className="pub-patterns-index__subtitle">
            The full AbarVa corpus — {categories.length} categories, each pattern carrying
            its thesis, applicability, evidence, and confidence score.
          </p>
        </header>

        {categories.map((category) => {
          const categoryPatterns = patterns.filter(
            (p) => getDomainLabel(p.domain) === category
          );

          if (categoryPatterns.length === 0) return null;

          return (
            <section
              key={category}
              className="pub-patterns-index__category"
              aria-label={`${category} patterns`}
            >
              <h2 className="pub-patterns-index__category-heading">
                {category}
                <span className="pub-patterns-index__category-count">
                  {categoryPatterns.length}
                </span>
              </h2>
              <ul className="pub-patterns-index__grid" role="list">
                {categoryPatterns.map((pattern) => (
                  <li key={pattern.id} className="pub-patterns-index__grid-item">
                    <PatternCard pattern={pattern} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
