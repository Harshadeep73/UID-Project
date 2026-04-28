/**
 * BASE82 — theme-switcher.js
 * Kaneki-style sweep color transitions + Stats / Loadout / Settings modals
 * Drop this ONCE in home.html (and pages that need the switcher)
 */

(function () {
    'use strict';

    /* ============================================================
       PALETTE DEFINITIONS
    ============================================================ */
    const PALETTES = [
        {
            id: 'amber',
            name: 'AMBER',
            primary:   '#e8a045',
            warm:      '#f0b866',
            dim:       '#c07828',
            wipeColor: '#e8a045',
        },
        {
            id: 'crimson',
            name: 'CRIMSON',
            primary:   '#e84545',
            warm:      '#f06060',
            dim:       '#c02828',
            wipeColor: '#e84545',
        },
        {
            id: 'cyan',
            name: 'CYAN',
            primary:   '#45d4e8',
            warm:      '#66dff0',
            dim:       '#28aec0',
            wipeColor: '#45d4e8',
        },
        {
            id: 'violet',
            name: 'VIOLET',
            primary:   '#9d7ce8',
            warm:      '#b59af0',
            dim:       '#7a5cc0',
            wipeColor: '#9d7ce8',
        },
        {
            id: 'jade',
            name: 'JADE',
            primary:   '#45e87c',
            warm:      '#66f09a',
            dim:       '#28c060',
            wipeColor: '#45e87c',
        },
        {
            id: 'ghost',
            name: 'GHOST',
            primary:   '#e8e8e8',
            warm:      '#f5f5f5',
            dim:       '#b0b0b0',
            wipeColor: '#e8e8e8',
        },
    ];

    /* ============================================================
       STATE
    ============================================================ */
    let currentPaletteId = localStorage.getItem('b82_palette') || 'amber';
    let sweeping         = false;

    /* ============================================================
       APPLY PALETTE (instant — wipe handles visual)
    ============================================================ */
    function applyPalette(id) {
        const p = PALETTES.find(p => p.id === id) || PALETTES[0];
        const root = document.documentElement;
        root.style.setProperty('--accent-primary',   p.primary);
        root.style.setProperty('--accent-warm',      p.warm);
        root.style.setProperty('--accent-dim',       p.dim);
        root.style.setProperty('--accent-blue',      p.primary);
        root.style.setProperty('--accent-cyan',      p.warm);
        root.style.setProperty('--accent-green',     p.primary);
        root.style.setProperty('--accent-violet',    p.dim);
        root.style.setProperty('--accent-secondary', p.dim);
        root.style.setProperty('--glow-sm',  `0 0 12px ${p.primary}33`);
        root.style.setProperty('--glow-md',  `0 0 24px ${p.primary}26`);
        root.style.setProperty('--glow-lg',  `0 0 40px ${p.primary}1a`);
        root.style.setProperty('--accent-glow', hexToRgba(p.primary, 0.15));
        currentPaletteId = id;
        localStorage.setItem('b82_palette', id);

        /* update swatch preview */
        const swatch = document.querySelector('.color-swatch-preview');
        if (swatch) swatch.style.background = p.primary;

        /* update active state in panel */
        document.querySelectorAll('.csp-option').forEach(el => {
            el.classList.toggle('active', el.dataset.palette === id);
            el.style.color = el.dataset.palette === id ? p.primary : '';
        });
    }

    /* ============================================================
       KANEKI SWEEP
    ============================================================ */
    function kanekiSweep(targetId) {
        if (sweeping) return;
        sweeping = true;

        const p    = PALETTES.find(p => p.id === targetId) || PALETTES[0];
        const wipe = document.getElementById('b82ThemeWipe');
        const strip = wipe.querySelector('.theme-wipe-strip');

        strip.style.background = p.wipeColor;
        strip.style.transformOrigin = 'left center';
        strip.style.transform = 'scaleX(0)';
        wipe.classList.remove('sweep-out');
        wipe.classList.add('sweeping');

        /* Midpoint: apply palette while wipe covers screen */
        setTimeout(() => {
            applyPalette(targetId);
        }, 280);

        /* Sweep out */
        setTimeout(() => {
            wipe.classList.add('sweep-out');
            wipe.classList.remove('sweeping');
            setTimeout(() => {
                wipe.classList.remove('sweep-out');
                sweeping = false;
            }, 550);
        }, 480);
    }

    /* ============================================================
       BUILD SWITCHER UI
    ============================================================ */
    function buildSwitcher() {
        /* Wipe overlay */
        if (!document.getElementById('b82ThemeWipe')) {
            const wipe = document.createElement('div');
            wipe.id = 'b82ThemeWipe';
            wipe.className = 'theme-wipe';
            wipe.innerHTML = '<div class="theme-wipe-strip"></div>';
            document.body.appendChild(wipe);
        }

        /* Container */
        const wrapper = document.createElement('div');
        wrapper.className = 'color-switcher';
        wrapper.id = 'b82ColorSwitcher';
        wrapper.setAttribute('title', 'Change accent color');

        const currentP = PALETTES.find(p => p.id === currentPaletteId) || PALETTES[0];

        wrapper.innerHTML = `
            <div class="color-swatch-preview" style="background:${currentP.primary};"></div>
            <span class="color-switcher-label">THEME</span>
            <div class="color-switcher-panel" id="b82Panel">
                <span class="csp-label">// ACCENT COLOR</span>
                <div class="csp-grid" id="b82PaletteGrid"></div>
            </div>
        `;

        /* Fill grid */
        const grid = wrapper.querySelector('#b82PaletteGrid');
        PALETTES.forEach(p => {
            const opt = document.createElement('div');
            opt.className = 'csp-option' + (p.id === currentPaletteId ? ' active' : '');
            opt.dataset.palette = p.id;
            if (p.id === currentPaletteId) opt.style.color = p.primary;
            opt.innerHTML = `
                <div class="csp-dot" style="background:${p.primary};"></div>
                <span class="csp-name">${p.name}</span>
            `;
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                if (p.id === currentPaletteId) return;
                closePanel();
                kanekiSweep(p.id);
            });
            grid.appendChild(opt);
        });

        /* Toggle panel */
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            const panel = document.getElementById('b82Panel');
            panel.classList.toggle('open');
        });

        document.addEventListener('click', () => closePanel());
        return wrapper;
    }

    function closePanel() {
        const panel = document.getElementById('b82Panel');
        if (panel) panel.classList.remove('open');
    }

    /* ============================================================
       INJECT SWITCHER INTO NAV
       Works for both home.html (user-module) and pages.html (nav-links)
    ============================================================ */
    function injectSwitcher() {
        const switcher = buildSwitcher();

        /* HOME PAGE — insert left of .user-module inside .nav-right */
        const navRight = document.querySelector('.nav-right');
        if (navRight) {
            const userModule = navRight.querySelector('.user-module');
            navRight.insertBefore(switcher, userModule);
            return;
        }
        /* fallback: insert before .user-module wherever it is */
        const userModuleFb = document.querySelector('.user-module');
        if (userModuleFb) {
            userModuleFb.parentNode.insertBefore(switcher, userModuleFb);
            return;
        }

        /* OTHER PAGES — insert before last child of .top-nav */
        const topNav = document.querySelector('.top-nav');
        if (topNav) {
            topNav.appendChild(switcher);
        }
    }

    /* ============================================================
       MODALS
    ============================================================ */

    /* Generic modal factory */
    function createModal(id, eyebrow, title, bodyHTML) {
        const overlay = document.createElement('div');
        overlay.className = 'b82-modal-overlay';
        overlay.id = id;
        overlay.innerHTML = `
            <div class="b82-modal">
                <button class="b82-modal-close" data-close="${id}">
                    <i class="fas fa-times"></i>
                </button>
                <p class="b82-modal-eyebrow">${eyebrow}</p>
                <h2 class="b82-modal-title">${title}</h2>
                ${bodyHTML}
            </div>
        `;

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(id);
        });

        overlay.querySelector(`[data-close="${id}"]`).addEventListener('click', () => closeModal(id));
        document.body.appendChild(overlay);
        return overlay;
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('open');
            /* Animate XP bars after open */
            setTimeout(() => {
                el.querySelectorAll('.xp-fill[data-pct]').forEach(bar => {
                    bar.style.width = bar.dataset.pct + '%';
                });
            }, 100);
        }
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    }

    /* ---- VIEW STATS modal ---- */
    function buildStatsModal() {
        const player = localStorage.getItem('playerName') || 'GUEST';
        const joined = localStorage.getItem('b82_joined') || (() => {
            const d = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            localStorage.setItem('b82_joined', d);
            return d;
        })();
        const gamesViewed = parseInt(localStorage.getItem('b82_gamesViewed') || '0');
        const searchCount = parseInt(localStorage.getItem('b82_searchCount') || '0');
        const postCount   = parseInt(localStorage.getItem('b82_postCount')   || '0');

        const xpCurrent = Math.min(((gamesViewed * 10 + searchCount * 5 + postCount * 25) % 1000), 1000);
        const xpLevel   = Math.floor((gamesViewed * 10 + searchCount * 5 + postCount * 25) / 1000) + 1;
        const xpPct     = Math.round((xpCurrent / 1000) * 100);

        const body = `
            <div class="stats-grid">
                <div class="stat-tile">
                    <span class="stat-tile-val">${gamesViewed}</span>
                    <span class="stat-tile-label">GAMES VIEWED</span>
                </div>
                <div class="stat-tile">
                    <span class="stat-tile-val">${searchCount}</span>
                    <span class="stat-tile-label">SEARCHES</span>
                </div>
                <div class="stat-tile">
                    <span class="stat-tile-val">${postCount}</span>
                    <span class="stat-tile-label">POSTS</span>
                </div>
                <div class="stat-tile">
                    <span class="stat-tile-val">LV.${xpLevel}</span>
                    <span class="stat-tile-label">OPERATOR RANK</span>
                </div>
            </div>
            <div class="xp-section">
                <div class="xp-header">
                    <span class="xp-label">XP — LEVEL ${xpLevel}</span>
                    <span class="xp-label">${xpCurrent} / 1000</span>
                </div>
                <div class="xp-track">
                    <div class="xp-fill" data-pct="${xpPct}" style="width:0%;"></div>
                </div>
            </div>
            <div class="xp-section">
                <div class="xp-header">
                    <span class="xp-label">CALLSIGN</span>
                    <span class="xp-label" style="color:var(--accent-primary);">${player.toUpperCase()}</span>
                </div>
                <div class="xp-header" style="margin-top:6px;">
                    <span class="xp-label">DEPLOYED</span>
                    <span class="xp-label">${joined}</span>
                </div>
            </div>
        `;
        createModal('b82ModalStats', '// OPERATOR FILE', 'YOUR STATS', body);
    }

    /* ---- LOADOUTS modal ---- */
    function buildLoadoutsModal() {
        const GENRES = ['ACTION', 'RPG', 'FPS', 'HORROR', 'INDIE', 'STRATEGY', 'SPORTS', 'PUZZLE'];
        const saved  = JSON.parse(localStorage.getItem('b82_loadouts') || '[null,null,null,null]');

        function slotHTML(i) {
            const g = saved[i];
            if (g) {
                return `
                    <div class="loadout-slot filled" data-slot="${i}">
                        <div class="loadout-slot-icon"><i class="fas fa-crosshairs"></i></div>
                        <div class="loadout-slot-name">${g}</div>
                        <div class="loadout-slot-genre">ACTIVE</div>
                    </div>
                `;
            }
            return `
                <div class="loadout-slot" data-slot="${i}">
                    <div class="loadout-slot-icon"><i class="fas fa-plus"></i></div>
                    <div class="loadout-slot-name">EMPTY SLOT</div>
                </div>
            `;
        }

        const genreOptions = GENRES.map(g =>
            `<option value="${g}">${g}</option>`
        ).join('');

        const body = `
            <p style="font-family:'PixelDigivolve',monospace;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.25);margin-bottom:16px;">
                SET YOUR 4 PREFERRED GENRES — USED TO PERSONALIZE YOUR LEADERBOARD
            </p>
            <div class="loadout-grid" id="b82LoadoutGrid">
                ${[0,1,2,3].map(i => slotHTML(i)).join('')}
            </div>
            <div style="margin-top:16px;display:flex;gap:8px;align-items:center;">
                <select id="b82GenrePicker" style="flex:1;background:#0d0f12;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:rgba(255,255,255,0.7);padding:9px 12px;font-family:'PixelDigivolve',monospace;font-size:9px;letter-spacing:1px;outline:none;">
                    <option value="">SELECT GENRE...</option>
                    ${genreOptions}
                </select>
                <button id="b82LoadoutAdd" style="background:var(--accent-primary);color:#0d0f12;border:none;border-radius:6px;padding:9px 16px;font-family:'PixelDigivolve',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;font-weight:700;white-space:nowrap;">
                    ADD
                </button>
                <button id="b82LoadoutClear" style="background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:9px 16px;font-family:'PixelDigivolve',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;">
                    CLEAR
                </button>
            </div>
        `;

        const modal = createModal('b82ModalLoadouts', '// OPERATOR CONFIG', 'LOADOUTS', body);

        /* Attach logic after DOM insert */
        modal.querySelector('#b82LoadoutAdd').addEventListener('click', () => {
            const genre  = modal.querySelector('#b82GenrePicker').value;
            if (!genre) return;
            const current = JSON.parse(localStorage.getItem('b82_loadouts') || '[null,null,null,null]');
            if (current.includes(genre)) return;
            const idx = current.indexOf(null);
            if (idx === -1) { current[3] = genre; } else { current[idx] = genre; }
            localStorage.setItem('b82_loadouts', JSON.stringify(current));
            refreshLoadoutGrid(modal, current);
        });

        modal.querySelector('#b82LoadoutClear').addEventListener('click', () => {
            localStorage.setItem('b82_loadouts', '[null,null,null,null]');
            refreshLoadoutGrid(modal, [null, null, null, null]);
        });

        modal.querySelector('#b82LoadoutGrid').addEventListener('click', (e) => {
            const slot = e.target.closest('[data-slot]');
            if (!slot) return;
            const i = parseInt(slot.dataset.slot);
            const current = JSON.parse(localStorage.getItem('b82_loadouts') || '[null,null,null,null]');
            current[i] = null;
            localStorage.setItem('b82_loadouts', JSON.stringify(current));
            refreshLoadoutGrid(modal, current);
        });
    }

    function refreshLoadoutGrid(modal, data) {
        const GENRES = ['ACTION', 'RPG', 'FPS', 'HORROR', 'INDIE', 'STRATEGY', 'SPORTS', 'PUZZLE'];
        const grid = modal.querySelector('#b82LoadoutGrid');
        grid.innerHTML = [0,1,2,3].map(i => {
            const g = data[i];
            if (g) {
                return `<div class="loadout-slot filled" data-slot="${i}">
                    <div class="loadout-slot-icon"><i class="fas fa-crosshairs"></i></div>
                    <div class="loadout-slot-name">${g}</div>
                    <div class="loadout-slot-genre">TAP TO REMOVE</div>
                </div>`;
            }
            return `<div class="loadout-slot" data-slot="${i}">
                <div class="loadout-slot-icon"><i class="fas fa-plus"></i></div>
                <div class="loadout-slot-name">EMPTY SLOT</div>
            </div>`;
        }).join('');
    }

    /* ---- SETTINGS modal ---- */
    function buildSettingsModal() {
        const settings = JSON.parse(localStorage.getItem('b82_settings') || '{}');
        const defaults = {
            notifications:  true,
            spoilerGuard:   false,
            animatedBg:     true,
            compactMode:    false,
            searchHistory:  true,
        };
        const s = Object.assign({}, defaults, settings);

        function toggleRow(key, label, desc) {
            const on = s[key];
            return `
                <div class="settings-row">
                    <div>
                        <div class="settings-row-label">${label}</div>
                        ${desc ? `<div class="settings-row-desc">${desc}</div>` : ''}
                    </div>
                    <button class="b82-toggle ${on ? 'on' : ''}" data-key="${key}"></button>
                </div>
            `;
        }

        const body = `
            <p class="settings-section-title">// DISPLAY</p>
            ${toggleRow('animatedBg',   'ANIMATED BACKGROUND', 'Carousel on home / lanes on login')}
            ${toggleRow('compactMode',  'COMPACT MODE',        'Smaller cards, tighter spacing')}
            <p class="settings-section-title">// PRIVACY</p>
            ${toggleRow('searchHistory','SEARCH HISTORY',      'Save recent searches locally')}
            ${toggleRow('spoilerGuard', 'SPOILER GUARD',       'Blur unreleased game art')}
            <p class="settings-section-title">// NOTIFICATIONS</p>
            ${toggleRow('notifications','PLATFORM ALERTS',     'Toast notifications on actions')}
            <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);">
                <button id="b82ClearData" style="background:rgba(200,80,80,0.08);color:rgba(200,120,120,0.8);border:1px solid rgba(200,80,80,0.15);border-radius:6px;padding:10px 18px;font-family:'PixelDigivolve',monospace;font-size:9px;letter-spacing:1.5px;cursor:pointer;width:100%;transition:background 0.2s;">
                    CLEAR ALL LOCAL DATA
                </button>
            </div>
        `;

        const modal = createModal('b82ModalSettings', '// OPERATOR SETTINGS', 'SETTINGS', body);

        /* Toggle logic */
        modal.querySelectorAll('.b82-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                s[key] = !s[key];
                btn.classList.toggle('on', s[key]);
                localStorage.setItem('b82_settings', JSON.stringify(s));
                applySettings(s);
            });
        });

        modal.querySelector('#b82ClearData').addEventListener('click', () => {
            if (confirm('Clear all BASE82 local data? This resets stats, loadouts, posts, and settings.')) {
                ['b82_palette','b82_settings','b82_loadouts','b82_joined',
                 'b82_gamesViewed','b82_searchCount','b82_postCount'].forEach(k => localStorage.removeItem(k));
                location.reload();
            }
        });
    }

    function applySettings(s) {
        /* Compact mode */
        document.body.classList.toggle('b82-compact', !!s.compactMode);

        /* Animated BG */
        const tracks = document.querySelectorAll('.track, .carousel-row');
        tracks.forEach(t => {
            t.style.animationPlayState = s.animatedBg ? 'running' : 'paused';
        });
    }

    /* ============================================================
       WIRE UP DROPDOWN ITEMS
    ============================================================ */
    function wireDropdownItems() {
        /* Find drop-items by icon class or text content */
        document.querySelectorAll('.drop-item').forEach(btn => {
            const text = btn.textContent.trim().toUpperCase();
            if (text.includes('VIEW STATS') || text.includes('STATS')) {
                btn.addEventListener('click', () => {
                    /* Rebuild stats each open so numbers are fresh */
                    const existing = document.getElementById('b82ModalStats');
                    if (existing) existing.remove();
                    buildStatsModal();
                    openModal('b82ModalStats');
                });
            }
            if (text.includes('LOADOUT')) {
                btn.addEventListener('click', () => {
                    if (!document.getElementById('b82ModalLoadouts')) buildLoadoutsModal();
                    openModal('b82ModalLoadouts');
                });
            }
            if (text.includes('SETTINGS')) {
                btn.addEventListener('click', () => {
                    if (!document.getElementById('b82ModalSettings')) buildSettingsModal();
                    openModal('b82ModalSettings');
                });
            }
        });
    }

    /* ============================================================
       ACTIVITY TRACKING (passive — just counts)
    ============================================================ */
    function initTracking() {
        /* Track game card clicks */
        document.addEventListener('click', (e) => {
            if (e.target.closest('.game-card') || e.target.closest('.lb-card') || e.target.closest('.search-result-item')) {
                const v = parseInt(localStorage.getItem('b82_gamesViewed') || '0') + 1;
                localStorage.setItem('b82_gamesViewed', v);
            }
        });

        /* Track search submissions */
        const heroSearchBtn = document.getElementById('heroSearchBtn');
        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                const v = parseInt(localStorage.getItem('b82_searchCount') || '0') + 1;
                localStorage.setItem('b82_searchCount', v);
            });
        }
    }

    /* ============================================================
       INIT
    ============================================================ */
    function init() {
        /* Apply saved palette immediately (no sweep on load) */
        applyPalette(currentPaletteId);

        /* Apply saved settings */
        const s = JSON.parse(localStorage.getItem('b82_settings') || '{}');
        const defaults = { animatedBg: true, compactMode: false };
        applySettings(Object.assign({}, defaults, s));

        /* Inject UI */
        injectSwitcher();
        wireDropdownItems();
        initTracking();
    }

    /* ============================================================
       HELPERS
    ============================================================ */
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /* Run after DOM is ready */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
