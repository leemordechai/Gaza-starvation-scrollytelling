<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  let { text }: { text: string } = $props();
</script>

<section class="bodytext-section">
  <div class="container">
    <p class="bodytext-p reveal" use:reveal>{text}</p>
  </div>
</section>

<style>
  .bodytext-section {
    padding: 2.5rem 0;
  }

  .bodytext-p {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text);
  }
</style>
