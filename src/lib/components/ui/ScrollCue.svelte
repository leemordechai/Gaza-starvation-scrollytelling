<script lang="ts">
  let { label = 'Scroll to explore' }: { label?: string } = $props();
</script>

<div class="scroll-cue" aria-hidden="true">
  <div class="scroll-cue-line"></div>
  <span class="scroll-cue-text">{label}</span>
</div>

<style>
  .scroll-cue {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding-top: 2rem;
  }
  .scroll-cue-line {
    width: 1px;
    height: 36px;
    background: linear-gradient(to bottom, var(--accent), transparent);
    animation: cuePulse 2s ease-in-out infinite;
  }
  @keyframes cuePulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  .scroll-cue-text {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--text-muted);
    opacity: 0.6;
  }
</style>
