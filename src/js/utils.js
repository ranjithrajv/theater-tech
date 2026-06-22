import { IconManager } from '../lib/icon-manager.js';

let IconUtils = null;
let IconManagerInstance = null;

async function loadIconUtils() {
    try {
        IconManagerInstance = IconManager.createCinemaIconManager();

        try {
            const response = await fetch(`${import.meta.env.BASE_URL}data/icons.json`);
            if (response.ok) {
                const iconsData = await response.json();
                Object.entries(iconsData).forEach(([setName, icons]) => {
                    if (typeof icons === 'object' && !Array.isArray(icons)) {
                        IconManagerInstance.addIconSet(setName, icons);
                    }
                });
            }
        } catch (jsonError) {
            console.warn('Could not load icons.json, using defaults:', jsonError.message);
        }

        IconUtils = {
            icons: IconManagerInstance.getIconSet(),

            getProjectionIcon(projection) {
                if (!projection) return IconManagerInstance.getIcon('unknown', 'projection');
                return IconManagerInstance.getIcon(projection.type, 'projection') ||
                       IconManagerInstance.getIcon(projection.resolution, 'projection');
            },

            getSoundIcon(sound) {
                if (!sound) return IconManagerInstance.getIcon('unknown', 'sound');
                return IconManagerInstance.getIcon(sound.format, 'sound');
            },

            getTechShort(projection, sound) {
                if (!projection || !sound) return 'N/A';
                const projType = IconManagerInstance.getIcon(projection.resolution || projection.type, 'projection');
                const soundType = IconManagerInstance.getIcon(sound.format, 'sound');
                return `${projType} ${soundType}`;
            }
        };

        window.IconUtils = IconUtils;
        window.IconManagerInstance = IconManagerInstance;
        return IconUtils;

    } catch (error) {
        console.error('Error loading icon utilities:', error);
        IconUtils = {
            icons: {
                projection: { 'Film': '\uD83C\uDF9E\uFE0F', 'Laser': '\u26A1', 'LED': '\uD83D\uDCA1', '70mm Film': '\uD83C\uDF9E\uFE0F', '4K': '\uD83D\uDD39', '2K': '\uD83D\uDD38' },
                sound: { 'Dolby Atmos': '\uD83C\uDF2A\uFE0F', 'Dolby Digital': '\uD83C\uDFB5', 'Digital Sound': '\uD83D\uDCFB', 'Analog Surround': '\uD83D\uDCDF' },
                default: { projection: '\uD83D\uDCFD\uFE0F', sound: '\uD83D\uDD0A' }
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

loadIconUtils();

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

window.IconUtils = IconUtils;
window.SizeUtils = SizeUtils;
window.debounce = debounce;

loadIconUtils().catch(error => {
    console.warn('Failed to load enhanced icon utilities:', error.message);
});

export { SizeUtils, debounce, IconUtils, loadIconUtils };
