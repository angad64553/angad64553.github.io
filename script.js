/* Angad Sharma — Interactive 3D Portfolio & Visual System */
(() => {
    'use strict';

    document.documentElement.classList.add('js');

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

    const applyTheme = (theme, persist = true) => {
        const isDark = theme === 'dark';
        const activeTheme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', activeTheme);
        if (persist) setStoredTheme(activeTheme);

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDark ? '#172c43' : '#edf2f4');
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

    const spySections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    let currentSection = '';

    const updateScrollUI = () => {
        const scrollTop = window.scrollY;
        const scrollRange = document.documentElement.scrollHeight - window.innerHeight;

        // Read section starts in this shared scroll frame. Intersection ratios are
        // unreliable for long project sections that never fit inside the viewport.
        const readingLine = Math.max(130, window.innerHeight * .22);
        const activeId = spySections.filter(section => section.getBoundingClientRect().top <= readingLine).at(-1)?.id || '';
        if (activeId !== currentSection) {
            currentSection = activeId;
            navLinks.forEach(link => {
                const active = link.getAttribute('href') === `#${activeId}`;
                link.classList.toggle('active', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }
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
        const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
        menu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        document.body.classList.toggle('menu-open', open);
        const modalOpen = document.querySelector('#photo-modal')?.hidden === false;
        document.querySelector('main')?.toggleAttribute('inert', open || modalOpen);
        document.querySelector('.site-footer')?.toggleAttribute('inert', open || modalOpen);
        if (open) requestAnimationFrame(() => requestAnimationFrame(() => {
            if (menuButton.getAttribute('aria-expanded') === 'true') navLinks[0]?.focus({ preventScroll: true });
        }));
        else if (wasOpen) menuButton.focus();
    };

    menuButton?.addEventListener('click', () => {
        setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenu(false);
        if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
            const items = [...header.querySelectorAll('a[href], button')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
        }
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 820) setMenu(false);
    }, { passive: true });

    // Content is always visible; visual.js drives the section rules from scroll.
    document.querySelectorAll('.reveal').forEach(item => item.classList.add('visible'));

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
            document.querySelector('main')?.setAttribute('inert', '');
            header?.setAttribute('inert', '');
            document.querySelector('.site-footer')?.setAttribute('inert', '');
            const closeBtn = photoModal.querySelector('.photo-modal-close');
            closeBtn?.focus();
        };

        const closeModal = () => {
            photoModal.setAttribute('hidden', '');
            document.body.style.overflow = '';
            document.querySelector('main')?.removeAttribute('inert');
            header?.removeAttribute('inert');
            document.querySelector('.site-footer')?.removeAttribute('inert');
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        };

        document.querySelectorAll('[data-open-photo], #profile-portal, .portal-zoom-btn').forEach((trigger) => {
            trigger.addEventListener('click', (e) => {
                if (e.target.closest('a[download]')) return;
                e.preventDefault();
                e.stopPropagation();
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
            if (e.key === 'Tab' && !photoModal.hasAttribute('hidden')) {
                const items = [...photoModal.querySelectorAll('button, a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
                const first = items[0], last = items.at(-1);
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
            if (e.key === 'Escape' && !photoModal.hasAttribute('hidden')) {
                closeModal();
            }
        });
    }
})();
