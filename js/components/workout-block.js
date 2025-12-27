/**
 * Workout Block Component
 * Renders individual workout exercise blocks
 */

import { formatTime } from '../utils.js';
import { getBlockDetails } from '../exercises.js';

/**
 * Create a workout block element
 * @param {Object} block - Block data
 * @param {number} index - Block index
 * @param {Object} options - Display options
 * @returns {HTMLElement} Block element
 */
export function createWorkoutBlock(block, index, options = {}) {
    const {
        isActive = false,
        isCompleted = false,
        time = null,
        showIndex = true
    } = options;

    const container = document.createElement('div');
    container.className = `workout-block ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
    container.dataset.blockIndex = index;

    const details = getBlockDetails(block);
    const formattedTime = time !== null ? formatTime(time, false) : '--:--';

    // Determine block label
    let blockLabel = '';
    if (showIndex) {
        if (block.type === 'run') {
            blockLabel = `RUN ${Math.floor(index / 2) + 1}`;
        } else if (block.type === 'exercise') {
            blockLabel = `EXERCISE ${Math.ceil((index + 1) / 2)}`;
        } else {
            blockLabel = `BLOCK ${index + 1}`;
        }
    }

    container.innerHTML = `
        <div class="block-header">
            <div class="block-info">
                ${blockLabel ? `<div class="block-index">${blockLabel}</div>` : ''}
                <div class="block-title">${block.label}</div>
                ${details ? `<div class="block-details">${details}</div>` : ''}
            </div>
            <div class="block-time">
                <div class="block-time-value" data-time-display>${formattedTime}</div>
                <div class="block-time-label">${isCompleted ? 'Completed' : isActive ? 'Current' : ''}</div>
            </div>
        </div>
    `;

    return container;
}

/**
 * Update block time display
 * @param {HTMLElement} blockElement - Block element
 * @param {number} timeMs - Time in milliseconds
 */
export function updateBlockTime(blockElement, timeMs) {
    const timeDisplay = blockElement.querySelector('[data-time-display]');
    if (timeDisplay) {
        timeDisplay.textContent = formatTime(timeMs, false);
    }
}

/**
 * Mark block as active
 * @param {HTMLElement} blockElement - Block element
 */
export function setBlockActive(blockElement) {
    blockElement.classList.add('active');
    blockElement.classList.remove('completed');
    const label = blockElement.querySelector('.block-time-label');
    if (label) label.textContent = 'Current';
}

/**
 * Mark block as completed
 * @param {HTMLElement} blockElement - Block element
 * @param {number} timeMs - Completion time
 */
export function setBlockCompleted(blockElement, timeMs) {
    blockElement.classList.remove('active');
    blockElement.classList.add('completed');
    updateBlockTime(blockElement, timeMs);
    const label = blockElement.querySelector('.block-time-label');
    if (label) label.textContent = 'Completed';
}

/**
 * Create workout block list
 * @param {Array} blocks - Array of block data
 * @param {Object} options - List options
 * @returns {HTMLElement} Blocks container
 */
export function createWorkoutBlockList(blocks, options = {}) {
    const {
        activeIndex = -1,
        blockTimes = [],
        showIndex = true
    } = options;

    const container = document.createElement('div');
    container.className = 'blocks-container';

    blocks.forEach((block, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex || (blockTimes[index] !== null && blockTimes[index] !== undefined);
        const time = blockTimes[index] || null;

        const blockElement = createWorkoutBlock(block, index, {
            isActive,
            isCompleted,
            time,
            showIndex
        });

        container.appendChild(blockElement);
    });

    return container;
}

/**
 * Scroll to active block
 * @param {HTMLElement} container - Blocks container
 * @param {number} activeIndex - Active block index
 */
export function scrollToActiveBlock(container, activeIndex) {
    const activeBlock = container.querySelector(`[data-block-index="${activeIndex}"]`);
    if (activeBlock) {
        activeBlock.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}
