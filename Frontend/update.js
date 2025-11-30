// CONFIGURACIÓN: Apunta a tu proxy (server.js)
const API_URL = 'http://localhost:3000/api/users';

const form = document.getElementById('profileForm');
const messageBox = document.getElementById('messageBox');

// --- GESTIÓN DE DATOS DE SESIÓN ---
function getSessionData() {
    return {
        token: localStorage.getItem('token'),
        // IMPORTANTE: Asumimos que guardaste el ID al hacer login
        userId: localStorage.getItem('userId')
    };
}

function getHeaders() {
    const { token } = getSessionData();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// --- UTILIDADES ---
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');
    // Ocultar mensaje a los 5 segundos
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
}

// --- 1. CARGAR DATOS AUTOMÁTICAMENTE (GET) ---
// Se ejecuta en cuanto el HTML termina de cargar
document.addEventListener('DOMContentLoaded', async () => {
    const { userId, token } = getSessionData();

    if (!token || !userId) {
        showMessage('No se encontró sesión activa. Por favor inicia sesión.', 'error');
        console.warn('Falta token o userId en localStorage');
        return;
    }

    try {
        // GET /api/users/{id}
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar perfil');

        const data = await response.json(); // Mapeo a UserProfileDTO

        // Rellenar formulario
        document.getElementById('username').value = data.username || '';
        document.getElementById('name').value = data.name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('personalLink').value = data.personalLink || '';
        document.getElementById('bio').value = data.bio || '';

        // Formatear fecha para input date (YYYY-MM-DD)
        if (data.birthday) {
            const date = new Date(data.birthday);
            document.getElementById('birthday').value = date.toISOString().split('T')[0];
        }

    } catch (error) {
        console.error(error);
        showMessage('Error cargando datos: ' + error.message, 'error');
    }
});

// --- 2. GUARDAR DATOS (PUT) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { userId } = getSessionData();
    if (!userId) return showMessage('Error de sesión: ID no encontrado', 'error');

    // Construir objeto UserProfileDTO
    const updatedUser = {
        id: parseInt(userId),
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        personalLink: document.getElementById('personalLink').value,
        bio: document.getElementById('bio').value,
        // Convertir a ISO String para Java Date
        birthday: document.getElementById('birthday').value
            ? new Date(document.getElementById('birthday').value).toISOString()
            : null
    };

    try {
        // PUT /api/users/{id}
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            showMessage('Perfil actualizado con éxito.', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar');
        }

    } catch (error) {
        console.error(error);
        showMessage('Error: ' + error.message, 'error');
    }
});