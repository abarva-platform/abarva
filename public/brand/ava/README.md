# aVa Agent Mark

Canonical runtime assets for the aVa agent mark.

- Use `/brand/ava/ava-wordmark-2tone-dark.svg` on light UI surfaces. This is the default for agent composers, docks, and ask bars because the leading `a` remains visible.
- Use `/brand/ava/ava-wordmark-2tone-light.svg` only on dark UI surfaces.
- Use `/brand/ava/ava-avatar-dark.svg` and `/brand/ava/ava-avatar-light.svg` only when the UI needs a compact avatar mark.
- PNG fallbacks live under `/brand/ava/png/`.

Product surfaces should render the mark through `AvaAskMark` rather than hand-drawing inline SVG text. That keeps Home, Intelligence, Tower, Source, and Moves on the same aVa branding.
