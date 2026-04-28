/**
 * BASE82 — game-detail.js
 * Fetches full game intel from RAWG API and populates the detail page.
 * URL param: ?id=<rawg_game_id>  OR  ?q=<game_name>
 */

document.body.classList.add('loaded');

const API_KEY = 'bc866a3dcd8943a5b813991d52d57209';

/* ── helpers ── */
const qs = (sel)        => document.querySelector(sel);
const params            = new URLSearchParams(window.location.search);
const gameId            = params.get('id');
const gameName          = params.get('q');

/* ── lightbox ── */
const lightbox = document.createElement('div');
lightbox.className = 'gd-lightbox';
lightbox.innerHTML = `<button class="gd-lb-close" id="gdLbClose"><i class="fas fa-times"></i></button><img id="gdLbImg" src="" alt="">`;
document.body.appendChild(lightbox);

document.getElementById('gdLbClose').addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });

function openLightbox(src) {
    document.getElementById('gdLbImg').src = src;
    lightbox.classList.add('open');
}

/* ── strip HTML tags from RAWG descriptions ── */
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

/* ── wrap plain text into paragraphs ── */
function textToHtml(text) {
    if (!text) return '<p>No description available.</p>';
    return text.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('');
}

/* ── store icon map ── */
const storeIcons = {
    steam:                 'fab fa-steam',
    'epic-games':          'fas fa-gamepad',
    'xbox-store':          'fab fa-xbox',
    'xbox360':             'fab fa-xbox',
    playstation-store:     'fab fa-playstation',
    'apple-appstore':      'fab fa-apple',
    'google-play':         'fab fa-google-play',
    'nintendo':            'fas fa-gamepad',
    gog:                   'fas fa-compact-disc',
    itchio:                'fas fa-itch-io',
};

/* ================================================================
   MAIN FETCH
================================================================ */
async function loadGame() {
    try {
        let game;

        if (gameId) {
            /* Direct ID fetch */
            const res = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`);
            game = await res.json();
        } else if (gameName) {
            /* Search by name then grab first result's ID */
            const searchRes  = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`);
            const searchData = await searchRes.json();
            if (!searchData.results || !searchData.results.length) throw new Error('NOT_FOUND');
            const res = await fetch(`https://api.rawg.io/api/games/${searchData.results[0].id}?key=${API_KEY}`);
            game = await res.json();
        } else {
            throw new Error('NO_PARAM');
        }

        if (game.detail === 'Not found.') throw new Error('NOT_FOUND');

        renderGame(game);

        /* Fetch screenshots separately */
        const ssRes  = await fetch(`https://api.rawg.io/api/games/${game.id}/screenshots?key=${API_KEY}`);
        const ssData = await ssRes.json();
        renderScreenshots(ssData.results || []);

    } catch (err) {
        console.error('Game load error:', err);
        qs('#gdLoading').style.display = 'none';
        qs('#gdError').style.display   = 'flex';
    }
}

/* ================================================================
   RENDER HERO
================================================================ */
function renderHero(game) {
    const hero    = qs('#gdHero');
    const heroImg = qs('#gdHeroImg');

    if (game.background_image) {
        heroImg.style.backgroundImage = `url('${game.background_image}')`;
    }

    const titleBlock = qs('#gdTitleBlock');
    titleBlock.innerHTML = `
        <p class="gd-eyebrow">// TARGET ACQUIRED — ${(game.genres || []).slice(0,2).map(g=>g.name).join(' · ').toUpperCase() || 'GAME'}</p>
        <h1>${game.name}</h1>
        <div class="gd-title-meta">
            ${game.rating ? `<div class="gd-rating-badge"><i class="fas fa-star" style="font-size:12px;margin-right:6px;"></i>${game.rating}</div>` : ''}
            ${game.released ? `<span class="gd-meta-chip"><i class="fas fa-calendar"></i>${game.released}</span>` : ''}
            ${game.playtime ? `<span class="gd-meta-chip"><i class="fas fa-clock"></i>~${game.playtime}H AVG PLAYTIME</span>` : ''}
            ${game.esrb_rating ? `<span class="gd-meta-chip"><i class="fas fa-shield-alt"></i>${game.esrb_rating.name}</span>` : ''}
        </div>
    `;

    setTimeout(() => hero.classList.add('loaded'), 100);
}

/* ================================================================
   RENDER STATS BAR
================================================================ */
function renderStatsBar(game) {
    const stats = [
        { val: game.rating || '--',                         label: 'RATING' },
        { val: game.ratings_count ? game.ratings_count.toLocaleString() : '--', label: 'REVIEWS' },
        { val: game.added ? game.added.toLocaleString() : '--', label: 'IN LIBRARIES' },
        { val: game.metacritic || '--',                     label: 'METACRITIC' },
        { val: game.playtime ? `${game.playtime}H` : '--', label: 'AVG PLAYTIME' },
        { val: (game.platforms || []).length || '--',        label: 'PLATFORMS' },
    ];

    qs('#gdStatsBar').innerHTML = stats.map(s => `
        <div class="gd-stat">
            <span class="gd-stat-val">${s.val}</span>
            <span class="gd-stat-label">${s.label}</span>
        </div>
    `).join('');
}

/* ================================================================
   RENDER DESCRIPTION
================================================================ */
function renderDescription(game) {
    const raw = game.description_raw || stripHtml(game.description) || '';
    qs('#gdDescription').innerHTML = textToHtml(raw);
}

/* ================================================================
   RENDER SCREENSHOTS
================================================================ */
function renderScreenshots(shots) {
    const section = qs('#gdScreenshotsSection');
    if (!shots.length) { section.style.display = 'none'; return; }

    qs('#gdScreenshots').innerHTML = shots.slice(0, 9).map(s => `
        <div class="gd-screenshot">
            <img src="${s.image}" alt="Screenshot" loading="lazy">
        </div>
    `).join('');

    qs('#gdScreenshots').querySelectorAll('.gd-screenshot').forEach(card => {
        const img = card.querySelector('img');
        card.addEventListener('click', () => openLightbox(img.src));
    });
}

/* ================================================================
   RENDER RATINGS BREAKDOWN
================================================================ */
function renderRatings(game) {
    const section = qs('#gdRatingsSection');
    const ratings = game.ratings || [];
    if (!ratings.length) { section.style.display = 'none'; return; }

    const colorMap = { exceptional: 'exceptional', recommended: 'recommended', meh: 'meh', skip: 'skip' };
    const total    = ratings.reduce((a, r) => a + r.count, 0);

    qs('#gdRatings').innerHTML = ratings.map(r => {
        const cls = colorMap[r.title.toLowerCase()] || 'recommended';
        const pct = total ? Math.round((r.count / total) * 100) : 0;
        return `
            <div class="gd-rating-card">
                <p class="gd-rc-title">${r.title.toUpperCase()}</p>
                <div class="gd-rc-count ${cls}">${r.count.toLocaleString()}</div>
                <div class="gd-rc-bar-track">
                    <div class="gd-rc-bar-fill ${cls}" data-pct="${pct}"></div>
                </div>
            </div>
        `;
    }).join('');

    /* Animate bars after brief delay */
    setTimeout(() => {
        qs('#gdRatings').querySelectorAll('.gd-rc-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.pct + '%';
        });
    }, 300);
}

/* ================================================================
   RENDER SIDEBAR — INFO CARD
================================================================ */
function renderInfoCard(game) {
    const rows = [
        { key: 'DEVELOPER',   val: (game.developers || []).map(d=>d.name).join(', ') || '--' },
        { key: 'PUBLISHER',   val: (game.publishers || []).map(p=>p.name).join(', ') || '--' },
        { key: 'RELEASE',     val: game.released || '--' },
        { key: 'WEBSITE',     val: game.website ? `<a href="${game.website}" target="_blank" rel="noopener" style="color:#00aaff;word-break:break-all;">${game.website.replace(/^https?:\/\//, '')}</a>` : '--' },
    ];

    qs('#gdInfoCard').innerHTML = `
        <p class="gd-info-card-title">INTEL</p>
        ${rows.map(r => `
            <div class="gd-info-row">
                <span class="gd-info-key">${r.key}</span>
                <span class="gd-info-val">${r.val}</span>
            </div>
        `).join('')}
    `;
}

/* ================================================================
   RENDER SIDEBAR — PLATFORMS
================================================================ */
function renderPlatforms(game) {
    const platforms = game.platforms || [];
    if (!platforms.length) { qs('#gdPlatforms').style.display = 'none'; return; }

    const names = platforms.map(p => p.platform.name);
    qs('#gdPlatforms').innerHTML = `
        <p class="gd-info-card-title">PLATFORMS</p>
        <div class="gd-chip-wrap">
            ${names.map(n => `<span class="gd-chip">${n}</span>`).join('')}
        </div>
    `;
}

/* ================================================================
   RENDER SIDEBAR — GENRES & TAGS
================================================================ */
function renderTags(game) {
    const genres = (game.genres || []).map(g => g.name);
    const tags   = (game.tags   || []).slice(0, 12).map(t => t.name);
    if (!genres.length && !tags.length) { qs('#gdTags').style.display = 'none'; return; }

    qs('#gdTags').innerHTML = `
        <p class="gd-info-card-title">GENRES & TAGS</p>
        <div class="gd-chip-wrap">
            ${genres.map(g => `<span class="gd-chip" style="border-color:rgba(0,255,157,0.25);color:rgba(0,255,157,0.8);">${g}</span>`).join('')}
            ${tags.map(t   => `<span class="gd-chip">${t}</span>`).join('')}
        </div>
    `;
}

/* ================================================================
   RENDER SIDEBAR — STORES
================================================================ */
function renderStores(game) {
    const stores = game.stores || [];
    if (!stores.length) { qs('#gdStores').style.display = 'none'; return; }

    qs('#gdStores').innerHTML = `
        <p class="gd-info-card-title">WHERE TO BUY</p>
        ${stores.map(s => {
            const slug = s.store.slug;
            const icon = storeIcons[slug] || 'fas fa-shopping-cart';
            return `
                <a class="gd-store-link" href="https://www.rawg.io/games/${game.slug}" target="_blank" rel="noopener">
                    <i class="${icon}"></i> ${s.store.name.toUpperCase()}
                    <i class="fas fa-external-link-alt" style="margin-left:auto;font-size:8px;opacity:0.5;"></i>
                </a>
            `;
        }).join('')}
    `;
}

/* ================================================================
   MASTER RENDER
================================================================ */
function renderGame(game) {
    renderHero(game);
    renderStatsBar(game);
    renderDescription(game);
    renderRatings(game);
    renderInfoCard(game);
    renderPlatforms(game);
    renderTags(game);
    renderStores(game);

    /* Update page title */
    document.title = `${game.name} — BASE82`;

    /* Show content, hide loader */
    qs('#gdLoading').style.display = 'none';
    qs('#gdContent').style.display = 'block';
}

/* ── kick off ── */
loadGame();
