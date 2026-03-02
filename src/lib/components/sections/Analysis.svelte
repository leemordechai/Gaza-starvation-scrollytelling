<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import analysisData from '$lib/data/analysis.json';
</script>

<section class="analysis-section section-topo" id="analysis">
  <div class="container-wide">
    <SectionHead label={analysisData.sectionLabel} title={analysisData.sectionTitle} />

    <div class="analysis-grid">
      <div class="analysis-body body-text">
        {#each analysisData.paragraphs as p}
          <p class="reveal" use:reveal>{p}</p>
        {/each}
      </div>

      <aside class="analysis-sidebar">
        <!-- Key Voices -->
        <div class="sidebar-card reveal" use:reveal>
          <div class="sidebar-card-title">קולות מפתח</div>
          <ul class="sidebar-list">
            {#each analysisData.keyVoices as voice}
              <li>{voice}</li>
            {/each}
          </ul>
        </div>

        <!-- Related Coverage -->
        <div class="sidebar-card reveal" use:reveal>
          <div class="sidebar-card-title">כיסוי קשור</div>
          <ul class="sidebar-list">
            {#each analysisData.relatedCoverage as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>

        <!-- Methodology -->
        <div class="sidebar-card reveal" use:reveal>
          <div class="sidebar-card-title">מתודולוגיה</div>
          <p>{analysisData.methodology}</p>
        </div>
      </aside>
    </div>
  </div>
</section>

<style>
  .analysis-section { padding: 5rem 0; background: var(--bg-section); }

  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  /* On wider screens, give body more weight than sidebar */
  @media (min-width: 900px) {
    .analysis-grid {
      grid-template-columns: 3fr 2fr;
    }
  }

  .analysis-body { font-size: 1.02rem; line-height: 1.82; color: var(--text); }
  .analysis-body :global(p) { margin-bottom: 1.6rem; }

  .sidebar-card {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    padding: 1.4rem;
    margin-bottom: 1.2rem;
  }

  .sidebar-card-title {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.85rem;
  }

  .sidebar-card :global(p) {
    font-size: 0.83rem;
    line-height: 1.7;
    color: var(--text-muted);
  }

  .sidebar-list { list-style: none; }
  .sidebar-list li {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: var(--text-muted);
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .sidebar-list li::before {
    content: '';
    width: 4px;
    height: 4px;
    background: var(--accent);
    flex-shrink: 0;
    transform: rotate(45deg);
    margin-top: 2px;
  }
</style>
