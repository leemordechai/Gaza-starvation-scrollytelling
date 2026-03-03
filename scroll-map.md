# Scroll Map — Gaza Scrollytelling
> Edit this file to redesign the PgDn flow, then hand it back to Claude to implement.
>
> **Legend:**
> `↓ PgDn` = snap point (page-down lands here)
> `~ free` = no snap, scrolls past naturally
> `[ sticky ]` = section pins to viewport while user scrolls through it

---

## Current Flow

```
Hero — zoomed in on face
  ↓ PgDn  (hero-phase-zoom in Hero.svelte)
Hero — zoomed out to full photo width

  ↓ PgDn
Intro lede — אנחנו מבקשים...
  ↓ PgDn  (scroll-snap-align: start on .intro-section in Intro.svelte)
Intro lede (same section, snaps to top of it)

  ↓ PgDn  (scroll-snap-align: start on .intro-bg-steps in +page.svelte)
Background step 1 — עוד לפני המלחמה...

  ↓ PgDn  (scroll-snap-align: start on each .intro-bg-step)
Background step 2 — מאז 2007 ישראל מטילה מצור...

  ~ free
Divider (gem)

  ↓ PgDn
PullQuote — Guterres quote

  ~ free
Divider (topo)

  ↓ PgDn  (scroll-snap-align: start on .bridge-block--centered)
לזמינות המזון ברצועה מאז תחילת המלחמה יש כמה מאפיינים בולטים.
מחסור במוצרי מזון בסיסיים.
תנודתיות בין זמינות יחסית לבין מחסור חמור.
שילוב בין השניים הוביל לעיתים לעליות מחירים חדות...

  ↓ PgDn  (scroll-snap-align: start on .bridge-block--snap)
השחיקה בתגובת הקהילה הבינלאומית...

  ~ free
Divider (fade)

  ↓ PgDn
Timeline — 8 events

  ~ free
Divider (fade)

  ↓ PgDn
NarrativeBlock — הלחץ הישראלי על הארגונים הבינלאומיים ועליית קרן הסיוע לעזה

  ~ free
Divider (fade)

  ↓ PgDn  (.snap-point div #1 in +page.svelte, before PullQuote2)
PullQuote — "זה לא מתן סיוע, זה הרג מתואם"

  ~ free
Divider (fade)

  ↓ PgDn
GhfVideos — ירי על מבקשי סיוע (4 video thumbnails)

  ~ free
Divider (gem)

  ↓ PgDn  (.snap-point div #2 in +page.svelte, before StatsBar)
StatsBar — 450 / 2,600 / 19,000 numbers

  ~ free
Divider (topo)

  ↓ PgDn
MeasureSection — כיצד מודדים רעב?

  ~ free
Divider (topo)

  ↓ PgDn
AidPhases — שלבי הסיוע

  ~ free
Divider (topo)

  ↓ PgDn
AidTrucks — נפח הסיוע

  ~ free
Divider (topo)

↓ PgDn
[ sticky ]
TruckRoute — מסע המשאית (6 stops, 6× viewport height)
  stop 1 — מעבר גבול
  stop 2 — הדרך
  stop 3 — כנופיות
  stop 4 — מחסום
  stop 5 — חלוקה
  stop 6 — תור
  (container ends ~1vh after stop 6)

  ~ free
section-wipe (decorative 2px line)

  ↓ PgDn  (.snap-point div #3 in +page.svelte, before FoodPrices)
FoodPrices — מחיר ההישרדות (sticky chart, 4 scroll steps)

  ~ free
Divider (topo)

  ↓ PgDn
PriceExplorer — סייר המחירים

  ↓ PgDn
FoodCalculator — מחשבון

  ~ free
Divider (topo)

  ↓ PgDn  (.snap-target class on .famine-block in +page.svelte)
Famine block — העדר הנגישות למזון הביא לתמותה מרעב

  ~ free
Divider (fade)

  ↓ PgDn
PullQuote — מאלכ witness testimony

  ~ free
Divider (gem)

  ~ free
section-wipe (decorative)

  ↓ PgDn
[ sticky ]
FoodDiversity — מגוון המזון (17 scroll steps)

  ~ free
Divider (gem)

  ↓ PgDn
Analysis — ניתוח
Footer
```

---

## Snap Points Summary (8 total)

| # | Snap target | Content at landing |
|---|---|---|
| 1 | `.hero-phase-zoom` | Hero zoomed out |
| 2 | `.intro-section` | Intro lede (אנחנו מבקשים...) |
| 3 | `.intro-bg-steps` | Background step container |
| 4 | `.intro-bg-step` ×2 | Background steps 1 and 2 individually |
| 5 | `.bridge-block--centered` | לזמינות המזון... (centered block) |
| 6 | `.bridge-block--snap` | השחיקה בתגובת הקהילה... |
| 7 | `.snap-point` div | "זה לא מתן סיוע" PullQuote |
| 8 | `.snap-point` div | StatsBar (450 / 2,600 / 19,000) |
| 9 | `.snap-point` div | FoodPrices — מחיר ההישרדות |
| 10 | `.snap-target` | Famine block title |

---

## Notes for editing

- To **add** a snap point between two sections, write `↓ PgDn` between them
- To **remove** a snap point, change `↓ PgDn` to `~ free`
- To **move** a snap point, cut the `↓ PgDn` line and paste it elsewhere
- Sections marked `[ sticky ]` cannot themselves be snap targets — snap points must go before or after them
- The TruckRoute and FoodDiversity sticky sections have their own internal scroll; page-down inside them advances the sticky content, not the page
