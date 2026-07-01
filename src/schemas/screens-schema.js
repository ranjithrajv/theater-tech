/**
 * Cinema Screen Data Schema
 *
 * Defines validation schema for screens.json
 * which contains theater screen information including dimensions,
 * projection systems, sound systems, and technical specifications.
 *
 * Supports both formats:
 * - Legacy: Array of screen objects (for backward compatibility)
 * - Cities: Object with cities array containing screens
 *
 * Version: 3.0.0
 */

/**
 * Validation severity levels
 */
const VALIDATION_SEVERITY = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

/**
 * PLF format-specific requirements and constraints
 */
const PLF_FORMAT_REQUIREMENTS = {
    'IMAX': {
        name: 'IMAX',
        minWidth: 60,
        minHeight: 40,
        minArea: 2400,
        maxWidth: 150,
        maxHeight: 100,
        maxArea: 15000,
        allowedProjectionTypes: ['Laser', 'IMAX Laser', 'Film'],
        allowedResolutions: ['IMAX Digital', 'IMAX 70mm', '2K', '4K'],
        minBrightnessLumens: 30000,
        maxBrightnessLumens: 100000,
        requiredSoundFormats: ['IMAX'],
        minChannels: 6,
        maxChannels: 16,
        requiredScreenSurface: true,
        allowedScreenMaterials: ['Perforated White', 'Premium Screen', 'Silver Screen', 'Curved Screen'],
        description: 'IMAX - Premium large format with immersive experience',
        allowedContentSupport: ['3d_capability', 'hdr_support']
    },
    'PCX': {
        name: 'PCX',
        minWidth: 80,
        minHeight: 50,
        minArea: 4000,
        maxWidth: 150,
        maxHeight: 100,
        maxArea: 15000,
        allowedProjectionTypes: ['Laser'],
        allowedResolutions: ['2K', '4K'],
        minBrightnessLumens: 30000,
        maxBrightnessLumens: 80000,
        requiredSoundFormats: ['Dolby Atmos', 'Dolby Digital'],
        minChannels: 7.1,
        maxChannels: 16,
        requiredScreenSurface: true,
        allowedScreenMaterials: ['Perforated White', 'Acoustic Transparent', 'Premium Screen', 'White Matte'],
        description: 'PCX - Premium Cinema Experience',
        requiredContentSupport: ['hdr_support']
    },
    'Superplex': {
        name: 'Superplex',
        minWidth: 60,
        minHeight: 35,
        minArea: 2100,
        maxWidth: 120,
        maxHeight: 70,
        maxArea: 8400,
        allowedProjectionTypes: ['Laser'],
        allowedResolutions: ['2K', '4K'],
        minBrightnessLumens: 25000,
        maxBrightnessLumens: 60000,
        requiredSoundFormats: ['Dolby Atmos', 'Dolby Digital', 'Digital Sound'],
        minChannels: 5.1,
        maxChannels: 16,
        requiredScreenSurface: true,
        allowedScreenMaterials: ['Perforated White', 'Acoustic Transparent', 'Premium Screen', 'White Matte'],
        description: 'Superplex - Premium large format',
        requiredContentSupport: ['hdr_support']
    },
    '70mm': {
        name: '70mm',
        minWidth: 40,
        minHeight: 25,
        minArea: 1000,
        maxWidth: 100,
        maxHeight: 60,
        maxArea: 6000,
        allowedProjectionTypes: ['Film'],
        allowedResolutions: ['70mm Film', '35mm Film'],
        minBrightnessLumens: 15000,
        maxBrightnessLumens: 50000,
        requiredSoundFormats: ['Analog Surround', 'Mono'],
        minChannels: 4.0,
        maxChannels: 8,
        requiredScreenSurface: true,
        allowedScreenMaterials: ['Silver Screen', 'Curved Screen', 'White Matte', 'High Gain'],
        description: '70mm Film - Classic film projection',
        allowedContentSupport: ['3d_capability']
    },
    'EPIQ': {
        name: 'EPIQ',
        minWidth: 45,
        minHeight: 28,
        minArea: 1260,
        maxWidth: 80,
        maxHeight: 50,
        maxArea: 4000,
        allowedProjectionTypes: ['Laser', 'LED'],
        allowedResolutions: ['2K', '4K'],
        minBrightness: { laser: 20000, led: 400 },
        maxBrightness: { laser: 50000, led: 5000 },
        requiredSoundFormats: ['Dolby Atmos', 'Dolby Digital'],
        minChannels: 5.1,
        maxChannels: 16,
        requiredScreenSurface: { laser: true, led: false },
        allowedScreenMaterials: { laser: ['Perforated White', 'Acoustic Transparent', 'Premium Screen', 'White Matte'], led: null },
        description: 'EPIQ - Enhanced Premium Large Format',
        requiredContentSupport: ['hdr_support']
    },
    'LUX': {
        name: 'LUX',
        minWidth: 45,
        minHeight: 28,
        minArea: 1260,
        maxWidth: 80,
        maxHeight: 50,
        maxArea: 4000,
        allowedProjectionTypes: ['Laser'],
        allowedResolutions: ['2K', '4K'],
        minBrightnessLumens: 20000,
        maxBrightnessLumens: 50000,
        requiredSoundFormats: ['Dolby Atmos', 'Dolby Digital'],
        minChannels: 5.1,
        maxChannels: 12,
        requiredScreenSurface: true,
        allowedScreenMaterials: ['Perforated White', 'Acoustic Transparent', 'Premium Screen'],
        description: 'LUX - Luxury Premium Format',
        requiredContentSupport: ['hdr_support', 'hfr_support']
    },
    'PXL': {
        name: 'PXL',
        minWidth: 40,
        minHeight: 25,
        minArea: 1000,
        maxWidth: 70,
        maxHeight: 45,
        maxArea: 3150,
        allowedProjectionTypes: ['Laser', 'LED'],
        allowedResolutions: ['2K', '4K'],
        minBrightness: { laser: 18000, led: 400 },
        maxBrightness: { laser: 50000, led: 5000 },
        requiredSoundFormats: ['Dolby Atmos', 'Dolby Digital', 'Digital Sound'],
        minChannels: 5.1,
        maxChannels: 12,
        requiredScreenSurface: { laser: true, led: false },
        allowedScreenMaterials: { laser: ['Perforated White', 'Acoustic Transparent', 'White Matte', 'Premium Screen'], led: null },
        description: 'PXL - Premium Large Format',
        requiredContentSupport: ['hdr_support']
    },
    'Standard': {
        name: 'Standard',
        minWidth: 30,
        minHeight: 20,
        minArea: 600,
        maxWidth: 60,
        maxHeight: 40,
        maxArea: 2400,
        allowedProjectionTypes: ['Laser', 'LED', 'Lamp', 'Xenon Lamp'],
        allowedResolutions: ['2K', 'HD'],
        minBrightness: { laser: 12000, led: 300 },
        maxBrightness: { laser: 35000, led: 3000 },
        requiredSoundFormats: ['Dolby Digital', 'Digital Sound'],
        minChannels: 5.1,
        maxChannels: 10,
        requiredScreenSurface: { laser: true, led: false },
        allowedScreenMaterials: { laser: ['White Matte', 'Perforated White'], led: null },
        description: 'Standard - Conventional cinema format',
        requiredContentSupport: []
    }
};

/**
 * Validation utility functions
 */
const ValidationUtils = {
    calculateArea: (width, height) => width * height,

    calculateAspectRatio: (width, height) => {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const g = gcd(width, height);
        return `${width/g}:${height/g}`;
    },

    calculateBrightnessDensity: (brightness, area, projectionType) => {
        const isLED = projectionType === 'LED';
        const brightnessPerFt2 = brightness / area;

        if (isLED) {
            return {
                brightnessPerFt2,
                valid: brightnessPerFt2 >= 0.5 && brightnessPerFt2 <= 200
            };
        } else {
            return {
                brightnessPerFt2,
                valid: brightnessPerFt2 >= 5 && brightnessPerFt2 <= 150
            };
        }
    },

    calculateSeatingDensity: (seating, area, plfFormat) => {
        const isPremiumLarge = ['IMAX', 'PCX', 'Superplex'].includes(plfFormat);
        const minDensity = isPremiumLarge ? 0.05 : 0.1;
        const maxDensity = 1.5;
        const density = seating / area;

        return {
            density,
            valid: density >= minDensity && density <= maxDensity,
            recommendedDensity: isPremiumLarge ? '0.05-1.5' : '0.1-1.5'
        };
    },

    isWithinTolerance: (actual, expected, tolerancePercent = 0.1) => {
        return Math.abs(actual - expected) / expected <= tolerancePercent;
    }
};

/**
 * Validates data consistency and business rules across fields
 */
function validateScreenConsistency(screen) {
    const errors = [];
    const warnings = [];
    const info = [];

    // Validate projection type and brightness field compatibility
    if (screen.projection?.type === 'LED') {
        if (!screen.projection.brightness_nits) {
            errors.push({
                code: 'LED_MISSING_NITS',
                severity: VALIDATION_SEVERITY.ERROR,
                message: 'LED projection requires brightness_nits field'
            });
        }
        if (screen.projection.brightness_lumens) {
            errors.push({
                code: 'LED_INVALID_LUMENS',
                severity: VALIDATION_SEVERITY.ERROR,
                message: 'LED projection should use brightness_nits, not brightness_lumens',
                suggestion: 'Use brightness_nits instead of brightness_lumens for LED screens'
            });
        }
    }

    // Laser/Film/Lamp should use brightness_lumens
    if (['Laser', 'Film', 'Lamp', 'Xenon Lamp'].includes(screen.projection?.type)) {
        if (!screen.projection.brightness_lumens) {
            errors.push({
                code: 'PROJECTION_MISSING_LUMENS',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${screen.projection?.type} projection requires brightness_lumens field`
            });
        }
        if (screen.projection.brightness_nits) {
            errors.push({
                code: 'PROJECTION_INVALID_NITS',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${screen.projection?.type} projection should use brightness_lumens, not brightness_nits`,
                suggestion: `Use brightness_lumens instead of brightness_nits for ${screen.projection?.type} screens`
            });
        }
    }

    // Non-LED screens should specify screen_surface
    if (screen.projection?.type !== 'LED' && !screen.screen_surface?.material) {
        errors.push({
            code: 'MISSING_SCREEN_SURFACE',
            severity: VALIDATION_SEVERITY.ERROR,
            message: 'Non-LED screens should specify screen_surface material'
        });
    }

    // LED screens shouldn't have screen_surface (they are the screen)
    if (screen.projection?.type === 'LED' && screen.screen_surface?.material) {
        errors.push({
            code: 'LED_INVALID_SCREEN_SURFACE',
            severity: VALIDATION_SEVERITY.ERROR,
            message: 'LED direct-view screens should not have screen_surface property'
        });
    }

    // Cross-field validation: content_support coherence
    if (screen.content_support?.hfr_support && !screen.content_support?.hdr_support) {
        warnings.push({
            code: 'HFR_WITHOUT_HDR',
            severity: VALIDATION_SEVERITY.WARNING,
            message: 'HFR support typically requires HDR support',
            suggestion: 'Consider adding hdr_support: true or verify specifications'
        });
    }

    if (screen.content_support?.['4d_effects'] && !screen.content_support?.['3d_capability']) {
        warnings.push({
            code: '4D_WITHOUT_3D',
            severity: VALIDATION_SEVERITY.INFO,
            message: '4D effects typically require 3D capability',
            suggestion: 'Consider adding 3d_capability: true if 4D is actually supported'
        });
    }

    // Screen size area validation
    const area = ValidationUtils.calculateArea(screen.width, screen.height);
    if (area < 500) {
        errors.push({
            code: 'AREA_TOO_SMALL',
            severity: VALIDATION_SEVERITY.ERROR,
            message: `Screen area (${area} ft²) is below minimum (500 ft²)`
        });
    }
    if (area > 10000) {
        errors.push({
            code: 'AREA_TOO_LARGE',
            severity: VALIDATION_SEVERITY.ERROR,
            message: `Screen area (${area} ft²) exceeds maximum (10,000 ft²)`
        });
    }

    // Format-specific validation
    const formatReqs = PLF_FORMAT_REQUIREMENTS[screen.plf_format];
    if (formatReqs) {
        // Check minimum dimensions
        if (screen.width < formatReqs.minWidth) {
            errors.push({
                code: 'WIDTH_BELOW_MIN',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${formatReqs.name} format requires minimum width of ${formatReqs.minWidth}ft (current: ${screen.width}ft)`
            });
        }
        if (screen.height < formatReqs.minHeight) {
            errors.push({
                code: 'HEIGHT_BELOW_MIN',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${formatReqs.name} format requires minimum height of ${formatReqs.minHeight}ft (current: ${screen.height}ft)`
            });
        }
        if (area < formatReqs.minArea) {
            errors.push({
                code: 'AREA_BELOW_MIN',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${formatReqs.name} format requires minimum area of ${formatReqs.minArea}ft² (current: ${area}ft²)`
            });
        }

        // Check maximum dimensions
        if (screen.width > formatReqs.maxWidth) {
            warnings.push({
                code: 'WIDTH_ABOVE_MAX',
                severity: VALIDATION_SEVERITY.WARNING,
                message: `${formatReqs.name} format typically has maximum width of ${formatReqs.maxWidth}ft (current: ${screen.width}ft)`,
                suggestion: 'Verify width specifications'
            });
        }
        if (screen.height > formatReqs.maxHeight) {
            warnings.push({
                code: 'HEIGHT_ABOVE_MAX',
                severity: VALIDATION_SEVERITY.WARNING,
                message: `${formatReqs.name} format typically has maximum height of ${formatReqs.maxHeight}ft (current: ${screen.height}ft)`,
                suggestion: 'Verify height specifications'
            });
        }

        // Check projection type compatibility
        if (!formatReqs.allowedProjectionTypes.includes(screen.projection?.type)) {
            errors.push({
                code: 'INVALID_PROJECTION_TYPE',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${formatReqs.name} format requires projection type: ${formatReqs.allowedProjectionTypes.join(' or ')}`,
                suggestion: `Current type: ${screen.projection?.type}`
            });
        }

        // Check resolution compatibility
        if (formatReqs.allowedResolutions && !formatReqs.allowedResolutions.includes(screen.projection?.resolution)) {
            warnings.push({
                code: 'NON_STANDARD_RESOLUTION',
                severity: VALIDATION_SEVERITY.WARNING,
                message: `${formatReqs.name} format typically uses: ${formatReqs.allowedResolutions.join(', ')}`,
                suggestion: `Current resolution: ${screen.projection?.resolution}`
            });
        }

        // Check brightness - handle both simple (minBrightnessLumens) and object (minBrightness.laser/led) formats
        if (screen.projection?.type === 'LED') {
            const minLed = formatReqs.minBrightness?.led;
            const maxLed = formatReqs.maxBrightness?.led;
            if (minLed !== undefined && screen.projection.brightness_nits < minLed) {
                warnings.push({
                    code: 'LED_BRIGHTNESS_LOW',
                    severity: VALIDATION_SEVERITY.WARNING,
                    message: `LED brightness (${screen.projection.brightness_nits} nits) below recommended range (${minLed}-${maxLed} nits) for ${formatReqs.name}`,
                    suggestion: 'Consider increasing brightness for better image quality'
                });
            }
            if (maxLed !== undefined && screen.projection.brightness_nits > maxLed) {
                warnings.push({
                    code: 'LED_BRIGHTNESS_HIGH',
                    severity: VALIDATION_SEVERITY.WARNING,
                    message: `LED brightness (${screen.projection.brightness_nits} nits) unusually high for ${formatReqs.name}`,
                    suggestion: `Maximum recommended: ${maxLed} nits`
                });
            }
        } else if (screen.projection?.brightness_lumens) {
            const minLumens = formatReqs.minBrightnessLumens ?? formatReqs.minBrightness?.laser;
            const maxLumens = formatReqs.maxBrightnessLumens ?? formatReqs.maxBrightness?.laser;
            if (minLumens !== undefined && screen.projection.brightness_lumens < minLumens) {
                warnings.push({
                    code: 'BRIGHTNESS_LOW',
                    severity: VALIDATION_SEVERITY.WARNING,
                    message: `Brightness (${screen.projection.brightness_lumens} lumens) below recommended range (${minLumens}-${maxLumens} lumens) for ${formatReqs.name}`,
                    suggestion: 'Consider increasing brightness for better image quality'
                });
            }
            if (maxLumens !== undefined && screen.projection.brightness_lumens > maxLumens) {
                errors.push({
                    code: 'BRIGHTNESS_TOO_HIGH',
                    severity: VALIDATION_SEVERITY.ERROR,
                    message: `Brightness (${screen.projection.brightness_lumens} lumens) exceeds maximum (${maxLumens} lumens) for ${formatReqs.name}`
                });
            }
        }

        // Check sound format
        if (formatReqs.requiredSoundFormats && !formatReqs.requiredSoundFormats.includes(screen.sound_system?.format)) {
            warnings.push({
                code: 'SOUND_FORMAT_NON_STANDARD',
                severity: VALIDATION_SEVERITY.INFO,
                message: `${formatReqs.name} format typically uses: ${formatReqs.requiredSoundFormats.join(', ')}`,
                suggestion: `Current format: ${screen.sound_system?.format}`
            });
        }

        // Check sound channels
        if (screen.sound_system?.channels) {
            if (screen.sound_system.channels < formatReqs.minChannels) {
                errors.push({
                    code: 'CHANNELS_TOO_LOW',
                    severity: VALIDATION_SEVERITY.ERROR,
                    message: `Channels (${screen.sound_system.channels}) below minimum (${formatReqs.minChannels}) for ${formatReqs.name}`
                });
            }
            if (screen.sound_system.channels > formatReqs.maxChannels) {
                warnings.push({
                    code: 'CHANNELS_ABOVE_MAX',
                    severity: VALIDATION_SEVERITY.WARNING,
                    message: `Channels (${screen.sound_system.channels}) above typical maximum (${formatReqs.maxChannels}) for ${formatReqs.name}`
                });
            }
        }

        // Check screen surface
        const requiredSurface = formatReqs.requiredScreenSurface;
        if (typeof requiredSurface === 'object') {
            if (screen.projection?.type === 'LED' && screen.screen_surface?.material) {
                errors.push({
                    code: 'LED_INVALID_SCREEN_SURFACE',
                    severity: VALIDATION_SEVERITY.ERROR,
                    message: 'LED direct-view screens should not have screen_surface property'
                });
            } else if (screen.projection?.type !== 'LED' && !screen.screen_surface?.material) {
                errors.push({
                    code: 'MISSING_SCREEN_SURFACE',
                    severity: VALIDATION_SEVERITY.ERROR,
                    message: `${formatReqs.name} format requires screen_surface material`
                });
            } else if (screen.screen_surface?.material && formatReqs.allowedScreenMaterials) {
                // Resolve allowed materials - may be an object keyed by projection type or a plain array
                const allowedMaterials = Array.isArray(formatReqs.allowedScreenMaterials)
                    ? formatReqs.allowedScreenMaterials
                    : formatReqs.allowedScreenMaterials[screen.projection?.type === 'LED' ? 'led' : 'laser'];
                if (allowedMaterials && !allowedMaterials.includes(screen.screen_surface.material)) {
                    warnings.push({
                        code: 'SCREEN_MATERIAL_NON_STANDARD',
                        severity: VALIDATION_SEVERITY.INFO,
                        message: `Screen material (${screen.screen_surface.material}) is non-standard for ${formatReqs.name}`,
                        suggestion: `Typical materials: ${allowedMaterials.join(', ')}`
                    });
                }
            }
        } else if (requiredSurface && !screen.screen_surface?.material) {
            errors.push({
                code: 'MISSING_SCREEN_SURFACE',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `${formatReqs.name} format requires screen_surface material`
            });
        }

        // Check content support requirements
        if (formatReqs.requiredContentSupport) {
            formatReqs.requiredContentSupport.forEach(feature => {
                if (!screen.content_support || !screen.content_support[feature]) {
                    warnings.push({
                        code: `MISSING_${feature.toUpperCase()}`,
                        severity: VALIDATION_SEVERITY.WARNING,
                        message: `${formatReqs.name} format typically requires ${feature} support`,
                        suggestion: `Add ${feature}: true or verify specifications`
                    });
                }
            });
        }
    }

    // Seating capacity validation with format-adjusted ranges
    if (screen.seating_capacity) {
        const densityResult = ValidationUtils.calculateSeatingDensity(screen.seating_capacity, area, screen.plf_format);
        if (!densityResult.valid) {
            errors.push({
                code: 'SEATING_DENSITY_INVALID',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `Seating density (${densityResult.density.toFixed(2)} seats/ft²) outside valid range (${densityResult.recommendedDensity} seats/ft²) for ${screen.plf_format}`
            });
        }
    }

    // Sound format-channel compatibility
    if (screen.sound_system?.format === 'Dolby Atmos') {
        if (screen.sound_system.channels) {
            const channels = screen.sound_system.channels;
            if (channels < 5.1) {
                errors.push({
                    code: 'ATMOS_CHANNELS_TOO_LOW',
                    severity: VALIDATION_SEVERITY.ERROR,
                    message: `Dolby Atmos with ${channels} channels is below standard minimum (5.1)`,
                    suggestion: 'Channels should be at least 5.1, typically 5.1, 7.1, 9.1, or 11.1'
                });
            }
            if (!channels.toString().includes('.1')) {
                warnings.push({
                    code: 'ATMOS_NON_STANDARD_CHANNELS',
                    severity: VALIDATION_SEVERITY.INFO,
                    message: 'Dolby Atmos typically uses .1 channel configurations (e.g., 5.1, 7.1, 9.1, 11.1)',
                    suggestion: `Current channels: ${channels}`
                });
            }
        }
    }

    if (screen.sound_system?.format === 'IMAX') {
        if (screen.sound_system.channels && screen.sound_system.channels < 6) {
            errors.push({
                code: 'IMAX_CHANNELS_TOO_LOW',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `IMAX sound requires at least 6 channels (current: ${screen.sound_system.channels})`
            });
        }
    }

    // Resolution-projection type compatibility
    if (screen.projection?.type === 'Film' && !screen.projection.resolution.includes('Film')) {
        errors.push({
            code: 'FILM_INVALID_RESOLUTION',
            severity: VALIDATION_SEVERITY.ERROR,
            message: 'Film projection should have Film-based resolution (e.g., 70mm Film, 35mm Film)',
            suggestion: `Current resolution: ${screen.projection.resolution}`
        });
    }

    if (screen.projection?.type === 'LED' && screen.projection.resolution.includes('Film')) {
        errors.push({
            code: 'LED_FILM_RESOLUTION',
            severity: VALIDATION_SEVERITY.ERROR,
            message: 'LED projection should not have Film-based resolution',
            suggestion: `Current resolution: ${screen.projection.resolution}`
        });
    }

    // Chain and theater_name consistency
    if ((screen.chain && !screen.theater_name) || (!screen.chain && screen.theater_name)) {
        errors.push({
            code: 'CHAIN_THEATER_MISMATCH',
            severity: VALIDATION_SEVERITY.ERROR,
            message: 'Both chain and theater_name should be provided together or both omitted'
        });
    }

    // Aspect ratio validation with tolerance
    if (screen.projection?.aspect_ratio) {
        const actualRatio = screen.width / screen.height;
        const [targetW, targetH] = screen.projection.aspect_ratio.split(':').map(Number);
        const targetRatio = targetW / targetH;
        const ratioDiff = Math.abs(actualRatio - targetRatio) / targetRatio;

        if (ratioDiff > 0.2) {
            errors.push({
                code: 'ASPECT_RATIO_MISMATCH',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `Aspect ratio mismatch: Dimensions (${screen.width}'x${screen.height}' = ${actualRatio.toFixed(2)}) don't match specified ratio (${screen.projection.aspect_ratio})`,
                suggestion: `Current ratio differs by ${(ratioDiff * 100).toFixed(0)}% from specified`
            });
        } else if (ratioDiff > 0.1) {
            warnings.push({
                code: 'ASPECT_RATIO_SLIGHT_MISMATCH',
                severity: VALIDATION_SEVERITY.WARNING,
                message: `Aspect ratio slight mismatch: Dimensions (${screen.width}'x${screen.height}' = ${actualRatio.toFixed(2)}) approximately ${screen.projection.aspect_ratio}`,
                suggestion: `Current ratio differs by ${(ratioDiff * 100).toFixed(1)}%`
            });
        }
    }

    // Cross-field brightness and seating correlation
    if (screen.projection?.brightness_lumens && screen.seating_capacity) {
        const area = ValidationUtils.calculateArea(screen.width, screen.height);
        const brightnessDensity = ValidationUtils.calculateBrightnessDensity(screen.projection.brightness_lumens, area, screen.projection?.type);

        if (brightnessDensity.brightnessPerFt2 < 10) {
            warnings.push({
                code: 'BRIGHTNESS_DENSITY_LOW',
                severity: VALIDATION_SEVERITY.WARNING,
                message: `Brightness density (${brightnessDensity.brightnessPerFt2.toFixed(1)} lumens/ft²) may be low for screen size`,
                suggestion: 'Consider higher brightness projector or verify screen gain specifications'
            });
        }
    }

    // Screen gain and brightness correlation
    if (screen.screen_surface?.gain && screen.projection?.brightness_lumens && screen.projection?.type !== 'LED') {
        const area = ValidationUtils.calculateArea(screen.width, screen.height);
        const brightnessPerFt2 = screen.projection.brightness_lumens / area;

        if (screen.screen_surface.gain > 2.0 && brightnessPerFt2 < 50) {
            warnings.push({
                code: 'HIGH_GAIN_LOW_BRIGHTNESS',
                severity: VALIDATION_SEVERITY.WARNING,
                message: 'High screen gain (>2.0) with low brightness may result in poor image quality',
                suggestion: 'Consider increasing brightness or lowering screen gain'
            });
        }
    }

    // Return structured result
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
        summary: errors.length === 0 
            ? 'All validations passed'
            : `Found ${errors.length} error(s) and ${warnings.length} warning(s)`
    };
}

/**
 * Validates that all unique screens have no duplicates and checks for consistency
 */
function validateScreenUniqueness(screens) {
    const seen = new Map();
    const warnings = [];
    const errors = [];

    // Check for exact duplicates
    for (const screen of screens) {
        const key = `${screen.name}|${screen.screen_number}|${screen.location}`;
        
        if (seen.has(key)) {
            errors.push({
                code: 'DUPLICATE_SCREEN',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `Duplicate screen detected: "${screen.name}" Screen ${screen.screen_number} at ${screen.location}`,
                location: { index: screens.indexOf(screen) }
            });
        }
        
        seen.set(key, screen.name);
    }

    // Check for near-duplicates (same name+location, different screen number)
    const theaterScreens = new Map();
    for (const screen of screens) {
        const theaterKey = `${screen.name}|${screen.location}`;
        
        if (!theaterScreens.has(theaterKey)) {
            theaterScreens.set(theaterKey, new Set());
        }
        
        const existingNumbers = theaterScreens.get(theaterKey);
        if (existingNumbers.has(screen.screen_number)) {
            errors.push({
                code: 'DUPLICATE_SCREEN_NUMBER',
                severity: VALIDATION_SEVERITY.ERROR,
                message: `"${screen.name}" has duplicate screen number ${screen.screen_number} at ${screen.location}`,
                suggestion: 'Screen numbers must be unique within each theater'
            });
        }
        
        existingNumbers.add(screen.screen_number);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        info: [],
        summary: `Found ${errors.length} error(s) and ${warnings.length} warning(s) across ${screens.length} screens`
    };
}

const ScreensSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://theater-tech.dev/schemas/screens-schema.json',
    version: '3.0.0',
    title: 'Cinema Screen Data',
    description: 'Schema for validating cinema screen technical specifications (supports both legacy array and cities object formats)',
    type: 'object',
    validate: (data) => {
        // Support both formats:
        // 1. Legacy format: Array of screen objects
        // 2. Cities format: Object with { cities: [...] }
        if (Array.isArray(data)) {
            // Legacy format - validate as array
            return validateScreenUniqueness(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.cities)) {
            // Cities format - validate each city's screens
            for (const city of data.cities) {
                if (!city.id || !city.name || !Array.isArray(city.screens)) {
                    return 'Invalid city structure. Each city must have id, name, and screens array';
                }
                const screensValid = validateScreenUniqueness(city.screens);
                if (screensValid !== true) {
                    return `Invalid screens in city ${city.name}: ${screensValid}`;
                }
            }
            return true;
        }
        return 'Data must be either an array of screens or an object with cities array';
    },
    itemSchema: {
        type: 'object',
        required: ['name', 'location', 'width', 'height', 'color', 'plf_format', 'screen_number', 'projection', 'sound_system'],
        validate: (screen) => {
            return validateScreenConsistency(screen);
        },
        properties: {
            name: {
                type: 'string',
                description: 'Full name of the theater/screen (e.g., "Prasads PCX", "AMB Cinemas")',
                example: 'Prasads PCX',
                minLength: 1,
                maxLength: 100,
                validate: (value) => {
                    if (!value || typeof value !== 'string') return 'Screen name is required';
                    if (!/^[A-Za-z0-9\s\-\'\.]+$/.test(value)) {
                        return 'Screen name contains invalid characters';
                    }
                    return true;
                }
            },
            location: {
                type: 'string',
                description: 'Area/neighborhood where the theater is located',
                example: 'NTR Marg',
                enum: ['NTR Marg', 'Gachibowli', 'Madhapur', 'RTC X Roads', 'Hi-Tech City',
                       'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'KPHB', 'Kavadiguda',
                       'Dilsukhnagar', 'Kukatpally', 'Malkajgiri', 'Secunderabad', 'Himayatnagar',
                       'Koramangala', 'Majestic', 'Jayanagar', 'Whitefield', 'Malleshwaram',
                       'Mysore Road', 'Yeshwanthpur', 'Indiranagar', 'Parappana Agrahara'],
                validate: (value) => {
                    if (!value || typeof value !== 'string') return 'Location is required';
                    return true;
                }
            },
            width: {
                type: 'number',
                description: 'Width of the screen in feet',
                example: 101.6,
                min: 10,
                max: 200,
                validate: (value) => {
                    if (typeof value !== 'number' || isNaN(value)) return 'Width must be a number';
                    if (value <= 0) return 'Width must be positive';
                    return true;
                }
            },
            height: {
                type: 'number',
                description: 'Height of the screen in feet',
                example: 64,
                min: 10,
                max: 200,
                validate: (value) => {
                    if (typeof value !== 'number' || isNaN(value)) return 'Height must be a number';
                    if (value <= 0) return 'Height must be positive';
                    return true;
                }
            },
            color: {
                type: 'string',
                description: 'Hex color code used for visualizing the screen',
                example: '#E63946',
                validate: (value) => {
                    if (!value) return 'Color is required';
                    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
                        return 'Color must be valid hex color';
                    }
                    return true;
                }
            },
            plf_format: {
                type: 'string',
                description: 'Premium Large Format type',
                example: 'PCX',
                enum: ['PCX', 'Superplex', 'PXL', 'EPIQ', 'LUX', 'Standard', '70mm', 'IMAX', 'RPX', 'Dolby Cinema', 'MX4D', 'Prime', 'Grand', 'Big Screen'],
                validate: (value) => {
                    if (!value || typeof value !== 'string') return 'PLF format is required';
                    return true;
                }
            },
            screen_number: {
                type: 'number',
                description: 'Sequential screen number within the theater',
                example: 6,
                min: 1,
                max: 20,
                validate: (value) => {
                    if (typeof value !== 'number' || isNaN(value)) return 'Screen number must be a number';
                    if (value < 1) return 'Screen number must be at least 1';
                    return true;
                }
            },
            projection: {
                type: 'object',
                description: 'Technical details about the projection system',
                required: ['type', 'resolution'],
                properties: {
                    type: {
                        type: 'string',
                        enum: ['Laser', 'LED', 'Film', 'Lamp', 'IMAX Laser', 'RealD Laser', 'Xenon Lamp'],
                        validate: (value) => {
                            if (!value || typeof value !== 'string') return 'Projection type is required';
                            return true;
                        }
                    },
                    resolution: {
                        type: 'string',
                        enum: ['4K', '2K', '8K', '70mm Film', 'HD', 'Ultra HD', 'IMAX Digital', 'IMAX 70mm', 'RealD 3D'],
                        validate: (value) => {
                            if (!value || typeof value !== 'string') return 'Resolution is required';
                            return true;
                        }
                    },
                    brand: { type: 'string' },
                    model: { type: 'string' },
                    brightness_lumens: { type: 'number' },
                    brightness_nits: { type: 'number' },
                    aspect_ratio: { 
                        type: 'string',
                        validate: (value) => {
                            if (value && !/^\d+\.?\d*:\d+\.?\d*$/.test(value)) {
                                return 'Aspect ratio must be in format X:Y';
                            }
                            return true;
                        }
                    }
                }
            },
            sound_system: {
                type: 'object',
                required: ['format'],
                properties: {
                    format: {
                        type: 'string',
                        enum: ['Dolby Atmos', 'Dolby Digital', 'Digital Sound', 'Analog Surround', 'DTS:X', 'IMAX', 'THX', 'Sony Dynamic Digital', 'Auro 11.1', 'Dolby Surround 7.1'],
                        validate: (value) => {
                            if (!value || typeof value !== 'string') return 'Sound format is required';
                            return true;
                        }
                    },
                    channels: { type: 'number' },
                    brand: { type: 'string' }
                }
            },
            screen_surface: {
                type: 'object',
                properties: {
                    material: { type: 'string' },
                    gain: { type: 'number' }
                }
            },
            content_support: {
                type: 'object',
                properties: {
                    '3d_capability': { type: 'boolean' },
                    '4d_effects': { type: 'boolean' },
                    'hdr_support': { type: 'boolean' },
                    'hfr_support': { type: 'boolean' }
                }
            },
            seating_capacity: { type: 'number' },
            note: { type: 'string' },
            chain: { type: 'string' },
            theater_name: { type: 'string' }
        }
    }
};

export { ScreensSchema };
