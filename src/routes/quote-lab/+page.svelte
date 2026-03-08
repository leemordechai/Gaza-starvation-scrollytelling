<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import rawData from '$lib/data/intentQuotes.json';
  import timelineData from '$lib/data/timeline.json';

  type Q = Omit<typeof rawData.quotes[0], 'cited_by_icj'> & { cited_by_icj: boolean };

  const quotes: Q[] = rawData.quotes.map(q => ({
    ...q,
    size: (q.size || 'small') as 'small' | 'medium' | 'large',
    cited_by_icj: q.cited_by_icj === 'True',
  }));

  // ── Date parsing → numeric sort key ──────────────────────────────────────
  function parseDateKey(d: string): number {
    const m = d.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
    if (!m) return 9999_0000;
    const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    return yr * 10000 + parseInt(m[2]) * 100 + parseInt(m[1]);
  }
  function dateYear(d: string): number {
    const m = d.match(/\.(\d{2,4})$/);
    if (!m) return 0;
    return m[1].length === 2 ? 2000 + parseInt(m[1]) : parseInt(m[1]);
  }

  const sorted = [...quotes].sort((a, b) => parseDateKey(a.date) - parseDateKey(b.date));

  // ── Section 1 (formerly 4): Keyword + role + year filters ────────────────

  const keywords = [
    { id: 'food',   label: 'מזון',  test: (q: Q) => /מזון|אוכל|מאפיה|גרגר/.test(q.quote_he) },
    { id: 'water',  label: 'מים',   test: (q: Q) => /מים|טיפת/.test(q.quote_he) },
    { id: 'fuel',   label: 'דלק',   test: (q: Q) => /דלק/.test(q.quote_he) },
    { id: 'hunger', label: 'רעב',   test: (q: Q) => /רעב|ירעיב|להרעיב|ארעיב/.test(q.quote_he) },
    { id: 'aid',    label: 'סיוע',  test: (q: Q) => /סיוע|הומניטרי/.test(q.quote_he) },
  ];

  function roleCategory(q: Q): 'minister' | 'mk' | 'other' {
    const t = q.title;
    if (/^שר/.test(t) || /ראש הממשלה/.test(t)) return 'minister';
    if (/ח["״]כ|חבר.?כנסת|חברת.?כנסת|סגן יו["״]ר|יו["״]ר/.test(t)) return 'mk';
    return 'other';
  }
  const roles = [
    { id: 'minister', label: 'שרים',        test: (q: Q) => roleCategory(q) === 'minister' },
    { id: 'mk',       label: 'חברי כנסת',   test: (q: Q) => roleCategory(q) === 'mk' },
    { id: 'other',    label: 'אחרים',        test: (q: Q) => roleCategory(q) === 'other' },
  ];
  const years = [
    { id: '2023', label: '2023', test: (q: Q) => dateYear(q.date) === 2023 },
    { id: '2024', label: '2024', test: (q: Q) => dateYear(q.date) === 2024 },
    { id: '2025', label: '2025', test: (q: Q) => dateYear(q.date) === 2025 },
  ];

  let activeKw   = $state(new Set<string>());
  let activeRole = $state(new Set<string>());
  let activeYear = $state(new Set<string>());
  let expandAll   = $state(false);
  let lockedCards = $state(new Set<string>()); // click-locked open
  let hoveredCard = $state<string | null>(null); // hover-only preview

  const NUM_COLS = 4;
  // Distribute quotes left-to-right into NUM_COLS columns (row-major order)
  // so card i goes to column (i % NUM_COLS) — preserving reading order.
  const echoColumns: Q[][] = Array.from({ length: NUM_COLS }, () => []);
  for (let i = 0; i < sorted.length; i++) {
    echoColumns[i % NUM_COLS].push(sorted[i]);
  }

  // Returns quote_he with key_phrase_he wrapped in <mark class="echo-highlight">.
  // Strips wrapping curly/straight quotes from phrase before searching.
  function highlightPhrase(text: string, phrase: string): string {
    if (!phrase) return text;
    // Strip leading/trailing curly quotes or straight quotes from the key phrase
    const clean = phrase.replace(/^[\u201c\u201d\u05f4"]+|[\u201c\u201d\u05f4"]+$/g, '').trim();
    if (!clean) return text;
    const idx = text.indexOf(clean);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const after  = text.slice(idx + clean.length);
    return `${before}<mark class="echo-highlight">${clean}</mark>${after}`;
  }

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }

  // AND across groups, OR within each group
  function echoMatches(q: Q): boolean {
    const kwOk   = activeKw.size   === 0 || [...activeKw].some(id   => keywords.find(k => k.id === id)?.test(q)   ?? false);
    const roleOk = activeRole.size === 0 || [...activeRole].some(id => roles.find(r => r.id === id)?.test(q)       ?? false);
    const yearOk = activeYear.size === 0 || [...activeYear].some(id => years.find(y => y.id === id)?.test(q)       ?? false);
    return kwOk && roleOk && yearOk;
  }


  // ── Section 2: Speaker groups ─────────────────────────────────────────────
  const speakerMap = new Map<string, Q[]>();
  for (const q of sorted) {
    if (!speakerMap.has(q.speaker)) speakerMap.set(q.speaker, []);
    speakerMap.get(q.speaker)!.push(q);
  }
  const speakers = [...speakerMap.entries()].sort((a, b) => b[1].length - a[1].length);
  let selectedSpeaker = $state<string | null>(null);
  const filteredQuotes = $derived(selectedSpeaker ? speakerMap.get(selectedSpeaker) ?? [] : sorted);

  // ── Section 3: Escalation scroll ─────────────────────────────────────────
  type EscItem =
    | { kind: 'event'; date: string; title: string; detailTitle: string; detail: string; dotColor: string; sortKey: number }
    | { kind: 'quote'; id: string; date: string; speaker: string; title: string; quote_he: string; key_phrase_he: string; cited_by_icj: boolean; source_url: string; source_label: string; sortKey: number };

  const evKeyMap: Record<string, number> = {
    '7–18 באוקטובר 2023': 20231007,
    '28 באוקטובר 2023':   20231028,
    '24 בנובמבר 2023':    20231124,
    'סתיו 2024':           20240901,
    '17 בינואר 2025':     20250117,
    '2 במרץ 2025':        20250302,
    '27 במאי 2025':       20250527,
    'יוני–יולי 2025':     20250601,
    '10 באוקטובר 2025':   20251010,
  };
  const escItems: EscItem[] = [
    ...(timelineData as any[]).map(e => ({
      kind: 'event' as const, ...e,
      sortKey: evKeyMap[e.date] ?? 20240101,
    })),
    ...sorted.map(q => ({
      kind: 'quote' as const,
      id: q.id, date: q.date, speaker: q.speaker, title: q.title,
      quote_he: q.quote_he, key_phrase_he: q.key_phrase_he,
      cited_by_icj: q.cited_by_icj, source_url: q.source_url,
      source_label: q.source_label,
      sortKey: parseDateKey(q.date),
    })),
  ].sort((a, b) => a.sortKey - b.sortKey);

  let openEscIds = $state(new Set<string>());
  function toggleEsc(key: string) {
    const next = new Set(openEscIds);
    if (next.has(key)) next.delete(key); else next.add(key);
    openEscIds = next;
  }

  // ── Section 4: Severity grid ──────────────────────────────────────────────
  // (uses sorted, no additional state)

  // ── Section 5: Speaker filter ──────────────────────────────────────────────
  // (uses speakerMap / filteredQuotes / selectedSpeaker)

  // ── Section 6: Constellation bubbles ─────────────────────────────────────
  const palette = [
    '#9b2a21','#c03528','#8b4a3a','#c87941','#7a5c3a',
    '#b86b3c','#6b3a2a','#a04030','#d49060','#5a3020',
  ];
  const speakerColors = new Map<string, string>();
  let ci = 0;
  for (const q of quotes) {
    if (!speakerColors.has(q.speaker)) {
      speakerColors.set(q.speaker, palette[ci % palette.length]);
      ci++;
    }
  }
  function bubbleR(q: Q): number { return Math.min(72, Math.max(30, 28 + q.quote_he.length / 18)); }
  type Bubble = { id: string; x: number; y: number; r: number; q: Q };
  function packBubbles(qs: Q[], W: number, H: number): Bubble[] {
    const placed: Bubble[] = [];
    for (const q of qs) {
      const r = bubbleR(q);
      let bx = r + 10, by = r + 10;
      outer: for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 30; col++) {
          const cx = r + 12 + col * ((W - 2 * r) / 25);
          const cy = r + 12 + row * 80;
          let ok = true;
          for (const p of placed) {
            const dx = cx - p.x, dy = cy - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < r + p.r + 8) { ok = false; break; }
          }
          if (ok && cx + r < W - 10 && cy + r < H - 10) { bx = cx; by = cy; break outer; }
        }
      }
      placed.push({ id: q.id, x: bx, y: by, r, q });
    }
    return placed;
  }
  const CANVAS_W = 860, CANVAS_H = 520;
  const bubbles = packBubbles(quotes, CANVAS_W, CANVAS_H);
  let hoveredBubble = $state<string | null>(null);
  let selectedBubble = $state<string | null>(null);
  const hoveredQ  = $derived(hoveredBubble  ? quotes.find(q => q.id === hoveredBubble)  : null);
  const selectedQ = $derived(selectedBubble ? quotes.find(q => q.id === selectedBubble) : null);
  const legendSpeakers = [...speakerColors.entries()];

  // ── Nav ───────────────────────────────────────────────────────────────────
  const sections = [
    { id: 'sec1', label: 'סינון ציטוטים' },
    { id: 'sec2', label: 'ציר הסלמה' },
    { id: 'sec3', label: 'רשת חומרה' },
    { id: 'sec4', label: 'לפי דובר' },
    { id: 'sec5', label: 'קונסטלציה' },
  ];
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<svelte:head>
  <title>מעבדת ציטוטים — הרעבת עזה</title>
</svelte:head>

<div class="ql-wrapper">

  <!-- ── Sticky nav ──────────────────────────────────────────────────────── -->
  <nav class="ql-nav" dir="rtl" aria-label="ניווט בין חלקי הדף">
    <span class="ql-nav-title">מעבדת ציטוטים</span>
    {#each sections as s}
      <button class="ql-nav-btn" onclick={() => scrollTo(s.id)}>{s.label}</button>
    {/each}
  </nav>

  <!-- ══════════════════════════════════════════════════════════════════════
       SECTION 1 — Echo Grid: keyword + role + year filters (FIRST)
  ══════════════════════════════════════════════════════════════════════ -->
  <section id="sec1" class="ql-section section-topo" dir="rtl">
    <div class="container-wide">
      <div class="section-header">
        <span class="sh-label">כוונות מוצהרות</span>
        <h2 class="sh-title">בפיהם שלהם</h2>
        <p class="sh-sub">סננו לפי נושא, תפקיד, ושנה. <strong>העבירו את הסמן מעל כרטיס</strong> לציטוט המלא, או <strong>לחצו עליו</strong> כדי להשאיר אותו פתוח.</p>
      </div>

      <!-- Filter bar: all groups in one row with category labels -->
      <div class="echo-filterbar">
        <div class="echo-pills">
          <span class="echo-cat-label echo-cat-label--topic">תמות</span>
          {#each keywords as kw}
            <button
              class="echo-pill echo-pill--topic"
              class:echo-pill--active={activeKw.has(kw.id)}
              onclick={() => activeKw = toggle(activeKw, kw.id)}
            >{kw.label}</button>
          {/each}

          <span class="echo-pill-sep" aria-hidden="true"></span>

          <span class="echo-cat-label echo-cat-label--role">בעלי תפקידים</span>
          {#each roles as r}
            <button
              class="echo-pill echo-pill--role"
              class:echo-pill--active={activeRole.has(r.id)}
              onclick={() => activeRole = toggle(activeRole, r.id)}
            >{r.label}</button>
          {/each}

          <span class="echo-pill-sep" aria-hidden="true"></span>

          <span class="echo-cat-label echo-cat-label--year">שנה</span>
          {#each years as y}
            <button
              class="echo-pill echo-pill--year"
              class:echo-pill--active={activeYear.has(y.id)}
              onclick={() => activeYear = toggle(activeYear, y.id)}
            >{y.label}</button>
          {/each}

          {#if activeKw.size > 0 || activeRole.size > 0 || activeYear.size > 0}
            <span class="echo-pill-sep" aria-hidden="true"></span>
            <button class="echo-pill echo-pill--clear" onclick={() => { activeKw = new Set(); activeRole = new Set(); activeYear = new Set(); }}>× נקה הכל</button>
          {/if}
        </div>

        <button
          class="echo-expand-btn"
          onclick={() => { expandAll = !expandAll; lockedCards = new Set(); hoveredCard = null; }}
          aria-pressed={expandAll}
        >{expandAll ? '▴ כווץ הכל' : '▾ פתח הכל'}</button>
      </div>

      <div class="echo-grid">
        {#each echoColumns as col}
          <div class="echo-col">
            {#each col as q (q.id)}
              {@const matches = echoMatches(q)}
              {@const anyActive = activeKw.size > 0 || activeRole.size > 0 || activeYear.size > 0}
              {@const isLocked = lockedCards.has(q.id)}
              {@const isOpen = expandAll || isLocked || hoveredCard === q.id}
              <div
                class="echo-card"
                class:echo-card--open={isOpen}
                class:echo-card--locked={isLocked}
                class:echo-card--match={matches}
                class:echo-card--dim={!matches && anyActive}
                class:echo-card--minister={roleCategory(q) === 'minister'}
                class:echo-card--mk={roleCategory(q) === 'mk'}
                onmouseenter={() => { if (!expandAll && !isLocked) hoveredCard = q.id; }}
                onmouseleave={() => { if (hoveredCard === q.id) hoveredCard = null; }}
                onclick={() => { lockedCards = toggle(lockedCards, q.id); hoveredCard = null; }}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lockedCards = toggle(lockedCards, q.id); } }}
                aria-expanded={isOpen}
                use:reveal
              >
                <p class="echo-phrase">״{q.key_phrase_he}״</p>

                <div class="echo-details" class:echo-details--open={isOpen}>
                  <div class="echo-details-inner">
                    <p class="echo-full-quote">{@html highlightPhrase(q.quote_he, q.key_phrase_he)}</p>
                    {#if q.originally_english === 'True' && q.quote_en}
                      <p class="echo-en-quote" dir="ltr">"{q.quote_en}"</p>
                    {/if}
                    <div class="echo-foot">
                      <span class="echo-role-tag echo-role-tag--{roleCategory(q)}">
                        {roleCategory(q) === 'minister' ? 'שר/ה' : roleCategory(q) === 'mk' ? 'ח״כ' : 'אחר'}
                      </span>
                      <span class="echo-speaker">{q.speaker}</span>
                      <span class="echo-meta">{q.title} · {q.date}</span>
                      <a class="echo-src-link" href={q.source_url} target="_blank" rel="noopener noreferrer" onclick={(e) => e.stopPropagation()}>↗ {q.source_label}</a>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <p class="echo-hint">העבירו את הסמן מעל כרטיס לציטוט המלא, או לחצו עליו כדי להשאיר אותו פתוח.</p>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════
       SECTION 2 — Escalation Scroll (timeline + quotes interwoven)
  ══════════════════════════════════════════════════════════════════════ -->
  <section id="sec2" class="ql-section" dir="rtl">
    <div class="container">
      <div class="section-header">
        <span class="sh-label">כרוניקה</span>
        <h2 class="sh-title">ציר הסלמה</h2>
        <p class="sh-sub">אירועים מרכזיים וציטוטים רשמיים שזורים לפי כרונולוגיה.</p>
      </div>

      <div class="esc-track">
        <div class="esc-spine" aria-hidden="true"></div>
        {#each escItems as item (item.kind === 'event' ? 'ev-' + item.date : 'q-' + (item as any).id)}
          {#if item.kind === 'event'}
            {@const key = 'ev-' + item.date}
            <div class="esc-item esc-item--event" use:reveal>
              <div class="esc-dot esc-dot--{item.dotColor}" aria-hidden="true"></div>
              <div
                class="esc-card esc-card--event"
                class:esc-open={openEscIds.has(key)}
                role="button" tabindex="0"
                aria-expanded={openEscIds.has(key)}
                onclick={() => toggleEsc(key)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEsc(key); } }}
              >
                <div class="esc-date">{item.date}</div>
                <div class="esc-ev-title">{item.title}</div>
                <div class="esc-detail" class:open={openEscIds.has(key)}>
                  <div class="esc-detail-inner">
                    <strong>{item.detailTitle}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
                <span class="esc-hint">{openEscIds.has(key) ? '▴ סגור' : '▾ פרטים'}</span>
              </div>
            </div>
          {:else}
            {@const q = item as Extract<EscItem, { kind: 'quote' }>}
            <div class="esc-item esc-item--quote" use:reveal>
              <div class="esc-dot esc-dot--quote" aria-hidden="true"></div>
              <blockquote class="esc-card esc-card--quote">
                <p class="esc-phrase">״{q.key_phrase_he}״</p>
                <p class="esc-qtext">{q.quote_he}</p>
                <footer class="esc-qfoot">
                  <span class="esc-qspeaker">{q.speaker}</span>
                  <span class="esc-qmeta">{q.title} · {q.date}</span>
                  <a class="esc-qsrc" href={q.source_url} target="_blank" rel="noopener noreferrer">
                    ↗ {q.source_label}
                  </a>
                </footer>
              </blockquote>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════
       SECTION 3 — Severity Grid
  ══════════════════════════════════════════════════════════════════════ -->
  <section id="sec3" class="ql-section section-topo" dir="rtl">
    <div class="container-wide">
      <div class="section-header">
        <span class="sh-label">כל הציטוטים</span>
        <h2 class="sh-title">רשת חומרה</h2>
        <p class="sh-sub">ציטוטים מסודרים לפי תאריך. העברת עכבר מציגה את הציטוט המלא ומקורו.</p>
      </div>

      <div class="sev-grid">
        {#each sorted as q (q.id)}
          <div
            class="sev-card"
            class:sev-icj={q.cited_by_icj}
            use:reveal
          >
            {#if q.cited_by_icj}<span class="sev-badge">ICJ</span>{/if}
            <div class="sev-phrase">״{q.key_phrase_he}״</div>
            <div class="sev-speaker">{q.speaker}</div>
            <div class="sev-date">{q.date}</div>
            <div class="sev-full">
              <p class="sev-full-text">{q.quote_he}</p>
              <a class="sev-src" href={q.source_url} target="_blank" rel="noopener noreferrer">
                ↗ {q.source_label}
              </a>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════
       SECTION 4 — Speaker filter
  ══════════════════════════════════════════════════════════════════════ -->
  <section id="sec4" class="ql-section" dir="rtl">
    <div class="container-wide">
      <div class="section-header">
        <span class="sh-label">לפי דובר</span>
        <h2 class="sh-title">מי אמר מה</h2>
        <p class="sh-sub">בחרו דובר לסינון — מספר הציטוטים מצוין בכל כפתור.</p>
      </div>

      <div class="spk-pills">
        <button
          class="spk-pill"
          class:spk-pill--active={selectedSpeaker === null}
          onclick={() => selectedSpeaker = null}
        >הכל <span class="spk-count">{quotes.length}</span></button>
        {#each speakers as [name, qs]}
          <button
            class="spk-pill"
            class:spk-pill--active={selectedSpeaker === name}
            onclick={() => selectedSpeaker = selectedSpeaker === name ? null : name}
          >{name} <span class="spk-count">{qs.length}</span></button>
        {/each}
      </div>

      <div class="spk-grid">
        {#each filteredQuotes as q (q.id)}
          <blockquote class="spk-card" use:reveal>
            <p class="spk-phrase">״{q.key_phrase_he}״</p>
            <p class="spk-quote">{q.quote_he}</p>
            <footer class="spk-foot">
              <span class="spk-name">{q.speaker}</span>
              <span class="spk-role">{q.title}</span>
              <span class="spk-date">{q.date} · {q.context}</span>
              <a class="spk-src" href={q.source_url} target="_blank" rel="noopener noreferrer">↗ {q.source_label}</a>
            </footer>
          </blockquote>
        {/each}
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════
       SECTION 5 — Constellation Bubbles
  ══════════════════════════════════════════════════════════════════════ -->
  <section id="sec5" class="ql-section section-topo" dir="rtl">
    <div class="container-wide">
      <div class="section-header">
        <span class="sh-label">מפה חזותית</span>
        <h2 class="sh-title">קונסטלציה</h2>
        <p class="sh-sub">כל בועה = ציטוט אחד. גודל הבועה לפי אורך ההצהרה. צבע לפי דובר. לחצו לקריאת הציטוט המלא.</p>
      </div>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="const-canvas"
        style="width:{CANVAS_W}px; height:{CANVAS_H}px"
        onmouseleave={() => hoveredBubble = null}
      >
        {#each bubbles as b (b.id)}
          {@const color = speakerColors.get(b.q.speaker) ?? '#9b2a21'}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="const-bubble"
            class:const-bubble--icj={b.q.cited_by_icj}
            class:const-bubble--hovered={hoveredBubble === b.id}
            style="left:{b.x - b.r}px; top:{b.y - b.r}px; width:{b.r*2}px; height:{b.r*2}px; background:{color}; --ring:{color}"
            onmouseenter={() => hoveredBubble = b.id}
            onclick={() => selectedBubble = b.id}
            role="button" tabindex="0"
            aria-label="{b.q.speaker}: {b.q.key_phrase_he}"
            onkeydown={(e) => { if (e.key === 'Enter') selectedBubble = b.id; }}
          ></div>
        {/each}

        {#if hoveredBubble && hoveredQ}
          {@const b = bubbles.find(x => x.id === hoveredBubble)!}
          <div class="const-tip" style="left:{b.x + b.r + 10}px; top:{b.y - 24}px" dir="rtl">
            <div class="const-tip-phrase">״{hoveredQ.key_phrase_he}״</div>
            <div class="const-tip-speaker">{hoveredQ.speaker}</div>
          </div>
        {/if}
      </div>

      <div class="const-legend" dir="rtl">
        {#each legendSpeakers as [name, color]}
          <span class="const-leg-item">
            <span class="const-leg-dot" style="background:{color}"></span>{name}
          </span>
        {/each}
      </div>
    </div>

    {#if selectedBubble && selectedQ}
      <div
        class="const-overlay"
        onclick={() => selectedBubble = null}
        onkeydown={(e) => { if (e.key === 'Escape') selectedBubble = null; }}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="const-modal" dir="rtl" onclick={(e) => e.stopPropagation()}>
          <button class="const-close" onclick={() => selectedBubble = null} aria-label="סגור">✕</button>
          <div class="const-modal-meta">
            <span class="const-modal-speaker">{selectedQ.speaker}</span>
            <span class="const-modal-role">{selectedQ.title}</span>
            <span class="const-modal-date">{selectedQ.date} · {selectedQ.context}</span>
          </div>
          <p class="const-modal-phrase">״{selectedQ.key_phrase_he}״</p>
          <p class="const-modal-quote">{selectedQ.quote_he}</p>
          {#if (selectedQ.originally_english === 'True') && selectedQ.quote_en}
            <p class="const-modal-en" dir="ltr">"{selectedQ.quote_en}"</p>
          {/if}
          {#if selectedQ.cited_by_icj}
            <span class="const-modal-icj">הוגש לבית הדין הבינלאומי (ICJ)</span>
          {/if}
          <a class="const-modal-src" href={selectedQ.source_url} target="_blank" rel="noopener noreferrer">
            ↗ {selectedQ.source_label}
          </a>
        </div>
      </div>
    {/if}
  </section>

</div>

<style>
  /* ══ Wrapper — inherits from app.css via :root ══════════════════════════ */
  .ql-wrapper {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
  }

  /* ══ Sticky nav ══════════════════════════════════════════════════════════ */
  .ql-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--bg);
    border-bottom: 1px solid var(--border-mid);
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.5rem clamp(0.75rem, 3vw, 2rem);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ql-nav-title {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent);
    margin-left: 0.75rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ql-nav-btn {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: none;
    border: 1px solid transparent;
    border-radius: 2px;
    padding: 0.22rem 0.55rem;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .ql-nav-btn:hover {
    color: var(--accent);
    border-color: var(--border-mid);
    background: var(--bg-section);
  }

  /* ══ Section shell ═══════════════════════════════════════════════════════ */
  .ql-section {
    padding: clamp(3rem, 8vw, 5rem) 0 clamp(3rem, 8vw, 6rem);
  }

  /* ══ Section header — matches live page .section-header ════════════════ */
  .section-header {
    margin-bottom: clamp(2rem, 5vw, 3.5rem);
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 1 — Echo Grid filters
  ══════════════════════════════════════════════════════════════════ */
  /* Filter bar — single row with category labels */
  .echo-filterbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 1.4rem;
    flex-wrap: wrap;
  }
  .echo-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }
  /* Category micro-labels */
  .echo-cat-label {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }
  .echo-cat-label--topic { background: rgba(192,53,40,0.08); color: var(--accent); }
  .echo-cat-label--role  { background: rgba(139,74,58,0.08); color: var(--sand); }
  .echo-cat-label--year  { background: rgba(106,88,85,0.08); color: var(--text-muted); }

  .echo-pill-sep {
    display: inline-block;
    width: 2px;
    height: 1.4em;
    background: var(--text-muted);
    opacity: 0.4;
    margin: 0 0.5rem;
    align-self: center;
    border-radius: 1px;
  }

  /* Base pill */
  .echo-pill {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 600;
    background: none;
    border-radius: 20px;
    padding: 0.22rem 0.7rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    /* default: topic style */
    color: var(--accent);
    border: 1.5px solid rgba(192,53,40,0.3);
  }
  .echo-pill:hover { background: rgba(192,53,40,0.07); border-color: var(--accent); }
  .echo-pill--active { background: var(--accent); color: #fff; border-color: var(--accent); }

  /* Role pills — warm brown */
  .echo-pill--role {
    color: var(--sand);
    border-color: rgba(139,74,58,0.35);
  }
  .echo-pill--role:hover { background: rgba(139,74,58,0.07); border-color: var(--sand); }
  .echo-pill--role.echo-pill--active { background: var(--sand); border-color: var(--sand); color: #fff; }

  /* Year pills — muted */
  .echo-pill--year {
    color: var(--text-muted);
    border-color: var(--border-mid);
  }
  .echo-pill--year:hover { background: rgba(106,88,85,0.07); border-color: var(--text-muted); }
  .echo-pill--year.echo-pill--active { background: var(--text-muted); border-color: var(--text-muted); color: #fff; }

  .echo-pill--clear { background: none; border-style: dashed; color: var(--text-muted); border-color: var(--border-mid); font-size: calc(var(--text-xs) - 0.04rem); }
  .echo-pill--clear:hover { color: var(--accent); border-color: var(--accent); background: none; }

  .echo-expand-btn {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    background: none;
    border: 1.5px solid var(--border-mid);
    border-radius: 4px;
    padding: 0.28rem 0.8rem;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color 0.15s, border-color 0.15s;
  }
  .echo-expand-btn:hover,
  .echo-expand-btn[aria-pressed="true"] { color: var(--accent); border-color: var(--accent); }

  /* Explicit column layout — N equal columns, each a flex stack.
     Cards stay in left-to-right reading order (row-major distribution).
     Expanding a card pushes only siblings below it in that column. */
  .echo-grid {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .echo-col {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .echo-card {
    display: block;
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-top: 3px solid var(--border-mid);
    padding: 0.7rem 0.8rem 0.6rem;
    cursor: pointer;
    transition: opacity 0.22s, filter 0.22s, border-top-color 0.18s, box-shadow 0.18s;
  }
  .echo-card:hover,
  .echo-card--open          { border-top-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-dim), 0 4px 14px rgba(0,0,0,0.07); }
  /* Lock indicator: small dot in top-left corner when click-locked */
  .echo-card--locked::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 6px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
  }
  .echo-card--match         { border-top-color: var(--accent); }
  .echo-card--dim           { opacity: 0.12; filter: grayscale(0.7); pointer-events: none; }
  .echo-card--minister:not(.echo-card--dim) { border-top-color: var(--accent-light); }
  .echo-card--mk:not(.echo-card--dim)       { border-top-color: var(--sand); }

  .echo-phrase {
    font-family: var(--font-disp);
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1.4;
    color: var(--text);
    margin: 0;
  }

  /* Expandable details — CSS grid row trick for smooth height animation */
  .echo-details {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.22s ease;
  }
  .echo-details--open { grid-template-rows: 1fr; }
  .echo-details-inner { overflow: hidden; }

  .echo-full-quote {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1.65;
    color: var(--text);
    border-right: 2px solid var(--accent);
    padding-right: 0.6rem;
    margin: 0.55rem 0 0.4rem;
    font-style: italic;
  }
  /* :global needed — injected via {@html}, Svelte doesn't scope it */
  :global(.echo-highlight) {
    background: var(--accent-dim);
    color: var(--accent-light);
    font-style: normal;
    font-weight: 700;
    padding: 0 2px;
    border-radius: 2px;
  }
  .echo-en-quote {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-style: italic;
    line-height: 1.55;
    color: var(--text-muted);
    direction: ltr;
    border-left: 2px solid var(--border);
    padding-left: 0.55rem;
    margin-bottom: 0.4rem;
  }
  .echo-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.5rem;
    border-top: 1px solid var(--border);
    padding-top: 0.4rem;
    margin-top: 0.1rem;
    font-family: var(--font-ui);
  }
  .echo-role-tag {
    display: inline-block;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 0.08rem 0.32rem;
    border-radius: 2px;
  }
  .echo-role-tag--minister { background: rgba(192,53,40,0.1);  color: var(--accent-light); }
  .echo-role-tag--mk       { background: rgba(139,74,58,0.1);  color: var(--sand); }
  .echo-role-tag--other    { background: rgba(106,88,85,0.08); color: var(--text-muted); }
  .echo-speaker { font-size: var(--text-xs); font-weight: 700; color: var(--accent); }
  .echo-meta    { font-size: var(--text-xs); color: var(--text-muted); }
  .echo-src-link {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-decoration: none;
    border-bottom: 1px solid var(--border);
    transition: color 0.15s, border-color 0.15s;
    margin-inline-start: auto;
    direction: ltr;
  }
  .echo-src-link:hover { color: var(--accent); border-color: var(--accent); }

  /* Footer hint */
  .echo-hint {
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-top: 1.5rem;
  }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 2 — Escalation scroll
  ══════════════════════════════════════════════════════════════════ */
  .esc-track {
    position: relative;
    padding: 1.5rem 0 1.5rem 2rem;
    direction: rtl;
  }
  .esc-spine {
    position: absolute;
    top: 0; bottom: 0;
    right: 0;
    width: 2px;
    background: linear-gradient(180deg, transparent 0%, var(--border-mid) 3%, var(--border-mid) 97%, transparent 100%);
    z-index: 0;
  }
  .esc-item {
    position: relative;
    padding-right: 1.8rem;
    margin-bottom: 1.1rem;
  }
  .esc-dot {
    position: absolute;
    top: 0.7rem; right: -6px;
    width: 12px; height: 12px;
    border-radius: 50%;
    border: 2px solid var(--bg);
    z-index: 2;
  }
  .esc-dot--red   { background: var(--accent-light); }
  .esc-dot--gold  { background: var(--accent); }
  .esc-dot--quote {
    background: var(--sand);
    border: 2px dashed var(--sand);
    background-clip: content-box;
    padding: 1px;
  }

  .esc-card--event {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-right: 3px solid var(--border-mid);
    padding: 0.55rem 0.8rem;
    cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .esc-card--event:hover { border-right-color: var(--accent); }
  .esc-open { border-right-color: var(--accent) !important; box-shadow: 0 0 0 1px var(--accent), 0 2px 12px rgba(155,42,33,0.08); }
  .esc-date {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--accent);
    margin-bottom: 0.15rem;
  }
  .esc-ev-title {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text);
    line-height: 1.35;
  }
  .esc-detail {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
    opacity: 0;
  }
  .esc-detail.open { grid-template-rows: 1fr; opacity: 1; }
  .esc-detail-inner { overflow: hidden; padding: 0.5rem 0 0.1rem; border-top: 1px solid var(--border-mid); margin-top: 0.45rem; }
  .esc-detail-inner strong { display: block; font-family: var(--font-ui); font-size: var(--text-sm); font-weight: 700; color: var(--sand); margin-bottom: 0.25rem; }
  .esc-detail-inner p { font-size: var(--text-sm); line-height: 1.6; color: var(--text-muted); }
  .esc-hint { display: block; margin-top: 0.25rem; font-family: var(--font-ui); font-size: var(--text-xs); color: var(--accent); opacity: 0.55; transition: opacity 0.15s; }
  .esc-card--event:hover .esc-hint, .esc-open .esc-hint { opacity: 1; }

  .esc-card--quote {
    background: var(--bg-section);
    border: 1px solid var(--border-mid);
    border-right: 3px solid var(--sand);
    padding: 0.6rem 0.8rem;
  }
  .esc-phrase {
    font-family: var(--font-disp);
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.3rem;
    line-height: 1.35;
  }
  .esc-qtext {
    font-family: var(--font-disp);
    font-style: italic;
    font-size: var(--text-sm);
    line-height: 1.65;
    color: var(--text-muted);
    margin-bottom: 0.45rem;
  }
  .esc-qfoot {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
    border-top: 1px solid var(--border-mid);
    padding-top: 0.3rem;
    font-family: var(--font-ui);
  }
  .esc-qspeaker { font-size: var(--text-xs); font-weight: 700; color: var(--sand); }
  .esc-qmeta    { font-size: var(--text-xs); color: var(--text-muted); }
  .esc-qsrc     { font-size: var(--text-xs); color: var(--accent); text-decoration: none; margin-right: auto; border-bottom: 1px solid transparent; transition: border-color 0.15s; }
  .esc-qsrc:hover { border-color: var(--accent); }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 3 — Severity grid
  ══════════════════════════════════════════════════════════════════ */
  .sev-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }
  .sev-card {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-top: 3px solid var(--border-mid);
    padding: 0.75rem 0.85rem;
    overflow: hidden;
    transition: border-top-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .sev-card:hover { border-top-color: var(--accent); transform: scale(1.03); z-index: 5; box-shadow: 0 8px 28px rgba(0,0,0,0.12); }
  .sev-card:hover .sev-full { opacity: 1; max-height: 220px; }
  .sev-card.sev-icj { border-top-color: var(--accent-light); box-shadow: 0 0 0 1px rgba(192,53,40,0.2); }

  .sev-badge {
    position: absolute; top: 0.4rem; left: 0.4rem;
    font-family: var(--font-ui); font-size: 0.5rem; font-weight: 700;
    color: #fff; background: var(--accent-light);
    padding: 0.1rem 0.3rem; border-radius: 2px;
  }
  .sev-phrase { font-family: var(--font-disp); font-size: var(--text-sm); font-weight: 700; line-height: 1.4; color: var(--text); margin-bottom: 0.4rem; }
  .sev-speaker { font-family: var(--font-ui); font-size: var(--text-xs); font-weight: 700; color: var(--accent); }
  .sev-date    { font-family: var(--font-ui); font-size: var(--text-xs); color: var(--text-muted); margin-top: 0.1rem; }

  .sev-full {
    opacity: 0; max-height: 0; overflow: hidden;
    transition: opacity 0.25s, max-height 0.35s;
    margin-top: 0.6rem; padding-top: 0.55rem;
    border-top: 1px solid var(--border);
  }
  .sev-full-text { font-family: var(--font-disp); font-style: italic; font-size: var(--text-xs); line-height: 1.6; color: var(--text); margin-bottom: 0.4rem; }
  .sev-src {
    display: inline-flex; align-items: center; gap: 0.15rem;
    font-family: var(--font-ui); font-size: var(--text-xs);
    color: var(--accent); text-decoration: none;
    border-bottom: 1px solid var(--border); transition: border-color 0.15s;
    pointer-events: all;
  }
  .sev-src:hover { border-color: var(--accent); }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 4 — Speaker filter
  ══════════════════════════════════════════════════════════════════ */
  .spk-pills {
    display: flex; flex-wrap: wrap; gap: 0.4rem;
    margin-bottom: 1.5rem;
  }
  .spk-pill {
    font-family: var(--font-ui); font-size: var(--text-xs);
    color: var(--text-muted); background: var(--bg-card);
    border: 1px solid var(--border-mid); border-radius: 20px;
    padding: 0.28rem 0.75rem; cursor: pointer;
    display: flex; align-items: center; gap: 0.35rem;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .spk-pill:hover { border-color: var(--accent); color: var(--accent); }
  .spk-pill--active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .spk-count {
    font-size: var(--text-xs); font-weight: 700;
    background: rgba(255,255,255,0.2); border-radius: 10px; padding: 0 0.3rem;
  }

  .spk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
  .spk-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-right: 3px solid var(--accent); padding: 0.75rem 0.9rem;
  }
  .spk-phrase { font-family: var(--font-disp); font-size: var(--text-sm); font-weight: 700; color: var(--text); margin-bottom: 0.4rem; line-height: 1.4; }
  .spk-quote  { font-family: var(--font-disp); font-style: italic; font-size: var(--text-xs); line-height: 1.65; color: var(--text-muted); margin-bottom: 0.5rem; }
  .spk-foot   { display: flex; flex-direction: column; gap: 0.06rem; border-top: 1px solid var(--border); padding-top: 0.35rem; font-family: var(--font-ui); }
  .spk-name   { font-size: var(--text-xs); font-weight: 700; color: var(--accent); }
  .spk-role   { font-size: var(--text-xs); color: var(--text-muted); font-style: italic; }
  .spk-date   { font-size: var(--text-xs); color: var(--text-muted); }
  .spk-src {
    display: inline-flex; align-items: center; gap: 0.15rem;
    font-size: var(--text-xs); color: var(--accent); text-decoration: none;
    border-bottom: 1px solid var(--border); transition: border-color 0.15s;
    align-self: flex-start; margin-top: 0.15rem; direction: ltr;
  }
  .spk-src:hover { border-color: var(--accent); }

  /* ══════════════════════════════════════════════════════════════════
     SECTION 5 — Constellation
  ══════════════════════════════════════════════════════════════════ */
  .const-canvas {
    position: relative; margin: 0 auto 2rem;
    overflow: hidden; max-width: 100%;
  }
  .const-bubble {
    position: absolute; border-radius: 50%; cursor: pointer;
    opacity: 0.82;
    transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .const-bubble:hover, .const-bubble--hovered { opacity: 1; transform: scale(1.1); z-index: 10; }
  .const-bubble--icj { box-shadow: 0 0 0 3px var(--ring), 0 0 0 5px rgba(155,42,33,0.18); }

  .const-tip {
    position: absolute; z-index: 20;
    background: var(--bg); border: 1px solid var(--border-mid); border-top: 2px solid var(--accent);
    padding: 0.5rem 0.65rem; pointer-events: none;
    max-width: 220px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    animation: tipFadeIn 0.12s ease;
  }
  .const-tip-phrase  { font-family: var(--font-disp); font-size: var(--text-sm); font-weight: 700; color: var(--text); line-height: 1.4; margin-bottom: 0.2rem; }
  .const-tip-speaker { font-family: var(--font-ui); font-size: var(--text-xs); color: var(--accent); font-weight: 700; }

  .const-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; justify-content: center; margin-bottom: 1rem; }
  .const-leg-item { display: flex; align-items: center; gap: 0.3rem; font-family: var(--font-ui); font-size: var(--text-xs); color: var(--text-muted); }
  .const-leg-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  .const-overlay {
    position: fixed; inset: 0;
    background: rgba(10,6,4,0.72); backdrop-filter: blur(4px);
    z-index: 200; display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; animation: overlayIn 0.18s ease;
  }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

  .const-modal {
    position: relative; background: var(--bg);
    border-top: 4px solid var(--accent);
    max-width: 520px; width: 100%;
    padding: 1.5rem 1.75rem 1.25rem;
    box-shadow: 0 16px 64px rgba(0,0,0,0.28);
    animation: modalIn 0.2s cubic-bezier(0.22,1,0.36,1);
    display: flex; flex-direction: column; gap: 0.55rem;
  }
  @keyframes modalIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }

  .const-close {
    position: absolute; top: 0.6rem; left: 0.75rem;
    background: none; border: none; font-size: 0.8rem;
    color: var(--text-muted); cursor: pointer; opacity: 0.6; transition: opacity 0.15s;
  }
  .const-close:hover { opacity: 1; }

  .const-modal-meta  { display: flex; flex-direction: column; gap: 0.1rem; font-family: var(--font-ui); font-size: var(--text-xs); }
  .const-modal-speaker { font-weight: 700; color: var(--accent); font-size: var(--text-sm); }
  .const-modal-role    { color: var(--text-muted); font-style: italic; }
  .const-modal-date    { color: var(--text-muted); }

  .const-modal-phrase {
    font-family: var(--font-disp); font-size: var(--text-md); font-weight: 700;
    line-height: 1.35; color: var(--text);
    border-right: 3px solid var(--accent); padding-right: 0.75rem;
  }
  .const-modal-quote { font-family: var(--font-disp); font-style: italic; font-size: var(--text-sm); line-height: 1.7; color: var(--text-muted); }
  .const-modal-en { font-family: var(--font-body); font-style: italic; font-size: var(--text-xs); line-height: 1.6; color: var(--text-muted); direction: ltr; border-left: 2px solid var(--border); padding-left: 0.6rem; }

  .const-modal-icj {
    display: inline-block; font-family: var(--font-ui); font-size: var(--text-xs); font-weight: 700;
    color: var(--accent-light); border: 1px solid currentColor; padding: 0.15rem 0.5rem;
    border-radius: 2px; align-self: flex-start;
  }
  .const-modal-src {
    display: inline-flex; align-items: center; gap: 0.2rem;
    font-family: var(--font-ui); font-size: var(--text-xs);
    color: var(--accent); text-decoration: none;
    border-bottom: 1px solid var(--border); padding-bottom: 1px;
    transition: border-color 0.15s; align-self: flex-start; direction: ltr;
  }
  .const-modal-src:hover { border-color: var(--accent); }

  /* ══ Mobile ══════════════════════════════════════════════════════════════ */
  @media (max-width: 600px) {
    .echo-grid  { flex-wrap: wrap; }
    .echo-col   { flex: 1 1 40%; }
    .sev-grid   { grid-template-columns: 1fr 1fr; }
    .spk-grid   { grid-template-columns: 1fr; }
    .const-canvas { height: 320px !important; }
  }
</style>
