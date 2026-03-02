<script lang="ts">
  import { scrollProgress } from '$lib/stores/scroll';
</script>

<div class="progress-bar" aria-hidden="true" style="width: {$scrollProgress * 100}%"></div>

<style>
  .progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    width: 0%;
    background: linear-gradient(90deg, var(--accent), var(--accent-light), var(--accent));
    z-index: 1000;
    box-shadow: 0 0 8px rgba(196, 162, 74, 0.5);
    pointer-events: none;
  }
</style>
