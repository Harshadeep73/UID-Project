
const user = localStorage.getItem("PlayerName");

if (!user) {
    window.location.href = "login.html";
}



document.body.classList.add('loaded');
