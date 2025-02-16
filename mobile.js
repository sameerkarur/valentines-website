// Constants
const SONGS = [
    { name: 'Perfect', path: 'music/perfect.mp3' },
    { name: 'All of Me', path: 'music/all_of_me.mp3' },
    { name: 'A Thousand Years', path: 'music/a_thousand_years.mp3' }
];

const PHOTOS = [
    'images/photo1.jpg',
    'images/photo2.jpg',
    'images/photo3.jpg',
    'images/photo4.jpg',
    'images/photo5.jpg',
    'images/photo6.jpg',
    'images/photo7.jpg',
    'images/photo8.jpg'
];

// Audio Context and Analyzer
let audioContext;
let analyzer;
let audioSource;
let isPlaying = false;
let currentPhotoIndex = 0;
let slideshowInterval = null;

// DOM Elements
const musicToggle = document.getElementById('musicToggle');
const songSelect = document.getElementById('songSelect');
const styleSelect = document.getElementById('styleSelect');
const slideshowToggle = document.getElementById('slideshowToggle');
const speedSelect = document.getElementById('speedSelect');
const bgMusic = document.getElementById('bgMusic');
const visualizer = document.getElementById('audioVisualizer');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeBtn = document.querySelector('.close-btn');
const modalCaption = document.querySelector('.modal-caption');
const errorMessage = document.getElementById('errorMessage');
const errorClose = document.querySelector('.error-close');

// Initialize
function init() {
    loadSongs();
    loadPhotos();
    setupEventListeners();
    setupAudioContext();
    setupVisualizer();
}

// Load songs into select
function loadSongs() {
    SONGS.forEach(song => {
        const option = document.createElement('option');
        option.value = song.path;
        option.textContent = song.name;
        songSelect.appendChild(option);
    });
}

// Load photos into gallery
function loadPhotos() {
    const gallery = document.querySelector('.gallery-container');
    PHOTOS.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo;
        img.alt = `Photo ${index + 1}`;
        img.dataset.index = index;
        gallery.appendChild(img);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Music controls
    musicToggle.addEventListener('click', toggleMusic);
    songSelect.addEventListener('change', changeSong);
    
    // Style controls
    styleSelect.addEventListener('change', changePhotoStyle);
    
    // Slideshow controls
    slideshowToggle.addEventListener('click', toggleSlideshow);
    speedSelect.addEventListener('change', changeSpeed);
    
    // Modal controls
    document.querySelector('.gallery-container').addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    
    // Error message
    errorClose.addEventListener('click', () => errorMessage.style.display = 'none');

    // Touch events for modal
    let touchStartX = 0;
    let touchEndX = 0;
    
    modal.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    });
    
    modal.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    });
}

// Handle swipe gesture
function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            showPreviousPhoto();
        } else {
            showNextPhoto();
        }
    }
}

// Audio setup
function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    
    audioSource = audioContext.createMediaElementSource(bgMusic);
    audioSource.connect(analyzer);
    analyzer.connect(audioContext.destination);
}

// Visualizer setup
function setupVisualizer() {
    const canvas = visualizer;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        
        canvas.width = window.innerWidth;
        canvas.height = 50;
        
        analyzer.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 4;
            
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(255, 105, 180, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 20, 147, 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    draw();
}

// Music controls
function toggleMusic() {
    if (!isPlaying) {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        bgMusic.play();
        musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        bgMusic.pause();
        musicToggle.innerHTML = '<i class="fas fa-music"></i>';
    }
    isPlaying = !isPlaying;
}

function changeSong() {
    const wasPlaying = !bgMusic.paused;
    bgMusic.src = songSelect.value;
    if (wasPlaying) {
        bgMusic.play();
    }
}

// Photo controls
function changePhotoStyle() {
    const photos = document.querySelectorAll('.gallery-container img');
    photos.forEach(photo => {
        photo.className = styleSelect.value;
    });
}

// Slideshow controls
function toggleSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        slideshowToggle.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        slideshowInterval = setInterval(showNextPhoto, parseInt(speedSelect.value));
        slideshowToggle.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function changeSpeed() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(showNextPhoto, parseInt(speedSelect.value));
    }
}

// Modal functions
function openModal(e) {
    if (e.target.tagName === 'IMG') {
        modal.style.display = 'block';
        modalImg.src = e.target.src;
        currentPhotoIndex = parseInt(e.target.dataset.index);
        updateModalCaption();
    }
}

function closeModal() {
    modal.style.display = 'none';
}

function showNextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % PHOTOS.length;
    modalImg.src = PHOTOS[currentPhotoIndex];
    updateModalCaption();
}

function showPreviousPhoto() {
    currentPhotoIndex = (currentPhotoIndex - 1 + PHOTOS.length) % PHOTOS.length;
    modalImg.src = PHOTOS[currentPhotoIndex];
    updateModalCaption();
}

function updateModalCaption() {
    modalCaption.textContent = `Photo ${currentPhotoIndex + 1} of ${PHOTOS.length}`;
}

// Error handling
function showError(message) {
    const errorText = document.querySelector('.error-text');
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', () => {
    if (visualizer) {
        visualizer.width = window.innerWidth;
    }
});
