const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginStatus = document.getElementById('login-status');


loginBtn?.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        loginStatus.textContent = 'Completa usuario y contraseña';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/proxy/access/login', {
            method: 'POST',
            credentials: "include",     // 👈 OBLIGATORIO PARA COOKIES
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        // Si backend devolvió error
        if (res.status >= 300) {
            loginStatus.textContent = 'Credenciales incorrectas';
            return;
        }

        const data = await res.json();

        // Si proxy detectó token válido y no re-hizo login
        if (data.alreadyAuthenticated) {
            loginStatus.textContent = 'Ya estabas autenticado';
        } else {
            loginStatus.textContent = 'Login exitoso';
        }

        document.getElementById('login-section').hidden = true;
        document.getElementById('player-section').hidden = false;
        document.getElementById('logout-btn').hidden = false;

        loadSongs(); // función del app.js
        loadProfileButton();

    } catch (err) {
        console.error(err);
        loginStatus.textContent = 'Error en login';
    }
});

async function checkSession() {
    try {
        const res = await fetch('http://localhost:8080/api/verified', {
            method: 'POST',
            credentials: 'include'
        });

        console.log(`pruebaa: ${res.status}`);

        if (res.status == 200) {
            document.getElementById('login-section').hidden = true;
            document.getElementById('player-section').hidden = false;
            document.getElementById('logout-btn').hidden = false;
            loadSongs();
            loadProfileButton();
        }
    } catch (err) {
        console.error("Error verificando sesión:", err);
    }
}

const profileBtn = document.getElementById('profile-btn');

// Obtener idUsuario de la cookie
const userId = document.cookie
    .split('; ')
    .find(row => row.startsWith('idUsuario='))
    ?.split('=')[1];

async function loadProfileButton() {
    if (!userId || !profileBtn) return;

    try {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('No se pudo obtener usuario');

        const data = await response.json();
        const name = data.name || data.username || 'Usuario';

        profileBtn.textContent = `Hola, ${name}`;
        profileBtn.hidden = false;

        // Redirigir a update.html al hacer clic
        profileBtn.addEventListener('click', () => {
            window.location.href = 'update.html';
        });
    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

checkSession();





