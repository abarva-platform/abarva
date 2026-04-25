# Design Tokens and Usage

## Color Tokens

| Token | Use |
| --- | --- |
| `backgroundWarm` | Primary app canvas: off-white / warm ivory |
| `surface` | Standard white card/table surface |
| `surfaceWarm` | Warm white panels and drawers |
| `textPrimary` | Near-black primary text |
| `textSecondary` | Slate/gray secondary text |
| `navy` | Dark command panels and executive emphasis |
| `blueAccent` | Restrained product accent |
| `tealAccent` | Evidence/action accent, restrained |
| `borderSoft` | Warm gray borders |
| `riskAmber` | Waiting, watch, aging |
| `riskRed` | Critical or blocked only |
| `successGreen` | Complete/healthy only, minimal |

## Typography

- Page title: concise, high-trust, never marketing-copy heavy.
- Section heading: compact and scannable.
- Metric value: serif or strong display only for real metrics.
- Body copy: short, operational, specific.
- Table text: dense enough to scan, never cramped.

## Spacing

- Use 4, 8, 12, 16, 24, 32 as the default spacing scale.
- Keep first viewport compact enough to reveal data.
- Avoid large empty dark spaces.
- Avoid nested cards.

## Radius and Shadow

- Cards: 8px to 12px radius unless the local system requires otherwise.
- Tables: minimal radius, strong structure.
- Shadows: soft, shallow, and rare.
- Dark panels can have slightly deeper shadows but should be few.

## Status and Chips

- Status must be text-first.
- Color must support, not replace, the label.
- Chips should be compact.
- Avoid badge walls.

## Warning and Risk Colors

- `riskAmber` is for waiting, aging, review pending, or risk that needs attention.
- `riskRed` is for blocked, critical, unsafe, or cannot-proceed states.
- Red must be rare and paired with plain-language blocker text.
- Green is for verified complete/healthy states only.
- Never use color alone to communicate risk.

## Agent Mark Usage

- Agent marks are small and secondary.
- Use agent marks with agent names in panels and briefs.
- Do not use agent marks as decorative page art.
- Avoid repeated marks inside dense tables unless the agent is the object owner.

## Dark Panel Usage

Allowed:

- Command read.
- Executive brief.
- Agent insight.

Not allowed:

- Entire default page.
- Dense table body.
- Repeated cards across the page.
