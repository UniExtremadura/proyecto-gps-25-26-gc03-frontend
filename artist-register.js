/* ==== LÓGICA DE REGISTRO DE ARTISTA ==== */

const artistForm = document.getElementById('artist-form');
const artistStatus = document.getElementById('artist-status');

// Función auxiliar para leer una cookie por su nombre
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Intentamos obtener el ID de la cookie 'idUsuario'
const userId = getCookie('idUsuario');

if (artistForm) {

    // Verificación inicial: Si no hay ID en la cookie, no se puede procesar
    if (!userId) {
        artistStatus.textContent = "Error: No se detectó la cookie de usuario (idUsuario). Por favor, inicia sesión de nuevo.";
        artistStatus.className = "message error";
        artistStatus.style.display = "block";

        const btn = document.querySelector('.action-btn');
        if(btn) {
            btn.disabled = true;
            btn.style.backgroundColor = '#555';
        }
    }

    artistForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!userId) return;

        // Feedback visual
        artistStatus.textContent = "Procesando solicitud...";
        artistStatus.className = "message processing";
        artistStatus.style.display = "block";

        const formData = new FormData(artistForm);

        // Construcción del ArtistFormDTO
        const payload = {
            artistName: formData.get('artistName'),
            description: formData.get('description'),
            iban: formData.get('iban'),
            accountPropietary: formData.get('accountPropietary')
        };

        try {
            // URL: /api/artists/create-form/{userId}
            const response = await fetch(`http://localhost:3000/proxy/api/artists/create-form/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include' // Importante para enviar cookies al backend
            });

            if (response.ok) {
                artistStatus.textContent = "¡Felicidades! Ahora eres un artista.";
                artistStatus.className = "message success";

                artistForm.reset();

                // Al cambiar el rol, el usuario se recrea en la BD, por lo que la sesión antigua
                // suele quedar inválida. Redirigimos al login para que entre como Artista.
                setTimeout(() => {
                    alert("Tu cuenta ha sido actualizada a Artista. Por favor, inicia sesión nuevamente.");

                    // Opcional: Borrar la cookie manualmente si lo deseas (poniendo fecha pasada)
                    document.cookie = "idUsuario=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

                    window.location.href = 'index.html';
                }, 1500);

            } else {
                let errorMessage = "No se pudo completar la solicitud.";
                try {
                    const errorData = await response.json();
                    if (errorData.message) errorMessage = errorData.message;
                } catch (jsonErr) {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }

                artistStatus.textContent = "Error: " + errorMessage;
                artistStatus.className = "message error";
            }

        } catch (err) {
            console.error(err);
            artistStatus.textContent = "Error de conexión con el servidor.";
            artistStatus.className = "message error";
        }
    });
}