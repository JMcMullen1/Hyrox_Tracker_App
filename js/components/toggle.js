/**
 * Toggle Component
 * Amateur/Pro toggle switch
 */

import { getToggleSetting, setToggleSetting } from '../db.js';

/**
 * Create a toggle component
 * @param {Object} options - Toggle options
 * @param {string} options.screen - Screen name for persistence
 * @param {Function} options.onChange - Callback when toggle changes
 * @returns {HTMLElement} Toggle element
 */
export function createToggle(options) {
    const { screen, onChange } = options;

    const container = document.createElement('div');
    container.className = 'toggle-container';
    container.innerHTML = `
        <span class="toggle-label amateur-label active">Amateur</span>
        <div class="toggle-switch" role="switch" aria-checked="false" tabindex="0"></div>
        <span class="toggle-label pro-label">Pro</span>
    `;

    const toggleSwitch = container.querySelector('.toggle-switch');
    const amateurLabel = container.querySelector('.amateur-label');
    const proLabel = container.querySelector('.pro-label');

    let currentValue = 'amateur';

    // Load saved value
    getToggleSetting(screen).then(value => {
        if (value === 'pro') {
            toggleSwitch.classList.add('pro');
            toggleSwitch.setAttribute('aria-checked', 'true');
            amateurLabel.classList.remove('active');
            proLabel.classList.add('active');
            currentValue = 'pro';
        }
    });

    // Handle toggle click
    const toggle = async () => {
        const isPro = toggleSwitch.classList.toggle('pro');
        currentValue = isPro ? 'pro' : 'amateur';

        toggleSwitch.setAttribute('aria-checked', isPro);
        amateurLabel.classList.toggle('active', !isPro);
        proLabel.classList.toggle('active', isPro);

        // Save setting
        await setToggleSetting(screen, currentValue);

        // Call onChange callback
        if (onChange) {
            onChange(currentValue);
        }
    };

    toggleSwitch.addEventListener('click', toggle);
    toggleSwitch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });

    // Expose methods
    container.getValue = () => currentValue;
    container.setValue = async (value) => {
        if (value !== currentValue) {
            await toggle();
        }
    };

    return container;
}

/**
 * Get current toggle value for a screen
 * @param {string} screen - Screen name
 * @returns {Promise<string>} 'amateur' or 'pro'
 */
export async function getToggleValue(screen) {
    return getToggleSetting(screen);
}
