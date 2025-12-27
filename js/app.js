/**
 * Hyrox Training Tracker - Main Application
 * Entry point for the PWA
 */

import { initDB, getTimerState, clearTimerState } from './db.js';
import { initRouter, registerRoute, navigate, setupNavigation, getInitialRoute } from './router.js';
import { initModal, confirm } from './components/modal.js';
import { setupVisibilityHandler, restoreTimer, stopTimer } from './timer.js';

// Import screens
import * as DashboardScreen from './screens/dashboard.js';
import * as FullSimScreen from './screens/full-sim.js';
import * as CustomScreen from './screens/custom.js';
import * as HistoryScreen from './screens/history.js';

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Hyrox Training Tracker...');

    try {
        // Initialize IndexedDB
        await initDB();
        console.log('Database initialized');

        // Initialize modal system
        initModal();

        // Set up timer visibility handler
        setupVisibilityHandler();

        // Check for in-progress workout
        await checkForActiveWorkout();

        // Register routes
        registerRoute('dashboard', {
            render: DashboardScreen.render,
            onMount: DashboardScreen.onMount
        });

        registerRoute('full-sim', {
            render: FullSimScreen.render,
            onMount: FullSimScreen.onMount
        });

        registerRoute('custom', {
            render: CustomScreen.render,
            onMount: CustomScreen.onMount
        });

        registerRoute('history', {
            render: HistoryScreen.render,
            onMount: HistoryScreen.onMount
        });

        // Initialize router
        const mainContent = document.getElementById('main-content');
        initRouter(mainContent);

        // Set up bottom navigation
        setupNavigation();

        // Navigate to initial route
        const initialRoute = await getInitialRoute();
        if (window.location.hash.slice(1) !== initialRoute) {
            navigate(initialRoute);
        }

        // Register service worker
        registerServiceWorker();

        console.log('App initialized successfully');

    } catch (error) {
        console.error('Failed to initialize app:', error);
        showErrorState();
    }
}

/**
 * Check for active workout that needs to be resumed
 */
async function checkForActiveWorkout() {
    const timerState = await getTimerState();

    if (timerState && timerState.workoutId && (timerState.isRunning || timerState.isPaused)) {
        // Show resume banner
        const banner = document.getElementById('resume-banner');
        const resumeBtn = document.getElementById('btn-resume-workout');
        const discardBtn = document.getElementById('btn-discard-workout');

        if (banner) {
            banner.classList.remove('hidden');

            resumeBtn?.addEventListener('click', async () => {
                banner.classList.add('hidden');

                // Navigate to the appropriate screen
                if (timerState.mode === 'sim') {
                    navigate('full-sim');
                } else {
                    navigate('custom');
                }
            });

            discardBtn?.addEventListener('click', async () => {
                const confirmed = await confirm(
                    'Discard Workout?',
                    'Are you sure you want to discard this workout? All progress will be lost.',
                    'Discard',
                    'Keep'
                );

                if (confirmed) {
                    await stopTimer(true);
                    banner.classList.add('hidden');
                }
            });
        }
    }
}

/**
 * Register service worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('ServiceWorker registered:', registration.scope);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker?.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            showUpdateNotification(newWorker);
                        }
                    });
                });

            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        });
    }
}

/**
 * Show update notification
 */
function showUpdateNotification(worker) {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'resume-banner';
    updateBanner.style.background = 'var(--bg-card)';
    updateBanner.style.borderBottom = '1px solid var(--color-gold)';
    updateBanner.innerHTML = `
        <div class="resume-content">
            <span class="resume-text" style="color: var(--text-primary);">Update available!</span>
        </div>
        <div class="resume-actions">
            <button class="btn-resume" id="btn-update">Update</button>
            <button class="btn-discard" id="btn-dismiss-update" style="color: var(--text-secondary); border-color: var(--text-muted);">Later</button>
        </div>
    `;

    document.getElementById('app')?.insertBefore(updateBanner, document.getElementById('main-content'));

    document.getElementById('btn-update')?.addEventListener('click', () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    });

    document.getElementById('btn-dismiss-update')?.addEventListener('click', () => {
        updateBanner.remove();
    });
}

/**
 * Show error state
 */
function showErrorState() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="screen">
                <div class="empty-state">
                    <div class="empty-state-icon" style="font-size: 64px;">⚠️</div>
                    <div class="empty-state-title">Unable to Load App</div>
                    <div class="empty-state-text">
                        Please make sure you have a modern browser and try refreshing the page.
                    </div>
                    <button class="btn btn-primary mt-md" onclick="location.reload()">Refresh</button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
