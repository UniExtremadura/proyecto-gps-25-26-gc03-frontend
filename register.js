/* ==== LÓGICA DE REGISTRO ==== */

const registerForm = document.getElementById('register-form');
const registerStatus = document.getElementById('register-status');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Feedback visual inmediato
        registerStatus.textContent = "Procesando registro...";
        registerStatus.className = "message processing";
        registerStatus.style.display = "block";

        const formData = new FormData(registerForm);

        // Objeto payload coincidiendo con RegisterRequest.java
        const payload = {
            username: formData.get('username'),
            password: formData.get('password'),
            name: formData.get('name'),
            surname: formData.get('surname'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            birthday: formData.get('birthday'),
            gender: formData.get('gender')
        };

        try {
            // Ajusta el puerto/ruta según tu configuración de backend o proxy
            const response = await fetch('http://localhost:3000/proxy/access/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                registerStatus.textContent = "¡Registro exitoso! Redirigiendo...";
                registerStatus.className = "message success";

                // Opcional: Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

                registerForm.reset();
            } else {
                const errorData = await response.json();
                registerStatus.textContent = "Error: " + (errorData.message || "No se pudo registrar.");
                registerStatus.className = "message error";
            }

        } catch (err) {
            console.error(err);
            registerStatus.textContent = "Error de conexión con el servidor.";
            registerStatus.className = "message error";
        }
    });
}