<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
</script>

<section class="intro-section" id="background">
  <div class="container">
    <p class="lede reveal" use:reveal>In the months following the October 7 attacks, a fringe movement calling for the resettlement of Gaza by Jewish Israelis moved from the political margins to the corridors of government — drawing international condemnation and raising urgent questions about the future of the territory.</p>

    <div class="body-text">
      <p class="reveal" use:reveal>A group of settlers, activists, and government ministers gathered in a Jerusalem conference hall in late January 2024 to envision a Gaza after Hamas. But rather than discussing reconstruction for the Palestinian population, the hundreds assembled spoke openly of establishing new Jewish communities along Gaza's Mediterranean coast — in the ruins of Gush Katif, the bloc of settlements Israel dismantled in 2005.</p>

      <div class="inline-image reveal" use:reveal>
        <div class="img-placeholder">
          <img src="/images/inline-conference.jpg" alt="Interior of a large conference hall with delegates seated, a diplomatic setting" loading="lazy" />
        </div>
        <p class="img-caption"><strong>The January 2024 conference.</strong> A gathering of settlement advocates at the "Settlement Brings Security" conference in Jerusalem. Credit: Sarah Khoury / Visual Desk</p>
      </div>

      <p class="reveal" use:reveal>The "Resettle Gaza" movement represents a convergence of religious Zionist ideology, post-October 7 trauma, and a political window that its advocates describe as historic. Settlers expelled from Gaza nearly twenty years ago see in the devastation not a humanitarian catastrophe, but an opportunity for return. Senior Israeli officials have given varying levels of public support, ranging from explicit endorsement to studied ambiguity from others who privately acknowledge the movement's political utility.</p>

      <p class="reveal" use:reveal>International partners including the United States and European governments have repeatedly stated that resettlement of Gaza by Israeli civilians would be illegal under international law and would render a two-state solution impossible. Yet the movement's advocates argue that the old frameworks are themselves obsolete — shattered on October 7 as surely as the kibbutz walls.</p>
    </div>
  </div>
</section>

<style>
  .intro-section { padding: 5rem 0 3.5rem; }

  .lede {
    font-family: var(--font-body);
    font-size: clamp(1.15rem, 2.2vw, 1.45rem);
    font-weight: 400;
    line-height: 1.62;
    color: var(--sand);
    margin-bottom: 2.5rem;
    border-left: 2px solid var(--gold);
    padding-left: 1.4rem;
  }

  .body-text { font-size: 1.02rem; line-height: 1.82; color: var(--text); }
  .body-text :global(p) { margin-bottom: 1.6rem; }
  .body-text > :global(p:first-of-type::first-letter) {
    font-family: var(--font-disp);
    font-size: 4.8rem;
    font-weight: 900;
    float: left;
    line-height: 0.78;
    margin: 0.12em 0.1em 0 0;
    color: var(--gold);
  }

  .inline-image { margin: 2.5rem -1.5rem; }
  @media (min-width: 860px) { .inline-image { margin: 3rem -5rem; } }

  .img-placeholder {
    width: 100%;
    aspect-ratio: 16/7;
    background: #1a1612;
    position: relative;
    overflow: hidden;
  }
  .img-placeholder img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }

  .img-caption {
    font-family: var(--font-ui);
    font-size: 0.63rem;
    letter-spacing: 0.03em;
    color: var(--text-muted);
    padding: 0.5rem 0 0;
    border-top: 1px solid var(--border);
    line-height: 1.5;
  }
  .img-caption :global(strong) { color: var(--text-muted); font-weight: 600; }
</style>
