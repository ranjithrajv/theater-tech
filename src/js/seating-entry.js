/**
 * Seating Capacity Page Entry Point
 *
 * Same application bootstrap as index.js, but renders the
 * seating-capacity bar chart instead of the to-scale screen-size chart.
 */

import { Config } from './config.js';
import './utils.js';
import './templates.js';
import './tooltips.js';
import './filters.js';
import { App } from './core.js';
import { UIComponents } from './ui-components.js';
import { Visualization } from './visualization.js';

async function initializeApplication() {
    console.log('🚀 Starting seating capacity comparison...');

    try {
        console.log('⚙️ Initializing configuration...');
        await Config.initialize();
        console.log('✅ Configuration initialized');

        App.vizMode = 'seating';

        console.log('🏗️ Initializing core application...');
        await App.initialize();

        console.log('✅ Application fully initialized and ready!');

    } catch (error) {
        console.error('💥 Critical application error:', error);
        showCriticalError(error);
    }
}

function showCriticalError(error) {
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

window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}
