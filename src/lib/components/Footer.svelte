<script lang="ts">
  import footerData from '$lib/data/footer.json';
</script>

<footer>
  <div class="container">
    <div class="footer-top">
      <div>
        <div class="footer-brand">{footerData.brand}</div>
        <p class="footer-desc">{footerData.description}</p>
      </div>
      <ul class="footer-links">
        {#each footerData.links as link}
          <li><a href={link.href} class="footer-link">{link.label}</a></li>
        {/each}
      </ul>
    </div>
    <div class="footer-bottom">
      <p>{footerData.copyright}</p>
      <p>{footerData.produced}</p>
    </div>
  </div>
</footer>

<style>
  footer {
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    padding: 3.5rem 0 2.5rem;
  }

  .footer-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 2.5rem;
  }

  .footer-brand {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: 0.9rem;
    letter-spacing: 0.2em;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .footer-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    max-width: 280px;
    line-height: 1.6;
  }

  .footer-links { list-style: none; }
  .footer-links li { padding: 0.28rem 0; }
  .footer-link {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    transition: color 0.2s;
    display: block;
  }
  .footer-link:hover { color: var(--accent); }

  .footer-bottom {
    border-top: 1px solid var(--border);
    padding-top: 1.5rem;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .footer-bottom p {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }
</style>
