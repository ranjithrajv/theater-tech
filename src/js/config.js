/**
 * Configuration Manager
 *
 * Advanced configuration management with runtime validation,
 * environment-specific settings, and dynamic loading.
 *
 * Responsibilities:
 * - Load and validate configuration files
 * - Provide runtime configuration management
 * - Environment-specific configuration handling
 * - Configuration validation and defaults
 */

class ConfigManager {
    constructor() {
        this.config = {};
        this.defaults = {};
        this.validators = {};
        this.loaded = false;
    }

    /**
     * Initialize configuration system
     * @param {Object} options - Initialization options
     */
    async initialize(options = {}) {
        console.log('⚙️ Initializing configuration system...');

        // Set defaults
        this.setDefaults();

        // Load configuration files
        await this.loadConfigurations();

        // Validate configuration
        this.validateConfiguration();

        // Apply environment-specific settings
        this.applyEnvironmentSettings();

        this.loaded = true;
        console.log('✅ Configuration system initialized');
    }

    /**
     * Set default configuration values
     */
    setDefaults() {
        this.defaults = {
            ui: {
                responsiveBreakpoints: { mobile: 768, tablet: 1024 },
                margins: {
                    mobile: { top: 20, right: 20, bottom: 60, left: 60 },
                    desktop: { top: 40, right: 40, bottom: 80, left: 80 }
                },
                dimensions: {
                    mobileHeight: 500,
                    desktopHeight: 700,
                    containerWidth: 1000,
                    scale: { mobile: 4, desktop: 7 }
                },
                comparisonLimit: 3
            },
            animations: {
                debounceDelay: 250,
                loadingDelay: 300,
                fadeDuration: 500,
                transitionDelay: 100
            },
            colors: {
                primary: '#ffd60a',
                secondary: '#1D3557',
                accent: '#E63946',
                background: '#1a1a1a',
                surface: '#2a2a2a',
                border: '#444',
                text: '#fff',
                textSecondary: '#ccc',
                textMuted: '#888'
            },
            sizeThresholds: {
                XXL: 6000,
                XL: 4000,
                L: 2000,
                M: 1200
            },
            dataPaths: {
                screens: '/data/screens.json',
                config: '/data/config.json',
                constants: '/data/constants.json',
                icons: '/data/icons.json',
                tooltips: '/data/tooltips.json'
            }
        };

        // Apply defaults
        this.config = JSON.parse(JSON.stringify(this.defaults));
    }

    /**
     * Load configuration from JSON files
     */
    async loadConfigurations() {
        const configFiles = [
            { key: 'constants', path: this.defaults.dataPaths.constants },
            { key: 'appConfig', path: this.defaults.dataPaths.config }
        ];

        for (const file of configFiles) {
            try {
                const response = await fetch(file.path);
                if (response.ok) {
                    const data = await response.json();
                    this.mergeConfig(data, file.key);
                    console.log(`📄 Loaded ${file.key} configuration`);
                } else {
                    console.warn(`⚠️ Could not load ${file.key} configuration: ${response.status}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error loading ${file.key} configuration:`, error.message);
            }
        }
    }

    /**
     * Merge loaded configuration with existing config
     * @param {Object} newConfig - New configuration data
     * @param {string} source - Source identifier
     */
    mergeConfig(newConfig, source) {
        if (source === 'constants') {
            // Handle constants file structure
            if (newConfig.ui) {
                this.config.ui = { ...this.config.ui, ...newConfig.ui };
            }
            if (newConfig.animations) {
                this.config.animations = { ...this.config.animations, ...newConfig.animations };
            }
            if (newConfig.colors) {
                this.config.colors = { ...this.config.colors, ...newConfig.colors };
            }
            if (newConfig.sizeThresholds) {
                this.config.sizeThresholds = { ...this.config.sizeThresholds, ...newConfig.sizeThresholds };
            }
            if (newConfig.dataPaths) {
                this.config.dataPaths = { ...this.config.dataPaths, ...newConfig.dataPaths };
            }
        } else if (source === 'appConfig') {
            // Handle main app config
            this.config.app = newConfig;
        }
    }

    /**
     * Validate configuration integrity
     */
    validateConfiguration() {
        const errors = [];

        // Validate required sections
        const requiredSections = ['ui', 'animations', 'colors', 'sizeThresholds'];
        for (const section of requiredSections) {
            if (!this.config[section]) {
                errors.push(`Missing required configuration section: ${section}`);
            }
        }

        // Validate color format
        if (this.config.colors) {
            for (const [key, value] of Object.entries(this.config.colors)) {
                if (typeof value === 'string' && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
                    errors.push(`Invalid color format for ${key}: ${value}`);
                }
            }
        }

        // Validate numeric values
        const numericValidations = [
            ['ui.comparisonLimit', this.config.ui?.comparisonLimit],
            ['animations.debounceDelay', this.config.animations?.debounceDelay],
            ['ui.dimensions.containerWidth', this.config.ui?.dimensions?.containerWidth]
        ];

        for (const [path, value] of numericValidations) {
            if (value !== undefined && (typeof value !== 'number' || value < 0)) {
                errors.push(`Invalid numeric value for ${path}: ${value}`);
            }
        }

        if (errors.length > 0) {
            console.warn('⚠️ Configuration validation warnings:', errors);
        }
    }

    /**
     * Apply environment-specific settings
     */
    applyEnvironmentSettings() {
        // Detect environment
        const isProduction = window.location.hostname !== 'localhost' &&
                           window.location.hostname !== '127.0.0.1';

        if (isProduction) {
            // Production-specific settings
            this.config.debug = false;
            this.config.analytics = true;
        } else {
            // Development-specific settings
            this.config.debug = true;
            this.config.analytics = false;
        }

        // Mobile detection
        const isMobile = window.innerWidth <= this.config.ui.responsiveBreakpoints.mobile;
        this.config.environment = {
            isProduction,
            isMobile,
            userAgent: navigator.userAgent,
            screenSize: { width: window.innerWidth, height: window.innerHeight }
        };
    }

    /**
     * Get configuration value
     * @param {string} path - Dot-notation path (e.g., 'ui.comparisonLimit')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set configuration value
     * @param {string} path - Dot-notation path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        let obj = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in obj) || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }

        obj[keys[keys.length - 1]] = value;
    }

    /**
     * Get all configuration
     * @returns {Object} Complete configuration object
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.config = JSON.parse(JSON.stringify(this.defaults));
        this.loaded = false;
        console.log('🔄 Configuration reset to defaults');
    }

    /**
     * Export configuration for debugging
     * @returns {Object} Exportable configuration
     */
    export() {
        return {
            config: this.getAll(),
            defaults: this.defaults,
            loaded: this.loaded,
            environment: this.config.environment,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check if configuration is loaded
     * @returns {boolean} Whether configuration is loaded
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Add custom validator
     * @param {string} path - Configuration path to validate
     * @param {Function} validator - Validation function
     */
    addValidator(path, validator) {
        this.validators[path] = validator;
    }

    /**
     * Create legacy AppConstants interface for backward compatibility
     * @returns {Object} AppConstants-like object
     */
    getAppConstants() {
        return {
            RESPONSIVE_BREAKPOINTS: {
                MOBILE: this.get('ui.responsiveBreakpoints.mobile'),
                TABLET: this.get('ui.responsiveBreakpoints.tablet')
            },
            MARGINS: {
                MOBILE: this.get('ui.margins.mobile'),
                DESKTOP: this.get('ui.margins.desktop')
            },
            DIMENSIONS: {
                MOBILE_HEIGHT: this.get('ui.dimensions.mobileHeight'),
                DESKTOP_HEIGHT: this.get('ui.dimensions.desktopHeight'),
                CONTAINER_WIDTH: this.get('ui.dimensions.containerWidth'),
                SCALE: {
                    MOBILE: this.get('ui.dimensions.scale.mobile'),
                    DESKTOP: this.get('ui.dimensions.scale.desktop')
                }
            },
            COMPARISON_LIMIT: this.get('ui.comparisonLimit'),
            ANIMATIONS: this.get('animations'),
            COLORS: this.get('colors'),
            SIZE_THRESHOLDS: this.get('sizeThresholds'),
            DATA_PATHS: this.get('dataPaths')
        };
    }
}

// Create global instance
export const Config = new ConfigManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}

if (typeof window !== 'undefined') {
    window.Config = Config;

    // Set basic AppConstants immediately for compatibility
    window.AppConstants = {
        RESPONSIVE_BREAKPOINTS: { MOBILE: 768, TABLET: 1024 },
        MARGINS: {
            MOBILE: { top: 20, right: 20, bottom: 60, left: 60 },
            DESKTOP: { top: 40, right: 40, bottom: 80, left: 80 }
        },
        DIMENSIONS: {
            MOBILE_HEIGHT: 500,
            DESKTOP_HEIGHT: 700,
            CONTAINER_WIDTH: 1000,
            SCALE: { MOBILE: 4, DESKTOP: 7 }
        },
        COMPARISON_LIMIT: 3,
        ANIMATIONS: {
            DEBOUNCE_DELAY: 250,
            LOADING_DELAY: 300,
            FADE_DURATION: 500,
            TRANSITION_DELAY: 100
        },
        COLORS: {
            PRIMARY: '#ffd60a',
            SECONDARY: '#1D3557',
            ACCENT: '#E63946',
            BACKGROUND: '#1a1a1a',
            SURFACE: '#2a2a2a',
            BORDER: '#444',
            TEXT: '#fff',
            TEXT_SECONDARY: '#ccc',
            TEXT_MUTED: '#888'
        },
        SIZE_THRESHOLDS: { XXL: 6000, XL: 4000, L: 2000, M: 1200 },
        DATA_PATHS: {
            SCREENS: '/data/screens.json',
            CONFIG: '/data/config.json'
        }
    };

    // Initialize config asynchronously and update AppConstants
    Config.initialize().then(() => {
        window.AppConstants = Config.getAppConstants();
        console.log('✅ Configuration loaded and AppConstants updated');
    }).catch(error => {
        console.warn('Failed to load enhanced configuration:', error.message);
    });
}