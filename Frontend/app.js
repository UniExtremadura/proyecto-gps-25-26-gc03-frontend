const API_URL = "http://localhost:3000/api";

let songs = [];
let allSongs = [];
let currentIndex = -1;
let currentObjectURL = null;

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

// Función para valores por defecto
function defaultCover() {
    return 'https://via.placeholder.com/300x300?text=Portada';
}

// Inicializar controles
prevBtn?.addEventListener('click', () => playIndex(currentIndex - 1));
nextBtn?.addEventListener('click', () => playIndex(currentIndex + 1));
downloadBtn?.addEventListener('click', downloadCurrentSong);

const storedVol = localStorage.getItem('player_volume');
const initialVolume = storedVol !== null ? clamp(parseFloat(storedVol), 0, 1) : 1;
if(audio) audio.volume = initialVolume;
if(volumeSlider) {
    volumeSlider.value = Math.round(initialVolume * 100);
}
if(volumeValue) volumeValue.textContent = `${Math.round(initialVolume * 100)}%`;
updateMuteButton();

// Volumen
volumeSlider?.addEventListener('input', (e) => {
    const pct = Number(e.target.value);
    const v = pct / 100;
    if(audio) audio.volume = v;
    if(volumeValue) volumeValue.textContent = `${pct}%`;
    localStorage.setItem('player_volume', v.toString());

    if(muteBtn && v > 0) {
        muteBtn.setAttribute('aria-pressed', 'false');
        muteBtn.textContent = '🔊';
    }
});

// Buscador
searchBar?.addEventListener('input', e => {
    const text = e.target.value.trim().toLowerCase();
    const filtered = text === "" ? allSongs : allSongs.filter(song =>
        (song.nombre || '').toLowerCase().includes(text)
    );
    renderSongs(filtered); 
    // No reiniciamos currentIndex, así la canción actual sigue
});

// Mute / restore
muteBtn?.addEventListener('click', () => {
    if(!audio) return;
    if(audio.volume === 0) {
        const restored = clamp(parseFloat(localStorage.getItem('player_volume') || '1'), 0, 1);
        audio.volume = restored;
        if(volumeSlider) volumeSlider.value = Math.round(restored * 100);
        if(volumeValue) volumeValue.textContent = `${Math.round(restored * 100)}%`;
        muteBtn.setAttribute('aria-pressed', 'false');
        muteBtn.textContent = '🔊';
    } else {
        localStorage.setItem('player_volume', audio.volume.toString());
        audio.volume = 0;
        if(volumeSlider) volumeSlider.value = 0;
        if(volumeValue) volumeValue.textContent = '0%';
        muteBtn.setAttribute('aria-pressed', 'true');
        muteBtn.textContent = '🔈';
    }
});

// Tecla M
window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        muteBtn?.click();
    }
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

    songs.forEach((song, idx) => {
        const card = document.createElement("div");
        card.className = "song-card";
        card.innerHTML = `
            <img src="${song.urlPortada || 'https://i.pinimg.com/236x/e1/16/84/e11684a280be50b75e2eaf2613bd78f7.jpg'}">
            <h3>${escapeHtml(song.nombre) || 'Limpiar reproductor'}</h3>
            <p>${escapeHtml(song.genero)}</p>
        `;
        card.onclick = () => playIndex(idx);
        listEl.appendChild(card);
    });
}

// Cargar canciones
async function loadSongs() {
    try {
        const response = await fetch(`${API_URL}/songs`);
        allSongs = await response.json();
        renderSongs(allSongs);
    } catch(err) {
        console.error(err);
        if(listEl) listEl.innerHTML = '<p style="color:red">Error al cargar canciones.</p>';
    }
}

// Reproducir canción
async function playIndex(idx) {
    if(idx < 0 || idx >= songs.length) return;
    const song = songs[idx];
    currentIndex = idx;
    updateControls();

    if(titleEl) titleEl.textContent = song.nombre || 'Sin título';
    if(artistEl) artistEl.textContent = `Artista ID: ${song.idArtista ?? 'N/A'}`;
    if(cover) cover.src = song.urlPortada || defaultCover();
    if(playerSection) playerSection.hidden = false;

    if(currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = null;
    }

    try {
        if(playerStatus) playerStatus.textContent = 'Descargando audio…';
        const id = song.idCancion ?? song.id;
        if(id == null) throw new Error('ID de canción no encontrado');

        const res = await fetch(`${API_URL}/songs/${id}/stream`);
        if(!res.ok) throw new Error(`Error en stream: ${res.status}`);
        const blob = await res.blob();
        currentObjectURL = URL.createObjectURL(blob);

        if(audio) {
            audio.src = currentObjectURL;
            audio.load();
            const stored = clamp(parseFloat(localStorage.getItem('player_volume') || '1'), 0, 1);
            audio.volume = stored;
            if(volumeSlider) volumeSlider.value = Math.round(stored * 100);
            if(volumeValue) volumeValue.textContent = `${Math.round(stored * 100)}%`;
            updateMuteButton();

            const playPromise = audio.play();
            if(playPromise !== undefined) {
                playPromise.then(() => {
                    if(playerStatus) playerStatus.textContent = 'Reproduciendo';
                }).catch(err => {
                    console.warn('Playback bloqueado:', err);
                    if(playerStatus) playerStatus.textContent = 'Haz clic en play en el reproductor para iniciar la reproducción.';
                });
            } else if(playerStatus) {
                playerStatus.textContent = 'Listo para reproducir';
            }
        }
    } catch(err) {
        console.error(err);
        if(playerStatus) playerStatus.textContent = 'No se pudo reproducir la canción. Revisa consola y CORS.';
    }
}

// Descargar canción
async function downloadCurrentSong() {
    if(currentIndex < 0) return;
    const song = songs[currentIndex];
    const id = song.idCancion ?? song.id;
    if(id == null) return;

    try {
        if(playerStatus) playerStatus.textContent = 'Generando descarga…';
        const res = await fetch(`${API_URL}/songs/${id}/download`);
        if(!res.ok) throw new Error('Error al descargar: ' + res.status);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (song.nombre || 'song').replace(/[^\w\-\.]/g, '_');
        a.download = `${safeName}.mp3`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        if(playerStatus) playerStatus.textContent = 'Descarga iniciada';
    } catch(err) {
        console.error(err);
        if(playerStatus) playerStatus.textContent = 'Error al descargar.';
    }
}

// Controles prev/next
function updateControls() {
    if(prevBtn) prevBtn.disabled = currentIndex <= 0;
    if(nextBtn) nextBtn.disabled = currentIndex >= songs.length - 1;
}

// Botón mute
function updateMuteButton() {
    if(!muteBtn || !audio) return;
    if(audio.volume === 0) {
        muteBtn.setAttribute('aria-pressed', 'true');
        muteBtn.textContent = '🔈';
    } else {
        muteBtn.setAttribute('aria-pressed', 'false');
        muteBtn.textContent = '🔊';
    }
}

// Escapar HTML
function escapeHtml(s) {
    if(!s) return '';
    return s.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Clamp
function clamp(v, a, b) {
    if(Number.isNaN(v)) return a;
    return Math.min(b, Math.max(a, v));
}

// Iniciar
loadSongs();
