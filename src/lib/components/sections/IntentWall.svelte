<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import rawData from '$lib/data/intentQuotes.json';

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

  // ── Filters ───────────────────────────────────────────────────────────────
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
  let lockedCards = $state(new Set<string>());
  let hoveredCard = $state<string | null>(null);

  const NUM_COLS = 4;
  const echoColumns: Q[][] = Array.from({ length: NUM_COLS }, () => []);
  for (let i = 0; i < sorted.length; i++) {
    echoColumns[i % NUM_COLS].push(sorted[i]);
  }

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }

  function echoMatches(q: Q): boolean {
    const kwOk   = activeKw.size   === 0 || [...activeKw].some(id   => keywords.find(k => k.id === id)?.test(q)   ?? false);
    const roleOk = activeRole.size === 0 || [...activeRole].some(id => roles.find(r => r.id === id)?.test(q)       ?? false);
    const yearOk = activeYear.size === 0 || [...activeYear].some(id => years.find(y => y.id === id)?.test(q)       ?? false);
    return kwOk && roleOk && yearOk;
  }

  // Highlight key phrase inside full quote text
  function highlightPhrase(text: string, phrase: string): string {
    if (!phrase) return text;
    const clean = phrase.replace(/^[\u201c\u201d\u05f4"]+|[\u201c\u201d\u05f4"]+$/g, '').trim();
    if (!clean) return text;
    const idx = text.indexOf(clean);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const after  = text.slice(idx + clean.length);
    return `${before}<mark class="iw-highlight">${clean}</mark>${after}`;
  }
</script>

<section class="intent-section section-topo" id="stated-intent" dir="rtl">
  <div class="container-wide">
    <div class="section-header">
      <span class="sh-label">{rawData.sectionLabel}</span>
      <h2 class="sh-title">{rawData.sectionTitle}</h2>
      <p class="sh-sub">{rawData.sectionSubtitle}</p>
    </div>

    <!-- Filter bar -->
    <div class="iw-filterbar">
      <div class="iw-pills">
        <span class="iw-cat-label iw-cat-label--topic">תמות</span>
        {#each keywords as kw}
          <button
            class="iw-pill iw-pill--topic"
            class:iw-pill--active={activeKw.has(kw.id)}
            onclick={() => activeKw = toggle(activeKw, kw.id)}
          >{kw.label}</button>
        {/each}

        <span class="iw-pill-sep" aria-hidden="true"></span>

        <span class="iw-cat-label iw-cat-label--role">בעלי תפקידים</span>
        {#each roles as r}
          <button
            class="iw-pill iw-pill--role"
            class:iw-pill--active={activeRole.has(r.id)}
            onclick={() => activeRole = toggle(activeRole, r.id)}
          >{r.label}</button>
        {/each}

        <span class="iw-pill-sep" aria-hidden="true"></span>

        <span class="iw-cat-label iw-cat-label--year">שנה</span>
        {#each years as y}
          <button
            class="iw-pill iw-pill--year"
            class:iw-pill--active={activeYear.has(y.id)}
            onclick={() => activeYear = toggle(activeYear, y.id)}
          >{y.label}</button>
        {/each}

        {#if activeKw.size > 0 || activeRole.size > 0 || activeYear.size > 0}
          <span class="iw-pill-sep" aria-hidden="true"></span>
          <button class="iw-pill iw-pill--clear" onclick={() => { activeKw = new Set(); activeRole = new Set(); activeYear = new Set(); }}>× נקה הכל</button>
        {/if}
      </div>

      <button
        class="iw-expand-btn"
        onclick={() => { expandAll = !expandAll; lockedCards = new Set(); hoveredCard = null; }}
        aria-pressed={expandAll}
      >{expandAll ? '▴ כווץ הכל' : '▾ פתח הכל'}</button>
    </div>

    <!-- 4-column card grid -->
    <div class="iw-grid">
      {#each echoColumns as col}
        <div class="iw-col">
          {#each col as q (q.id)}
            {@const matches = echoMatches(q)}
            {@const anyActive = activeKw.size > 0 || activeRole.size > 0 || activeYear.size > 0}
            {@const isLocked = lockedCards.has(q.id)}
            {@const isOpen = expandAll || isLocked || hoveredCard === q.id}
            <div
              class="iw-card"
              class:iw-card--open={isOpen}
              class:iw-card--locked={isLocked}
              class:iw-card--match={matches}
              class:iw-card--dim={!matches && anyActive}
              class:iw-card--minister={roleCategory(q) === 'minister'}
              class:iw-card--mk={roleCategory(q) === 'mk'}
              onmouseenter={() => { if (!expandAll && !isLocked) hoveredCard = q.id; }}
              onmouseleave={() => { if (hoveredCard === q.id) hoveredCard = null; }}
              onclick={() => { lockedCards = toggle(lockedCards, q.id); hoveredCard = null; }}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lockedCards = toggle(lockedCards, q.id); } }}
              aria-expanded={isOpen}
              use:reveal
            >
              <p class="iw-phrase">״{q.key_phrase_he}״</p>

              <div class="iw-details" class:iw-details--open={isOpen}>
                <div class="iw-details-inner">
                  <p class="iw-full-quote">{@html highlightPhrase(q.quote_he, q.key_phrase_he)}</p>
                  {#if q.originally_english === 'True' && q.quote_en}
                    <p class="iw-en-quote" dir="ltr">"{q.quote_en}"</p>
                  {/if}
                  <div class="iw-foot">
                    <span class="iw-role-tag iw-role-tag--{roleCategory(q)}">
                      {roleCategory(q) === 'minister' ? 'שר/ה' : roleCategory(q) === 'mk' ? 'ח״כ' : 'אחר'}
                    </span>
                    <span class="iw-speaker">{q.speaker}</span>
                    <span class="iw-meta">{q.title} · {q.date}</span>
                    <a class="iw-src-link" href={q.source_url} target="_blank" rel="noopener noreferrer" onclick={(e) => e.stopPropagation()}>↗ {q.source_label}</a>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .intent-section {
    background: var(--bg-section);
    padding: clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 8vw, 5rem);
    direction: rtl;
    font-family: var(--font-body);
    min-height: calc(var(--vh, 1vh) * 100);
    scroll-snap-align: start;
  }

  .section-header {
    margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
  }

  /* ── Filter bar ─────────────────────────────────────────────── */
  .iw-filterbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 1.4rem;
    flex-wrap: wrap;
  }
  .iw-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }
  .iw-cat-label {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }
  .iw-cat-label--topic { background: rgba(192,53,40,0.08); color: var(--accent); }
  .iw-cat-label--role  { background: rgba(139,74,58,0.08); color: var(--sand); }
  .iw-cat-label--year  { background: rgba(106,88,85,0.08); color: var(--text-muted); }

  .iw-pill-sep {
    display: inline-block;
    width: 2px;
    height: 1.4em;
    background: var(--text-muted);
    opacity: 0.4;
    margin: 0 0.5rem;
    align-self: center;
    border-radius: 1px;
  }
  .iw-pill {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 600;
    background: none;
    border-radius: 20px;
    padding: 0.22rem 0.7rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    color: var(--accent);
    border: 1.5px solid rgba(192,53,40,0.3);
  }
  .iw-pill:hover { background: rgba(192,53,40,0.07); border-color: var(--accent); }
  .iw-pill--active { background: var(--accent); color: #fff; border-color: var(--accent); }

  .iw-pill--role { color: var(--sand); border-color: rgba(139,74,58,0.35); }
  .iw-pill--role:hover { background: rgba(139,74,58,0.07); border-color: var(--sand); }
  .iw-pill--role.iw-pill--active { background: var(--sand); border-color: var(--sand); color: #fff; }

  .iw-pill--year { color: var(--text-muted); border-color: var(--border-mid); }
  .iw-pill--year:hover { background: rgba(106,88,85,0.07); border-color: var(--text-muted); }
  .iw-pill--year.iw-pill--active { background: var(--text-muted); border-color: var(--text-muted); color: #fff; }

  .iw-pill--clear { background: none; border-style: dashed; color: var(--text-muted); border-color: var(--border-mid); font-size: calc(var(--text-xs) - 0.04rem); }
  .iw-pill--clear:hover { color: var(--accent); border-color: var(--accent); background: none; }

  .iw-expand-btn {
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
  .iw-expand-btn:hover,
  .iw-expand-btn[aria-pressed="true"] { color: var(--accent); border-color: var(--accent); }

  /* ── Grid: explicit columns, left-to-right row-major order ─── */
  .iw-grid {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .iw-col {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  /* ── Cards ──────────────────────────────────────────────────── */
  .iw-card {
    display: block;
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-top: 3px solid var(--border-mid);
    padding: 0.7rem 0.8rem 0.6rem;
    cursor: pointer;
    transition: opacity 0.22s, filter 0.22s, border-top-color 0.18s, box-shadow 0.18s;
  }
  .iw-card:hover,
  .iw-card--open         { border-top-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-dim), 0 4px 14px rgba(0,0,0,0.07); }
  .iw-card--locked::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 6px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
  }
  .iw-card--match         { border-top-color: var(--accent); }
  .iw-card--dim           { opacity: 0.12; filter: grayscale(0.7); pointer-events: none; }
  .iw-card--minister:not(.iw-card--dim) { border-top-color: var(--accent-light); }
  .iw-card--mk:not(.iw-card--dim)       { border-top-color: var(--sand); }

  .iw-phrase {
    font-family: var(--font-disp);
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1.4;
    color: var(--text);
    margin: 0;
  }

  /* ── Expandable details ─────────────────────────────────────── */
  .iw-details {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.22s ease;
  }
  .iw-details--open { grid-template-rows: 1fr; }
  .iw-details-inner { overflow: hidden; }

  .iw-full-quote {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1.65;
    color: var(--text);
    border-right: 2px solid var(--accent);
    padding-right: 0.6rem;
    margin: 0.55rem 0 0.4rem;
    font-style: italic;
  }
  /* :global needed — injected via {@html} */
  :global(.iw-highlight) {
    background: var(--accent-dim);
    color: var(--accent-light);
    font-style: normal;
    font-weight: 700;
    padding: 0 2px;
    border-radius: 2px;
  }
  .iw-en-quote {
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
  .iw-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.5rem;
    border-top: 1px solid var(--border);
    padding-top: 0.4rem;
    font-family: var(--font-ui);
  }
  .iw-role-tag {
    display: inline-block;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 0.08rem 0.32rem;
    border-radius: 2px;
  }
  .iw-role-tag--minister { background: rgba(192,53,40,0.1);  color: var(--accent-light); }
  .iw-role-tag--mk       { background: rgba(139,74,58,0.1);  color: var(--sand); }
  .iw-role-tag--other    { background: rgba(106,88,85,0.08); color: var(--text-muted); }
  .iw-speaker  { font-size: var(--text-xs); font-weight: 700; color: var(--accent); }
  .iw-meta     { font-size: var(--text-xs); color: var(--text-muted); }
  .iw-src-link {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-decoration: none;
    border-bottom: 1px solid var(--border);
    transition: color 0.15s, border-color 0.15s;
    margin-inline-start: auto;
    direction: ltr;
  }
  .iw-src-link:hover { color: var(--accent); border-color: var(--accent); }

  /* ── Mobile ─────────────────────────────────────────────────── */
  @media (max-width: 700px) {
    .iw-grid { flex-wrap: wrap; }
    .iw-col  { flex: 1 1 45%; }
  }
  @media (max-width: 420px) {
    .iw-col  { flex: 1 1 100%; }
  }
</style>
