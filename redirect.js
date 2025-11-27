// Constants
const DOMAIN = 'https://samirurl.netlify.app';
const STORAGE_KEY = 'samir_links';

// DOM Elements
const redirectTitle = document.getElementById('redirectTitle');
const redirectMessage = document.getElementById('redirectMessage');
const progressFill = document.getElementById('progressFill');
const redirectInfo = document.getElementById('redirectInfo');
const tokenDisplay = document.getElementById('tokenDisplay');
const destinationUrl = document.getElementById('destinationUrl');
const redirectActions = document.getElementById('redirectActions');
const goHomeBtn = document.getElementById('goHomeBtn');
const directLink = document.getElementById('directLink');
const notFoundCard = document.getElementById('notFoundCard');

// Redirect configuration
const REDIRECT_DELAY = 2000; // 2 seconds
const PROGRESS_INTERVAL = 50; // Update progress every 50ms

function initRedirect() {
    const token = extractTokenFromPath();
    
    if (!token) {
        showNotFound();
        return;
    }
    
    const linkData = getLinkData(token);
    
    if (!linkData) {
        showNotFound();
        return;
    }
    
    displayRedirectInfo(token, linkData.long_url);
    incrementClickCount(token);
    startRedirectCountdown(linkData.long_url);
}

function extractTokenFromPath() {
    const path = window.location.pathname;
    
    // Remove leading and trailing slashes
    const cleanPath = path.replace(/^\/|\/$/g, '');
    
    // For root path with no token, show not found
    if (!cleanPath) {
        return '';
    }
    
    // Simple token validation: alphanumeric, 4-12 characters
    const tokenRegex = /^[a-zA-Z0-9]{4,12}$/;
    if (!tokenRegex.test(cleanPath)) {
        return '';
    }
    
    return cleanPath;
}

function getLinkData(token) {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        
        const links = JSON.parse(stored);
        return links[token] || null;
    } catch {
        return null;
    }
}

function incrementClickCount(token) {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        
        const links = JSON.parse(stored);
        if (links[token]) {
            links[token].clicks += 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
        }
    } catch (error) {
        console.error('Error incrementing click count:', error);
    }
}

function displayRedirectInfo(token, destination) {
    tokenDisplay.textContent = token;
    destinationUrl.textContent = destination;
    directLink.href = destination;
}

function startRedirectCountdown(destinationUrl) {
    let progress = 0;
    const progressStep = (PROGRESS_INTERVAL / REDIRECT_DELAY) * 100;
    
    const progressInterval = setInterval(() => {
        progress += progressStep;
        progressFill.style.width = `${Math.min(progress, 100)}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            performRedirect(destinationUrl);
        }
    }, PROGRESS_INTERVAL);
    
    // Setup cancel button
    goHomeBtn.addEventListener('click', () => {
        clearInterval(progressInterval);
        window.location.href = DOMAIN;
    });
}

function performRedirect(url) {
    // Use replace to prevent back button from returning to redirect page
    window.location.replace(url);
}

function showNotFound() {
    redirectTitle.style.display = 'none';
    redirectMessage.style.display = 'none';
    progressFill.style.display = 'none';
    redirectInfo.style.display = 'none';
    redirectActions.style.display = 'none';
    notFoundCard.style.display = 'block';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initRedirect);