import { renderToStaticMarkup } from 'react-dom/server';
import { AdminCanonShellV2 } from '../AdminCanonShellV2';

jest.mock('@/components/shell/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../AdminSidebar', () => ({
  AdminSidebar: () => <nav>Admin nav</nav>,
}));

jest.mock('@/lib/reasoning/portfolio-alerts', () => ({
  buildPortfolioAlerts: () => [],
}));

describe('AdminCanonShellV2', () => {
  it('ships responsive shell CSS so admin approval actions are not clipped on narrow screens', () => {
    const html = renderToStaticMarkup(
      <AdminCanonShellV2 agentRail={<aside>Rail</aside>}>
        <main>Approval queue</main>
      </AdminCanonShellV2>,
    );

    expect(html).toContain('@media (max-width: 900px)');
    expect(html).toContain('grid-template-columns: minmax(0, 1fr) !important');
    expect(html).toContain('data-admin-main-scroll');
    expect(html).toContain('data-admin-agent-rail');
  });
});
