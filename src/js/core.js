/**
 * Core Application Module
 *
 * Central hub for application lifecycle, data management, and UI coordination.
 * Combines data loading, UI management, and application initialization.
 *
 * Responsibilities:
 * - Application bootstrap and initialization
 * - Data loading and state management (from SQLite)
 * - UI lifecycle management
 * - Error handling and recovery
 * - Configuration management
 */

import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import * as d3 from 'd3';
import { UIComponents } from './ui-components.js';
import { Visualization } from './visualization.js';
import './data-validator.js';
import { SizeUtils, debounce } from './utils.js';
import { Filters } from './filters.js';
import { getSourceTier } from './sources.js';

// Ensure UIManager is available or stubbed
if (typeof window.UIManager === 'undefined') {
    window.UIManager = {
        isReady: true,
        pageLoader: null,
        createPageLoader: () => { /* stub */ },
        hidePageLoader: () => { /* stub */ },
        getResponsiveDimensions: () => ({
            isMobile: false,
            margin: { top: 40, right: 40, bottom: 80, left: 80 },
            width: 800,
            height: 600,
            scale: 7
        }),
        updatePageMeta: () => { /* stub */ },
        showError: (message) => { console.error("UI Error:", message); alert("Application Error: " + message); }
    };
}

// Ensure AppConstants is available or stubbed initially
if (typeof window.AppConstants === 'undefined') {
    window.AppConstants = {};
}

// Ensure IconUtils and TemplateUtils are available or stubbed
if (typeof window.IconUtils === 'undefined') window.IconUtils = {};
if (typeof window.TemplateUtils === 'undefined') window.TemplateUtils = {};


class Application {
    constructor() {
        this.vizMode = 'screen-size'; // 'screen-size' | 'seating' -- set before initialize()

        this.state = {
            initialized: false,
            dataLoaded: false,
            uiReady: false,
            error: null,
            currentCity: null
        };

        this.data = {
            screens: null,
            allCitiesData: null,
            // config, constants, icons, tooltips will be loaded from DB
        };

        this.components = {};
        this.availableCities = [];
        this.db = null; // Database instance
        this.dbPath = `${import.meta.env.BASE_URL}data/theater_tech.db`; // Path to the SQLite DB file
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🚀 Initializing India Cinema Technology Comparison...');

        try {
            // Phase 1: Load core dependencies and initialize DB
            await this.loadCoreDependencies();
            await this.initializeDatabase(); // New method to init DB
            await this.loadApplicationData();

            // Phase 2: Initialize UI and data loading from DB
            await this.initializeSystems();

            // Phase 3: Setup interactions
            this.setupInteractions();

            this.state.initialized = true;
            console.log('✅ Application initialized successfully');

        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.state.error = error;
            this.handleInitializationError(error);
            throw error; // Re-throw to allow bootstrap to handle it
        }
    }

    /**
     * Load core library dependencies and verify availability
     */
    async loadCoreDependencies() {
        console.log('📚 Verifying core dependencies...');

        // SchemaRegistry, Validator, and d3 are real ES imports above, not window
        // globals — if those failed to resolve, the import itself would have thrown.
        const systems = [
            'AppConstants',
            'IconUtils',
            'TemplateUtils',
            'JSONSchemaValidator'
        ];

        const missing = systems.filter(sys => !window[sys]);

        if (missing.length > 0) {
            console.error(`❌ Missing core dependencies: ${missing.join(', ')}`);
            if (missing.includes('AppConstants')) throw new Error('Critical dependency AppConstants not loaded. Ensure config.js is loaded.');
            throw new Error(`Missing core dependencies: ${missing.join(', ')}`);
        }

        console.log('✅ Core dependencies verified');
    }

    /**
     * Initialize SQLite database connection
     */
    async initializeDatabase() {
        console.log('🗄️ Initializing SQLite database...');
        try {
            const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl }); // Wait for sql.js to be ready
            const dbFile = await fetch(this.dbPath); // Fetch the DB file
            if (!dbFile.ok) {
                throw new Error(`Failed to fetch database file at ${this.dbPath}: ${dbFile.status} ${dbFile.statusText}`);
            }
            const bytes = new Uint8Array(await dbFile.arrayBuffer());
            this.db = new SQL.Database(bytes);
            console.log('✅ SQLite database connected and loaded');
        } catch (error) {
            console.error('❌ Failed to load or connect to SQLite database:', error);
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Load and validate application data from SQLite
     */
    async loadApplicationData() {
        console.log('📊 Loading and validating application data from SQLite...');

        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            // --- Load Constants ---
            // Fetch constants from DB and populate AppConstants
            const constantsRaw = this.queryDB("SELECT category, data_key, data_value FROM constants");
            const constantsData = this.processConstants(constantsRaw);
            window.AppConstants = { ...window.AppConstants, ...constantsData }; // Merge with defaults
            console.log('✅ Loaded constants from DB');

            // --- Load Configuration ---
            // Fetch config from DB
            const configRaw = this.queryDB("SELECT * FROM config LIMIT 1");
            const configData = configRaw.length > 0 ? configRaw[0] : {};
            // Reconstruct complex config objects if needed, or assume they are flattened in DB.
            // For now, assuming config data is simple or handled during merging.
            this.data.config = configData;
            console.log('✅ Loaded config from DB');
            // Update AppConstants with fetched config if necessary
            if (configData.title) document.title = configData.title;


            // --- Load Screens ---
            const screensRaw = this.queryDB("SELECT * FROM screens");
            const screensData = this.processScreens(screensRaw);
            this.data.screens = screensData;
            console.log(`✅ Loaded ${screensData.length} screens from DB`);

            // --- Load Tooltips ---
            const tooltipsRaw = this.queryDB("SELECT * FROM tooltips");
            const tooltipsData = this.processTooltips(tooltipsRaw);
            this.data.tooltips = tooltipsData;
            console.log('✅ Loaded tooltips from DB');

            // --- Load Icons ---
            const iconsRaw = this.queryDB("SELECT * FROM icons");
            const iconsData = this.processIcons(iconsRaw);
            this.data.icons = iconsData;
            console.log('✅ Loaded icons from DB');

            // --- Validation ---
            // The previous JSON validation logic might need to be adapted to validate data fetched from DB.
            // For now, we'll assume basic data existence and format checks are sufficient.
            // A more robust validation would involve comparing against schemas here.
            this.validateAppData();

            window.appData = {
                screens: this.data.screens,
                config: this.data.config,
                constants: constantsData, // This structure might need adjustment
                icons: this.data.icons,
                tooltips: this.data.tooltips,
                // Add other loaded data as needed
            };

            console.log('✅ Application data loaded and validated from SQLite');

        } catch (error) {
            console.error('❌ Failed to load application data from SQLite:', error);
            throw error;
        }
    }
    
    /**
     * Execute a SQL query against the database.
     * @param {string} query - The SQL query to execute.
     * @returns {Array<Object>} Array of results, each as an object.
     */
    queryDB(query) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const statement = this.db.prepare(query);
        const results = [];
        while (statement.step()) {
            results.push(statement.getAsObject());
        }
        statement.free();
        return results;
    }
    
    /**
     * Process raw data from constants table.
     */
    processConstants(rawConstants) {
        const constants = {};
        rawConstants.forEach(row => {
            const cat = row.category;
            const key = row.data_key;
            let val = row.data_value;

            if (!constants[cat]) constants[cat] = {};

            // Attempt to parse nested keys and infer types
            const parts = key.split('.');
            let current = constants[cat];
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    // Attempt type coercion
                    try {
                        if (val.includes('.')) current[part] = parseFloat(val);
                        else if (val.toLowerCase() === 'true') current[part] = true;
                        else if (val.toLowerCase() === 'false') current[part] = false;
                        else current[part] = parseInt(val, 10);
                    } catch {
                        current[part] = val; // Fallback to string
                    }
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            }
        });
        return constants;
    }

    /**
     * Process raw data from screens table.
     */
    processScreens(rawScreens) {
        return rawScreens.map(s => {
            const screen_id = s.id;
            const area = s.width * s.height;
            
            // Reconstruct nested objects (projection, sound_system, screen_surface)
            const projection = {
                type: s.projection_type,
                resolution: s.projection_resolution,
                brand: s.projection_brand,
                model: s.projection_model,
                aspect_ratio: s.projection_aspect_ratio,
            };
            const brightnessUnit = s.projection_brightness_unit;
            const brightnessVal = s.projection_brightness;
            if (brightnessUnit === 'lumens') projection.brightness_lumens = brightnessVal;
            else if (brightnessUnit === 'nits') projection.brightness_nits = brightnessVal;

            const sound = {
                format: s.sound_format,
                channels: s.sound_channels,
                brand: s.sound_brand
            };
            // Convert channels if it's a number string
            if (sound.channels && !sound.channels.includes('.') && !isNaN(Number(sound.channels))) {
                sound.channels = parseInt(sound.channels, 10);
            }

            const surface = {
                material: s.screen_surface_material,
                gain: s.screen_surface_gain
            };

            // Fetch content support features
            const supportResults = this.queryDB(`SELECT feature, value FROM content_support WHERE screen_id = ${screen_id}`);
            const content_support = {};
            supportResults.forEach(row => {
                content_support[row.feature] = !!row.value; // Ensure boolean
            });

            // Fetch full source records with tiers
            const sourceResults = this.queryDB(
                `SELECT url, publisher, published_date, confidence, tier, notes, last_verified FROM screen_sources WHERE screen_id = ${screen_id}`
            );
            const sources = sourceResults.map(row => {
                const tier = row.tier || getSourceTier({ url: row.url, confidence: row.confidence });
                return {
                    url: row.url || undefined,
                    publisher: row.publisher || undefined,
                    published_date: row.published_date || undefined,
                    confidence: row.confidence || undefined,
                    tier,
                    notes: row.notes || undefined,
                    last_verified: row.last_verified || undefined,
                };
            });
            // Earliest last_verified across all sources
            const lastVerified = sources.length > 0
                ? sources.map(s => s.last_verified).filter(Boolean).sort()[0] || null
                : null;

            return {
                ...s, // Include remaining fields like name, location, color, etc.
                id: undefined, // Remove id if not needed in app data
                screen_id: screen_id, // Keep original ID if necessary
                area,
                projection,
                sound_system: sound,
                screen_surface: surface,
                content_support,
                sources,
                sourceCount: sources.length,
                last_verified: lastVerified
            };
        });
    }

    renderPlfStandards() {
        const container = document.getElementById('plf-standards-table');
        if (!container) return;
        const standards = window.AppConstants?.plfStandards;
        if (!standards) {
            container.textContent = 'Loading...';
            return;
        }
        let html = '<table style="width:100%; border-collapse: collapse;">';
        html += '<tr style="border-bottom: 1px solid #444;"><th style="text-align:left;padding:3px 6px;color:#ffd60a;">Format</th><th style="text-align:left;padding:3px 6px;color:#ffd60a;">Screen Size</th><th style="text-align:left;padding:3px 6px;color:#ffd60a;">Sound</th><th style="text-align:left;padding:3px 6px;color:#ffd60a;">Seats</th></tr>';
        Object.entries(standards).forEach(([key, fmt]) => {
            html += `<tr style="border-bottom: 1px solid #333;"><td style="padding:3px 6px;font-weight:bold;">${key}</td><td style="padding:3px 6px;">${fmt.width_ft}×${fmt.height_ft} ft</td><td style="padding:3px 6px;">${fmt.sound}</td><td style="padding:3px 6px;">${fmt.typical_seats}</td></tr>`;
        });
        html += '</table>';
        container.innerHTML = html;
    }

    renderMethodology() {
        const container = document.getElementById('methodology-content');
        if (!container || !this.data.screens) return;

        const screens = this.data.screens;
        const total = screens.length;
        const tiers = { primary: 0, secondary: 0, listing: 0 };
        let totalSources = 0;
        let withSources = 0;
        let staleCount = 0;
        const staleScreens = [];
        const publisherCounts = new Map();

        screens.forEach(s => {
            const srcs = s.sources || [];
            if (srcs.length > 0) withSources++;
            totalSources += srcs.length;

            srcs.forEach(src => {
                const tier = src.tier || 'secondary';
                tiers[tier]++;
                const pub = (src.publisher || 'Unknown').replace(/\s*\(.*?\)/g, '').trim();
                const existing = publisherCounts.get(pub) || { count: 0, url: src.url };
                existing.count++;
                publisherCounts.set(pub, existing);
            });

            const isScreenStale = !s.last_verified || (() => {
                const parts = s.last_verified.split('-');
                if (parts.length < 2) return true;
                const ver = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
                const threshold = new Date();
                threshold.setMonth(threshold.getMonth() - 6);
                return ver < threshold;
            })();
            if (isScreenStale) {
                staleCount++;
                staleScreens.push(s);
            }
        });

        const screensWithPrimary = screens.filter(s =>
            (s.sources || []).some(src => src.tier === 'primary')
        ).length;

        // Publisher distribution (top 10)
        const sortedPublishers = [...publisherCounts.entries()]
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10);
        const maxPubCount = sortedPublishers[0]?.[1].count ?? 1;

        const publisherBars = sortedPublishers.map(([name, { count, url }]) => `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="color:#ccc;font-size:10px;width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${name}">${name}</span>
                <div style="flex:1;height:12px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;">
                    <div style="height:100%;background:rgba(56,189,248,0.35);border-radius:2px;width:${(count / maxPubCount) * 100}%;"></div>
                </div>
                <span style="color:#888;font-size:10px;width:20px;text-align:right;">${count}</span>
            </div>
        `).join('');

        // Stale screens list (top 15)
        const staleList = staleScreens.slice(0, 15).map(s => {
            const lv = s.last_verified || 'never';
            return `<span style="display:inline-block;padding:2px 6px;margin:2px;border:1px solid rgba(239,68,68,0.3);border-radius:3px;font-size:10px;color:#fca5a5;background:rgba(239,68,68,0.08);" title="Last verified: ${lv}">${s.name} <span style="color:#666;">·</span> ${lv}</span>`;
        }).join('');
        const staleOverflow = staleScreens.length > 15 ? `<span style="color:#888;font-size:10px;"> +${staleScreens.length - 15} more</span>` : '';

        // City breakdown
        const cityStats = {};
        screens.forEach(s => {
            const city = s.city || 'Unknown';
            if (!cityStats[city]) cityStats[city] = { total: 0, stale: 0 };
            cityStats[city].total++;
        });
        staleScreens.forEach(s => {
            const city = s.city || 'Unknown';
            if (cityStats[city]) cityStats[city].stale++;
        });

        const now = new Date();
        const lastUpdated = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">
                <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:4px;text-align:center;">
                    <div style="color:#ffd60a;font-size:18px;font-weight:700;">${total}</div>
                    <div style="color:#888;font-size:10px;">Total screens</div>
                </div>
                <div style="background:rgba(74,222,128,0.1);padding:8px;border-radius:4px;text-align:center;">
                    <div style="color:#4ade80;font-size:18px;font-weight:700;">${screensWithPrimary}</div>
                    <div style="color:#888;font-size:10px;">Verified (primary)</div>
                </div>
                <div style="background:rgba(239,68,68,0.1);padding:8px;border-radius:4px;text-align:center;">
                    <div style="color:#ef4444;font-size:18px;font-weight:700;">${staleCount}</div>
                    <div style="color:#888;font-size:10px;">Stale (>6mo)</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                <div style="background:rgba(74,222,128,0.08);padding:6px 8px;border-radius:4px;">
                    <div style="color:#4ade80;font-weight:600;">${tiers.primary}</div>
                    <div style="color:#888;font-size:10px;">Primary sources</div>
                </div>
                <div style="background:rgba(56,189,248,0.08);padding:6px 8px;border-radius:4px;">
                    <div style="color:#38bdf8;font-weight:600;">${tiers.secondary}</div>
                    <div style="color:#888;font-size:10px;">News sources</div>
                </div>
                <div style="background:rgba(148,163,184,0.08);padding:6px 8px;border-radius:4px;">
                    <div style="color:#94a3b8;font-weight:600;">${tiers.listing}</div>
                    <div style="color:#888;font-size:10px;">Listing sources</div>
                </div>
                <div style="background:rgba(255,255,255,0.03);padding:6px 8px;border-radius:4px;">
                    <div style="color:#ffd60a;font-weight:600;">${totalSources}</div>
                    <div style="color:#888;font-size:10px;">Total sources</div>
                </div>
            </div>

            <div style="border-top:1px solid #333;padding-top:8px;margin-bottom:8px;">
                <div style="color:#aaa;font-size:11px;font-weight:600;margin-bottom:6px;">Source Distribution by Publisher</div>
                ${publisherBars}
            </div>

            <div style="border-top:1px solid #333;padding-top:8px;margin-bottom:8px;">
                <div style="color:#aaa;font-size:11px;font-weight:600;margin-bottom:6px;">Screens Needing Verification (${staleCount})</div>
                <div style="display:flex;flex-wrap:wrap;gap:2px;">
                    ${staleList || '<span style="color:#666;font-size:10px;">All screens verified within 6 months.</span>'}
                    ${staleOverflow}
                </div>
            </div>

            <div style="border-top:1px solid #333;padding-top:8px;font-size:10px;color:#666;">
                <div>Avg sources per screen: <strong style="color:#ccc;">${total > 0 ? (totalSources / total).toFixed(1) : 0}</strong></div>
                <div>Screens with sources: <strong style="color:#ccc;">${withSources}/${total}</strong> (${total > 0 ? Math.round(withSources / total * 100) : 0}%)</div>
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #333;">
                    <strong style="color:#aaa;">Suggested citation:</strong> India Cinema Technology Comparison, ${now.getFullYear()}. <span style="color:#38bdf8;">theater-tech</span>
                    <br>Last updated: ${lastUpdated}
                </div>
            </div>
        `;
    }

    /**
     * Process raw data from tooltips table.
     */
    processTooltips(rawTooltips) {
        const tooltips = { glossaryTerms: [], explanations: {} };
        rawTooltips.forEach(t => {
            if (t.category === 'glossary') {
                tooltips.glossaryTerms.push(t.term);
            } else if (t.category === 'explanation') {
                tooltips.explanations[t.term] = t.explanation;
            }
        });
        return tooltips;
    }

    /**
     * Process raw data from icons table.
     */
    processIcons(rawIcons) {
        const iconsData = { icons: {}, techDescriptions: {} };
        rawIcons.forEach(i => {
            if (i.category === 'techDescriptions') { // Handle tech descriptions separately
                if (!iconsData.techDescriptions[i.category]) iconsData.techDescriptions[i.category] = {};
                 // Assuming icon_key is the same as tech_key for this table
                iconsData.techDescriptions[i.category][i.tech_key] = i.tech_value;
            } else {
                if (!iconsData.icons[i.category]) iconsData.icons[i.category] = {};
                iconsData.icons[i.category][i.icon_key] = i.icon_value;
            }
        });
        return iconsData;
    }

    /**
     * Perform basic validation on loaded application data.
     */
    validateAppData() {
        console.log('🧪 Validating application data...');
        const errors = [];

        // Validate screens data
        if (!this.data.screens || !Array.isArray(this.data.screens) || this.data.screens.length === 0) {
            errors.push('Screens data is missing or empty.');
        } else {
            // Basic check: ensure at least some screens have valid dimensions
            const hasValidDimensions = this.data.screens.some(s => s.width > 0 && s.height > 0);
            if (!hasValidDimensions) {
                errors.push('No screens with valid dimensions found.');
            }
        }

        // Validate config data
        if (!this.data.config || !this.data.config.title || !this.data.config.description) {
            errors.push('Config data is missing or incomplete (title/description).');
        }
        // Add more config validations as needed

        // Validate tooltips data
        if (!this.data.tooltips || !this.data.tooltips.glossaryTerms || !this.data.tooltips.explanations) {
            errors.push('Tooltips data is missing or incomplete.');
        }

        // Validate icons data
        if (!this.data.icons || !this.data.icons.icons?.projection || !this.data.icons.icons?.sound) {
             errors.push('Icons data is missing or incomplete.');
        }
        
        if (errors.length > 0) {
            console.error('❌ Data validation failed:', errors);
            throw new Error(`Data validation failed: ${errors.join('; ')}`);
        }
        console.log('✅ Application data validated');
    }

    /**
     * Initialize all systems
     */
    async initializeSystems() {
        console.log('🔧 Initializing all systems...');

        // Application data is loaded from DB in initialize(), before this runs.

        // UI should already be initialized by UIManager
        // Components should already be initialized by UIComponents

        if (UIComponents.init) {
            UIComponents.init();
            console.log('✅ UIComponents initialized');
        }

        if (typeof UIManager !== 'undefined' && UIManager.isReady &&
            window.appData) {

            // No need to set this.data.config from appData if config is loaded separately
            // this.data.config = window.appData.config;
            
            this.state.dataLoaded = true;
            this.state.uiReady = true;

            // Load all cities data and populate selector
            await this.loadAllCitiesData();

            this.setupFilters();
            this.renderPlfStandards();
            this.renderMethodology();

            console.log('✅ All systems initialized');
        } else {
            throw new Error('Required systems not available');
        }
    }

    setupFilters() {
        Filters.init('#filter-bar');
        Filters.setData(this.data.screens);

        Filters.onChange((filteredData) => {
            if (this.vizMode === 'screen-size') {
                Visualization.initialize(filteredData);
            } else if (this.vizMode === 'seating') {
                Visualization.initializeSeatingChart(
                    [...filteredData].sort((a, b) => b.seating_capacity - a.seating_capacity)
                );
            } else if (this.vizMode === 'sound') {
                Visualization.initializeSoundChart(
                    [...filteredData].map(s => ({
                        ...s,
                        channelCount: parseFloat(s.sound_system?.channels) || 0
                    })).sort((a, b) => b.channelCount - a.channelCount)
                );
            }
        });
    }

    /**
     * Create the main visualization
     */
    createVisualization() {
        if (this.vizMode === 'seating') {
            this.createSeatingVisualization();
            return;
        }
        if (this.vizMode === 'sound') {
            this.createSoundVisualization();
            return;
        }

        console.log('🎨 Attempting to create visualization...');
        console.log('Visualization available:', typeof Visualization);
        console.log('Data available:', !!this.data.screens);
        console.log('Data length:', this.data.screens ? this.data.screens.length : 'N/A');

        if (this.data.screens && this.data.screens.length > 0) {
            try {
                const processedData = this.data.screens.map(screen => {
                    const area = screen.width * screen.height;
                    let category = 'Unknown';
                    try {
                        category = SizeUtils.getSizeCategory(screen.width, screen.height);
                    } catch (error) {
                        console.warn('SizeUtils not available for category calculation:', error);
                    }
                    return {
                        ...screen,
                        area,
                        category
                    };
                }).sort((a, b) => b.area - a.area);

                console.log('Processed data sample:', processedData.slice(0, 2));
                console.log('Calling Visualization.initialize...');

                Visualization.initialize(processedData);
                console.log(`📊 Visualization created with ${processedData.length} screens`);
            } catch (error) {
                console.error('❌ Error creating visualization:', error);
                console.error('Error stack:', error.stack);
            }
        } else {
            console.error('❌ Visualization system or data not available');
            console.error('Visualization type:', typeof Visualization);
            console.error('Data exists:', !!this.data.screens);
        }
    }

    /**
     * Create the seating-capacity comparison visualization
     */
    createSeatingVisualization() {
        if (!this.data.screens || this.data.screens.length === 0) {
            console.error('❌ No screen data available for seating visualization');
            return;
        }

        try {
            const processedData = [...this.data.screens].sort((a, b) => b.seating_capacity - a.seating_capacity);
            Visualization.initializeSeatingChart(processedData);
            console.log(`📊 Seating visualization created with ${processedData.length} screens`);
        } catch (error) {
            console.error('❌ Error creating seating visualization:', error);
        }
    }

    /**
     * Create the sound-system comparison visualization (ranked by Dolby Atmos/surround channel count)
     */
    createSoundVisualization() {
        if (!this.data.screens || this.data.screens.length === 0) {
            console.error('❌ No screen data available for sound visualization');
            return;
        }

        try {
            const processedData = this.data.screens
                .map(screen => ({
                    ...screen,
                    channelCount: parseFloat(screen.sound_system?.channels) || 0
                }))
                .sort((a, b) => b.channelCount - a.channelCount);
            Visualization.initializeSoundChart(processedData);
            console.log(`📊 Sound visualization created with ${processedData.length} screens`);
        } catch (error) {
            console.error('❌ Error creating sound visualization:', error);
        }
    }

    /**
     * Setup application interactions
     */
    setupInteractions() {
        console.log('🎮 Setting up interactions...');

        // Window resize handler - debounce to prevent excessive calls
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, AppConstants.ANIMATIONS?.DEBOUNCE_DELAY || 300)); // 300ms debounce

        // Setup mobile interactions
        this.setupMobileInteractions();

        console.log('✅ Interactions setup complete');
    }

    /**
     * Setup mobile-specific interactions
     */
    setupMobileInteractions() {
        const isMobile = window.innerWidth <= (AppConstants?.RESPONSIVE_BREAKPOINTS?.MOBILE || 768);
        
        if (isMobile) {
            console.log('📱 Setting up mobile interactions...');
            
            // Setup sidebar backdrop
            const backdrop = document.getElementById('sidebar-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => {
                    this.hideMobileSidebar();
                });
            }
            
            // Setup sidebar toggle
            const toggle = document.getElementById('sidebar-toggle');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    this.hideMobileSidebar();
                });
            }
            
            // Setup mobile FAB
            const fab = document.getElementById('mobile-fab');
            if (fab) {
                fab.addEventListener('click', () => {
                    this.showMobileSidebar();
                });
            }
            
            // Touch swipe handling for sidebar
            this.setupTouchSwipe();
            
            console.log('✅ Mobile interactions setup complete');
        }
    }

    /**
     * Setup touch swipe for mobile sidebar
     */
    setupTouchSwipe() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        let startY = 0;
        let currentY = 0;
        
        sidebar.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        sidebar.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            // If swiping down from top of sidebar
            if (diff > 0 && sidebar.scrollTop === 0) {
                e.preventDefault();
                sidebar.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: false });
        
        sidebar.addEventListener('touchend', () => {
            const diff = currentY - startY;
            
            // If swiped down more than 100px, close sidebar
            if (diff > 100) {
                this.hideMobileSidebar();
            } else {
                // Reset position
                sidebar.style.transform = '';
            }
        });
    }

    /**
     * Show mobile sidebar
     */
    showMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const fab = document.getElementById('mobile-fab');
        
        if (sidebar) {
            sidebar.classList.add('show');
            sidebar.style.transform = '';
        }
        
        if (backdrop) {
            backdrop.classList.add('show');
        }
        
        if (fab) {
            fab.classList.remove('show');
            fab.classList.add('hide');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide mobile sidebar
     */
    hideMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const fab = document.getElementById('mobile-fab');
        
        if (sidebar) {
            sidebar.classList.remove('show');
        }
        
        if (backdrop) {
            backdrop.classList.remove('show');
        }
        
        if (fab) {
            fab.classList.remove('hide');
            fab.classList.add('show');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Update mobile FAB visibility based on content
     */
    updateMobileFAB(show) {
        const fab = document.getElementById('mobile-fab');
        if (!fab) return;
        
        if (show && window.innerWidth <= 768) {
            fab.classList.remove('hide');
            fab.classList.add('show');
        } else {
            fab.classList.remove('show');
            fab.classList.add('hide');
        }
    }

    /**
     * Handle window resize with responsive updates
     */
    handleResize() {
        console.log('📱 Window resized, updating responsive elements...');

        // Check if visualization exists and update it
        if (this.data.screens) {
            try {
                Visualization.updateData(this.data.screens);
                console.log('✅ Visualization updated for new window size');
            } catch (error) {
                console.error('❌ Error updating visualization on resize:', error);
            }
        } else {
            console.warn('⚠️ Skipping resize update - visualization not ready');
        }
    }

    /**
     * Load all cities data and populate city selector
     */
    async loadAllCitiesData() {
        console.log('🏙️ Loading all cities data...');

        try {
            const cityMap = {};
            (this.data.screens || []).forEach(s => {
                const cityName = s.city || 'Unknown';
                if (!cityMap[cityName]) {
                    cityMap[cityName] = {
                        id: cityName.toLowerCase().replace(/\s+/g, '-'),
                        name: cityName,
                        state: s.state || '',
                        screens: []
                    };
                }
                cityMap[cityName].screens.push(s);
            });

            this.availableCities = Object.values(cityMap);

            console.log(`✅ Loaded ${this.availableCities.length} cities`);
            console.log('Available cities:', this.availableCities.map(c => c.name));

            // Populate city selector
            this.populateCitySelector();

            // Always default to All India on page load
            await this.selectCity('__all__');

        } catch (error) {
            console.error('❌ Failed to load cities data:', error);
            throw error;
        }
    }

    /**
     * Populate city selector dropdown
     */
    populateCitySelector() {
        const selector = document.getElementById('city-selector');
        if (!selector) {
            console.warn('⚠️ City selector not found in DOM');
            return;
        }

        // Clear existing options
        selector.innerHTML = '';

        // Add All India option
        const allOption = document.createElement('option');
        allOption.value = '__all__';
        allOption.textContent = '🇮🇳 All India';
        selector.appendChild(allOption);

        // Add city options
        this.availableCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = `${city.name}${city.state ? `, ${city.state}` : ''}`;
            selector.appendChild(option);
        });

        // Add change event listener
        selector.addEventListener('change', async (e) => {
            const cityId = e.target.value;
            if (cityId) {
                await this.selectCity(cityId);
            }
        });

        console.log('✅ City selector populated');
    }

    /**
     * Select a city and load its screens
     */
    async selectCity(cityId) {
        console.log(`🎯 Selecting city: ${cityId}`);

        try {
            if (cityId === '__all__') {
                this.state.currentCity = '__all__';
                this.data.screens = this.availableCities.flatMap(c => c.screens);

                const selector = document.getElementById('city-selector');
                if (selector) selector.value = '__all__';

                this.updatePageTitle({ name: 'All India', state: '', screens: this.data.screens });

                Filters.setData(this.data.screens);
                Filters.reset();
                this.createVisualization();

                console.log(`✅ Showing all ${this.data.screens.length} screens across ${this.availableCities.length} cities`);
                return;
            }

            const city = this.availableCities.find(c => c.id === cityId);
            if (!city) {
                throw new Error(`City not found: ${cityId}`);
            }

            this.state.currentCity = cityId;
            this.data.screens = city.screens;

            // Update selector
            const selector = document.getElementById('city-selector');
            if (selector) {
                selector.value = cityId;
            }

            // Update page title and description
            this.updatePageTitle(city);

            // Reset filters and recreate visualization
            Filters.setData(this.data.screens);
            Filters.reset();
            this.createVisualization();

            console.log(`✅ City selected: ${city.name} with ${city.screens.length} screens`);

        } catch (error) {
            console.error('❌ Failed to select city:', error);
            throw error;
        }
    }

    /**
     * Update page title and description for selected city
     */
    updatePageTitle(city) {
        const titleEl = document.getElementById('page-title');
        const descEl = document.getElementById('page-description');
        const legendTitleEl = document.getElementById('legend-title');
        const attributionEl = document.getElementById('data-attribution');

        const isAll = city.name === 'All India';
        const cityName = isAll ? 'All India' : city.name;

        if (titleEl) {
            titleEl.textContent = isAll
                ? 'India Cinema Technology Comparison — All India'
                : `${cityName} Cinema Technology Comparison`;
        }

        if (descEl) {
            descEl.textContent = isAll
                ? `Visual comparison of cinema screens across ${this.availableCities.length} Indian cities with their dimensions, projection, and sound technologies`
                : `Visual comparison of ${cityName}'s biggest cinema screens with their dimensions and premium large format (PLF) technologies`;
        }

        if (legendTitleEl) {
            legendTitleEl.textContent = isAll
                ? '🎬 All India Cinema Technology Comparison Legend'
                : `🎬 ${cityName} Cinema Technology Comparison Legend`;
        }

        if (attributionEl) {
            attributionEl.textContent = isAll
                ? `Compare cinema technology across ${this.availableCities.map(c => c.name).join(', ')} including screens, projectors, and sound systems.`
                : `Compare ${cityName}'s cinema technology landscape including screens, projectors, and sound systems.`;
        }

        document.title = isAll
            ? 'India Cinema Technology Comparison — All India'
            : `${cityName} Cinema Technology Comparison`;
    }

    /**
     * Setup visualization interactions
     */
    setupVisualizationInteractions(svg, screens) {
        // Screen click and hover events
        screens
            .on("click", (event, d) => {
                if (this.components.comparison) {
                    this.components.comparison.toggleScreenSelection(d);
                }
            })
            .on("mouseover", debounce((event, d) => {
                this.handleScreenHover(event, d, true);
            }, AppConstants.ANIMATIONS?.DEBOUNCE_DELAY || 300))
            .on("mouseout", () => {
                this.handleScreenHover(null, null, false);
            });
    }

    /**
     * Handle screen hover/tap interactions
     */
    handleScreenHover(event, screenData, isHover) {
        const screens = d3.selectAll('.screen-rect');
        const isMobile = window.innerWidth <= (AppConstants?.RESPONSIVE_BREAKPOINTS?.MOBILE || 768);

        if (isHover && screenData) {
            // Highlight hovered/tapped screen
            screens
                .attr("opacity", 0.3)
                .filter(d => d.name === screenData.name && d.screen_number === screenData.screen_number)
                .attr("opacity", 1)
                .style("filter", "brightness(1.2) drop-shadow(0 0 10px rgba(255, 214, 10, 0.6))")
                .style("transform", "scale(1.02)");

            // Update sidebar
            if (this.components.sidebar) {
                this.components.sidebar.updateSidebar(screenData);
            }
            
            // On mobile, show FAB to access details
            if (isMobile) {
                this.updateMobileFAB(true);
                
                // Auto-open sidebar on mobile for better UX
                if (event && event.type === 'click') {
                    this.showMobileSidebar();
                }
            }
        } else {
            // Reset all screens
            screens
                .attr("opacity", 0.7)
                .style("filter", "none")
                .style("transform", "none");
            
            // On mobile desktop, we keep the FAB visible if there's content
            if (isMobile && this.components.sidebar && !this.components.sidebar.hasContent()) {
                this.updateMobileFAB(false);
            }
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('💥 Critical initialization error:', error);

        if (typeof UIManager !== 'undefined') {
            UIManager.showError('Failed to initialize application. Please refresh the page.');
        }

        this.reportError(error, 'initialization');
    }

    /**
     * Handle data validation errors
     */
    handleValidationError(error) {
        console.error('🚨 Data validation error:', error);

        if (typeof UIManager !== 'undefined') {
            UIManager.showError('Data validation failed. Please check the console for details.');
        }

        this.reportError(error, 'validation');
    }



    /**
     * Report errors for monitoring/debugging
     */
    reportError(error, context) {
        const errorReport = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // In a real application, this would send to error monitoring service
        console.error('Error Report:', errorReport);
    }

    /**
     * Get application state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get application data
     */
    getData() {
        return { ...this.data };
    }

    /**
     * Check if application is ready
     */
    isReady() {
        return this.state.initialized && this.state.dataLoaded && this.state.uiReady;
    }
}

// Export for use in other modules
export const App = new Application();

// No auto-initialization here - that's handled by index.js