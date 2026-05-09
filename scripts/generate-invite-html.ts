// scripts/generate-invite-html.ts
//
// Renders one self-contained HTML file per CXO persona, suitable for
// emailing or sharing as an attachment. Same content as the hosted
// /invite/<slug> route, but inline-styled and fully offline (no
// external CSS, fonts pulled from Google Fonts CDN, logo embedded
// from the brand asset SVG).
//
// Run:
//   npm run auth:generate-invites
//
// Outputs:
//   out/invites/cio-apex.html
//   out/invites/cdo-apex.html
//   out/invites/cdio-meridian-health.html
//   out/invites/cio-firstcapital.html

import fs from 'node:fs';
import path from 'node:path';
import { CXO_PERSONAS, type CxoPersona } from '../src/lib/auth/cxo-personas';

const DEMO_PASSWORD = 'Demo2026!';
const DEMO_CODE = '424242';
const SIGN_IN_URL = 'https://app.abarva.ai/sign-in';
const HOSTED_INVITE_BASE = 'https://app.abarva.ai/invite';

const LOGO_SVG_PATH = path.resolve(process.cwd(), 'public/brand/abarva-logo-inverse.svg');
const OUTPUT_DIR = path.resolve(process.cwd(), 'out/invites');

function loadInverseLogo(): string {
  // Inline-embed the SVG so the HTML is fully self-contained.
  return fs.readFileSync(LOGO_SVG_PATH, 'utf-8').replace(/<\?xml[^>]*\?>/, '');
}

function renderInvite(persona: CxoPersona, logoSvg: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(persona.personaName)} · Your AbarVa workspace</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  body {
    margin: 0;
    background: #000000;
    color: #F5F7FB;
    font-family: Inter, system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    box-sizing: border-box;
  }
  .panel {
    width: 100%;
    max-width: 560px;
    background: rgba(7, 14, 24, 0.92);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 24px 70px rgba(0,0,0,0.45);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }
  .brand svg { height: 24px; width: auto; display: block; }
  .brand .divider { width: 1px; height: 18px; background: rgba(255,255,255,0.10); }
  .brand .tagline {
    font-size: 13.5px;
    color: #F5F7FB;
    line-height: 1;
    letter-spacing: -0.005em;
  }
  .brand .tagline strong { font-weight: 600; }
  .persona-pill {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    margin-bottom: 28px;
  }
  .persona-pill .monogram {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: ${persona.monogramBg};
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.02em;
  }
  .persona-pill .label {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 13px;
    font-weight: 600;
    color: #F5F7FB;
    margin-bottom: 3px;
  }
  .persona-pill .sub {
    font-size: 12.5px;
    color: rgba(255,255,255,0.72);
    line-height: 1.3;
  }
  h1 {
    font-family: Fraunces, Georgia, serif;
    font-size: 30px;
    font-weight: 400;
    color: #F5F7FB;
    letter-spacing: -0.018em;
    line-height: 1.15;
    margin: 0 0 12px;
  }
  p { font-size: 14.5px; line-height: 1.6; color: rgba(255,255,255,0.72); margin: 0 0 18px; }
  p strong { color: #F5F7FB; font-weight: 600; }
  .bio { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.72); margin: 0 0 28px; }
  .teaser {
    padding: 14px 16px;
    border-radius: 10px;
    background: rgba(0,102,204,0.08);
    border: 1px solid rgba(0,102,204,0.30);
    margin-bottom: 28px;
  }
  .teaser .eyebrow {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #0066CC;
    margin-bottom: 6px;
  }
  .teaser .body { font-size: 13.5px; color: #F5F7FB; line-height: 1.55; }
  .creds {
    padding: 16px 18px;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    margin-bottom: 22px;
  }
  .cred-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 12px;
    align-items: baseline;
    margin-bottom: 10px;
  }
  .cred-row:last-child { margin-bottom: 0; }
  .cred-row .lbl {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
  }
  .cred-row .val {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 13px;
    color: #F5F7FB;
    word-break: break-all;
  }
  .cta {
    display: block;
    width: 100%;
    background: #0066CC;
    color: #FFFFFF;
    font-size: 14.5px;
    font-weight: 600;
    padding: 14px 16px;
    border-radius: 8px;
    text-decoration: none;
    text-align: center;
    margin-bottom: 14px;
    letter-spacing: -0.005em;
    box-sizing: border-box;
  }
  .footer {
    font-size: 11.5px;
    color: rgba(255,255,255,0.55);
    text-align: center;
    line-height: 1.5;
  }
  .footer a { color: rgba(255,255,255,0.72); text-decoration: underline; }
</style>
</head>
<body>
  <div class="panel">
    <div class="brand">
      ${logoSvg}
      <div class="divider"></div>
      <div class="tagline"><strong>AI</strong> Success Platform</div>
    </div>

    <div class="persona-pill">
      <div class="monogram">${escape(persona.monogram)}</div>
      <div>
        <div class="label">${escape(persona.shortLabel)}</div>
        <div class="sub">${escape(persona.personaName)} · ${escape(persona.titleFull)} · ${escape(persona.tenant)}</div>
      </div>
    </div>

    <h1>Welcome, ${escape(persona.firstName)}.</h1>
    <p>Your AbarVa workspace is ready. You&rsquo;re signing in as <strong>${escape(persona.personaName)}</strong>, ${escape(persona.titleFull)} at ${escape(persona.tenant)}.</p>
    <p class="bio">${escape(persona.bioLong)}</p>

    <div class="teaser">
      <div class="eyebrow">What you&rsquo;ll see</div>
      <div class="body">${escape(persona.workspaceTeaser)}</div>
    </div>

    <div class="creds">
      <div class="cred-row"><div class="lbl">Sign-in URL</div><div class="val">${SIGN_IN_URL}</div></div>
      <div class="cred-row"><div class="lbl">Email</div><div class="val">${escape(persona.email)}</div></div>
      <div class="cred-row"><div class="lbl">Verification code</div><div class="val">${DEMO_CODE}</div></div>
      <div class="cred-row"><div class="lbl">Password (alt)</div><div class="val">${DEMO_PASSWORD}</div></div>
    </div>

    <a class="cta" href="${SIGN_IN_URL}">Sign in to your workspace &rarr;</a>

    <div class="footer">
      Hosted invite: <a href="${HOSTED_INVITE_BASE}/${persona.slug}">${HOSTED_INVITE_BASE}/${persona.slug}</a><br />
      Need help? Contact <a href="mailto:anand.sundaram@thesundaram.com">anand.sundaram@thesundaram.com</a>
    </div>
  </div>
</body>
</html>
`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const logoSvg = loadInverseLogo();

  console.log(`Generating ${CXO_PERSONAS.length} invite HTML files into ${OUTPUT_DIR}\n`);

  for (const persona of CXO_PERSONAS) {
    const html = renderInvite(persona, logoSvg);
    const file = path.join(OUTPUT_DIR, `${persona.slug}.html`);
    fs.writeFileSync(file, html, 'utf-8');
    console.log(`  ✓ ${persona.slug}.html · ${persona.personaName} (${persona.titleShort} · ${persona.tenant})`);
  }

  console.log(`\nDone. Open any file in a browser, attach to email, or share by URL.`);
  console.log(`Hosted versions live at: ${HOSTED_INVITE_BASE}/<slug>`);
}

main();
