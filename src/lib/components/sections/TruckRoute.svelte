<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import { truckRoute } from '$lib/data/story.js';

  const VB_W = 1000;
  const VB_H = 600;

  const ROUTE_D = 'M 500,50 C 700,100 850,200 830,320 C 810,440 200,500 180,630 C 160,760 830,820 830,950 C 830,1080 170,1140 180,1260 C 190,1380 840,1440 820,1540 C 800,1620 560,1680 500,1720';

  const SCENE_SLUGS = ['border', 'road', 'gang', 'checkpoint', 'distribution', 'queue'];

  const SCENE_POS = [
    { x: 60,  y: 180,  w: 290, h: 185 },
    { x: 650, y: 480,  w: 290, h: 185 },
    { x: 60,  y: 780,  w: 290, h: 185 },
    { x: 650, y: 1080, w: 290, h: 185 },
    { x: 60,  y: 1380, w: 290, h: 185 },
    { x: 650, y: 1560, w: 290, h: 170 },
  ];

  const STOP_FRACS = [0.06, 0.24, 0.42, 0.60, 0.78, 0.94];

  let svgEl: SVGSVGElement;
  let routePathEl: SVGPathElement;
  let trailPathEl: SVGPathElement;
  let truckIconEl: SVGGElement;
  let stopsGEl: SVGGElement;
  let scrollContainer: HTMLElement;
  let activeStop = $state(-1);
  let triggers: any[] = [];

  onMount(async () => {
    if (!browser) return;

    function setHeight() {
      const isMobile = window.innerWidth <= 768;
      scrollContainer.style.height = window.innerHeight * (isMobile ? 5 : 7) + 'px';
    }
    setHeight();
    window.addEventListener('resize', setHeight, { passive: true });

    const result = await initGsap();
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    const pathLen = routePathEl.getTotalLength();

    trailPathEl.style.strokeDasharray = String(pathLen);
    trailPathEl.style.strokeDashoffset = String(pathLen);

    const stopPoints = STOP_FRACS.map(f => routePathEl.getPointAtLength(f * pathLen));
    stopPoints.forEach((pt) => {
      const outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outer.setAttribute('cx', String(pt.x));
      outer.setAttribute('cy', String(pt.y));
      outer.setAttribute('r', '12');
      outer.setAttribute('fill', 'none');
      outer.setAttribute('stroke', '#dc3030');
      outer.setAttribute('stroke-width', '1.5');
      outer.setAttribute('opacity', '0.4');
      stopsGEl.appendChild(outer);

      const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inner.setAttribute('cx', String(pt.x));
      inner.setAttribute('cy', String(pt.y));
      inner.setAttribute('r', '4');
      inner.setAttribute('fill', '#dc3030');
      inner.setAttribute('opacity', '0.6');
      stopsGEl.appendChild(inner);
    });

    // Set initial position AND rotation so first frame faces the road
    const pt0 = routePathEl.getPointAtLength(0);
    const pt8 = routePathEl.getPointAtLength(8);
    const initAngle = Math.atan2(pt8.y - pt0.y, pt8.x - pt0.x) * (180 / Math.PI);
    gsap.set(truckIconEl, { x: pt0.x, y: pt0.y, rotation: initAngle, transformOrigin: '50% 50%' });

    const st = ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self: any) => {
        const progress = self.progress;
        const dist = progress * pathLen;
        const point = routePathEl.getPointAtLength(dist);

        // Near end of path: look behind instead of ahead to avoid rotation snap
        const lookDist = dist > pathLen * 0.96 ? dist - 8 : dist + 8;
        const lookPt = routePathEl.getPointAtLength(Math.max(0, Math.min(lookDist, pathLen)));
        const dx = dist > pathLen * 0.96 ? point.x - lookPt.x : lookPt.x - point.x;
        const dy = dist > pathLen * 0.96 ? point.y - lookPt.y : lookPt.y - point.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        gsap.set(truckIconEl, { x: point.x, y: point.y, rotation: angle, transformOrigin: '50% 50%' });

        const panY = Math.max(0, point.y - VB_H * 0.42);
        svgEl.setAttribute('viewBox', `0 ${panY} ${VB_W} ${VB_H}`);

        trailPathEl.style.strokeDashoffset = String(pathLen - dist);

        let newStop = -1;
        for (let i = STOP_FRACS.length - 1; i >= 0; i--) {
          if (progress >= STOP_FRACS[i] - 0.03) { newStop = i; break; }
        }
        activeStop = newStop;
      }
    });
    triggers.push(st);

    return () => window.removeEventListener('resize', setHeight);
  });

  onDestroy(() => killScrollTriggers(triggers));
</script>

<section class="tr-section" id="truck-route">
  <!-- Section header — sits above the sticky scroll area -->
  <div class="tr-header container-wide">
    <span class="tr-header-label">{truckRoute.sectionLabel}</span>
    <h2 class="tr-header-title">{truckRoute.sectionTitle}</h2>
    <p class="tr-header-sub">{truckRoute.sectionSub}</p>
  </div>

  <div class="tr-scroll-container" bind:this={scrollContainer}>
    <div class="tr-sticky">
      <svg
        class="tr-svg"
        bind:this={svgEl}
        viewBox="0 0 {VB_W} {VB_H}"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={truckRoute.sectionSub}
      >
        <rect width="1000" height="2100" fill="#f5f0ee"/>

        <!-- Subtle topo lines -->
        <g opacity="0.08">
          {#each [100,300,500,700,900,1100,1300,1500,1700] as y}
            <path d="M0,{y} Q250,{y-20} 500,{y+10} T1000,{y-10}" stroke="#9b2a21" stroke-width="0.5" fill="none"/>
          {/each}
        </g>

        <defs>
          <!-- Full zones -->
          <clipPath id="tr-clip-good"><rect x="0" y="0" width="1000" height="710"/></clipPath>
          <clipPath id="tr-clip-dmg-light"><rect x="0" y="550" width="1000" height="475"/></clipPath>
          <clipPath id="tr-clip-dmg-heavy"><rect x="0" y="865" width="1000" height="475"/></clipPath>
          <clipPath id="tr-clip-destroyed"><rect x="0" y="1180" width="1000" height="920"/></clipPath>
          <!-- Transition blend zones -->
          <clipPath id="tr-clip-t1"><rect x="0" y="550" width="1000" height="160"/></clipPath>
          <clipPath id="tr-clip-t2"><rect x="0" y="865" width="1000" height="160"/></clipPath>
          <clipPath id="tr-clip-t3"><rect x="0" y="1180" width="1000" height="160"/></clipPath>
        </defs>

        <!-- Road surface: paved black at start, degrading to dirt by end -->
        <!-- Paved section (full, clipped to 710): dark asphalt -->
        <path clip-path="url(#tr-clip-good)" d={ROUTE_D} fill="none" stroke="#2a2420" stroke-width="28" stroke-linecap="round"/>
        <path clip-path="url(#tr-clip-good)" d={ROUTE_D} fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round" transform="translate(-12,0)"/>
        <path clip-path="url(#tr-clip-good)" d={ROUTE_D} fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round" transform="translate(12,0)"/>
        <!-- Crumbling section (550–1025): dark asphalt breaking up, overlaps with paved zone -->
        <path clip-path="url(#tr-clip-dmg-light)" d={ROUTE_D} fill="none" stroke="#3a2e28" stroke-width="28" stroke-linecap="round" opacity="0.9"/>
        <path clip-path="url(#tr-clip-dmg-light)" d={ROUTE_D} fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-dasharray="100 8 60 8" transform="translate(-12,0)"/>
        <path clip-path="url(#tr-clip-dmg-light)" d={ROUTE_D} fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.5" stroke-dasharray="80 10 50 10" transform="translate(12,0)"/>
        <!-- Transition 1 overlay: fade paved→crumbling (550–710), crumbling fades IN -->
        <path clip-path="url(#tr-clip-t1)" d={ROUTE_D} fill="none" stroke="#2a2420" stroke-width="28" stroke-linecap="round" opacity="0.55"/>
        <!-- Dirt-track section (865–1340): sandy brown, no lane markings, overlaps crumbling -->
        <path clip-path="url(#tr-clip-dmg-heavy)" d={ROUTE_D} fill="none" stroke="#b89070" stroke-width="26" stroke-linecap="round" opacity="0.9"/>
        <path clip-path="url(#tr-clip-dmg-heavy)" d={ROUTE_D} fill="none" stroke="rgba(180,100,50,0.5)" stroke-width="1.5" stroke-dasharray="30 15" transform="translate(-12,0)"/>
        <!-- Transition 2 overlay: fade crumbling→dirt (865–1025) -->
        <path clip-path="url(#tr-clip-t2)" d={ROUTE_D} fill="none" stroke="#3a2e28" stroke-width="28" stroke-linecap="round" opacity="0.5"/>
        <!-- Full dirt road (1180+): deeper sandy earth tone, rutted, overlaps dirt-track -->
        <path clip-path="url(#tr-clip-destroyed)" d={ROUTE_D} fill="none" stroke="#c8a070" stroke-width="24" stroke-linecap="round" opacity="0.9"/>
        <path clip-path="url(#tr-clip-destroyed)" d={ROUTE_D} fill="none" stroke="rgba(180,120,60,0.4)" stroke-width="8" stroke-dasharray="18 28" stroke-linecap="round"/>
        <!-- Transition 3 overlay: fade dirt→deeper dirt (1180–1340) -->
        <path clip-path="url(#tr-clip-t3)" d={ROUTE_D} fill="none" stroke="#b89070" stroke-width="26" stroke-linecap="round" opacity="0.5"/>

        <!-- Potholes / craters — on the road path -->
        <g opacity="0.82">
          <!-- Zone 1 (crumbling, y≈630–945): road curves left ~x=200, right ~x=800 -->
          <ellipse cx="215" cy="660" rx="6" ry="4" fill="#3a2e28" stroke="rgba(220,60,50,0.45)" stroke-width="0.8" transform="rotate(-10,215,660)"/>
          <ellipse cx="200" cy="700" rx="4" ry="2.5" fill="#3a2e28" stroke="rgba(220,60,50,0.35)" stroke-width="0.7"/>
          <ellipse cx="790" cy="790" rx="4" ry="2.5" fill="#3a2e28" stroke="rgba(220,60,50,0.35)" stroke-width="0.7" transform="rotate(12,790,790)"/>
          <ellipse cx="790" cy="840" rx="5" ry="3.5" fill="#3a2e28" stroke="rgba(220,60,50,0.4)" stroke-width="0.7" transform="rotate(18,790,840)"/>
          <ellipse cx="220" cy="880" rx="5" ry="3" fill="#3a2e28" stroke="rgba(220,60,50,0.4)" stroke-width="0.7" transform="rotate(-6,220,880)"/>
          <!-- Zone 2 (dirt-track, y≈945–1260): road curves left ~x=220, right ~x=790 -->
          <ellipse cx="795" cy="970" rx="8" ry="5" fill="#b07040" stroke="rgba(200,100,50,0.55)" stroke-width="0.8" transform="rotate(-8,795,970)"/>
          <ellipse cx="790" cy="1010" rx="5" ry="3" fill="#b07040" stroke="rgba(200,100,50,0.45)" stroke-width="0.7" transform="rotate(10,790,1010)"/>
          <ellipse cx="225" cy="1050" rx="6" ry="3.5" fill="#b07040" stroke="rgba(200,100,50,0.45)" stroke-width="0.7" transform="rotate(-8,225,1050)"/>
          <ellipse cx="225" cy="1090" rx="7" ry="4.5" fill="#b07040" stroke="rgba(200,100,50,0.5)" stroke-width="0.7" transform="rotate(12,225,1090)"/>
          <ellipse cx="800" cy="1140" rx="6" ry="4" fill="#b07040" stroke="rgba(200,100,50,0.5)" stroke-width="0.7" transform="rotate(-14,800,1140)"/>
          <ellipse cx="230" cy="1200" rx="7" ry="4" fill="#b07040" stroke="rgba(200,100,50,0.5)" stroke-width="0.7" transform="rotate(8,230,1200)"/>
          <!-- Zone 3 (destroyed, y≈1260+): road curves through centre, left, right -->
          <ellipse cx="205" cy="1290" rx="10" ry="6" fill="#c8a070" stroke="rgba(160,90,30,0.6)" stroke-width="0.9" transform="rotate(14,205,1290)"/>
          <ellipse cx="820" cy="1330" rx="7" ry="4.5" fill="#c8a070" stroke="rgba(160,90,30,0.55)" stroke-width="0.8" transform="rotate(-10,820,1330)"/>
          <ellipse cx="820" cy="1370" rx="9" ry="5.5" fill="#c8a070" stroke="rgba(160,90,30,0.6)" stroke-width="0.9" transform="rotate(-16,820,1370)"/>
          <ellipse cx="500" cy="1420" rx="8" ry="5" fill="#c8a070" stroke="rgba(160,90,30,0.6)" stroke-width="0.8" transform="rotate(3,500,1420)"/>
          <ellipse cx="500" cy="1440" rx="11" ry="7" fill="#c8a070" stroke="rgba(160,90,30,0.65)" stroke-width="1" transform="rotate(5,500,1440)"/>
          <ellipse cx="210" cy="1490" rx="9" ry="5.5" fill="#d4aa7a" stroke="rgba(160,90,30,0.65)" stroke-width="0.9" transform="rotate(7,210,1490)"/>
          <ellipse cx="220" cy="1520" rx="12" ry="7" fill="#d4aa7a" stroke="rgba(160,90,30,0.7)" stroke-width="1" transform="rotate(10,220,1520)"/>
          <ellipse cx="825" cy="1560" rx="8" ry="5" fill="#d4aa7a" stroke="rgba(160,90,30,0.65)" stroke-width="0.9" transform="rotate(-12,825,1560)"/>
          <ellipse cx="510" cy="1600" rx="9" ry="5.5" fill="#d4aa7a" stroke="rgba(160,90,30,0.65)" stroke-width="0.9" transform="rotate(4,510,1600)"/>
        </g>

        <!-- Trail (animated by GSAP) -->
        <path bind:this={trailPathEl} d={ROUTE_D} fill="none" stroke="#dc3030" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>

        <!-- Scene images — defer loading until adjacent stop is active -->
        {#each truckRoute.stops as _stop, i}
          <g style="opacity: {activeStop === i ? 1 : 0.06}; transition: opacity 0.7s ease;">
            <image
              href={activeStop >= i - 1 ? `/images/scene-${i+1}-${SCENE_SLUGS[i]}.png` : undefined}
              x={SCENE_POS[i].x}
              y={SCENE_POS[i].y}
              width={SCENE_POS[i].w}
              height={SCENE_POS[i].h}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        {/each}

        <!-- Stop marker circles (populated on mount) -->
        <g bind:this={stopsGEl}></g>

        <!-- Invisible path for getPointAtLength -->
        <path bind:this={routePathEl} d={ROUTE_D} fill="none" stroke="none"/>

        <!-- Truck icon: top-down view, facing +x (direction of travel) -->
        <!-- Total length: 70px (-50 to +20), width: 20px (-10 to +10) -->
        <g bind:this={truckIconEl} transform="translate(500,50)">
          <!-- Drop shadow -->
          <rect x="-49" y="-9" width="68" height="20" rx="4" fill="rgba(0,0,0,0.3)" transform="translate(3,3)"/>
          <!-- Cargo bed (long, on left / rear side) -->
          <rect x="-50" y="-9" width="50" height="20" rx="2" fill="#2a1e1a" stroke="#dc3030" stroke-width="1.3"/>
          <!-- Cargo slats (horizontal ribs across the bed) -->
          <line x1="-50" y1="-3" x2="0" y2="-3" stroke="#3d2a22" stroke-width="0.9"/>
          <line x1="-50" y1="3"  x2="0" y2="3"  stroke="#3d2a22" stroke-width="0.9"/>
          <line x1="-50" y1="9"  x2="0" y2="9"  stroke="#3d2a22" stroke-width="0.9"/>
          <!-- Cab (shorter, on right / front side) -->
          <rect x="0" y="-9" width="18" height="20" rx="3" fill="#3a2820" stroke="#dc3030" stroke-width="1.3"/>
          <!-- Windshield (tall, narrow — covers most of cabin height) -->
          <rect x="7" y="-8" width="8" height="17" rx="1.5" fill="rgba(160,210,240,0.38)"/>
          <!-- Windshield glare -->
          <line x1="8" y1="-7" x2="9" y2="4" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
          <!-- Front bumper -->
          <rect x="16" y="-7" width="4" height="16" rx="1" fill="#dc3030" opacity="0.85"/>
          <!-- Headlights -->
          <circle cx="18" cy="-7" r="2" fill="#ffe88a" opacity="0.9"/>
          <circle cx="18" cy="9"  r="2" fill="#ffe88a" opacity="0.9"/>
          <!-- Front axle -->
          <rect x="8" y="-11" width="3" height="24" rx="1" fill="#111" opacity="0.4"/>
          <!-- Wheels (top-down rectangles — rear pair, mid pair, front pair) -->
          <rect x="-44" y="-13" width="7" height="5" rx="1.5" fill="#111" stroke="#555" stroke-width="0.8"/>
          <rect x="-44" y="9"   width="7" height="5" rx="1.5" fill="#111" stroke="#555" stroke-width="0.8"/>
          <rect x="-34" y="-13" width="7" height="5" rx="1.5" fill="#111" stroke="#555" stroke-width="0.8"/>
          <rect x="-34" y="9"   width="7" height="5" rx="1.5" fill="#111" stroke="#555" stroke-width="0.8"/>
          <rect x="5"   y="-13" width="7" height="5" rx="1.5" fill="#111" stroke="#555" stroke-width="0.8"/>
          <rect x="5"   y="9"   width="7" height="5" rx="1.5" fill="#111" stroke="#555" stroke-width="0.8"/>
        </g>

      </svg>

      <!-- Narrative card overlay — flips side based on scene image position -->
      <div class="tr-card-wrap" aria-live="polite">
        {#each truckRoute.stops as stop, i}
          <!-- Even stops: image is left (x=20), card goes right; odd stops: image right, card left -->
          <div
            class="tr-card"
            class:tr-card--active={activeStop === i}
            class:tr-card--right={i % 2 === 0}
            class:tr-card--left={i % 2 !== 0}
          >
            <span class="tr-card-label">{stop.label}</span>
            <h3 class="tr-card-title">{stop.title}</h3>
            <p class="tr-card-body">{stop.body}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .tr-section { position: relative; }

  .tr-header {
    padding: 4rem 0 1.5rem;
  }

  .tr-header-label {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    display: block;
    margin-bottom: 0.5rem;
  }

  .tr-header-title {
    font-family: var(--font-disp);
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 900;
    color: var(--text);
    line-height: 1.15;
    margin: 0 0 0.6rem;
  }

  .tr-header-sub {
    font-family: var(--font-body);
    font-size: 0.97rem;
    line-height: 1.7;
    color: var(--text-muted);
    white-space: nowrap;
    margin: 0;
  }

  .tr-scroll-container { position: relative; }

  .tr-sticky {
    position: sticky;
    top: 0;
    height: calc(var(--vh, 1vh) * 100);
    min-height: 500px;
    overflow: hidden;
  }

  .tr-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .tr-card-wrap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 2;
  }

  .tr-card {
    position: absolute;
    bottom: 12%;
    width: min(320px, calc(50vw - 3rem));
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 3px solid var(--accent);
    padding: 1.4rem 1.5rem;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    pointer-events: none;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  }

  /* Even stops: image is on the left → card appears on the right, pulled toward center */
  .tr-card--right {
    right: max(2rem, calc(50% - 22rem));
    left: auto;
  }

  /* Odd stops: image is on the right → card appears on the left, pulled toward center */
  .tr-card--left {
    left: max(2rem, calc(50% - 22rem));
    right: auto;
  }

  .tr-card--active {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .tr-card-label {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent);
    display: block;
    margin-bottom: 0.45rem;
  }

  .tr-card-title {
    font-family: var(--font-disp);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.6rem;
    line-height: 1.25;
  }

  .tr-card-body {
    font-family: var(--font-body);
    font-size: 0.82rem;
    line-height: 1.72;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .tr-card-wrap {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
    }
    .tr-card {
      border-radius: 0;
      position: relative;
      inset: auto;
      width: 100%;
      display: none;
      top: auto;
    }
    .tr-card--active { display: block; }
  }
</style>
