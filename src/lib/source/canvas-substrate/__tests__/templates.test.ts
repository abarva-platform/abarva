import { findMissingTemplates, loadArtifactTemplate } from '../templates';
import { SOURCE_ARTIFACT_SPECS } from '../../canonical-specs';

describe('Source artifact templates · coverage', () => {
  it('every canonical artifact spec has a template file', () => {
    const missing = findMissingTemplates(SOURCE_ARTIFACT_SPECS);
    if (missing.length > 0) {
      throw new Error(
        `Missing template files for ${missing.length} artifact codes:\n` +
          missing.map((c) => `  - ${c}`).join('\n'),
      );
    }
    expect(missing).toEqual([]);
  });

  it('every template body has a level-1 markdown heading', () => {
    for (const spec of SOURCE_ARTIFACT_SPECS) {
      const template = loadArtifactTemplate(spec.code);
      expect(template).not.toBeNull();
      expect(template!.body).toMatch(/^# /m);
    }
  });

  it('every template names its stage and lead agent', () => {
    for (const spec of SOURCE_ARTIFACT_SPECS) {
      const template = loadArtifactTemplate(spec.code);
      expect(template!.body).toMatch(/\*\*Stage:\*\*/);
      expect(template!.body).toMatch(/\*\*(Lead agent|Owner role):\*\*/);
    }
  });

  it('returns null for unknown artifact code', () => {
    expect(loadArtifactTemplate('d99_unknown')).toBeNull();
  });

  it('preserves stage in the loaded template', () => {
    const t = loadArtifactTemplate('d05_scope_memo');
    expect(t?.stage).toBe('scope');
  });
});
