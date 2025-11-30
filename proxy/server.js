const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

// Si usas Node 18+ NO necesitas node-fetch
// const fetch = require('node-fetch');

// Configuración backend
const BACKEND_BASE = 'http://localhost:8080';
const VALIDATE_PATH = '/api/verified';

app.use(cookieParser());
app.use(express.json());

// ---------- Check si está logueado ----------
app.post('/api/verified', async (req, res) => {
    const token = extractToken(req);
    const valid = await isTokenValid(token);
    res.json({ authenticated: valid });
});

// ---------- Logout ----------
app.post('/access/logout', (req, res) => {
    // Borramos cookie de sesión
    
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true });
});


// ---------- CORS ----------
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

function extractToken(req) {
    // 1. Preferimos cookie
    let token = req.cookies?.token;

    // 2. Si hay Authorization header válido, lo usamos
    const auth = req.headers['authorization'];
    if (auth) {
        const parts = auth.split(' ');
        const value = parts[1];
        if (parts.length === 2 && value && value !== 'null' && value !== 'undefined') {
            token = value;
        }
    }

    return token;
}


// ---------- Helper para reenviar Set-Cookie ----------
function forwardSetCookieHeaders(backendResponse, res) {
    backendResponse.headers.forEach((value, name) => {
        console.log(`${name} - ${value}}`)
        if (name.toLowerCase() === 'set-cookie') {
            res.append('Set-Cookie', value);
        }
    });
}

// ---------- Validación de token ----------
async function isTokenValid(token) {
    if (!token) return false;

    console.log(`TOKEN VALIDO: ${token}`)
    try {
        const resp = await fetch(BACKEND_BASE + VALIDATE_PATH, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return resp.status < 300;
    } catch (err) {
        console.error("Error validando token:", err);
        return false;
    }
}

// ---------- Middleware de seguridad ----------
app.use('/api', async (req, res, next) => {
    const isAccessRoute = req.path.startsWith('/access');
    const token = extractToken(req);

    // Si es login
    if (isAccessRoute) {
        if (req.method === 'POST' && req.path.includes('/access')) {
            if (token) {
                return res.status(200).json({ ok: true, alreadyAuthenticated: true });
            }
        }
        return next();
    }

    // Para otras rutas: requiere token
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    next();
});

// ---------- PROXY GENERAL ----------
app.all(/^\/proxy\/.*/, async (req, res) => {
    const apiUrl = BACKEND_BASE + req.url.replace(/^\/proxy/, '');

    // 🔥 Ahora sí extraemos el token real (solo de cookie)
    const token = extractToken(req);

    try {
        // Construcción de headers
        const headers = {};
        if (req.headers['content-type']) {
            headers['Content-Type'] = req.headers['content-type'];
        }
        if (token) {
            console.log(`TOKEN ENVIADO: ${token}`)
            console.log(`TOKEN ENVIADO: ${token}`)
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Body solo para métodos que aceptan body
        let body;
        if (!['GET', 'HEAD'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
            body = headers['Content-Type']?.includes('application/json')
                ? JSON.stringify(req.body)
                : req.body;
        }

        const backendResponse = await fetch(apiUrl, {
            method: req.method,
            headers,
            ...(body ? { body } : {})
        });

        // Caso especial: login
        if (req.method === 'POST' && req.path === '/access/login') {
            forwardSetCookieHeaders(backendResponse, res);

            const ct = backendResponse.headers.get('content-type') || 'application/json';
            const payload = ct.includes('application/json')
                ? await backendResponse.json()
                : await backendResponse.text();

            res.setHeader('Content-Type', ct);
            return res.status(backendResponse.status).send(payload);
        }

        // Otras rutas → reenviar cookies si existen
        forwardSetCookieHeaders(backendResponse, res);

        const contentType = backendResponse.headers.get('content-type') || 'text/plain';
        const responseData = contentType.includes('application/json')
            ? await backendResponse.json()
            : await backendResponse.text();

        res.setHeader('Content-Type', contentType);
        res.status(backendResponse.status).send(responseData);

    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Proxy error" });
    }
});

app.listen(PORT, () => console.log(`Proxy corriendo en http://localhost:${PORT}`));
