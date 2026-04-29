
const user = localStorage.getItem("user");

if (!user) {
    window.location.href = "login.html";
}



document.body.classList.add('loaded');
