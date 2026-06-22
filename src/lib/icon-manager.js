class IconManager {
    constructor(options = {}) {
        this.iconSets = {};
        this.fallbackIcon = options.fallbackIcon || '❓';
        this.defaultIconSet = options.defaultIconSet || 'default';
        this.addIconSet('default', {
            unknown: this.fallbackIcon, error: '❌', warning: '⚠️', success: '✅', info: 'ℹ️', loading: '⏳'
        });
    }

    addIconSet(name, icons) { this.iconSets[name] = { ...icons }; }

    getIcon(value, iconSetName = null) {
        const iconSet = this.iconSets[iconSetName || this.defaultIconSet] || this.iconSets[this.defaultIconSet];
        if (!iconSet) return this.fallbackIcon;
        if (iconSet[value]) return iconSet[value];
        const lowerValue = value.toLowerCase();
        for (const [key, icon] of Object.entries(iconSet)) { if (key.toLowerCase() === lowerValue) return icon; }
        for (const [key, icon] of Object.entries(iconSet)) { if (lowerValue.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerValue)) return icon; }
        return iconSet.unknown || this.fallbackIcon;
    }

    getIconSet(iconSetName = null) { return { ...this.iconSets[iconSetName || this.defaultIconSet] }; }
    extendIconSet(iconSetName, newIcons) { if (!this.iconSets[iconSetName]) this.iconSets[iconSetName] = {}; Object.assign(this.iconSets[iconSetName], newIcons); }
    removeIconSet(iconSetName) { delete this.iconSets[iconSetName]; }
    listIconSets() { return Object.keys(this.iconSets); }

    createIconSetFromData(data, valueField = 'value', iconField = 'icon', iconSetName = 'dynamic') {
        const iconSet = {};
        data.forEach(item => { if (item[valueField] && item[iconField]) iconSet[item[valueField]] = item[iconField]; });
        this.addIconSet(iconSetName, iconSet);
        return iconSetName;
    }

    setDefaultIconSet(iconSetName) { if (this.iconSets[iconSetName]) this.defaultIconSet = iconSetName; }

    getStats() {
        const stats = { totalIconSets: Object.keys(this.iconSets).length, iconSets: {}, totalIcons: 0 };
        for (const [setName, icons] of Object.entries(this.iconSets)) { const count = Object.keys(icons).length; stats.iconSets[setName] = count; stats.totalIcons += count; }
        return stats;
    }

    export() { return { iconSets: this.iconSets, fallbackIcon: this.fallbackIcon, defaultIconSet: this.defaultIconSet, exportedAt: new Date().toISOString() }; }

    import(data) { if (data.iconSets) this.iconSets = { ...data.iconSets }; if (data.fallbackIcon) this.fallbackIcon = data.fallbackIcon; if (data.defaultIconSet) this.defaultIconSet = data.defaultIconSet; }

    static createCinemaIconManager() {
        const manager = new IconManager();
        manager.addIconSet('projection', { 'Film': '🎞️', 'Laser': '⚡', 'LED': '💡', '70mm Film': '🎞️', '4K': '🔹', '2K': '🔸' });
        manager.addIconSet('sound', { 'Dolby Atmos': '🌪️', 'Dolby Digital': '🎵', 'Digital Sound': '📻', 'Analog Surround': '📟' });
        manager.addIconSet('status', { '3D': '👓', 'HDR': '✨', 'HFR': '🏃', '4D': '🎢', 'Premium': '⭐', 'Standard': '📺' });
        manager.setDefaultIconSet('projection');
        return manager;
    }
}

const IconUtils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    renderIcon(icon, className = 'icon') {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = icon;
        return span;
    }
};

export { IconManager, IconUtils };
if (typeof window !== 'undefined') { window.IconManager = IconManager; window.IconUtils = IconUtils; }
