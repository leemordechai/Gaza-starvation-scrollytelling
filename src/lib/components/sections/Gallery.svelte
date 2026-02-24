<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import { openLightbox } from '$lib/stores/lightbox';
  import galleryData from '$lib/data/gallery.json';

  const images = [
    '/images/gallery-1.jpg',
    '/images/gallery-2.jpg',
    '/images/gallery-3.jpg',
    '/images/gallery-4.jpg',
    '/images/gallery-5.jpg'
  ];

  function handleClick(e: MouseEvent, index: number) {
    const caption = galleryData[index]?.caption || '';
    const imgSrc = images[index];
    openLightbox(null as any, caption, `<img src="${imgSrc}" alt="${galleryData[index]?.ariaLabel || ''}" style="max-width:100%;max-height:85vh;object-fit:contain;display:block;" />`);
  }
</script>

<section class="gallery-section" id="gallery">
  <div class="container-wide">
    <div class="gallery-head">
      <SectionHead label="Photography" title="A Vision in Ruins" />
    </div>

    <div class="gallery-grid">
      {#each galleryData as item, i}
        <div
          class="g-item reveal {i === 1 || i === 3 ? 'delay-1' : ''} {i === 4 ? 'delay-2' : ''}"
          use:reveal
          role="button"
          tabindex={0}
          onclick={(e) => handleClick(e, i)}
          onkeydown={(e) => { if (e.key === 'Enter') handleClick(e as any, i); }}
        >
          <div class="g-ph">
            <img src={images[i]} alt={item.ariaLabel} loading="lazy" />
          </div>
          <p class="g-cap">{item.caption}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .gallery-section { padding: 5rem 0; }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 4px;
  }
  .g-item {
    position: relative; overflow: hidden;
    background: var(--bg-card); cursor: pointer;
  }
  .g-item:nth-child(1) { grid-column: 1/8; grid-row: 1; }
  .g-item:nth-child(2) { grid-column: 8/13; grid-row: 1; }
  .g-item:nth-child(3) { grid-column: 1/5; grid-row: 2; }
  .g-item:nth-child(4) { grid-column: 5/9; grid-row: 2; }
  .g-item:nth-child(5) { grid-column: 9/13; grid-row: 2; }

  .g-ph {
    width: 100%; padding-bottom: 62%;
    position: relative; background: #f5edd8; overflow: hidden;
    filter: saturate(0.4) brightness(0.95);
    transition: filter 0.5s ease, transform 0.5s ease;
  }
  .g-ph img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .g-item:hover .g-ph { filter: saturate(1) brightness(1); transform: scale(1.03); }
  .g-item:nth-child(3) .g-ph,
  .g-item:nth-child(4) .g-ph,
  .g-item:nth-child(5) .g-ph { padding-bottom: 90%; }

  .g-cap {
    padding: 0.4rem 0.5rem;
    font-family: var(--font-ui); font-size: 0.6rem;
    color: var(--text-muted); line-height: 1.45;
    border-top: 1px solid var(--border);
  }

  @media (max-width: 700px) {
    .gallery-grid { grid-template-columns: 1fr 1fr; }
    .g-item:nth-child(1), .g-item:nth-child(2) { grid-column: 1/-1; }
    .g-item:nth-child(3), .g-item:nth-child(4) { grid-column: span 1; }
    .g-item:nth-child(5) { grid-column: 1/-1; }
  }
</style>
