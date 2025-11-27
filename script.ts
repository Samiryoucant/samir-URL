// TypeScript interface definitions
interface LinkItem {
    long_url: string;
    clicks: number;
    created_at: number;
}

interface StorageSchema {
    [token: string]: LinkItem;
}

// Constants
const DOMAIN = 'https://samirurl.netlify.app';
const STORAGE_KEY = 'samir_links';
const THEME_KEY = 'samir_theme';
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const TOKEN_LENGTHS = [4, 5, 6];
const MAX_GENERATION_ATTEMPTS = 12;
const MAX_URL_LENGTH = 2000;

// Unsafe URL schemes to block
const UNSAFE_SCHEMES = [
    'javascript:', 'data:', 'vbscript:', 'file:', 'about:', 
    'intent:', 'blob:', 'ftp:'
];

// DOM Elements
const urlForm = document.getElementById('urlForm') as HTMLFormElement;
const urlInput = document.getElementById('urlInput') as HTMLInputElement;
const shortenBtn = document.getElementById('shortenBtn') as HTMLButtonElement;
const loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement;
const resultCard = document.getElementById('resultCard') as HTMLDivElement;
const shortUrlLink = document.getElementById('shortUrlLink') as HTMLAnchorElement;
const shortUrlText = document.getElementById('shortUrlText') as HTMLSpanElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const shareBtn = document.getElementById('shareBtn') as HTMLButtonElement;
const qrBtn = document.getElementById('qrBtn') as HTMLButtonElement;
const qrModal = document.getElementById('qrModal') as HTMLDivElement;
const closeQrModal = document.getElementById('closeQrModal') as HTMLButtonElement;
const qrCanvas = document.getElementById('qrCanvas') as HTMLCanvasElement;
const downloadQrBtn = document.getElementById('downloadQrBtn') as HTMLButtonElement;
const shareModal = document.getElementById('shareModal') as HTMLDivElement;
const closeShareModal = document.getElementById('closeShareModal') as HTMLButtonElement;
const shareButtons = document.querySelectorAll('.share-platform') as NodeListOf<HTMLButtonElement>;
const recentLinksSection = document.getElementById('recentLinksSection') as HTMLDivElement;
const recentLinks = document.getElementById('recentLinks') as HTMLDivElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
const toastContainer = document.getElementById('toastContainer') as HTMLDivElement;

// Current state
let currentShortUrl = '';

// Initialize app
function init(): void {
    loadTheme();
    attachEventListeners();
    renderRecentLinks();
}

// Theme management
function loadTheme(): void {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (systemPrefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

// Event listeners
function attachEventListeners(): void {
    urlForm.addEventListener('submit', handleUrlSubmit);
    copyBtn.addEventListener('click', handleCopy);
    shareBtn.addEventListener('click', handleShare);
    qrBtn.addEventListener('click', handleQrCode);
    closeQrModal.addEventListener('click', () => qrModal.style.display = 'none');
    closeShareModal.addEventListener('click', () => shareModal.style.display = 'none');
    downloadQrBtn.addEventListener('click', handleDownloadQr);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Share platform buttons
    shareButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const platform = (e.currentTarget as HTMLButtonElement).dataset.platform;
            if (platform) {
                shareOnPlatform(platform, currentShortUrl);
            }
        });
    });
    
    // Close modals on outside click
    [qrModal, shareModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// URL validation and normalization
function validateUrl(url: string): { isValid: boolean; normalizedUrl: string; error: string } {
    // Trim and check length
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        return { isValid: false, normalizedUrl: '', error: 'Please enter a URL' };
    }
    
    if (trimmedUrl.length > MAX_URL_LENGTH) {
        return { isValid: false, normalizedUrl: '', error: 'URL is too long' };
    }
    
    // Check for unsafe schemes
    const lowerUrl = trimmedUrl.toLowerCase();
    if (UNSAFE_SCHEMES.some(scheme => lowerUrl.startsWith(scheme))) {
        return { isValid: false, normalizedUrl: '', error: 'Unsafe URL scheme detected' };
    }
    
    // Add https:// if no scheme provided
    let normalizedUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(trimmedUrl)) {
        normalizedUrl = 'https://' + trimmedUrl;
    }
    
    // Basic URL validation
    try {
        const urlObj = new URL(normalizedUrl);
        if (!urlObj.hostname) {
            return { isValid: false, normalizedUrl: '', error: 'Invalid URL' };
        }
    } catch {
        return { isValid: false, normalizedUrl: '', error: 'Invalid URL format' };
    }
    
    return { isValid: true, normalizedUrl, error: '' };
}

// Token generation
function generateToken(): string {
    const links = getStoredLinks();
    
    for (const length of TOKEN_LENGTHS) {
        for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            let token = '';
            for (let i = 0; i < length; i++) {
                token += BASE62_CHARS[Math.floor(Math.random() * BASE62_CHARS.length)];
            }
            
            if (!links[token]) {
                return token;
            }
        }
    }
    
    // Fallback: timestamp-based token
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
}

// LocalStorage operations
function getStoredLinks(): StorageSchema {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveLink(token: string, longUrl: string): void {
    const links = getStoredLinks();
    
    links[token] = {
        long_url: longUrl,
        clicks: 0,
        created_at: Date.now()
    };
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch (error) {
        showToast('Error saving link. Storage might be full.', 'error');
        throw error;
    }
}

// Main URL shortening handler
async function handleUrlSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const url = urlInput.value;
    const validation = validateUrl(url);
    
    if (!validation.isValid) {
        showToast(validation.error, 'error');
        urlInput.focus();
        return;
    }
    
    setLoading(true);
    
    try {
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const token = generateToken();
        saveLink(token, validation.normalizedUrl);
        
        currentShortUrl = `${DOMAIN}/${token}`;
        displayResult(currentShortUrl);
        renderRecentLinks();
        
        urlInput.value = '';
        showToast('URL shortened successfully!', 'success');
        
    } catch (error) {
        showToast('Failed to create short URL. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading: boolean): void {
    shortenBtn.disabled = isLoading;
    loadingSpinner.style.display = isLoading ? 'block' : 'none';
    shortenBtn.querySelector('.btn-text')!.textContent = isLoading ? '' : 'Shorten';
}

function displayResult(shortUrl: string): void {
    shortUrlLink.href = shortUrl;
    shortUrlText.textContent = shortUrl;
    resultCard.style.display = 'block';
    
    // Scroll to result
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy to clipboard
async function handleCopy(): Promise<void> {
    try {
        await navigator.clipboard.writeText(currentShortUrl);
        showToast('Copied to clipboard!', 'success');
        
        // Visual feedback
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
        `;
        
        setTimeout(() => {
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
            `;
        }, 2000);
        
    } catch (error) {
        showToast('Failed to copy. Please copy manually.', 'error');
    }
}

// Share functionality
function handleShare(): void {
    shareModal.style.display = 'flex';
}

function shareOnPlatform(platform: string, url: string): void {
    const encodedUrl = encodeURIComponent(url);
    const text = encodeURIComponent('Check out this link shortened with Samir URL:');
    
    let shareUrl = '';
    
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${text}%20${encodedUrl}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${text}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=Check out this link&body=${text}%20${encodedUrl}`;
            break;
    }
    
    if (platform === 'email') {
        window.location.href = shareUrl;
    } else {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    
    shareModal.style.display = 'none';
    showToast(`Opening ${platform}...`, 'success');
}

// QR Code functionality
function handleQrCode(): void {
    generateQRCode(currentShortUrl);
    qrModal.style.display = 'flex';
}

function generateQRCode(url: string): void {
    const canvas = qrCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Simple QR code generation (pixel-based)
    const size = 10; // pixel size
    const margin = 20;
    const data = url;
    
    // Simple encoding - in production, use a proper QR library
    ctx.fillStyle = '#000000';
    
    // Generate a simple pattern for demo
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const x = (i % 15) * size + margin;
        const y = Math.floor(i / 15) * size + margin;
        
        if (charCode % 2 === 0) {
            ctx.fillRect(x, y, size, size);
        }
    }
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin - 5, margin - 5, 15 * size + 10, Math.ceil(data.length / 15) * size + 10);
}

function handleDownloadQr(): void {
    const link = document.createElement('a');
    link.download = `qr-${currentShortUrl.split('/').pop()}.png`;
    link.href = qrCanvas.toDataURL();
    link.click();
    showToast('QR code downloaded!', 'success');
}

// Recent links rendering
function renderRecentLinks(): void {
    const links = getStoredLinks();
    const recentLinksArray = Object.entries(links)
        .sort(([, a], [, b]) => b.created_at - a.created_at)
        .slice(0, 10); // Show last 10
    
    if (recentLinksArray.length === 0) {
        recentLinksSection.style.display = 'none';
        return;
    }
    
    recentLinksSection.style.display = 'block';
    recentLinks.innerHTML = '';
    
    recentLinksArray.forEach(([token, data]) => {
        const linkElement = document.createElement('div');
        linkElement.className = 'recent-link-item';
        
        const shortUrl = `${DOMAIN}/${token}`;
        const createdDate = new Date(data.created_at).toLocaleDateString();
        
        linkElement.innerHTML = `
            <div class="link-info">
                <a href="${shortUrl}" class="link-token" target="_blank" rel="noopener">
                    ${DOMAIN}/<strong>${token}</strong>
                </a>
                <div class="link-original" title="${escapeHtml(data.long_url)}">
                    ${truncateUrl(escapeHtml(data.long_url), 50)}
                </div>
            </div>
            <div class="link-stats">
                <span>${data.clicks} clicks</span>
                <span>${createdDate}</span>
            </div>
            <div class="link-actions">
                <button class="action-btn" onclick="copyRecentLink('${token}')" data-tooltip="Copy">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                </button>
                <button class="action-btn" onclick="shareRecentLink('${token}')" data-tooltip="Share">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                </button>
                <a href="${shortUrl}" class="action-btn" target="_blank" rel="noopener" data-tooltip="Open">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                </a>
            </div>
        `;
        
        recentLinks.appendChild(linkElement);
    });
}

// Utility functions for recent links (exposed to global scope)
function copyRecentLink(token: string): void {
    const url = `${DOMAIN}/${token}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
}

function shareRecentLink(token: string): void {
    const url = `${DOMAIN}/${token}`;
    currentShortUrl = url;
    handleShare();
}

// Toast system
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 
        `<svg viewBox="0 0 24 24" width="20" height="20" class="toast-icon">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>` :
        `<svg viewBox="0 0 24 24" width="20" height="20" class="toast-icon">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>`;
    
    toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Utility functions
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncateUrl(url: string, maxLength: number): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Expose functions to global scope for HTML onclick handlers
(window as any).copyRecentLink = copyRecentLink;
(window as any).shareRecentLink = shareRecentLink;