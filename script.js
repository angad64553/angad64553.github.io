/* Angad Sharma — dependency-free portfolio interactions */
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
    let frameRequested = false;

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

    if (finePointer && !reduceMotion) {
        const cursor = document.querySelector('.cursor');
        let pointerX = -80;
        let pointerY = -80;
        let cursorFrame = false;

        document.addEventListener('mousemove', (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            cursor?.classList.add('visible');
            if (!cursorFrame) {
                cursorFrame = true;
                requestAnimationFrame(() => {
                    if (cursor) cursor.style.transform = `translate3d(${pointerX - cursor.offsetWidth / 2}px, ${pointerY - cursor.offsetHeight / 2}px, 0)`;
                    cursorFrame = false;
                });
            }
        }, { passive: true });
        document.addEventListener('mouseleave', () => cursor?.classList.remove('visible'));

        document.querySelectorAll('a, button, input, textarea, [data-tilt]').forEach((target) => {
            target.addEventListener('mouseenter', () => cursor?.classList.add('active'));
            target.addEventListener('mouseleave', () => cursor?.classList.remove('active'));
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

        document.querySelectorAll('[data-tilt]').forEach((element) => {
            element.addEventListener('mousemove', (event) => {
                const rect = element.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                element.style.setProperty('--rx', `${y * -2.6}deg`);
                element.style.setProperty('--ry', `${x * 3.2}deg`);
            });
            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--rx', '0deg');
                element.style.setProperty('--ry', '0deg');
            });
        });
    }

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
