// CONFIGURACIÓN: apunta a tu proxy de canciones
const API_URL = 'http://localhost:8080/api/users'; // GET y PUT /songs/{id}

// Elementos
const form = document.getElementById('profileForm');
const messageBox = document.getElementById('messageBox');
const btnGreen = document.getElementById('btn-green');
const artistCheckbox = document.getElementById('artistToggle');

// --- UTILIDADES ---
function showMessage(text, type) {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
    console.log(`[showMessage] ${type}: ${text}`);
}

// --- BOTÓN VERDE ---
if (btnGreen) {
    btnGreen.addEventListener('click', () => {
        console.log('[btnGreen] Redirigiendo a index.html');
        window.location.href = 'index.html';
    });
}

// --- 1. ID del usuario / canción ---
const userId = document.cookie
    .split('; ')
    .find(row => row.startsWith('idUsuario='))
    ?.split('=')[1];

let isArtist = document.cookie
    .split('; ')
    .find(row => row.startsWith('isArtist='))
    ?.split('=')[1];

console.log('[Init] idUsuario:', userId, '| isArtist:', isArtist);


// --- NUEVO: LÓGICA DEL CHECKBOX DE ARTISTA ---
if (artistCheckbox) {
    // A. Estado inicial: Si la cookie es 'true', marcamos el checkbox
    if (isArtist === 'true') {
        artistCheckbox.checked = true;
    } else {
        artistCheckbox.checked = false;
    }

    // B. Escuchar cambios (Click en el checkbox)
    artistCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;

        // Actualizamos la cookie (path=/ para que valga en toda la web)
        document.cookie = `isArtist=${isChecked}; path=/; max-age=31536000`;

        // Actualizamos la variable local también
        isArtist = String(isChecked);

        console.log(`[Checkbox] Cookie 'isArtist' actualizada a: ${isChecked}`);
        showMessage(`Modo artista: ${isChecked ? 'ACTIVADO' : 'DESACTIVADO'}`, 'success');
    });
}

// --- 2. CARGAR DATOS DEL PERFIL (GET /songs/{id}) ---
async function loadProfileData() {
    if (!userId) {
        showMessage('No se encontró ID en la cookie.', 'error');
        return;
    }

    try {
        console.log('[loadProfileData] Haciendo GET a:', `${API_URL}/${userId}`);
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        console.log('[loadProfileData] GET status:', response.status);

        if (!response.ok) throw new Error('Error al cargar datos');

        const data = await response.json();
        console.log('[loadProfileData] Datos recibidos:', data);

        // Rellenar formulario
        document.getElementById('username').value = data.username || '';
        document.getElementById('name').value = data.name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('personalLink').value = data.personalLink || '';
        document.getElementById('bio').value = data.bio || '';

        if (data.birthday) {
            document.getElementById('birthday').value =
                new Date(data.birthday).toISOString().split('T')[0];
        }

    } catch (err) {
        console.error('[loadProfileData] Error cargando perfil:', err);
        showMessage('Error cargando perfil: ' + err.message, 'error');
    }
}

// --- 3. GUARDAR DATOS DEL PERFIL (PUT /songs/{id}) ---
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userId) {
            showMessage('No se encontró ID en la cookie.', 'error');
            return;
        }

        const updatedData = {
            id: userId,
            username: document.getElementById('username').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            personalLink: document.getElementById('personalLink').value,
            bio: document.getElementById('bio').value,
            birthday: document.getElementById('birthday').value
                ? new Date(document.getElementById('birthday').value).toISOString()
                : null
        };

        console.log('[form] Datos a enviar:', updatedData);

        try {
            const response = await fetch(`http://localhost:3000/proxy/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(updatedData)
            });

            console.log(response.status);
            console.log(await response.text());
            console.log('[form] PUT status:', response.status);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[form] Error PUT:', errData);
                throw new Error(errData.message || 'Error al actualizar perfil');
            }

            console.log('[form] Perfil actualizado correctamente');
            showMessage('Perfil actualizado con éxito', 'success');

        } catch (err) {
            console.error('[form] Error al actualizar perfil:', err);
            showMessage('Error: ' + err.message, 'error');
        }
    });
}

// --- 4. Ejecutar carga automáticamente ---
loadProfileData();