import { renderToStaticMarkup } from 'react-dom/server';
import ProductDocsPage from '../page';
import {
  HELP_CENTER_ARTICLES,
  HELP_CENTER_SUPPORT_PATHS,
  HELP_CENTER_WORKFLOWS,
} from '@/lib/help-center/product-docs';

jest.mock('@/components/shell/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/admin/AdminSidebar', () => ({
  AdminSidebar: () => <nav>Admin nav</nav>,
}));

jest.mock('@/lib/reasoning/portfolio-alerts', () => ({
  buildPortfolioAlerts: () => [],
}));

describe('/docs product help center', () => {
  it('renders the customer-safe module guide taxonomy', () => {
    const html = renderToStaticMarkup(<ProductDocsPage />);

    expect(html).toContain('AbarVa product help center');
    expect(html).toContain('Home is for insight. Admin is for setup. Decisions stay human-owned.');

    for (const article of HELP_CENTER_ARTICLES) {
      expect(html).toContain(article.title);
      expect(html).toContain(article.summary);
    }

    expect(html).toContain('/admin/setup');
    expect(html).toContain('Data loading is scoped to one client workspace at a time.');
  });

  it('renders workflow and escalation guidance without security/legal internals', () => {
    const html = renderToStaticMarkup(<ProductDocsPage />);

    for (const workflow of HELP_CENTER_WORKFLOWS) {
      expect(html).toContain(workflow.title);
    }

    for (const supportPath of HELP_CENTER_SUPPORT_PATHS) {
      expect(html).toContain(supportPath);
    }

    expect(html).not.toMatch(/SOC 2|DPA|penetration test|secret|credential/i);
  });
});
