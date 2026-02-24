<script lang="ts">
  import { viewport } from '$lib/actions/viewport';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import chartsData from '$lib/data/charts.json';

  let barVisible = $state(false);
  let doughnutVisible = $state(false);
  let lineVisible = $state(false);

  const bar = chartsData.bar;
  const doughnut = chartsData.doughnut;
  const line = chartsData.line;

  // Bar chart helpers
  const barMax = bar.yMax;
  const barCount = bar.labels.length;
  const barGroupWidth = 46;
  const barWidth = 16;
  const barGap = 4;
  const chartH = 220;
  const chartTop = 40;

  function barY(val: number) { return chartTop + chartH - (val / barMax) * chartH; }
  function barH(val: number) { return (val / barMax) * chartH; }

  // Doughnut helpers
  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const rad = (a: number) => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(rad(startAngle));
    const y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(endAngle));
    const y2 = cy + r * Math.sin(rad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const doughnutR = 90;
  const doughnutCx = 140;
  const doughnutCy = 140;
  let arcStart = 0;
  const arcs = doughnut.segments.map(seg => {
    const sweep = (seg.value / 100) * 360;
    const arc = { ...seg, d: describeArc(doughnutCx, doughnutCy, doughnutR, arcStart, arcStart + sweep - 0.5) };
    arcStart += sweep;
    return arc;
  });

  // Line chart helpers
  const lineW = 540;
  const lineH = 195;
  const lineTop = 20;
  const lineLeft = 40;
  const lineMax = line.yMax;
  const linePoints = line.values.map((v, i) => {
    const x = lineLeft + (i / (line.values.length - 1)) * lineW;
    const y = lineTop + lineH - (v / lineMax) * lineH;
    return `${x},${y}`;
  });
  const linePolyline = linePoints.join(' ');
  const lineFill = `${lineLeft},${lineTop + lineH} ${linePolyline} ${lineLeft + lineW},${lineTop + lineH}`;

  const colorMap: Record<string, string> = {
    gold: 'var(--gold)',
    red: 'var(--red-light)',
    gray: '#3a3530'
  };
</script>

<section class="charts-section section-topo" id="data">
  <div class="container-wide">
    <SectionHead label={chartsData.sectionLabel} title={chartsData.sectionTitle} sub={chartsData.sectionSub} />

    <!-- Bar Chart -->
    <div class="chart-block" use:viewport={{ onEnter: () => { barVisible = true; }, threshold: 0.3, once: true }}>
      <h3 class="chart-title">{bar.title}</h3>
      <svg viewBox="0 0 {barCount * barGroupWidth + 60} 300" class="chart-svg" role="img" aria-label={bar.title}>
        <!-- Y-axis labels -->
        {#each Array.from({ length: barMax / bar.yStep + 1 }, (_, i) => i * bar.yStep) as tick}
          <text x="28" y={barY(tick) + 4} class="axis-label" text-anchor="end">{tick}</text>
          <line x1="32" y1={barY(tick)} x2={barCount * barGroupWidth + 44} y2={barY(tick)} class="grid-line" />
        {/each}
        <!-- Bars -->
        {#each bar.labels as label, i}
          <rect
            x={36 + i * barGroupWidth}
            y={barY(bar.datasets[0].values[i])}
            width={barWidth}
            height={barH(bar.datasets[0].values[i])}
            fill={colorMap[bar.datasets[0].color]}
            class="bar-fill"
            class:animate={barVisible}
            style="animation-delay: {i * 60}ms;"
          />
          <rect
            x={36 + i * barGroupWidth + barWidth + barGap}
            y={barY(bar.datasets[1].values[i])}
            width={barWidth}
            height={barH(bar.datasets[1].values[i])}
            fill={colorMap[bar.datasets[1].color]}
            class="bar-fill"
            class:animate={barVisible}
            style="animation-delay: {i * 60 + 30}ms;"
          />
          <text x={36 + i * barGroupWidth + barWidth} y={chartTop + chartH + 16} class="axis-label" text-anchor="middle">{label}</text>
        {/each}
      </svg>
      <div class="chart-legend">
        {#each bar.datasets as ds}
          <span class="legend-swatch"><span class="swatch" style="background: {colorMap[ds.color]};"></span> {ds.label}</span>
        {/each}
      </div>
      <p class="chart-footer">{bar.footer}</p>
    </div>

    <!-- Doughnut Chart -->
    <div class="chart-block" use:viewport={{ onEnter: () => { doughnutVisible = true; }, threshold: 0.3, once: true }}>
      <h3 class="chart-title">{doughnut.title}</h3>
      <svg viewBox="0 0 280 280" class="chart-svg doughnut-svg" role="img" aria-label={doughnut.title}>
        {#each arcs as arc, i}
          <path
            d={arc.d}
            fill="none"
            stroke={colorMap[arc.color]}
            stroke-width="28"
            stroke-linecap="butt"
            class="doughnut-segment"
            class:animate={doughnutVisible}
            style="animation-delay: {i * 200}ms;"
          />
        {/each}
        <text x={doughnutCx} y={doughnutCy - 6} class="doughnut-center-num" text-anchor="middle">54%</text>
        <text x={doughnutCx} y={doughnutCy + 14} class="doughnut-center-label" text-anchor="middle">OPPOSE</text>
      </svg>
      <div class="chart-legend">
        {#each doughnut.segments as seg}
          <span class="legend-swatch"><span class="swatch" style="background: {colorMap[seg.color]};"></span> {seg.label} ({seg.value}%)</span>
        {/each}
      </div>
      <p class="chart-footer">{doughnut.footer}</p>
    </div>

    <!-- Line Chart -->
    <div class="chart-block" use:viewport={{ onEnter: () => { lineVisible = true; }, threshold: 0.3, once: true }}>
      <h3 class="chart-title">{line.title}</h3>
      <svg viewBox="0 0 600 260" class="chart-svg" role="img" aria-label={line.title}>
        <!-- Y-axis -->
        {#each Array.from({ length: lineMax / line.yStep + 1 }, (_, i) => i * line.yStep) as tick}
          <text x="34" y={lineTop + lineH - (tick / lineMax) * lineH + 4} class="axis-label" text-anchor="end">{tick}</text>
          <line x1={lineLeft} y1={lineTop + lineH - (tick / lineMax) * lineH} x2={lineLeft + lineW} y2={lineTop + lineH - (tick / lineMax) * lineH} class="grid-line" />
        {/each}
        <!-- X-axis labels -->
        {#each line.labels as label, i}
          <text x={lineLeft + (i / (line.labels.length - 1)) * lineW} y={lineTop + lineH + 18} class="axis-label" text-anchor="middle">{label}</text>
        {/each}
        <!-- Fill area -->
        <polygon points={lineFill} fill="var(--gold)" opacity="0.08" class="line-fill-anim" class:animate={lineVisible} />
        <!-- Line -->
        <polyline points={linePolyline} fill="none" stroke="var(--gold)" stroke-width="2" class="line-draw" class:animate={lineVisible} />
        <!-- Dots -->
        {#each line.values as v, i}
          <circle
            cx={lineLeft + (i / (line.values.length - 1)) * lineW}
            cy={lineTop + lineH - (v / lineMax) * lineH}
            r="3.5"
            fill="var(--bg)"
            stroke="var(--gold)"
            stroke-width="1.5"
            class="line-dot"
            class:animate={lineVisible}
            style="animation-delay: {1 + i * 0.08}s;"
          />
        {/each}
      </svg>
      <p class="chart-footer">{line.footer}</p>
    </div>
  </div>
</section>

<style>
  .charts-section { padding: 5rem 0; }
  .chart-block {
    max-width: 620px;
    margin: 0 auto 4rem;
  }
  .chart-title {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--sand);
    margin-bottom: 1rem;
    text-align: center;
  }
  .chart-svg {
    width: 100%;
    height: auto;
    display: block;
    margin-bottom: 0.75rem;
  }
  .doughnut-svg { max-width: 280px; margin: 0 auto 0.75rem; }
  .axis-label {
    font-family: var(--font-ui);
    font-size: 8px;
    fill: var(--text-muted);
    letter-spacing: 0.04em;
  }
  .grid-line { stroke: var(--border); stroke-width: 0.5; }
  .doughnut-center-num {
    font-family: var(--font-ui);
    font-size: 28px;
    font-weight: 800;
    fill: var(--red-light);
  }
  .doughnut-center-label {
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    fill: var(--text-muted);
  }
  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .legend-swatch {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .swatch {
    width: 10px; height: 10px;
    border-radius: 2px;
    display: inline-block;
  }
  .chart-footer {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.7;
    text-align: center;
    line-height: 1.5;
  }

  /* Bar fill animation */
  .bar-fill {
    transform-origin: bottom;
    transform: scaleY(0);
  }
  .bar-fill.animate {
    animation: barGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes barGrow {
    to { transform: scaleY(1); }
  }

  /* Doughnut segment animation */
  .doughnut-segment {
    opacity: 0;
  }
  .doughnut-segment.animate {
    animation: segFade 0.6s ease forwards;
  }
  @keyframes segFade {
    to { opacity: 1; }
  }

  /* Line draw animation */
  .line-draw {
    stroke-dasharray: 1200;
    stroke-dashoffset: 1200;
  }
  .line-draw.animate {
    animation: lineDraw 1.5s ease forwards;
  }
  @keyframes lineDraw {
    to { stroke-dashoffset: 0; }
  }

  .line-fill-anim { opacity: 0; }
  .line-fill-anim.animate {
    animation: fillFade 1s ease 0.8s forwards;
  }
  @keyframes fillFade {
    to { opacity: 0.08; }
  }

  .line-dot { opacity: 0; }
  .line-dot.animate {
    animation: dotPop 0.3s ease forwards;
  }
  @keyframes dotPop {
    to { opacity: 1; }
  }
</style>
