<script lang="ts">
  import { toastVisible } from '$lib/stores/copyToast';
</script>

<div class="pq-toast" class:show={$toastVisible}>Copied!</div>

<style>
  .pq-toast {
    position: fixed;
    bottom: 2.5rem;
    left: 50%;
    transform: translateX(-50%) translateY(12px);
    background: var(--accent);
    color: #0c0b08;
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 0.5rem 1.4rem;
    border-radius: 2px;
    z-index: 3000;
    opacity: 0;
    transition: opacity 0.25s, transform 0.25s;
    pointer-events: none;
  }
  .pq-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
