<script lang="ts">
  import { audioEnabled } from '$lib/stores/audio';
  import { navVisible } from '$lib/stores/nav';
  import { browser } from '$app/environment';

  let audioEl: HTMLAudioElement | undefined = $state(undefined);
  let canPlay = $state(false);

  $effect(() => {
    if (!audioEl) return;
    if ($audioEnabled) {
      audioEl.play().catch(() => { audioEnabled.set(false); });
    } else {
      audioEl.pause();
    }
  });

  function toggle() {
    if (!browser) return;
    audioEnabled.update(v => !v);
  }
</script>

<!-- AudioPlayer: appears after hero, bottom-inline-start corner.
     Requires static/audio/gaza-ambient.mp3 (CC0 ambient sound).
     Recommended source: Freesound.org — search "market crowd ambient" filtered CC0.
-->
<div class="ap-wrap" class:ap-wrap--visible={$navVisible}>
  <!-- preload="none" — only loads when user clicks play -->
  <audio
    bind:this={audioEl}
    src="/audio/gaza-ambient.mp3"
    loop
    preload="none"
    volume="0.18"
    oncanplay={() => { canPlay = true; }}
  ></audio>

  <button
    class="ap-btn"
    class:ap-btn--active={$audioEnabled}
    onclick={toggle}
    aria-label={$audioEnabled ? 'השתק' : 'הפעל צליל סביבתי'}
    title={$audioEnabled ? 'השתק' : 'הפעל צליל סביבתי'}
  >
    {#if $audioEnabled}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    {:else}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    {/if}
  </button>
</div>

<style>
  .ap-wrap {
    position: fixed;
    inset-inline-start: 1.5rem;
    bottom: 5rem;
    z-index: 500;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.4s ease, transform 0.4s ease;
    pointer-events: none;
  }

  .ap-wrap--visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }

  .ap-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(12, 11, 8, 0.88);
    border: 1px solid rgba(196, 162, 74, 0.35);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    backdrop-filter: blur(8px);
  }

  .ap-btn:hover {
    border-color: rgba(196, 162, 74, 0.8);
    color: rgba(196, 162, 74, 0.9);
  }

  .ap-btn--active {
    border-color: rgba(196, 162, 74, 0.7);
    color: rgba(196, 162, 74, 0.85);
    background: rgba(12, 11, 8, 0.95);
  }
</style>
