// Get base URL for GitHub Pages
const baseUrl = window.location.hostname === 'sameerkarur.github.io'
    ? '/valentines-website'
    : '';

// Check if user is on mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Redirect to mobile version if on mobile device
if (isMobile() && !window.location.href.includes('mobile.html')) {
    const mobilePath = `${baseUrl}/mobile.html`;
    console.log('Redirecting to mobile version:', mobilePath);
    window.location.href = mobilePath;
}
