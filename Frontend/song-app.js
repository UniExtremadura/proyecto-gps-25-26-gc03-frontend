// CONFIGURACIÓN: API Gateway (Microservicio de Contenido)
const API_BASE_URL = 'http://localhost:8080'; // Apunta directo al Gateway

// Enum de Géneros (Copia exacta de Genre.java)
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

const form = document.getElementById('songForm');
const messageBox = document.getElementById('messageBox');
const genreSelect = document.getElementById('genre');

// --- INICIALIZACIÓN ---

// 1. Rellenar Select de Géneros
document.addEventListener('DOMContentLoaded', () => {
    GENRE_TYPES.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        // Formato bonito: "HIP_HOP" -> "Hip Hop"
        option.textContent = genre.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        genreSelect.appendChild(option);
    });
});

// --- FUNCIONES AUXILIARES ---

function getSessionData() {
    return {
        token: localStorage.getItem('token'),
        userId: localStorage.getItem('userId') // Asumimos que es el artista
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

// --- ENVÍO DEL FORMULARIO (POST /songs) ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { userId, token } = getSessionData();

    if (!userId || !token) {
        return showMessage('Debes iniciar sesión para subir música.', 'error');
    }

    // Obtener valores del DOM
    const rawDuration = document.getElementById('duration').value;
    const rawAlbumId = document.getElementById('albumId').value;

    // Construir SongDTO [cite: 5]
    const songDTO = {
        // idCancion: null (autogenerado por DB),
        nombre: document.getElementById('songName').value,
        duracion: parseFloat(rawDuration), // Convertir a Double
        genero: document.getElementById('genre').value,
        idArtista: parseInt(userId), // El usuario actual es el propietario
        url: document.getElementById('songUrl').value,
        urlPortada: document.getElementById('coverUrl').value,

        // Si el campo está vacío, mandamos null, si no, parseamos a Long
        albumId: rawAlbumId ? parseInt(rawAlbumId) : null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/songs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(songDTO)
        });

        if (response.ok) { // Código 201 Created [cite: 3]
            showMessage(`Canción "${songDTO.nombre}" subida correctamente.`, 'success');
            form.reset(); // Limpiar formulario
        } else {
            const errorText = await response.text(); // O .json() si el backend devuelve JSON error
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

    } catch (error) {
        console.error(error);
        showMessage('Error al subir la canción. Ver consola.', 'error');
    }
});