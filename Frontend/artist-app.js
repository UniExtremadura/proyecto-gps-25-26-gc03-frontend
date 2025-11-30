const API_ARTIST_URL = 'http://localhost:3000/api/artists';

// ENUMS definidos en JSON Usuarios.txt
const GENRE_TYPES = [
    "HIP_HOP", "RAP", "TRAP", "RNB", "POP", "ROCK", "ALTERNATIVE_ROCK",
    "HARD_ROCK", "PUNK_ROCK", "METAL", "HEAVY_METAL", "THRASH_METAL", "INDIE",
    "INDIE_ROCK", "INDIE_POP", "ELECTRONIC", "EDM", "HOUSE", "TECHNO", "TRANCE",
    "DUBSTEP", "DRUM_AND_BASS", "JAZZ", "BLUES", "FUNK", "SOUL", "CLASSICAL",
    "REGGAE", "REGGAETON", "SALSA", "BACHATA", "CUMBIA", "FLAMENCO", "FOLK",
    "COUNTRY", "LATIN", "AFROBEAT", "K_POP", "J_POP", "LOFI", "AMBIENT",
    "EXPERIMENTAL", "INSTRUMENTAL", "ACOUSTIC", "SOUNDTRACK", "GOSPEL", "OPERA",
    "DANCEHALL", "DISCO", "GRIME", "DRILL", "PHONK", "CHILLWAVE", "SYNTHWAVE", "NEW_WAVE"
];

const SOCIAL_TYPES = [
    "INSTAGRAM", "SPOTIFY", "FACEBOOK", "GITHUB", "YOUTUBE", "SOUNDCLOUD", "CUENTA_UNEX"
];

const form = document.getElementById('artistForm');
const messageBox = document.getElementById('messageBox');
const genresSelect = document.getElementById('genres');
const socialContainer = document.getElementById('socialMediaContainer');
const addLinkBtn = document.getElementById('addLinkBtn');

// --- INICIALIZACIÓN ---
// 1. Rellenar el Select de Géneros
GENRE_TYPES.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    // Formato legible: "HIP_HOP" -> "Hip Hop"
    option.textContent = genre.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    genresSelect.appendChild(option);
});

// 2. Evento para añadir nueva fila de red social vacía
addLinkBtn.addEventListener('click', () => addSocialRow());

// --- FUNCIONES AUXILIARES ---

function getSessionData() {
    return {
        token: localStorage.getItem('token'),
        userId: localStorage.getItem('userId')
    };
}

function getHeaders() {
    const { token } = getSessionData();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
}

// Función para crear una fila visual de Red Social
function addSocialRow(type = "INSTAGRAM", link = "") {
    const row = document.createElement('div');
    row.className = 'social-row';

    // Selector de Tipo
    const select = document.createElement('select');
    select.className = 'social-select';
    SOCIAL_TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if(t === type) opt.selected = true;
        select.appendChild(opt);
    });

    // Input de Link
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'social-input'; // Reutiliza estilo de input normal
    input.value = link;
    input.placeholder = 'https://...';
    input.required = true;

    // Botón Eliminar
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = () => row.remove();

    row.appendChild(select);
    row.appendChild(input);
    row.appendChild(removeBtn);
    socialContainer.appendChild(row);
}

// --- LÓGICA PRINCIPAL ---

// 1. CARGAR DATOS (GET)
document.addEventListener('DOMContentLoaded', async () => {
    const { userId, token } = getSessionData();

    if (!token || !userId) {
        showMessage('Sesión no iniciada.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_ARTIST_URL}/${userId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar perfil');

        const data = await response.json();

        // Datos básicos
        document.getElementById('username').value = data.username || '';
        document.getElementById('artisticName').value = data.artisticName || '';
        document.getElementById('description').value = data.description || '';
        if(data.iban) document.getElementById('iban').value = data.iban;
        if(data.accountPropietary) document.getElementById('accountPropietary').value = data.accountPropietary;

        // Cargar GÉNEROS (Seleccionar opciones en el select multiple)
        if (data.genres && Array.isArray(data.genres)) {
            Array.from(genresSelect.options).forEach(opt => {
                if (data.genres.includes(opt.value)) {
                    opt.selected = true;
                }
            });
        }

        // Cargar REDES SOCIALES (Crear filas)
        socialContainer.innerHTML = ''; // Limpiar
        if (data.socialMediaLinks && Array.isArray(data.socialMediaLinks)) {
            data.socialMediaLinks.forEach(item => {
                // item tiene { type: "...", link: "..." }
                addSocialRow(item.type, item.link);
            });
        }

    } catch (error) {
        console.error(error);
        showMessage('Cargando formulario vacío...', 'success');
    }
});

// 2. ACTUALIZAR (PUT)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { userId } = getSessionData();

    // 1. Recoger Géneros seleccionados
    const selectedGenres = Array.from(genresSelect.selectedOptions).map(opt => opt.value);

    // 2. Recoger Redes Sociales del DOM
    const socialLinksData = [];
    const rows = socialContainer.querySelectorAll('.social-row');
    rows.forEach(row => {
        const type = row.querySelector('select').value;
        const link = row.querySelector('input').value;
        if (link) {
            socialLinksData.push({ type, link });
        }
    });

    genresSelect.addEventListener('mousedown', (e) => {
        // 1. Evitamos que el navegador haga su selección estándar (que borraría las otras)
        e.preventDefault();

        const option = e.target;

        // 2. Verificamos que hayamos hecho clic en una <option>
        if (option.tagName === 'OPTION') {
            // 3. Invertimos el estado: si estaba true pasa a false, y viceversa
            option.selected = !option.selected;

            // 4. Truco para forzar al navegador a refrescar visualmente el select
            // (Necesario en Chrome/Edge para que se vea el cambio de color al instante)
            const scrollTop = genresSelect.scrollTop;
            genresSelect.style.display = 'none';
            genresSelect.offsetHeight; // Forzar "reflow"
            genresSelect.style.display = 'block';
            genresSelect.scrollTop = scrollTop;
        }
    });

    // 3. Construir ReceivedArtistDTO
    const updatedArtist = {
        username: document.getElementById('username').value || "unknown",
        artisticName: document.getElementById('artisticName').value,
        description: document.getElementById('description').value,
        iban: document.getElementById('iban').value,
        accountPropietary: document.getElementById('accountPropietary').value,
        verified: false, // Default
        trending: false, // Default

        // NUEVOS CAMPOS COMPLETOS
        genres: selectedGenres,       // Set<GenreType>
        socialMediaLinks: socialLinksData // List<SocialMediaLinks>
    };

    try {
        const response = await fetch(`${API_ARTIST_URL}/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updatedArtist)
        });

        if (response.ok) {
            showMessage('Perfil actualizado con géneros y redes.', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar');
        }
    } catch (error) {
        console.error(error);
        showMessage('Error: ' + error.message, 'error');
    }
});