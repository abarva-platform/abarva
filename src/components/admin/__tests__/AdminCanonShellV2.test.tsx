import { renderToStaticMarkup } from 'react-dom/server';
import { AdminCanonShellV2 } from '../AdminCanonShellV2';
import { StewardEditorial } from '../StewardEditorial';
import { ContextBar } from '../ContextBar';

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
      <AdminCanonShellV2 tenantName="Test Tenant" agentRail={<aside>Rail</aside>}>
        <main>Approval queue</main>
      </AdminCanonShellV2>,
    );

    expect(html).toContain('@media (max-width: 900px)');
    expect(html).toContain('grid-template-columns: minmax(0, 1fr) !important');
    expect(html).toContain('data-admin-main-scroll');
    expect(html).toContain('data-admin-agent-rail');
  });

  it('keeps static guidance on demand instead of consuming a permanent right rail', () => {
    const html = renderToStaticMarkup(
      <AdminCanonShellV2 tenantName="Test Tenant" agentRail={<aside>Rail</aside>}>
        <main>Users and access</main>
      </AdminCanonShellV2>,
    );

    expect(html).toContain('grid-template-columns:280px minmax(0, 1fr)');
    expect(html).toContain('data-admin-guidance-drawer');
    expect(html).toContain('Guidance');
    expect(html).not.toContain('grid-template-columns:280px 1fr 320px');
  });
});

describe('StewardEditorial', () => {
  it('does not expose internal context-source chips in the Maestro default card', () => {
    const html = renderToStaticMarkup(
      <StewardEditorial
        title="Access posture"
        body="Roles and SSO posture are readable."
        contextUsed={['tenant isolation guard', 'admin shell config']}
        evidenceStrength="partial"
        blocker="No SSO configured"
        primaryAction={{ label: 'Review roles', href: '/admin/users-access' }}
      />,
    );

    expect(html).not.toContain('Context used');
    expect(html).not.toContain('tenant isolation guard');
    expect(html).not.toContain('admin shell config');
    expect(html).toContain('Review roles');
  });
});

describe('ContextBar', () => {
  it('uses Maestro-facing labels and hides implementation labels', () => {
    const html = renderToStaticMarkup(
      <ContextBar
        tenant="Apex Retail"
        mode="Admin workspace"
        agent="Steward"
        data="Manifest + seeds"
        liveStatus="Deferred"
      />,
    );

    expect(html).toContain('Client');
    expect(html).toContain('Evidence source');
    expect(html).toContain('Status');
    expect(html).not.toContain('Agent');
    expect(html).not.toContain('Mode');
    expect(html).not.toContain('Steward');
    expect(html).not.toContain('Setup/Admin');
  });
});
