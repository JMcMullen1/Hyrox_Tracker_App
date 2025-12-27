/**
 * Dashboard Screen
 * Shows overview of workout data, PBs, and weekly stats
 */

import { createToggle } from '../components/toggle.js';
import { getAllPersonalBests, getSimPB, getAllWorkoutSessions } from '../db.js';
import { formatTime, formatLongTime, isThisWeek } from '../utils.js';
import { getExerciseOrder, EXERCISE_DISPLAY_NAMES, HYROX_SIM_BLOCKS } from '../exercises.js';
import { navigate } from '../router.js';

let currentCategory = 'amateur';
let dashboardContainer = null;

/**
 * Render the dashboard screen
 * @returns {HTMLElement} Dashboard element
 */
export function render() {
    const container = document.createElement('div');
    container.className = 'screen dashboard-screen';
    dashboardContainer = container;

    // Toggle component
    const toggle = createToggle({
        screen: 'dashboard',
        onChange: async (value) => {
            currentCategory = value;
            await renderDashboardContent();
        }
    });
    container.appendChild(toggle);

    // Content container (will be populated async)
    const content = document.createElement('div');
    content.id = 'dashboard-content';
    container.appendChild(content);

    return container;
}

/**
 * Called after render
 */
export async function onMount() {
    await renderDashboardContent();
}

/**
 * Render dashboard content based on current category
 */
async function renderDashboardContent() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Get data
        const [pbs, simPB, sessions] = await Promise.all([
            getAllPersonalBests(currentCategory),
            getSimPB(currentCategory),
            getAllWorkoutSessions()
        ]);

        // Filter sessions for current category and this week
        const categorySessions = sessions.filter(s => s.category === currentCategory);
        const weekSessions = categorySessions.filter(s => isThisWeek(s.startedAt));

        // Calculate weekly stats
        const weeklyWorkouts = weekSessions.length;
        const weeklyTotalTime = weekSessions.reduce((sum, s) => sum + (s.totalTimeMs || 0), 0);
        const weeklyBestTime = weekSessions
            .filter(s => s.mode === 'sim')
            .reduce((best, s) => {
                if (!best || s.totalTimeMs < best) return s.totalTimeMs;
                return best;
            }, null);

        // Build content
        let html = '';

        // Logo display
        html += `
            <div class="card text-center" style="padding: 24px;">
                <img src="icons/Hyox_App_logo.png" alt="Hyrox Tracker" style="max-width: 200px; height: auto;">
            </div>
        `;

        // Full Sim PB Card
        html += `
            <div class="pb-card">
                <div class="pb-title">Full Sim Personal Best (${currentCategory === 'pro' ? 'Pro' : 'Amateur'})</div>
                <div class="pb-value">${simPB ? formatLongTime(simPB) : '--:--:--'}</div>
            </div>
        `;

        // Weekly Stats
        html += `
            <div class="weekly-stats">
                <div class="weekly-stats-header">
                    <div class="weekly-stats-title">This Week</div>
                </div>
                <div class="weekly-stats-grid">
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyWorkouts}</div>
                        <div class="weekly-stat-label">Workouts</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyTotalTime > 0 ? formatLongTime(weeklyTotalTime) : '--'}</div>
                        <div class="weekly-stat-label">Total Time</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyBestTime ? formatLongTime(weeklyBestTime) : '--'}</div>
                        <div class="weekly-stat-label">Best Sim</div>
                    </div>
                </div>
            </div>
        `;

        // Exercise PBs
        const exerciseOrder = getExerciseOrder();
        let sumOfPBs = 0;
        let hasAnyPB = false;

        let exercisesHtml = '';
        exerciseOrder.forEach(exerciseId => {
            const pbTime = pbs[exerciseId];
            const displayName = EXERCISE_DISPLAY_NAMES[exerciseId] || exerciseId;

            if (pbTime) {
                sumOfPBs += pbTime;
                hasAnyPB = true;
            }

            exercisesHtml += `
                <div class="exercise-item">
                    <span class="exercise-name">${displayName}</span>
                    <span class="exercise-pb">${pbTime ? formatTime(pbTime, false) : '--:--'}</span>
                </div>
            `;
        });

        html += `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Exercise Personal Bests</h3>
                </div>
                <div class="exercise-list">
                    ${exercisesHtml}
                </div>
                ${hasAnyPB ? `
                    <div class="sum-pbs-card">
                        <div class="sum-pbs-label">Sum of PBs</div>
                        <div class="sum-pbs-value">${formatLongTime(sumOfPBs)}</div>
                    </div>
                ` : ''}
            </div>
        `;

        // Quick Actions
        html += `
            <div class="stats-grid mt-md">
                <button class="btn btn-primary" id="btn-start-sim">Start Full Sim</button>
                <button class="btn btn-secondary" id="btn-custom">Custom Workout</button>
            </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('btn-start-sim')?.addEventListener('click', () => {
            navigate('full-sim');
        });

        document.getElementById('btn-custom')?.addEventListener('click', () => {
            navigate('custom');
        });

    } catch (error) {
        console.error('Error rendering dashboard:', error);
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">!</div>
                <div class="empty-state-title">Error loading data</div>
                <div class="empty-state-text">Please try refreshing the app.</div>
            </div>
        `;
    }
}
