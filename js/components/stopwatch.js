/**
 * Stopwatch Component
 * Displays timer with controls (pause/stop/next/finish)
 */

import { formatTime } from '../utils.js';

/**
 * Create stopwatch controls component
 * @param {Object} options - Stopwatch options
 * @param {boolean} options.isLastBlock - Whether this is the last block
 * @param {boolean} options.isPaused - Whether timer is paused
 * @param {Function} options.onPause - Pause callback
 * @param {Function} options.onResume - Resume callback
 * @param {Function} options.onStop - Stop callback
 * @param {Function} options.onNext - Next callback
 * @param {Function} options.onFinish - Finish callback
 * @returns {HTMLElement} Stopwatch element
 */
export function createStopwatch(options = {}) {
    const {
        isLastBlock = false,
        isPaused = false,
        onPause,
        onResume,
        onStop,
        onNext,
        onFinish
    } = options;

    const container = document.createElement('div');
    container.className = 'stopwatch-container';

    container.innerHTML = `
        <div class="stopwatch-display" data-stopwatch-display>00:00.00</div>
        <div class="stopwatch-controls">
            <button class="stopwatch-btn btn-stop" data-action="stop" aria-label="Stop workout">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12"/>
                </svg>
            </button>

            <button class="stopwatch-btn btn-pause" data-action="pause" aria-label="${isPaused ? 'Resume' : 'Pause'}">
                ${isPaused ? `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="8,5 19,12 8,19"/>
                    </svg>
                ` : `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14"/>
                        <rect x="14" y="5" width="4" height="14"/>
                    </svg>
                `}
            </button>

            ${isLastBlock ? `
                <button class="stopwatch-btn btn-finish" data-action="finish" aria-label="Finish workout">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" fill="none"/>
                    </svg>
                </button>
            ` : `
                <button class="stopwatch-btn btn-next" data-action="next" aria-label="Next exercise">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,4 15,12 5,20"/>
                        <rect x="15" y="5" width="4" height="14"/>
                    </svg>
                </button>
            `}
        </div>
    `;

    // Get elements
    const display = container.querySelector('[data-stopwatch-display]');
    const pauseBtn = container.querySelector('[data-action="pause"]');
    const stopBtn = container.querySelector('[data-action="stop"]');
    const nextBtn = container.querySelector('[data-action="next"]');
    const finishBtn = container.querySelector('[data-action="finish"]');

    // Track pause state
    let currentlyPaused = isPaused;

    // Pause/Resume handler
    pauseBtn.addEventListener('click', () => {
        if (currentlyPaused) {
            if (onResume) onResume();
        } else {
            if (onPause) onPause();
        }
    });

    // Stop handler
    stopBtn.addEventListener('click', () => {
        if (onStop) onStop();
    });

    // Next handler
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (onNext) onNext();
        });
    }

    // Finish handler
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (onFinish) onFinish();
        });
    }

    // Update display method
    container.updateDisplay = (timeMs) => {
        display.textContent = formatTime(timeMs);
    };

    // Set paused state
    container.setPaused = (paused) => {
        currentlyPaused = paused;
        pauseBtn.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
        pauseBtn.innerHTML = paused ? `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 19,12 8,19"/>
            </svg>
        ` : `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14"/>
                <rect x="14" y="5" width="4" height="14"/>
            </svg>
        `;
    };

    // Update to show finish button (when reaching last block)
    container.setLastBlock = (isLast) => {
        const controls = container.querySelector('.stopwatch-controls');
        const existing = controls.querySelector('[data-action="next"], [data-action="finish"]');

        if (existing) {
            existing.remove();
        }

        const newBtn = document.createElement('button');
        newBtn.className = `stopwatch-btn ${isLast ? 'btn-finish' : 'btn-next'}`;
        newBtn.dataset.action = isLast ? 'finish' : 'next';
        newBtn.setAttribute('aria-label', isLast ? 'Finish workout' : 'Next exercise');
        newBtn.innerHTML = isLast ? `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" fill="none"/>
            </svg>
        ` : `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,4 15,12 5,20"/>
                <rect x="15" y="5" width="4" height="14"/>
            </svg>
        `;

        newBtn.addEventListener('click', () => {
            if (isLast) {
                if (onFinish) onFinish();
            } else {
                if (onNext) onNext();
            }
        });

        controls.appendChild(newBtn);
    };

    return container;
}

/**
 * Create a simple time display (no controls)
 * @param {number} timeMs - Time in milliseconds
 * @param {string} label - Optional label
 * @returns {HTMLElement} Display element
 */
export function createTimeDisplay(timeMs, label = '') {
    const container = document.createElement('div');
    container.className = 'total-time-display';
    container.innerHTML = `
        <div class="total-time-value">${formatTime(timeMs, false)}</div>
        ${label ? `<div class="total-time-label">${label}</div>` : ''}
    `;
    return container;
}
