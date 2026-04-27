/**
 * Core Application Module
 *
 * Central hub for application lifecycle, data management, and UI coordination.
 * Combines data loading, UI management, and application initialization.
 *
 * Responsibilities:
 * - Application bootstrap and initialization
 * - Data loading and state management
 * - UI lifecycle management
 * - Error handling and recovery
 * - Configuration management
 */

// Simple UIManager stub for compatibility
window.UIManager = {
    isReady: true,
    pageLoader: null,

    createPageLoader() {
        if (this.pageLoader) return this.pageLoader;

        const loader = document.createElement('div');
        loader.className = 'page-loading';
        loader.innerHTML = `
            <div class="page-loading-spinner"></div>
            <div class="page-loading-text">Loading cinema data...</div>
        `;
        document.body.appendChild(loader);
        this.pageLoader = loader;
        return loader;
    },

    hidePageLoader() {
        if (this.pageLoader) {
            this.pageLoader.classList.add('fade-out');
            setTimeout(() => {
                if (this.pageLoader) {
                    this.pageLoader.remove();
                    this.pageLoader = null;
                }
            }, AppConstants?.ANIMATIONS?.FADE_DURATION || 500);
        }
    },

    getResponsiveDimensions() {
        const isMobile = window.innerWidth <= (AppConstants?.RESPONSIVE_BREAKPOINTS?.MOBILE || 768);
        const margin = isMobile ?
            (AppConstants?.MARGINS?.MOBILE || { top: 20, right: 20, bottom: 60, left: 60 }) :
            (AppConstants?.MARGINS?.DESKTOP || { top: 40, right: 40, bottom: 80, left: 80 });

        const containerWidth = Math.min(AppConstants?.DIMENSIONS?.CONTAINER_WIDTH || 1000, window.innerWidth - 40);
        const width = containerWidth - margin.left - margin.right;
        const height = (isMobile ?
            (AppConstants?.DIMENSIONS?.MOBILE_HEIGHT || 500) :
            (AppConstants?.DIMENSIONS?.DESKTOP_HEIGHT || 700)) - margin.top - margin.bottom;
        const scale = isMobile ?
            (AppConstants?.DIMENSIONS?.SCALE?.MOBILE || 4) :
            (AppConstants?.DIMENSIONS?.SCALE?.DESKTOP || 7);

        return { isMobile, margin, width, height, scale };
    },

    updatePageMeta(configData) {
        // Only update if elements haven't been customized by city selection
        const titleEl = document.getElementById('page-title');
        if (!titleEl && configData.title) {
            document.title = configData.title;
        }
        
        const infoElement = document.getElementById('page-description');
        if (infoElement && configData.description && !infoElement.textContent.includes('biggest cinema screens')) {
            infoElement.textContent = configData.description;
        }
        
        const attributionElement = document.getElementById('data-attribution');
        if (attributionElement && configData.data_current_as_of && !attributionElement.textContent) {
            attributionElement.textContent = `Compare cinema technology landscape including screens, projectors, and sound systems. Data current as of ${configData.data_current_as_of}.`;
        }
    },

    showError(message) {
        console.error('Application Error:', message);
        // Could show a user-friendly error UI here
        alert(`Application Error: ${message}`);
    }
};

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
            config: null,
            constants: null,
            icons: null,
            tooltips: null
        };

        this.components = {};
        this.availableCities = [];
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Initializing India Cinema Technology Comparison...');

            // Phase 1: Load core dependencies
            await this.loadCoreDependencies();

            // Phase 2: Initialize UI and data loading
            await this.initializeSystems();

            // Phase 3: Setup interactions (visualization will be created after city selection)
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
     * Load core library dependencies
     */
    async loadCoreDependencies() {
        console.log('📚 Verifying core dependencies...');

        const systems = [
            'AppConstants',
            'IconUtils',
            'TemplateUtils',
            'JSONSchemaValidator',
            'SchemaRegistry',
            'Validator',
            'd3'
        ];

        const missing = systems.filter(sys => !window[sys]);

        if (missing.length > 0) {
            console.error(`❌ Missing core dependencies: ${missing.join(', ')}`);

            // Provide more specific error messages for critical dependencies
            if (missing.includes('d3')) {
                throw new Error('Critical dependency D3.js not loaded. Please ensure d3.v7.min.js is loaded before application scripts.');
            }

            if (missing.includes('AppConstants')) {
                throw new Error('Critical dependency AppConstants not loaded. Please ensure config.js is loaded before core.js.');
            }

            throw new Error(`Missing core dependencies: ${missing.join(', ')}`);
        }

        console.log('✅ Core dependencies verified');
    }

    async loadApplicationData() {
        console.log('📊 Loading and validating application data...');

        try {
            if (typeof Validator === 'undefined') {
                throw new Error('Validator not available');
            }

            Validator.initialize();

            const validationResults = await Validator.validateAllFiles();

            if (!validationResults.allPassed) {
                console.error('❌ Data validation failed with errors:');

                let errorMessages = [];
                for (const error of validationResults.errors) {
                    const errorText = error.errors
                        ? Validator.formatErrors(error.errors)
                        : error.error;
                    errorMessages.push(`\n${error.dataType}: ${errorText}`);
                }

                throw new Error(`Data validation failed:\n${errorMessages.join('')}`);
            }

            const screensResult = validationResults.results.screens;
            const configResult = validationResults.results.config;

            window.appData = {
                screens: screensResult.data,
                config: configResult.data,
                validationResults: validationResults.results
            };

            console.log('✅ Application data loaded and validated');

        } catch (error) {
            console.error('❌ Failed to load application data:', error);

            if (error.message.includes('validation failed')) {
                this.handleValidationError(error);
            }

            throw error;
        }
    }



    /**
     * Initialize all systems
     */
    async initializeSystems() {
        console.log('🔧 Initializing all systems...');

        // Load application data first
        await this.loadApplicationData();

        // UI should already be initialized by UIManager
        // Components should already be initialized by UIComponents

        // Initialize UIComponents if available
        if (typeof UIComponents !== 'undefined' && typeof UIComponents.init === 'function') {
            UIComponents.init();
            console.log('✅ UIComponents initialized');
        }

        // Just verify everything is ready
        if (typeof UIManager !== 'undefined' && UIManager.isReady &&
            window.appData && typeof UIComponents !== 'undefined') {

            this.data.config = window.appData.config;
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

        if (typeof Visualization !== 'undefined' && this.data.screens) {
            try {
                const processedData = this.data.screens.map(screen => {
                    const area = screen.width * screen.height;
                    let category = 'Unknown';
                    try {
                        if (typeof SizeUtils !== 'undefined' && SizeUtils.getSizeCategory) {
                            category = SizeUtils.getSizeCategory(screen.width, screen.height);
                        }
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
        }, 300)); // 300ms debounce

        // Setup mobile interactions
        this.setupMobileInteractions();

        console.log('✅ Interactions setup complete');
    }

    /**
     * Setup mobile-specific interactions
     */
    setupMobileInteractions() {
        const isMobile = window.innerWidth <= 768;
        
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
        if (typeof Visualization !== 'undefined' && this.data.screens) {
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
            if (!window.appData || !window.appData.screens) {
                throw new Error('No cities data available');
            }

            this.data.allCitiesData = window.appData.screens;
            this.availableCities = this.data.allCitiesData.cities || [];

            console.log(`✅ Loaded ${this.availableCities.length} cities`);
            console.log('Available cities:', this.availableCities.map(c => c.name));

            // Populate city selector
            this.populateCitySelector();

            // Load first city by default or from localStorage
            const savedCity = localStorage.getItem('selectedCity');
            const defaultCity = savedCity && this.availableCities.find(c => c.id === savedCity) 
                ? savedCity 
                : (this.availableCities[0]?.id || null);

            if (defaultCity) {
                await this.selectCity(defaultCity);
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
            option.textContent = `${city.name}, ${city.state}`;
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
            this.data.screens = city.screens;

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
            }, AppConstants.ANIMATIONS.DEBOUNCE_DELAY))
            .on("mouseout", () => {
                this.handleScreenHover(null, null, false);
            });
    }

    /**
     * Handle screen hover/tap interactions
     */
    handleScreenHover(event, screenData, isHover) {
        const screens = d3.selectAll('.screen-rect');
        const isMobile = window.innerWidth <= 768;

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

// Create global application instance
const App = new Application();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}

if (typeof window !== 'undefined') {
    window.App = App;
}

// No auto-initialization here - that's handled by index.js