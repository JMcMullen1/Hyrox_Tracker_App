/**
 * Exercise Definitions
 * Canonical exercise IDs and configurations for Hyrox workouts
 */

// Canonical exercise IDs for tracking PBs
export const EXERCISE_IDS = {
    // Runs (each segment tracked separately)
    RUN_1: 'run1_1000m',
    RUN_2: 'run2_1000m',
    RUN_3: 'run3_1000m',
    RUN_4: 'run4_1000m',
    RUN_5: 'run5_1000m',
    RUN_6: 'run6_1000m',
    RUN_7: 'run7_1000m',
    RUN_8: 'run8_1000m',

    // Exercises
    SKI_ERG: 'ski_erg_1000m',
    SLED_PUSH: 'sled_push_152_50',
    SLED_PULL: 'sled_pull_103_50',
    BURPEE_BROAD_JUMP: 'bbj_80m',
    ROWING: 'row_1000m',
    FARMERS_CARRY: 'farmers_200m',
    SANDBAG_LUNGES: 'lunges_100m',
    WALL_BALLS: 'wall_balls_100',

    // Custom run for custom workouts
    RUN_CUSTOM: 'run_custom'
};

// Full Hyrox simulation workout structure
export const HYROX_SIM_BLOCKS = {
    amateur: [
        { id: EXERCISE_IDS.RUN_1, label: 'Run 1', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SKI_ERG, label: 'Ski Erg', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_2, label: 'Run 2', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SLED_PUSH, label: 'Sled Push', weight: '152kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_3, label: 'Run 3', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SLED_PULL, label: 'Sled Pull', weight: '103kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_4, label: 'Run 4', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.BURPEE_BROAD_JUMP, label: 'Burpee Broad Jumps', distance: '80m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_5, label: 'Run 5', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.ROWING, label: 'Rowing', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_6, label: 'Run 6', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.FARMERS_CARRY, label: 'Farmers Carry', weight: '2x24kg', distance: '200m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_7, label: 'Run 7', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SANDBAG_LUNGES, label: 'Sandbag Lunges', weight: '20kg', distance: '100m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_8, label: 'Run 8', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.WALL_BALLS, label: 'Wall Balls', weight: '6kg', reps: '100', type: 'exercise' }
    ],
    pro: [
        { id: EXERCISE_IDS.RUN_1, label: 'Run 1', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SKI_ERG, label: 'Ski Erg', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_2, label: 'Run 2', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SLED_PUSH, label: 'Sled Push', weight: '152kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_3, label: 'Run 3', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SLED_PULL, label: 'Sled Pull', weight: '103kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_4, label: 'Run 4', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.BURPEE_BROAD_JUMP, label: 'Burpee Broad Jumps', distance: '80m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_5, label: 'Run 5', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.ROWING, label: 'Rowing', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_6, label: 'Run 6', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.FARMERS_CARRY, label: 'Farmers Carry', weight: '2x32kg', distance: '200m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_7, label: 'Run 7', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.SANDBAG_LUNGES, label: 'Sandbag Lunges', weight: '30kg', distance: '100m', type: 'exercise' },
        { id: EXERCISE_IDS.RUN_8, label: 'Run 8', distance: '1000m', type: 'run' },
        { id: EXERCISE_IDS.WALL_BALLS, label: 'Wall Balls', weight: '9kg', reps: '100', type: 'exercise' }
    ]
};

// Available exercises for custom workout dropdown
export const CUSTOM_EXERCISE_OPTIONS = {
    amateur: [
        { id: 'run_custom', label: 'Run- 1km', distance: 1000, type: 'run', editable: true },
        { id: EXERCISE_IDS.SKI_ERG, label: 'Ski Erg - 1000m', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.SLED_PUSH, label: 'Sled Push 152kg - 50m', weight: '152kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.SLED_PULL, label: 'Sled Pull 103kg - 50m', weight: '103kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.BURPEE_BROAD_JUMP, label: 'Burpee Broad Jumps - 80m', distance: '80m', type: 'exercise' },
        { id: EXERCISE_IDS.ROWING, label: 'Rowing - 1000m', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.FARMERS_CARRY, label: 'Farmers Carry 2x24kg - 200m', weight: '2x24kg', distance: '200m', type: 'exercise' },
        { id: EXERCISE_IDS.SANDBAG_LUNGES, label: 'Sandbag Lunges 20kg - 100m', weight: '20kg', distance: '100m', type: 'exercise' },
        { id: EXERCISE_IDS.WALL_BALLS, label: 'Wall Balls 6kg - 100 reps', weight: '6kg', reps: '100', type: 'exercise' },
        { id: 'custom', label: 'Custom Exercise', type: 'custom' }
    ],
    pro: [
        { id: 'run_custom', label: 'Run- 1km', distance: 1000, type: 'run', editable: true },
        { id: EXERCISE_IDS.SKI_ERG, label: 'Ski Erg - 1000m', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.SLED_PUSH, label: 'Sled Push 152kg - 50m', weight: '152kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.SLED_PULL, label: 'Sled Pull 103kg - 50m', weight: '103kg', distance: '50m', type: 'exercise' },
        { id: EXERCISE_IDS.BURPEE_BROAD_JUMP, label: 'Burpee Broad Jumps - 80m', distance: '80m', type: 'exercise' },
        { id: EXERCISE_IDS.ROWING, label: 'Rowing - 1000m', distance: '1000m', type: 'exercise' },
        { id: EXERCISE_IDS.FARMERS_CARRY, label: 'Farmers Carry 2x32kg - 200m', weight: '2x32kg', distance: '200m', type: 'exercise' },
        { id: EXERCISE_IDS.SANDBAG_LUNGES, label: 'Sandbag Lunges 30kg - 100m', weight: '30kg', distance: '100m', type: 'exercise' },
        { id: EXERCISE_IDS.WALL_BALLS, label: 'Wall Balls 9kg - 100 reps', weight: '9kg', reps: '100', type: 'exercise' },
        { id: 'custom', label: 'Custom Exercise', type: 'custom' }
    ]
};

// Exercise display names (friendly names for results)
export const EXERCISE_DISPLAY_NAMES = {
    [EXERCISE_IDS.RUN_1]: 'Run 1',
    [EXERCISE_IDS.RUN_2]: 'Run 2',
    [EXERCISE_IDS.RUN_3]: 'Run 3',
    [EXERCISE_IDS.RUN_4]: 'Run 4',
    [EXERCISE_IDS.RUN_5]: 'Run 5',
    [EXERCISE_IDS.RUN_6]: 'Run 6',
    [EXERCISE_IDS.RUN_7]: 'Run 7',
    [EXERCISE_IDS.RUN_8]: 'Run 8',
    [EXERCISE_IDS.SKI_ERG]: 'Ski Erg',
    [EXERCISE_IDS.SLED_PUSH]: 'Sled Push',
    [EXERCISE_IDS.SLED_PULL]: 'Sled Pull',
    [EXERCISE_IDS.BURPEE_BROAD_JUMP]: 'Burpee Broad Jumps',
    [EXERCISE_IDS.ROWING]: 'Rowing',
    [EXERCISE_IDS.FARMERS_CARRY]: 'Farmers Carry',
    [EXERCISE_IDS.SANDBAG_LUNGES]: 'Sandbag Lunges',
    [EXERCISE_IDS.WALL_BALLS]: 'Wall Balls',
    [EXERCISE_IDS.RUN_CUSTOM]: 'Run'
};

/**
 * Get exercise block details for display
 * @param {Object} block - Exercise block
 * @returns {string} Formatted details string
 */
export function getBlockDetails(block) {
    const parts = [];

    if (block.weight) {
        parts.push(block.weight);
    }

    if (block.distance) {
        parts.push(typeof block.distance === 'number' ? `${block.distance}m` : block.distance);
    }

    if (block.reps) {
        parts.push(`${block.reps} reps`);
    }

    return parts.join(' • ');
}

/**
 * Get the canonical exercise ID for PB comparison
 * Returns null if exercise doesn't qualify for PB tracking
 * @param {Object} block - Exercise block
 * @param {string} category - 'amateur' or 'pro'
 * @returns {string|null} Canonical exercise ID or null
 */
export function getCanonicalExerciseId(block, category) {
    // Custom exercises don't get PB tracking unless they match exactly
    if (block.type === 'custom') {
        return null;
    }

    // For custom runs, only track if distance is exactly 1000m
    if (block.id === 'run_custom') {
        if (block.distance === 1000 || block.distance === '1000m') {
            return EXERCISE_IDS.RUN_CUSTOM;
        }
        return null;
    }

    // Return the block's canonical ID if it exists
    if (block.id && Object.values(EXERCISE_IDS).includes(block.id)) {
        return block.id;
    }

    return null;
}

/**
 * Get all exercise IDs in order for dashboard display
 * @returns {string[]} Array of exercise IDs
 */
export function getExerciseOrder() {
    return [
        EXERCISE_IDS.RUN_1,
        EXERCISE_IDS.SKI_ERG,
        EXERCISE_IDS.RUN_2,
        EXERCISE_IDS.SLED_PUSH,
        EXERCISE_IDS.RUN_3,
        EXERCISE_IDS.SLED_PULL,
        EXERCISE_IDS.RUN_4,
        EXERCISE_IDS.BURPEE_BROAD_JUMP,
        EXERCISE_IDS.RUN_5,
        EXERCISE_IDS.ROWING,
        EXERCISE_IDS.RUN_6,
        EXERCISE_IDS.FARMERS_CARRY,
        EXERCISE_IDS.RUN_7,
        EXERCISE_IDS.SANDBAG_LUNGES,
        EXERCISE_IDS.RUN_8,
        EXERCISE_IDS.WALL_BALLS
    ];
}
