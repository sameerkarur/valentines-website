// Get base URL for GitHub Pages
const baseUrl = window.location.origin + (window.location.pathname.includes('valentines-website') 
    ? '/valentines-website'
    : '');
console.log('Base URL:', baseUrl);

// Initialize audio context
let audioContext = null;
let analyser = null;
let isPlaying = false;

async function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const audio = document.getElementById('bgMusic');
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        console.log('Audio context initialized');
    } catch (error) {
        console.error('Error initializing audio context:', error);
        showError(`Audio initialization error: ${error.message}`);
    }
}

// Constants
const SONGS = [
    { name: 'Perfect', path: 'music/perfect.mp3' },
    { name: 'All of Me', path: 'music/all-of-me.mp3' },
    { name: 'A Thousand Years', path: 'music/a-thousand-years.mp3' }
];

// Debug log the base URL and full paths
console.log('Base URL:', baseUrl);
console.log('Example image path:', `${baseUrl}/images/DSC00873.jpg`);
console.log('Example music path:', `${baseUrl}/music/perfect.mp3`);

// List of photos with their exact filenames
const PHOTOS = [
    { filename: 'DSC00873.jpg', title: 'Beach Photo 1' },
    { filename: 'DSC00877.JPG', title: 'Beach Photo 2' },
    { filename: 'DSC00891.jpg', title: 'Beach Photo 3' },
    { filename: 'DSC00903.JPG', title: 'Beach Photo 4' },
    { filename: 'DSC00908.JPG', title: 'Beach Photo 5' },
    { filename: 'DSC00920.JPG', title: 'Beach Photo 6' },
    { filename: 'DSC00937.JPG', title: 'Beach Photo 7' },
    { filename: 'DSC00963.jpg', title: 'Beach Photo 8' },
    { filename: 'IMG-20250104-WA0059.jpg', title: 'Special Moment 1' },
    { filename: 'IMG-20250104-WA0060.jpg', title: 'Special Moment 2' },
    { filename: 'IMG-20250104-WA0065.jpg', title: 'Special Moment 3' },
    { filename: 'IMG_20250101_081013249.jpg', title: 'New Year Photo 1' },
    { filename: 'IMG_20250102_093659519.jpg', title: 'New Year Photo 2' },
    { filename: 'IMG_20250103_151133702.jpg', title: 'New Year Photo 3' },
    { filename: 'IMG_20250103_211044204.jpg', title: 'New Year Photo 4' },
    { filename: 'InShot_20250106_103710485.jpg', title: 'Special Edit' }
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
    if (!gallery) {
        console.error('Gallery container not found');
        return;
    }

    // Clear existing content
    gallery.innerHTML = '';

    // Add loading indicator
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Loading photos...';
    gallery.appendChild(loading);

    // Load each photo
    PHOTOS.forEach((photo, index) => {
        const container = document.createElement('div');
        container.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = `${baseUrl}/images/${photo.filename}`;
        img.crossOrigin = 'anonymous'; // Add CORS support
        img.alt = photo.title;
        img.dataset.index = index;
        img.className = 'gallery-image';

        // Add loading and error handlers
        img.onload = () => {
            console.log(`Successfully loaded: ${photo.filename}`);
            container.classList.add('loaded');
            loading.remove(); // Remove loading indicator when first image loads
        };

        // Add image to container
        container.appendChild(img);
        // Add container to gallery
        gallery.appendChild(container);

        img.onerror = () => {
            console.error(`Failed to load: ${photo.filename}`);
            console.error('Full image URL:', img.src);
            showError(`Failed to load image: ${photo.title}`);
            
            // Try to fetch the image directly to get more error details
            fetch(img.src)
                .then(response => {
                    console.log('Fetch response:', response.status, response.statusText);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    console.log('Image blob:', blob.type, blob.size);
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    showError(`Network error: ${error.message}`);
                });

            // Set a placeholder image
            img.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                    <rect width="200" height="200" fill="#f8f9fa"/>
                    <text x="50%" y="45%" text-anchor="middle" fill="#dc3545" style="font-size: 16px;">Image Failed to Load</text>
                    <text x="50%" y="55%" text-anchor="middle" fill="#6c757d" style="font-size: 12px;">${photo.title}</text>
                </svg>
            `);
        };

        gallery.appendChild(img);
    });

    // Remove loading indicator
    loading.remove();
}

// Setup event listeners
function setupEventListeners() {
    // Music controls
    musicToggle.addEventListener('click', async () => {
        const audio = document.getElementById('bgMusic');
        
        if (audio.paused) {
            try {
                if (!audioContext) {
                    await initAudioContext();
                    setupVisualizer();
                }
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                
                // Load the selected song
                const selectedSong = songSelect.value;
                const sources = audio.getElementsByTagName('source');
                for (let source of sources) {
                    if (source.src.endsWith(selectedSong)) {
                        audio.load(); // Force reload
                        break;
                    }
                }
                
                await audio.play();
                musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
                isPlaying = true;
            } catch (error) {
                console.error('Error playing audio:', error);
                showError(`Error playing audio: ${error.message}`);
            }
        } else {
            audio.pause();
            musicToggle.innerHTML = '<i class="fas fa-music"></i>';
            isPlaying = false;
        }
    });
    
    songSelect.addEventListener('change', async (e) => {
        const audio = document.getElementById('bgMusic');
        const selectedSong = e.target.value;
        
        try {
            // Update source elements
            const sources = audio.getElementsByTagName('source');
            for (let source of sources) {
                if (source.src.endsWith(selectedSong)) {
                    audio.load(); // Force reload
                    if (isPlaying) {
                        await audio.play();
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error changing song:', error);
            showError(`Error changing song: ${error.message}`);
        }
    });
    
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
