const express = require('express');
const app = express();
const PORT = 3000;
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(express.json());

// CORS
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
// PROXY ROUTE
app.all(/^\/api\/.*/, async (req, res) => {
    const apiUrl = 'http://localhost:8080' + req.url.replace('/api', '');

    try {
        const body = ['POST','PUT','PATCH','GET'].includes(req.method)
            ? JSON.stringify(req.body)
            : undefined;

        const response = await fetch(apiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.cookies['token'] ? { 'Authorization': `Bearer ${req.cookies['token']}` } : {})
            },
            body
        });

        console.log(response);

        // Copiar todas las cookies
        response.headers.forEach((value, name) => {
            if (name.toLowerCase() === 'set-cookie') {
                res.append('Set-Cookie', value);
            }
        });

        const contentType = response.headers.get('content-type');
        const data = contentType?.includes('application/json')
            ? await response.json()
            : await response.text();

        res.setHeader('Content-Type', contentType || 'text/plain');
        res.status(response.status).send(data);

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Proxy error' });
    }
});


app.listen(PORT, () => console.log(`Proxy corriendo en http://localhost:${PORT}`));
