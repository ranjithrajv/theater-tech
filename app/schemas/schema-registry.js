/**
 * Schema Registry
 * 
 * Central registry for all JSON schemas used in the application.
 * Provides easy access to schemas for validation.
 */

const SchemaRegistry = {
    screens: null,
    config: null,
    constants: null,
    tooltips: null,
    icons: null,

    schemas: {
        screens: 'ScreensSchema',
        config: 'ConfigSchema',
        constants: 'ConstantsSchema',
        tooltips: 'TooltipsSchema',
        icons: 'IconsSchema'
    },

    dataPaths: {
        screens: '../data/all_cities_screens.json',
        config: '../data/config.json',
        constants: '../data/constants.json',
        tooltips: '../data/tooltips.json',
        icons: '../data/icons.json'
    },

    initialize() {
        this.screens = window.ScreensSchema;
        this.config = window.ConfigSchema;
        this.constants = window.ConstantsSchema;
        this.tooltips = window.TooltipsSchema;
        this.icons = window.IconsSchema;
    },

    getSchema(name) {
        return this[name];
    },

    getDataPath(name) {
        return this.dataPaths[name];
    },

    getAllSchemas() {
        return {
            screens: this.screens,
            config: this.config,
            constants: this.constants,
            tooltips: this.tooltips,
            icons: this.icons
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaRegistry;
}

if (typeof window !== 'undefined') {
    window.SchemaRegistry = SchemaRegistry;
}
