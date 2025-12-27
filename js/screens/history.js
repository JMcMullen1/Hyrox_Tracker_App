/**
 * History Screen
 * Shows workout history with filters and detail views
 */

import { getAllWorkoutSessions, deleteWorkoutSession, getAllPersonalBests, recalculatePBsAfterDeletion } from '../db.js';
import { formatLongTime, formatDateTime, getRelativeTime, sanitizeHTML } from '../utils.js';
import { createResultsView } from '../components/results-card.js';
import { confirmDelete } from '../components/modal.js';
import { navigate } from '../router.js';
import { getCanonicalExerciseId } from '../exercises.js';
import { setRepeatWorkout } from './custom.js';

let container = null;
let currentFilter = 'all';
let sessions = [];

/**
 * Render the history screen
 * @returns {HTMLElement} Screen element
 */
export function render() {
    container = document.createElement('div');
    container.className = 'screen history-screen';

    return container;
}

/**
 * Called after render
 */
export async function onMount() {
    await renderHistoryList();
}

/**
 * Render history list view
 */
async function renderHistoryList() {
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        sessions = await getAllWorkoutSessions();

        container.innerHTML = '';

        // Filters
        const filters = document.createElement('div');
        filters.className = 'history-filters';
        filters.innerHTML = `
            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-btn ${currentFilter === 'sim' ? 'active' : ''}" data-filter="sim">Full Sim</button>
            <button class="filter-btn ${currentFilter === 'custom' ? 'active' : ''}" data-filter="custom">Custom</button>
            <button class="filter-btn ${currentFilter === 'amateur' ? 'active' : ''}" data-filter="amateur">Amateur</button>
            <button class="filter-btn ${currentFilter === 'pro' ? 'active' : ''}" data-filter="pro">Pro</button>
        `;
        container.appendChild(filters);

        // Filter click handlers
        filters.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter;
                filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderFilteredList();
            });
        });

        // List container
        const listContainer = document.createElement('div');
        listContainer.id = 'history-list';
        container.appendChild(listContainer);

        renderFilteredList();

    } catch (error) {
        console.error('Error loading history:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">!</div>
                <div class="empty-state-title">Error loading history</div>
                <div class="empty-state-text">Please try refreshing the app.</div>
            </div>
        `;
    }
}

/**
 * Render filtered list
 */
function renderFilteredList() {
    const listContainer = document.getElementById('history-list');
    if (!listContainer) return;

    let filtered = sessions;

    if (currentFilter === 'sim') {
        filtered = sessions.filter(s => s.mode === 'sim');
    } else if (currentFilter === 'custom') {
        filtered = sessions.filter(s => s.mode === 'custom');
    } else if (currentFilter === 'amateur') {
        filtered = sessions.filter(s => s.category === 'amateur');
    } else if (currentFilter === 'pro') {
        filtered = sessions.filter(s => s.category === 'pro');
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No workouts yet</div>
                <div class="empty-state-text">Complete a workout to see it here.</div>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filtered.map(session => {
        const title = session.mode === 'sim'
            ? `Full Hyrox ${session.category === 'pro' ? 'Pro' : 'Open'}`
            : 'Custom Workout';

        const exerciseCount = session.blocks?.length || 0;

        return `
            <div class="history-item" data-session-id="${session.id}">
                <div class="history-item-header">
                    <div>
                        <div class="history-item-title">${title}</div>
                        <div class="history-item-meta">
                            <span>${formatDateTime(session.startedAt)}</span>
                            <span>${exerciseCount} exercises</span>
                        </div>
                    </div>
                    <div class="history-item-time">${formatLongTime(session.totalTimeMs)}</div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                    <span class="history-item-badge ${session.category}">${session.category}</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon" data-action="repeat" title="Repeat this workout" style="opacity: 0.7;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17 1 21 5 17 9"></polyline>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                <polyline points="7 23 3 19 7 15"></polyline>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                            </svg>
                        </button>
                        <button class="btn-icon danger" data-action="delete" title="Delete workout" style="opacity: 0.5;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    listContainer.querySelectorAll('.history-item').forEach(item => {
        const sessionId = item.dataset.sessionId;

        item.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="delete"]')) return;
            if (e.target.closest('[data-action="repeat"]')) return;
            showSessionDetail(sessionId);
        });

        item.querySelector('[data-action="repeat"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                setRepeatWorkout(session);
                navigate('custom');
            }
        });

        item.querySelector('[data-action="delete"]')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const session = sessions.find(s => s.id === sessionId);
            if (session && await confirmDelete('this workout')) {
                await deleteWorkoutSession(sessionId);
                // Recalculate PBs from remaining workouts
                await recalculatePBsAfterDeletion(session.category, getCanonicalExerciseId);
                sessions = sessions.filter(s => s.id !== sessionId);
                renderFilteredList();
            }
        });
    });
}

/**
 * Show session detail view
 */
async function showSessionDetail(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    container.innerHTML = '';

    // Navigation buttons container
    const navButtons = document.createElement('div');
    navButtons.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.flex = '1';
    backBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back
    `;
    backBtn.addEventListener('click', () => renderHistoryList());
    navButtons.appendChild(backBtn);

    // Repeat button
    const repeatBtn = document.createElement('button');
    repeatBtn.className = 'btn btn-primary';
    repeatBtn.style.flex = '1';
    repeatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
        Repeat Workout
    `;
    repeatBtn.addEventListener('click', () => {
        setRepeatWorkout(session);
        navigate('custom');
    });
    navButtons.appendChild(repeatBtn);

    container.appendChild(navButtons);

    // Session info
    const infoCard = document.createElement('div');
    infoCard.className = 'card';
    infoCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    ${session.mode === 'sim' ? 'Full Hyrox Simulation' : 'Custom Workout'}
                </div>
                <div style="color: var(--text-muted); font-size: 14px;">
                    ${formatDateTime(session.startedAt)}
                </div>
            </div>
            <span class="history-item-badge ${session.category}">${session.category}</span>
        </div>
    `;
    container.appendChild(infoCard);

    // Use stored previous PBs from session (for accurate comparison against PBs at time of workout)
    // Fall back to current PBs for older workouts that don't have stored PBs
    const pbs = session.previousPBs || await getAllPersonalBests(session.category);

    // Results view
    const resultsView = createResultsView(session, pbs);
    container.appendChild(resultsView);
}
