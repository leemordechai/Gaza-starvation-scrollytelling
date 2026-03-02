<script lang="ts">
  import { reveal } from '$lib/actions/reveal';

  // Median food price multiplier across all WFP-tracked commodities
  // Based on Jan 2025 WFP Market Monitor data (peak blockade period)
  const MULTIPLIER = 8.4;

  let monthly = $state(0);
  let result = $derived(Math.round(monthly * MULTIPLIER));
  let ratio = $derived(Math.min((monthly * MULTIPLIER) / Math.max(monthly, 1), 20)); // cap at 20×

  function formatNumber(n: number): string {
    return n.toLocaleString('he-IL');
  }
</script>

<section class="fc-section" id="food-calculator">
  <div class="container">
    <div class="reveal" use:reveal>
      <div class="fc-card" dir="rtl">
        <div class="fc-header">
          <span class="fc-chip">מחשבון</span>
          <h2 class="fc-title">מה זה בעצם אומר?</h2>
          <p class="fc-sub">חשבו כמה היה עולה סל המזון שלכם במחירי עזה 2025</p>
        </div>

        <div class="fc-body">
          <label class="fc-label" for="fc-input">
            כמה שקלים מוציאה משפחתך על מזון בחודש?
          </label>
          <div class="fc-input-row">
            <span class="fc-currency">₪</span>
            <input
              id="fc-input"
              class="fc-input"
              type="number"
              min="100"
              max="50000"
              step="100"
              bind:value={monthly}
              placeholder="2,000"
            />
          </div>

          {#if monthly > 0}
            <div class="fc-result">
              <div class="fc-result-label">בעזה, אותו סל מזון היה עולה</div>
              <div class="fc-result-amount">₪{formatNumber(result)}</div>
              <div class="fc-result-sub">לחודש — פי {MULTIPLIER} יותר</div>

              <div class="fc-bar-wrap">
                <div class="fc-bar-track">
                  <div class="fc-bar-il" style="width: 100%; max-width: {100 / ratio}%"></div>
                </div>
                <span class="fc-bar-label fc-bar-label--il">ישראל</span>
              </div>
              <div class="fc-bar-wrap">
                <div class="fc-bar-track">
                  <div class="fc-bar-gz" style="width: 100%"></div>
                </div>
                <span class="fc-bar-label fc-bar-label--gz">עזה</span>
              </div>
            </div>
          {/if}
        </div>

        <p class="fc-source">
          * מחיר מבוסס על עליית מחירי מזון חציונית לפי נתוני WFP, ינואר 2025 (שיא תקופת הסגר)
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  .fc-section {
    padding: 2rem 0 4rem;
  }

  .fc-card {
    background: var(--bg-section);
    border: 1px solid var(--border-mid);
    border-top: 3px solid rgba(196, 162, 74, 0.6);
    border-radius: 3px;
    padding: 2rem 2.25rem 1.5rem;
    max-width: 560px;
    margin: 0 auto;
  }

  .fc-header {
    margin-bottom: 1.75rem;
  }

  .fc-chip {
    display: inline-block;
    font-family: var(--font-ui);
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(196, 162, 74, 0.9);
    border: 1px solid rgba(196, 162, 74, 0.35);
    padding: 0.15rem 0.5rem;
    border-radius: 2px;
    margin-bottom: 0.75rem;
  }

  .fc-title {
    font-family: var(--font-disp);
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
    margin: 0 0 0.4rem;
  }

  .fc-sub {
    font-family: var(--font-body);
    font-size: 0.82rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0;
  }

  .fc-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .fc-label {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text);
    display: block;
  }

  .fc-input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border-mid);
    border-radius: 2px;
    padding: 0 0.75rem;
    transition: border-color 0.2s;
  }

  .fc-input-row:focus-within {
    border-color: rgba(196, 162, 74, 0.6);
  }

  .fc-currency {
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .fc-input {
    width: 100%;
    background: none;
    border: none;
    outline: none;
    padding: 0.65rem 0;
    font-family: var(--font-ui);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    direction: rtl;
    text-align: right;
  }

  .fc-input::placeholder {
    color: var(--border-mid);
  }

  /* Remove number input arrows */
  .fc-input::-webkit-outer-spin-button,
  .fc-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .fc-input[type='number'] {
    -moz-appearance: textfield;
  }

  .fc-result {
    padding: 1.25rem 1.25rem 1rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-inline-start: 3px solid var(--accent);
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .fc-result-label {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .fc-result-amount {
    font-family: var(--font-disp);
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 900;
    color: var(--accent-light);
    line-height: 1;
    margin: 0.1rem 0;
  }

  .fc-result-sub {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .fc-bar-wrap {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.2rem;
  }

  .fc-bar-track {
    flex: 1;
    height: 8px;
    background: var(--border);
    border-radius: 1px;
    overflow: hidden;
    position: relative;
  }

  .fc-bar-il {
    height: 100%;
    background: var(--text-muted);
    border-radius: 1px;
    transition: width 0.4s ease;
  }

  .fc-bar-gz {
    height: 100%;
    background: var(--accent);
    border-radius: 1px;
    width: 100%;
  }

  .fc-bar-label {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    white-space: nowrap;
    min-width: 2.5rem;
    text-align: start;
  }

  .fc-bar-label--il { color: var(--text-muted); }
  .fc-bar-label--gz { color: var(--accent); }

  .fc-source {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    color: var(--text-muted);
    opacity: 0.6;
    margin-top: 1.25rem;
    letter-spacing: 0.02em;
    line-height: 1.6;
  }
</style>
