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

        // Core 1: Outer Icosahedron Wireframe
        const icoGeo = new THREE.IcosahedronGeometry(2.35, 1);
        const icoMat = new THREE.MeshBasicMaterial({
            color: 0x4f46e5,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const icoMesh = new THREE.Mesh(icoGeo, icoMat);
        heroGroup.add(icoMesh);

        // Core 2: Inner Crystal Polyhedron
        const crystalGeo = new THREE.DodecahedronGeometry(1.6, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            roughness: 0.25,
            metalness: 0.75,
            transparent: true,
            opacity: 0.6,
            wireframe: false
        });
        const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
        heroGroup.add(crystalMesh);

        // Core 3: Inner Wireframe Accent
        const crystalWireMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.45
        });
        const crystalWireMesh = new THREE.Mesh(crystalGeo, crystalWireMat);
        heroGroup.add(crystalWireMesh);

        // Orbital Rings
        const ringGeo1 = new THREE.TorusGeometry(3.1, 0.02, 16, 120);
        const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.6 });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
        ring1.rotation.x = Math.PI / 3;
        heroGroup.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(3.45, 0.015, 16, 120);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.45 });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.y = Math.PI / 4;
        heroGroup.add(ring2);

        const ringGeo3 = new THREE.TorusGeometry(3.8, 0.012, 16, 120);
        const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xc7d2fe, transparent: true, opacity: 0.35 });
        const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
        ring3.rotation.z = Math.PI / 6;
        heroGroup.add(ring3);

        // Floating Satellite Particle Nodes
        const particleCount = 75;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const radius = 2.2 + Math.random() * 1.9;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            scales[i] = Math.random() * 0.08 + 0.03;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0x4f46e5,
            size: 0.09,
            transparent: true,
            opacity: 0.85
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        heroGroup.add(particles);

        // Lights
        const light1 = new THREE.DirectionalLight(0x4f46e5, 2.2);
        light1.position.set(4, 5, 6);
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0x818cf8, 1.8);
        light2.position.set(-4, -3, 4);
        scene.add(light2);

        const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambLight);

        // Theme Adapter
        const updateColors = (isDark) => {
            if (isDark) {
                icoMat.color.setHex(0x38bdf8);
                icoMat.opacity = 0.55;
                crystalMat.color.setHex(0xa855f7);
                crystalMat.opacity = 0.7;
                crystalWireMat.color.setHex(0x38bdf8);
                ringMat1.color.setHex(0x38bdf8);
                ringMat2.color.setHex(0xa855f7);
                ringMat3.color.setHex(0x818cf8);
                particleMat.color.setHex(0x67e8f9);
                light1.color.setHex(0x38bdf8);
                light2.color.setHex(0xa855f7);
                ambLight.color.setHex(0x1e1b4b);
            } else {
                icoMat.color.setHex(0x4f46e5);
                icoMat.opacity = 0.4;
                crystalMat.color.setHex(0x6366f1);
                crystalMat.opacity = 0.6;
                crystalWireMat.color.setHex(0xffffff);
                ringMat1.color.setHex(0x4f46e5);
                ringMat2.color.setHex(0x818cf8);
                ringMat3.color.setHex(0xc7d2fe);
                particleMat.color.setHex(0x4f46e5);
                light1.color.setHex(0x4f46e5);
                light2.color.setHex(0x818cf8);
                ambLight.color.setHex(0xffffff);
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
                heroGroup.rotation.y += 0.005;
                heroGroup.rotation.x += 0.002;

                // Subtle gyro tilt
                targetRotX = mouseY * 0.4;
                targetRotY = mouseX * 0.4;
                heroGroup.rotation.x += (targetRotX - heroGroup.rotation.x) * 0.05;
                heroGroup.rotation.y += (targetRotY - heroGroup.rotation.y) * 0.05;
            }

            // Orbital ring oscillations
            ring1.rotation.z = elapsed * 0.35;
            ring2.rotation.x = elapsed * -0.28;
            ring3.rotation.y = elapsed * 0.22;

            // Crystal pulse
            const pulse = 1 + Math.sin(elapsed * 2) * 0.04;
            crystalMesh.scale.set(pulse, pulse, pulse);
            crystalWireMesh.scale.set(pulse, pulse, pulse);

            particles.rotation.y = elapsed * 0.08;
            particles.rotation.x = elapsed * 0.04;

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
                targetRx = y * -6; // max 6deg
                targetRy = x * 7;  // max 7deg
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
        let lastActivityRefresh = 0;
        let activityRefreshing = false;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        const renderCalendar = (contributions) => {
            if (!calendar) return;
            calendar.innerHTML = '';
            const today = new Date().toISOString().split('T')[0];

            contributions.forEach((day) => {
                const square = document.createElement('div');
                square.className = 'contribution-day';
                square.dataset.date = day.date;
                square.dataset.count = day.count;
                if (day.date === today) square.classList.add('is-today');

                if (day.count === 0) square.dataset.level = '0';
                else if (day.count <= 2) square.dataset.level = '1';
                else if (day.count <= 5) square.dataset.level = '2';
                else if (day.count <= 9) square.dataset.level = '3';
                else square.dataset.level = '4';

                square.addEventListener('mouseenter', (e) => {
                    if (!calendarTooltip) return;
                    calendarTooltip.textContent = `${day.count} contributions on ${fullDateFormat.format(new Date(day.date))}`;
                    calendarTooltip.classList.add('visible');
                    const rect = square.getBoundingClientRect();
                    calendarTooltip.style.transform = `translate3d(${rect.left + rect.width / 2 - 100}px, ${rect.top - 40}px, 0)`;
                });
                square.addEventListener('mouseleave', () => calendarTooltip?.classList.remove('visible'));
                calendar.appendChild(square);
            });
        };

        const fetchGithub = async () => {
            try {
                const userRes = await fetch(`https://api.github.com/users/${username}`, { headers: apiHeaders });
                if (!userRes.ok) return;
                const user = await userRes.json();
                setText('github-repos', numberFormat.format(user.public_repos));
                setText('github-name', user.name || username);
                setText('github-username', `@${user.login}`);
            } catch (e) {}
        };
        fetchGithub();
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
})();
