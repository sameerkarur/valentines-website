document.addEventListener('DOMContentLoaded', function() {
    // Error message handling
    const errorMessage = document.getElementById('errorMessage');
    const errorText = errorMessage.querySelector('.error-text');
    const errorClose = errorMessage.querySelector('.error-close');

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('visible');
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    function hideError() {
        errorMessage.classList.remove('visible');
    }

    errorClose.addEventListener('click', hideError);

    // Audio Context and Analyzer setup
    let audioContext;
    let analyser;
    let dataArray;
    const canvas = document.getElementById('audioVisualizer');
    const canvasCtx = canvas.getContext('2d');
    
    function initAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Connect audio element to analyzer
        const audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    function drawVisualizer() {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        requestAnimationFrame(drawVisualizer);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i] / 2;

            const gradient = canvasCtx.createLinearGradient(0, 0, 0, HEIGHT);
            gradient.addColorStop(0, `hsl(${i * 360 / dataArray.length}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${i * 360 / dataArray.length}, 100%, 25%)`);

            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        // Update photo effects based on beat detection
        const averageFrequency = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        if (averageFrequency > 100) { // Threshold for beat detection
            updatePhotoEffects(averageFrequency);
        }
    }

    function updatePhotoEffects(intensity) {
        const style = document.getElementById('styleSelect').value;
        const items = document.querySelectorAll('.gallery-item');
        
        items.forEach(item => {
            item.classList.remove('dancing', 'pulse', 'bounce', 'rotate', 'zoom');
            if (isPlaying) {
                item.classList.add(style);
                // Adjust animation intensity based on beat
                item.style.animationDuration = `${0.5 + (intensity / 255)}s`;
            }
        });
    }

    // Handle style changes
    document.getElementById('styleSelect').addEventListener('change', function() {
        if (isPlaying) {
            updatePhotoEffects(100); // Default intensity
        }
    });

    // Update canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = 50;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let slideshowInterval = null;
    let isSlideshow = false;

    // Music player setup
    const musicBtn = document.getElementById('musicToggle');
    const songSelect = document.getElementById('songSelect');
    const volumeSlider = document.getElementById('volumeSlider');
    const audio = document.getElementById('bgMusic');
    let isPlaying = false;

    // Load available songs
    const songs = [
        { name: 'Perfect', file: 'music/perfect.mp3' },
        { name: 'All of Me', file: 'music/all-of-me.mp3' },
        { name: 'A Thousand Years', file: 'music/a-thousand-years.mp3' }
    ];

    // Verify music files are accessible
    async function checkMusicFiles() {
        for (const song of songs) {
            try {
                const response = await fetch(song.file);
                if (!response.ok) {
                        console.error(`Error loading ${song.name}:`, response.status, response.statusText);
                    showError(`Could not load ${song.name}. Please check if the music file exists.`);
                    throw new Error(`Could not load ${song.name}`);
                }
            } catch (error) {
                console.error(`Error checking ${song.name}:`, error);
                showError(`Error: Could not access ${song.name}. Please make sure the music files are in the correct location.`);
                return false;
            }
        }
        return true;
    }

    // Add songs to select dropdown
    songs.forEach(song => {
        const option = document.createElement('option');
        option.value = song.file;
        option.textContent = song.name;
        songSelect.appendChild(option);
    });

    // Add audio event listeners for debugging
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        showError(`Error playing music: ${e.target.error ? e.target.error.message : 'Unknown error'}. Try refreshing the page.`);
    });

    audio.addEventListener('loadstart', () => console.log('Audio loading started'));
    audio.addEventListener('loadeddata', () => console.log('Audio data loaded'));
    audio.addEventListener('canplay', () => console.log('Audio can play'));
    audio.addEventListener('playing', () => console.log('Audio is playing'));


    // Slideshow controls
    const slideshowBtn = document.getElementById('slideshowToggle');
    const speedSelect = document.getElementById('speedSelect');

    const transitions = ['fade', 'zoom', 'rotate', 'flip'];
    let currentTransition = 0;

    async function startSlideshow() {
        if (images.length === 0) return;
        
        // Start music if it's not playing
        if (!isPlaying) {
            try {
                await musicBtn.click();
            } catch (error) {
                showError('Failed to start music. Starting slideshow without music.');
            }
        }

        isSlideshow = true;
        slideshowBtn.classList.add('active');
        slideshowBtn.querySelector('.tooltip').textContent = 'Stop Slideshow';
        slideshowBtn.querySelector('i').className = 'fas fa-pause';

        // Show first image in modal
        if (!modal.style.display || modal.style.display === 'none') {
            openModal(0);
        }

        // Start slideshow interval
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(async () => {
            const img = modalImg;
            const nextIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;

            // Apply transition effect
            const transition = transitions[currentTransition];
            currentTransition = (currentTransition + 1) % transitions.length;

            // Slide out current image
            img.classList.add('slide-out');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Show next image with transition
            img.classList.remove('slide-out');
            img.classList.add('slide-in');
            showImage(nextIndex);
            
            // Apply transition animation
            img.classList.remove('fade-transition', 'zoom-transition', 'rotate-transition', 'flip-transition');
            img.classList.add(`${transition}-transition`);
            
            // Reset position
            setTimeout(() => {
                img.classList.remove('slide-in');
            }, 50);
        }, parseInt(speedSelect.value));
    }

    function stopSlideshow() {
        isSlideshow = false;
        clearInterval(slideshowInterval);
        slideshowBtn.classList.remove('active');
        slideshowBtn.querySelector('.tooltip').textContent = 'Start Slideshow';
        slideshowBtn.querySelector('i').className = 'fas fa-play';
    }

    slideshowBtn.addEventListener('click', () => {
        if (isSlideshow) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    });

    speedSelect.addEventListener('change', () => {
        if (isSlideshow) {
            startSlideshow(); // Restart with new speed
        }
    });

    // Music controls
    musicBtn.addEventListener('click', async () => {
        if (isPlaying) {
            audio.pause();
            musicBtn.classList.remove('active');
            musicBtn.querySelector('.tooltip').textContent = 'Play Music';
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.classList.remove('dancing');
            });
        } else {
            try {
                // Check if music files are accessible
                if (!await checkMusicFiles()) {
                    return;
                }

                // Initialize audio context if needed
                if (!audioContext) {
                    await initAudioContext();
                    drawVisualizer();
                }
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                // Set audio source and play
                if (!audio.src || audio.src === window.location.href) {
                    const fullUrl = new URL(songSelect.value, window.location.href).href;
                    console.log('Loading audio from:', fullUrl);
                    audio.src = fullUrl;
                }

                // Ensure volume is set
                audio.volume = volumeSlider.value;

                // Try to play
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    console.log('Audio playback started successfully');
                }
            } catch (error) {
                console.error('Error playing audio:', error);
                showError(`Error playing audio: ${error.message}. Make sure your browser supports audio playback and check if the music files exist.`);
            }
            musicBtn.classList.add('active');
            musicBtn.querySelector('.tooltip').textContent = 'Pause Music';
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.classList.add('dancing');
            });
        }
        isPlaying = !isPlaying;
    });

    songSelect.addEventListener('change', () => {
        if (isPlaying) {
            audio.src = songSelect.value;
            audio.play();
        }
    });

    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
    });

    // Handle audio end
    audio.addEventListener('ended', () => {
        if (isPlaying) {
            // Move to next song
            const currentIndex = Array.from(songSelect.options).findIndex(option => option.value === songSelect.value);
            const nextIndex = (currentIndex + 1) % songSelect.options.length;
            songSelect.selectedIndex = nextIndex;
            audio.src = songSelect.value;
            audio.play();
        }
    });

    let currentImageIndex = 0;
    let images = [];

    // Function to load images from the images directory
    async function loadImages() {
        const gallery = document.querySelector('.gallery');
        
        try {
            // Remove loading indicator
            const loading = gallery.querySelector('.loading');
            if (loading) {
                loading.remove();
            }

            // Get the base URL for GitHub Pages
            const baseUrl = window.location.pathname.includes('valentines-website') 
                ? '/valentines-website' 
                : '';

            // List of image files
            const imageFiles = [
                'DSC00873.jpg',
                'DSC00877.JPG',
                'DSC00891.jpg',
                'DSC00903.JPG',
                'DSC00908.JPG',
                'DSC00920.JPG',
                'DSC00937.JPG',
                'DSC00963.jpg',
                'IMG-20250104-WA0059.jpg',
                'IMG-20250104-WA0060.jpg',
                'IMG-20250104-WA0065.jpg',
                'IMG_20250101_081013249.jpg',
                'IMG_20250102_093659519.jpg',
                'IMG_20250103_151133702.jpg',
                'IMG_20250103_211044204.jpg',
                'InShot_20250106_103710485.jpg'
            ];

            images = imageFiles.map(filename => ({
                src: `${baseUrl}/images/${filename}`,
                caption: filename.replace(/\.(jpg|jpeg|png|gif)$/i, '').replace(/_/g, ' ')
            }));

            // Create gallery items
            images.forEach((image, index) => {
                const item = document.createElement('div');
                item.className = 'gallery-item animate__animated animate__fadeIn';
                
                // Create and configure image element
                const img = document.createElement('img');
                img.src = image.src;
                img.alt = image.caption;
                img.loading = 'lazy';
                
                // Add error handling for images
                img.onerror = () => {
                    console.error(`Failed to load image: ${image.src}`);
                    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image not found</text></svg>';
                };

                item.appendChild(img);
                item.onclick = () => openModal(index);
                gallery.appendChild(item);
            });

            // Preload images
            images.forEach(image => {
                const img = new Image();
                img.src = image.src;
            });

        } catch (error) {
            console.error('Error loading images:', error);
            showError('Failed to load images. Please refresh the page.');
        }
    }

    // Modal functionality
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const captionText = document.querySelector('.modal-caption');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    function openModal(index) {
        modal.style.display = 'block';
        showImage(index);
    }

    function showImage(index) {
        currentImageIndex = index;
        modalImg.src = images[index].src;
        captionText.innerHTML = images[index].caption;
        
        // In slideshow mode, always show navigation buttons for continuous loop
        if (isSlideshow) {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        } else {
            // Normal mode: hide buttons at ends
            prevBtn.style.display = index === 0 ? 'none' : 'block';
            nextBtn.style.display = index === images.length - 1 ? 'none' : 'block';
        }

        // Sync photo effects with music if playing
        if (isPlaying && dataArray) {
            const averageFrequency = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            updatePhotoEffects(averageFrequency);
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        if (isSlideshow) {
            stopSlideshow();
        }
    }

    // Event listeners
    closeBtn.onclick = closeModal;
    prevBtn.onclick = () => showImage(currentImageIndex - 1);
    nextBtn.onclick = () => showImage(currentImageIndex + 1);

    // Close modal when clicking outside the image
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };

    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (modal.style.display === 'block') {
            if (event.key === 'ArrowLeft' && currentImageIndex > 0) {
                showImage(currentImageIndex - 1);
            }
            else if (event.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
                showImage(currentImageIndex + 1);
            }
            else if (event.key === 'Escape') {
                closeModal();
            }
        }
    });

    // Load images when the page loads
    loadImages();
});