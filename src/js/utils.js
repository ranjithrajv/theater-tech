/**
 * Utility functions for Hyderabad Cinema Technology Comparison
 * Consolidates icon generation and other reusable utilities
 */

// Load the generic IconManager and create cinema-specific instance
let IconUtils = null;
let IconManagerInstance = null;

// Note: IconUtils will be loaded from lib/icon-manager.js, we'll use that

async function loadIconUtils() {
    try {
        // Load the generic IconManager
        let IconManager;
        if (typeof require !== 'undefined') {
            ({ IconManager } = require('../lib/icon-manager.js'));
        } else {
            IconManager = window.IconManager;
        }

        if (!IconManager) {
            throw new Error('IconManager not found');
        }

        // Create cinema-specific icon manager
        IconManagerInstance = IconManager.createCinemaIconManager();

        // Load additional icons from JSON if available
        try {
            const response = await fetch('../data/icons.json');
            if (response.ok) {
                const iconsData = await response.json();
                // Extend existing icon sets with JSON data
                Object.entries(iconsData).forEach(([setName, icons]) => {
                    if (typeof icons === 'object' && !Array.isArray(icons)) {
                        IconManagerInstance.addIconSet(setName, icons);
                    }
                });
            }
        } catch (jsonError) {
            console.warn('Could not load icons.json, using defaults:', jsonError.message);
        }

        // Create backward-compatible IconUtils interface
        IconUtils = {
            icons: IconManagerInstance.getIconSet(),

            // Get projection icon based on projection data
            getProjectionIcon(projection) {
                if (!projection) return IconManagerInstance.getIcon('unknown', 'projection');
                return IconManagerInstance.getIcon(projection.type, 'projection') ||
                       IconManagerInstance.getIcon(projection.resolution, 'projection');
            },

            // Get sound icon based on sound system data
            getSoundIcon(sound) {
                if (!sound) return IconManagerInstance.getIcon('unknown', 'sound');
                return IconManagerInstance.getIcon(sound.format, 'sound');
            },

            // Get short technology description
            getTechShort(projection, sound) {
                if (!projection || !sound) return 'N/A';

                const projType = IconManagerInstance.getIcon(projection.resolution || projection.type, 'projection');
                const soundType = IconManagerInstance.getIcon(sound.format, 'sound');

                return `${projType} ${soundType}`;
            }
        };

        // Export for global use
        window.IconUtils = IconUtils;
        window.IconManagerInstance = IconManagerInstance;
        return IconUtils;

    } catch (error) {
        console.error('Error loading icon utilities:', error);
        // Fallback implementation
        IconUtils = {
            icons: {
                projection: { 'Film': '🎞️', 'Laser': '⚡', 'LED': '💡', '70mm Film': '🎞️', '4K': '🔹', '2K': '🔸' },
                sound: { 'Dolby Atmos': '🌪️', 'Dolby Digital': '🎵', 'Digital Sound': '📻', 'Analog Surround': '📟' },
                default: { projection: '📽️', sound: '🔊' }
            },
            getProjectionIcon(projection) {
                if (!projection) return this.icons.default.projection;
                return this.icons.projection[projection.type] || this.icons.projection[projection.resolution] || this.icons.default.projection;
            },
            getSoundIcon(sound) {
                if (!sound) return this.icons.default.sound;
                return this.icons.sound[sound.format] || this.icons.default.sound;
            },
            getTechShort(projection, sound) {
                if (!projection || !sound) return 'N/A';
                let projType = '2K';
                if (projection.resolution === '70mm Film') projType = '70mm';
                else if (projection.resolution === '4K') projType = '4K';
                else if (projection.type === 'Laser') projType = 'Laser';
                else if (projection.type === 'LED') projType = 'LED';
                let soundType = 'Audio';
                if (sound.format === 'Dolby Atmos') soundType = 'Atmos';
                else if (sound.format === 'Dolby Digital') soundType = 'Digital';
                else if (sound.format === 'Digital Sound') soundType = 'Sound';
                else if (sound.format === 'Analog Surround') soundType = 'Analog';
                return `${projType} ${soundType}`;
            }
        };
        window.IconUtils = IconUtils;
        return IconUtils;
    }
}

// Initialize icon utils loading
loadIconUtils();

// Size category utilities
const SizeUtils = {
    getSizeCategory(width, height) {
        const area = width * height;
        const thresholds = window.AppConstants?.SIZE_THRESHOLDS || { XXL: 6000, XL: 4000, L: 2000, M: 1200 };

        if (area > thresholds.XXL) return 'XXL';
        if (area > thresholds.XL) return 'XL';
        if (area > thresholds.L) return 'L';
        if (area > thresholds.M) return 'M';
        return 'S';
    }
};

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Set basic globals immediately
console.log('🔗 Setting global utilities...');
window.IconUtils = IconUtils;
window.SizeUtils = SizeUtils;
window.debounce = debounce;
console.log('✅ Global utilities set:', { IconUtils: !!window.IconUtils, SizeUtils: !!window.SizeUtils, debounce: !!window.debounce });

// Load enhanced functionality asynchronously
loadIconUtils().catch(error => {
    console.warn('Failed to load enhanced icon utilities:', error.message);
    // Basic functionality remains available
});