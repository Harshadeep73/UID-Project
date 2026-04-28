document.body.classList.add('loaded');

const showToast = (msg) => {
    const t = document.getElementById('customToast');
    t.querySelector('#toastMessage').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
};

document.getElementById('submitBtn').addEventListener('click', () => {
    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const msg   = document.getElementById('cf-message').value.trim();

    if (!name || !email || !msg) {
        showToast('Fill in all required fields.');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.classList.add('sending');
    btn.innerHTML = '<i class="fas fa-check"></i> TRANSMISSION SENT';

    setTimeout(() => {
        btn.classList.remove('sending');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> SEND TRANSMISSION';
        showToast("Message received. We'll be in touch.");
    }, 2500);
});
