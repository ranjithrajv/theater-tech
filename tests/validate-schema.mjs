#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

let globalExit = 0;

function loadJSON(filePath) {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
        console.error(`  FAILED to load ${filePath}: ${err.message}`);
        globalExit = 1;
        return null;
    }
}

function softCheck(condition, message, errors) {
    if (!condition) errors.push(message);
}

function validateScreens(screens) {
    const errors = [];
    console.log('\nValidating screens.json...');

    const validPLF = ['PCX', 'Superplex', 'PXL', 'EPIQ', 'LUX', 'Standard', '70mm', '35mm', 'IMAX', 'IMAX GT', 'Dolby Cinema', 'MX4D', 'Prime', 'Grand', 'Big Screen'];
    const validProjTypes = ['Laser', 'LED', 'Film', 'Lamp', 'IMAX Laser', 'IMAX GT Laser', 'RealD Laser', 'Xenon Lamp'];
    const validResolutions = ['4K', '2K', '8K', '70mm Film', 'HD', 'Ultra HD', 'IMAX Digital', 'IMAX GT', 'IMAX 70mm', 'RealD 3D'];
    const validSoundFormats = ['Dolby Atmos', 'Dolby Digital', 'Digital Sound', 'Analog Surround', 'DTS:X', 'IMAX', 'THX'];

    screens.forEach((s, i) => {
        const tag = `[${i}] "${s.name || '?'}"`;
        softCheck(typeof s.city === 'string' && s.city.length > 0, `${tag} missing city`, errors);
        softCheck(typeof s.state === 'string' && s.state.length > 0, `${tag} missing state`, errors);
        softCheck(s.name && typeof s.name === 'string', `${tag} missing/invalid name`, errors);
        softCheck(Array.isArray(s.sources) && s.sources.length > 0, `${tag} missing sources array`, errors);
        softCheck(s.location && typeof s.location === 'string', `${tag} missing/invalid location`, errors);
        softCheck(typeof s.width === 'number' && s.width > 0, `${tag} invalid width`, errors);
        softCheck(typeof s.height === 'number' && s.height > 0, `${tag} invalid height`, errors);
        softCheck(/^#[0-9A-Fa-f]{6}$/.test(s.color), `${tag} invalid color "${s.color}"`, errors);
        softCheck(validPLF.includes(s.plf_format), `${tag} unknown plf_format "${s.plf_format}"`, errors);
        softCheck(typeof s.screen_number === 'number' && s.screen_number > 0, `${tag} invalid screen_number`, errors);

        const p = s.projection || {};
        softCheck(validProjTypes.includes(p.type), `${tag} unknown projection type "${p.type}"`, errors);
        softCheck(validResolutions.includes(p.resolution), `${tag} unknown resolution "${p.resolution}"`, errors);

        const snd = s.sound_system || {};
        softCheck(validSoundFormats.includes(snd.format), `${tag} unknown sound format "${snd.format}"`, errors);

        softCheck(typeof s.seating_capacity === 'number' && s.seating_capacity > 0, `${tag} invalid seating_capacity`, errors);

        if (s.sources) {
            s.sources.forEach((src, si) => {
                softCheck(typeof src.confidence === 'string', `${tag} sources[${si}] missing confidence`, errors);
                softCheck(typeof src.last_verified === 'string', `${tag} sources[${si}] missing last_verified`, errors);
            });
        }

        if (s.chain || s.theater_name) {
            softCheck(s.chain && s.theater_name, `${tag} chain and theater_name must be both present or both omitted`, errors);
        }
    });

    const dupes = [];
    const seen = new Set();
    screens.forEach(s => {
        const key = `${s.name}|${s.screen_number}|${s.location}`;
        if (seen.has(key)) dupes.push(key);
        seen.add(key);
    });
    softCheck(dupes.length === 0, `duplicate screens: ${dupes.join(', ')}`, errors);

    // GPS coordinate validation
    screens.forEach(s => {
        const tag = `[${s.name}]`;
        softCheck(s.gps && typeof s.gps.lat === 'number' && s.gps.lat >= -90 && s.gps.lat <= 90,
                  `${tag} GPS lat invalid (must be number between -90 and 90)`, errors);
        softCheck(s.gps && typeof s.gps.lng === 'number' && s.gps.lng >= -180 && s.gps.lng <= 180,
                  `${tag} GPS lng invalid (must be number between -180 and 180)`, errors);
    });

    if (errors.length === 0) console.log('  PASSED');
    else errors.forEach(e => console.error('  FAIL:', e));
    return errors.length;
}

function validateConfig(config) {
    const errors = [];
    console.log('\nValidating config.json...');
    softCheck(config && typeof config === 'object', 'must be an object', errors);
    softCheck(typeof config.title === 'string' && config.title.length > 0, 'missing/invalid title', errors);
    softCheck(typeof config.description === 'string', 'missing/invalid description', errors);
    softCheck(typeof config.data_current_as_of === 'string', 'missing data_current_as_of', errors);
    softCheck(Array.isArray(config.legend?.plf_formats), 'missing legend.plf_formats', errors);
    softCheck(Array.isArray(config.glossary), 'missing glossary', errors);

    if (errors.length === 0) console.log('  PASSED');
    else errors.forEach(e => console.error('  FAIL:', e));
    return errors.length;
}

function validateTooltips(tooltips) {
    const errors = [];
    console.log('\nValidating tooltips.json...');
    softCheck(tooltips && typeof tooltips === 'object', 'must be an object', errors);
    softCheck(Array.isArray(tooltips.glossaryTerms), 'missing glossaryTerms array', errors);
    softCheck(tooltips.explanations && typeof tooltips.explanations === 'object', 'missing explanations object', errors);

    if (tooltips.glossaryTerms) {
        tooltips.glossaryTerms.forEach((term, i) => {
            softCheck(typeof term === 'string' && term.length > 0, `glossaryTerms[${i}] must be a non-empty string`, errors);
        });
    }

    if (errors.length === 0) console.log('  PASSED');
    else errors.forEach(e => console.error('  FAIL:', e));
    return errors.length;
}

function validateIcons(icons) {
    const errors = [];
    console.log('\nValidating icons.json...');
    softCheck(icons && typeof icons === 'object', 'must be an object', errors);
    softCheck(icons.icons && typeof icons.icons === 'object', 'missing icons.icons', errors);

    if (icons.icons) {
        ['projection', 'sound', 'default'].forEach(cat => {
            softCheck(icons.icons[cat] && typeof icons.icons[cat] === 'object',
                `missing icons.icons.${cat}`, errors);
        });
    }

    if (errors.length === 0) console.log('  PASSED');
    else errors.forEach(e => console.error('  FAIL:', e));
    return errors.length;
}

function validateConstants(constants) {
    const errors = [];
    console.log('\nValidating constants.json...');
    softCheck(constants && typeof constants === 'object', 'must be an object', errors);
    softCheck(constants.ui && typeof constants.ui === 'object', 'missing ui', errors);
    softCheck(constants.animations && typeof constants.animations === 'object', 'missing animations', errors);
    softCheck(constants.colors && typeof constants.colors === 'object', 'missing colors', errors);
    softCheck(constants.sizeThresholds && typeof constants.sizeThresholds === 'object', 'missing sizeThresholds', errors);

    if (errors.length === 0) console.log('  PASSED');
    else errors.forEach(e => console.error('  FAIL:', e));
    return errors.length;
}

const files = [
    { name: 'screens.json', validate: validateScreens },
    { name: 'config.json', validate: validateConfig },
    { name: 'tooltips.json', validate: validateTooltips },
    { name: 'icons.json', validate: validateIcons },
    { name: 'constants.json', validate: validateConstants },
];

console.log('=== JSON Schema Validation ===');

files.forEach(({ name, validate }) => {
    const data = loadJSON(resolve(DATA_DIR, name));
    if (data !== null) {
        if (validate(data) > 0) globalExit = 1;
    }
});

console.log('\n=== Summary ===');
if (globalExit === 0) {
    console.log('All validations passed!');
} else {
    console.log('Some validations failed. Check errors above.');
}
process.exit(globalExit);
