/* Three.js r128. An exploded learning-system assembly, rendered only on demand. */
export function createScene(T, stage) {
    const canvas = stage.querySelector('canvas');
    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputEncoding = T.sRGBEncoding;
    const world = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, .1, 60);
    camera.position.set(8, 7.2, 10.5);
    camera.lookAt(0, .15, 0);
    const assembly = new T.Group();
    world.add(assembly);
    const geometries = new Set();
    const materials = new Set();
    const geometry = g => { geometries.add(g); return g; };
    const material = m => { materials.add(m); return m; };
    const surface = material(new T.MeshStandardMaterial({ color: 0x3155bc, roughness: .3, metalness: .42 }));
    const middleSurface = material(new T.MeshStandardMaterial({ color: 0x176a7b, roughness: .32, metalness: .4 }));
    const silicon = material(new T.MeshStandardMaterial({ color: 0xa8c5ff, emissive: 0x335bdf, emissiveIntensity: .45, roughness: .2, metalness: .5 }));
    const blue = material(new T.MeshStandardMaterial({ color: 0x2855d9, roughness: .38, metalness: .35 }));
    const teal = material(new T.MeshStandardMaterial({ color: 0x087e83, roughness: .4, metalness: .35 }));
    const gold = material(new T.MeshStandardMaterial({ color: 0xc89b36, roughness: .35, metalness: .55 }));
    const ink = material(new T.MeshStandardMaterial({ color: 0x172c43, roughness: .5, metalness: .25 }));
    const traceMaterial = material(new T.LineBasicMaterial({ color: 0xb1d9ff, transparent: true, opacity: .85 }));
    const edgeMaterial = material(new T.LineBasicMaterial({ color: 0x58758d, transparent: true, opacity: .55 }));
    const ghostMaterial = material(new T.LineDashedMaterial({ color: 0x087e83, transparent: true, opacity: .5, dashSize: .065, gapSize: .06 }));
    const box = geometry(new T.BoxGeometry(1, 1, 1));
    const pin = geometry(new T.CylinderGeometry(.045, .045, 1, 8));
    const bolt = geometry(new T.CylinderGeometry(.085, .085, .085, 12));
    const boardShape = new T.Shape();
    const w = 2.25, h = 1.675, r = .18;
    boardShape.moveTo(-w + r, -h);
    boardShape.lineTo(w - r, -h); boardShape.quadraticCurveTo(w, -h, w, -h + r);
    boardShape.lineTo(w, h - r); boardShape.quadraticCurveTo(w, h, w - r, h);
    boardShape.lineTo(-w + r, h); boardShape.quadraticCurveTo(-w, h, -w, h - r);
    boardShape.lineTo(-w, -h + r); boardShape.quadraticCurveTo(-w, -h, -w + r, -h);
    const boardGeometry = geometry(new T.ExtrudeGeometry(boardShape, { depth: .09, bevelEnabled: true, bevelSegments: 2, bevelSize: .045, bevelThickness: .025, steps: 1 }));
    boardGeometry.rotateX(-Math.PI / 2); boardGeometry.center();
    function block(parent, size, position, mat) {
        const mesh = new T.Mesh(box, mat);
        mesh.scale.set(...size); mesh.position.set(...position); parent.add(mesh); return mesh;
    }
    function line(parent, points, mat = traceMaterial) {
        const g = geometry(new T.BufferGeometry().setFromPoints(points.map(p => new T.Vector3(...p))));
        const mesh = new T.Line(g, mat);
        if (mat === ghostMaterial) mesh.computeLineDistances();
        parent.add(mesh); return mesh;
    }
    const layers = [];
    for (let index = 0; index < 3; index++) {
        const layer = new T.Group();
        layer.position.y = (index - 1) * 1.18;
        layers.push(layer); assembly.add(layer);
        const plate = new T.Mesh(boardGeometry, index === 0 ? ink : index === 1 ? middleSurface : surface);
        layer.add(plate);
        const edges = new T.LineSegments(geometry(new T.EdgesGeometry(boardGeometry)), edgeMaterial);
        layer.add(edges);
        for (const x of [-1.99, 1.99]) for (const z of [-1.39, 1.39]) {
            const screw = new T.Mesh(bolt, gold); screw.position.set(x, .095, z); layer.add(screw);
            line(layer, [[x - .04, .14, z], [x + .04, .14, z]], edgeMaterial);
        }
        // Orthogonal traces connect the central processor to banks of IO modules.
        for (let n = 0; n < 7; n++) {
            const z = -.96 + n * .32;
            for (const sign of [-1, 1]) {
                line(layer, [[sign * .56, .075, z * .48], [sign * (1.05 + (n % 3) * .14), .075, z * .48], [sign * (1.05 + (n % 3) * .14), .075, z], [sign * 1.85, .075, z]], traceMaterial);
                block(layer, [.15, .035, .08], [sign * 1.85, .065, z], gold);
            }
        }
        block(layer, [1.13, .18, 1.05], [0, .16, 0], index === 1 ? teal : blue);
        block(layer, [.85, .07, .78], [0, .285, 0], index === 1 ? gold : silicon);
        if (index === 2) {
            for (let fin = 0; fin < 5; fin++) block(layer, [.65, .07, .055], [0, .35, -.28 + fin * .14], gold);
        }
        for (let n = 0; n < 6; n++) for (const sign of [-1, 1]) {
            block(layer, [.14, .04, .055], [sign * .61, .15, -.39 + n * .155], gold);
        }
        for (const x of [-1.25, 1.25]) {
            block(layer, [.45, .16, .7], [x, .14, -.85], index === 0 ? teal : ink);
            block(layer, [.5, .1, .25], [x, .11, .9], blue);
        }
        // A small row of header pins gives the assembly its robotics hardware scale.
        for (let n = 0; n < 10; n++) {
            const p = new T.Mesh(pin, gold); p.scale.y = .23; p.position.set(-.8 + n * .175, .21, -1.35); layer.add(p);
        }
    }
    for (const x of [-1.99, 1.99]) for (const z of [-1.39, 1.39]) {
        line(assembly, [[x, -1.7, z], [x, 1.85, z]], ghostMaterial);
    }
    // Four mounting feet and a machined base give the stack weight and scale.
    for (const x of [-1.7, 1.7]) for (const z of [-1.1, 1.1]) {
        block(assembly, [.22, .24, .22], [x, -1.4, z], gold);
    }
    const rim = new T.Mesh(geometry(new T.TorusGeometry(3.1, .024, 6, 90)), blue);
    rim.rotation.x = Math.PI / 2; rim.position.y = -1.67; assembly.add(rim);
    // A calibration circle and axes ground the device without a particle field.
    const circle = [];
    for (let n = 0; n <= 100; n++) { const a = n / 100 * Math.PI * 2; circle.push([Math.cos(a) * 3.12, -1.64, Math.sin(a) * 3.12]); }
    line(assembly, circle, edgeMaterial);
    for (let n = 0; n < 40; n++) {
        const a = n / 40 * Math.PI * 2;
        const r = n % 5 === 0 ? 3.32 : 3.22;
        line(assembly, [[Math.cos(a) * 3.12, -1.64, Math.sin(a) * 3.12], [Math.cos(a) * r, -1.64, Math.sin(a) * r]], n % 5 === 0 ? traceMaterial : edgeMaterial);
    }
    world.add(new T.HemisphereLight(0xffffff, 0x667d99, .95));
    const key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(3, 8, 4); world.add(key);
    const fill = new T.DirectionalLight(0x9cc9e5, .45); fill.position.set(-4, 1, -3); world.add(fill);
    let alive = true, visible = true, frame = 0, lastTime = 0;
    let pointerX = 0, pointerY = 0, rotationX = 0, rotationY = 0, scroll = 0, expansion = 1;
    const controller = new AbortController();
    const options = { passive: true, signal: controller.signal };
    function render(time) {
        frame = 0;
        if (!alive || !visible || document.hidden) return;
        const delta = Math.min((time - lastTime) || 16, 48); lastTime = time;
        const ease = 1 - Math.exp(-delta / 110);
        rotationX += (pointerY * .24 - rotationX) * ease;
        rotationY += (pointerX * .55 + scroll * .3 - rotationY) * ease;
        expansion += (1 + scroll * .5 - expansion) * ease;
        assembly.rotation.set(rotationX, -.18 + rotationY, 0);
        layers.forEach((layer, index) => { layer.position.y = (index - 1) * 1.18 * expansion; });
        renderer.render(world, camera);
        stage.classList.add('scene-ready');
        if (Math.abs(pointerY * .24 - rotationX) + Math.abs(pointerX * .55 + scroll * .3 - rotationY) + Math.abs(1 + scroll * .5 - expansion) > .001) wake();
    }
    function wake() { if (!frame && alive && visible && !document.hidden) frame = requestAnimationFrame(render); }
    function resize() {
        const width = canvas.clientWidth, height = canvas.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.set(8, 7.2, 10.5).multiplyScalar(width < 460 ? 1.02 : .88);
        camera.updateProjectionMatrix(); wake();
    }
    function onScroll() { scroll = Math.min(1, Math.max(0, -document.querySelector('#home').getBoundingClientRect().top / innerHeight)); wake(); }
    stage.addEventListener('pointermove', event => {
        const rect = stage.getBoundingClientRect();
        pointerX = (event.clientX - rect.left) / rect.width - .5;
        pointerY = (event.clientY - rect.top) / rect.height - .5;
        stage.style.setProperty('--light-x', `${50 + pointerX * 20}%`); wake();
    }, options);
    stage.addEventListener('pointerleave', () => { pointerX = pointerY = 0; wake(); }, options);
    addEventListener('scroll', onScroll, options);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake();
    }, options);
    const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (!visible) { cancelAnimationFrame(frame); frame = 0; } else { onScroll(); wake(); }
    });
    observer.observe(stage);
    const resizer = new ResizeObserver(resize); resizer.observe(canvas);
    function theme() {
        const dark = document.documentElement.dataset.theme === 'dark';
        surface.color.setHex(dark ? 0x496be0 : 0x3155bc);
        middleSurface.color.setHex(dark ? 0x258a99 : 0x176a7b);
        traceMaterial.color.setHex(dark ? 0xc8ecff : 0xb1d9ff);
        edgeMaterial.color.setHex(dark ? 0x9ab4c9 : 0x718faf);
        wake();
    }
    const themeObserver = new MutationObserver(theme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    function dispose() {
        if (!alive) return;
        alive = false; cancelAnimationFrame(frame); controller.abort();
        observer.disconnect(); resizer.disconnect(); themeObserver.disconnect();
        geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
        stage.classList.remove('scene-ready');
    }
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); dispose(); }, { signal: controller.signal });
    theme(); resize(); onScroll();
    return { dispose };
}
