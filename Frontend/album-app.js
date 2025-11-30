// CONFIGURACIÓN: API Gateway
const API_BASE_URL = 'http://localhost:8080';

// Enum de Géneros (Misma lista para consistencia)
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

const form = document.getElementById('albumForm');
const messageBox = document.getElementById('messageBox');
const genreSelect = document.getElementById('albumGenre');
const participantsContainer = document.getElementById('participantsContainer');
const addParticipantBtn = document.getElementById('addParticipantBtn');

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Rellenar Select de Géneros
    GENRE_TYPES.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        genreSelect.appendChild(option);
    });

    // 2. Configurar botón de añadir participante
    addParticipantBtn.addEventListener('click', addParticipantRow);
});


// --- GESTIÓN DE PARTICIPANTES ---

function addParticipantRow() {
    const row = document.createElement('div');
    row.className = 'participant-row';

    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'ID Artista';
    input.className = 'participant-input'; // Clase para seleccionarlos luego
    input.required = true;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = () => row.remove();

    row.appendChild(input);
    row.appendChild(removeBtn);
    participantsContainer.appendChild(row);
}

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

// --- ENVÍO DEL FORMULARIO (POST /albums) ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { userId, token } = getSessionData();

    if (!userId || !token) {
        return showMessage('Debes iniciar sesión.', 'error');
    }

    // 1. Recopilar lista de participantes (List<Long>)
    const participantsList = [];
    const inputs = document.querySelectorAll('.participant-input');
    inputs.forEach(input => {
        if (input.value) {
            participantsList.push(parseInt(input.value));
        }
    });

    // Construir AlbumDTO [cite: 2, 5]
    const albumDTO = {
        nombre: document.getElementById('albumName').value,
        idAutor: parseInt(userId), // Autor principal = Usuario logueado
        participantes: participantsList,
        fechaLanzamiento: document.getElementById('releaseDate').value, // Formato YYYY-MM-DD (Estándar input date)
        genero: document.getElementById('albumGenre').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/albums`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(albumDTO)
        });

        if (response.ok) { // Código 201 Created [cite: 4]
            showMessage(`Álbum "${albumDTO.nombre}" creado con éxito.`, 'success');
            form.reset();
            participantsContainer.innerHTML = ''; // Limpiar participantes
        } else {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

    } catch (error) {
        console.error(error);
        showMessage('Error al crear el álbum. Ver consola.', 'error');
    }
});