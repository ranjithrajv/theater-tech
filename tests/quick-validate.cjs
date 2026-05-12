#!/usr/bin/env node

/**
 * Quick validation test for data integrity from SQLite
 */

import { open } from 'sqlite'; // Using node-sqlite3 for simplicity in Node.js environment
import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

const dbPath = './data/theater_tech.db';
let db;

async function initializeDB() {
    if (!db) {
        try {
            db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });
            console.log('✅ Connected to SQLite database.');
        } catch (error) {
            console.error('❌ Failed to connect to SQLite database:', error.message);
            throw error;
        }
    }
}

async function runQuery(query) {
    if (!db) await initializeDB();
    return db.all(query);
}

async function validateScreensTable() {
    console.log('🧪 Validating SCREENS table...');
    const screens = await runQuery('SELECT COUNT(*) as count FROM screens');
    if (screens.length === 0 || screens[0].count === 0) {
        return { success: false, error: 'Screens table is empty or missing.' };
    }
    // Add more specific checks if needed (e.g., checking column existence, basic data types)
    console.log(`   - Found ${screens[0].count} screens.`);
    return { success: true };
}

async function validateConfigTable() {
    console.log('🧪 Validating CONFIG table...');
    const config = await runQuery('SELECT COUNT(*) as count FROM config');
    if (config.length === 0 || config[0].count === 0) {
        return { success: false, error: 'Config table is empty or missing.' };
    }
    console.log(`   - Found ${config[0].count} config entries.`);
    return { success: true };
}

async function validateConstantsTable() {
    console.log('🧪 Validating CONSTANTS table...');
    const constants = await runQuery('SELECT COUNT(*) as count FROM constants');
    if (constants.length === 0 || constants[0].count === 0) {
        return { success: false, error: 'Constants table is empty or missing.' };
    }
    console.log(`   - Found ${constants[0].count} constant entries.`);
    return { success: true };
}

async function validateTooltipsTable() {
    console.log('🧪 Validating TOOLTIPS table...');
    const tooltips = await runQuery('SELECT COUNT(*) as count FROM tooltips');
    if (tooltips.length === 0 || tooltips[0].count === 0) {
        return { success: false, error: 'Tooltips table is empty or missing.' };
    }
    console.log(`   - Found ${tooltips[0].count} tooltip entries.`);
    return { success: true };
}

async function validateIconsTable() {
    console.log('🧪 Validating ICONS table...');
    const icons = await runQuery('SELECT COUNT(*) as count FROM icons');
    if (icons.length === 0 || icons[0].count === 0) {
        return { success: false, error: 'Icons table is empty or missing.' };
    }
    console.log(`   - Found ${icons[0].count} icon entries.`);
    return { success: true };
}

async function runAllValidations() {
    console.log('🧪 Quick Data Validation Tests
');
    let allPassed = true;

    const results = {
        screens: await validateScreensTable(),
        config: await validateConfigTable(),
        constants: await validateConstantsTable(),
        tooltips: await validateTooltipsTable(),
        icons: await validateIconsTable()
    };

    for (const [name, result] of Object.entries(results)) {
        if (result.success) {
            console.log(`✅ ${name.toUpperCase().padEnd(12)} - PASSED`);
        } else {
            console.log(`❌ ${name.toUpperCase().padEnd(12)} - FAILED`);
            console.log(`   - ${result.error}`);
            allPassed = false;
        }
    }

    console.log('
' + '='.repeat(50));
    if (allPassed) {
        console.log('✅ All validation tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some validation tests failed');
        process.exit(1);
    }
}

// Need to handle dynamic import for 'sqlite3' and 'open'
async function main() {
    await initializeDB();
    await runAllValidations();
    if (db) {
        await db.close();
    }
}

main().catch(error => {
    console.error("An error occurred during validation:", error);
    process.exit(1);
});
