<script lang="ts">
  let { variant = 'gem' }: { variant?: 'gem' | 'fade' | 'topo' } = $props();
</script>

{#if variant === 'gem'}
  <div class="divider" aria-hidden="true">
    <div class="divider-gem"></div>
  </div>
{:else if variant === 'fade'}
  <hr class="divider-fade" aria-hidden="true" />
{:else}
  <div class="divider-topo" aria-hidden="true"></div>
{/if}
