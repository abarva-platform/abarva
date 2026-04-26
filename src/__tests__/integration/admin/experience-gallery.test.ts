import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ExperienceGallery } from '@/components/admin/ExperienceGallery';

const componentPath = resolve(__dirname, '../../../components/admin/ExperienceGallery.tsx');
const routePath = resolve(__dirname, '../../../app/(maestro)/platform/admin/experience-gallery/page.tsx');

describe('ExperienceGallery', () => {
  it('renders all core gallery sections', () => {
    const html = renderToStaticMarkup(createElement(ExperienceGallery));

    expect(html).toContain('Brand Lockup');
    expect(html).toContain('Color System');
    expect(html).toContain('Page Archetypes');
    expect(html).toContain('Journey Progress System');
    expect(html).toContain('Agent Patterns');
    expect(html).toContain('Source Workflow Gallery');
    expect(html).toContain('Data Readiness States');
    expect(html).toContain('Artifact States');
    expect(html).toContain('Visual Acceptance Checklist');
  });

  it('renders approved brand labels and workflow labels', () => {
    const html = renderToStaticMarkup(createElement(ExperienceGallery));

    expect(html).toContain('Approved AbarVa Direction');
    expect(html).toContain('AbarVa');
    expect(html).toContain('Abar');
    expect(html).toContain('Va');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Event Canvas');
    expect(html).toContain('RFP Readiness');
    expect(html).toContain('Executive Decision');
  });

  it('renders all agent identities and canonical state labels', () => {
    const html = renderToStaticMarkup(createElement(ExperienceGallery));

    expect(html).toContain('Nexus');
    expect(html).toContain('Sentinel');
    expect(html).toContain('Atlas');
    expect(html).toContain('Steward');

    expect(html).toContain('Missing');
    expect(html).toContain('Usable Evidence');
    expect(html).toContain('Access Restricted');
    expect(html).toContain('Waived');

    expect(html).toContain('Not Started');
    expect(html).toContain('In Review');
    expect(html).toContain('Approved');
    expect(html).toContain('Archived');
  });

  it('does not include model providers or external font file imports', () => {
    const componentSource = readFileSync(componentPath, 'utf8');
    const routeSource = readFileSync(routePath, 'utf8');
    const combined = `${componentSource}\n${routeSource}`.toLowerCase();

    expect(combined).not.toContain('openai');
    expect(combined).not.toContain('anthropic');
    expect(combined).not.toContain('pinecone');
    expect(combined).not.toContain('model gateway');
    expect(combined).not.toMatch(/from ['"]next\/font\//);
    expect(combined).not.toMatch(/\.(woff2?|ttf|otf|eot)['"]/);
  });
});
