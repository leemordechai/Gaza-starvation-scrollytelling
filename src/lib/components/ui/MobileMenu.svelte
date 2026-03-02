<script lang="ts">
  import { mobileMenuOpen, activeSection } from '$lib/stores/nav';
  import navData from '$lib/data/nav.json';

  function close() {
    mobileMenuOpen.set(false);
  }

  // Lock body scroll when open
  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = $mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  });
</script>

<div class="mobile-menu" class:open={$mobileMenuOpen}>
  <button class="mob-close" aria-label="Close menu" onclick={close}>&times;</button>
  {#each navData.links as link}
    <a class="mob-link" href={link.href} class:active={$activeSection === link.href.slice(1)} onclick={close}>{link.label}</a>
  {/each}
</div>

<style>
  .mobile-menu {
    position: fixed;
    inset: 0;
    z-index: 980;
    background: rgba(12, 11, 8, 0.98);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.5rem;
    transform: translateX(-100%);
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
  }
  .mobile-menu.open { transform: translateX(0); pointer-events: all; }

  .mobile-menu :global(a) {
    font-family: var(--font-ui);
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .mobile-menu :global(a:hover),
  .mobile-menu :global(a.active) { color: var(--accent); }

  .mob-close {
    position: absolute;
    top: 1.5rem;
    inset-inline-end: 1.5rem;
    background: none;
    border: 1px solid var(--border-mid);
    color: var(--text-muted);
    font-size: 0.9rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, border-color 0.2s;
  }
  .mob-close:hover { color: var(--accent); border-color: var(--accent); }
</style>
