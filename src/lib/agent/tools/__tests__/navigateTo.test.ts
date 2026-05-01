import { navigateToTool } from '../program/navigateTo';
import { commitProgramTool } from '../program/commitProgram';
import { lookupPersonTool } from '../program/lookupPerson';
import { registerPlaceholderPersonTool } from '../program/registerPlaceholderPerson';
import type { ToolContext } from '../registry';

function makeCtx(surface: string): ToolContext {
  return {
    request: new Request('http://localhost/'),
    surface,
    writer: { write: jest.fn() },
  };
}

describe('navigate_to · canvas continuity', () => {
  it('exposes safe origination tools on the portal canvas', () => {
    for (const tool of [commitProgramTool, lookupPersonTool, registerPlaceholderPersonTool]) {
      expect(tool.surfaces).toContain('/home');
      expect(tool.surfaces).toContain('/programs');
      expect(tool.surfaces).toContain('/programs/new');
    }
  });

  it('does not auto-route new-program intent out of the current canvas', async () => {
    const ctx = makeCtx('/home');

    const result = await navigateToTool.handler(
      { target: '/programs/new', rationale: 'Origination intent' },
      ctx,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('origination_canvas_continuity_required');
      expect(result.recovery).toMatch(/Continue the program setup in the current canvas/);
    }
    expect(ctx.writer?.write).not.toHaveBeenCalled();
  });

  it('still allows normal navigation to an existing program detail page', async () => {
    const ctx = makeCtx('/home');

    const result = await navigateToTool.handler(
      { target: '/programs/apx-cdp-2026', rationale: 'Open active program' },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(ctx.writer?.write).toHaveBeenCalledWith(
      expect.stringContaining('[[artifact:navigate-to]]'),
    );
  });
});
