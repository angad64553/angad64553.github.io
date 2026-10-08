/* Angad Sharma — page behavior: theme, navigation, motion, GitHub, contact. */
(() => {
    'use strict';

    const root = document.documentElement;
    const header = document.getElementById('site-header');
    const progress = document.querySelector('.scroll-progress span');
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.getElementById('nav-menu');
    const navLinks = [...document.querySelectorAll('.nav-link[href^="#"]')];
    const themeToggles = [...document.querySelectorAll('[data-theme-toggle]')];
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

    /* ---------- Theme ---------- */
    const storage = {
        get: (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
        set: (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} }
    };

    const applyTheme = (theme, persist) => {
        const isLight = theme === 'light';
        root.setAttribute('data-theme', isLight ? 'light' : 'dark');
        if (persist) storage.set('theme', isLight ? 'light' : 'dark');
        metaThemeColor?.setAttribute('content', isLight ? '#f5f6fb' : '#06080f');
        themeToggles.forEach((toggle) => {
            const label = `Switch to ${isLight ? 'dark' : 'light'} mode`;
            toggle.setAttribute('aria-label', label);
            toggle.setAttribute('title', label);
        });
    };
    applyTheme(storage.get('theme') === 'light' ? 'light' : 'dark', false);
    themeToggles.forEach((toggle) => toggle.addEventListener('click', () => {
        applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
    }));

    /* ---------- Scroll-linked UI ---------- */
    const spySections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const scroll3d = [...document.querySelectorAll('[data-scroll-3d]')];
    const timeline = document.querySelector('[data-timeline]');
    let currentSection = '';
    let frame = 0;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

    const updateScroll = () => {
        frame = 0;
        const viewport = window.innerHeight;
        const scrollRange = document.documentElement.scrollHeight - viewport;
        if (progress) progress.style.transform = `scaleX(${scrollRange > 0 ? clamp(window.scrollY / scrollRange) : 0})`;
        header?.classList.toggle('scrolled', window.scrollY > 24);

        const readingLine = Math.max(130, viewport * .3);
        const activeId = spySections.filter((section) => section.getBoundingClientRect().top <= readingLine).at(-1)?.id || '';
        if (activeId !== currentSection) {
            currentSection = activeId;
            navLinks.forEach((link) => {
                const active = link.getAttribute('href') === `#${activeId}`;
                link.classList.toggle('active', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }

        if (reduceMotion.matches) return;
        scroll3d.forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.bottom < -200 || rect.top > viewport + 200) return;
            // 0 when the mock enters the bottom of the viewport, 1 once its center reaches 55%.
            const value = clamp((viewport - rect.top) / (viewport * .45 + rect.height * .5));
            element.style.setProperty('--p', (1 - Math.pow(1 - value, 3)).toFixed(3));
        });
        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            timeline.style.setProperty('--fill', clamp((viewport * .6 - rect.top) / rect.height).toFixed(3));
        }
    };
    const requestScroll = () => { if (!frame) frame = requestAnimationFrame(updateScroll); };
    updateScroll();
    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll, { passive: true });
    reduceMotion.addEventListener('change', () => {
        scroll3d.forEach((element) => element.style.removeProperty('--p'));
        timeline?.style.setProperty('--fill', '1');
        requestScroll();
    });
    if (reduceMotion.matches) timeline?.style.setProperty('--fill', '1');

    /* ---------- Mobile menu ---------- */
    const setInert = (value) => {
        document.querySelector('main')?.toggleAttribute('inert', value);
        document.querySelector('.site-footer')?.toggleAttribute('inert', value);
    };
    const setMenu = (open) => {
        if (!menu || !menuButton) return;
        const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
        if (open === wasOpen) return;
        menu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        document.body.classList.toggle('menu-open', open);
        setInert(open);
        if (open) requestAnimationFrame(() => menu.querySelector('a')?.focus({ preventScroll: true }));
        else menuButton.focus({ preventScroll: true });
    };
    menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenu(false);
        if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
            const items = [...header.querySelectorAll('a[href], button')].filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
        }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); }, { passive: true });

    /* ---------- Reveal on scroll ---------- */
    const reveals = [...document.querySelectorAll('[data-reveal]')];
    window.__revealReady = true;
    if (root.classList.contains('motion')) {
        // Stagger siblings that enter together.
        reveals.forEach((element) => {
            const siblings = [...element.parentElement.children].filter((child) => child.hasAttribute('data-reveal'));
            const index = siblings.indexOf(element);
            if (index > 0) element.style.setProperty('--d', `${Math.min(index, 5) * 0.08}s`);
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        reveals.forEach((element) => observer.observe(element));
    }

    /* ---------- 3D tilt with glare ---------- */
    const tiltEnabled = () => finePointer.matches && !reduceMotion.matches;
    document.querySelectorAll('[data-tilt]').forEach((card) => {
        let raf = 0;
        let point = null;
        const max = card.classList.contains('profile-card') ? 7 : 5;
        const render = () => {
            raf = 0;
            if (!point) return;
            const rect = card.getBoundingClientRect();
            const x = clamp((point.x - rect.left) / rect.width);
            const y = clamp((point.y - rect.top) / rect.height);
            card.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
            card.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
            card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
            card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
            card.style.setProperty('--ga', '1');
        };
        card.addEventListener('pointermove', (event) => {
            if (!tiltEnabled() || event.pointerType !== 'mouse') return;
            card.classList.add('is-tilting');
            point = { x: event.clientX, y: event.clientY };
            if (!raf) raf = requestAnimationFrame(render);
        }, { passive: true });
        card.addEventListener('pointerleave', () => {
            point = null;
            card.classList.remove('is-tilting');
            ['--rx', '--ry'].forEach((prop) => card.style.setProperty(prop, '0deg'));
            card.style.setProperty('--ga', '0');
        });
    });

    /* ---------- Magnetic buttons (max 4px) ---------- */
    document.querySelectorAll('[data-magnetic]').forEach((button) => {
        const reset = () => { button.style.setProperty('--mx', '0px'); button.style.setProperty('--my', '0px'); };
        button.addEventListener('pointermove', (event) => {
            if (!tiltEnabled()) return;
            const rect = button.getBoundingClientRect();
            button.style.setProperty('--mx', `${clamp((event.clientX - rect.left - rect.width / 2) * 0.08, -4, 4)}px`);
            button.style.setProperty('--my', `${clamp((event.clientY - rect.top - rect.height / 2) * 0.12, -4, 4)}px`);
        }, { passive: true });
        button.addEventListener('pointerleave', reset);
        button.addEventListener('blur', reset);
    });

    /* ---------- Copy email ---------- */
    document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            const value = button.dataset.copy;
            try {
                await navigator.clipboard.writeText(value);
            } catch (e) {
                const input = Object.assign(document.createElement('input'), { value });
                document.body.append(input);
                input.select();
                document.execCommand('copy');
                input.remove();
            }
            button.textContent = 'Copied';
            button.classList.add('copied');
            window.setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('copied'); }, 1800);
        });
    });

    document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = String(new Date().getFullYear()); });

    /* ---------- Live GitHub activity ---------- */
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
        const exactDateFormat = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
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
        const isoDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const readCache = (url) => {
            try {
                const cached = JSON.parse(localStorage.getItem(`${cachePrefix}${url}`));
                return cached?.savedAt && cached?.data ? cached : null;
            } catch (error) {
                return null;
            }
        };
        const writeCache = (url, data, etag = '') => {
            try {
                localStorage.setItem(`${cachePrefix}${url}`, JSON.stringify({ savedAt: Date.now(), etag, data }));
            } catch (error) { /* Live data still works when storage is unavailable. */ }
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
            let index = days.findIndex((day) => day.date === isoDay(new Date()));
            if (index < 0) index = days.length - 1;
            if (days[index]?.count === 0) index -= 1;
            let streak = 0;
            while (index >= 0 && days[index].count > 0) { streak += 1; index -= 1; }
            return streak;
        };

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

        const renderCalendar = (data) => {
            const sourceDays = Array.isArray(data?.contributions) ? data.contributions : [];
            if (!calendar || !calendarMonths || !sourceDays.length) throw new Error('Contribution data unavailable');
            const sourceByDate = new Map(sourceDays.map((day) => [day.date, day]));
            const yearStart = new Date(currentYear, 0, 1, 12);
            const yearEnd = new Date(currentYear, 11, 31, 12);
            const today = isoDay(new Date());
            const days = [];
            for (const cursor = new Date(yearStart); cursor <= yearEnd; cursor.setDate(cursor.getDate() + 1)) {
                const date = isoDay(cursor);
                const sourceDay = sourceByDate.get(date);
                days.push({ date, count: Number(sourceDay?.count || 0), level: Math.min(Number(sourceDay?.level) || 0, 4) });
            }
            const dayFragment = document.createDocumentFragment();
            const monthFragment = document.createDocumentFragment();
            const leadingDays = yearStart.getDay();
            calendar.closest('.calendar-chart')?.style.setProperty('--week-count', String(Math.ceil((leadingDays + days.length) / 7)));

            for (let index = 0; index < leadingDays; index += 1) {
                const emptyCell = document.createElement('span');
                emptyCell.className = 'contribution-day is-empty';
                dayFragment.appendChild(emptyCell);
            }
            for (let month = 0; month < 12; month += 1) {
                const firstOfMonth = new Date(currentYear, month, 1, 12);
                const dayOfYear = Math.round((firstOfMonth.getTime() - yearStart.getTime()) / 86400000);
                const label = document.createElement('span');
                label.textContent = monthFormat.format(firstOfMonth);
                label.style.gridColumnStart = String(Math.floor((leadingDays + dayOfYear) / 7) + 1);
                monthFragment.appendChild(label);
            }
            days.forEach((day) => {
                const cell = document.createElement('span');
                cell.className = 'contribution-day';
                cell.dataset.level = String(day.level);
                cell.dataset.date = day.date;
                cell.title = `${fullDateFormat.format(new Date(`${day.date}T12:00:00`))}: ${numberFormat.format(day.count)} contribution${day.count === 1 ? '' : 's'}`;
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
                // Start scrolled to today so the recent activity is visible on narrow screens.
                requestAnimationFrame(() => {
                    const todayCell = calendar.querySelector('.is-today');
                    if (todayCell) calendarScroll.scrollLeft = Math.max(0, todayCell.offsetLeft - calendarScroll.clientWidth + 60);
                });
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
            const nonForkRepos = repos.filter((repo) => !repo.fork && repo.name.toLowerCase() !== username.toLowerCase());
            const featuredRepos = (nonForkRepos.length ? nonForkRepos : repos)
                .slice()
                .sort((first, second) => (
                    Number(second.stargazers_count || 0) - Number(first.stargazers_count || 0)
                    || new Date(second.pushed_at || 0) - new Date(first.pushed_at || 0)
                ))
                .slice(0, 3);
            const fragment = document.createDocumentFragment();
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
                language.append(document.createElement('i'), document.createTextNode(repo.language || 'Code'));
                const stars = document.createElement('span');
                stars.textContent = `★ ${numberFormat.format(repo.stargazers_count || 0)}`;
                meta.append(language, stars);
                const arrow = document.createElement('i');
                arrow.setAttribute('aria-hidden', 'true');
                arrow.textContent = '↗';
                card.append(name, description, meta, arrow);
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
                message = commit.commit?.message?.split('\n')[0];
                repoName = commit.repository?.name || commit.repository?.full_name;
                time = commit.commit?.committer?.date || commit.commit?.author?.date;
            }
            if (!message && Array.isArray(events)) {
                const pushEvent = events.find((event) => event.type === 'PushEvent' && event.payload?.commits?.length);
                if (pushEvent) {
                    message = pushEvent.payload.commits.at(-1)?.message?.split('\n')[0];
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
            if (timeElement && time) {
                timeElement.textContent = relativeTime(time);
                timeElement.title = exactDateFormat.format(new Date(time));
            } else if (timeElement) {
                timeElement.textContent = 'Recent public activity';
            }
        };

        const loadGithub = async (quiet = false, forceRefresh = false) => {
            if (activityRefreshing) return;
            activityRefreshing = true;
            if (!quiet && status) {
                dashboard?.setAttribute('aria-busy', 'true');
                status.className = 'github-status';
                status.textContent = 'Connecting to GitHub…';
            }
            const encodedUser = encodeURIComponent(username);
            const requests = await Promise.allSettled([
                fetchJSON(`https://api.github.com/users/${encodedUser}`, { headers: apiHeaders }, forceRefresh),
                fetchJSON(`https://api.github.com/users/${encodedUser}/repos?per_page=100&sort=updated`, { headers: apiHeaders }, forceRefresh),
                fetchJSON(`https://api.github.com/search/commits?q=${encodeURIComponent(`author:${username}`)}&sort=committer-date&order=desc&per_page=1`, { headers: apiHeaders }, forceRefresh),
                fetchJSON(`https://github-contributions-api.jogruber.de/v4/${encodedUser}?y=${currentYear}`, {}, forceRefresh),
                fetchJSON(`https://api.github.com/users/${encodedUser}/events/public?per_page=10`, { headers: apiHeaders }, forceRefresh)
            ]);
            const [profile, repos, commitSearch, contributions, events] = requests.map((result) => result.status === 'fulfilled' ? result.value : null);

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

            if (commitSearch && !commitSearch.incomplete_results && typeof commitSearch.total_count === 'number') {
                setText('github-commits', numberFormat.format(commitSearch.total_count));
            } else if (contributions?.total) {
                const totalContributions = Object.values(contributions.total).reduce((sum, n) => sum + Number(n || 0), 0);
                if (totalContributions > 0) setText('github-commits', numberFormat.format(totalContributions));
            }
            renderLatestCommit(commitSearch, repos, events);
            if (contributions) {
                try { renderCalendar(contributions); } catch (error) { /* reported by status */ }
            }

            const successful = requests.filter((result) => result.status === 'fulfilled').length;
            if (status) {
                const allComplete = successful >= 3;
                status.className = allComplete ? 'github-status' : 'github-status error';
                status.textContent = allComplete ? '' : successful > 0
                    ? 'Some live details are temporarily unavailable due to public API limits.'
                    : 'GitHub activity is temporarily unavailable. Use the profile link to view it directly.';
            }
            dashboard?.setAttribute('aria-busy', 'false');
            lastActivityRefresh = Date.now();
            activityRefreshing = false;
        };

        // Defer the network work until the section is close to view.
        let started = false;
        const start = () => {
            if (started) return;
            started = true;
            loadGithub(false, false);
            window.setInterval(() => { if (!document.hidden) loadGithub(true, true); }, refreshInterval);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && Date.now() - lastActivityRefresh > cacheMaxAge) loadGithub(true, true);
            });
        };
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); start(); }
            }, { rootMargin: '800px 0px' });
            observer.observe(githubSection);
        } else {
            start();
        }
    }

    /* ---------- Contact form ---------- */
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
            field.closest('.field')?.classList.toggle('invalid', !valid);
            field.setAttribute('aria-invalid', String(!valid));
        };

        requiredFields.forEach((field) => {
            field.addEventListener('blur', () => { if (field.value) setFieldState(field, isValid(field)); });
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
            if (buttonLabel) buttonLabel.textContent = 'Sending…';
            if (status) {
                status.className = 'form-status';
                status.textContent = 'Sending your message…';
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
                if (buttonLabel) buttonLabel.textContent = 'Send message';
            }
        });
    }
})();
