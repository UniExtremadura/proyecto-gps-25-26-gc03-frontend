const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginStatus = document.getElementById('login-status');

loginBtn?.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if(!username || !password) {
        loginStatus.textContent = 'Completa usuario y contraseña';
        return;
    }

    try {
        // Petición al API Gateway de login
        console.log(JSON.stringify({ username, password }));
        
        const res = await fetch('http://localhost:3000/api/access/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'  // opcional, pero recomendable
            }
        });

        console.log(res.value);
        
        //if(!(res.value < )) throw new Error('Credenciales incorrectas');

        const data = await res.json();
        const token = data.token;
        localStorage.setItem('auth_token', token);

        loginStatus.textContent = 'Login exitoso';
        document.getElementById('login-section').hidden = true;
        document.getElementById('player-section').hidden = false;

        // Cargar canciones
        loadSongs(); // función del app.js
    } catch(err) {
        console.error(err);
        loginStatus.textContent = 'Error en login';
    }
});
