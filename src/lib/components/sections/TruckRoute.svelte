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

  // Gaps of 1/7 ≈ 0.143 so each stop-to-stop is exactly one page-down
  // at the default scroll height of 7 × window.innerHeight
  const STOP_FRACS = [0.10, 0.243, 0.386, 0.529, 0.671, 0.814];

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
      const w = window.innerWidth;
      const multiplier = w <= 700 ? 4.5 : w <= 1024 ? 5.5 : 7;
      scrollContainer.style.height = window.innerHeight * multiplier + 'px';
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

    function resetTruck() {
      gsap.set(truckIconEl, { x: pt0.x, y: pt0.y, rotation: initAngle, transformOrigin: '50% 50%' });
      svgEl.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
      trailPathEl.style.strokeDashoffset = String(pathLen);
      activeStop = -1;
    }

    const st = ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      invalidateOnRefresh: true,
      onEnter: () => { activeStop = -1; },
      onLeaveBack: () => { resetTruck(); },
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

    // Use IntersectionObserver to detect when section scrolls into view from above,
    // ensuring truck always starts at position 0
    const sectionEl = scrollContainer.closest('.tr-section') as HTMLElement;
    const resetObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Section just entered viewport — if scroll is near the top of section, reset truck
          const rect = sectionEl.getBoundingClientRect();
          if (rect.top > -window.innerHeight * 0.5) {
            resetTruck();
            ScrollTrigger.refresh();
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px' }
    );
    resetObs.observe(sectionEl || scrollContainer);

    // Delayed refresh so layout (fonts, images, min-height) is fully settled
    setTimeout(() => {
      ScrollTrigger.refresh();
      // After refresh, if section is above viewport, truck is at start anyway;
      // if section is already partially visible, let GSAP position it correctly
    }, 300);

    return () => {
      window.removeEventListener('resize', setHeight);
      resetObs.disconnect();
    };
  });

  onDestroy(() => killScrollTriggers(triggers));
</script>

<section class="tr-section" id="truck-route">
  <!-- Section header — sits above the sticky scroll area (desktop only;
       on mobile it is overlaid inside .tr-sticky to eliminate blank space) -->
  <div class="tr-header tr-header--above container-wide">
    <span class="tr-header-label">{truckRoute.sectionLabel}</span>
    <h2 class="tr-header-title">{truckRoute.sectionTitle}</h2>
    <p class="tr-header-sub">{truckRoute.sectionSub}</p>
  </div>

  <div class="tr-scroll-container" bind:this={scrollContainer}>
    <div class="tr-sticky">
      <!-- Mobile header overlay — visible only on small screens -->
      <div class="tr-header tr-header--overlay">
        <span class="tr-header-label">{truckRoute.sectionLabel}</span>
        <h2 class="tr-header-title">{truckRoute.sectionTitle}</h2>
        <p class="tr-header-sub">{truckRoute.sectionSub}</p>
      </div>
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

        <!-- ══ Grass patches — flat top-down, before stop 1 ══ -->
        <!-- Road: M500,50 curves to x≈830,y=320. Road half-width=14px.
             Left road edge at y=88≈646, y=176≈746, y=268≈806.
             Right road edge at y=62≈848, y=130≈860, y=200≈818, y=260≈836.
             Right wall: x=806..1056 at y=294..364. Canvas: 0..1000. -->
        <g class="tr-grass" style="mix-blend-mode: multiply;" opacity="0.55">
          <!-- Left side: 2 outer patches + 1 closer patch near road -->
          <image href="/images/tr-grass-topdown.png" x="300" y="45"  width="170" height="120" transform="rotate(8,385,105)"/>
          <image href="/images/tr-grass-topdown.png" x="270" y="170" width="190" height="135" transform="rotate(-12,365,238)"/>
          <!-- Closer patch: moved up to clear left wall bottom (y=292). Bottom now y=292. -->
          <image href="/images/tr-grass-topdown.png" x="620" y="182" width="160" height="110" transform="rotate(10,700,237)"/>
          <!-- Extra patch further right, near road left edge around y=150; road left≈706 -->
          <image href="/images/tr-grass-topdown.png" x="530" y="130" width="150" height="105" transform="rotate(-8,605,183)"/>
          <!-- Right side: shifted left ~40 and up ~20 from previous, clear of wall (y<290) -->
          <image href="/images/tr-grass-topdown.png" x="836" y="28"  width="155" height="110" transform="rotate(-9,914,83)"/>
          <image href="/images/tr-grass-topdown.png" x="848" y="148" width="140" height="100" transform="rotate(14,918,198)"/>
          <!-- Right patch 3: moved down to y=252 so top clears patch 2 bottom (y=248); bottom=292 clears wall -->
          <image href="/images/tr-grass-topdown.png" x="834" y="252" width="130" height="40"  transform="rotate(-12,899,272)"/>
        </g>

        <!-- ══ Trees — hand-drawn green top-down, before stop 1 ══ -->
        <g class="tr-trees" style="mix-blend-mode: multiply;">
          <!-- Left cluster: 2 trees moved right (near road), rest stay outer -->
          <image href="/images/tr-tree-topdown.png" x="415" y="42"  width="44" height="44" opacity="0.82" transform="rotate(22,437,64)"/>
          <!-- moved left: right edge=588, road left edge at y≈90≈579 — just clear -->
          <image href="/images/tr-tree-topdown.png" x="550" y="82"  width="38" height="38" opacity="0.78" transform="rotate(33,569,101)"/>
          <image href="/images/tr-tree-topdown.png" x="362" y="176" width="36" height="36" opacity="0.72" transform="rotate(-19,380,194)"/>
          <!-- moved right: was x=500,y=176 → x=688,y=172; road left edge at y≈175 is ≈750, tree right=742 ✓ -->
          <image href="/images/tr-tree-topdown.png" x="688" y="172" width="54" height="54" opacity="0.92" transform="rotate(41,715,199)"/>
          <image href="/images/tr-tree-topdown.png" x="424" y="268" width="42" height="42" opacity="0.80" transform="rotate(-29,445,289)"/>
          <image href="/images/tr-tree-topdown.png" x="338" y="100" width="40" height="40" opacity="0.74" transform="rotate(15,358,120)"/>
          <image href="/images/tr-tree-topdown.png" x="328" y="224" width="38" height="38" opacity="0.70" transform="rotate(-34,347,243)"/>
          <!-- Right cluster: shifted left ~40 and up ~20, clear of wall (y<290) and road (x<820) -->
          <!-- road right edge at y=62≈848; trees start x=820 so left of road edge ✓ -->
          <image href="/images/tr-tree-topdown.png" x="820" y="42"  width="50" height="50" opacity="0.88" transform="rotate(-27,845,67)"/>
          <image href="/images/tr-tree-topdown.png" x="818" y="174" width="52" height="52" opacity="0.90" transform="rotate(-36,844,200)"/>
          <image href="/images/tr-tree-topdown.png" x="874" y="76"  width="36" height="36" opacity="0.75" transform="rotate(38,892,94)"/>
          <image href="/images/tr-tree-topdown.png" x="870" y="204" width="38" height="38" opacity="0.82" transform="rotate(31,889,223)"/>
          <image href="/images/tr-tree-topdown.png" x="916" y="48"  width="34" height="34" opacity="0.70" transform="rotate(-14,933,65)"/>
          <image href="/images/tr-tree-topdown.png" x="910" y="142" width="40" height="40" opacity="0.76" transform="rotate(27,930,162)"/>
        </g>

        <!-- ══ Concrete walls — just after stop 1 ══ -->
        <!-- Left: x=540, width=340 (right edge=880), height=70 -->
        <!-- Right: x=806, width=250 (right edge=1056, -10 from prev 1066), height=70 -->
        <g class="tr-walls" style="mix-blend-mode: multiply;" opacity="0.92">
          <image href="/images/tr-wall-topdown.png" x="540" y="298" width="340" height="70"
            transform="rotate(-4,710,333)" opacity="0.95"/>
          <image href="/images/tr-wall-topdown.png" x="806" y="294" width="250" height="70"
            transform="rotate(-4,931,329)" opacity="0.95"/>
        </g>

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

        <!-- Water puddles — in the last third of the route (y≥1200), near the road edges -->
        <g class="tr-puddles" opacity="0.72">
          <!-- Puddle 1: left side road edge, y≈1240 -->
          <ellipse cx="162" cy="1242" rx="18" ry="8" fill="#6ea8c4" opacity="0.45" transform="rotate(-15,162,1242)"/>
          <ellipse cx="162" cy="1242" rx="11" ry="4.5" fill="#8cc0d8" opacity="0.55" transform="rotate(-15,162,1242)"/>
          <!-- Puddle 2: right side road edge, y≈1310 -->
          <ellipse cx="845" cy="1312" rx="22" ry="9" fill="#6ea8c4" opacity="0.42" transform="rotate(10,845,1312)"/>
          <ellipse cx="845" cy="1312" rx="14" ry="5" fill="#8cc0d8" opacity="0.52" transform="rotate(10,845,1312)"/>
          <!-- Puddle 3: left side, y≈1390 — larger pothole puddle -->
          <ellipse cx="170" cy="1392" rx="25" ry="11" fill="#5a9ab8" opacity="0.38" transform="rotate(-8,170,1392)"/>
          <ellipse cx="170" cy="1392" rx="16" ry="6.5" fill="#7ab8d0" opacity="0.50" transform="rotate(-8,170,1392)"/>
          <ellipse cx="170" cy="1392" rx="7" ry="2.5" fill="#9ed0e8" opacity="0.6" transform="rotate(-8,170,1392)"/>
          <!-- Puddle 4: centre road, y≈1465 -->
          <ellipse cx="490" cy="1468" rx="19" ry="7" fill="#6ea8c4" opacity="0.40" transform="rotate(5,490,1468)"/>
          <ellipse cx="490" cy="1468" rx="11" ry="3.5" fill="#8cc0d8" opacity="0.52" transform="rotate(5,490,1468)"/>
          <!-- Puddle 5: right side, y≈1530 -->
          <ellipse cx="830" cy="1533" rx="20" ry="8" fill="#5a9ab8" opacity="0.38" transform="rotate(-12,830,1533)"/>
          <ellipse cx="830" cy="1533" rx="12" ry="4.5" fill="#7ab8d0" opacity="0.50" transform="rotate(-12,830,1533)"/>
          <!-- Puddle 6: left side, y≈1600 -->
          <ellipse cx="158" cy="1602" rx="16" ry="6.5" fill="#6ea8c4" opacity="0.42" transform="rotate(-5,158,1602)"/>
          <ellipse cx="158" cy="1602" rx="9" ry="3" fill="#8cc0d8" opacity="0.55" transform="rotate(-5,158,1602)"/>
        </g>

        <!-- Children crowd — two groups flanking the road near the distribution stop -->
        <image
          href="/images/children-crowd.webp"
          x="290" y="1300"
          width="240" height="300"
          preserveAspectRatio="xMidYMid meet"
          style="mix-blend-mode: multiply; opacity: 0.88;"
        />
        <image
          href="/images/children-crowd.webp"
          x="400" y="1200"
          width="240" height="300"
          preserveAspectRatio="xMidYMid meet"
          style="mix-blend-mode: multiply; opacity: 0.82;"
        />

        <!-- Debris piles — scattered in the destroyed zone (y≥1180) -->
        <g class="tr-debris" opacity="0.78">
          <!-- Cluster A: left side, y≈1210 -->
          <polygon points="95,1208 118,1200 132,1212 125,1228 100,1225" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="105,1220 122,1215 130,1226 115,1233" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="110" y="1228" width="8" height="5" rx="1" fill="#7a6050" transform="rotate(15,114,1230)"/>
          <rect x="96" y="1215" width="5" height="9" rx="1" fill="#6a5040" transform="rotate(-8,98,1219)"/>
          <!-- Cluster B: right side, y≈1260 -->
          <polygon points="860,1252 885,1244 900,1258 888,1272 862,1268" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="870,1265 888,1260 895,1272 875,1278" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="862" y="1268" width="9" height="5" rx="1" fill="#7a6050" transform="rotate(-12,866,1270)"/>
          <circle cx="895" cy="1255" r="4" fill="#7a6050" opacity="0.7"/>
          <circle cx="860" cy="1260" r="3" fill="#6a5040" opacity="0.65"/>
          <!-- Cluster C: left side, y≈1360 -->
          <polygon points="80,1355 108,1346 122,1362 110,1378 82,1374" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="92,1370 112,1364 118,1376 96,1382" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="82" y="1372" width="11" height="5" rx="1" fill="#7a6050" transform="rotate(10,87,1374)"/>
          <rect x="105" y="1358" width="6" height="10" rx="1" fill="#6a5040" transform="rotate(-6,108,1363)"/>
          <circle cx="118" cy="1368" r="3.5" fill="#7a6050" opacity="0.7"/>
          <!-- Cluster D: right side, y≈1430 -->
          <polygon points="860,1424 890,1415 906,1430 893,1446 862,1442" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="872,1438 894,1432 900,1444 876,1450" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="863" y="1440" width="10" height="5" rx="1" fill="#7a6050" transform="rotate(-14,868,1442)"/>
          <circle cx="900" cy="1428" r="4" fill="#7a6050" opacity="0.65"/>
          <!-- Cluster E: left side, y≈1510 -->
          <polygon points="85,1505 112,1496 128,1512 115,1528 88,1524" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="96,1518 116,1512 123,1525 100,1531" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="88" y="1520" width="9" height="6" rx="1" fill="#7a6050" transform="rotate(8,92,1523)"/>
          <rect x="108" y="1506" width="6" height="10" rx="1" fill="#6a5040" transform="rotate(-10,111,1511)"/>
          <!-- Cluster F: right side, y≈1580 -->
          <polygon points="858,1574 886,1565 902,1580 889,1596 860,1592" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="870,1588 890,1582 897,1594 873,1600" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="860" y="1590" width="10" height="5" rx="1" fill="#7a6050" transform="rotate(-16,865,1592)"/>
          <circle cx="896" cy="1577" r="3.5" fill="#7a6050" opacity="0.65"/>
          <!-- Cluster G: centre area, y≈1650 -->
          <polygon points="440,1642 468,1634 482,1648 468,1664 442,1660" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <polygon points="452,1656 470,1650 478,1662 455,1668" fill="#9a8070" stroke="#5a4030" stroke-width="0.5"/>
          <rect x="442" y="1658" width="8" height="5" rx="1" fill="#7a6050" transform="rotate(6,446,1660)"/>
          <!-- Cluster H: right side, y≈1700 -->
          <polygon points="855,1692 882,1683 898,1698 884,1714 857,1710" fill="#8a7060" stroke="#5a4030" stroke-width="0.6"/>
          <rect x="858" y="1708" width="9" height="5" rx="1" fill="#7a6050" transform="rotate(-12,862,1710)"/>
          <circle cx="894" cy="1695" r="3" fill="#7a6050" opacity="0.6"/>
        </g>

        <!-- Trail (animated by GSAP) -->
        <path bind:this={trailPathEl} d={ROUTE_D} fill="none" stroke="#dc3030" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>

        <!-- Scene images — defer loading until adjacent stop is active -->
        {#each truckRoute.stops as _stop, i}
          <g style="opacity: {activeStop === i ? 1 : 0.06}; transition: opacity 0.7s ease;">
            <image
              href={activeStop >= i - 1 ? `/images/scene-${i+1}-${SCENE_SLUGS[i]}.webp` : undefined}
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

  /* Above-the-map header: visible on desktop, hidden on mobile */
  .tr-header--above {
    padding: 0.5rem 0 1.5rem;
  }
  /* Overlay header: hidden on desktop, visible on mobile (positioned over map top) */
  .tr-header--overlay {
    display: none;
  }

  @media (max-width: 768px) {
    /* Hide the external header that creates blank space on mobile */
    .tr-header--above { display: none; }
    /* Show and position the overlay header inside the sticky panel */
    .tr-header--overlay {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 3;
      padding: calc(56px + 0.5rem) clamp(1rem, 4vw, 1.5rem) 1rem;
      background: linear-gradient(to bottom, rgba(245,240,238,0.96) 0%, rgba(245,240,238,0.92) 60%, transparent 100%);
    }
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
    width: min(360px, calc(50vw - 3rem));
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

  @media (min-width: 1400px) {
    .tr-card { width: min(420px, calc(50vw - 4rem)); padding: 1.6rem 1.75rem; }
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
    font-size: clamp(1rem, 1.4vw, 1.3rem);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.6rem;
    line-height: 1.25;
  }

  .tr-card-body {
    font-family: var(--font-body);
    font-size: clamp(0.78rem, 1vw, 0.92rem);
    line-height: 1.72;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .tr-card-wrap {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: flex-end;
    }
    .tr-card {
      border-radius: 0;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      background: rgba(7, 6, 4, 0.93);
      border-top: 2px solid var(--accent);
      border-left: none;
      border-right: none;
      border-bottom: none;
      padding: 1rem 1.25rem 1.25rem;
      color: #e8dbd8;
    }
    .tr-card .tr-card-title { color: #f5ece8; font-size: 1rem; }
    .tr-card .tr-card-body  { color: rgba(232, 219, 216, 0.8); font-size: 0.8rem; }
    .tr-card--right, .tr-card--left {
      left: 0;
      right: 0;
      inset-inline: 0;
    }
    .tr-card--active { display: block; }
  }
</style>
