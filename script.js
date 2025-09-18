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

	// 3. Seleciona todos os botões e adiciona um "ouvinte de evento" de clique
	const buttons = document.querySelectorAll('.botoes-container button');
	const links = document.querySelectorAll('.botoes-container a');

	// Construir playlist: apenas itens que tocam no iframe (botões vermelhos)
	playlist = Array.from(buttons).map((button, idx) => ({
		label: button.textContent?.trim() || `Som ${idx + 1}`,
		videoUrl: button.dataset.videoUrl,
		startTime: parseInt(button.dataset.startTime, 10) || 0
	}));

	// Atualizar rótulo inicial
	updateTrackLabel();

	buttons.forEach((button, idx) => {
		button.addEventListener('click', () => {
			const videoUrl = button.dataset.videoUrl;
			const startTime = parseInt(button.dataset.startTime, 10);

			// Adicione esta linha para ver a URL que está sendo processada
			console.log(`Tentando extrair ID da URL: ${videoUrl}`);
			
			const videoId = getVideoId(videoUrl);
			if (videoId) {
				console.log(`ID do vídeo extraído com sucesso: ${videoId}`);
				tocarSom(videoId, startTime);
				currentIndex = idx;
				updateTrackLabel();
			} else {
				console.error(`Erro: ID de vídeo inválido ou não encontrado na URL: ${videoUrl}`);
			}
		});
	});

	// Controles por teclado (setas esquerda/direita)
	document.addEventListener('keydown', (ev) => {
		if (ev.key === 'ArrowRight') {
			nextTrack();
		} else if (ev.key === 'ArrowLeft') {
			prevTrack();
		}
	});

	// Controles por botões de setas no mobile
	const prevBtn = document.getElementById('prev-track');
	const nextBtn = document.getElementById('next-track');
	prevBtn?.addEventListener('click', prevTrack);
	nextBtn?.addEventListener('click', nextTrack);
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
	if (currentIndex < 0) currentIndex = 0; else currentIndex = (currentIndex + 1) % playlist.length;
	const { videoUrl, startTime } = playlist[currentIndex];
	const videoId = getVideoId(videoUrl);
	if (videoId) tocarSom(videoId, startTime);
	updateTrackLabel();
}

function prevTrack() {
	if (!playlist.length) return;
	if (currentIndex < 0) currentIndex = playlist.length - 1; else currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
	const { videoUrl, startTime } = playlist[currentIndex];
	const videoId = getVideoId(videoUrl);
	if (videoId) tocarSom(videoId, startTime);
	updateTrackLabel();
}

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
