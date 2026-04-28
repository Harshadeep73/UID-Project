/**
 * BASE82 — home.js
 * Covers: DOM manipulation, Fetch API / AJAX, localStorage,
 * event handling, IntersectionObserver, carousel background.
 */

const API_KEY = 'bc866a3dcd8943a5b813991d52d57209';

/* ======================
   DOMContentLoaded — initialise all modules
====================== */
document.addEventListener('DOMContentLoaded', () => {

    initUserModule();
    initSidebarMenu();
    initCarouselBackground();
    initHeroSearch();
    buildLeaderboard();
    initDiagnosticsTicker();

}); // end DOMContentLoaded

/* ======================
   USER MODULE
   Reads from localStorage to personalise the nav
====================== */
function initUserModule() {
    const nameDisplay = document.getElementById('playerNameDisplay');
    const authBtn     = document.getElementById('dropLogoutBtn');
    const trigger     = document.getElementById('userProfileTrigger');
    const dropdown    = document.getElementById('profileDropdown');

    // localStorage — read login state
    const isAuth = localStorage.getItem('loggedIn') === 'true';

    if (isAuth) {
        const stored = localStorage.getItem('playerName');
        nameDisplay.textContent = stored ? stored.toUpperCase() : 'PLAYER';
    } else {
        nameDisplay.textContent = 'GUEST';
        if (authBtn) {
            authBtn.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i> LOGIN';
            authBtn.classList.remove('logout');
            authBtn.style.color = 'var(--accent-green)';
        }
    }

    // Toggle dropdown on click (event handling: click + stopPropagation)
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = dropdown.classList.toggle('show');
        trigger.setAttribute('aria-expanded', isExpanded.toString());
    });

    // Keyboard accessibility for the trigger (keydown event)
    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trigger.click();
        }
    });

    // Close dropdown when clicking outside (event delegation)
    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
        trigger.setAttribute('aria-expanded', 'false');
    });

    // Auth button — logout or redirect to login
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            if (isAuth) {
                showToast('DISCONNECTING...');
                // localStorage removal
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('playerName');
                setTimeout(() => { window.location.href = 'login.html'; }, 1000);
            } else {
                window.location.href = 'login.html';
            }
        });
    }
}

/* ======================
   SIDEBAR MENU
   Event handling: click, keydown
====================== */
function initSidebarMenu() {
    const menuOpen  = document.getElementById('menuOpen');
    const menuClose = document.getElementById('menuClose');
    const sidebar   = document.getElementById('sidebarMenu');
    const overlay   = document.getElementById('menuOverlay');

    const toggleMenu = (open) => {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('open', open);
        sidebar.setAttribute('aria-hidden', (!open).toString());
        menuOpen.setAttribute('aria-expanded', open.toString());
        menuOpen.classList.toggle('open', open);
        // Prevent body scroll when menu is open
        document.body.style.overflow = open ? 'hidden' : '';
    };

    menuOpen.addEventListener('click',  () => toggleMenu(true));
    menuClose.addEventListener('click', () => toggleMenu(false));
    overlay.addEventListener('click',   () => toggleMenu(false));

    // Close on Escape key (keydown event)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMenu(false);
    });
}

/* ======================
   CAROUSEL BACKGROUND
   DOM Manipulation: createElement, appendChild
   NOTE: paths use ../asserts/ because JS runs from HTML/ folder context
====================== */
function initCarouselBackground() {
    const IMG_SETS = [
        [
            '../asserts/eldenring.jpg',
            '../asserts/cyberpunk.png',
            '../asserts/minecraft.jpg',
            '../asserts/witcher 3.jpg',
            '../asserts/got.jpg',
            '../asserts/uncharted4.jpg',
            '../asserts/cod.jpg',
            '../asserts/gow.jpg'
        ],
        [
            '../asserts/sekiro.jpg',
            '../asserts/gta5.jpg',
            '../asserts/hollowknight.jpg',
            '../asserts/re9.jpg',
            '../asserts/exp33.jpg',
            '../asserts/skyrim.jpg',
            '../asserts/rdr2.jpg',
            '../asserts/darksouls.jpg'
        ],
        [
            '../asserts/forza4.jpg',
            '../asserts/bl4.jpg',
            '../asserts/eldenring.jpg',
            '../asserts/cyberpunk.png',
            '../asserts/gow.jpg',
            '../asserts/minecraft.jpg',
            '../asserts/sekiro.jpg',
            '../asserts/gta5.jpg'
        ],
        [
            '../asserts/rdr2.jpg',
            '../asserts/witcher 3.jpg',
            '../asserts/hollowknight.jpg',
            '../asserts/re9.jpg',
            '../asserts/uncharted4.jpg',
            '../asserts/darksouls.jpg',
            '../asserts/forza4.jpg',
            '../asserts/cod.jpg'
        ],
    ];

    ['row1', 'row2', 'row3', 'row4'].forEach((id, i) => {
        const row = document.getElementById(id);
        if (!row) return;
        // Double images for seamless CSS loop
        const imgs = [...IMG_SETS[i], ...IMG_SETS[i]];
        imgs.forEach((src) => {
            const img     = document.createElement('img');   // DOM createElement
            img.className = 'carousel-thumb';
            img.src       = src;
            img.alt       = '';                              // decorative — empty alt
            img.loading   = 'lazy';
            img.width     = 200;
            img.height    = 140;
            row.appendChild(img);                            // DOM appendChild
        });
    });
}

/* ======================
   HERO SEARCH
   Fetch API / AJAX with async/await + JSON parsing + graceful error handling
====================== */
function initHeroSearch() {
    const heroSearch     = document.getElementById('heroSearch');
    const searchDropdown = document.getElementById('searchDropdown');
    const heroSearchBtn  = document.getElementById('heroSearchBtn');

    let searchTimer;

    // Input event — debounced search
    heroSearch.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = heroSearch.value.trim();
        if (!q) {
            searchDropdown.classList.remove('open');
            return;
        }
        searchTimer = setTimeout(() => doSearch(q), 400);
    });

    // Keydown event — Enter to navigate
    heroSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = heroSearch.value.trim();
            if (q) window.location.href = `explore.html?q=${encodeURIComponent(q)}`;
        }
    });

    // Button click event
    heroSearchBtn.addEventListener('click', () => {
        const q = heroSearch.value.trim();
        if (q) window.location.href = `explore.html?q=${encodeURIComponent(q)}`;
    });

    // Close dropdown when clicking outside (event delegation)
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchWrap')) {
            searchDropdown.classList.remove('open');
        }
    });

    /**
     * Fetches search results from RAWG API
     * Fetch API: fetch(), async/await, JSON parsing, error handling
     * @param {string} q - Search query
     */
    async function doSearch(q) {
        // Show loading state via DOM innerHTML
        searchDropdown.innerHTML = '<div class="search-no-result">SCANNING...</div>';
        searchDropdown.classList.add('open');

        try {
            // Fetch API with async/await
            const res  = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(q)}&page_size=6`);
            // JSON parsing
            const data = await res.json();

            if (!data.results || !data.results.length) {
                searchDropdown.innerHTML = '<div class="search-no-result">NO TARGETS FOUND</div>';
                return;
            }

            // DOM Manipulation: build result items
            searchDropdown.innerHTML = data.results.map(g => `
                <div class="search-result-item"
                     role="option"
                     tabindex="0"
                     data-name="${g.name}"
                     onclick="window.location.href='explore.html?q=${encodeURIComponent(g.name)}'">
                    <img class="sri-img"
                         src="${g.background_image || ''}"
                         alt="${g.name}"
                         width="56" height="38"
                         onerror="this.style.display='none'">
                    <div>
                        <div class="sri-name">${g.name}</div>
                        <div class="sri-meta">
                            <i class="fas fa-star" aria-hidden="true"></i>
                            ${g.rating || '--'} &nbsp;·&nbsp; ${g.released ? g.released.slice(0, 4) : '--'}
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            // Graceful error handling
            searchDropdown.innerHTML = '<div class="search-no-result">CONNECTION ERROR — RETRY</div>';
            console.error('Search error:', err);
        }
    }
}

/* ======================
   LEADERBOARD
   Fetch API + IntersectionObserver for scroll-triggered animations
====================== */
async function buildLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    // Show loading skeletons
    tbody.innerHTML = Array(6).fill(0).map(() => `
        <div class="lb-card" style="opacity:0.3; pointer-events:none;">
            <div style="height:16px; background:rgba(255,255,255,0.05); border-radius:4px; width:40px;"></div>
            <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:8px; animation: shimmer 1.5s infinite alternate;"></div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="height:12px; background:rgba(255,255,255,0.05); border-radius:4px;"></div>
                <div style="height:10px; background:rgba(255,255,255,0.03); border-radius:4px; width:70%;"></div>
            </div>
        </div>
    `).join('');

    try {
        // Fetch API — RAWG games list
        const res  = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&ordering=-added&page_size=10&dates=2024-01-01,2025-12-31`);
        const data = await res.json();

        tbody.innerHTML = '';

        data.results.forEach((game, i) => {
            const card = document.createElement('div');
            card.className = 'lb-card';
            card.setAttribute('role', 'listitem');
            card.style.animationDelay = `${i * 0.06}s`;

            const genres = game.genres ? game.genres.slice(0, 2).map(g => g.name).join(' · ') : 'GAME';
            const barPct = Math.round((game.rating / 5) * 100);

            card.innerHTML = `
                <div class="lb-card-rank" aria-label="Rank ${i + 1}">#${i + 1}</div>
                <img class="lb-card-cover"
                     src="${game.background_image || ''}"
                     alt="${game.name} cover art"
                     width="280" height="140"
                     onerror="this.style.display='none'">
                <div class="lb-card-info">
                    <h3 class="lb-card-name">${game.name}</h3>
                    <p class="lb-card-genre">${genres.toUpperCase()}</p>
                </div>
                <div class="lb-card-score">
                    <div class="lb-rating-val" aria-label="Rating ${game.rating}">${game.rating || '--'}</div>
                    <div class="lb-rating-bar" role="progressbar" aria-valuenow="${barPct}" aria-valuemin="0" aria-valuemax="100">
                        <div class="lb-rating-fill" data-pct="${barPct}"></div>
                    </div>
                </div>
            `;

            // Event Handling: click to navigate
            card.addEventListener('click', () => {
                window.location.href = `explore.html?q=${encodeURIComponent(game.name)}`;
            });

            // Keyboard navigation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') card.click();
            });
            card.setAttribute('tabindex', '0');

            tbody.appendChild(card);
        });

        // IntersectionObserver — scroll-triggered animations
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Animate rating bar fill
                    const bar = entry.target.querySelector('.lb-rating-fill');
                    if (bar) {
                        setTimeout(() => {
                            bar.style.width = bar.dataset.pct + '%';
                        }, 200);
                    }
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        tbody.querySelectorAll('.lb-card').forEach(card => io.observe(card));

    } catch (err) {
        // Graceful error handling with loading states
        tbody.innerHTML = `
            <div style="text-align:center; padding:30px; color:var(--text-muted);
                        font-family:'PixelDigivolve',sans-serif; font-size:10px;
                        letter-spacing:2px; grid-column:1/-1;">
                DATA UNAVAILABLE — <a href="javascript:buildLeaderboard()" style="color:var(--accent-primary);">RETRY</a>
            </div>`;
        console.error('Leaderboard error:', err);
    }
}

/* ======================
   DIAGNOSTICS TICKER
   setInterval — live feel
====================== */
function initDiagnosticsTicker() {
    setInterval(() => {
        const latency = document.getElementById('serverLatency');
        const users   = document.getElementById('activeUsers');
        if (latency) latency.textContent = (10 + Math.floor(Math.random() * 10)) + 'ms';
        if (users)   users.textContent   = (8492 + Math.floor(Math.random() * 40 - 20)).toLocaleString();
    }, 3000);
}

/* ======================
   SITE LOADER
   window.load event + CSS class toggle
====================== */
window.addEventListener('load', () => {
    const brand  = document.getElementById('loaderBrand');
    const loader = document.getElementById('siteLoader');

    setTimeout(() => {
        if (brand) brand.classList.add('expand');
        setTimeout(() => {
            if (brand) brand.classList.add('fade-out');
            setTimeout(() => {
                if (loader) loader.classList.add('hide');
            }, 500);
        }, 1000);
    }, 400);
});

/* ======================
   TOAST — Global utility
====================== */
window.showToast = (msg) => {
    const toast    = document.getElementById('customToast');
    const toastMsg = document.getElementById('toastMessage');
    if (toast && toastMsg) {
        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};
