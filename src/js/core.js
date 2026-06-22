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

import { Config } from './config.js';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { Validator } from './data-validator.js';
import { SchemaRegistry } from '../schemas/schema-registry.js';
import * as d3 from 'd3';
import { UIComponents } from './ui-components.js';
import { Visualization } from './visualization.js';
import { SizeUtils, debounce } from './utils.js';

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

            return {
                ...s, // Include remaining fields like name, location, color, etc.
                id: undefined, // Remove id if not needed in app data
                screen_id: screen_id, // Keep original ID if necessary
                area,
                projection,
                sound_system: sound,
                screen_surface: surface,
                content_support
            };
        });
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

            console.log('✅ All systems initialized');
        } else {
            throw new Error('Required systems not available');
        }
    }

    /**
     * Create the main visualization
     */
    createVisualization() {
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
            // Data now comes from this.data.screens and this.data.config
            // Need to reconstruct availableCities and potentially city objects if they are not directly in screens
            // For now, assume 'screens' contains city info or it's derived.
            
            // This part needs adjustment: It assumes 'window.appData.screens' and city structure.
            // Let's adapt it to use 'this.data.screens' and query for cities if needed.
            
            // If 'screens' is an array of all screens, we need to group them by city.
            // Assuming 'screens' now contains city info or we can query for unique cities.
            
            // Placeholder: if 'screens' doesn't have city info, we'd need to query a 'cities' table
            // For now, let's assume 'screens' has city info or it's available in `this.data.config` or similar.
            
            // Example: Reconstructing city list if not directly available
            const uniqueCities = {};
            if (this.data.screens) {
                this.data.screens.forEach(screen => {
                    if (screen.theater_name && screen.location) { // Assuming these define a city/location
                        if (!uniqueCities[screen.theater_name]) {
                            uniqueCities[screen.theater_name] = {
                                id: screen.theater_name.toLowerCase().replace(/\s+/g, '-'), // Simple ID
                                name: screen.theater_name,
                                state: screen.location, // Location might not be state, needs mapping
                                screens: []
                            };
                        }
                        uniqueCities[screen.theater_name].screens.push(screen);
                    }
                });
            }
            this.availableCities = Object.values(uniqueCities);

            console.log(`✅ Loaded ${this.availableCities.length} cities`);
            console.log('Available cities:', this.availableCities.map(c => c.name));

            // Populate city selector
            this.populateCitySelector();

            // Load first city by default or from localStorage
            const savedCity = localStorage.getItem('selectedCity');
            const defaultCity = savedCity && this.availableCities.find(c => c.id === savedCity)
                ? savedCity
                : (this.availableCities.length > 0 ? this.availableCities[0].id : null);

            if (defaultCity) {
                await this.selectCity(defaultCity);
            } else {
                console.warn('No default city found or selected.');
            }

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

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a city...';
        selector.appendChild(defaultOption);

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
            const city = this.availableCities.find(c => c.id === cityId);
            if (!city) {
                throw new Error(`City not found: ${cityId}`);
            }

            this.state.currentCity = cityId;
            this.data.screens = city.screens; // Use the screens associated with this city

            // Save selection to localStorage
            localStorage.setItem('selectedCity', cityId);

            // Update selector
            const selector = document.getElementById('city-selector');
            if (selector) {
                selector.value = cityId;
            }

            // Update page title and description
            this.updatePageTitle(city);

            // Recreate visualization with new data
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

        if (titleEl) {
            titleEl.textContent = `${city.name} Cinema Technology Comparison`;
        }

        if (descEl) {
            descEl.textContent = `Visual comparison of ${city.name}'s biggest cinema screens with their dimensions and premium large format (PLF) technologies`;
        }

        if (legendTitleEl) {
            legendTitleEl.textContent = `🎬 ${city.name} Cinema Technology Comparison Legend`;
        }

        if (attributionEl) {
            attributionEl.textContent = `Compare ${city.name}'s cinema technology landscape including screens, projectors, and sound systems.`;
        }

        // Update document title
        document.title = `${city.name} Cinema Technology Comparison`;
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