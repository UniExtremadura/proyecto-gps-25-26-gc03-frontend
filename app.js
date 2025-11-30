const API_URL = "http://localhost:8080";

let songs = [];
let allSongs = [];
let currentIndex = -1;
let currentObjectURL = null;

// 🚫 Ya NO se usa localStorage token → el PROXY usa la cookie
console.log("Frontend iniciado (sin tokens locales)");

// Elementos
const statusEl = document.getElementById('status');
const listEl = document.getElementById('song-list');
const playerSection = document.getElementById('player');
const audio = document.getElementById('audio-player');
const cover = document.getElementById('cover');
const titleEl = document.getElementById('song-title');
const artistEl = document.getElementById('song-artist');
const playerStatus = document.getElementById('player-status');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const downloadBtn = document.getElementById('download-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');
const searchBar = document.getElementById('search-bar');
const logoutBtn = document.getElementById('logout-btn');

logoutBtn?.addEventListener('click', async () => {
    try {
        await fetch('http://localhost:3000/proxy/access/logout', {
            method: 'POST',
            credentials: 'include'
        });
        document.getElementById('player-section').hidden = true;
        document.getElementById('login-section').hidden = false;
        document.getElementById('profile-btn').hidden = true;
        document.getElementById('logout-btn').hidden = true;
        loginStatus.textContent = '';
    } catch (err) {
        console.error("Error al cerrar sesión:", err);
    }
});


// Función para valores por defecto
function defaultCover() {
    return 'https://via.placeholder.com/300x300?text=Portada';
}

// Debug
function logResponse(resp) {
    console.log("Fetch status:", resp.status, resp.statusText);
    console.log("Headers:");
    resp.headers.forEach((v,k)=>console.log(k,':',v));
}

// Inicializar controles
prevBtn?.addEventListener('click', () => playIndex(currentIndex - 1));
nextBtn?.addEventListener('click', () => playIndex(currentIndex + 1));
downloadBtn?.addEventListener('click', downloadCurrentSong);

// Volumen
const storedVol = localStorage.getItem('player_volume');
const initialVolume = storedVol !== null ? clamp(parseFloat(storedVol), 0, 1) : 1;

if(audio) audio.volume = initialVolume;
if(volumeSlider) volumeSlider.value = Math.round(initialVolume * 100);
if(volumeValue) volumeValue.textContent = `${Math.round(initialVolume * 100)}%`;

updateMuteButton();

volumeSlider?.addEventListener('input', (e) => {
    const v = e.target.value/100;
    audio.volume = v;
    volumeValue.textContent = `${Math.round(v*100)}%`;
    localStorage.setItem('player_volume', v.toString());
    updateMuteButton();
});

muteBtn?.addEventListener('click', () => {
    if(audio.volume === 0) {
        const restored = parseFloat(localStorage.getItem('player_volume')||'1');
        audio.volume = restored;
    } else {
        localStorage.setItem('player_volume', audio.volume.toString());
        audio.volume = 0;
    }
    updateMuteButton();
});

// Buscador
searchBar?.addEventListener('input', e => {
    const text = e.target.value.trim().toLowerCase();
    const filtered = text === "" ? allSongs : allSongs.filter(song =>
        (song.nombre || '').toLowerCase().includes(text)
    );
    renderSongs(filtered);
});

// Renderizar canciones
function renderSongs(list) {
    songs = list;
    if(!listEl) return;

    listEl.innerHTML = "";
    if(songs.length === 0) {
        listEl.innerHTML = '<p style="color:gray">No se encontraron canciones.</p>';
        return;
    }

    songs.forEach((song, idx)=>{
        const card = document.createElement("div");
        card.className="song-card";
        if(song.nombre){
          card.innerHTML = `
              <img width="60px" src="${song.urlPortada}">
              <h3>${escapeHtml(song.nombre)||'Sin título'}</h3>
              <p>${escapeHtml(song.genero)||''}</p>
          `;

          card.onclick = ()=>playIndex(idx);
          listEl.appendChild(card);
        }
    });
}

// Cargar canciones
async function loadSongs() {
    console.log("Cargando canciones desde:", `${API_URL}/songs`);
    try {
        const response = await fetch(`${API_URL}/songs`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        logResponse(response);

        if(!response.ok) {
            const text = await response.text();
            console.error("Error al obtener canciones:", text);
            listEl.innerHTML = '<p style="color:red">Error al cargar canciones.</p>';
            return;
        }

        allSongs = await response.json();
        console.log("Canciones recibidas:", allSongs);
        renderSongs(allSongs);

    } catch(err) {
        console.error("Fetch falló:", err);
        listEl.innerHTML = '<p style="color:red">Error al cargar canciones.</p>';
    }
}

// Reproducción
async function playIndex(idx) {
    console.log("Intentando reproducir índice:", idx);
    if(idx<0 || idx>=songs.length) return;

    const song = songs[idx];
    currentIndex = idx;
    updateControls();

    titleEl.textContent = song.nombre || 'Sin título';
    artistEl.textContent = `Artista ID: ${song.idArtista ?? 'N/A'}`;
    cover.src = song.urlPortada || defaultCover();
    playerSection.hidden = false;

    if(currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL=null;
    }

    try {
        playerStatus.textContent='Descargando audio…';
        const id = song.idCancion ?? song.id;
        if(id == null) throw new Error("ID de canción no encontrado");

        const res = await fetch(`${API_URL}/songs/${id}/stream`, {
            credentials: "include",
            headers: {} // 🔥 SIN Authorization
        });

        logResponse(res);

        if(!res.ok) throw new Error(`Error en stream: ${res.status}`);

        const blob = await res.blob();
        currentObjectURL = URL.createObjectURL(blob);

        audio.src = currentObjectURL;
        audio.play();

        playerStatus.textContent='Reproduciendo';

    } catch(err) {
        console.error("Error al reproducir canción:", err);
        playerStatus.textContent='No se pudo reproducir la canción.';
    }
}

// Descargar
async function downloadCurrentSong() {
    if(currentIndex<0) return;

    const song = songs[currentIndex];
    const id = song.idCancion ?? song.id;

    console.log("Descargando canción ID:", id);

    try {
        const res = await fetch(`${API_URL}/songs/${id}/download`, {
            credentials: "include",
            headers: {} // 🔥 SIN Authorization
        });

        logResponse(res);

        if(!res.ok) throw new Error('Error al descargar: ' + res.status);

        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = song.nombre || 'cancion.mp3';
        a.click();

    } catch(err) {
        console.error("Error al descargar canción:", err);
        playerStatus.textContent='Error al descargar.';
    }
}

// Helpers
function updateControls() {
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= songs.length - 1;
}

function updateMuteButton() {
    if(audio.volume === 0) {
        muteBtn.textContent='🔈';
    } else {
        muteBtn.textContent='🔊';
    }
}

function escapeHtml(s){
    return !s ? '' : s.toString().replace(/&/g,'&')
        .replace(/</g,'<').replace(/>/g,'>');
}

function clamp(v,a,b){
    if(Number.isNaN(v)) return a;
    return Math.min(b,Math.max(a,v));
}

// Iniciar
console.log("Inicializando reproductor...");
loadSongs();
