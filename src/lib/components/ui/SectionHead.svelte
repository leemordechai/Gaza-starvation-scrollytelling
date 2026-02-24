<script lang="ts">
  import { reveal } from '$lib/actions/reveal';

  let { label, title, sub = '' }: { label: string; title: string; sub?: string } = $props();
</script>

<header class="reveal" use:reveal>
  <span class="sh-label">{label}</span>
  <h2 class="sh-title">{title}</h2>
  {#if sub}
    <p class="sh-sub">{sub}</p>
  {/if}
</header>
