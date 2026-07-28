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

    const stars = document.getElementById('ambient-stars');
    if (stars && !reduceMotion) {
        const starFragment = document.createDocumentFragment();
        for (let index = 0; index < 22; index += 1) {
            const star = document.createElement('i');
            star.className = 'ambient-star';
            star.style.left = `${(index * 43 + 7) % 97}%`;
            star.style.top = `${(index * 67 + 11) % 88}%`;
            star.style.setProperty('--star-speed', `${7 + (index % 6) * 1.7}s`);
            star.style.setProperty('--star-delay', `${-index * 0.53}s`);
            starFragment.appendChild(star);
        }
        stars.appendChild(starFragment);
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

    if (finePointer && !reduceMotion) {
        document.querySelectorAll('.story-card, .skill-card, .github-stat').forEach((element) => {
            element.classList.add('magnetic-surface');
            element.addEventListener('pointermove', (event) => {
                const rect = element.getBoundingClientRect();
                element.style.setProperty('--card-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 3}px`);
                element.style.setProperty('--card-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 3}px`);
            }, { passive: true });
            element.addEventListener('pointerleave', () => {
                element.style.setProperty('--card-x', '0px');
                element.style.setProperty('--card-y', '0px');
            });
        });
    }

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

    const githubSection = document.querySelector('[data-github-user]');
    if (githubSection) {
        const username = githubSection.dataset.githubUser;
        const repository = githubSection.dataset.githubRepo;
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
            const projectSpecs = [
                {
                    title: 'Jarvis',
                    names: ['Jarvis'],
                    description: 'Private automation assistant focused on voice-driven workflows and practical desktop actions.',
                    language: 'Automation',
                    privateProject: true
                },
                {
                    title: 'Portfolio Website',
                    names: ['angad64553.github.io', 'portfolio-website'],
                    description: 'Performance-first personal platform with accessible navigation, motion, and live engineering activity.',
                    language: 'HTML · CSS · JavaScript'
                },
                {
                    title: 'LMS (Enterprise Project)',
                    names: [],
                    description: 'Enterprise learning operations platform for role-aware dashboards, attendance, enrollment, and reporting.',
                    language: 'Moodle · PHP',
                    privateProject: true
                }
            ];
            const fragment = document.createDocumentFragment();
            projectSpecs.forEach((project) => {
                const repo = project.privateProject ? null : repos.find((item) => project.names.some((name) => item.name.toLowerCase() === name.toLowerCase()));
                const card = document.createElement(repo ? 'a' : 'article');
                card.className = `repo-card${repo ? '' : ' repo-card-static'}`;
                if (repo) {
                    card.href = repo.html_url;
                    card.target = '_blank';
                    card.rel = 'noopener noreferrer';
                }
                const name = document.createElement('strong');
                name.textContent = project.title;
                const description = document.createElement('p');
                description.textContent = repo?.description || project.description;
                const meta = document.createElement('span');
                meta.className = 'repo-meta';
                const language = document.createElement('span');
                language.className = 'repo-language';
                const languageDot = document.createElement('i');
                language.append(languageDot, document.createTextNode(project.language || repo?.language || 'Code'));
                const visibility = document.createElement('span');
                visibility.textContent = repo ? `★ ${numberFormat.format(repo.stargazers_count)}` : 'Private project';
                meta.append(language, visibility);
                card.append(name, description, meta);
                if (repo) {
                    const arrow = document.createElement('i');
                    arrow.setAttribute('aria-hidden', 'true');
                    arrow.textContent = '↗';
                    card.appendChild(arrow);
                }
                addSurfaceLight(card);
                if (finePointer && !reduceMotion) {
                    const cursor = document.querySelector('.cursor');
                    if (repo) {
                        card.addEventListener('mouseenter', () => cursor?.classList.add('active', 'link'));
                        card.addEventListener('mouseleave', () => cursor?.classList.remove('active', 'link'));
                    }
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

        const renderLatestCommit = (commitData) => {
            const commit = Array.isArray(commitData) ? commitData[0] : null;
            const message = commit?.commit?.message?.split('\n')[0];
            const time = commit?.commit?.committer?.date || commit?.commit?.author?.date;
            if (!message) return;
            const canonicalRepository = commit?.html_url?.match(/^https:\/\/github\.com\/[^/]+\/([^/]+)\/commit\//)?.[1] || repository;
            setText('latest-commit-repo', canonicalRepository);
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
            const encodedRepo = encodeURIComponent(repository);
            const profileUrl = `https://api.github.com/users/${encodedUser}`;
            const reposUrl = `https://api.github.com/users/${encodedUser}/repos?per_page=100&sort=updated`;
            const commitCountUrl = `https://api.github.com/search/commits?q=${encodeURIComponent(`author:${username}`)}&per_page=1`;
            const latestCommitUrl = `https://api.github.com/repos/${encodedUser}/${encodedRepo}/commits?per_page=1`;
            const contributionsUrl = `https://github-contributions-api.jogruber.de/v4/${encodedUser}?y=${currentYear}`;
            const requests = await Promise.allSettled([
                fetchJSON(profileUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(reposUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(commitCountUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(latestCommitUrl, { headers: apiHeaders }, forceRefresh),
                fetchJSON(contributionsUrl, {}, forceRefresh)
            ]);
            const values = requests.map((result) => result.status === 'fulfilled' ? result.value : null);
            const [profile, repos, commitSearch, latestCommit, contributions] = values;

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
            if (commitSearch && !commitSearch.incomplete_results) setText('github-commits', numberFormat.format(commitSearch.total_count));
            if (latestCommit) renderLatestCommit(latestCommit);
            else if (!quiet) {
                setText('latest-commit-repo', 'Portfolio Website');
                setText('latest-commit-message', 'Latest commit temporarily unavailable');
                setText('latest-commit-time', 'GitHub API will retry automatically');
            }
            if (contributions) {
                try { renderCalendar(contributions); } catch (error) { /* handled by status */ }
            }

            const successful = requests.filter((result) => result.status === 'fulfilled').length;
            if (status) {
                status.className = successful < requests.length ? 'github-status error' : 'github-status';
                status.textContent = successful === requests.length ? '' : successful > 1 ? 'Some live details are temporarily unavailable due to public API limits.' : 'GitHub activity is temporarily unavailable. Use the profile link to view it directly.';
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
