/* ==========================================================================
   Portfolio Website — Main Script
   ES6+ · No jQuery · Performance-Optimised
   ========================================================================== */

(() => {
  'use strict';

  document.body.classList.add('js-enabled');

  /* ------------------------------------------------------------
     UTILITIES
     ------------------------------------------------------------ */

  /** Simple debounce helper */
  const debounce = (fn, ms = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  /** Detect touch / mobile device */
  const isTouchDevice = () =>
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /** Track mouse position globally */
  const mouse = { x: -9999, y: -9999 };
  document.addEventListener('mousemove', (e) => {
    if (isTouchDevice()) return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  /* ================================================================
     1. PRELOADER
     ================================================================ */

  const initPreloader = () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    let hidden = false;
    const hide = () => {
      if (hidden) return;
      hidden = true;
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.remove();
        document.body.classList.add('loaded');
      }, 600);
    };

    // If page already loaded, hide immediately; otherwise wait
    if (document.readyState === 'complete') {
      setTimeout(hide, 300);
    } else {
      window.addEventListener('load', () => setTimeout(hide, 300));
    }

    setTimeout(hide, 2000);
  };

  /* ================================================================
     2. PARTICLE SYSTEM (Canvas #particles)
     ================================================================ */

  const initParticles = () => {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const COLORS = ['#38bdf8', '#7dd3fc', '#e2e8f0'];

    let width, height, particles;
    let particleCount, connectDist, mouseDist;

    const updateSettings = () => {
      const isMobile = window.innerWidth < 768 || isTouchDevice();
      particleCount = isMobile ? 15 : 78;
      connectDist = isMobile ? 0 : 120;   // disable O(n²) connections on mobile
      mouseDist = isMobile ? 0 : 180;
    };

    /** Resize canvas to fill parent / viewport */
    const resize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };

    /** Create a single particle */
    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.24,
      size: Math.random() * 1.6 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      baseAlpha: Math.random() * 0.45 + 0.3,
      twinkleSpeed: Math.random() * 1.2 + 0.55,
      twinklePhase: Math.random() * Math.PI * 2,
    });

    /** Seed all particles */
    const seed = () => {
      particles = Array.from({ length: particleCount }, createParticle);
    };

    /** Animation loop */
    let animId;

    const tick = (now = 0) => {
      ctx.clearRect(0, 0, width, height);

      const len = particles.length;
      const connectDistSq = connectDist * connectDist;

      // Cache rect ONCE per frame instead of per-particle (avoids layout thrashing)
      const canvasRect = mouseDist > 0 ? canvas.getBoundingClientRect() : null;
      const mx = canvasRect ? mouse.x - canvasRect.left : 0;
      const my = canvasRect ? mouse.y - canvasRect.top : 0;
      const mouseDistSq = mouseDist * mouseDist;

      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Gentle, asynchronous star twinkle avoids abrupt background flashing.
        const twinkle = 0.58 + Math.sin((now * 0.001 * p.twinkleSpeed) + p.twinklePhase) * 0.42;
        p.alpha = p.baseAlpha * twinkle;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Connect to nearby particles (SKIP entirely on mobile where connectDist=0)
        if (connectDist > 0) {
          for (let j = i + 1; j < len; j++) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < connectDistSq) {
              const dist = Math.sqrt(distSq);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = 'rgba(255,255,255,0.04)';
              ctx.globalAlpha = 0.04 * (1 - dist / connectDist);
              ctx.stroke();
            }
          }
        }

        // Connect to mouse (desktop only)
        if (mouseDist > 0 && canvasRect) {
          const mdx = p.x - mx;
          const mdy = p.y - my;
          const mDistSq = mdx * mdx + mdy * mdy;

          if (mDistSq < mouseDistSq) {
            const mDist = Math.sqrt(mDistSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mx, my);
            ctx.strokeStyle = 'rgba(0,245,255,0.12)';
            ctx.globalAlpha = 0.12 * (1 - mDist / mouseDist);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(tick);
    };

    updateSettings();
    resize();
    seed();
    animId = requestAnimationFrame(tick);

    // Pause particles when tab is hidden (saves CPU/battery on mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(tick);
      }
    });

    window.addEventListener('resize', debounce(() => {
      const prevCount = particleCount;
      updateSettings();
      resize();
      if (prevCount !== particleCount) {
        seed();
      }
    }, 200));
  };

  /* ================================================================
     3. CURSOR GLOW
     ================================================================ */

  const initCursorGlow = () => {
    if (isTouchDevice()) return;

    const glow = document.createElement('div');
    glow.classList.add('cursor-glow');
    document.body.appendChild(glow);

    let rafId = null;

    const update = () => {
      glow.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      rafId = null;
    };

    document.addEventListener('mousemove', () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    });

    // Hide when mouse leaves the viewport
    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      glow.style.opacity = '';
    });
  };

  /* ================================================================
     4. CURSOR RETICLE AND MAGNETIC ACTIONS
     ================================================================ */

  const initMouseEffects = () => {
    if (isTouchDevice() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const reticle = document.createElement('div');
    reticle.className = 'cursor-reticle';
    reticle.setAttribute('aria-hidden', 'true');
    document.body.appendChild(reticle);

    let frame = null;
    let x = -100;
    let y = -100;
    const renderReticle = () => {
      reticle.style.setProperty('--cursor-x', `${x}px`);
      reticle.style.setProperty('--cursor-y', `${y}px`);
      reticle.classList.add('is-visible');
      frame = null;
    };

    document.addEventListener('mousemove', (event) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(renderReticle);
    });

    document.addEventListener('mouseleave', () => reticle.classList.remove('is-visible'));
    document.addEventListener('mouseenter', () => reticle.classList.add('is-visible'));
    document.addEventListener('mousedown', () => reticle.classList.add('is-pressed'));
    document.addEventListener('mouseup', () => reticle.classList.remove('is-pressed'));

    const activeTargets = document.querySelectorAll([
      'a',
      'button',
      '.project-card',
      '.showcase-card',
      '.skill-item',
      '.cert-card',
      '.edu-card',
      '.timeline-content',
      '.contact-card',
    ].join(','));

    activeTargets.forEach((target) => {
      target.addEventListener('mouseenter', () => reticle.classList.add('is-active'));
      target.addEventListener('mouseleave', () => reticle.classList.remove('is-active'));
    });

    document.querySelectorAll('.btn').forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        button.style.setProperty('--magnetic-x', `${offsetX * 0.14}px`);
        button.style.setProperty('--magnetic-y', `${offsetY * 0.14}px`);
      });

      button.addEventListener('mouseleave', () => {
        button.style.setProperty('--magnetic-x', '0px');
        button.style.setProperty('--magnetic-y', '0px');
      });
    });
  };

  /* ================================================================
     5. SCROLL PROGRESS
     ================================================================ */

  const initScrollProgress = () => {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    let ticking = false;
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const value = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      progress.style.setProperty('--scroll-progress', String(Math.min(value, 1)));
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  };

  /* ================================================================
     6. STICKY HEADER
     ================================================================ */

  const initStickyHeader = () => {
    const header = document.querySelector('header');
    if (!header) return;

    let headerTicking = false;
    const check = () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
      headerTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!headerTicking) {
        requestAnimationFrame(check);
        headerTicking = true;
      }
    }, { passive: true });
    check(); // Run on init
  };

  /* ================================================================
     7. MOBILE NAVIGATION
     ================================================================ */

  const initMobileNav = () => {
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!toggle || !mobileNav) return;

    const open = () => {
      toggle.classList.add('active');
      mobileNav.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      toggle.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      toggle.classList.contains('active') ? close() : open();
    });

    // Close on nav-link click
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', close);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        mobileNav.classList.contains('active') &&
        !mobileNav.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        close();
      }
    });
  };

  /* ================================================================
     8. SCROLL REVEAL  (IntersectionObserver)
     ================================================================ */

  const initScrollReveal = () => {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('active'));
      return;
    }

    const staggerSelectors = [
      '.skill-card',
      '.cert-card',
      '.edu-card',
      '.stat-card',
      '.project-card',
      '.timeline-item',
      '.skill-item',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('active');

          // Stagger children with proper opacity animation
          staggerSelectors.forEach((sel) => {
            entry.target.querySelectorAll(sel).forEach((child, i) => {
              child.style.opacity = '0';
              child.style.transform = 'translateY(20px)';
              child.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s`;
              requestAnimationFrame(() => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
              });
            });
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    reveals.forEach((el) => observer.observe(el));
  };

  /* ================================================================
     9. COUNTER ANIMATION
     ================================================================ */

  const initCounters = () => {
    const counters = document.querySelectorAll('.stat-number');
    if (!counters.length) return;

    const DURATION = 1500; // ms

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / DURATION, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      };

      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach((el) => {
        el.textContent = parseInt(el.dataset.target, 10) || 0;
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((el) => observer.observe(el));
  };

  /* ================================================================
     10. TYPEWRITER EFFECT
     ================================================================ */

  const initTypewriter = () => {
    const el = document.querySelector('.typewriter-text');
    if (!el) return;

    const texts = [
      'build Moodle LMS solutions.',
      'write clean PHP code.',
      'design custom dashboards.',
      'love solving problems.',
      'am a PHP Developer.',
    ];

    const TYPE_SPEED = 80;
    const ERASE_SPEED = 40;
    const PAUSE = 2000;

    let textIdx = 0;
    let charIdx = 0;
    let isErasing = false;

    const tick = () => {
      const current = texts[textIdx];

      if (!isErasing) {
        // Typing
        charIdx++;
        el.textContent = current.slice(0, charIdx);

        if (charIdx === current.length) {
          isErasing = true;
          setTimeout(tick, PAUSE);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        // Erasing
        charIdx--;
        el.textContent = current.slice(0, charIdx);

        if (charIdx === 0) {
          isErasing = false;
          textIdx = (textIdx + 1) % texts.length;
          setTimeout(tick, TYPE_SPEED);
          return;
        }
        setTimeout(tick, ERASE_SPEED);
      }
    };

    tick();
  };

  /* ================================================================
     11. PROJECT CARD 3D TILT
     ================================================================ */

  const initCardTilt = () => {
    if (isTouchDevice()) return; // Skip 3D tilt on mobile — no hover
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;

    const MAX_TILT = 5; // degrees

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const rotateY = ((x - cx) / cx) * MAX_TILT;
        const rotateX = ((cy - y) / cy) * MAX_TILT;

        card.style.transition = 'transform 0.1s ease';
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;

        // CSS custom props for glow effect
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.15s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      });
    });
  };

  /* ================================================================
     12. ACTIVE NAV HIGHLIGHTING
     ================================================================ */

  const initActiveNav = () => {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    if (!navLinks.length) return;

    const sectionIds = Array.from(navLinks, (link) => link.getAttribute('href').slice(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;

    let ticking = false;
    const update = () => {
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const activationLine = headerHeight + (window.innerHeight * 0.28);
      let activeId = sections[0].id;

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= activationLine) {
          activeId = section.id;
        }
      });

      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  };

  /* ================================================================
     13. SMOOTH SCROLL
     ================================================================ */

  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  /* ================================================================
     14. BACK TO TOP
     ================================================================ */

  const initBackToTop = () => {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    let topTicking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!topTicking) {
          requestAnimationFrame(() => {
            btn.classList.toggle('visible', window.scrollY > 500);
            topTicking = false;
          });
          topTicking = true;
        }
      },
      { passive: true }
    );

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  /* ================================================================
     15. FORM VALIDATION
     ================================================================ */

  const initFormValidation = () => {
    const form = document.getElementById('feedback-form');
    if (!form) return;
    const status = document.getElementById('form-status');
    const btn = form.querySelector('button[type="submit"]');
    const originalButtonContent = btn?.innerHTML || '';

    const markInvalid = (field) => {
      field.style.borderColor = '#ef4444';
    };

    const clearInvalid = (field) => {
      field.style.borderColor = '';
    };

    // Clear red border on focus
    form.querySelectorAll('input, textarea, select').forEach((field) => {
      field.addEventListener('focus', () => clearInvalid(field));
    });

    form.addEventListener('submit', async (e) => {
      let valid = true;

      form.querySelectorAll('[required]').forEach((field) => {
        if (!field.value.trim()) {
          markInvalid(field);
          valid = false;
        } else {
          clearInvalid(field);
        }
      });

      if (!valid) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      status?.classList.remove('is-success', 'is-error');
      if (status) status.textContent = '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i> Sending...';
      }

      try {
        const endpoint = form.action;
        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success !== true) {
          throw new Error('Form submission failed');
        }

        form.reset();
        if (status) {
          status.textContent = 'Message sent successfully. I will get back to you soon.';
          status.classList.add('is-success');
        }
      } catch (error) {
        if (status) {
          status.innerHTML = 'Message could not be sent right now. Please try again shortly or <a href="mailto:angad64553@gmail.com">email me directly</a>.';
          status.classList.add('is-error');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalButtonContent;
        }
      }
    });
  };

  /* ================================================================
     16. PROJECT CARD HOVER GLOW (injected style)
     ================================================================ */

  const initProjectGlowStyle = () => {
    const style = document.createElement('style');
    style.textContent = `
      .project-card {
        position: relative;
        overflow: hidden;
      }
      .project-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(0, 245, 255, 0.08),
          transparent 40%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
      }
      .project-card:hover::before {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  };

  /* ================================================================
     17. PARALLAX ORBS
     ================================================================ */

  const initParallaxOrbs = () => {
    if (isTouchDevice()) return;
    const orbs = document.querySelectorAll('.orb');
    if (!orbs.length) return;

    let ticking = false;

    const update = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (mouse.x - cx) / cx; // -1 … 1
      const dy = (mouse.y - cy) / cy;

      orbs.forEach((orb, i) => {
        // Each orb gets a unique shift magnitude (5-15px)
        const strength = 5 + ((i % 3) * 5); // 5, 10, 15
        const tx = dx * strength;
        const ty = dy * strength;
        orb.style.transform = `translate(${tx}px, ${ty}px)`;
      });

      ticking = false;
    };

    document.addEventListener('mousemove', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });
  };

  /* ================================================================
     18. HERO SHOWCASE SPOTLIGHT
     ================================================================ */

  const initHeroShowcase = () => {
    const card = document.querySelector('.showcase-card');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      if (isTouchDevice()) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty('--spotlight-x', `${x}%`);
      card.style.setProperty('--spotlight-y', `${y}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--spotlight-x', '50%');
      card.style.setProperty('--spotlight-y', '50%');
    });
  };

  /* ================================================================
     19. POINTER SPOTLIGHTS
     ================================================================ */

  const initPointerSpotlights = () => {
    if (isTouchDevice() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const surfaces = document.querySelectorAll([
      '.showcase-card',
      '.project-card',
      '.stat-card',
      '.skill-item',
      '.cert-card',
      '.edu-card',
      '.timeline-content',
      '.contact-card',
      '.btn',
    ].join(','));

    surfaces.forEach((surface) => {
      surface.classList.add('mouse-surface');
      let frame = null;
      let x = 50;
      let y = 50;

      const render = () => {
        surface.style.setProperty('--pointer-x', `${x}px`);
        surface.style.setProperty('--pointer-y', `${y}px`);
        frame = null;
      };

      surface.addEventListener('mousemove', (event) => {
        const rect = surface.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        if (!frame) frame = requestAnimationFrame(render);
      });

      surface.addEventListener('mouseenter', () => {
        surface.classList.add('pointer-active');
      });

      surface.addEventListener('mouseleave', () => {
        surface.classList.remove('pointer-active');
      });
    });
  };

  /* ================================================================
     INIT — Kick everything off on DOMContentLoaded
     ================================================================ */

  document.addEventListener('DOMContentLoaded', () => {
    try {
      initPreloader();
      initParticles();
      initCursorGlow();
      initMouseEffects();
      initScrollProgress();
      initStickyHeader();
      initMobileNav();
      initScrollReveal();
      initCounters();
      initTypewriter();
      initCardTilt();
      initActiveNav();
      initSmoothScroll();
      initBackToTop();
      initFormValidation();
      initProjectGlowStyle();
      initParallaxOrbs();
      initHeroShowcase();
      initPointerSpotlights();
    } catch (error) {
      console.error('Portfolio startup failed:', error);
      document.getElementById('preloader')?.remove();
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
    }
  });
})();
