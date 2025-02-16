// Device detection and dynamic loading
function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           (navigator.maxTouchPoints > 0 && /Mobi|Android/i.test(navigator.userAgent));
}

function loadStylesheet(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

async function initializeApp() {
    try {
        // Common styles and scripts
        loadStylesheet('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Poppins:wght@300;400;600&display=swap');
        loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');
        loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

        // Determine if mobile or desktop
        const isMobile = isMobileDevice();
        
        // Load appropriate stylesheet
        loadStylesheet(isMobile ? 'mobile.css' : 'styles.css');

        // Load appropriate JavaScript
        await loadScript(isMobile ? 'mobile.js' : 'script.js');

        // Initialize content
        document.body.classList.add(isMobile ? 'mobile-view' : 'desktop-view');
        
        console.log(`Loaded ${isMobile ? 'mobile' : 'desktop'} version`);
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('There was an error loading the page. Please refresh and try again.');
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
