/**
 * Shared Page Layout
 *
 * Single source of truth for the chrome that every page shares:
 * the nav menu, page header (title, subtitle, city selector),
 * footer legend block, and the theater-details sidebar.
 *
 * Pages opt in via placeholders in their HTML:
 *   <body data-page="index">                    selects the page config
 *   <header id="site-header"></header>          full header (nav + titles + city selector)
 *   <nav id="site-nav"></nav>                   nav links only (india map page)
 *   <div class="plf-legend" id="site-footer">   footer legend block
 *
 * Pages with `detailSidebar: true` also get the sidebar, backdrop and
 * mobile FAB appended to `.main-container`.
 *
 * Runs at import time, before the page entry point initializes the app,
 * so all injected elements exist when core.js looks them up.
 */

const NAV_LINKS = [
    { id: 'index', href: './index.html', label: 'Screen Size' },
    { id: 'seating', href: './seating.html', label: 'Seating Capacity' },
    { id: 'sound', href: './sound.html', label: 'Sound System' },
    { id: 'india', href: './india.html', label: 'India Map' }
];

const SUBTITLE = "Movie buffs' go to place";

const PAGE_CONFIG = {
    index: {
        title: 'India Cinema Technology Comparison',
        description: "Visual comparison of India's biggest cinema screens across metro cities with their dimensions and premium large format (PLF) technologies",
        usageHint: 'Select a city above • Click screens to compare • Hover for details • Hover over <span style="color: #ffd60a; text-decoration: underline dotted;">highlighted terms</span> for explanations.',
        sidebarHint: 'Tap a screen to see details',
        detailSidebar: true
    },
    seating: {
        title: 'India Cinema Seating Capacity Comparison',
        description: "Comparison of India's biggest cinema screens by seating capacity",
        usageHint: 'Select a city above • Click bars to see theater details • Hover for details.',
        sidebarHint: 'Tap a bar to see details',
        detailSidebar: true
    },
    sound: {
        title: 'India Cinema Sound System Comparison',
        description: "Comparison of India's biggest cinema screens by Dolby Atmos / surround sound channel count",
        usageHint: 'Select a city above • Hover over rings for details.',
        sidebarHint: 'Tap a bar to see details',
        detailSidebar: true
    },
    india: {}
};

function navHtml(activeId) {
    const links = NAV_LINKS.map(link => {
        const active = link.id === activeId ? ' active' : '';
        return `<a href="${link.href}" class="page-nav-link${active}">${link.label}</a>`;
    }).join('\n        ');

    return `<nav class="page-nav">
        ${links}
    </nav>`;
}

function headerHtml(pageId, cfg) {
    return `${navHtml(pageId)}

    <h1 id="page-title">${cfg.title}</h1>
    <h2>${SUBTITLE}</h2>

    <div class="city-selector-container">
        <label for="city-selector" class="city-label">🎬 Select City:</label>
        <select id="city-selector" class="city-dropdown">
            <option value="">Loading cities...</option>
        </select>
    </div>

    <div class="info" id="page-description">${cfg.description}</div>`;
}

function footerHtml(cfg) {
    return `<div style="margin-bottom: 15px;">
        <h3 id="legend-title" style="margin: 0 0 10px 0; color: #fff; font-size: 16px;">🎬 Cinema Technology Comparison Legend</h3>

        <div class="legend-sections">
            <!-- Legend content will be dynamically generated here -->
        </div>
    </div>

    <div class="usage-info" style="font-size: 12px; color: #ccc; border-top: 1px solid #555; padding-bottom: 10px; margin-top: 10px;">
        <strong>💡 How to Use:</strong> ${cfg.usageHint}
        <span id="data-attribution"></span>
    </div>
    <div class="staleness-info" style="font-size: 11px; color: #999; padding-top: 4px;">
        <span style="display: inline-block; width: 10px; height: 10px; background: transparent; border: 2px dashed #ff6b6b; margin-right: 4px; vertical-align: middle;"></span>
        Dashed border = data not verified in 6+ months
        <span style="display: inline-block; width: 10px; height: 10px; background: #555; border: 1px solid white; margin: 0 4px 0 12px; vertical-align: middle; opacity: 0.5;"></span>
        Faded = stale data
    </div>
    <details class="plf-standards" style="margin-top: 8px; font-size: 11px; color: #999; cursor: pointer;">
        <summary style="color: #ffd60a;">📏 PLF Format Standards Reference</summary>
        <div id="plf-standards-table" style="margin-top: 6px; font-size: 10px;"></div>
    </details>`;
}

function sidebarHtml(cfg) {
    return `<!-- Sidebar Backdrop (Mobile Only) -->
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-content">
            <div class="sidebar-header">
                <h3 class="sidebar-title">Theater Details</h3>
                <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Close sidebar">×</button>
            </div>
            <div class="sidebar-body" id="sidebar-body">
                <div class="sidebar-placeholder">
                    <div class="placeholder-icon">🎬</div>
                    <p>${cfg.sidebarHint}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Mobile Floating Action Button -->
    <button class="mobile-fab hide-desktop" id="mobile-fab" aria-label="Show sidebar">
        <span>ℹ️</span>
    </button>`;
}

export function initLayout() {
    const pageId = document.body?.dataset.page;
    const cfg = PAGE_CONFIG[pageId];
    if (!cfg) return;

    const header = document.getElementById('site-header');
    if (header) header.innerHTML = headerHtml(pageId, cfg);

    const nav = document.getElementById('site-nav');
    if (nav) nav.outerHTML = navHtml(pageId);

    const footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = footerHtml(cfg);

    if (cfg.detailSidebar) {
        const container = document.querySelector('.main-container');
        if (container) container.insertAdjacentHTML('beforeend', sidebarHtml(cfg));
    }
}

initLayout();
