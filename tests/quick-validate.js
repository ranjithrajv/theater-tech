#!/usr/bin/env node

/**
 * Quick validation test for data files
 * This is a Node.js compatible version to verify data integrity
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Quick Data Validation Tests\n');

const files = {
    screens: './data/screens.json',
    config: './data/config.json',
    constants: './data/constants.json',
    tooltips: './data/tooltips.json',
    icons: './data/icons.json'
};

let allPassed = true;

function validateScreens(data) {
    if (!Array.isArray(data)) {
        return { success: false, error: 'Screens must be an array' };
    }
    if (data.length === 0) {
        return { success: false, error: 'Screens array cannot be empty' };
    }

    const required = ['name', 'location', 'width', 'height', 'color', 'plf_format', 'screen_number', 'projection', 'sound_system'];
    const validFormats = ['PCX', 'Superplex', 'PXL', 'EPIQ', 'LUX', 'Standard', '70mm'];
    const validProjectionTypes = ['Laser', 'LED', 'Film', 'Lamp'];
    const validSoundFormats = ['Dolby Atmos', 'Dolby Digital', 'Digital Sound', 'Analog Surround', 'DTS:X', 'IMAX'];

    const errors = [];

    data.forEach((screen, i) => {
        required.forEach(field => {
            if (!(field in screen)) {
                errors.push(`Screen ${i}: Missing required field "${field}"`);
            }
        });

        if (screen.width !== undefined && (typeof screen.width !== 'number' || screen.width <= 0)) {
            errors.push(`Screen ${i} (${screen.name || 'unknown'}): Invalid width`);
        }
        if (screen.height !== undefined && (typeof screen.height !== 'number' || screen.height <= 0)) {
            errors.push(`Screen ${i} (${screen.name || 'unknown'}): Invalid height`);
        }
        if (screen.plf_format && !validFormats.includes(screen.plf_format)) {
            errors.push(`Screen ${i} (${screen.name || 'unknown'}): Invalid PLF format "${screen.plf_format}"`);
        }
        if (screen.projection && screen.projection.type && !validProjectionTypes.includes(screen.projection.type)) {
            errors.push(`Screen ${i} (${screen.name || 'unknown'}): Invalid projection type "${screen.projection.type}"`);
        }
        if (screen.sound_system && screen.sound_system.format && !validSoundFormats.includes(screen.sound_system.format)) {
            errors.push(`Screen ${i} (${screen.name || 'unknown'}): Invalid sound format "${screen.sound_system.format}"`);
        }
    });

    return {
        success: errors.length === 0,
        errors: errors.slice(0, 10),
        totalErrors: errors.length,
        itemCount: data.length
    };
}

function validateConfig(data) {
    const errors = [];

    if (!data.title) errors.push('Missing title');
    if (!data.description) errors.push('Missing description');
    if (!data.data_current_as_of || !/^\d{4}$/.test(data.data_current_as_of)) {
        errors.push('Invalid data_current_as_of (must be YYYY format)');
    }

    if (!data.legend || !Array.isArray(data.legend.plf_formats)) {
        errors.push('Missing or invalid legend.plf_formats');
    }

    if (!data.glossary || !Array.isArray(data.glossary)) {
        errors.push('Missing or invalid glossary');
    }

    return { success: errors.length === 0, errors };
}

function validateConstants(data) {
    const errors = [];

    if (!data.ui) errors.push('Missing ui section');
    if (!data.colors) errors.push('Missing colors section');
    if (!data.animations) errors.push('Missing animations section');
    if (!data.sizeThresholds) errors.push('Missing sizeThresholds section');

    if (data.colors) {
        const colorKeys = ['primary', 'secondary', 'accent', 'background', 'surface', 'border', 'text'];
        colorKeys.forEach(key => {
            if (!data.colors[key] || !/^#[0-9A-Fa-f]{3}$/.test(data.colors[key]) && !/^#[0-9A-Fa-f]{6}$/.test(data.colors[key])) {
                errors.push(`Invalid or missing color: ${key} (${data.colors[key]})`);
            }
        });
    }

    return { success: errors.length === 0, errors };
}

function validateTooltips(data) {
    const errors = [];

    if (!data.glossaryTerms || !Array.isArray(data.glossaryTerms)) {
        errors.push('Missing or invalid glossaryTerms array');
    }

    if (!data.explanations || typeof data.explanations !== 'object') {
        errors.push('Missing or invalid explanations object');
    }

    return { success: errors.length === 0, errors };
}

function validateIcons(data) {
    const errors = [];

    if (!data.icons || typeof data.icons !== 'object') {
        errors.push('Missing or invalid icons object');
    }

    return { success: errors.length === 0, errors };
}

const validators = {
    screens: validateScreens,
    config: validateConfig,
    constants: validateConstants,
    tooltips: validateTooltips,
    icons: validateIcons
};

Object.entries(files).forEach(([name, filePath]) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        const result = validators[name](data);

        if (result.success) {
            const itemCount = result.itemCount || 1;
            console.log(`✅ ${name.toUpperCase().padEnd(12)} - PASSED (${itemCount} items)`);
        } else {
            console.log(`❌ ${name.toUpperCase().padEnd(12)} - FAILED`);
            result.errors.forEach(err => console.log(`   - ${err}`));
            if (result.totalErrors !== undefined && result.totalErrors > result.errors.length) {
                console.log(`   ... and ${result.totalErrors - result.errors.length} more errors`);
            }
            allPassed = false;
        }
    } catch (error) {
        console.log(`💥 ${name.toUpperCase().padEnd(12)} - ERROR: ${error.message}`);
        allPassed = false;
    }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ All validation tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some validation tests failed');
    process.exit(1);
}
