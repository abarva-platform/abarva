/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => function MockLink({href,children,...r}: {href:string;children:React.ReactNode;[k:string]:unknown}) { return React.createElement('a',{href,...r},children); });
jest.mock('next/navigation', () => ({ useRouter: ()=>({push:jest.fn()}), usePathname: ()=>'/', useSearchParams: ()=>new URLSearchParams() }));

// ─── ElevenPlaneDiagram ───────────────────────────────────────────────────────

describe('ElevenPlaneDiagram', () => {
  let ElevenPlaneDiagram: typeof import('@/components/public-site/ElevenPlaneDiagram').ElevenPlaneDiagram;

  beforeAll(async () => {
    ({ ElevenPlaneDiagram } = await import('@/components/public-site/ElevenPlaneDiagram'));
  });

  it('renders without crash', () => {
    const { container } = render(React.createElement(ElevenPlaneDiagram));
    expect(container.firstChild).toBeTruthy();
  });

  it('SVG contains "Identity plane"', () => {
    render(React.createElement(ElevenPlaneDiagram));
    const matches = screen.getAllByText(/Identity plane/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('SVG contains "Audit plane"', () => {
    render(React.createElement(ElevenPlaneDiagram));
    const matches = screen.getAllByText(/Audit plane/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ─── KnowledgeFabricDiagram ───────────────────────────────────────────────────

describe('KnowledgeFabricDiagram', () => {
  let KnowledgeFabricDiagram: typeof import('@/components/public-site/KnowledgeFabricDiagram').KnowledgeFabricDiagram;

  beforeAll(async () => {
    ({ KnowledgeFabricDiagram } = await import('@/components/public-site/KnowledgeFabricDiagram'));
  });

  it('renders', () => {
    const { container } = render(React.createElement(KnowledgeFabricDiagram));
    expect(container.firstChild).toBeTruthy();
  });

  it('SVG contains "Relational DB"', () => {
    render(React.createElement(KnowledgeFabricDiagram));
    const matches = screen.getAllByText(/Relational/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('SVG contains "Evidence Ledger"', () => {
    render(React.createElement(KnowledgeFabricDiagram));
    const matches = screen.getAllByText(/Evidence/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ─── FourAgentDiagram ─────────────────────────────────────────────────────────

describe('FourAgentDiagram', () => {
  let FourAgentDiagram: typeof import('@/components/public-site/FourAgentDiagram').FourAgentDiagram;

  beforeAll(async () => {
    ({ FourAgentDiagram } = await import('@/components/public-site/FourAgentDiagram'));
  });

  it('renders', () => {
    const { container } = render(React.createElement(FourAgentDiagram));
    expect(container.firstChild).toBeTruthy();
  });

  it('SVG contains "Nexus"', () => {
    render(React.createElement(FourAgentDiagram));
    const matches = screen.getAllByText(/Nexus/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('SVG contains "Steward"', () => {
    render(React.createElement(FourAgentDiagram));
    const matches = screen.getAllByText(/Steward/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ─── JwtDataPlaneDiagram ──────────────────────────────────────────────────────

describe('JwtDataPlaneDiagram', () => {
  let JwtDataPlaneDiagram: typeof import('@/components/public-site/JwtDataPlaneDiagram').JwtDataPlaneDiagram;

  beforeAll(async () => {
    ({ JwtDataPlaneDiagram } = await import('@/components/public-site/JwtDataPlaneDiagram'));
  });

  it('renders', () => {
    const { container } = render(React.createElement(JwtDataPlaneDiagram));
    expect(container.firstChild).toBeTruthy();
  });

  it('SVG contains "15-min TTL"', () => {
    render(React.createElement(JwtDataPlaneDiagram));
    const matches = screen.getAllByText(/15-min TTL/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('SVG contains "Control Plane"', () => {
    render(React.createElement(JwtDataPlaneDiagram));
    const matches = screen.getAllByText(/CONTROL PLANE/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ─── Architecture pages: default export smoke tests ──────────────────────────

describe('Architecture overview page', () => {
  it('exports a default function', async () => {
    const mod = await import('@/app/(public)/architecture/page');
    expect(typeof mod.default).toBe('function');
  });
});

describe('Knowledge fabric page', () => {
  it('exports a default function', async () => {
    const mod = await import('@/app/(public)/architecture/knowledge-fabric/page');
    expect(typeof mod.default).toBe('function');
  });
});

describe('Agents page', () => {
  it('exports a default function', async () => {
    const mod = await import('@/app/(public)/architecture/agents/page');
    expect(typeof mod.default).toBe('function');
  });
});

describe('Data plane page', () => {
  it('exports a default function', async () => {
    const mod = await import('@/app/(public)/architecture/data-plane/page');
    expect(typeof mod.default).toBe('function');
  });
});

describe('Synthesis page', () => {
  it('exports a default function', async () => {
    const mod = await import('@/app/(public)/architecture/synthesis/page');
    expect(typeof mod.default).toBe('function');
  });
});

describe('Governance page', () => {
  it('exports a default function', async () => {
    const mod = await import('@/app/(public)/architecture/governance/page');
    expect(typeof mod.default).toBe('function');
  });
});
