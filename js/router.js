/**
 * Simple Hash-based Router
 * Handles client-side navigation for the SPA
 */

import { setLastRoute, getLastRoute } from './db.js';

// Route configuration
const routes = {};
let currentRoute = null;
let mainContent = null;

/**
 * Initialize the router
 * @param {HTMLElement} contentElement - Main content container
 */
export function initRouter(contentElement) {
    mainContent = contentElement;

    // Listen for hash changes
    window.addEventListener('hashchange', handleRouteChange);

    // Handle initial route
    handleRouteChange();
}

/**
 * Register a route
 * @param {string} path - Route path (e.g., 'dashboard', 'full-sim')
 * @param {Object} config - Route configuration with render function
 */
export function registerRoute(path, config) {
    routes[path] = config;
}

/**
 * Navigate to a route
 * @param {string} path - Route path to navigate to
 * @param {Object} params - Optional route parameters
 */
export function navigate(path, params = {}) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    const hash = queryString ? `${path}?${queryString}` : path;
    window.location.hash = hash;
}

/**
 * Get current route name
 * @returns {string} Current route name
 */
export function getCurrentRoute() {
    return currentRoute;
}

/**
 * Parse the current hash into route and params
 * @returns {Object} Parsed route object
 */
function parseHash() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [path, queryString] = hash.split('?');
    const params = {};

    if (queryString) {
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[key] = decodeURIComponent(value);
        });
    }

    return { path, params };
}

/**
 * Handle route change event
 */
async function handleRouteChange() {
    const { path, params } = parseHash();
    const route = routes[path];

    if (!route) {
        // Fallback to dashboard if route not found
        navigate('dashboard');
        return;
    }

    // Update current route
    currentRoute = path;

    // Save last route
    await setLastRoute(path);

    // Update navigation active state
    updateNavigation(path);

    // Render the route
    if (mainContent && route.render) {
        try {
            mainContent.innerHTML = '';
            const content = await route.render(params);

            if (typeof content === 'string') {
                mainContent.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                mainContent.appendChild(content);
            }

            // Call onMount if provided
            if (route.onMount) {
                await route.onMount(params);
            }
        } catch (error) {
            console.error('Error rendering route:', error);
            mainContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">!</div>
                    <div class="empty-state-title">Error</div>
                    <div class="empty-state-text">Something went wrong loading this page.</div>
                </div>
            `;
        }
    }
}

/**
 * Update navigation active state
 * @param {string} activeRoute - Currently active route
 */
function updateNavigation(activeRoute) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const route = item.dataset.route;
        item.classList.toggle('active', route === activeRoute);
    });
}

/**
 * Get last visited route from storage
 * @returns {Promise<string>} Last route
 */
export async function getInitialRoute() {
    const hash = window.location.hash.slice(1);
    if (hash && routes[hash.split('?')[0]]) {
        return hash;
    }
    return await getLastRoute();
}

/**
 * Set up navigation click handlers
 */
export function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const route = item.dataset.route;
            if (route) {
                navigate(route);
            }
        });
    });
}
