/**
 * Utility Functions
 * Helper functions used throughout the app
 */

/**
 * Generate a unique ID
 * @returns {string} UUID-like string
 */
export function generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    }) + '-' + Date.now().toString(36);
}

/**
 * Format milliseconds to MM:SS.ms format
 * @param {number} ms - Milliseconds
 * @param {boolean} showMs - Whether to show milliseconds (default: true)
 * @returns {string} Formatted time string
 */
export function formatTime(ms, showMs = true) {
    if (ms === null || ms === undefined || isNaN(ms)) {
        return showMs ? '00:00.00' : '00:00';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');
    const msStr = String(milliseconds).padStart(2, '0');

    return showMs ? `${minStr}:${secStr}.${msStr}` : `${minStr}:${secStr}`;
}

/**
 * Format milliseconds to HH:MM:SS format for longer durations
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export function formatLongTime(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) {
        return '00:00:00';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculate delta between two times
 * @param {number} current - Current time in ms
 * @param {number} pb - Personal best time in ms
 * @returns {Object} Delta object with value, formatted string, and type
 */
export function calculateDelta(current, pb) {
    if (!pb || pb === 0 || !current) {
        return { value: 0, formatted: '-', type: 'neutral' };
    }

    const delta = current - pb;
    const absDelta = Math.abs(delta);

    if (delta === 0) {
        return { value: 0, formatted: '=', type: 'neutral' };
    }

    const formatted = formatTime(absDelta, false);
    const sign = delta > 0 ? '+' : '-';

    return {
        value: delta,
        formatted: `${sign}${formatted}`,
        type: delta < 0 ? 'positive' : 'negative'
    };
}

/**
 * Get start of current week (Monday)
 * @returns {Date} Start of week date
 */
export function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Get end of current week (Sunday)
 * @returns {Date} End of week date
 */
export function getWeekEnd() {
    const monday = getWeekStart();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
}

/**
 * Check if a date is within the current week
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is within current week
 */
export function isThisWeek(date) {
    const checkDate = new Date(date);
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    return checkDate >= weekStart && checkDate <= weekEnd;
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    const d = new Date(date);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
}

/**
 * Format date and time for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
    const d = new Date(date);
    const dateOptions = { month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${d.toLocaleDateString('en-US', dateOptions)} at ${d.toLocaleTimeString('en-US', timeOptions)}`;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Sanitize HTML string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param  {...any} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.assign(element.dataset, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    }

    for (const child of children) {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    }

    return element;
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - 'success' or 'error'
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showToast(message, type = 'success', duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) {
        existing.remove();
    }

    const toast = createElement('div', { className: `toast ${type}` }, message);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return formatDate(date);
}
