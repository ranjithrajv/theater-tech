class TemplateEngine {
    constructor(options = {}) {
        this.templates = {};
        this.partials = {};
        this.helpers = {};
        this.escapeHtml = options.escapeHtml !== false;
        this.cache = options.cache !== false;
        this.cacheStore = {};
    }

    registerTemplate(name, templateFn) {
        if (typeof templateFn !== 'function') throw new Error('Template must be a function');
        this.templates[name] = templateFn;
    }

    registerPartial(name, partial) {
        this.partials[name] = partial;
    }

    registerHelper(name, helperFn) {
        if (typeof helperFn !== 'function') throw new Error('Helper must be a function');
        this.helpers[name] = helperFn;
    }

    render(templateName, data = {}, options = {}) {
        const template = this.templates[templateName];
        if (!template) throw new Error(`Template '${templateName}' not found`);
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

    renderPartial(partialName, data = {}, options = {}) {
        const partial = this.partials[partialName];
        if (!partial) return `<span class="partial-error">Partial '${partialName}' not found</span>`;
        if (typeof partial === 'function') return partial(data, options);
        return partial;
    }

    callHelper(helperName, ...args) {
        const helper = this.helpers[helperName];
        if (!helper) { console.warn(`Helper '${helperName}' not found`); return ''; }
        try { return helper(...args); } catch (error) { console.error(`Helper error for '${helperName}':`, error); return ''; }
    }

    escapeString(str) {
        if (typeof str !== 'string') return str;
        const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
        return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
    }

    clearCache() { this.cacheStore = {}; }

    getStats() {
        return { templates: Object.keys(this.templates).length, partials: Object.keys(this.partials).length, helpers: Object.keys(this.helpers).length, cacheEntries: Object.keys(this.cacheStore).length };
    }

    static createCinemaTemplateEngine() {
        const engine = new TemplateEngine();
        engine.registerTemplate('screenCard', function(context) {
            return `
                <div class="screen-card" data-screen-id="${context.name}-${context.screen_number}">
                    <h3>${context.escape(context.name)} (Screen ${context.screen_number})</h3>
                    <div class="screen-details">
                        <div class="metric"><span class="label">Format:</span><span class="value">${context.escape(context.plf_format)}</span></div>
                        <div class="metric"><span class="label">Size:</span><span class="value">${context.width}' × ${context.height}'</span></div>
                        <div class="metric"><span class="label">Area:</span><span class="value">${context.width * context.height} ft²</span></div>
                        <div class="metric"><span class="label">Location:</span><span class="value">${context.escape(context.location)}</span></div>
                    </div>
                </div>
            `;
        });
        engine.registerTemplate('comparisonTable', function(context) {
            const { screens, metrics } = context;
            let html = '<table class="comparison-table"><thead><tr><th>Specification</th>';
            screens.forEach(screen => { html += `<th>${context.escape(screen.name)}<br><small>Screen ${screen.screen_number}</small></th>`; });
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
        engine.registerHelper('formatArea', (width, height) => { if (!width || !height) return 'N/A'; return `${width * height} ft²`; });
        engine.registerHelper('formatSize', (width, height) => { if (!width || !height) return 'N/A'; return `${width}' × ${height}'`; });
        return engine;
    }
}

const TemplateUtils = {
    createElement(tag, attrs = {}, content = '') {
        const attrString = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join('');
        if (content === null) return `<${tag}${attrString} />`;
        return `<${tag}${attrString}>${content}</${tag}>`;
    },
    createList(items, itemTemplate, options = {}) {
        const { tag = 'ul', itemTag = 'li', className = '', itemClass = '' } = options;
        const listItems = items.map(item => `<${itemTag}${itemClass ? ` class="${itemClass}"` : ''}>${itemTemplate(item)}</${itemTag}>`).join('');
        return `<${tag}${className ? ` class="${className}"` : ''}>${listItems}</${tag}>`;
    },
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        return html.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<style[^>]*>.*?<\/style>/gi, '').replace(/javascript:/gi, '').replace(/on\w+="[^"]*"/gi, '');
    }
};

export { TemplateEngine, TemplateUtils };
if (typeof window !== 'undefined') { window.TemplateEngine = TemplateEngine; window.TemplateUtils = TemplateUtils; }
