/**
 * Custom Workout Screen
 * Build and run custom workouts
 */

import { createToggle } from '../components/toggle.js';
import { createWorkoutBlockList, setBlockActive, setBlockCompleted, scrollToActiveBlock } from '../components/workout-block.js';
import { createStopwatch } from '../components/stopwatch.js';
import { createResultsView, createSeeResultsButton } from '../components/results-card.js';
import { showStopWorkoutModal, prompt, confirm, confirmDelete } from '../components/modal.js';
import { CUSTOM_EXERCISE_OPTIONS, getCanonicalExerciseId } from '../exercises.js';
import { generateId, deepClone, showToast, sanitizeHTML } from '../utils.js';
import { navigate } from '../router.js';
import {
    initTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    nextBlock,
    finishWorkout,
    onTick,
    onBlockComplete,
    onWorkoutComplete,
    getCurrentElapsed,
    getCurrentBlockIndex,
    getBlockTimes,
    isPaused,
    isLastBlock,
    clearStoredTimerState
} from '../timer.js';
import {
    saveWorkoutSession,
    saveWorkoutTemplate,
    getAllWorkoutTemplates,
    deleteWorkoutTemplate,
    updatePersonalBest,
    getAllPersonalBests,
    getToggleSetting
} from '../db.js';

let container = null;
let currentCategory = 'amateur';
let workoutBlocks = [];
let workoutActive = false;
let workoutComplete = false;
let currentWorkout = null;
let blocksContainer = null;
let stopwatchComponent = null;

// Template editing state
let editingTemplateId = null;
let editingTemplateName = null;

/**
 * Render the custom workout screen
 * @returns {HTMLElement} Screen element
 */
export function render() {
    container = document.createElement('div');
    container.className = 'screen custom-screen';

    return container;
}

/**
 * Called after render
 */
export async function onMount() {
    currentCategory = await getToggleSetting('custom');

    if (workoutActive || workoutComplete) {
        renderActiveWorkout();
    } else {
        await renderBuilderView();
    }
}

/**
 * Render builder view
 */
async function renderBuilderView() {
    workoutActive = false;
    workoutComplete = false;
    container.innerHTML = '';

    // Toggle
    const toggle = createToggle({
        screen: 'custom',
        onChange: async (value) => {
            currentCategory = value;
            renderBlocksBuilder();
            await renderTemplates();
        }
    });
    container.appendChild(toggle);

    // Saved Templates Section
    const templatesSection = document.createElement('div');
    templatesSection.className = 'templates-section';
    templatesSection.id = 'templates-section';
    container.appendChild(templatesSection);

    await renderTemplates();

    // Builder Section Title
    const builderTitle = document.createElement('div');
    builderTitle.className = 'section-header';
    builderTitle.innerHTML = '<h3 class="section-title">Build Workout</h3>';
    container.appendChild(builderTitle);

    // Blocks builder container
    const blocksBuilder = document.createElement('div');
    blocksBuilder.id = 'blocks-builder';
    container.appendChild(blocksBuilder);

    renderBlocksBuilder();

    // Add Block Button
    const addBlockBtn = document.createElement('button');
    addBlockBtn.className = 'add-block-btn';
    addBlockBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Block
    `;
    addBlockBtn.addEventListener('click', addBlock);
    container.appendChild(addBlockBtn);

    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'action-buttons mt-md';
    actions.id = 'action-buttons';
    container.appendChild(actions);

    await renderActionButtons();
}

/**
 * Render action buttons based on editing state
 */
async function renderActionButtons() {
    const actions = document.getElementById('action-buttons');
    if (!actions) return;

    // Get templates for the load dropdown
    const templates = await getAllWorkoutTemplates();
    const categoryTemplates = templates.filter(t => t.category === currentCategory);

    if (editingTemplateId) {
        // Editing a template - show update and save as new options
        actions.innerHTML = `
            <div class="template-actions-row">
                <button class="btn btn-secondary" id="btn-update-template">Update Template</button>
                <button class="btn btn-outline" id="btn-save-as-new">Save as New</button>
            </div>
            <button class="btn btn-primary btn-full mt-md" id="btn-start-custom" ${workoutBlocks.length === 0 ? 'disabled' : ''}>Start Workout</button>
        `;

        document.getElementById('btn-update-template')?.addEventListener('click', updateTemplate);
        document.getElementById('btn-save-as-new')?.addEventListener('click', saveAsNewTemplate);
    } else {
        // Not editing - show regular save and load template options
        actions.innerHTML = `
            <div class="stats-grid">
                <button class="btn btn-secondary" id="btn-save-template">Save Template</button>
                <div class="load-dropdown-container">
                    <button class="btn btn-outline" id="btn-load-template" ${categoryTemplates.length === 0 ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Load
                    </button>
                    <div class="load-dropdown-menu" id="load-dropdown-menu">
                        ${categoryTemplates.length === 0 ?
                            '<div class="load-dropdown-empty">No saved templates</div>' :
                            categoryTemplates.map(t => `
                                <button class="load-dropdown-item" data-template-id="${t.id}">
                                    <span class="load-dropdown-item-name">${sanitizeHTML(t.name)}</span>
                                    <span class="load-dropdown-item-meta">${t.blocks.length} exercise${t.blocks.length !== 1 ? 's' : ''}</span>
                                </button>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
            <button class="btn btn-primary btn-full mt-md" id="btn-start-custom" ${workoutBlocks.length === 0 ? 'disabled' : ''}>Start Workout</button>
        `;

        document.getElementById('btn-save-template')?.addEventListener('click', saveAsTemplate);

        // Load dropdown functionality
        const loadBtn = document.getElementById('btn-load-template');
        const loadMenu = document.getElementById('load-dropdown-menu');

        loadBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            loadMenu?.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.load-dropdown-container')) {
                loadMenu?.classList.remove('open');
            }
        });

        // Handle template selection from dropdown
        loadMenu?.querySelectorAll('.load-dropdown-item').forEach(item => {
            item.addEventListener('click', async () => {
                const templateId = item.dataset.templateId;
                const template = categoryTemplates.find(t => t.id === templateId);
                if (template) {
                    loadMenu.classList.remove('open');
                    await loadTemplateForEditing(template);
                }
            });
        });
    }

    document.getElementById('btn-start-custom')?.addEventListener('click', startWorkout);
}

/**
 * Render saved templates
 */
async function renderTemplates() {
    const section = document.getElementById('templates-section');
    if (!section) return;

    const templates = await getAllWorkoutTemplates();
    const categoryTemplates = templates.filter(t => t.category === currentCategory);

    if (categoryTemplates.length === 0) {
        section.innerHTML = '';
        return;
    }

    section.innerHTML = `
        <div class="templates-header">
            <div class="templates-title">Saved Templates</div>
        </div>
        ${categoryTemplates.map(t => `
            <div class="template-card ${editingTemplateId === t.id ? 'editing' : ''}" data-template-id="${t.id}">
                <div class="template-info">
                    <div class="template-name">${sanitizeHTML(t.name)}</div>
                    <div class="template-meta">${t.blocks.length} exercise${t.blocks.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="template-actions">
                    <button class="btn-icon" data-action="edit" title="Load & Edit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon danger" data-action="delete" title="Delete template">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('')}
    `;

    // Add event listeners
    section.querySelectorAll('.template-card').forEach(card => {
        const templateId = card.dataset.templateId;

        card.querySelector('[data-action="edit"]')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const template = categoryTemplates.find(t => t.id === templateId);
            if (template) {
                await loadTemplateForEditing(template);
            }
        });

        card.querySelector('[data-action="delete"]')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const template = categoryTemplates.find(t => t.id === templateId);
            if (template && await confirmDelete(template.name)) {
                await deleteWorkoutTemplate(templateId);
                // Clear editing state if we deleted the template being edited
                if (editingTemplateId === templateId) {
                    clearEditingState();
                }
                await renderTemplates();
                showToast('Template deleted', 'success');
            }
        });
    });
}

/**
 * Load a template for editing
 */
async function loadTemplateForEditing(template) {
    editingTemplateId = template.id;
    editingTemplateName = template.name;
    workoutBlocks = deepClone(template.blocks);
    renderBlocksBuilder();
    renderEditingBanner();
    await renderTemplates();
    await renderActionButtons();
    showToast(`Loaded "${template.name}" for editing`, 'success');
}

/**
 * Clear the editing state
 */
function clearEditingState() {
    editingTemplateId = null;
    editingTemplateName = null;
}

/**
 * Render editing banner when a template is loaded
 */
function renderEditingBanner() {
    // Remove existing banner if any
    const existingBanner = document.querySelector('.editing-banner');
    if (existingBanner) {
        existingBanner.remove();
    }

    if (!editingTemplateId) return;

    const builderTitle = container.querySelector('.section-header');
    if (!builderTitle) return;

    const banner = document.createElement('div');
    banner.className = 'editing-banner';
    banner.innerHTML = `
        <div class="editing-banner-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Editing: <strong>${sanitizeHTML(editingTemplateName)}</strong></span>
        </div>
        <button class="editing-banner-close" title="Clear and start fresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    banner.querySelector('.editing-banner-close')?.addEventListener('click', () => {
        clearEditingState();
        workoutBlocks = [];
        renderBlocksBuilder();
        renderEditingBanner();
        renderTemplates();
        showToast('Cleared workout', 'success');
    });

    builderTitle.insertAdjacentElement('afterend', banner);
}

/**
 * Render blocks builder
 */
function renderBlocksBuilder() {
    const builder = document.getElementById('blocks-builder');
    if (!builder) return;

    if (workoutBlocks.length === 0) {
        builder.innerHTML = `
            <div class="empty-state" style="padding: 32px;">
                <div class="empty-state-text">No exercises added yet.<br>Click "Add Block" to start building your workout.</div>
            </div>
        `;
        return;
    }

    builder.innerHTML = '';

    workoutBlocks.forEach((block, index) => {
        const blockEl = createBuilderBlock(block, index);
        builder.appendChild(blockEl);
    });

    updateStartButton();
}

/**
 * Create a builder block element
 */
function createBuilderBlock(block, index) {
    const div = document.createElement('div');
    div.className = 'builder-block';
    div.dataset.blockIndex = index;

    const options = CUSTOM_EXERCISE_OPTIONS[currentCategory];

    div.innerHTML = `
        <div class="builder-block-header">
            <span class="builder-block-number">Block ${index + 1}</span>
            <div class="builder-block-controls">
                ${index > 0 ? `
                    <button class="btn-icon" data-action="move-up" title="Move up">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                ` : ''}
                ${index < workoutBlocks.length - 1 ? `
                    <button class="btn-icon" data-action="move-down" title="Move down">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                ` : ''}
                <button class="btn-icon danger" data-action="delete" title="Delete block">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Exercise</label>
            <select class="form-select" data-field="exercise">
                ${options.map(opt => `
                    <option value="${opt.id}" ${block.id === opt.id ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
            </select>
        </div>

        ${block.id === 'run_custom' ? `
            <div class="form-group">
                <label class="form-label">Distance (metres)</label>
                <input type="number" class="form-input" data-field="distance" value="${block.distance || 1000}" min="100" step="100">
            </div>
        ` : ''}

        ${block.id === 'custom' ? `
            <div class="form-group">
                <label class="form-label">Exercise Name</label>
                <input type="text" class="form-input" data-field="customName" value="${block.customName || ''}" placeholder="Enter exercise name">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Distance (m)</label>
                    <input type="number" class="form-input" data-field="customDistance" value="${block.customDistance || ''}" placeholder="Optional">
                </div>
                <div class="form-group">
                    <label class="form-label">Weight (kg)</label>
                    <input type="number" class="form-input" data-field="customWeight" value="${block.customWeight || ''}" placeholder="Optional">
                </div>
            </div>
        ` : ''}
    `;

    // Event listeners
    const exerciseSelect = div.querySelector('[data-field="exercise"]');
    exerciseSelect?.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const option = options.find(o => o.id === selectedId);

        if (option) {
            workoutBlocks[index] = {
                ...option,
                distance: option.distance || 1000
            };
            renderBlocksBuilder();
        }
    });

    const distanceInput = div.querySelector('[data-field="distance"]');
    distanceInput?.addEventListener('change', (e) => {
        workoutBlocks[index].distance = parseInt(e.target.value) || 1000;
        updateBlockLabel(index);
    });

    const customNameInput = div.querySelector('[data-field="customName"]');
    customNameInput?.addEventListener('change', (e) => {
        workoutBlocks[index].customName = e.target.value;
        workoutBlocks[index].label = e.target.value || 'Custom Exercise';
    });

    const customDistanceInput = div.querySelector('[data-field="customDistance"]');
    customDistanceInput?.addEventListener('change', (e) => {
        workoutBlocks[index].customDistance = e.target.value ? parseInt(e.target.value) : null;
    });

    const customWeightInput = div.querySelector('[data-field="customWeight"]');
    customWeightInput?.addEventListener('change', (e) => {
        workoutBlocks[index].customWeight = e.target.value ? parseInt(e.target.value) : null;
    });

    div.querySelector('[data-action="move-up"]')?.addEventListener('click', () => {
        moveBlock(index, -1);
    });

    div.querySelector('[data-action="move-down"]')?.addEventListener('click', () => {
        moveBlock(index, 1);
    });

    div.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        workoutBlocks.splice(index, 1);
        renderBlocksBuilder();
    });

    return div;
}

/**
 * Add a new block
 */
function addBlock() {
    const options = CUSTOM_EXERCISE_OPTIONS[currentCategory];
    const defaultOption = options[0];

    workoutBlocks.push({
        ...deepClone(defaultOption),
        distance: defaultOption.distance || 1000
    });

    renderBlocksBuilder();
}

/**
 * Move a block up or down
 */
function moveBlock(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= workoutBlocks.length) return;

    const temp = workoutBlocks[index];
    workoutBlocks[index] = workoutBlocks[newIndex];
    workoutBlocks[newIndex] = temp;

    renderBlocksBuilder();
}

/**
 * Update block label based on settings
 */
function updateBlockLabel(index) {
    const block = workoutBlocks[index];
    if (block.id === 'run_custom') {
        block.label = `Run – ${block.distance}m`;
    }
}

/**
 * Update start button state
 */
function updateStartButton() {
    const btn = document.getElementById('btn-start-custom');
    if (btn) {
        btn.disabled = workoutBlocks.length === 0;
    }
}

/**
 * Save current blocks as template
 */
async function saveAsTemplate() {
    if (workoutBlocks.length === 0) {
        showToast('Add some exercises first!', 'error');
        return;
    }

    const name = await prompt('Save Template', 'Enter a name for this workout template:', '', 'Template name');

    if (name) {
        const newTemplateId = generateId();
        await saveWorkoutTemplate({
            id: newTemplateId,
            name: name.trim(),
            category: currentCategory,
            blocks: deepClone(workoutBlocks),
            createdAt: new Date().toISOString()
        });

        // Set as the template we're now editing
        editingTemplateId = newTemplateId;
        editingTemplateName = name.trim();

        await renderTemplates();
        renderEditingBanner();
        await renderActionButtons();
        showToast('Template saved!', 'success');
    }
}

/**
 * Update the currently editing template
 */
async function updateTemplate() {
    if (workoutBlocks.length === 0) {
        showToast('Add some exercises first!', 'error');
        return;
    }

    if (!editingTemplateId) {
        showToast('No template selected to update', 'error');
        return;
    }

    // Optionally allow renaming during update
    const newName = await prompt(
        'Update Template',
        'Update the template name or keep it the same:',
        editingTemplateName,
        'Template name'
    );

    if (newName !== null) {
        await saveWorkoutTemplate({
            id: editingTemplateId,
            name: newName.trim() || editingTemplateName,
            category: currentCategory,
            blocks: deepClone(workoutBlocks),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        editingTemplateName = newName.trim() || editingTemplateName;

        await renderTemplates();
        renderEditingBanner();
        showToast('Template updated!', 'success');
    }
}

/**
 * Save current blocks as a new template (copy)
 */
async function saveAsNewTemplate() {
    if (workoutBlocks.length === 0) {
        showToast('Add some exercises first!', 'error');
        return;
    }

    const suggestedName = editingTemplateName ? `${editingTemplateName} (copy)` : '';
    const name = await prompt('Save as New Template', 'Enter a name for this new template:', suggestedName, 'Template name');

    if (name) {
        const newTemplateId = generateId();
        await saveWorkoutTemplate({
            id: newTemplateId,
            name: name.trim(),
            category: currentCategory,
            blocks: deepClone(workoutBlocks),
            createdAt: new Date().toISOString()
        });

        // Switch to editing the new template
        editingTemplateId = newTemplateId;
        editingTemplateName = name.trim();

        await renderTemplates();
        renderEditingBanner();
        await renderActionButtons();
        showToast('Saved as new template!', 'success');
    }
}

/**
 * Start the custom workout
 */
function startWorkout() {
    if (workoutBlocks.length === 0) return;

    // Prepare blocks with proper labels
    const blocks = workoutBlocks.map((block, i) => {
        const prepared = deepClone(block);

        // Update labels for display
        if (block.id === 'run_custom') {
            prepared.label = `Run – ${block.distance}m`;
        } else if (block.id === 'custom') {
            prepared.label = block.customName || 'Custom Exercise';
            if (block.customDistance) {
                prepared.distance = `${block.customDistance}m`;
            }
            if (block.customWeight) {
                prepared.weight = `${block.customWeight}kg`;
            }
        }

        return prepared;
    });

    const workoutId = generateId();

    currentWorkout = {
        id: workoutId,
        mode: 'custom',
        category: currentCategory,
        blocks: blocks,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        blockTimesMs: [],
        totalTimeMs: 0
    };

    // Initialize timer
    initTimer({
        workoutId,
        mode: 'custom',
        category: currentCategory,
        blocks
    });

    // Set up callbacks
    onTick((elapsed) => {
        if (stopwatchComponent) {
            stopwatchComponent.updateDisplay(elapsed);
        }
    });

    onBlockComplete((blockIndex, timeMs) => {
        currentWorkout.blockTimesMs[blockIndex] = timeMs;

        const blockEl = blocksContainer?.querySelector(`[data-block-index="${blockIndex}"]`);
        if (blockEl) {
            setBlockCompleted(blockEl, timeMs);
        }

        const nextIndex = blockIndex + 1;
        if (nextIndex < blocks.length) {
            const nextBlockEl = blocksContainer?.querySelector(`[data-block-index="${nextIndex}"]`);
            if (nextBlockEl) {
                setBlockActive(nextBlockEl);
                scrollToActiveBlock(blocksContainer, nextIndex);
            }

            if (stopwatchComponent && nextIndex === blocks.length - 1) {
                stopwatchComponent.setLastBlock(true);
            }
        }
    });

    onWorkoutComplete(async (blockTimes, totalTime) => {
        currentWorkout.blockTimesMs = blockTimes;
        currentWorkout.totalTimeMs = totalTime;
        currentWorkout.finishedAt = new Date().toISOString();

        workoutActive = false;
        workoutComplete = true;

        await saveWorkoutSession(currentWorkout);
        await updatePBs();
        await clearStoredTimerState();

        renderCompletionView();
    });

    workoutActive = true;
    renderActiveWorkout();
    startTimer();
}

/**
 * Render active workout view
 */
function renderActiveWorkout() {
    container.innerHTML = '';

    const blocks = currentWorkout.blocks;
    const currentIndex = getCurrentBlockIndex();
    const blockTimes = getBlockTimes();

    // Title
    const header = document.createElement('div');
    header.className = 'section-header mb-md';
    header.innerHTML = `
        <h2 class="section-title">Custom Workout</h2>
        <span class="history-item-badge ${currentCategory}">${currentCategory}</span>
    `;
    container.appendChild(header);

    // Blocks
    blocksContainer = createWorkoutBlockList(blocks, {
        activeIndex: currentIndex,
        blockTimes: blockTimes,
        showIndex: false
    });
    container.appendChild(blocksContainer);

    // Stopwatch
    stopwatchComponent = createStopwatch({
        isLastBlock: isLastBlock(),
        isPaused: isPaused(),
        onPause: () => {
            pauseTimer();
            stopwatchComponent.setPaused(true);
        },
        onResume: () => {
            resumeTimer();
            stopwatchComponent.setPaused(false);
        },
        onStop: async () => {
            const action = await showStopWorkoutModal();
            if (action === 'discard') {
                await stopTimer(true);
                workoutActive = false;
                currentWorkout = null;
                await renderBuilderView();
            }
        },
        onNext: () => {
            nextBlock();
        },
        onFinish: () => {
            finishWorkout();
        }
    });

    stopwatchComponent.updateDisplay(getCurrentElapsed());
    stopwatchComponent.setPaused(isPaused());

    container.appendChild(stopwatchComponent);
    scrollToActiveBlock(blocksContainer, currentIndex);
}

/**
 * Render completion view
 */
async function renderCompletionView() {
    container.innerHTML = '';

    const pbs = await getAllPersonalBests(currentCategory);

    const completionDiv = document.createElement('div');
    completionDiv.className = 'text-center';
    completionDiv.style.padding = '48px 16px';

    completionDiv.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 24px;">💪</div>
        <h2 style="color: var(--color-gold); margin-bottom: 8px;">Workout Complete!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 32px;">Great custom workout!</p>
    `;

    const seeResultsBtn = createSeeResultsButton(() => {
        container.innerHTML = '';
        const resultsView = createResultsView(currentWorkout, pbs);
        container.appendChild(resultsView);

        const doneBtn = document.createElement('button');
        doneBtn.className = 'btn btn-primary btn-full mt-md';
        doneBtn.textContent = 'Done';
        doneBtn.addEventListener('click', async () => {
            workoutComplete = false;
            currentWorkout = null;
            workoutBlocks = [];
            clearEditingState();
            navigate('dashboard');
        });
        container.appendChild(doneBtn);
    });

    completionDiv.appendChild(seeResultsBtn);
    container.appendChild(completionDiv);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn btn-secondary btn-full mt-md';
    newBtn.textContent = 'Build Another Workout';
    newBtn.addEventListener('click', async () => {
        workoutComplete = false;
        currentWorkout = null;
        workoutBlocks = [];
        clearEditingState();
        await renderBuilderView();
    });
    container.appendChild(newBtn);
}

/**
 * Update personal bests from completed workout
 */
async function updatePBs() {
    if (!currentWorkout) return;

    const { blocks, blockTimesMs, category } = currentWorkout;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const time = blockTimesMs[i];

        if (time) {
            const exerciseId = getCanonicalExerciseId(block, category);
            if (exerciseId) {
                await updatePersonalBest(category, exerciseId, time);
            }
        }
    }
}
