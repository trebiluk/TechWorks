# TechWorks / Tech Room GUI

Shared look for every Kulibert shop app. Students should not relearn chrome. **Read this before you restyle.**

Live desk: `src/lib/version.ts`. Tokens: `src/styles.css` `@theme` + `.tw-gadget`. Logo: `.tw-lockup`.

## Color (locked)

| Token | Hex | Use |
|---|---|---|
| Navy | `#050B1C` / `#06122B` | Void / page |
| Surface | `#0A1636` | Plate fill |
| Elevated | `#12285A` | Nested wells |
| Cyan | `#2EE6FF` / `#22D3EE` | Accent, live, TECH in the lockup |
| White | `#F7F9FF` | Body, WORKS in the lockup |
| Gold | `#F0D48A` | XP only — never the wall accent |
| Cleanup | `#FF6A45` | Last minutes. Not red. |
| Loss | `#FF2B3A` | Overdue / edit rings |

No purple. No holiday skins on the projector. Themes in Admin → Room are **ADA only**: TechWorks, Daylight, High vis, Contrast.

## Hull

- Plates: `.tw-gadget` + `.tw-chamfer`. Eight-cut chamfer, cyan inset line, one shine.
- Not: `rounded-full` cards, blob gradients, emoji as icons.
- Buttons: `Chip` / `Btn` / `MarkChip` from `src/components/ui.tsx`. Tap `min-h-11`.
- Type: display titles, 14px body, `font-mono` numbers, chips ALL CAPS.

## Wall (drawing lock)

Widescreen **always**. Two columns. Phones scroll sideways; they do not stack.

```
[ TECHWORKS lockup | info | MORE ]
[ NOW  — current job ]
[ 1 | 2 ]
[ 3 | 4 ]          [ BBOT ]
                   [ INFO ]
[ < ticker: period · need · clock · next > ]
```

- Left: NOW band + agenda 2×2 **fills the column**. Empty cells keep a procedure line. No second “Do this now” plate. No empty Now bars.
- Right: clock + Berty (point) + school info.
- Bottom `.tw-ticker` is **locked**. Not a hide-able plate.
- Arrange wall is teacher-only. Default layout is `dash-layout` v15.

## Motion

180–280ms. Cyan glow on live plates (`.tw-live`). Ticker 32s linear. Honor `prefers-reduced-motion`.

## Do not

- Restyle one screen in a second language.
- Put legal names on the wall.
- Invent a third button.
- Turn the ticker, NOW band, or 2×2 into optional kits.
- Point Coderized / BertyCAD / Sprocket at `vercel.app` when a `*.kulibert.net` host exists.
