document.body.classList.add('loaded');

const API_KEY = "bc866a3dcd8943a5b813991d52d57209";

const grid        = document.getElementById('exploreGrid');
const countEl     = document.getElementById('resultsCount');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const clearBtn    = document.getElementById('clearBtn');

let currentPage   = 1;
let currentOrder  = '-added';
let currentSearch = '';

/* ======================
   SKELETONS
====================== */
function showSkeletons(n = 12) {
    grid.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const sk      = document.createElement('div');
        sk.className  = 'skeleton';
        grid.appendChild(sk);
    }
}

/* ======================
   URL BUILDER
====================== */
function buildUrl() {
    let url = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&page=${currentPage}&ordering=${currentOrder}`;
    if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
    return url;
}

/* ======================
   RENDER CARD
   → Clicking navigates to GameDetails.html?id=<id>
====================== */
function renderCard(game) {
    const card      = document.createElement('div');
    card.className  = 'game-card';
    card.style.animationDelay = `${Math.random() * 0.3}s`;
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View details for ${game.name}`);

    card.innerHTML  = `
        <img class="game-card-img"
             src="${game.background_image || ''}"
             alt="${game.name}"
             loading="lazy"
             onerror="this.style.display='none'">
        <div class="game-card-body">
            <div class="game-card-name">${game.name}</div>
            <div class="game-card-meta">
                <span class="game-card-rating"><i class="fas fa-star"></i> ${game.rating || '--'}</span>
                <span class="game-card-date">${game.released ? game.released.slice(0, 4) : '--'}</span>
            </div>
        </div>
        <div class="game-card-hover-hint"><i class="fas fa-crosshairs"></i> VIEW INTEL</div>
    `;

    /* Navigate to detail page */
    card.addEventListener('click', () => {
        window.location.href = `GameDetails.html?id=${game.id}`;
    });

    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = `GameDetails.html?id=${game.id}`;
        }
    });

    return card;
}

/* ======================
   FETCH GAMES
====================== */
async function fetchGames(append = false) {
    if (!append) showSkeletons();
    try {
        const res  = await fetch(buildUrl());
        const data = await res.json();

        if (!append) grid.innerHTML = '';
        data.results.forEach(g => grid.appendChild(renderCard(g)));

        const shown = grid.querySelectorAll('.game-card').length;
        countEl.innerHTML = `SHOWING <span>${shown}</span> OF <span>${(data.count || 0).toLocaleString()}</span> TARGETS`;
        loadMoreBtn.style.display = data.next ? 'block' : 'none';
    } catch (e) {
        countEl.textContent = 'ERROR LOADING DATA';
        console.error('Fetch error:', e);
    }
}

/* ======================
   FILTER CHIPS
====================== */
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        currentOrder = chip.dataset.order;
        currentPage  = 1;
        fetchGames();
    });
});

/* ======================
   LOAD MORE
====================== */
loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    loadMoreBtn.textContent = 'LOADING...';
    loadMoreBtn.disabled    = true;
    fetchGames(true).then(() => {
        loadMoreBtn.textContent = 'LOAD MORE TARGETS';
        loadMoreBtn.disabled    = false;
    });
});

/* ======================
   SEARCH
====================== */
let searchTimer;

searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentSearch = searchInput.value.trim();
        currentPage   = 1;
        fetchGames();
    }, 500);
});

clearBtn.addEventListener('click', () => {
    searchInput.value      = '';
    clearBtn.style.display = 'none';
    currentSearch          = '';
    currentPage            = 1;
    fetchGames();
});

/* ======================
   CHECK FOR ?q= PARAM
====================== */
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('q')) {
    searchInput.value      = urlParams.get('q');
    clearBtn.style.display = 'block';
    currentSearch          = urlParams.get('q');
}

fetchGames();
