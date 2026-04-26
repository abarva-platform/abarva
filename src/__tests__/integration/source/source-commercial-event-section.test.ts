/**
 * SRC27 — SourceCommercialEventSection type-shape tests.
 * No React rendering, no jsdom. Pure file/type verification.
 */

import * as fs from 'fs';
import * as path from 'path';

const SECTION_FILE = path.resolve(
  __dirname,
  '../../../components/source/SourceCommercialEventSection.tsx',
);

const PAGE_FILE = path.resolve(
  __dirname,
  '../../../app/(maestro)/source/events/[eventId]/page.tsx',
);

describe('SourceCommercialEventSection — type shape', () => {
  it('component file exists at expected path', () => {
    expect(fs.existsSync(SECTION_FILE)).toBe(true);
  });

  it('event page file exists at expected path', () => {
    expect(fs.existsSync(PAGE_FILE)).toBe(true);
  });

  it('SourceCommercialEventSection exports as a function', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../../components/source/SourceCommercialEventSection');
    expect(typeof mod.SourceCommercialEventSection).toBe('function');
  });

  it('SourceCommercialEventSectionProps interface has eventId, eventName, accountName fields', () => {
    // Verify by constructing a value that satisfies the type
    const props: import('../../../components/source/SourceCommercialEventSection').SourceCommercialEventSectionProps =
      {
        eventId: 'evt-001',
        eventName: 'Cloud Platform RFP',
        accountName: 'Apex Retail',
      };
    expect(props.eventId).toBe('evt-001');
    expect(props.eventName).toBe('Cloud Platform RFP');
    expect(props.accountName).toBe('Apex Retail');
  });

  it('event page file imports SourceCommercialEventSection', () => {
    const source = fs.readFileSync(PAGE_FILE, 'utf-8');
    expect(source).toContain('SourceCommercialEventSection');
  });

  it('component source contains no teal color #14B8A6', () => {
    const source = fs.readFileSync(SECTION_FILE, 'utf-8');
    expect(source).not.toContain('#14B8A6');
  });

  it('component source contains no teal color #0E9F8C', () => {
    const source = fs.readFileSync(SECTION_FILE, 'utf-8');
    expect(source).not.toContain('#0E9F8C');
  });

  it('component source contains caveat text about deterministic/seed-backed', () => {
    const source = fs.readFileSync(SECTION_FILE, 'utf-8');
    expect(source).toContain('deterministic/seed-backed');
  });

  it('component source imports SourceCommercialHub', () => {
    const source = fs.readFileSync(SECTION_FILE, 'utf-8');
    expect(source).toContain('SourceCommercialHub');
  });
});
