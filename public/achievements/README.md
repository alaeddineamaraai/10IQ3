# Achievement story backgrounds

These four aerial court photos are the backgrounds for the shareable
achievement stories (see `src/components/stories/achievement-story.tsx`).

**The files currently here are PLACEHOLDERS** — flat court-coloured stand-ins
generated so the feature renders and downloads correctly. Replace each with the
real aerial photo of the same name (keep the exact filenames):

| File         | Court        |
|--------------|--------------|
| `clay.jpg`   | red clay     |
| `grass.jpg`  | green grass  |
| `blue1.jpg`  | blue hard    |
| `blue2.jpg`  | light-blue hard |

Requirements:
- **1080 × 1920** (9:16), JPG or PNG, kept as these exact filenames.
- Must be **same-origin** (served from `/public`) — do NOT swap in a remote URL,
  or the `<canvas>` becomes tainted and the "Save image" download breaks.
- Use images you own or have a license to use.

The nine achievements map onto these four photos; the five without a dedicated
shot reuse a base photo with a distinct canvas filter (see `PHOTOS` in
`achievement-story.tsx`). Replacing these four files updates all nine cards.
