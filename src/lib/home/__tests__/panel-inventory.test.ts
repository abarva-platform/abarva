import { HOME_PANELS } from '../panel-inventory';

describe('HOME_PANELS', () => {
  it('keeps Home panels focused on insight, decision, action, and learning', () => {
    const byId = Object.fromEntries(HOME_PANELS.map((panel) => [panel.id, panel]));

    expect(Object.keys(byId)).toEqual([
      'overview',
      'ai-initiatives',
      'decision',
      'queue',
      'source',
      'learn',
    ]);

    expect(byId.overview?.group).toBe('insight');
    expect(byId['ai-initiatives']?.group).toBe('insight');
    expect(byId.decision?.group).toBe('decision');
    expect(byId.queue?.group).toBe('action');
    expect(byId.source?.group).toBe('action');
    expect(byId.learn?.group).toBe('learn');
  });

  it('keeps setup/admin taxonomy out of Home panel metadata', () => {
    for (const panel of HOME_PANELS) {
      expect(panel.group).not.toBe('configure');
      expect(panel.route).not.toMatch(/^\/admin(\/|$)/);
      expect(panel.route).not.toMatch(/^\/setup(\/|$)/);
    }

    expect(HOME_PANELS.map((panel) => panel.id)).not.toEqual(
      expect.arrayContaining([
        'configuration',
        'connectors',
        'data-trust',
        'agent-readiness',
        'tenant-profile',
      ]),
    );
  });
});
