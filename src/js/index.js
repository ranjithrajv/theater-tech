/**
 * Application Entry Point
 *
 * Main entry point for the Hyderabad Cinema Technology Comparison application.
 * Coordinates all modules and manages the application lifecycle.
 *
 * This file replaces the monolithic script.js and provides a clean,
 * modular application architecture.
 */

// ===== MODULE IMPORTS =====
// Load core libraries (these should be loaded first)
importScripts([
    '../lib/json-schema-validator.js',
    '../lib/icon-manager.js',
    '../lib/html-templates.js'
]);

// ===== APPLICATION INITIALIZATION =====

/**
 * Main application initialization function
 */
async function initializeApplication() {
    console.log('🚀 Starting Hyderabad Cinema Technology Comparison...');

    try {
        // Phase 1: Initialize configuration
        console.log('⚙️ Initializing configuration...');
        if (typeof Config !== 'undefined') {
            await Config.initialize();
            console.log('✅ Configuration initialized');
        } else {
            throw new Error('Config module not loaded');
        }

        // Phase 2: Application data will be loaded by App.initialize()
        console.log('📊 Application data loading delegated to core module');

        // Phase 3: Initialize core application
        console.log('🏗️ Initializing core application...');
        if (typeof App !== 'undefined') {
            await App.initialize();
        } else {
            throw new Error('App module not loaded');
        }

        console.log('✅ Application fully initialized and ready!');

    } catch (error) {
        console.error('💥 Critical application error:', error);

        // Show user-friendly error message
        showCriticalError(error);
    }
}



/**
 * Helper function to load scripts dynamically
 * @param {Array<string>} scripts - Array of script paths to load
 * @returns {Promise} Promise that resolves when all scripts are loaded
 */
function importScripts(scripts) {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalScripts = scripts.length;

        if (totalScripts === 0) {
            resolve();
            return;
        }

        scripts.forEach(scriptPath => {
            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = () => {
                loadedCount++;
                console.log(`📦 Loaded ${scriptPath} (${loadedCount}/${totalScripts})`);
                if (loadedCount === totalScripts) {
                    // Give a small delay to ensure all scripts have initialized
                    setTimeout(() => {
                        console.log('✅ All scripts loaded');
                        resolve();
                    }, 100);
                }
            };
            script.onerror = (error) => {
                console.error(`❌ Failed to load script: ${scriptPath}`, error);
                reject(new Error(`Failed to load script: ${scriptPath}`));
            };
            document.head.appendChild(script);
        });
    });
}

/**
 * Show critical error to user
 * @param {Error} error - The error that occurred
 */
function showCriticalError(error) {
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.9); color: white;
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; font-family: monospace;
    `;

    errorOverlay.innerHTML = `
        <div style="text-align: center; max-width: 600px; padding: 20px;">
            <h2 style="color: #e74c3c;">🚨 Application Error</h2>
            <p>Failed to initialize the application. Please refresh the page.</p>
            <details style="text-align: left; margin-top: 20px;">
                <summary>Error Details</summary>
                <pre style="background: #333; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">${error.message}</pre>
            </details>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔄 Reload Application
            </button>
        </div>
    `;

    document.body.appendChild(errorOverlay);
}

// ===== LIFECYCLE MANAGEMENT =====

/**
 * Handle application visibility changes
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Application hidden');
    } else {
        console.log('📱 Application visible');
        // Could trigger data refresh or other actions
    }
});

/**
 * Handle online/offline status
 */
window.addEventListener('online', () => {
    console.log('🌐 Connection restored');
    // Could trigger data synchronization
});

window.addEventListener('offline', () => {
    console.log('🌐 Connection lost');
    // Could show offline notification
});

// ===== GLOBAL ERROR HANDLING =====

window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    // Could send to error monitoring service
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    // Could send to error monitoring service
});

// ===== START APPLICATION =====

/**
 * Bootstrap the application with proper loading sequence
 */
async function bootstrapApplication() {
    try {
        console.log('🔧 Bootstrapping application...');

        // Phase 1: Load all scripts
        console.log('📦 Loading application scripts...');
        await importScripts([
            'js/config.js',
            'js/utils.js',
            'js/templates.js',
            'js/tooltips.js',
            'schemas/screens-schema.js',
            'schemas/config-schema.js',
            'schemas/constants-schema.js',
            'schemas/tooltips-schema.js',
            'schemas/icons-schema.js',
            'schemas/schema-registry.js',
            'js/data-validator.js',
            'js/core.js',
            'js/ui-components.js',
            'js/visualization.js'
        ]);

        // Phase 2: Initialize application
        console.log('🚀 Starting application...');
        await initializeApplication();

    } catch (error) {
        console.error('💥 Bootstrap failed:', error);
        showCriticalError(error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApplication);
} else {
    bootstrapApplication();
}

// Export for debugging/development
if (typeof window !== 'undefined') {
    window.AppInitializer = {
        initializeApplication,
        importScripts
    };
}