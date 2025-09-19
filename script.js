// 1. Cria um elemento <script> e carrega a API do YouTube
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let playlist = [];
let currentIndex = -1;

// 2. Esta função é chamada automaticamente quando a API do YouTube está pronta
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        playerVars: {
            'controls': 1
        }
    });

    const buttons = document.querySelectorAll('.botoes-container button');

    // Construir playlist: apenas itens que tocam no iframe (botões vermelhos)
    playlist = [
        // Botões do YouTube
        ...Array.from(buttons).filter(btn =>
            !['gta6-local', 'time-local', 'tlou-local'].includes(btn.id)
        ).map((button, idx) => ({
            label: button.textContent?.trim() || `Som ${idx + 1}`,
            type: 'youtube',
            videoUrl: button.dataset.videoUrl,
            startTime: parseInt(button.dataset.startTime, 10) || 0
        })),
        // Arquivos locais
        {
            label: 'Musica GTA 6',
            type: 'local-video',
            elementId: 'gta6-video'
        },
        {
            label: 'TIME (Hans Zimmer)',
            type: 'local-audio',
            elementId: 'time-audio'
        },
        {
            label: 'Sound Track TLOU',
            type: 'local-audio',
            elementId: 'tlou-audio'
        }
    ];

    // Atualizar rótulo inicial
    updateTrackLabel();

    // Listeners dos botões do YouTube
    buttons.forEach((button, idx) => {
        if (['gta6-local', 'time-local', 'tlou-local'].includes(button.id)) return;
        button.addEventListener('click', () => {
            const videoUrl = button.dataset.videoUrl;
            const startTime = parseInt(button.dataset.startTime, 10);
            const videoId = getVideoId(videoUrl);
            if (videoId) {
                tocarSom(videoId, startTime);
                currentIndex = idx;
                updateTrackLabel();
            }
        });
    });

    // Listeners dos botões locais
    document.getElementById('gta6-local').addEventListener('click', function() {
        currentIndex = playlist.findIndex(t => t.type === 'local-video');
        playCurrent();
    });
    document.getElementById('time-local').addEventListener('click', function() {
        currentIndex = playlist.findIndex(t => t.label === 'TIME (Hans Zimmer)');
        playCurrent();
    });
    document.getElementById('tlou-local').addEventListener('click', function() {
        currentIndex = playlist.findIndex(t => t.label === 'Sound Track TLOU');
        playCurrent();
    });

    // Listeners dos botões de navegação
    document.getElementById('prev-track').addEventListener('click', prevTrack);
    document.getElementById('next-track').addEventListener('click', nextTrack);

    // Listeners para pausar tudo ao clicar em outros botões
    document.querySelectorAll('.botoes-container button:not(#gta6-local):not(#time-local):not(#tlou-local)').forEach(btn => {
        btn.addEventListener('click', function() {
            stopLocalMedia();
            document.getElementById('player-container').style.display = 'block';
        });
    });

    // Listeners de teclado
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowRight') {
            nextTrack();
        } else if (ev.key === 'ArrowLeft') {
            prevTrack();
        }
    });
}

// 4. Nova e mais robusta função para extrair o ID do vídeo da URL
function getVideoId(url) {
	if (!url) return null; // Retorna nulo se a URL estiver vazia

	// Expressões regulares para diferentes formatos de URL do YouTube
	const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
	const match = url.match(regex);
	
	// Retorna o ID se encontrado, caso contrário, retorna nulo
	return (match && match[1]) ? match[1] : null;
}

// 5. Função que carrega e toca o vídeo
function tocarSom(videoId, startTime) {
	player.loadVideoById({
		videoId: videoId,
		startSeconds: startTime
	});
}

function nextTrack() {
    if (!playlist.length) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    playCurrent();
}

function prevTrack() {
    if (!playlist.length) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playCurrent();
}

function playCurrent() {
    stopLocalMedia();
    const track = playlist[currentIndex];
    if (track.type === 'youtube') {
        const videoId = getVideoId(track.videoUrl);
        if (videoId) tocarSom(videoId, track.startTime);
        document.getElementById('player-container').style.display = 'block';
        updateTrackLabel();
    } else if (track.type === 'local-video') {
        document.getElementById('player-container').style.display = 'none';
        const video = document.getElementById(track.elementId);
        video.style.display = 'block';
        video.currentTime = 0; // sempre reinicia
        video.play();
        updateTrackLabelGTA6();
    } else if (track.type === 'local-audio') {
        document.getElementById('player-container').style.display = 'none';
        const audio = document.getElementById(track.elementId);
        audio.volume = 1.0;
        audio.style.display = 'block';
        audio.currentTime = 0; // sempre reinicia
        audio.play();
        if (track.elementId === 'time-audio') updateTrackLabelTIME();
        else if (track.elementId === 'tlou-audio') updateTrackLabelTLOU();
    }
}

// Atualize todos os handlers para usar stopLocalMedia antes de mostrar o novo conteúdo

// Ao clicar em outros botões, pare tudo local e mostre o player do YouTube
document.querySelectorAll('.botoes-container button:not(#gta6-local):not(#time-local):not(#tlou-local)').forEach(btn => {
    btn.addEventListener('click', function() {
        stopLocalMedia();
        document.getElementById('player-container').style.display = 'block';
    });
});

function updateTrackLabel() {
	const label = document.getElementById('current-track-label');
	if (!label) return;
	if (!playlist.length) {
		label.textContent = 'Nenhuma música disponível';
		return;
	}
	if (currentIndex < 0) {
		label.textContent = 'escolha';
		return;
	}
	label.textContent = `${currentIndex + 1} / ${playlist.length} · ${playlist[currentIndex].label}`;
}

function updateTrackLabelGTA6() {
    const label = document.getElementById('current-track-label');
    label.textContent = 'Musica GTA 6 (MP4)';
}

function stopLocalMedia() {
    // Pausa e esconde vídeo GTA6
    const video = document.getElementById('gta6-video');
    video.pause();
    video.currentTime = 0; // sempre reinicia
    video.style.display = 'none';
    // Pausa e esconde áudio TIME
    const timeAudio = document.getElementById('time-audio');
    timeAudio.pause();
    timeAudio.currentTime = 0; // sempre reinicia
    timeAudio.style.display = 'none';
    // Pausa e esconde áudio TLOU
    const tlouAudio = document.getElementById('tlou-audio');
    tlouAudio.pause();
    tlouAudio.currentTime = 0; // sempre reinicia
    tlouAudio.style.display = 'none';
    // Pausa o player do YouTube se estiver disponível
    if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
    }
}

function updateTrackLabelTIME() {
    const label = document.getElementById('current-track-label');
    label.textContent = 'TIME (Hans Zimmer) (MP3)';
}

function updateTrackLabelTLOU() {
    const label = document.getElementById('current-track-label');
    label.textContent = 'Sound Track TLOU (MP3)';
}
