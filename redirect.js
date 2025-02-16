// Check if user is on mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Redirect to mobile version if on mobile device
if (isMobile() && !window.location.href.includes('mobile.html')) {
    window.location.href = 'mobile.html';
}
