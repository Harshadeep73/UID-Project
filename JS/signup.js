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
    const passInput  = document.getElementById('password');
    const toggleBtn1 = document.getElementById('togglePassword1');

    if (toggleBtn1 && passInput) {
        toggleBtn1.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            toggleBtn1.textContent = type === 'password' ? 'SHOW' : 'HIDE';
        });
    }

    // ── SIGN UP BUTTON ──
    const signupBtn = document.getElementById('signupBtn');

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            const username        = document.getElementById("username").value.trim();
            const email           = document.getElementById("email").value.trim();
            const password        = document.getElementById("password").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();
            const termsBox        = document.getElementById("termsBox").checked;

            if (!username || !email || !password || !confirmPassword) {
                showToast("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                showToast("Passwords do not match. Try again.");
                return;
            }

            if (!termsBox) {
                showToast("You must agree to the Terms & Conditions.");
                return;
            }

            // Button state change
            signupBtn.classList.add('success');
            signupBtn.textContent = "GO CLUTCH !";

            // Store session in localStorage
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("playerName", username);

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
