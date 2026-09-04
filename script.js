/* Angad Sharma — Interactive 3D Portfolio & Visual System */
(() => {
    'use strict';

    document.documentElement.classList.add('js');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const header = document.getElementById('site-header');
    const progress = document.querySelector('.scroll-progress span');
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.getElementById('nav-menu');
    const navLinks = [...document.querySelectorAll('.nav-link')];
    const themeToggles = [...document.querySelectorAll('[data-theme-toggle]')];
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    let frameRequested = false;

    /* Theme Management (Default: Light Mode) */
    const getStoredTheme = () => {
        try {
            return localStorage.getItem('theme');
        } catch (e) {
            return null;
        }
    };

    const setStoredTheme = (theme) => {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {}
    };

    // Callback registry for 3D scene theme changes
    const themeChangeListeners = [];

    const applyTheme = (theme, persist = true) => {
        const isDark = theme === 'dark';
        const activeTheme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', activeTheme);
        if (persist) setStoredTheme(activeTheme);

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDark ? '#0a0a0b' : '#f8f9fa');
        }

        themeToggles.forEach((toggle) => {
            const nextMode = isDark ? 'light' : 'dark';
            toggle.setAttribute('aria-label', `Switch to ${nextMode} mode`);
            toggle.setAttribute('title', `Switch to ${nextMode} mode`);
            const label = toggle.querySelector('.theme-toggle-label');
            if (label) {
                label.textContent = isDark ? 'Light mode' : 'Dark mode';
            }
        });

        themeChangeListeners.forEach(listener => {
            try { listener(isDark); } catch (e) {}
        });
    };

    const initialTheme = getStoredTheme() === 'dark' ? 'dark' : 'light';
    applyTheme(initialTheme, false);

    themeToggles.forEach((toggle) => {
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme, true);
        });
    });

    const updateScrollUI = () => {
        const scrollTop = window.scrollY;
        const scrollRange = document.documentElement.scrollHeight - window.innerHeight;

        header?.classList.toggle('scrolled', scrollTop > 24);
        if (progress) {
            progress.style.transform = `scaleX(${scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0})`;
        }

        frameRequested = false;
    };

    const requestScrollUI = () => {
        if (frameRequested) return;
        frameRequested = true;
        requestAnimationFrame(updateScrollUI);
    };

    updateScrollUI();
    window.addEventListener('scroll', requestScrollUI, { passive: true });
    window.addEventListener('resize', requestScrollUI, { passive: true });

    const setMenu = (open) => {
        if (!menu || !menuButton) return;
        menu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        document.body.classList.toggle('menu-open', open);
    };

    menuButton?.addEventListener('click', () => {
        setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 820) setMenu(false);
    }, { passive: true });

    const revealItems = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
        revealItems.forEach((item, index) => {
            item.style.transitionDelay = `${Math.min(index % 3, 2) * 55}ms`;
            revealObserver.observe(item);
        });
    }

    const spySections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if ('IntersectionObserver' in window && spySections.length) {
        const activeSections = new Map();
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => activeSections.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
            const active = [...activeSections.entries()].sort((a, b) => b[1] - a[1])[0];
            if (!active || active[1] === 0) return;
            navLinks.forEach((link) => {
                const isActive = link.getAttribute('href') === `#${active[0]}`;
                link.classList.toggle('active', isActive);
                if (isActive) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }, { threshold: [0.12, 0.3, 0.55], rootMargin: '-20% 0px -55% 0px' });
        spySections.forEach((section) => spyObserver.observe(section));
    }

    /* -------------------------------------------------------------
       THREE.JS 3D INTERACTIVE HERO CORE
    ------------------------------------------------------------- */
    const initHero3D = () => {
        const canvas = document.getElementById('hero-3d-canvas');
        if (!canvas || typeof THREE === 'undefined' || reduceMotion) return;

        const stage = canvas.parentElement;
        let width = stage.clientWidth || 450;
        let height = stage.clientHeight || 580;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 7.5;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const heroGroup = new THREE.Group();
        scene.add(heroGroup);

        // Core 1: Holographic Outer Icosahedron Wireframe
        const icoGeo = new THREE.IcosahedronGeometry(3.1, 1);
        const icoMat = new THREE.MeshBasicMaterial({
            color: 0x4f46e5,
            wireframe: true,
            transparent: true,
            opacity: 0.26
        });
        const icoMesh = new THREE.Mesh(icoGeo, icoMat);
        heroGroup.add(icoMesh);

        // Core 2: Orbital Gyro Rings framing the central portrait portal
        const ringGeo1 = new THREE.TorusGeometry(2.95, 0.022, 16, 120);
        const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.65 });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
        ring1.rotation.x = Math.PI / 3;
        heroGroup.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(3.4, 0.016, 16, 120);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.5 });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.y = Math.PI / 3.5;
        heroGroup.add(ring2);

        const ringGeo3 = new THREE.TorusGeometry(3.85, 0.012, 16, 120);
        const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xc7d2fe, transparent: true, opacity: 0.4 });
        const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
        ring3.rotation.z = Math.PI / 5;
        heroGroup.add(ring3);

        // Core 3: 3D Orbiting Satellite Nodes (LMS, PHP, MySQL Data Beacons)
        const satelliteNodes = [];
        const satGeo = new THREE.DodecahedronGeometry(0.2, 0);
        const satGeoWire = new THREE.DodecahedronGeometry(0.28, 0);

        for (let i = 0; i < 3; i++) {
            const satGroup = new THREE.Group();
            const satMat = new THREE.MeshStandardMaterial({
                color: 0x6366f1,
                roughness: 0.2,
                metalness: 0.8,
                transparent: true,
                opacity: 0.85
            });
            const satMesh = new THREE.Mesh(satGeo, satMat);
            const satWireMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: 0.55
            });
            const satWireMesh = new THREE.Mesh(satGeoWire, satWireMat);
            satGroup.add(satMesh);
            satGroup.add(satWireMesh);

            heroGroup.add(satGroup);
            satelliteNodes.push({
                group: satGroup,
                mesh: satMesh,
                wireMesh: satWireMesh,
                radius: 3.0 + i * 0.45,
                speed: 0.45 + i * 0.16,
                angleOffset: (i * Math.PI * 2) / 3,
                inclination: (i * Math.PI) / 5.5
            });
        }

        // Floating Quantum Constellation Particles
        const particleCount = 140;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const radius = 2.4 + Math.random() * 2.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0x4f46e5,
            size: 0.085,
            transparent: true,
            opacity: 0.85
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        heroGroup.add(particles);

        // Lights
        const light1 = new THREE.DirectionalLight(0x4f46e5, 2.4);
        light1.position.set(4, 5, 6);
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0x818cf8, 2.0);
        light2.position.set(-4, -3, 4);
        scene.add(light2);

        const ambLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambLight);

        // Theme Adapter
        const updateColors = (isDark) => {
            if (isDark) {
                icoMat.color.setHex(0x38bdf8);
                icoMat.opacity = 0.35;
                ringMat1.color.setHex(0x38bdf8);
                ringMat2.color.setHex(0xa855f7);
                ringMat3.color.setHex(0x818cf8);
                particleMat.color.setHex(0x67e8f9);
                light1.color.setHex(0x38bdf8);
                light2.color.setHex(0xa855f7);
                ambLight.color.setHex(0x1e1b4b);
                satelliteNodes.forEach((node) => {
                    node.mesh.material.color.setHex(0xa855f7);
                    node.wireMesh.material.color.setHex(0x38bdf8);
                });
            } else {
                icoMat.color.setHex(0x4f46e5);
                icoMat.opacity = 0.26;
                ringMat1.color.setHex(0x4f46e5);
                ringMat2.color.setHex(0x818cf8);
                ringMat3.color.setHex(0xc7d2fe);
                particleMat.color.setHex(0x4f46e5);
                light1.color.setHex(0x4f46e5);
                light2.color.setHex(0x818cf8);
                ambLight.color.setHex(0xffffff);
                satelliteNodes.forEach((node) => {
                    node.mesh.material.color.setHex(0x6366f1);
                    node.wireMesh.material.color.setHex(0xffffff);
                });
            }
        };

        const currentIsDark = document.documentElement.getAttribute('data-theme') === 'dark';
        updateColors(currentIsDark);
        themeChangeListeners.push(updateColors);

        // Mouse Gyro & Drag Rotation
        let targetRotX = 0;
        let targetRotY = 0;
        let mouseX = 0;
        let mouseY = 0;
        let isDragging = false;
        let prevPointerX = 0;
        let prevPointerY = 0;

        stage.addEventListener('pointermove', (e) => {
            const rect = stage.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

            if (isDragging) {
                const deltaX = e.clientX - prevPointerX;
                const deltaY = e.clientY - prevPointerY;
                heroGroup.rotation.y += deltaX * 0.01;
                heroGroup.rotation.x += deltaY * 0.01;
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
            }
        }, { passive: true });

        canvas.addEventListener('pointerdown', (e) => {
            isDragging = true;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;
        });

        window.addEventListener('pointerup', () => { isDragging = false; });

        // Animation Loop
        let clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            if (!isDragging) {
                heroGroup.rotation.y += 0.0035;
                heroGroup.rotation.x += 0.0015;

                // Subtle gyro tilt
                targetRotX = mouseY * 0.35;
                targetRotY = mouseX * 0.35;
                heroGroup.rotation.x += (targetRotX - heroGroup.rotation.x) * 0.05;
                heroGroup.rotation.y += (targetRotY - heroGroup.rotation.y) * 0.05;
            }

            // Orbital ring oscillations
            ring1.rotation.z = elapsed * 0.3;
            ring2.rotation.x = elapsed * -0.24;
            ring3.rotation.y = elapsed * 0.18;

            // Orbiting satellite nodes
            satelliteNodes.forEach((node) => {
                const t = elapsed * node.speed + node.angleOffset;
                node.group.position.x = Math.cos(t) * node.radius;
                node.group.position.y = Math.sin(t * 1.2) * Math.sin(node.inclination) * 1.4;
                node.group.position.z = Math.sin(t) * node.radius * Math.cos(node.inclination);
                node.group.rotation.x += 0.02;
                node.group.rotation.y += 0.03;
            });

            // Particle drift
            particles.rotation.y = elapsed * 0.05;
            particles.rotation.x = elapsed * 0.025;

            renderer.render(scene, camera);
        };
        animate();

        // Responsive Resize
        const onResize = () => {
            width = stage.clientWidth || 450;
            height = stage.clientHeight || 580;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', onResize, { passive: true });
    };

    /* -------------------------------------------------------------
       THREE.JS 3D AMBIENT BACKGROUND CONSTELLATION
    ------------------------------------------------------------- */
    const initAmbient3D = () => {
        const canvas = document.getElementById('ambient-3d-canvas');
        if (!canvas || typeof THREE === 'undefined' || reduceMotion) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
        camera.position.z = 400;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const particleCount = 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
            velocities.push({
                x: (Math.random() - 0.5) * 0.25,
                y: (Math.random() - 0.5) * 0.25,
                z: (Math.random() - 0.5) * 0.15
            });
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x4f46e5,
            size: 3.5,
            transparent: true,
            opacity: 0.5
        });
        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const updateAmbientColor = (isDark) => {
            material.color.setHex(isDark ? 0x818cf8 : 0x4f46e5);
            material.opacity = isDark ? 0.6 : 0.4;
        };
        updateAmbientColor(document.documentElement.getAttribute('data-theme') === 'dark');
        themeChangeListeners.push(updateAmbientColor);

        let mouseX = 0;
        let mouseY = 0;
        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 60;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 60;
        }, { passive: true });

        const animate = () => {
            requestAnimationFrame(animate);
            const pos = geometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                pos[i * 3] += velocities[i].x;
                pos[i * 3 + 1] += velocities[i].y;
                pos[i * 3 + 2] += velocities[i].z;

                if (pos[i * 3] > 400 || pos[i * 3] < -400) velocities[i].x *= -1;
                if (pos[i * 3 + 1] > 400 || pos[i * 3 + 1] < -400) velocities[i].y *= -1;
                if (pos[i * 3 + 2] > 300 || pos[i * 3 + 2] < -300) velocities[i].z *= -1;
            }
            geometry.attributes.position.needsUpdate = true;

            camera.position.x += (mouseX - camera.position.x) * 0.03;
            camera.position.y += (-mouseY - (window.scrollY * 0.08) - camera.position.y) * 0.03;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }, { passive: true });
    };

    // Initialize 3D Scenes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initHero3D();
            initAmbient3D();
        });
    } else {
        initHero3D();
        initAmbient3D();
    }

    /* -------------------------------------------------------------
       SPATIAL 3D CARD TILT & SPECULAR GLARE
    ------------------------------------------------------------- */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('[data-tilt], .story-card, .skill-card, .project-card, .github-dashboard, .contact-form').forEach((card) => {
            let isHovered = false;
            let currentRx = 0;
            let currentRy = 0;
            let targetRx = 0;
            let targetRy = 0;

            const updateTilt = () => {
                if (!isHovered) {
                    targetRx *= 0.9;
                    targetRy *= 0.9;
                }
                currentRx += (targetRx - currentRx) * 0.15;
                currentRy += (targetRy - currentRy) * 0.15;

                card.style.setProperty('--rx', `${currentRx}deg`);
                card.style.setProperty('--ry', `${currentRy}deg`);

                if (Math.abs(currentRx) > 0.05 || Math.abs(currentRy) > 0.05 || isHovered) {
                    requestAnimationFrame(updateTilt);
                }
            };

            card.addEventListener('pointerenter', () => {
                isHovered = true;
                requestAnimationFrame(updateTilt);
            });

            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                const isSkill = card.classList.contains('skill-card');
                const maxRx = isSkill ? 9 : 6;
                const maxRy = isSkill ? 11 : 7;
                targetRx = y * -maxRx;
                targetRy = x * maxRy;
            }, { passive: true });

            card.addEventListener('pointerleave', () => {
                isHovered = false;
                targetRx = 0;
                targetRy = 0;
            });
        });
    }

    const addSurfaceLight = (element) => {
        if (!element || element.classList.contains('has-surface-light')) return;
        const light = document.createElement('span');
        light.className = 'surface-light';
        light.setAttribute('aria-hidden', 'true');
        element.classList.add('has-surface-light');
        element.prepend(light);
        element.addEventListener('pointermove', (event) => {
            const rect = element.getBoundingClientRect();
            light.style.left = `${event.clientX - rect.left}px`;
            light.style.top = `${event.clientY - rect.top}px`;
        }, { passive: true });
    };

    document.querySelectorAll('.story-card, .skill-card, .project-card, .github-stat, .contact-form').forEach(addSurfaceLight);

    document.querySelectorAll('.button, .nav-cta').forEach((element) => {
        element.addEventListener('pointerdown', (event) => {
            if (reduceMotion) return;
            const rect = element.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'interaction-ripple';
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;
            element.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        });
    });

    if (finePointer && !reduceMotion) {
        const cursor = document.querySelector('.cursor');
        const cursorLight = document.querySelector('.cursor-light');
        let pointerX = -80;
        let pointerY = -80;
        let renderedX = -80;
        let renderedY = -80;
        let cursorRunning = false;

        const renderCursor = () => {
            renderedX += (pointerX - renderedX) * 0.2;
            renderedY += (pointerY - renderedY) * 0.2;
            if (cursor) cursor.style.transform = `translate3d(${renderedX - cursor.offsetWidth / 2}px, ${renderedY - cursor.offsetHeight / 2}px, 0)`;
            if (cursorLight) cursorLight.style.transform = `translate3d(${renderedX - 280}px, ${renderedY - 280}px, 0)`;
            if (Math.abs(pointerX - renderedX) > 0.1 || Math.abs(pointerY - renderedY) > 0.1) {
                requestAnimationFrame(renderCursor);
            } else {
                cursorRunning = false;
            }
        };

        document.addEventListener('mousemove', (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            cursor?.classList.add('visible');
            cursorLight?.classList.add('visible');
            if (!cursorRunning) {
                cursorRunning = true;
                requestAnimationFrame(renderCursor);
            }
        }, { passive: true });
        document.addEventListener('mouseleave', () => {
            cursor?.classList.remove('visible');
            cursorLight?.classList.remove('visible');
        });

        document.querySelectorAll('a, button, input, textarea, [data-tilt]').forEach((target) => {
            target.addEventListener('mouseenter', () => cursor?.classList.add('active'));
            target.addEventListener('mouseleave', () => cursor?.classList.remove('active'));
        });
        document.querySelectorAll('a:not(.button):not(.nav-cta)').forEach((target) => {
            target.addEventListener('mouseenter', () => cursor?.classList.add('link'));
            target.addEventListener('mouseleave', () => cursor?.classList.remove('link'));
        });

        document.querySelectorAll('.magnetic').forEach((element) => {
            element.addEventListener('mousemove', (event) => {
                const rect = element.getBoundingClientRect();
                element.style.setProperty('--mx', `${(event.clientX - rect.left - rect.width / 2) * 0.12}px`);
                element.style.setProperty('--my', `${(event.clientY - rect.top - rect.height / 2) * 0.12}px`);
            });
            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--mx', '0px');
                element.style.setProperty('--my', '0px');
            });
        });
    }

    /* -------------------------------------------------------------
       LIVE GITHUB ACTIVITY LOADER
    ------------------------------------------------------------- */
    const githubSection = document.querySelector('[data-github-user]');
    if (githubSection) {
        const username = githubSection.dataset.githubUser;
        const dashboard = githubSection.querySelector('.github-dashboard');
        const status = document.getElementById('github-status');
        const calendar = document.getElementById('contribution-calendar');
        const calendarMonths = document.getElementById('calendar-months');
        const calendarTooltip = document.getElementById('contribution-tooltip');
        const numberFormat = new Intl.NumberFormat('en-US');
        const fullDateFormat = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const exactDateFormat = new Intl.DateTimeFormat('en', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        const monthFormat = new Intl.DateTimeFormat('en', { month: 'short' });
        const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const apiHeaders = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
        const currentYear = new Date().getFullYear();
        const refreshInterval = 7 * 60 * 1000;
        const cacheMaxAge = 5 * 60 * 1000;
        const cacheFallbackAge = 24 * 60 * 60 * 1000;
        const cachePrefix = `github-activity:v2:${username}:`;
        let lastActivityRefresh = 0;
        let activityRefreshing = false;

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        const readCache = (url) => {
            try {
                const cached = JSON.parse(window.localStorage.getItem(`${cachePrefix}${url}`));
                return cached?.savedAt && cached?.data ? cached : null;
            } catch (error) {
                return null;
            }
        };

        const writeCache = (url, data, etag = '') => {
            try {
                window.localStorage.setItem(`${cachePrefix}${url}`, JSON.stringify({
                    savedAt: Date.now(),
                    etag,
                    data
                }));
            } catch (error) {
                /* Live data still works when storage is unavailable. */
            }
        };

        const fetchJSON = async (url, options = {}, forceRefresh = false) => {
            const cached = readCache(url);
            if (!forceRefresh && cached && Date.now() - cached.savedAt < cacheMaxAge) return cached.data;
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 10000);
            try {
                const headers = new Headers(options.headers || {});
                if (cached?.etag) headers.set('If-None-Match', cached.etag);
                const response = await fetch(url, { ...options, headers, cache: 'no-cache', signal: controller.signal });
                if (response.status === 304 && cached) {
                    writeCache(url, cached.data, cached.etag);
                    return cached.data;
                }
                if (!response.ok) throw new Error(`Request failed: ${response.status}`);
                const data = await response.json();
                writeCache(url, data, response.headers.get('etag') || '');
                return data;
            } catch (error) {
                if (cached && Date.now() - cached.savedAt < cacheFallbackAge) return cached.data;
                throw error;
            } finally {
                window.clearTimeout(timeout);
            }
        };

        const relativeTime = (dateValue) => {
            const commitDate = new Date(dateValue);
            const now = new Date();
            const seconds = Math.round((commitDate.getTime() - now.getTime()) / 1000);
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfCommitDay = new Date(commitDate.getFullYear(), commitDate.getMonth(), commitDate.getDate());
            const dayDifference = Math.round((startOfCommitDay.getTime() - startOfToday.getTime()) / 86400000);
            if (Math.abs(seconds) < 60) return 'Just now';
            if (Math.abs(seconds) < 3600) return relativeFormat.format(Math.round(seconds / 60), 'minute');
            if (dayDifference === 0) return 'Today';
            if (dayDifference === -1) return 'Yesterday';
            const ranges = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400]];
            const match = ranges.find(([, size]) => Math.abs(seconds) >= size);
            if (!match) return relativeFormat.format(Math.round(seconds / 3600), 'hour');
            return relativeFormat.format(Math.round(seconds / match[1]), match[0]);
        };

        const calculateStreak = (days) => {
            if (!days.length) return 0;
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            let index = days.findIndex((day) => day.date === today);
            if (index < 0) index = days.length - 1;
            if (days[index]?.count === 0) index -= 1;
            let streak = 0;
            while (index >= 0 && days[index].count > 0) {
                streak += 1;
                index -= 1;
            }
            return streak;
        };

        const renderCalendar = (data) => {
            const sourceDays = Array.isArray(data?.contributions) ? data.contributions : [];
            if (!calendar || !calendarMonths || !sourceDays.length) throw new Error('Contribution data unavailable');
            const sourceByDate = new Map(sourceDays.map((day) => [day.date, day]));
            const yearStart = new Date(currentYear, 0, 1, 12);
            const yearEnd = new Date(currentYear, 11, 31, 12);
            const days = [];
            for (const cursor = new Date(yearStart); cursor <= yearEnd; cursor.setDate(cursor.getDate() + 1)) {
                const date = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
                const sourceDay = sourceByDate.get(date);
                days.push({
                    date,
                    count: Number(sourceDay?.count || 0),
                    level: Math.min(Number(sourceDay?.level) || 0, 4)
                });
            }
            const dayFragment = document.createDocumentFragment();
            const monthFragment = document.createDocumentFragment();
            const leadingDays = yearStart.getDay();
            const weekCount = Math.ceil((leadingDays + days.length) / 7);
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            calendar.closest('.calendar-chart')?.style.setProperty('--week-count', String(weekCount));

            for (let index = 0; index < leadingDays; index += 1) {
                const emptyCell = document.createElement('span');
                emptyCell.className = 'contribution-day is-empty';
                dayFragment.appendChild(emptyCell);
            }

            const hideTooltip = () => {
                calendarTooltip?.classList.remove('visible');
                calendarTooltip?.setAttribute('aria-hidden', 'true');
            };

            const showTooltip = (event, day) => {
                if (!calendarTooltip) return;
                calendarTooltip.textContent = `${fullDateFormat.format(new Date(`${day.date}T12:00:00`))} · ${numberFormat.format(day.count)} contribution${day.count === 1 ? '' : 's'}`;
                calendarTooltip.classList.add('visible');
                calendarTooltip.setAttribute('aria-hidden', 'false');
                const tooltipRect = calendarTooltip.getBoundingClientRect();
                let left = event.clientX + 13;
                let top = event.clientY - tooltipRect.height - 13;
                if (left + tooltipRect.width > window.innerWidth - 8) left = event.clientX - tooltipRect.width - 13;
                if (top < 8) top = event.clientY + 15;
                calendarTooltip.style.transform = `translate3d(${Math.max(8, left)}px,${top}px,0)`;
            };

            for (let month = 0; month < 12; month += 1) {
                const firstOfMonth = new Date(currentYear, month, 1, 12);
                const dayOfYear = Math.round((firstOfMonth.getTime() - yearStart.getTime()) / 86400000);
                const label = document.createElement('span');
                label.textContent = monthFormat.format(firstOfMonth);
                label.style.gridColumnStart = String(Math.floor((leadingDays + dayOfYear) / 7) + 1);
                monthFragment.appendChild(label);
            }

            days.forEach((day) => {
                const dayDate = new Date(`${day.date}T12:00:00`);
                const cell = document.createElement('span');
                cell.className = 'contribution-day';
                cell.dataset.level = String(day.level);
                cell.dataset.date = day.date;
                cell.title = `${fullDateFormat.format(dayDate)}: ${numberFormat.format(day.count)} contribution${day.count === 1 ? '' : 's'}`;
                if (day.date === today) cell.classList.add('is-today');
                if (day.date > today) cell.classList.add('is-future');
                cell.addEventListener('pointerenter', (event) => showTooltip(event, day));
                cell.addEventListener('pointermove', (event) => showTooltip(event, day));
                cell.addEventListener('pointerleave', hideTooltip);
                cell.addEventListener('pointerdown', (event) => {
                    if (event.pointerType === 'mouse') return;
                    showTooltip(event, day);
                    window.setTimeout(hideTooltip, 1700);
                });
                dayFragment.appendChild(cell);
            });
            calendar.replaceChildren(dayFragment);
            calendarMonths.replaceChildren(monthFragment);
            const calendarScroll = calendar.closest('.calendar-scroll');
            if (calendarScroll && !calendarScroll.dataset.tooltipBound) {
                calendarScroll.addEventListener('scroll', hideTooltip, { passive: true });
                calendarScroll.dataset.tooltipBound = 'true';
            }
            const reportedTotal = Number(data?.total?.[currentYear]);
            const total = Number.isFinite(reportedTotal) ? reportedTotal : days.reduce((sum, day) => sum + day.count, 0);
            calendar.setAttribute('aria-label', `${numberFormat.format(total)} GitHub contributions in ${currentYear}`);
            setText('contribution-total', `${numberFormat.format(total)} contributions`);
            setText('contribution-range', `Jan — Dec ${currentYear}`);
            setText('github-streak', numberFormat.format(calculateStreak(days)));
        };

        const renderRepositories = (repos) => {
            const repoList = document.getElementById('github-repo-list');
            if (!repoList || !Array.isArray(repos)) return;
            setText('github-stars', numberFormat.format(repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0)));
            const fragment = document.createDocumentFragment();
            const nonForkRepos = repos.filter((repo) => !repo.fork);
            const featuredRepos = (nonForkRepos.length ? nonForkRepos : repos)
                .sort((first, second) => (
                    Number(second.stargazers_count || 0) - Number(first.stargazers_count || 0)
                    || new Date(second.pushed_at || 0) - new Date(first.pushed_at || 0)
                ))
                .slice(0, 3);
            featuredRepos.forEach((repo) => {
                const card = document.createElement('a');
                card.className = 'repo-card';
                card.href = repo.html_url;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                const name = document.createElement('strong');
                name.textContent = repo.name;
                const description = document.createElement('p');
                description.textContent = repo.description || 'Public GitHub repository';
                const meta = document.createElement('span');
                meta.className = 'repo-meta';
                const language = document.createElement('span');
                language.className = 'repo-language';
                const languageDot = document.createElement('i');
                language.append(languageDot, document.createTextNode(repo.language || 'Code'));
                const visibility = document.createElement('span');
                visibility.textContent = `★ ${numberFormat.format(repo.stargazers_count || 0)}`;
                meta.append(language, visibility);
                card.append(name, description, meta);
                const arrow = document.createElement('i');
                arrow.setAttribute('aria-hidden', 'true');
                arrow.textContent = '↗';
                card.appendChild(arrow);
                addSurfaceLight(card);
                if (finePointer && !reduceMotion) {
                    const cursor = document.querySelector('.cursor');
                    card.addEventListener('mouseenter', () => cursor?.classList.add('active', 'link'));
                    card.addEventListener('mouseleave', () => cursor?.classList.remove('active', 'link'));
                    card.classList.add('magnetic-surface');
                    card.addEventListener('pointermove', (event) => {
                        const rect = card.getBoundingClientRect();
                        card.style.setProperty('--card-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 3}px`);
                        card.style.setProperty('--card-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 3}px`);
                    }, { passive: true });
                    card.addEventListener('pointerleave', () => {
                        card.style.setProperty('--card-x', '0px');
                        card.style.setProperty('--card-y', '0px');
                    });
                }
                fragment.appendChild(card);
            });
            repoList.replaceChildren(fragment);
        };

        const renderLatestCommit = (commitSearch, repos, events) => {
            let message = '';
            let repoName = '';
            let time = '';

            const commit = Array.isArray(commitSearch?.items) && commitSearch.items.length ? commitSearch.items[0] : null;
            if (commit) {
                message = commit?.commit?.message?.split('\n')[0];
                repoName = commit?.repository?.name || commit?.repository?.full_name;
                time = commit?.commit?.committer?.date || commit?.commit?.author?.date;
            }

            if (!message && Array.isArray(events)) {
                const pushEvent = events.find((e) => e.type === 'PushEvent' && e.payload?.commits?.length);
                if (pushEvent) {
                    message = pushEvent.payload.commits[pushEvent.payload.commits.length - 1]?.message?.split('\n')[0];
                    repoName = pushEvent.repo?.name?.split('/')[1] || pushEvent.repo?.name;
                    time = pushEvent.created_at;
                }
            }

            if (!message && Array.isArray(repos) && repos.length) {
                const latestRepo = [...repos].sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))[0];
                if (latestRepo) {
                    message = `Pushed updates to ${latestRepo.name}`;
                    repoName = latestRepo.name;
                    time = latestRepo.pushed_at;
                }
            }

            if (!message) return;
            setText('latest-commit-repo', repoName || 'GitHub');
            setText('latest-commit-message', message);
            const timeElement = document.getElementById('latest-commit-time');
            const commitCard = document.getElementById('latest-commit-card');
            if (timeElement && time) {
                const exactDate = exactDateFormat.format(new Date(time));
                timeElement.textContent = relativeTime(time);
                timeElement.title = exactDate;
                timeElement.setAttribute('aria-label', `${relativeTime(time)}. ${exactDate}`);
                if (commitCard) commitCard.title = exactDate;
            } else if (timeElement) {
                timeElement.textContent = 'Recent public activity';
                timeElement.removeAttribute('title');
                commitCard?.removeAttribute('title');
            }
        };

        const loadGithub = async (quiet = false, forceRefresh = false) => {
            if (activityRefreshing) return;
            activityRefreshing = true;
            if (!quiet) {
                dashboard?.setAttribute('aria-busy', 'true');
                if (status) {
                    status.className = 'github-status';
                    status.textContent = 'Connecting to GitHub…';
                }
            }
            const encodedUser = encodeURIComponent(username);
            const profileUrl = `https://api.github.com/users/${encodedUser}`;
            const reposUrl = `https://api.github.com/users/${encodedUser}/repos?per_page=100&sort=updated`;
            const commitActivityUrl = `https://api.github.com/search/commits?q=${encodeURIComponent(`author:${username}`)}&sort=committer-date&order=desc&per_page=1`;
            const eventsUrl = `https://api.github.com/users/${encodedUser}/events/public?per_page=10`;
            const contributionsUrl = `https://github-contributions-api.jogruber.de/v4/${encodedUser}?y=${currentYear}`;
            const requests = await Promise.allSettled([
                fetchJSON(profileUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(reposUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(commitActivityUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(contributionsUrl, {}, forceRefresh),
                fetchJSON(eventsUrl, { headers: apiHeaders }, forceRefresh)
            ]);
            const values = requests.map((result) => result.status === 'fulfilled' ? result.value : null);
            const [profile, repos, commitSearch, contributions, events] = values;

            if (profile) {
                setText('github-name', profile.name || profile.login);
                setText('github-handle', `@${profile.login}`);
                setText('github-repos', numberFormat.format(profile.public_repos));
                const avatar = document.getElementById('github-avatar');
                if (avatar) {
                    avatar.src = profile.avatar_url;
                    avatar.alt = `${profile.name || profile.login} on GitHub`;
                }
                const profileLink = document.getElementById('github-profile-link');
                if (profileLink) profileLink.href = profile.html_url;
            }
            if (repos) renderRepositories(repos);

            const commitResultsComplete = commitSearch && !commitSearch.incomplete_results && typeof commitSearch.total_count === 'number';
            if (commitResultsComplete) {
                setText('github-commits', numberFormat.format(commitSearch.total_count));
            } else if (contributions?.total) {
                const totalContributions = Object.values(contributions.total).reduce((sum, n) => sum + Number(n || 0), 0);
                if (totalContributions > 0) {
                    setText('github-commits', numberFormat.format(totalContributions));
                }
            }
            renderLatestCommit(commitSearch, repos, events);

            if (contributions) {
                try { renderCalendar(contributions); } catch (error) { /* handled by status */ }
            }

            const successful = requests.filter((result) => result.status === 'fulfilled').length;
            if (status) {
                const allComplete = successful >= 3;
                status.className = allComplete ? 'github-status' : 'github-status error';
                status.textContent = allComplete ? '' : successful > 0 ? 'Some live details are temporarily unavailable due to public API limits.' : 'GitHub activity is temporarily unavailable. Use the profile link to view it directly.';
            }
            dashboard?.setAttribute('aria-busy', 'false');
            lastActivityRefresh = Date.now();
            activityRefreshing = false;
        };

        loadGithub(false, true);
        window.setInterval(() => loadGithub(true, true), refreshInterval);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && Date.now() - lastActivityRefresh > cacheMaxAge) loadGithub(true, true);
        });
    }

    /* -------------------------------------------------------------
       CONTACT FORM SUBMISSION
    ------------------------------------------------------------- */
    const form = document.getElementById('feedback-form');
    if (form) {
        const status = document.getElementById('form-status');
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonLabel = submitButton?.querySelector('.button-label');
        const requiredFields = [...form.querySelectorAll('[required]')];

        const isValid = (field) => {
            const value = field.value.trim();
            if (!value) return false;
            if (field.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            return true;
        };

        const setFieldState = (field, valid) => {
            const wrapper = field.closest('.field');
            wrapper?.classList.toggle('invalid', !valid);
            field.setAttribute('aria-invalid', String(!valid));
        };

        requiredFields.forEach((field) => {
            field.addEventListener('blur', () => setFieldState(field, isValid(field)));
            field.addEventListener('input', () => {
                if (field.closest('.field')?.classList.contains('invalid')) setFieldState(field, isValid(field));
            });
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const valid = requiredFields.map((field) => {
                const fieldValid = isValid(field);
                setFieldState(field, fieldValid);
                return fieldValid;
            }).every(Boolean);

            if (!valid) {
                requiredFields.find((field) => !isValid(field))?.focus();
                if (status) {
                    status.className = 'form-status error';
                    status.textContent = 'Please complete the highlighted fields.';
                }
                return;
            }

            submitButton?.setAttribute('disabled', '');
            submitButton?.classList.add('is-loading');
            if (buttonLabel) buttonLabel.textContent = 'Sending…';
            if (status) {
                status.className = 'form-status';
                status.textContent = 'Securely sending your message…';
            }

            try {
                const payload = Object.fromEntries(new FormData(form).entries());
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || result.success !== true) throw new Error('Submission failed');

                form.reset();
                form.classList.add('sent');
                setTimeout(() => form.classList.remove('sent'), 900);
                requiredFields.forEach((field) => setFieldState(field, true));
                if (status) {
                    status.className = 'form-status success';
                    status.textContent = 'Message sent. I’ll get back to you soon.';
                }
            } catch (error) {
                if (status) {
                    status.className = 'form-status error';
                    status.innerHTML = 'Could not send right now. <a href="mailto:angad64553@gmail.com">Email me directly</a>.';
                }
            } finally {
                submitButton?.removeAttribute('disabled');
                submitButton?.classList.remove('is-loading');
                if (buttonLabel) buttonLabel.textContent = 'Send message';
            }
        });
    }

    /* -------------------------------------------------------------
       ORIGINAL QUALITY PHOTO LIGHTBOX MODAL CONTROLLER
    ------------------------------------------------------------- */
    const photoModal = document.getElementById('photo-modal');
    if (photoModal) {
        let lastFocusedElement = null;

        const openModal = () => {
            lastFocusedElement = document.activeElement;
            photoModal.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
            const closeBtn = photoModal.querySelector('.photo-modal-close');
            closeBtn?.focus();
        };

        const closeModal = () => {
            photoModal.setAttribute('hidden', '');
            document.body.style.overflow = '';
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        };

        document.querySelectorAll('[data-open-photo], #profile-portal, .portal-zoom-btn').forEach((trigger) => {
            trigger.addEventListener('click', (e) => {
                if (e.target.closest('a[download]')) return;
                e.preventDefault();
                openModal();
            });
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal();
                }
            });
        });

        photoModal.querySelectorAll('[data-close-modal]').forEach((closer) => {
            closer.addEventListener('click', closeModal);
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !photoModal.hasAttribute('hidden')) {
                closeModal();
            }
        });
    }
})();
