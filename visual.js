/* Progressive enhancement: no content or navigation depends on this module. */
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 821px) and (hover: hover) and (pointer: fine)');
const connection = navigator.connection;
const lowPower = () => connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
const enhanced = () => desktop.matches && !motion.matches && !lowPower();
const stage = document.querySelector('.profile-stage');
const atmosphere = document.querySelector('.ambient-scene');
const sections = [...document.querySelectorAll('main > .section')];
const active = new Set();
let scrollFrame = 0;
let scene;
let lenis;
let generation = 0;
let loaded = false;

function updateRules() {
    scrollFrame = 0;
    atmosphere?.style.setProperty('--ambient-scroll', enhanced() ? `${Math.sin(scrollY / 1300) * 36}px` : '0px');
    for (const section of active) {
        const top = section.getBoundingClientRect().top;
        const value = motion.matches ? 1 : Math.max(0, Math.min(1, (innerHeight * .96 - top) / (innerHeight * .65)));
        section.style.setProperty('--section-progress', value.toFixed(3));
    }
}
function requestRules() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateRules);
}
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) active.add(entry.target);
            else active.delete(entry.target);
        }
        requestRules();
    }, { rootMargin: '15% 0px' });
    sections.forEach(section => observer.observe(section));
}
addEventListener('scroll', requestRules, { passive: true });
addEventListener('resize', requestRules, { passive: true });

// A shared, event-driven hover system. Only the surface under the pointer updates.
const depthSelector = '.skill-card, .story-card, .repo-card, .profile-portal';
let hoverFrame = 0, hovered = null, hoverEvent = null;
function clearDepth(element) {
    if (!element) return;
    element.style.removeProperty('--depth-x');
    element.style.removeProperty('--depth-y');
    element.classList.remove('depth-active');
}
document.addEventListener('pointermove', event => {
    if (!enhanced()) return;
    const target = event.target.closest(depthSelector);
    if (target !== hovered) { clearDepth(hovered); hovered = target; }
    hoverEvent = { x: event.clientX, y: event.clientY };
    if (hoverFrame) return;
    hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        if (!enhanced() || !hoverEvent) return;
        atmosphere?.style.setProperty('--ambient-x', `${(hoverEvent.x / innerWidth - .5) * 42}px`);
        atmosphere?.style.setProperty('--ambient-y', `${(hoverEvent.y / innerHeight - .5) * 28}px`);
        if (!hovered) return;
        const rect = hovered.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (hoverEvent.x - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (hoverEvent.y - rect.top) / rect.height));
        hovered.style.setProperty('--depth-x', `${(y - .5) * -7}deg`);
        hovered.style.setProperty('--depth-y', `${(x - .5) * 9}deg`);
        hovered.style.setProperty('--shine-x', `${x * 100}%`);
        hovered.style.setProperty('--shine-y', `${y * 100}%`);
        hovered.classList.add('depth-active');
    });
}, { passive: true });
function resetDepth() {
    cancelAnimationFrame(hoverFrame); hoverFrame = 0;
    clearDepth(hovered); hovered = null; hoverEvent = null;
    atmosphere?.style.setProperty('--ambient-x', '0px');
    atmosphere?.style.setProperty('--ambient-y', '0px');
    atmosphere?.style.setProperty('--ambient-scroll', '0px');
}
document.documentElement.addEventListener('pointerleave', resetDepth);
addEventListener('blur', resetDepth);
addEventListener('scroll', () => { clearDepth(hovered); hovered = null; }, { passive: true });
motion.addEventListener('change', resetDepth);
desktop.addEventListener('change', resetDepth);
connection?.addEventListener('change', resetDepth);

// One rule: only action buttons move, by a maximum of three pixels.
document.querySelectorAll('.button, .nav-cta').forEach(button => {
    const reset = () => {
        button.style.setProperty('--mx', '0px');
        button.style.setProperty('--my', '0px');
    };
    button.addEventListener('pointermove', event => {
        if (!enhanced() || button.matches(':focus-visible')) return;
        const rect = button.getBoundingClientRect();
        button.style.setProperty('--mx', `${Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) * .06))}px`);
        button.style.setProperty('--my', `${Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) * .06))}px`);
    }, { passive: true });
    button.addEventListener('pointerleave', reset);
    button.addEventListener('blur', reset);
    motion.addEventListener('change', reset);
    desktop.addEventListener('change', reset);
});

let threePromise;
function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!threePromise) threePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/vendor/three.r128.min.js';
        script.async = true;
        const timeout = setTimeout(() => { script.remove(); reject(new Error('3D load timeout')); }, 12000);
        script.onload = () => { clearTimeout(timeout); resolve(window.THREE); };
        script.onerror = () => { clearTimeout(timeout); reject(new Error('3D unavailable')); };
        document.head.append(script);
    });
    return threePromise;
}

function syncScrollLock() {
    if (!lenis) return;
    const blocked = document.body.classList.contains('menu-open') || !document.querySelector('#photo-modal')?.hasAttribute('hidden') || document.hidden;
    if (blocked) lenis.stop(); else lenis.start();
}
new MutationObserver(syncScrollLock).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
const modal = document.querySelector('#photo-modal');
if (modal) new MutationObserver(syncScrollLock).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
document.addEventListener('visibilitychange', syncScrollLock);

async function configure() {
    const token = ++generation;
    scene?.dispose(); scene = null;
    lenis?.destroy(); lenis = null;
    stage?.classList.remove('scene-ready', 'scene-loading');
    sections.forEach(section => section.style.removeProperty('--section-progress'));
    requestRules();
    if (!enhanced() || !loaded) return;
    // Lenis supplements the existing native anchor behavior; touch remains native.
    import('./assets/vendor/lenis.mjs').then(({ default: Lenis }) => {
        if (token !== generation || !enhanced()) return;
        lenis = new Lenis({ autoRaf: true, lerp: .12, smoothWheel: true, syncTouch: false,
            prevent: node => node.closest?.('.photo-modal, .nav-menu, .calendar-scroll, textarea') });
        syncScrollLock();
    }).catch(() => {});
    if (!stage) return;
    stage.classList.add('scene-loading');
    try {
        const [THREE, { createScene }] = await Promise.all([loadThree(), import('./hero-scene.js?v=7')]);
        if (token !== generation || !enhanced()) return;
        scene = createScene(THREE, stage);
    } catch {
        // The already visible CSS assembly remains the complete visual fallback.
        stage.classList.remove('scene-ready');
    } finally {
        if (token === generation) stage.classList.remove('scene-loading');
    }
}
motion.addEventListener('change', configure);
desktop.addEventListener('change', configure);
connection?.addEventListener('change', configure);

// Wait for first paint; requestIdleCallback is bounded so the loader cannot hang.
function start() {
    loaded = true;
    if ('requestIdleCallback' in window) requestIdleCallback(configure, { timeout: 1500 });
    else setTimeout(configure, 200);
}
if (document.readyState === 'complete') start();
else addEventListener('load', start, { once: true });
addEventListener('pagehide', () => { ++generation; scene?.dispose(); scene = null; lenis?.destroy(); lenis = null; });
addEventListener('pageshow', event => { if (event.persisted) configure(); });
