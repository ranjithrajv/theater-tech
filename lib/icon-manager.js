/**
 * Icon Management System
 *
 * A generic, reusable icon management library for mapping data values
 * to visual icons. Supports multiple icon sets, custom mappings,
 * and fallback mechanisms.
 *
 * Features:
 * - Multiple icon set support
 * - Custom mapping definitions
 * - Fallback icon support
 * - Category-based organization
 * - Browser and Node.js compatible
 *
 * @version 1.0.0
 * @license MIT
 */

class IconManager {
    constructor(options = {}) {
        this.iconSets = {};
        this.fallbackIcon = options.fallbackIcon || '❓';
        this.defaultIconSet = options.defaultIconSet || 'default';

        // Initialize with default icon set
        this.addIconSet('default', {
            unknown: this.fallbackIcon,
            error: '❌',
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️',
            loading: '⏳'
        });
    }

    /**
     * Add a new icon set
     * @param {string} name - Icon set name
     * @param {Object} icons - Icon mappings
     */
    addIconSet(name, icons) {
        this.iconSets[name] = { ...icons };
    }

    /**
     * Get icon for a value using specified icon set
     * @param {string} value - Value to map to icon
     * @param {string} iconSetName - Icon set to use (optional, uses default)
     * @returns {string} Icon character/string
     */
    getIcon(value, iconSetName = null) {
        const iconSet = this.iconSets[iconSetName || this.defaultIconSet] || this.iconSets[this.defaultIconSet];

        if (!iconSet) {
            return this.fallbackIcon;
        }

        // Direct match
        if (iconSet[value]) {
            return iconSet[value];
        }

        // Case-insensitive match
        const lowerValue = value.toLowerCase();
        for (const [key, icon] of Object.entries(iconSet)) {
            if (key.toLowerCase() === lowerValue) {
                return icon;
            }
        }

        // Partial match (contains)
        for (const [key, icon] of Object.entries(iconSet)) {
            if (lowerValue.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerValue)) {
                return icon;
            }
        }

        return iconSet.unknown || this.fallbackIcon;
    }

    /**
     * Get all icons for a category/set
     * @param {string} iconSetName - Icon set name
     * @returns {Object} All icons in the set
     */
    getIconSet(iconSetName = null) {
        return { ...this.iconSets[iconSetName || this.defaultIconSet] };
    }

    /**
     * Add icons to existing icon set
     * @param {string} iconSetName - Icon set name
     * @param {Object} newIcons - Icons to add
     */
    extendIconSet(iconSetName, newIcons) {
        if (!this.iconSets[iconSetName]) {
            this.iconSets[iconSetName] = {};
        }
        Object.assign(this.iconSets[iconSetName], newIcons);
    }

    /**
     * Remove an icon set
     * @param {string} iconSetName - Icon set to remove
     */
    removeIconSet(iconSetName) {
        delete this.iconSets[iconSetName];
    }

    /**
     * List all available icon sets
     * @returns {string[]} Array of icon set names
     */
    listIconSets() {
        return Object.keys(this.iconSets);
    }

    /**
     * Create icon mapping from data array
     * @param {Array} data - Array of objects with value and icon properties
     * @param {string} valueField - Field name for the value (default: 'value')
     * @param {string} iconField - Field name for the icon (default: 'icon')
     * @param {string} iconSetName - Name for the new icon set
     */
    createIconSetFromData(data, valueField = 'value', iconField = 'icon', iconSetName = 'dynamic') {
        const iconSet = {};

        data.forEach(item => {
            if (item[valueField] && item[iconField]) {
                iconSet[item[valueField]] = item[iconField];
            }
        });

        this.addIconSet(iconSetName, iconSet);
        return iconSetName;
    }

    /**
     * Set the default icon set
     * @param {string} iconSetName - Icon set to use as default
     */
    setDefaultIconSet(iconSetName) {
        if (this.iconSets[iconSetName]) {
            this.defaultIconSet = iconSetName;
        }
    }

    /**
     * Get statistics about icon sets
     * @returns {Object} Statistics object
     */
    getStats() {
        const stats = {
            totalIconSets: Object.keys(this.iconSets).length,
            iconSets: {},
            totalIcons: 0
        };

        for (const [setName, icons] of Object.entries(this.iconSets)) {
            const iconCount = Object.keys(icons).length;
            stats.iconSets[setName] = iconCount;
            stats.totalIcons += iconCount;
        }

        return stats;
    }

    /**
     * Export icon sets as JSON
     * @returns {Object} Exportable JSON object
     */
    export() {
        return {
            iconSets: this.iconSets,
            fallbackIcon: this.fallbackIcon,
            defaultIconSet: this.defaultIconSet,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import icon sets from JSON
     * @param {Object} data - Exported icon data
     */
    import(data) {
        if (data.iconSets) {
            this.iconSets = { ...data.iconSets };
        }
        if (data.fallbackIcon) {
            this.fallbackIcon = data.fallbackIcon;
        }
        if (data.defaultIconSet) {
            this.defaultIconSet = data.defaultIconSet;
        }
    }

    /**
     * Create a cinema-specific icon manager
     * @returns {IconManager} Pre-configured icon manager
     */
    static createCinemaIconManager() {
        const manager = new IconManager();

        // Projection icons
        manager.addIconSet('projection', {
            'Film': '🎞️',
            'Laser': '⚡',
            'LED': '💡',
            '70mm Film': '🎞️',
            '4K': '🔹',
            '2K': '🔸'
        });

        // Sound system icons
        manager.addIconSet('sound', {
            'Dolby Atmos': '🌪️',
            'Dolby Digital': '🎵',
            'Digital Sound': '📻',
            'Analog Surround': '📟'
        });

        // Technology status icons
        manager.addIconSet('status', {
            '3D': '👓',
            'HDR': '✨',
            'HFR': '🏃',
            '4D': '🎢',
            'Premium': '⭐',
            'Standard': '📺'
        });

        manager.setDefaultIconSet('projection');
        return manager;
    }
}

// Utility functions
const IconUtils = {
    // Debounce function - generic utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Simple icon renderer for DOM elements
    renderIcon(icon, className = 'icon') {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = icon;
        return span;
    }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IconManager, IconUtils };
}

if (typeof window !== 'undefined') {
    window.IconManager = IconManager;
    window.IconUtils = IconUtils;
}

if (typeof global !== 'undefined') {
    global.IconManager = IconManager;
    global.IconUtils = IconUtils;
}