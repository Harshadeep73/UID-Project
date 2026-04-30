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
    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                showToast("Please fill in all fields");
                return;
            }

            // ── LOADING STATE ──
            loginBtn.textContent = "Logging in...";
            loginBtn.disabled = true;

            try {
                const res = await fetch("https://uid-project-production.up.railway.app/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.text();

                if (data === "LOGIN_SUCCESS") {
                    localStorage.setItem("loggedIn", "true");
                    window.location.href = "home.html";
                } else {
                    showToast("Invalid email or password");
                }

            } catch (err) {
                console.error(err);
                showToast("Cannot connect to server");
            }

            //Reset button
            loginBtn.textContent = "GAME ON";
            loginBtn.disabled = false;
        });
    }

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
});