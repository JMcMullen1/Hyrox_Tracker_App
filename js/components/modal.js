/**
 * Modal Component
 * Reusable modal dialog
 */

let modalContainer = null;

/**
 * Initialize modal container
 */
export function initModal() {
    modalContainer = document.getElementById('modal-container');
}

/**
 * Show a modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.body - Modal body content (HTML string)
 * @param {Array} options.actions - Array of action buttons
 * @returns {Promise<string>} Resolves with the action key that was clicked
 */
export function showModal(options) {
    return new Promise((resolve) => {
        const { title, body, actions = [] } = options;

        const modal = document.createElement('div');
        modal.className = 'modal';

        const actionsHTML = actions.map(action => `
            <button class="btn ${action.className || 'btn-secondary'}" data-action="${action.key}">
                ${action.label}
            </button>
        `).join('');

        modal.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            <div class="modal-body">${body}</div>
            <div class="modal-actions">${actionsHTML}</div>
        `;

        // Clear and show container
        modalContainer.innerHTML = '';
        modalContainer.appendChild(modal);
        modalContainer.classList.remove('hidden');

        // Handle action clicks
        const handleAction = (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                const action = button.dataset.action;
                hideModal();
                resolve(action);
            }
        };

        modal.addEventListener('click', handleAction);

        // Handle backdrop click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                hideModal();
                resolve('cancel');
            }
        }, { once: true });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                hideModal();
                resolve('cancel');
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Hide the modal
 */
export function hideModal() {
    if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
    }
}

/**
 * Show a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmLabel - Confirm button label (default: 'Confirm')
 * @param {string} cancelLabel - Cancel button label (default: 'Cancel')
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export async function confirm(title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') {
    const result = await showModal({
        title,
        body: `<p>${message}</p>`,
        actions: [
            { key: 'cancel', label: cancelLabel, className: 'btn-secondary' },
            { key: 'confirm', label: confirmLabel, className: 'btn-primary' }
        ]
    });

    return result === 'confirm';
}

/**
 * Show an alert dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} okLabel - OK button label (default: 'OK')
 */
export async function alert(title, message, okLabel = 'OK') {
    await showModal({
        title,
        body: `<p>${message}</p>`,
        actions: [
            { key: 'ok', label: okLabel, className: 'btn-primary' }
        ]
    });
}

/**
 * Show a prompt dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} defaultValue - Default input value
 * @param {string} placeholder - Input placeholder
 * @returns {Promise<string|null>} Input value or null if cancelled
 */
export async function prompt(title, message, defaultValue = '', placeholder = '') {
    const inputId = 'modal-input-' + Date.now();

    const result = await showModal({
        title,
        body: `
            <p>${message}</p>
            <div class="form-group" style="margin-top: 16px;">
                <input
                    type="text"
                    id="${inputId}"
                    class="form-input"
                    value="${defaultValue}"
                    placeholder="${placeholder}"
                    autocomplete="off"
                >
            </div>
        `,
        actions: [
            { key: 'cancel', label: 'Cancel', className: 'btn-secondary' },
            { key: 'confirm', label: 'Save', className: 'btn-primary' }
        ]
    });

    if (result === 'confirm') {
        const input = document.getElementById(inputId);
        return input ? input.value : defaultValue;
    }

    return null;
}

/**
 * Show stop workout confirmation
 * @returns {Promise<string>} 'discard', 'keep', or 'cancel'
 */
export async function showStopWorkoutModal() {
    return showModal({
        title: 'Stop Workout?',
        body: `<p>Are you sure you want to stop this workout?</p>`,
        actions: [
            { key: 'cancel', label: 'Continue', className: 'btn-secondary' },
            { key: 'discard', label: 'Discard', className: 'btn-secondary' },
        ]
    });
}

/**
 * Show delete confirmation
 * @param {string} itemName - Name of item being deleted
 * @returns {Promise<boolean>} True if confirmed
 */
export async function confirmDelete(itemName) {
    return confirm(
        'Delete?',
        `Are you sure you want to delete "${itemName}"? This cannot be undone.`,
        'Delete',
        'Cancel'
    );
}
