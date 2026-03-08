<script lang="ts">
  import { reveal } from '$lib/actions/reveal';

  // ── Quotes — Israeli officials, all from intentQuotes.json ───────────────────
  const quotes = [
    {
      id: 'galant-1',
      sortKey: 2023.1009,
      date: '9.10.23',
      speaker: 'יואב גלנט',
      role: 'שר הביטחון',
      context: 'הצהרה בווידאו לחיילים',
      text: '"לא יהיה חשמל, לא יהיה מזון, לא יהיה דלק — הכל סגור. אנחנו נלחמים בחיות אדם ואנחנו נוהגים בהתאם."',
    },
    {
      id: 'ben-gvir-1',
      sortKey: 2023.1017,
      date: '17.10.23',
      speaker: 'איתמר בן גביר',
      role: 'שר הביטחון הלאומי',
      context: 'פוסט ברשת X',
      text: '"הדבר היחיד שצריך להכניס לעזה הוא מאות טונות חומר נפץ של חיל האוויר, לא גרם של סיוע הומניטרי."',
    },
    {
      id: 'katz-1',
      sortKey: 2023.1023,
      date: '23.10.23',
      speaker: 'ישראל כץ',
      role: 'שר האנרגיה',
      context: 'פוסט ברשת X',
      text: '"אף מתג חשמל לא יורם, שיבר מים לא ייפתח ומשאית דלק לא תיכנס — עד להשבת החטופים הישראלים הביתה."',
    },
    {
      id: 'gotlib-1',
      sortKey: 2023.1029,
      date: '23.10.23',
      speaker: 'טלי גוטליב',
      role: 'ח״כ, הליכוד',
      context: 'נאום במליאת הכנסת',
      text: '"בלי רעב וצמא אצל האוכלוסייה העזתית לא נצליח לגייס מודיעין, לא נצליח לשחד אנשים, באוכל, בשתייה, בתרופות."',
    },
    {
      id: 'smotrich-1',
      sortKey: 2023.1104,
      date: '4.11.23',
      speaker: 'בצלאל סמוטריץ׳',
      role: 'שר האוצר',
      context: 'ראיון בערוץ 12',
      text: '"אסור בשום פנים ואופן להכניס דלק לעזה."',
    },
    {
      id: 'eliyahu',
      sortKey: 2023.1105,
      date: '5.11.23',
      speaker: 'עמיחי אליהו',
      role: 'שר המורשת',
      context: 'ראיון ברדיו קול ברמה',
      text: '"לנאצים לא היינו מכניסים סיוע הומניטרי. אין דבר כזה בלתי מעורבים בעזה."',
    },
    {
      id: 'netanyahu',
      sortKey: 2024.0127,
      date: '27.1.24',
      speaker: 'בנימין נתניהו',
      role: 'ראש הממשלה',
      context: 'מסיבת עיתונאים',
      text: '"בלי סיוע הומניטרי מינימלי לא נוכל להשלים את המשימה והיעדים שלנו. לכן אנחנו נותנים את זה."',
    },
    {
      id: 'smotrich-2',
      sortKey: 2024.0805,
      date: '5.8.24',
      speaker: 'בצלאל סמוטריץ׳',
      role: 'שר האוצר',
      context: 'נאום בכנס',
      text: '"אף אחד לא ייתן לנו להמית ברעב שני מיליון אזרחים, למרות שזה אולי צודק ומוסרי עד שלא מחזירים את החטופים שלנו."',
    },
    {
      id: 'knesset-8',
      sortKey: 2024.1231,
      date: '31.12.24',
      speaker: 'שמונה ח״כים מהקואליציה',
      role: 'ועדת החוץ והביטחון',
      context: 'מכתב רשמי לשר הביטחון',
      text: '"(1) השמדה מרחוק של כל מקורות האנרגיה. (2) השמדה של כל מקורות המזון לרבות מחסנים ומים. (3) חיסול מרחוק של כל מי שנע במרחב."',
    },
    {
      id: 'kish',
      sortKey: 2025.0302,
      date: '2.3.25',
      speaker: 'יואב קיש',
      role: 'שר החינוך',
      context: 'פוסט ברשת X',
      text: '"ההחלטה לעצור את כניסת הסיוע ההומניטרי עד להחזרת החטופים — חשובה ונכונה."',
    },
    {
      id: 'smotrich-3',
      sortKey: 2025.0407,
      date: '7.4.25',
      speaker: 'בצלאל סמוטריץ׳',
      role: 'שר האוצר',
      context: 'ועידת ידיעות אחרונות',
      text: '"ריד מיי ליפס. לא ייכנס אפילו גרגר חיטה באופן שיגיע לחמאס."',
    },
    {
      id: 'katz-2',
      sortKey: 2025.0416,
      date: '16.4.25',
      speaker: 'ישראל כץ',
      role: 'שר הביטחון',
      context: 'הצהרה רשמית',
      text: '"מניעת הסיוע ההומניטרי לעזה היא אחד מכלי הלחץ המרכזיים... אף אחד לא עומד במציאות הנוכחית להכניס שום סיוע הומניטרי לעזה."',
    },
    {
      id: 'ben-gvir-2',
      sortKey: 2025.0423,
      date: '23.4.25',
      speaker: 'איתמר בן גביר',
      role: 'שר הביטחון הלאומי',
      context: 'פוסט ברשת X',
      text: '"יש להפציץ את מאגרי המזון והסיוע על מנת לייצר לחץ צבאי ומדיני כדי להחזיר את חטופינו הביתה."',
    },
    {
      id: 'saada',
      sortKey: 2025.0425,
      date: '25.4.25',
      speaker: 'משה סעדה',
      role: 'ח״כ, הליכוד',
      context: 'ראיון בערוץ 14',
      text: '"אני כן ארעיב עזתים. כן וכן. זו החובה שלנו... אני מוכנה להרעיב את העזתים, לעשות מצור על מלא מלא."',
    },
    {
      id: 'gotlib-2',
      sortKey: 2025.0506,
      date: '6.5.25',
      speaker: 'טלי גוטליב',
      role: 'ח״כ, הליכוד',
      context: 'ראיון לערוץ 7',
      text: '"לא לתת כלום [לא] פירור ולא גרגר — ואני מוכנה שיצטטו אותי בכל מקום בעולם."',
    },
    {
      id: 'saar',
      sortKey: 2025.0514,
      date: '14.5.25',
      speaker: 'גדעון סער',
      role: 'שר החוץ',
      context: 'כנס עיתונאים בטוקיו',
      text: '"אין רעב ברצועת עזה. זה פשוט לא נכון."',
    },
  ];

  // ── Timeline events ──────────────────────────────────────────────────────────
  const events = [
    {
      id: 'ev1',
      sortKey: 2023.1007,
      date: '7–18 באוקטובר 2023',
      title: 'התקפת חמאס; מצור מוחלט על הרצועה',
      detail: 'בתגובה למתקפת החמאס, ישראל מטילה מצור מוחלט על הרצועה. החסימה מוסרת לאחר עשרה ימים.',
      dotColor: 'red',
    },
    {
      id: 'ev2',
      sortKey: 2023.1028,
      date: '28 באוקטובר 2023',
      title: 'תחילת המבצע הקרקעי',
      detail: 'גל של מאות אלפי עקורים, והרס מתגלגל של תשתית אזרחית — חנויות מזון, מאפיות ומאגרי מים.',
      dotColor: 'red',
    },
    {
      id: 'ev3',
      sortKey: 2023.1124,
      date: '24 בנובמבר 2023',
      title: 'הפסקת אש ראשונה',
      detail: 'לצד שחרור חטופים, התאפשרה כניסה זמנית של סיוע לרצועה — שהסתיימה עם קריסת הפסקת האש.',
      dotColor: 'gold',
    },
    {
      id: 'ev4',
      sortKey: 2024.09,
      date: 'סתיו 2024',
      title: 'תוכנית האלופים',
      detail: 'בלימה מוחלטת של סיוע לצפון הרצועה, בו נותרו עשרות אלפי אנשים.',
      dotColor: 'gold',
    },
    {
      id: 'ev5',
      sortKey: 2025.0117,
      date: '17 בינואר 2025',
      title: 'הפסקת האש השנייה',
      detail: 'במהלך הפסקת האש השנייה התאפשרה כניסת סיוע בהיקף רחב למשך שישה שבועות.',
      dotColor: 'gold',
    },
    {
      id: 'ev6',
      sortKey: 2025.0302,
      date: '2 במרץ 2025',
      title: 'מצור מוחלט על הרצועה',
      detail: 'ישראל מכריזה על בלימה מוחלטת של סיוע. המצור נמשך חודשיים וחצי.',
      dotColor: 'red',
    },
    {
      id: 'ev7',
      sortKey: 2025.0527,
      date: '27 במאי 2025',
      title: 'פתיחת מתחמי קרן הסיוע לעזה',
      detail: 'ישראל משיקה ארבעה מתחמי חלוקת מזון, כולם מרוחקים מריכוזי האוכלוסיה.',
      dotColor: 'gold',
    },
    {
      id: 'ev8',
      sortKey: 2025.07,
      date: 'יוני–יולי 2025',
      title: 'התמוטטות תזונתית',
      detail: 'האו"ם מכריז על רעב כבד. תמונות של שלדי אדם מתפרסמות בעולם.',
      dotColor: 'gold',
    },
    {
      id: 'ev9',
      sortKey: 2025.09,
      date: 'אוגוסט–ספטמבר 2025',
      title: 'לחץ בינלאומי',
      detail: 'הלחץ הבינלאומי מוביל לעלייה בכניסת הסיוע לרצועה.',
      dotColor: 'gold',
    },
    {
      id: 'ev10',
      sortKey: 2025.1010,
      date: '10 באוקטובר 2025',
      title: 'הפסקת האש השלישית',
      detail: 'לצד שחרור אחרוני החטופים, מתאפשרת כניסה של מזון — תוך העדפת משאיות מסחריות.',
      dotColor: 'gold',
    },
  ];

  // ── Expand state ─────────────────────────────────────────────────────────────
  let openSet = $state(new Set<string>());
  function toggle(id: string) {
    const next = new Set(openSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openSet = next;
  }

  // ── Position items on shared grid rows ───────────────────────────────────────
  // Each column advances independently; items on opposite sides can share rows
  // (overlap). We merge both lists sorted by sortKey, then assign grid rows
  // separately per column — events on rows 1,3,5,… and quotes on their own
  // counter, with each side being allowed to be 1 row behind the other.
  type Placed<T> = T & { gridRow: number };

  function placeItems() {
    const evSorted = [...events].sort((a, b) => a.sortKey - b.sortKey);
    const qSorted  = [...quotes].sort((a, b) => a.sortKey - b.sortKey);

    // Interleave: assign grid rows so items on the same row overlap
    let evRow = 1;
    let qRow  = 1;

    // Walk both lists simultaneously by sortKey
    const placedEvents: Placed<typeof evSorted[0]>[] = [];
    const placedQuotes: Placed<typeof qSorted[0]>[]  = [];

    let ei = 0, qi = 0;
    while (ei < evSorted.length || qi < qSorted.length) {
      const ev = ei < evSorted.length ? evSorted[ei] : null;
      const q  = qi < qSorted.length  ? qSorted[qi]  : null;

      if (!q || (ev && ev.sortKey <= q.sortKey)) {
        // Place event — align with quote column roughly (allow one row behind)
        const row = Math.max(evRow, qRow - 1);
        placedEvents.push({ ...ev!, gridRow: row });
        evRow = row + 2;
        ei++;
      } else {
        // Place quote — align with event column roughly
        const row = Math.max(qRow, evRow - 1);
        placedQuotes.push({ ...q!, gridRow: row });
        qRow = row + 2;
        qi++;
      }
    }

    const totalRows = Math.max(evRow, qRow) - 1;
    return { placedEvents, placedQuotes, totalRows };
  }

  const { placedEvents, placedQuotes, totalRows } = placeItems();
</script>

<div class="tq-dev-wrapper">
  <div class="tq-header">
    <p class="tq-label">ציר זמן</p>
    <h2 class="tq-title">כרוניקה של רעב — בדברים ובעובדות</h2>
    <p class="tq-sub">אירועים מרכזיים (ימין) לצד הצהרות בכירים ישראלים על מניעת הסיוע (שמאל)</p>
  </div>

  <div class="tq-legend" dir="rtl">
    <span class="tq-legend-item">
      <span class="tq-legend-dot tq-legend-dot--gold"></span> אירוע מרכזי
    </span>
    <span class="tq-legend-item">
      <span class="tq-legend-dot tq-legend-dot--red"></span> מצור / חסימה
    </span>
    <span class="tq-legend-item">
      <span class="tq-legend-dot tq-legend-dot--quote"></span> ציטוט בכיר
    </span>
  </div>

  <!-- dir=rtl: right col = events, left col = quotes -->
  <div class="tq-track" dir="rtl" style="--total-rows: {totalRows}">
    <!-- Absolute central spine -->
    <div class="tq-spine" aria-hidden="true"></div>

    <!-- Event cards (right column in RTL) -->
    {#each placedEvents as ev (ev.id)}
      <div
        class="tq-item tq-item--event"
        style="grid-row: {ev.gridRow}"
        use:reveal
      >
        <!-- Connector arm toward spine -->
        <div class="tq-arm tq-arm--event" aria-hidden="true"></div>
        <!-- Dot -->
        <div class="tq-dot" class:tq-dot--red={ev.dotColor === 'red'}></div>
        <!-- Card -->
        <div
          class="tq-card tq-card--event"
          class:tq-card--open={openSet.has(ev.id)}
          role="button"
          tabindex="0"
          aria-expanded={openSet.has(ev.id)}
          onclick={() => toggle(ev.id)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(ev.id); } }}
        >
          <div class="tq-meta">{ev.date}</div>
          <div class="tq-card-title">{ev.title}</div>
          <div class="tq-detail" class:open={openSet.has(ev.id)}>
            <div class="tq-detail-inner"><p>{ev.detail}</p></div>
          </div>
          <span class="tq-hint">{openSet.has(ev.id) ? 'סגור ▴' : 'פרטים ▾'}</span>
        </div>
      </div>
    {/each}

    <!-- Quote cards (left column in RTL) -->
    {#each placedQuotes as q (q.id)}
      <div
        class="tq-item tq-item--quote"
        style="grid-row: {q.gridRow}"
        use:reveal
      >
        <!-- Card -->
        <blockquote class="tq-card tq-card--quote">
          <p class="tq-quote-text">{q.text}</p>
          <footer class="tq-quote-footer">
            <span class="tq-quote-speaker">{q.speaker}</span>
            <span class="tq-quote-meta">{q.role} · {q.context} · {q.date}</span>
          </footer>
        </blockquote>
        <!-- Dot -->
        <div class="tq-dot tq-dot--quote"></div>
        <!-- Connector arm toward spine -->
        <div class="tq-arm tq-arm--quote" aria-hidden="true"></div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* ── CSS custom properties (fallbacks for dev route without app.css) ── */
  .tq-dev-wrapper {
    --_bg:          var(--bg,          #ffffff);
    --_bg-card:     var(--bg-card,     #f7f2f0);
    --_bg-section:  var(--bg-section,  #f2ebe8);
    --_accent:      var(--accent,      #9b2a21);
    --_accent-lt:   var(--accent-light,#c03528);
    --_sand:        var(--sand,        #8b4a3a);
    --_text:        var(--text,        #1a1210);
    --_muted:       var(--text-muted,  #6a5855);
    --_border:      var(--border-mid,  #d8c8c4);
    --_f-disp:      var(--font-disp,   'Frank Ruhl Libre', Georgia, serif);
    --_f-ui:        var(--font-ui,     'Rubik', 'Assistant', sans-serif);
    --_f-body:      var(--font-body,   'Heebo', Georgia, serif);

    /* Unified type scale */
    --tq-fs-meta:    0.62rem;
    --tq-fs-body:    0.78rem;
    --tq-fs-title:   0.82rem;
    --tq-fs-speaker: 0.72rem;

    /* Spine/connector geometry */
    --tq-spine-w:   2px;
    --tq-arm-h:     1px;
    --tq-dot-size:  12px;
    --tq-gap:       10px;   /* gap between spine center and dot/card */

    background: var(--_bg);
    min-height: 100vh;
    padding: clamp(2rem, 6vw, 4rem) 0;
    font-family: var(--_f-body);
    color: var(--_text);
  }

  /* ── Header ── */
  .tq-header {
    max-width: 820px;
    margin: 0 auto 1.25rem;
    padding: 0 clamp(1rem, 5vw, 2.5rem);
    text-align: center;
    direction: rtl;
  }
  .tq-label {
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-meta);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--_accent);
    margin-bottom: 0.4rem;
  }
  .tq-title {
    font-family: var(--_f-disp);
    font-size: clamp(1.4rem, 1.1rem + 1.5vw, 2rem);
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 0.4rem;
  }
  .tq-sub {
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-meta);
    color: var(--_muted);
    line-height: 1.5;
  }

  /* ── Legend ── */
  .tq-legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin: 0 auto 2rem;
    padding: 0 1rem;
  }
  .tq-legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-meta);
    color: var(--_muted);
  }
  .tq-legend-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .tq-legend-dot--gold  { background: var(--_accent); }
  .tq-legend-dot--red   { background: var(--_accent-lt); }
  .tq-legend-dot--quote {
    background: var(--_sand);
    border: 1.5px dashed var(--_sand);
    background-clip: content-box;
    padding: 1px;
  }

  /* ── Track: CSS Grid with named areas ── */
  /*
    3 columns: [event col] [spine] [quote col]
    Each item placed independently via grid-row (computed in JS).
    Items on opposite sides sharing a row number will visually overlap
    vertically — this is the overlap effect.
  */
  .tq-track {
    position: relative;
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem clamp(1rem, 4vw, 2.5rem);

    display: grid;
    /* RTL: col 1 = event side (right), col 2 = spine (center), col 3 = quote side (left) */
    grid-template-columns: 1fr var(--tq-gap) var(--tq-gap) 1fr;
    /* Enough rows — each row is min-content so cards shrink to fit */
    grid-template-rows: repeat(var(--total-rows, 40), minmax(0, auto));
    row-gap: 0.6rem;
    column-gap: 0;
  }

  /* ── Central spine (absolute, doesn't participate in grid) ── */
  .tq-spine {
    position: absolute;
    top: 0; bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: var(--tq-spine-w);
    background: linear-gradient(
      180deg,
      transparent 0%,
      var(--_border) 2%,
      var(--_border) 98%,
      transparent 100%
    );
    z-index: 0;
    pointer-events: none;
  }

  /* ── Items: flex row [card | dot | arm] or [arm | dot | card] ── */
  .tq-item {
    display: flex;
    align-items: center;
    gap: 0;
    position: relative;
    z-index: 2;
  }

  /* Event item: right col in RTL → grid-column 1, flex order: card first, then dot, then arm */
  .tq-item--event {
    grid-column: 1;
    flex-direction: row;       /* RTL: card on right, arm extends left toward spine */
  }

  /* Quote item: left col in RTL → grid-column 4, flex order: arm first, then dot, then card */
  .tq-item--quote {
    grid-column: 4;
    flex-direction: row-reverse; /* RTL: card on left, arm extends right toward spine */
  }

  /* ── Connector arms ── */
  .tq-arm {
    height: var(--tq-arm-h);
    flex-shrink: 0;
    background: var(--_border);
  }
  /* Each arm extends from card edge all the way to the spine center */
  /* We give them a fixed width matching the spine gap columns (col 2+3 = 2×var(--tq-gap)) */
  .tq-arm--event {
    width: calc(var(--tq-gap) * 2 + var(--tq-dot-size) / 2);
  }
  .tq-arm--quote {
    width: calc(var(--tq-gap) * 2 + var(--tq-dot-size) / 2);
  }

  /* ── Dots ── */
  .tq-dot {
    width: var(--tq-dot-size);
    height: var(--tq-dot-size);
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--_accent);
    border: 2px solid var(--_bg);
    z-index: 3;
  }
  .tq-dot--red {
    background: var(--_accent-lt);
    box-shadow: 0 0 0 3px rgba(192,53,40,0.18);
  }
  .tq-dot--quote {
    background: var(--_sand);
    border: 2px dashed var(--_sand);
    background-clip: content-box;
    padding: 1px;
    box-shadow: 0 0 0 3px rgba(139,74,58,0.12);
  }

  /* ── Shared card base ── */
  .tq-card {
    flex: 1;
    border-radius: 2px;
    border: 1px solid var(--_border);
    min-width: 0;
  }

  /* ── Event card ── */
  .tq-card--event {
    background: var(--_bg-card);
    padding: 0.55rem 0.7rem;
    cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .tq-card--event:hover { border-color: rgba(155,42,33,0.4); }
  .tq-card--open {
    border-color: var(--_accent);
    box-shadow: 0 0 0 1px var(--_accent), 0 2px 12px rgba(155,42,33,0.1);
  }

  .tq-meta {
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-meta);
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--_accent);
    margin-bottom: 0.2rem;
  }
  .tq-card-title {
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-title);
    font-weight: 500;
    line-height: 1.35;
    color: var(--_text);
  }

  .tq-detail {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
    opacity: 0;
  }
  .tq-detail.open { grid-template-rows: 1fr; opacity: 1; }
  .tq-detail-inner {
    overflow: hidden;
    padding: 0.45rem 0 0.05rem;
    border-top: 1px solid var(--_border);
    margin-top: 0.45rem;
  }
  .tq-detail-inner p {
    font-size: var(--tq-fs-body);
    line-height: 1.6;
    color: var(--_muted);
  }

  .tq-hint {
    display: block;
    margin-top: 0.25rem;
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-meta);
    color: var(--_accent);
    opacity: 0.55;
    transition: opacity 0.15s;
  }
  .tq-card--event:hover .tq-hint,
  .tq-card--open .tq-hint { opacity: 1; }

  /* ── Quote card ── */
  .tq-card--quote {
    background: var(--_bg-section);
    border-inline-end: 3px solid var(--_sand);
    padding: 0.55rem 0.7rem;
  }

  .tq-quote-text {
    font-family: var(--_f-disp);
    font-style: italic;
    font-size: var(--tq-fs-body);
    line-height: 1.6;
    color: var(--_text);
    margin-bottom: 0.4rem;
  }
  .tq-quote-footer {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    border-top: 1px solid var(--_border);
    padding-top: 0.3rem;
  }
  .tq-quote-speaker {
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-speaker);
    font-weight: 700;
    color: var(--_sand);
  }
  .tq-quote-meta {
    font-family: var(--_f-ui);
    font-size: var(--tq-fs-meta);
    color: var(--_muted);
    line-height: 1.4;
  }

  /* ── Mobile: single column ── */
  @media (max-width: 600px) {
    .tq-track {
      grid-template-columns: 20px 1fr;
      grid-template-rows: none;
      row-gap: 0.6rem;
    }

    .tq-item--event,
    .tq-item--quote {
      grid-column: 2;
      flex-direction: column;
      align-items: stretch;
    }

    .tq-arm { display: none; }
    .tq-dot { display: none; }

    .tq-spine { left: calc(clamp(1rem, 4vw, 2.5rem) + 10px); transform: none; }

    .tq-card--quote {
      border-inline-end: none;
      border-inline-start: 3px solid var(--_sand);
    }
  }
</style>
