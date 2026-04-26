/**
 * HTML Template Engine
 *
 * A lightweight, reusable HTML templating library for generating
 * dynamic HTML content from data. Supports template functions,
 * partials, and context binding.
 *
 * Features:
 * - Template function registration
 * - Context-aware rendering
 * - HTML sanitization
 * - Browser and Node.js compatible
 *
 * @version 1.0.0
 * @license MIT
 */

class TemplateEngine {
    constructor(options = {}) {
        this.templates = {};
        this.partials = {};
        this.helpers = {};
        this.escapeHtml = options.escapeHtml !== false;
        this.cache = options.cache !== false;
        this.cacheStore = {};
    }

    /**
     * Register a template function
     * @param {string} name - Template name
     * @param {Function} templateFn - Template function that returns HTML string
     */
    registerTemplate(name, templateFn) {
        if (typeof templateFn !== 'function') {
            throw new Error('Template must be a function');
        }
        this.templates[name] = templateFn;
    }

    /**
     * Register a partial template
     * @param {string} name - Partial name
     * @param {string|Function} partial - Partial HTML string or function
     */
    registerPartial(name, partial) {
        this.partials[name] = partial;
    }

    /**
     * Register a helper function
     * @param {string} name - Helper name
     * @param {Function} helperFn - Helper function
     */
    registerHelper(name, helperFn) {
        if (typeof helperFn !== 'function') {
            throw new Error('Helper must be a function');
        }
        this.helpers[name] = helperFn;
    }

    /**
     * Render a template with data
     * @param {string} templateName - Name of registered template
     * @param {Object} data - Data to pass to template
     * @param {Object} options - Rendering options
     * @returns {string} Rendered HTML
     */
    render(templateName, data = {}, options = {}) {
        const template = this.templates[templateName];
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }

        // Create rendering context
        const context = {
            ...data,
            partial: (name, partialData = {}) => this.renderPartial(name, partialData, options),
            helper: (name, ...args) => this.callHelper(name, ...args),
            escape: (str) => this.escapeHtml ? this.escapeString(str) : str
        };

        try {
            const result = template(context, options);
            return typeof result === 'string' ? result : String(result);
        } catch (error) {
            console.error(`Template rendering error for '${templateName}':`, error);
            return `<div class="template-error">Template Error: ${error.message}</div>`;
        }
    }

    /**
     * Render a partial
     * @param {string} partialName - Name of registered partial
     * @param {Object} data - Data for partial
     * @param {Object} options - Rendering options
     * @returns {string} Rendered partial HTML
     */
    renderPartial(partialName, data = {}, options = {}) {
        const partial = this.partials[partialName];
        if (!partial) {
            return `<span class="partial-error">Partial '${partialName}' not found</span>`;
        }

        if (typeof partial === 'function') {
            return partial(data, options);
        }

        return partial;
    }

    /**
     * Call a helper function
     * @param {string} helperName - Name of registered helper
     * @param {...any} args - Arguments for helper
     * @returns {any} Helper result
     */
    callHelper(helperName, ...args) {
        const helper = this.helpers[helperName];
        if (!helper) {
            console.warn(`Helper '${helperName}' not found`);
            return '';
        }

        try {
            return helper(...args);
        } catch (error) {
            console.error(`Helper error for '${helperName}':`, error);
            return '';
        }
    }

    /**
     * Escape HTML string
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeString(str) {
        if (typeof str !== 'string') return str;

        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.cacheStore = {};
    }

    /**
     * Get template statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            templates: Object.keys(this.templates).length,
            partials: Object.keys(this.partials).length,
            helpers: Object.keys(this.helpers).length,
            cacheEntries: Object.keys(this.cacheStore).length
        };
    }

    /**
     * Create a cinema-specific template engine
     * @returns {TemplateEngine} Pre-configured template engine
     */
    static createCinemaTemplateEngine() {
        const engine = new TemplateEngine();

        // Register cinema-specific templates
        engine.registerTemplate('screenCard', function(context) {
            return `
                <div class="screen-card" data-screen-id="${context.name}-${context.screen_number}">
                    <h3>${context.escape(context.name)} (Screen ${context.screen_number})</h3>
                    <div class="screen-details">
                        <div class="metric">
                            <span class="label">Format:</span>
                            <span class="value">${context.escape(context.plf_format)}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Size:</span>
                            <span class="value">${context.width}' × ${context.height}'</span>
                        </div>
                        <div class="metric">
                            <span class="label">Area:</span>
                            <span class="value">${context.width * context.height} ft²</span>
                        </div>
                        <div class="metric">
                            <span class="label">Location:</span>
                            <span class="value">${context.escape(context.location)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        engine.registerTemplate('comparisonTable', function(context) {
            const { screens, metrics } = context;
            let html = '<table class="comparison-table"><thead><tr><th>Specification</th>';

            screens.forEach(screen => {
                html += `<th>${context.escape(screen.name)}<br><small>Screen ${screen.screen_number}</small></th>`;
            });

            html += '</tr></thead><tbody>';

            metrics.forEach(metric => {
                html += `<tr><td><strong>${metric.label}</strong></td>`;
                screens.forEach(screen => {
                    let value = screen[metric.key] || 'N/A';
                    if (metric.format) value = metric.format(value);
                    html += `<td>${context.escape(value)}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
            return html;
        });

        // Register helpers
        engine.registerHelper('formatArea', (width, height) => {
            if (!width || !height) return 'N/A';
            return `${width * height} ft²`;
        });

        engine.registerHelper('formatSize', (width, height) => {
            if (!width || !height) return 'N/A';
            return `${width}' × ${height}'`;
        });

        return engine;
    }
}

// Utility functions for HTML generation
const TemplateUtils = {
    /**
     * Create HTML element from tag name and attributes
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes object
     * @param {string} content - Inner content
     * @returns {string} HTML string
     */
    createElement(tag, attrs = {}, content = '') {
        const attrString = Object.entries(attrs)
            .map(([key, value]) => ` ${key}="${value}"`)
            .join('');

        if (content === null) {
            return `<${tag}${attrString} />`;
        }

        return `<${tag}${attrString}>${content}</${tag}>`;
    },

    /**
     * Create a list from array data
     * @param {Array} items - Array of items
     * @param {Function} itemTemplate - Function to render each item
     * @param {Object} options - List options
     * @returns {string} HTML list
     */
    createList(items, itemTemplate, options = {}) {
        const {
            tag = 'ul',
            itemTag = 'li',
            className = '',
            itemClass = ''
        } = options;

        const listItems = items.map(item =>
            `<${itemTag}${itemClass ? ` class="${itemClass}"` : ''}>${itemTemplate(item)}</${itemTag}>`
        ).join('');

        return `<${tag}${className ? ` class="${className}"` : ''}>${listItems}</${tag}>`;
    },

    /**
     * Sanitize HTML content
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';

        // Remove script tags and other dangerous elements
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+="[^"]*"/gi, '');
    }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateEngine, TemplateUtils };
}

if (typeof window !== 'undefined') {
    window.TemplateEngine = TemplateEngine;
    window.TemplateUtils = TemplateUtils;
}

if (typeof global !== 'undefined') {
    global.TemplateEngine = TemplateEngine;
    global.TemplateUtils = TemplateUtils;
}