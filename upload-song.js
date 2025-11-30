// CONFIGURACIÓN: API Gateway
const API_BASE_URL = 'http://localhost:8080';

// Enum de Géneros (Idéntico al definido en SongDTO.java y Swagger)
//  Ver enum en SongDTO.java
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
document.addEventListener('DOMContentLoaded', () => {
    // 1. Rellenar Select de Géneros dinámicamente
    if (genreSelect) {
        GENRE_TYPES.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            // Formatea el texto: "HEAVY_METAL" -> "Heavy Metal"
            option.textContent = genre.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            genreSelect.appendChild(option);
        });
    }

    console.log("Gestor de contenido iniciado (Auth vía Cookies)");
});

// --- FUNCIONES AUXILIARES ---
function showMessage(text, type) {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');
    // Ocultar mensaje después de 5 seg
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
}

// --- ENVÍO DEL FORMULARIO ---
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener valores del DOM
        const nombreInput = document.getElementById('songName');
        const durationInput = document.getElementById('duration');
        const genreInput = document.getElementById('genre');
        const urlInput = document.getElementById('songUrl');
        const coverInput = document.getElementById('coverUrl');

        // Validación básica de campos requeridos
        if (!nombreInput || !durationInput || !urlInput) {
            showMessage('Por favor, completa los campos obligatorios.', 'error');
            return;
        }

        // Intento de obtener ID de artista localmente (opcional),
        // pero preferimos que el backend use la cookie.
        let currentUserId = localStorage.getItem('userId');

        // Construcción del objeto SongDTO
        // Se asegura que los tipos de datos coincidan con Java (Double, String, Enum, Long)
        const songDTO = {
            nombre: nombreInput.value,
            duracion: parseFloat(durationInput.value), // Java espera Double
            genero: genreInput.value,                  // Java espera Enum como String
            url: urlInput.value,
            urlPortada: coverInput ? coverInput.value : "",

            // REQUISITO SOLICITADO: Forzar albumId a null
            albumId: null,

            // Enviamos null si no hay ID local, asumiendo que el Backend extraerá
            // el usuario de la Cookie de sesión (request.getCookies).
            idArtista: currentUserId ? parseInt(currentUserId) : null
        };

        try {
            console.log("Enviando Payload:", JSON.stringify(songDTO));

            // Petición POST al Endpoint /songs definido en Swagger [cite: 2]
            const response = await fetch(`http://localhost:3000/proxy/songs`, {
                method: 'POST',
                // 'include' es vital para enviar la cookie JSESSIONID o idUsuario al backend
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(songDTO)
            });

            if (response.ok) {
                // HTTP 201 Created
                showMessage(`¡Éxito! Canción "${songDTO.nombre}" subida correctamente como Single.`, 'success');
                form.reset();
            } else {
                // Manejo de errores (400, 403, 500)
                const errorText = await response.text();
                console.error("Error backend:", errorText);
                showMessage(`Error al subir (${response.status}): Ver consola para detalles.`, 'error');
            }

        } catch (error) {
            console.error("Error de red o conexión:", error);
            showMessage('Error de conexión con el servidor API Gateway.', 'error');
        }
    });
}