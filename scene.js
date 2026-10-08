/*
 * Hero WebGL scene — an orbital "learning system": a faceted core inside a
 * data-network sphere, three orbit rings whose nodes carry the DOM labels,
 * and a drifting star field. Progressive enhancement only: the CSS orb stays
 * visible until the first frame renders, and remains if WebGL is unavailable.
 */
const hero = document.querySelector('.hero');
const canvas = document.getElementById('hero-canvas');
const anchor = document.querySelector('[data-scene-anchor]');
const labels = [...document.querySelectorAll('[data-scene-label]')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const compact = matchMedia('(max-width: 900px)');

const PALETTES = {
    dark: {
        primary: 0x8b9bff, secondary: 0x5eead4, warm: 0xf5c46b, star: 0xdfe4ff,
        core: 0x111735, emissive: 0x2a3378, edge: 0xb7c1ff,
        additive: true, glow: 0.85, network: 0.22, rings: 0.55, stars: 0.9
    },
    light: {
        primary: 0x3346d3, secondary: 0x0b8a80, warm: 0xb87308, star: 0x3346d3,
        core: 0xe9ecff, emissive: 0x000000, edge: 0x2b3dbf,
        additive: false, glow: 0.28, network: 0.3, rings: 0.65, stars: 0.55
    }
};

function supportsWebGL() {
    try {
        const probe = document.createElement('canvas');
        return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch (error) {
        return false;
    }
}

function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/vendor/three.r128.min.js';
        script.async = true;
        const timeout = setTimeout(() => reject(new Error('Three.js load timeout')), 15000);
        script.onload = () => { clearTimeout(timeout); resolve(window.THREE); };
        script.onerror = () => { clearTimeout(timeout); reject(new Error('Three.js unavailable')); };
        document.head.append(script);
    });
}

function radialTexture(THREE, stops) {
    const size = 128;
    const surface = document.createElement('canvas');
    surface.width = surface.height = size;
    const context = surface.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(surface);
    texture.needsUpdate = true;
    return texture;
}

function fibonacciSphere(count, radius) {
    const points = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i += 1) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
    }
    return points;
}

function build(THREE) {
    const small = compact.matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    const glowMap = radialTexture(THREE, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
    const dotMap = radialTexture(THREE, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]);

    // Lights for the faceted core.
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const keyLight = new THREE.PointLight(0x8b9bff, 2.4, 30);
    keyLight.position.set(4, 4, 6);
    const rimLight = new THREE.PointLight(0x5eead4, 1.8, 30);
    rimLight.position.set(-5, -3, 3);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(0, 5, 8);
    scene.add(ambient, keyLight, rimLight, fill);

    // Everything that sits in the hero visual's box.
    const rig = new THREE.Group();
    const system = new THREE.Group();
    rig.add(system);
    scene.add(rig);

    // Core: solid faceted icosahedron + bright edges + counter-rotating shell.
    const coreGeometry = new THREE.IcosahedronGeometry(0.95, 0);
    const coreMaterial = new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.3, flatShading: true });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    const coreEdgesMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
    core.add(new THREE.LineSegments(new THREE.EdgesGeometry(coreGeometry), coreEdgesMaterial));
    const shellMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false });
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.4, 1)), shellMaterial);
    const coreGlowMaterial = new THREE.SpriteMaterial({ map: glowMap, transparent: true, depthWrite: false });
    const coreGlow = new THREE.Sprite(coreGlowMaterial);
    coreGlow.scale.setScalar(6.5);
    system.add(coreGlow, core, shell);

    // Network sphere: fibonacci nodes linked to near neighbours.
    const nodes = fibonacciSphere(small ? 56 : 84, 2.05);
    const nodePositions = new Float32Array(nodes.flat());
    const linkPositions = [];
    const linkDistance = small ? 0.95 : 0.8;
    for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
            const dx = nodes[i][0] - nodes[j][0];
            const dy = nodes[i][1] - nodes[j][1];
            const dz = nodes[i][2] - nodes[j][2];
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < linkDistance) linkPositions.push(...nodes[i], ...nodes[j]);
        }
    }
    const network = new THREE.Group();
    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
    const linkMaterial = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    const nodeMaterial = new THREE.PointsMaterial({ size: 0.09, map: dotMap, transparent: true, depthWrite: false, sizeAttenuation: true });
    network.add(new THREE.LineSegments(linkGeometry, linkMaterial), new THREE.Points(nodeGeometry, nodeMaterial));
    system.add(network);

    // Orbit rings with a glowing node each. Node i drives label i.
    const ringSpecs = [
        { radius: 2.75, tilt: [1.25, 0.15, 0.1], speed: 0.32, phase: 0.6, key: 'primary' },
        { radius: 3.25, tilt: [1.05, -0.55, 0.45], speed: -0.22, phase: 2.6, key: 'secondary' },
        { radius: 3.75, tilt: [1.4, 0.6, -0.35], speed: 0.15, phase: 4.4, key: 'warm' }
    ];
    const rings = ringSpecs.map((spec) => {
        const pivot = new THREE.Group();
        pivot.rotation.set(...spec.tilt);
        const ringMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, 0.0085, 6, 220), ringMaterial);
        const orbit = new THREE.Group();
        orbit.rotation.z = spec.phase;
        const nodeMaterialRing = new THREE.MeshBasicMaterial();
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 20), nodeMaterialRing);
        node.position.set(spec.radius, 0, 0);
        const haloMaterial = new THREE.SpriteMaterial({ map: glowMap, transparent: true, depthWrite: false });
        const halo = new THREE.Sprite(haloMaterial);
        halo.scale.setScalar(0.9);
        node.add(halo);
        // A short comet trail following each node along its ring.
        const trailMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
        const trailArc = Math.PI * 0.32;
        const trail = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, 0.022, 6, 48, trailArc), trailMaterial);
        trail.rotation.z = spec.speed > 0 ? -trailArc : 0; // sit behind the node's direction of travel
        orbit.add(node, trail);
        pivot.add(ring, orbit);
        system.add(pivot);
        return { spec, orbit, node, ringMaterial, nodeMaterial: nodeMaterialRing, haloMaterial, trailMaterial };
    });

    // Star field spread across the whole hero, independent of the rig.
    const starCount = small ? 420 : 1100;
    const starPositions = new Float32Array(starCount * 3);
    const starSeeds = new Float32Array(starCount);
    for (let i = 0; i < starCount; i += 1) {
        starPositions[i * 3] = (Math.random() - 0.5) * 34;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
        starPositions[i * 3 + 2] = -Math.random() * 16 + 2;
        starSeeds[i] = Math.random();
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ size: 0.05, map: dotMap, transparent: true, depthWrite: false, sizeAttenuation: true });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const applyPalette = (name) => {
        const palette = PALETTES[name] || PALETTES.dark;
        const blending = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
        const colors = { primary: palette.primary, secondary: palette.secondary, warm: palette.warm };
        coreMaterial.color.setHex(palette.core);
        coreMaterial.emissive.setHex(palette.emissive);
        coreEdgesMaterial.color.setHex(palette.edge);
        shellMaterial.color.setHex(palette.primary);
        coreGlowMaterial.color.setHex(palette.primary);
        coreGlowMaterial.opacity = palette.glow;
        linkMaterial.color.setHex(palette.primary);
        linkMaterial.opacity = palette.network;
        nodeMaterial.color.setHex(palette.edge);
        nodeMaterial.opacity = 0.9;
        starMaterial.color.setHex(palette.star);
        starMaterial.opacity = palette.stars;
        rings.forEach(({ spec, ringMaterial, nodeMaterial: ringNode, haloMaterial, trailMaterial }) => {
            const color = colors[spec.key];
            ringMaterial.color.setHex(color);
            ringMaterial.opacity = palette.rings * 0.6;
            ringNode.color.setHex(color);
            haloMaterial.color.setHex(color);
            haloMaterial.opacity = palette.additive ? 0.9 : 0.35;
            trailMaterial.color.setHex(color);
            trailMaterial.opacity = palette.rings;
        });
        [coreGlowMaterial, linkMaterial, nodeMaterial, starMaterial, shellMaterial,
            ...rings.flatMap((r) => [r.ringMaterial, r.haloMaterial, r.trailMaterial])].forEach((material) => {
            material.blending = blending;
            material.needsUpdate = true;
        });
        keyLight.color.setHex(palette.primary);
        rimLight.color.setHex(palette.secondary);
        ambient.intensity = palette.additive ? 0.35 : 0.9;
    };

    return { THREE, renderer, scene, camera, rig, system, core, shell, network, rings, stars, starSeeds, applyPalette };
}

async function init() {
    if (!hero || !canvas || !anchor || !supportsWebGL()) return;
    if (navigator.connection?.saveData) return;

    let THREE;
    try {
        THREE = await loadThree();
    } catch (error) {
        return; // CSS orb remains.
    }

    let world;
    try {
        world = build(THREE);
    } catch (error) {
        return;
    }
    const { renderer, scene, camera, rig, system, core, shell, network, rings, stars, applyPalette } = world;

    const state = {
        width: 1, height: 1, baseY: 0,
        pointer: { x: 0, y: 0 }, smooth: { x: 0, y: 0 },
        scroll: 0, scrollPx: 0, unitsPerPx: 0, labelWidths: [], visible: true, running: false, raf: 0, time: 0, last: 0
    };
    const projected = new THREE.Vector3();
    const rigCenter = new THREE.Vector3();

    const layout = () => {
        const heroRect = hero.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        state.width = Math.max(1, heroRect.width);
        state.height = Math.max(1, heroRect.height);
        renderer.setSize(state.width, state.height, false);
        camera.aspect = state.width / state.height;
        camera.updateProjectionMatrix();

        const viewHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const viewWidth = viewHeight * camera.aspect;
        const centerX = anchorRect.left - heroRect.left + anchorRect.width / 2;
        const centerY = anchorRect.top - heroRect.top + anchorRect.height / 2;
        rig.position.x = (centerX / state.width - 0.5) * viewWidth;
        state.baseY = -(centerY / state.height - 0.5) * viewHeight;
        // Fit the outer ring (r = 3.75) to ~46% of the anchor's smaller side.
        const radiusPx = Math.min(anchorRect.width, anchorRect.height) * 0.46;
        rig.scale.setScalar((radiusPx / state.height) * viewHeight / 3.75);
        state.anchorLeft = anchorRect.left - heroRect.left;
        state.anchorTop = anchorRect.top - heroRect.top;
        state.unitsPerPx = viewHeight / state.height;
        state.labelWidths = labels.map((label) => label.offsetWidth);
    };

    const placeLabels = () => {
        rig.getWorldPosition(rigCenter);
        rings.forEach(({ node }, index) => {
            const label = labels[index];
            if (!label) return;
            node.getWorldPosition(projected);
            const behind = projected.z < rigCenter.z - 0.15;
            projected.project(camera);
            // Keep the label inside the hero so it never causes horizontal overflow.
            const half = (state.labelWidths[index] || 0) / 2 + 8;
            const heroX = Math.min(state.width - half, Math.max(half, (projected.x + 1) / 2 * state.width));
            const x = heroX - state.anchorLeft;
            const y = (1 - projected.y) / 2 * state.height - state.anchorTop;
            label.style.setProperty('--x', `${x.toFixed(1)}px`);
            label.style.setProperty('--y', `${y.toFixed(1)}px`);
            label.style.setProperty('--o', behind ? '0.35' : '1');
        });
    };

    const render = (delta) => {
        const t = state.time;
        const s = state.smooth;
        s.x += (state.pointer.x - s.x) * Math.min(1, delta * 3);
        s.y += (state.pointer.y - s.y) * Math.min(1, delta * 3);

        system.rotation.y = t * 0.12 + s.x * 0.55;
        system.rotation.x = 0.18 + s.y * 0.35 + state.scroll * 0.5;
        core.rotation.x = t * 0.25;
        core.rotation.y = t * 0.35;
        core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.025);
        shell.rotation.y = -t * 0.16;
        shell.rotation.z = t * 0.07;
        network.rotation.y = t * 0.05;
        rings.forEach(({ spec, orbit }) => { orbit.rotation.z = spec.phase + t * spec.speed; });

        // Depth parallax: the system lags slightly behind the page as it scrolls away.
        // On phones the visual sits at the bottom of a tall hero, so keep the lag small to avoid clipping.
        rig.position.y = state.baseY - state.scrollPx * (compact.matches ? 0.06 : 0.25) * state.unitsPerPx;
        stars.rotation.y = t * 0.008 + s.x * 0.06;
        stars.rotation.x = s.y * 0.04;
        stars.position.y = -state.scrollPx * 0.5 * state.unitsPerPx;

        renderer.render(scene, camera);
        placeLabels();
    };

    const loop = (now) => {
        state.raf = 0;
        if (!state.running) return;
        const delta = state.last ? Math.min((now - state.last) / 1000, 0.05) : 0.016;
        state.last = now;
        state.time += delta;
        render(delta);
        state.raf = requestAnimationFrame(loop);
    };

    const shouldRun = () => state.visible && !document.hidden && !reduceMotion.matches;
    const sync = () => {
        const run = shouldRun();
        if (run && !state.running) {
            state.running = true;
            state.last = 0;
            state.raf = requestAnimationFrame(loop);
        } else if (!run && state.running) {
            state.running = false;
            cancelAnimationFrame(state.raf);
            state.raf = 0;
        }
        if (!run) render(1); // one settled frame for reduced motion / resize while paused
    };

    // Inputs
    window.addEventListener('pointermove', (event) => {
        if (!finePointer.matches) return;
        state.pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        state.pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { state.pointer.x = 0; state.pointer.y = 0; });
    const onScroll = () => {
        state.scrollPx = Math.min(state.height, Math.max(0, window.scrollY));
        state.scroll = state.scrollPx / Math.max(1, state.height);
        if (!state.running && state.visible) render(0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    new IntersectionObserver((entries) => {
        state.visible = entries[0].isIntersecting;
        sync();
    }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    reduceMotion.addEventListener('change', sync);

    let resizeFrame = 0;
    new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => { layout(); if (!state.running) render(0); });
    }).observe(hero);

    const theme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    new MutationObserver(() => { applyPalette(theme()); if (!state.running) render(0); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        state.running = false;
        cancelAnimationFrame(state.raf);
        hero.classList.remove('scene-ready');
    });
    canvas.addEventListener('webglcontextrestored', () => {
        hero.classList.add('scene-ready');
        sync();
    });

    applyPalette(theme());
    layout();
    onScroll();
    state.time = 4; // start mid-orbit so the nodes are spread out
    render(0.016);
    hero.classList.add('scene-ready');
    sync();
}

// Load after first paint so the 3D never competes with content.
const start = () => ('requestIdleCallback' in window ? requestIdleCallback(init, { timeout: 1200 }) : setTimeout(init, 150));
if (document.readyState === 'complete') start();
else window.addEventListener('load', start, { once: true });
