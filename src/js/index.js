/**
 * Application Entry Point
 *
 * Main entry point for the Hyderabad Cinema Technology Comparison application.
 * Coordinates all modules and manages the application lifecycle.
 *
 * This file replaces the monolithic script.js and provides a clean,
 * modular application architecture.
 */

import { Config } from './config.js';
import './utils.js';
import './templates.js';
import './tooltips.js';
import './filters.js';
import { App } from './core.js';
import { UIComponents } from './ui-components.js';
import { Visualization } from './visualization.js';

// ===== APPLICATION INITIALIZATION =====

/**
 * Main application initialization function
 */
async function initializeApplication() {
    console.log('🚀 Starting Hyderabad Cinema Technology Comparison...');

    try {
        // Phase 1: Initialize configuration
        console.log('⚙️ Initializing configuration...');
        await Config.initialize();
        console.log('✅ Configuration initialized');

        // Phase 2: Application data will be loaded by App.initialize()
        console.log('📊 Application data loading delegated to core module');

        // Phase 3: Initialize core application
        console.log('🏗️ Initializing core application...');
        await App.initialize();

        console.log('✅ Application fully initialized and ready!');

    } catch (error) {
        console.error('💥 Critical application error:', error);

        // Show user-friendly error message
        showCriticalError(error);
    }
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

// ===== SERVICE WORKER REGISTRATION =====

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/theater-tech/sw.js').then(reg => {
            console.log('✅ Service Worker registered:', reg.scope);
        }).catch(err => {
            console.warn('⚠️ Service Worker registration failed:', err);
        });
    });
}

// ===== START APPLICATION =====

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}

// Export for debugging/development
if (typeof window !== 'undefined') {
    window.AppInitializer = {
        initializeApplication
    };
}
