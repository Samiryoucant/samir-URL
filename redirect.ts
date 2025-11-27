// Constants
const DOMAIN = 'https://samirurl.netlify.app';
const STORAGE_KEY = 'samir_links';

// DOM Elements
const redirectTitle = document.getElementById('redirectTitle') as HTMLHeadingElement;
const redirectMessage = document.getElementById('redirectMessage') as HTMLParagraphElement;
const progressFill = document.getElementById('progressFill') as HTMLDivElement;
const redirectInfo = document.getElementById('redirectInfo') as HTMLDivElement;
const tokenDisplay = document.getElementById('tokenDisplay') as HTMLSpanElement;
const destinationUrl = document.getElementById('destinationUrl') as HTMLSpanElement;
const redirectActions = document.getElementById('redirectActions') as HTMLDivElement;
const goHomeBtn = document.getElementById('goHomeBtn') as HTMLButtonElement;
const directLink = document.getElementById('directLink') as HTMLAnchorElement;
const notFoundCard = document.getElementById('notFoundCard') as HTMLDivElement;

// Redirect configuration
const REDIRECT_DELAY = 2000; // 2 seconds
const PROGRESS_INTERVAL = 50; // Update progress every 50ms

interface LinkItem {
    long_url: string;
    clicks: number;
    created_at: number;
}

interface StorageSchema {
    [token: string]: LinkItem;
}

function initRedirect(): void {
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

function extractTokenFromPath(): string {
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

function getLinkData(token: string): LinkItem | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        
        const links: StorageSchema = JSON.parse(stored);
        return links[token] || null;
    } catch {
        return null;
    }
}

function incrementClickCount(token: string): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        
        const links: StorageSchema = JSON.parse(stored);
        if (links[token]) {
            links[token].clicks += 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
        }
    } catch (error) {
        console.error('Error incrementing click count:', error);
    }
}

function displayRedirectInfo(token: string, destination: string): void {
    tokenDisplay.textContent = token;
    destinationUrl.textContent = destination;
    directLink.href = destination;
}

function startRedirectCountdown(destinationUrl: string): void {
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

function performRedirect(url: string): void {
    // Use replace to prevent back button from returning to redirect page
    window.location.replace(url);
}

function showNotFound(): void {
    redirectTitle.style.display = 'none';
    redirectMessage.style.display = 'none';
    progressFill.style.display = 'none';
    redirectInfo.style.display = 'none';
    redirectActions.style.display = 'none';
    notFoundCard.style.display = 'block';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initRedirect);