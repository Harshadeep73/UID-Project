document.addEventListener("DOMContentLoaded", () => {
    const body   = document.body;
    const lanes  = document.querySelectorAll(".lane");
    const tracks = document.querySelectorAll(".track");

    // ── BACKGROUND FADE IN & SCROLL ──
    body.style.transition = "opacity 0.6s ease";
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { body.style.opacity = "1"; });
    });

    setTimeout(() => {
        lanes.forEach(l  => l.classList.add("visible"));
        tracks.forEach(t => t.classList.add("running"));
    }, 100);

    // ── PASSWORD VISIBILITY TOGGLE ──
    const passInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');

    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            toggleBtn.textContent = type === 'password' ? 'SHOW' : 'HIDE';
        });
    }

    // ── GAME ON BUTTON ──
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email    = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                showToast("Please fill in both email and password.");
                return;
            }

            // Button state change
            loginBtn.classList.add('success');
            loginBtn.textContent = "GO CLUTCH !";

            // Store session in localStorage
            localStorage.setItem("loggedIn", "true");
            const tempName = email.split('@')[0];
            localStorage.setItem("playerName", tempName);

            // Redirect to home — same HTML/ folder
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1200);
        });
    }
});

// ── CUSTOM TOAST LOGIC ──
window.showToast = function (message) {
    const toast    = document.getElementById('customToast');
    const toastMsg = document.getElementById('toastMessage');

    if (toast && toastMsg) {
        toastMsg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// ── SITE LOADER ──
window.addEventListener("load", () => {
    const loader = document.getElementById("siteLoader");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("hide");
        }, 2500);
    }
});
