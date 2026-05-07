/**
 * @jest-environment jsdom
 */
/**
 * SetupActThree templates · Setup Fix Package PR 4.
 *
 * Locks in the Act 3 upload-template contract: each of the four
 * scoped segments (01, 03, 06, 12) renders a Format preview block
 * + a "Download <format> template ↓" link pointing at the static
 * file under public/setup-templates/. Other segments render
 * without the template block (no regression on non-scoped rows).
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';

import { SetupActThree } from '../SetupActThree';
import type { CapabilityGainEntry } from '@/lib/admin/setup-acts-registry';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const TEMPLATE_DIR = path.join(REPO_ROOT, 'public', 'setup-templates');

function gain(
  segmentId: string,
  segmentName: string,
  rank = 1,
): CapabilityGainEntry {
  return {
    id: `gain.${segmentId}`,
    targetSegmentId: segmentId,
    targetSegmentName: segmentName,
    capabilityGained: `Capability for ${segmentName}`,
    todayPreview: `Today: nothing for ${segmentName}.`,
    afterPreview: `After: full ${segmentName}.`,
    impactedPrograms: [],
    rank,
  };
}

describe('SetupActThree · upload templates (PR 4)', () => {
  it.each([
    { segmentId: '01', file: 'enterprise-profile.yaml', format: 'YAML' },
    { segmentId: '03', file: 'it-system-landscape.csv', format: 'CSV' },
    { segmentId: '06', file: 'program-inventory.csv', format: 'CSV' },
    { segmentId: '12', file: 'compliance-and-regulatory.csv', format: 'CSV' },
  ])(
    'segment $segmentId — template file $file exists in public/setup-templates',
    ({ file }) => {
      expect(fs.existsSync(path.join(TEMPLATE_DIR, file))).toBe(true);
    },
  );

  it('renders Download CTA + Format preview for each of the 4 templated segments', () => {
    const gains: CapabilityGainEntry[] = [
      gain('01', 'Enterprise Profile', 1),
      gain('03', 'IT System Landscape', 2),
      gain('06', 'Program Inventory', 3),
      gain('12', 'Compliance and Regulatory', 4),
    ];
    render(<SetupActThree gains={gains} />);
    for (const g of gains) {
      const dl = screen.getByTestId(`admin-setup-gain-template-${g.id}`);
      expect(dl).toBeInTheDocument();
      expect(dl).toHaveAttribute('href', expect.stringMatching(/^\/setup-templates\//));
      expect(dl).toHaveAttribute('download');
      expect(screen.getByTestId(`admin-setup-gain-format-${g.id}`)).toBeInTheDocument();
    }
  });

  it('does NOT render template block for non-scoped segments', () => {
    const otherGain = gain('05', 'KPI Dictionary', 1);
    render(<SetupActThree gains={[otherGain]} />);
    expect(screen.queryByTestId(`admin-setup-gain-template-${otherGain.id}`)).toBeNull();
    expect(screen.queryByTestId(`admin-setup-gain-format-${otherGain.id}`)).toBeNull();
    // Existing Add CTA still renders.
    expect(screen.getByTestId(`admin-setup-gain-cta-${otherGain.id}`)).toBeInTheDocument();
  });

  it('compliance template (CSV) preview shows column header + example row', () => {
    const g = gain('12', 'Compliance and Regulatory', 1);
    render(<SetupActThree gains={[g]} />);
    const preview = screen.getByTestId(`admin-setup-gain-format-${g.id}`);
    expect(preview.textContent).toContain('control_framework,control_id,owner');
    expect(preview.textContent).toContain('GLBA Safeguards Rule');
  });

  it.each([
    { file: 'enterprise-profile.yaml', mustContain: 'legal_entity:' },
    { file: 'compliance-and-regulatory.csv', mustContain: 'control_framework,control_id' },
    { file: 'it-system-landscape.csv', mustContain: 'system_name,domain,authoritative_for' },
    { file: 'program-inventory.csv', mustContain: 'program_name,phase,sponsor' },
  ])('template $file contains the documented header(s)', ({ file, mustContain }) => {
    const contents = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf8');
    expect(contents).toContain(mustContain);
  });
});
