<script lang="ts">
  import { navVisible, mobileMenuOpen, activeSection, visitedSections } from '$lib/stores/nav';
  import { scrollProgress } from '$lib/stores/scroll';
  import navData from '$lib/data/nav.json';

  function toggleMenu() {
    mobileMenuOpen.update(v => !v);
  }

  // Reading time estimate
  const totalMinutes = 14;
  let minsLeft = $derived(Math.max(0, Math.round(totalMinutes * (1 - $scrollProgress))));
  let timeText = $derived(minsLeft > 0 ? `~${minsLeft} דקות קריאה` : 'סיום');
  let showTime = $derived($scrollProgress > 0.05);
</script>

<nav class="site-nav" class:visible={$navVisible}>
  <a class="nav-logo" href="#" aria-label="חזרה לתחילת העמוד">{navData.brand}</a>
  <ul class="nav-links">
    {#each navData.links as link}
      <li><a href={link.href} class:active={$activeSection === link.href.slice(1)} class:visited={$visitedSections.has(link.href.slice(1)) && $activeSection !== link.href.slice(1)}>{link.label}</a></li>
    {/each}
  </ul>
  <span class="nav-time" class:visible={showTime}>{timeText}</span>
  <button class="nav-burger" class:open={$mobileMenuOpen} aria-label={$mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'} aria-expanded={$mobileMenuOpen} onclick={toggleMenu}>
    <span></span><span></span><span></span>
  </button>
</nav>

<style>
  .site-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 990;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(1.5rem, 3vw, 4rem);
    height: 54px;
    background: rgba(12, 11, 8, 0.94);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(196, 162, 74, 0.12);
    transform: translateY(-100%);
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .site-nav.visible { transform: translateY(2px); }

  @media (min-width: 1400px) {
    .site-nav { height: 60px; }
    .nav-links { gap: 3rem; }
    .nav-logo { font-size: 0.92rem; }
  }

  .nav-logo {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 0.18em;
    color: var(--accent);
    text-transform: uppercase;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 1.75rem;
    list-style: none;
  }
  .nav-links a {
    font-family: var(--font-ui);
    font-size: 0.63rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(220, 200, 170, 0.92);
    text-decoration: none;
    transition: color 0.2s;
    white-space: nowrap;
  }
  .nav-links a:hover { color: #fff; }
  .nav-links a.active { color: var(--accent-light); }
  .nav-links a.visited { color: rgba(196, 162, 74, 0.65); }
  @media (max-width: 767px) {
    .nav-links { display: none; }
  }
  @media (max-width: 600px) {
    .site-nav { padding: 0 1.25rem; justify-content: flex-start; gap: 0.75rem; }
    .nav-logo { flex: 1; }
  }

  .nav-time {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.4s;
    white-space: nowrap;
  }
  .nav-time.visible { opacity: 1; }

  .nav-burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    width: 32px;
    height: 32px;
  }
  .nav-burger span {
    display: block;
    width: 22px;
    height: 1.5px;
    background: var(--text-muted);
    transition: transform 0.3s, opacity 0.3s, background 0.2s;
  }
  .nav-burger:hover span { background: var(--accent); }
  .nav-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .nav-burger.open span:nth-child(2) { opacity: 0; }
  .nav-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
  @media (max-width: 768px) { .nav-burger { display: flex; width: 44px; height: 44px; } }
</style>
