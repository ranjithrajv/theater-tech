/**
 * Schema Registry
 * 
 * Central registry for all JSON schemas used in the application.
 * Provides easy access to schemas for validation.
 */

import { ScreensSchema } from './screens-schema.js';
import { ConfigSchema } from './config-schema.js';
import { ConstantsSchema } from './constants-schema.js';
import { TooltipsSchema } from './tooltips-schema.js';
import { IconsSchema } from './icons-schema.js';

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
        screens: `${import.meta.env.BASE_URL}data/all_cities_screens.json`,
        config: `${import.meta.env.BASE_URL}data/config.json`,
        constants: `${import.meta.env.BASE_URL}data/constants.json`,
        tooltips: `${import.meta.env.BASE_URL}data/tooltips.json`,
        icons: `${import.meta.env.BASE_URL}data/icons.json`
    },

    initialize() {
        this.screens = ScreensSchema;
        this.config = ConfigSchema;
        this.constants = ConstantsSchema;
        this.tooltips = TooltipsSchema;
        this.icons = IconsSchema;
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

export { SchemaRegistry };
