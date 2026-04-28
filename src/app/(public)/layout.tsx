import type { Metadata } from 'next';
import { TopNav } from '@/components/public-site/TopNav';
import { Footer } from '@/components/public-site/Footer';
import { seoDefaults } from '@/lib/public-site/seo-defaults';
import '@/styles/public-site-tokens.css';
import '@/styles/public-site.css';

export const metadata: Metadata = seoDefaults;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pub-root">
      <TopNav />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
