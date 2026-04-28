# AbarVa Brand Asset Pack

**Version:** 1.0
**Locked:** April 28, 2026
**Brand colors:** Ink black `#000000` + Signal blue `#0066CC` (IBM blue family)

This pack contains every logo asset you should ever need for the AbarVa brand across web, app, social, and print. **Do not regenerate from screenshots or rasterize SVGs at low resolution** — every asset here is at production-ready dimensions or rebuildable from the master SVG.

---

## Quick reference · which file to use when

### "I need the logo for the public website hero"
`wordmark/abarva-wordmark-color.svg` (master, scales to any size)
or `wordmark/abarva-wordmark-color-2000px.png` if a raster is required.

### "I need the favicon for app.abarva.ai"
Copy everything in `favicon/` to your web root. Add the snippet from `favicon/HTML_HEAD_SNIPPET.html` to your `<head>`.

### "I need an iOS app icon"
`monogram-a/abarva-app-icon-1024px.png` (the blue square with white A — 1024×1024 is App Store dimensions).

### "I need the OpenGraph image for link previews"
`social/og-card-default.png` (light variant) or `social/og-card-navy.png` (dark variant).
1200×630, includes wordmark + tagline.

### "I need the brand colors for the design system"
Import `tokens/brand-tokens.ts` (TypeScript) or include `tokens/brand-tokens.css` (CSS custom properties).

### "I need the logo printed on something"
Use `wordmark/abarva-wordmark-color.svg` for vector workflows.
For print: minimum width 24mm. CMYK values are on the brand color reference card.

### "I need an avatar for an internal Slack/Notion/etc."
`monogram-a/abarva-app-icon-512px.png` (no transparent background, makes a cleaner avatar).

---

## File inventory by category

### `/wordmark/` — full logotype variants

The "AbarVa" full wordmark in five color treatments. Each has an SVG master (infinite resolution) and PNG renders at 7 standard sizes.

| Variant | Use case |
|---|---|
| `abarva-wordmark-color.svg` + `*-color-{size}px.png` | Default. Black + signal blue on white. Marketing site, business cards, signatures. |
| `abarva-wordmark-transparent.svg` + `*-transparent-{size}px.png` | Same as color but with no white background fill. Use over photos, paper backgrounds, cards. |
| `abarva-wordmark-monoblue.svg` + `*-monoblue-{size}px.png` | All signal blue. Single-color reproduction (one-color print, embroidery). |
| `abarva-wordmark-monoblack.svg` + `*-monoblack-{size}px.png` | All black. Newspaper print, fax, B&W documents. |

Sizes available: 4000, 2000, 1200, 800, 400, 200, 96 px wide.

**4000px** is large enough for any conceivable web use including 4K hero banners. **96px** is the documented minimum web size; below this the wordmark loses legibility.

### `/inverse/` — for dark backgrounds

White "Abar" + signal blue "Va" — for use on dark backgrounds (navy, black, dark photos).

| Variant | Use case |
|---|---|
| `abarva-wordmark-inverse.svg` + `*-inverse-on-navy-{size}px.png` | Pre-rendered on `#0c1a3a` navy background. Copy-pastable into navy surfaces. |
| `abarva-wordmark-inverse.svg` + `*-inverse-transparent-{size}px.png` | Inverse on transparent background. Place over your own dark surface. |
| `abarva-wordmark-monowhite.svg` + `*-monowhite-{size}px.png` | All white. Use only on darker-than-navy backgrounds. |

Sizes: 4000, 2000, 1200, 800, 400, 200, 96 px.

### `/monogram-a/` — single-letter "A" (default monogram)

The "A" alone, properly cropped, in four treatments. Use for app icons, avatars, favicons, and tight spaces where the full wordmark won't fit.

| Variant | Use case |
|---|---|
| `abarva-monogram-a-black.svg` + PNGs | Black A on transparent. Default monogram for paper backgrounds. |
| `abarva-monogram-a-white.svg` + PNGs | White A on transparent. For dark backgrounds. |
| `abarva-monogram-a-blue.svg` + PNGs | Signal blue A on transparent. Brand-color emphasis variant. |
| `abarva-app-icon.svg` + PNGs | Blue rounded square + white A. **This is the iOS/Android app icon.** |

Sizes available: 1024, 512, 256, 192, 180, 128, 96, 64, 32, 16 px.

**Use the app-icon variant** anywhere a square brand mark is needed — Apple Touch Icon, Android Chrome icon, social profile picture, in-product avatar.

### `/monogram-v/` — single-letter "V" (alternate monogram)

The signal-blue "V" alone. Use as an alternate avatar, badge, or accent mark when you want the blue to dominate. Same sizes as monogram-a.

| Variant | Use case |
|---|---|
| `abarva-monogram-v-blue.svg` + PNGs | Blue V on transparent. Accent/badge use. |
| `abarva-monogram-v-white.svg` + PNGs | White V on transparent. For dark or blue backgrounds. |

### `/favicon/` — full favicon set for web

Drop everything in this folder into your web root and add the HTML snippet.

| File | Purpose |
|---|---|
| `favicon.ico` | Multi-resolution ICO (16, 32, 48). Used by older browsers and Windows. |
| `favicon-16x16.png`, `-32x32.png`, `-48x48.png` | Modern browser tab icons. |
| `apple-touch-icon.png` (180×180) | iOS home screen icon when site is bookmarked. |
| `android-chrome-192x192.png`, `-512x512.png` | Android PWA icons. |
| `safari-pinned-tab.svg` | Safari pinned-tab single-color SVG (signal blue). |
| `site.webmanifest` | PWA manifest. Edit the `name` field if needed. |
| `HTML_HEAD_SNIPPET.html` | Drop-in `<link>` and `<meta>` tags for `<head>`. |

### `/social/` — social media share cards

| File | Dimensions | Where to use |
|---|---|---|
| `og-card-default.png` + `.svg` | 1200×630 | OpenGraph (Facebook, LinkedIn, generic). Light variant. |
| `og-card-navy.png` + `.svg` | 1200×630 | Same but on navy background. Use if your brand context is dark. |
| `twitter-card.png` + `.svg` | 1200×600 | Twitter/X summary card. 2:1 aspect. |
| `linkedin-share.png` + `.svg` | 1200×627 | LinkedIn-specific share image. |

All cards include the wordmark + tagline "A knowledge layer for AI programs" + URL `app.abarva.ai`. Edit the SVG and re-render if you need a different tagline.

### `/reference/` — brand documentation

| File | Purpose |
|---|---|
| `abarva-brand-colors.svg` + `.png` | Visual reference card showing all brand colors with hex/RGB/CMYK/HSL. Print this and pin it next to whoever's designing. |
| `abarva-wordmark-construction.svg` + `.png` | Logo construction guide. Shows clear-space rule and minimum sizes. |

### `/tokens/` — design system integration

| File | Purpose |
|---|---|
| `brand-tokens.ts` | TypeScript constants. Import in `src/lib/shell/shell-tokens.ts` or any TS file. |
| `brand-tokens.css` | CSS custom properties. Include via `<link>` or `@import`. |

---

## Logo usage rules (copy these into the brand voice spec)

### Do

- Use the SVG masters whenever possible. They scale infinitely and stay sharp at any size.
- Use the inverse variants on backgrounds darker than `#888780` (stone gray).
- Use the app-icon variant for any square brand mark — favicons, app icons, social avatars.
- Maintain at least **0.5em of clear space** around the wordmark on all sides.
- Use the official PNGs at the **next-larger size** if the rendering surface needs a specific size — never upscale from a smaller PNG.

### Do not

- **Do not** stretch, rotate, or skew the wordmark.
- **Do not** recolor the wordmark to other colors. Only the five sanctioned variants exist.
- **Do not** alter the character spacing or kerning.
- **Do not** add drop shadows, glows, gradients, or other effects to the wordmark.
- **Do not** place the wordmark on busy photographic backgrounds without sufficient contrast.
- **Do not** use the wordmark below 96px wide on web or 24mm wide in print — legibility breaks.
- **Do not** combine the wordmark with other marks or names ("AbarVa | XYZ Corp" lockups require explicit approval).

### Color usage hierarchy

1. **Default:** Color wordmark on paper or white background.
2. **Dark surfaces:** Inverse wordmark on navy `#0c1a3a` or darker.
3. **Single-color reproduction (one-color printing, embroidery):** Mono blue (preferred) or mono black (fallback).
4. **Tiny sizes (favicon, in-product avatar):** Use the app-icon (blue square + white A), never the wordmark.

---

## File counts

| Category | Files |
|---|---|
| wordmark | 32 |
| inverse | 23 |
| monogram-a | 44 |
| monogram-v | 22 |
| favicon | 10 |
| social | 8 |
| reference | 4 |
| tokens | 2 |
| **Total** | **145** |

---

## Master sources

If you ever need to regenerate the pack at different sizes or modify a variant, the canonical masters are:

- `wordmark/abarva-wordmark-color.svg` — the source of every wordmark variant
- `monogram-a/abarva-app-icon.svg` — the source of every app-icon and favicon
- `tokens/brand-tokens.ts` — the source of every color value

All other files derive from these. The original input that built this pack was your `colored-logo.svg` and `transparent-logo.svg` uploaded April 28, 2026 — colors swapped from `#0384D6` (the original blue) to `#0066CC` (locked IBM blue).

---

## Integration notes for the running app

The current `src/lib/shell/shell-tokens.ts` references `#2BB0E6` as the brand blue. This needs to update to `#0066CC` per the locked brand color. Specifically:

1. Replace `#2BB0E6` with `#0066CC` everywhere in `src/lib/shell/shell-tokens.ts`
2. Audit `src/components/shell/` for any hardcoded `#2BB0E6` references and replace
3. Audit `src/app/(public)/` (when the public site work ships) and use the brand-tokens import
4. Any pattern fixtures referencing brand colors get updated via fixture-only PR

This is approximately a 30-line patch across 4-6 files. Trivial to fold into the next maintenance commit, or batch with the master orchestration's KF-6 (public pattern sample) wave since that's the wave introducing the public site brand surface.

---

**End of brand asset pack v1.**
