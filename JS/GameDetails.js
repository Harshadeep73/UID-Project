/**
 * BASE82 — GameDetails.js
 * Handles all three page sections:
 *   1. Intel    — RAWG game data, screenshots, ratings
 *   2. Videos   — RAWG clips + manual YouTube link manager
 *   3. Community — localStorage-based comment board
 *
 * URL param: ?id=<rawg_game_id>  OR  ?q=<game_name>
 * Code style: Allman braces, section comments, no inline spaghetti.
 */

document.body.classList.add('loaded');

/* ============================================================
   CONSTANTS & STATE
============================================================ */
const API_KEY   = 'bc866a3dcd8943a5b813991d52d57209';
const params    = new URLSearchParams(window.location.search);
const gameId    = params.get('id');
const gameName  = params.get('q');

/* Shorthand query selector */
const qs = (sel) => document.querySelector(sel);

let currentGameId   = null;     // set once game data loads
let currentGameSlug = null;
let postsData       = [];       // community posts (from localStorage)
let manualLinks     = [];       // user-added video links
let postSort        = 'newest';

/* ============================================================
   LIGHTBOX
============================================================ */
const lightbox = document.createElement('div');
lightbox.className = 'gd-lightbox';
lightbox.innerHTML = `
    <button class="gd-lb-close" id="gdLbClose">
        <i class="fas fa-times"></i>
    </button>
    <img id="gdLbImg" src="" alt="">
`;
document.body.appendChild(lightbox);

document.getElementById('gdLbClose').addEventListener('click', () =>
{
    lightbox.classList.remove('open');
});

lightbox.addEventListener('click', (e) =>
{
    if (e.target === lightbox) { lightbox.classList.remove('open'); }
});

function openLightbox(src)
{
    document.getElementById('gdLbImg').src = src;
    lightbox.classList.add('open');
}

/* ============================================================
   UTILITIES
============================================================ */
function stripHtml(html)
{
    const tmp     = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

function textToHtml(text)
{
    if (!text) { return '<p>No description available.</p>'; }
    return text.split('\n')
        .filter((l) => l.trim())
        .map((l) => `<p>${l}</p>`)
        .join('');
}

function timeAgo(timestamp)
{
    const diff    = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(diff / 3600000);
    const days    = Math.floor(diff / 86400000);

    if (minutes < 1)   { return 'JUST NOW'; }
    if (minutes < 60)  { return `${minutes}M AGO`; }
    if (hours < 24)    { return `${hours}H AGO`; }
    return `${days}D AGO`;
}

function showToast(msg)
{
    const t      = document.getElementById('customToast');
    const span   = document.getElementById('toastMessage');
    span.textContent = msg;
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); }, 3000);
}

const storeIcons =
{
    steam:              'fab fa-steam',
    'epic-games':       'fas fa-gamepad',
    'xbox-store':       'fab fa-xbox',
    xbox360:            'fab fa-xbox',
    'playstation-store':'fab fa-playstation',
    'apple-appstore':   'fab fa-apple',
    'google-play':      'fab fa-google-play',
    nintendo:           'fas fa-gamepad',
    gog:                'fas fa-compact-disc',
    itchio:             'fas fa-itch-io',
};

/* ============================================================
   SECTION TABS
============================================================ */
document.querySelectorAll('#gdSectionTabs .gd-comm-filter').forEach((btn) =>
{
    btn.addEventListener('click', () =>
    {
        document.querySelectorAll('#gdSectionTabs .gd-comm-filter').forEach((b) =>
        {
            b.classList.remove('active');
        });

        btn.classList.add('active');

        /* Hide all panels */
        document.getElementById('tabIntel').style.display     = 'none';
        document.getElementById('tabVideos').style.display    = 'none';
        document.getElementById('tabCommunity').style.display = 'none';

        /* Show the active one */
        const tab = btn.dataset.tab;
        document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';
    });
});

/* ============================================================
   MAIN FETCH
============================================================ */
async function loadGame()
{
    try
    {
        let game;

        if (gameId)
        {
            const res = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`);
            game      = await res.json();
        }
        else if (gameName)
        {
            const searchRes  = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`);
            const searchData = await searchRes.json();

            if (!searchData.results || !searchData.results.length)
            {
                throw new Error('NOT_FOUND');
            }

            const res = await fetch(`https://api.rawg.io/api/games/${searchData.results[0].id}?key=${API_KEY}`);
            game      = await res.json();
        }
        else
        {
            throw new Error('NO_PARAM');
        }

        if (game.detail === 'Not found.') { throw new Error('NOT_FOUND'); }

        currentGameId   = game.id;
        currentGameSlug = game.slug;

        renderGame(game);
        loadScreenshots(game.id);
        loadVideos(game.id, game.name);
        initCommunity(game.id);
        initVideoLinks(game.id);
        updateAvatar();
    }
    catch (err)
    {
        console.error('Game load error:', err);
        qs('#gdLoading').style.display = 'none';
        qs('#gdError').style.display   = 'flex';
    }
}

/* ============================================================
   SECTION 1 — INTEL
============================================================ */

/* -- HERO -- */
function renderHero(game)
{
    const hero    = qs('#gdHero');
    const heroImg = qs('#gdHeroImg');

    if (game.background_image)
    {
        heroImg.style.backgroundImage = `url('${game.background_image}')`;
    }

    const genres = (game.genres || []).slice(0, 2).map((g) => g.name).join(' · ').toUpperCase() || 'GAME';

    qs('#gdTitleBlock').innerHTML = `
        <p class="gd-eyebrow">// TARGET ACQUIRED — ${genres}</p>
        <h1>${game.name}</h1>
        <div class="gd-title-meta">
            ${game.rating
                ? `<div class="gd-rating-badge"><i class="fas fa-star" style="font-size:11px;margin-right:6px;"></i>${game.rating}</div>`
                : ''}
            ${game.released
                ? `<span class="gd-meta-chip"><i class="fas fa-calendar"></i>${game.released}</span>`
                : ''}
            ${game.playtime
                ? `<span class="gd-meta-chip"><i class="fas fa-clock"></i>~${game.playtime}H AVG</span>`
                : ''}
            ${game.esrb_rating
                ? `<span class="gd-meta-chip"><i class="fas fa-shield-alt"></i>${game.esrb_rating.name}</span>`
                : ''}
        </div>
    `;

    setTimeout(() => { hero.classList.add('loaded'); }, 100);
}

/* -- STATS BAR -- */
function renderStatsBar(game)
{
    const stats =
    [
        { val: game.rating || '--',                                          label: 'RATING' },
        { val: game.ratings_count ? game.ratings_count.toLocaleString() : '--', label: 'REVIEWS' },
        { val: game.added         ? game.added.toLocaleString()          : '--', label: 'IN LIBRARIES' },
        { val: game.metacritic || '--',                                      label: 'METACRITIC' },
        { val: game.playtime      ? `${game.playtime}H`                  : '--', label: 'AVG PLAYTIME' },
        { val: (game.platforms || []).length || '--',                         label: 'PLATFORMS' },
    ];

    qs('#gdStatsBar').innerHTML = stats.map((s) => `
        <div class="gd-stat">
            <span class="gd-stat-val">${s.val}</span>
            <span class="gd-stat-label">${s.label}</span>
        </div>
    `).join('');
}

/* -- DESCRIPTION -- */
function renderDescription(game)
{
    const raw             = game.description_raw || stripHtml(game.description) || '';
    qs('#gdDescription').innerHTML = textToHtml(raw);
}

/* -- RATINGS BREAKDOWN -- */
function renderRatings(game)
{
    const section = qs('#gdRatingsSection');
    const ratings = game.ratings || [];

    if (!ratings.length) { section.style.display = 'none'; return; }

    const colorMap = { exceptional: 'exceptional', recommended: 'recommended', meh: 'meh', skip: 'skip' };
    const total    = ratings.reduce((a, r) => a + r.count, 0);

    qs('#gdRatings').innerHTML = ratings.map((r) =>
    {
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

    setTimeout(() =>
    {
        qs('#gdRatings').querySelectorAll('.gd-rc-bar-fill').forEach((bar) =>
        {
            bar.style.width = bar.dataset.pct + '%';
        });
    }, 300);
}

/* -- SIDEBAR: INFO -- */
function renderInfoCard(game)
{
    const rows =
    [
        { key: 'DEVELOPER', val: (game.developers || []).map((d) => d.name).join(', ') || '--' },
        { key: 'PUBLISHER', val: (game.publishers || []).map((p) => p.name).join(', ') || '--' },
        { key: 'RELEASE',   val: game.released || '--' },
        { key: 'WEBSITE',   val: game.website
            ? `<a href="${game.website}" target="_blank" rel="noopener"
                  style="color:#e8a045;word-break:break-all;">${game.website.replace(/^https?:\/\//, '')}</a>`
            : '--' },
    ];

    qs('#gdInfoCard').innerHTML = `
        <p class="gd-info-card-title">INTEL</p>
        ${rows.map((r) => `
            <div class="gd-info-row">
                <span class="gd-info-key">${r.key}</span>
                <span class="gd-info-val">${r.val}</span>
            </div>
        `).join('')}
    `;
}

/* -- SIDEBAR: PLATFORMS -- */
function renderPlatforms(game)
{
    const platforms = game.platforms || [];
    if (!platforms.length) { qs('#gdPlatforms').style.display = 'none'; return; }

    const names = platforms.map((p) => p.platform.name);

    qs('#gdPlatforms').innerHTML = `
        <p class="gd-info-card-title">PLATFORMS</p>
        <div class="gd-chip-wrap">
            ${names.map((n) => `<span class="gd-chip">${n}</span>`).join('')}
        </div>
    `;
}

/* -- SIDEBAR: GENRES / TAGS -- */
function renderTags(game)
{
    const genres = (game.genres || []).map((g) => g.name);
    const tags   = (game.tags   || []).slice(0, 10).map((t) => t.name);

    if (!genres.length && !tags.length) { qs('#gdTags').style.display = 'none'; return; }

    qs('#gdTags').innerHTML = `
        <p class="gd-info-card-title">GENRES & TAGS</p>
        <div class="gd-chip-wrap">
            ${genres.map((g) => `<span class="gd-chip" style="border-color:rgba(106,170,112,0.25);color:rgba(106,170,112,0.85);">${g}</span>`).join('')}
            ${tags.map((t)   => `<span class="gd-chip">${t}</span>`).join('')}
        </div>
    `;
}

/* -- SIDEBAR: STORES -- */
function renderStores(game)
{
    const stores = game.stores || [];
    if (!stores.length) { qs('#gdStores').style.display = 'none'; return; }

    qs('#gdStores').innerHTML = `
        <p class="gd-info-card-title">WHERE TO BUY</p>
        ${stores.map((s) =>
        {
            const slug = s.store.slug;
            const icon = storeIcons[slug] || 'fas fa-shopping-cart';
            return `
                <a class="gd-store-link"
                   href="https://www.rawg.io/games/${game.slug}"
                   target="_blank" rel="noopener">
                    <i class="${icon}"></i> ${s.store.name.toUpperCase()}
                    <i class="fas fa-external-link-alt" style="margin-left:auto;font-size:7px;opacity:0.4;"></i>
                </a>
            `;
        }).join('')}
    `;
}

/* -- SCREENSHOTS -- */
async function loadScreenshots(id)
{
    try
    {
        const res    = await fetch(`https://api.rawg.io/api/games/${id}/screenshots?key=${API_KEY}`);
        const data   = await res.json();
        const shots  = data.results || [];
        const section = qs('#gdScreenshotsSection');

        if (!shots.length) { section.style.display = 'none'; return; }

        qs('#gdScreenshots').innerHTML = shots.slice(0, 9).map((s) => `
            <div class="gd-screenshot">
                <img src="${s.image}" alt="Screenshot" loading="lazy">
            </div>
        `).join('');

        qs('#gdScreenshots').querySelectorAll('.gd-screenshot').forEach((card) =>
        {
            const img = card.querySelector('img');
            card.addEventListener('click', () => { openLightbox(img.src); });
        });
    }
    catch (err)
    {
        console.error('Screenshots error:', err);
        qs('#gdScreenshotsSection').style.display = 'none';
    }
}

/* -- MASTER RENDER -- */
function renderGame(game)
{
    renderHero(game);
    renderStatsBar(game);
    renderDescription(game);
    renderRatings(game);
    renderInfoCard(game);
    renderPlatforms(game);
    renderTags(game);
    renderStores(game);

    document.title = `${game.name} — BASE82`;

    qs('#gdLoading').style.display = 'none';
    qs('#gdContent').style.display  = 'block';
}

/* ============================================================
   SECTION 2 — VIDEOS
============================================================ */

/* Fetch clips from RAWG and render video cards */
async function loadVideos(id, gameName)
{
    const grid = qs('#gdVideosGrid');

    try
    {
        const res  = await fetch(`https://api.rawg.io/api/games/${id}/movies?key=${API_KEY}`);
        const data = await res.json();
        const clips = data.results || [];

        if (!clips.length)
        {
            /* Fallback: show a YouTube search card */
            grid.innerHTML = buildYouTubeSearchCard(gameName);
            return;
        }

        grid.innerHTML = clips.slice(0, 6).map((clip) =>
        {
            const thumb = clip.preview || '';
            const low   = (clip.data && clip.data['480']) || clip.data?.max || '';

            return `
                <div class="gd-video-card">
                    <div class="gd-video-thumb" data-src="${low}" data-thumb="${thumb}">
                        <img src="${thumb}" alt="${clip.name}" loading="lazy">
                        <div class="gd-video-play">
                            <div class="gd-video-play-btn">
                                <i class="fas fa-play" style="margin-left:3px;"></i>
                            </div>
                        </div>
                    </div>
                    <div class="gd-video-info">
                        <div class="gd-video-title">${clip.name}</div>
                        <div class="gd-video-meta">RAWG CLIP</div>
                    </div>
                </div>
            `;
        }).join('');

        /* Attach click events to open video */
        grid.querySelectorAll('.gd-video-thumb').forEach((thumb) =>
        {
            thumb.addEventListener('click', () =>
            {
                const src = thumb.dataset.src;
                if (src) { openVideoPlayer(src, thumb); }
            });
        });

        /* Also add a YouTube search link at the end */
        const extra = document.createElement('div');
        extra.innerHTML = buildYouTubeSearchCard(gameName);
        grid.appendChild(extra.firstElementChild);
    }
    catch (err)
    {
        console.error('Videos error:', err);
        grid.innerHTML = buildYouTubeSearchCard(gameName);
    }
}

function buildYouTubeSearchCard(name)
{
    const q = encodeURIComponent(name + ' gameplay trailer');
    return `
        <a class="gd-video-card"
           href="https://www.youtube.com/results?search_query=${q}"
           target="_blank" rel="noopener"
           style="text-decoration:none;display:block;">
            <div class="gd-video-thumb" style="background:#0d0f12;">
                <img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
                     alt="Search YouTube"
                     style="opacity:0.2;filter:grayscale(1)!important;">
                <div class="gd-video-play">
                    <div class="gd-video-play-btn" style="background:rgba(255,80,80,0.85);">
                        <i class="fab fa-youtube" style="font-size:20px;margin-left:0;"></i>
                    </div>
                </div>
            </div>
            <div class="gd-video-info">
                <div class="gd-video-title">SEARCH ON YOUTUBE</div>
                <div class="gd-video-meta">FIND TRAILERS &amp; REVIEWS</div>
            </div>
        </a>
    `;
}

/* Inline video player overlay inside the thumb */
function openVideoPlayer(src, thumbEl)
{
    const video        = document.createElement('video');
    video.src          = src;
    video.controls     = true;
    video.autoplay     = true;
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;z-index:10;background:#0d0f12;';
    thumbEl.appendChild(video);

    /* Remove on click outside */
    video.addEventListener('click', (e) => { e.stopPropagation(); });
}

/* ---- Manual Links Manager ---- */
function initVideoLinks(gameId)
{
    const storageKey = `base82_links_${gameId}`;
    manualLinks      = JSON.parse(localStorage.getItem(storageKey) || '[]');
    renderManualLinks(storageKey);

    document.getElementById('gdAddLinkBtn').addEventListener('click', () =>
    {
        const url   = document.getElementById('gdLinkInput').value.trim();
        const label = document.getElementById('gdLinkLabel').value.trim() || 'LINK';

        if (!url) { showToast('Paste a valid URL first.'); return; }

        manualLinks.push({ url, label, id: Date.now() });
        localStorage.setItem(storageKey, JSON.stringify(manualLinks));
        renderManualLinks(storageKey);

        document.getElementById('gdLinkInput').value  = '';
        document.getElementById('gdLinkLabel').value  = '';
    });
}

function renderManualLinks(storageKey)
{
    const container = document.getElementById('gdManualLinks');

    if (!manualLinks.length)
    {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = manualLinks.map((link) =>
    {
        const isYT = link.url.includes('youtube') || link.url.includes('youtu.be');
        const icon = isYT ? 'fab fa-youtube' : 'fas fa-external-link-alt';

        return `
            <a class="gd-manual-link-item"
               href="${link.url}"
               target="_blank" rel="noopener"
               data-id="${link.id}">
                <i class="${icon}"></i>
                <span>${link.label}</span>
                <span style="font-family:'Space Mono',monospace;font-size:8px;color:#4a5568;margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;">
                    ${link.url}
                </span>
                <button class="gd-link-delete" data-id="${link.id}" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </a>
        `;
    }).join('');

    /* Delete handlers */
    container.querySelectorAll('.gd-link-delete').forEach((btn) =>
    {
        btn.addEventListener('click', (e) =>
        {
            e.preventDefault();
            e.stopPropagation();

            const id   = parseInt(btn.dataset.id, 10);
            manualLinks = manualLinks.filter((l) => l.id !== id);
            localStorage.setItem(storageKey, JSON.stringify(manualLinks));
            renderManualLinks(storageKey);
        });
    });
}

/* ============================================================
   SECTION 3 — COMMUNITY
============================================================ */
function initCommunity(gameId)
{
    const storageKey = `base82_posts_${gameId}`;
    postsData        = JSON.parse(localStorage.getItem(storageKey) || '[]');

    renderPosts(storageKey);

    /* Character counter */
    const textarea   = document.getElementById('gdPostInput');
    const charCount  = document.getElementById('gdPostChar');

    textarea.addEventListener('input', () =>
    {
        charCount.textContent = `${textarea.value.length} / 500`;
    });

    /* Submit post */
    document.getElementById('gdSubmitPost').addEventListener('click', () =>
    {
        const text = textarea.value.trim();

        if (!text) { showToast('Write something first.'); return; }
        if (text.length > 500) { showToast('Post too long — 500 char max.'); return; }

        const playerName = localStorage.getItem('playerName') || 'GUEST';

        const post =
        {
            id:        Date.now(),
            author:    playerName.toUpperCase(),
            body:      text,
            timestamp: Date.now(),
            likes:     0,
            likedBy:   [],
        };

        postsData.unshift(post);
        localStorage.setItem(storageKey, JSON.stringify(postsData));

        textarea.value        = '';
        charCount.textContent = '0 / 500';

        renderPosts(storageKey);
        showToast('Post submitted.');
    });

    /* Sort filter */
    document.querySelectorAll('[data-sort]').forEach((btn) =>
    {
        btn.addEventListener('click', () =>
        {
            document.querySelectorAll('[data-sort]').forEach((b) => { b.classList.remove('active'); });
            btn.classList.add('active');
            postSort = btn.dataset.sort;
            renderPosts(storageKey);
        });
    });
}

function renderPosts(storageKey)
{
    const list = document.getElementById('gdPostsList');

    if (!postsData.length)
    {
        list.innerHTML = `
            <div class="gd-no-posts">
                <i class="fas fa-comments" style="display:block;font-size:28px;margin-bottom:12px;opacity:0.3;"></i>
                BE THE FIRST TO COMMENT
            </div>
        `;
        return;
    }

    /* Sort */
    const sorted = [...postsData].sort((a, b) =>
    {
        if (postSort === 'popular') { return b.likes - a.likes; }
        return b.timestamp - a.timestamp;
    });

    const myId    = localStorage.getItem('playerName') || 'GUEST';
    const avatarChar = myId.charAt(0).toUpperCase();

    list.innerHTML = sorted.map((post) =>
    {
        const liked = post.likedBy && post.likedBy.includes(myId);

        return `
            <div class="gd-post" data-id="${post.id}">
                <div class="gd-post-header">
                    <div class="gd-avatar" style="font-size:11px;">${post.author.charAt(0)}</div>
                    <div class="gd-post-info">
                        <div class="gd-post-author">${post.author}</div>
                        <div class="gd-post-time">${timeAgo(post.timestamp)}</div>
                    </div>
                </div>
                <div class="gd-post-body">${escapeHtml(post.body)}</div>
                <div class="gd-post-actions">
                    <button class="gd-post-action ${liked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
                        <i class="${liked ? 'fas' : 'far'} fa-heart"></i>
                        ${post.likes}
                    </button>
                    <button class="gd-post-action" data-action="reply" data-author="${post.author}">
                        <i class="fas fa-reply"></i> REPLY
                    </button>
                    ${post.author === myId.toUpperCase()
                        ? `<button class="gd-post-action" data-action="delete" data-id="${post.id}" style="color:#9a6060;">
                               <i class="fas fa-trash"></i> DELETE
                           </button>`
                        : ''}
                </div>
            </div>
        `;
    }).join('');

    /* Attach post action handlers */
    list.querySelectorAll('[data-action]').forEach((btn) =>
    {
        btn.addEventListener('click', () =>
        {
            handlePostAction(btn.dataset.action, btn.dataset.id, btn.dataset.author, storageKey);
        });
    });
}

function handlePostAction(action, postId, author, storageKey)
{
    const id   = parseInt(postId, 10);
    const myId = localStorage.getItem('playerName') || 'GUEST';

    if (action === 'like')
    {
        const post = postsData.find((p) => p.id === id);
        if (!post) { return; }

        if (!post.likedBy) { post.likedBy = []; }

        if (post.likedBy.includes(myId))
        {
            post.likedBy = post.likedBy.filter((u) => u !== myId);
            post.likes   = Math.max(0, post.likes - 1);
        }
        else
        {
            post.likedBy.push(myId);
            post.likes += 1;
        }

        localStorage.setItem(storageKey, JSON.stringify(postsData));
        renderPosts(storageKey);
    }
    else if (action === 'reply')
    {
        const textarea     = document.getElementById('gdPostInput');
        textarea.value     = `@${author} `;
        textarea.focus();

        /* Scroll to compose area */
        document.querySelector('.gd-new-post').scrollIntoView({ behavior: 'smooth', block: 'center' });

        /* Update char count */
        document.getElementById('gdPostChar').textContent = `${textarea.value.length} / 500`;
    }
    else if (action === 'delete')
    {
        postsData = postsData.filter((p) => p.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(postsData));
        renderPosts(storageKey);
        showToast('Post deleted.');
    }
}

function updateAvatar()
{
    const name = localStorage.getItem('playerName') || 'G';
    const avEl = document.getElementById('communityAvatar');
    if (avEl) { avEl.textContent = name.charAt(0).toUpperCase(); }
}

function escapeHtml(str)
{
    return str
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;')
        .replace(/\n/g, '<br>');
}

/* ============================================================
   KICK OFF
============================================================ */
loadGame();
