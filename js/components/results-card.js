/**
 * Results Card Component
 * Displays workout results with navigation between screens/cards
 */

import { formatTime, formatLongTime, calculateDelta } from '../utils.js';
import { EXERCISE_DISPLAY_NAMES, getCanonicalExerciseId } from '../exercises.js';
import { getAllPersonalBests, getSimPB } from '../db.js';

/**
 * Create results view with multiple cards/screens
 * @param {Object} workout - Completed workout data
 * @param {Object} pbs - Personal bests for comparison
 * @returns {HTMLElement} Results container
 */
export function createResultsView(workout, pbs = {}) {
    const container = document.createElement('div');
    container.className = 'results-container';

    // Build cards array
    const cards = [];

    // Card 1: Exercise Times
    cards.push(createExerciseTimesCard(workout));

    // Card 2: Total Time
    cards.push(createTotalTimeCard(workout, pbs));

    // Card 3+: PB Comparisons per exercise
    workout.blocks.forEach((block, index) => {
        const exerciseId = getCanonicalExerciseId(block, workout.category);
        if (exerciseId && pbs[exerciseId]) {
            cards.push(createComparisonCard(block, workout.blockTimesMs[index], pbs[exerciseId], workout.category));
        }
    });

    // Current card index
    let currentIndex = 0;

    // Create header
    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = `
        <h1 class="results-title">Workout Complete!</h1>
        <p class="results-subtitle">${workout.mode === 'sim' ? 'Full Hyrox Simulation' : 'Custom Workout'}</p>
    `;
    container.appendChild(header);

    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'results-card';
    container.appendChild(cardContainer);

    // Create navigation
    const nav = document.createElement('div');
    nav.className = 'results-nav';
    nav.innerHTML = `
        <button class="results-nav-btn" data-action="prev" ${currentIndex === 0 ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>
        <div class="results-dots">
            ${cards.map((_, i) => `<div class="results-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
        </div>
        <button class="results-nav-btn" data-action="next" ${currentIndex === cards.length - 1 ? 'disabled' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
    `;
    container.appendChild(nav);

    const prevBtn = nav.querySelector('[data-action="prev"]');
    const nextBtn = nav.querySelector('[data-action="next"]');
    const dots = nav.querySelectorAll('.results-dot');

    // Render current card
    const renderCard = () => {
        cardContainer.innerHTML = '';
        cardContainer.appendChild(cards[currentIndex]);

        // Update navigation state
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === cards.length - 1;

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    };

    // Navigation handlers
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderCard();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            renderCard();
        }
    });

    // Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    cardContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    cardContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    const handleSwipe = () => {
        const threshold = 50;
        const diff = touchStartX - touchEndX;

        if (diff > threshold && currentIndex < cards.length - 1) {
            currentIndex++;
            renderCard();
        } else if (diff < -threshold && currentIndex > 0) {
            currentIndex--;
            renderCard();
        }
    };

    // Initial render
    renderCard();

    return container;
}

/**
 * Create exercise times card
 */
function createExerciseTimesCard(workout) {
    const card = document.createElement('div');
    card.innerHTML = `
        <div class="results-card-title">Exercise Times</div>
        <div class="exercise-list">
            ${workout.blocks.map((block, index) => `
                <div class="exercise-item">
                    <span class="exercise-name">${block.label}</span>
                    <span class="exercise-pb">${formatTime(workout.blockTimesMs[index], false)}</span>
                </div>
            `).join('')}
        </div>
    `;
    return card;
}

/**
 * Create total time card
 */
function createTotalTimeCard(workout, pbs) {
    const totalTime = workout.totalTimeMs;
    const simPB = pbs['full_sim_total'];
    const delta = simPB ? calculateDelta(totalTime, simPB) : null;

    const card = document.createElement('div');
    card.innerHTML = `
        <div class="results-card-title">Total Time</div>
        <div class="total-time-display">
            <div class="total-time-value">${formatLongTime(totalTime)}</div>
            ${workout.mode === 'sim' && simPB ? `
                <div class="total-time-label">
                    Personal Best: ${formatLongTime(simPB)}
                    ${delta ? `<span class="delta ${delta.type}">${delta.formatted}</span>` : ''}
                </div>
            ` : ''}
        </div>
    `;
    return card;
}

/**
 * Create comparison card for a single exercise
 */
function createComparisonCard(block, currentTime, pbTime, category) {
    const delta = calculateDelta(currentTime, pbTime);
    const displayName = EXERCISE_DISPLAY_NAMES[block.id] || block.label;

    const card = document.createElement('div');
    card.innerHTML = `
        <div class="results-card-title">${displayName}</div>
        <div style="text-align: center; padding: 20px 0;">
            <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">Current</div>
                    <div style="color: var(--color-gold); font-size: 32px; font-weight: 700; font-family: 'SF Mono', monospace;">
                        ${formatTime(currentTime, false)}
                    </div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">Personal Best</div>
                    <div style="color: var(--text-secondary); font-size: 32px; font-weight: 700; font-family: 'SF Mono', monospace;">
                        ${formatTime(pbTime, false)}
                    </div>
                </div>
            </div>
            <div class="delta ${delta.type}" style="font-size: 24px; padding: 12px 24px;">
                ${delta.formatted}
            </div>
        </div>
    `;
    return card;
}

/**
 * Create a comparison table for all exercises
 * @param {Object} workout - Workout data
 * @param {Object} pbs - Personal bests map
 * @returns {HTMLElement} Comparison table element
 */
export function createComparisonTable(workout, pbs = {}) {
    const container = document.createElement('div');
    container.className = 'comparison-table';

    container.innerHTML = `
        <div class="comparison-row header">
            <span>Exercise</span>
            <span>Time</span>
            <span>PB</span>
            <span>+/-</span>
        </div>
        ${workout.blocks.map((block, index) => {
            const exerciseId = getCanonicalExerciseId(block, workout.category);
            const pbTime = exerciseId ? pbs[exerciseId] : null;
            const currentTime = workout.blockTimesMs[index];
            const delta = pbTime ? calculateDelta(currentTime, pbTime) : { formatted: '-', type: 'neutral' };

            return `
                <div class="comparison-row">
                    <span class="comparison-exercise">${block.label}</span>
                    <span class="comparison-time comparison-current">${formatTime(currentTime, false)}</span>
                    <span class="comparison-time comparison-pb">${pbTime ? formatTime(pbTime, false) : '-'}</span>
                    <span class="delta ${delta.type}">${delta.formatted}</span>
                </div>
            `;
        }).join('')}
    `;

    return container;
}

/**
 * Create "See Results" button
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Button element
 */
export function createSeeResultsButton(onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-full btn-lg';
    btn.textContent = 'See Results';
    btn.addEventListener('click', onClick);
    return btn;
}
