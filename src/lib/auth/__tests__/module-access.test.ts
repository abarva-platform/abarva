import { resolveModuleAccess } from '../module-access';

describe('module access resolver', () => {
  it('grants Programs-only operators Programs plus common context surfaces', () => {
    const access = resolveModuleAccess({
      role: 'client',
      email: 'demo-meridian-programs+clerk_test@abarva.com',
      publicMetadata: { moduleAccess: ['programs'] },
    });

    expect(access.modules).toEqual(['programs', 'intelligence', 'tower']);
    expect(access.modules).not.toContain('source');
    expect(access.modules).not.toContain('setup');
    expect(access.noWorkspaceAssigned).toBe(false);
  });

  it('grants Source-only operators Source plus common context surfaces', () => {
    const access = resolveModuleAccess({
      role: 'client',
      email: 'demo-meridian-source+clerk_test@abarva.com',
      publicMetadata: { moduleAccess: ['source'] },
    });

    expect(access.modules).toEqual(['source', 'intelligence', 'tower']);
    expect(access.modules).not.toContain('programs');
    expect(access.modules).not.toContain('setup');
    expect(access.noWorkspaceAssigned).toBe(false);
  });

  it('treats an explicit empty moduleAccess array as signed in but unassigned', () => {
    const access = resolveModuleAccess({
      role: 'client',
      email: 'pending-user@example.com',
      publicMetadata: { moduleAccess: [] },
    });

    expect(access.modules).toEqual([]);
    expect(access.explicit).toBe(true);
    expect(access.noWorkspaceAssigned).toBe(true);
  });

  it('keeps Setup limited to client-pinned admin/demo allowlist users', () => {
    const access = resolveModuleAccess({
      role: 'client',
      email: 'demo-meridian+clerk_test@abarva.com',
      publicMetadata: { moduleAccess: ['programs'] },
    });

    expect(access.modules).toContain('setup');
    expect(access.modules).toContain('programs');
    expect(access.modules).toContain('source');
  });
});
