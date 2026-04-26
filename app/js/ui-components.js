/**
 * UI Components Module
 *
 * Unified management of all UI interactions and components.
 * Consolidates sidebar, comparison, and event handling functionality.
 *
 * Responsibilities:
 * - Sidebar management and screen details
 * - Comparison functionality and UI
 * - Event handling and interactions
 * - UI state management
 */

class UIComponentsManager {
    constructor() {
        this.state = {
            sidebarVisible: false,
            selectedScreens: [],
            maxSelections: 3
        };

        this.elements = {};
        this.eventListeners = {};

        console.log('UIComponents instance created');
    }

    /**
     * Initialize the UI components system
     */
    init() {
        console.log('🎨 Initializing UI Components...');

        this.cacheElements();
        this.setupEventListeners();
        this.initializeComparisonSystem();
        this.initializeSidebarSystem();

        console.log('✅ UI Components initialized');
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            sidebarBody: document.getElementById('sidebar-body'),
            sidebarToggle: document.getElementById('sidebar-toggle')
        };
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Sidebar toggle
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }

    // ===== SIDEBAR MANAGEMENT =====

    /**
     * Initialize sidebar system
     */
    initializeSidebarSystem() {
        if (!this.elements.sidebarBody) return;

        // Create loading overlay
        this.createSidebarLoadingOverlay();

        // Setup sidebar transitions
        this.setupSidebarTransitions();
    }

    /**
     * Create sidebar loading overlay
     */
    createSidebarLoadingOverlay() {
        if (!this.elements.sidebarBody) return;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div>
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading screen details...</div>
            </div>
        `;

        this.elements.sidebarBody.appendChild(overlay);
        this.elements.sidebarOverlay = overlay;
    }

    /**
     * Setup sidebar transition handling
     */
    setupSidebarTransitions() {
        if (!this.elements.sidebar) return;

        this.elements.sidebar.addEventListener('transitionstart', (event) => {
            if (event.target === this.elements.sidebar && this.elements.sidebar.classList.contains('show')) {
                this.elements.sidebar.classList.add('loading');
            }
        });

        this.elements.sidebar.addEventListener('transitionend', (event) => {
            if (event.target === this.elements.sidebar) {
                this.elements.sidebar.classList.remove('loading');
            }
        });
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        if (!this.elements.sidebar || !this.elements.sidebarToggle) return;

        this.elements.sidebarToggle.classList.add('loading');

        setTimeout(() => {
            this.elements.sidebar.classList.toggle('show');
            this.state.sidebarVisible = this.elements.sidebar.classList.contains('show');

            setTimeout(() => {
                this.elements.sidebarToggle.classList.remove('loading');
            }, 200);
        }, 100);
    }

    /**
     * Update sidebar with screen details or comparison view
     */
    updateSidebar(screenData) {
        console.log('🔄 updateSidebar called for:', screenData?.name);
        if (!this.elements.sidebarBody) {
            console.log('❌ sidebarBody element not found');
            return;
        }

        // Check if we should show comparison view instead of individual screen details
        const hasSelectedScreens = this.state.selectedScreens.length > 0;

        if (hasSelectedScreens) {
            console.log('📊 Showing comparison view in sidebar (selected screens:', this.state.selectedScreens.length, ')');
            this.renderSidebarComparison();
        } else {
            console.log('✅ Updating sidebar with individual screen data');
            this.renderSidebarIndividual(screenData);
        }
    }

    /**
     * Render individual screen details in sidebar
     */
    renderSidebarIndividual(screenData) {
        // Reset sidebar width for individual view
        this.setSidebarWidth(1);

        // Show sidebar immediately
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add('show');
            console.log('👁️ Sidebar shown immediately');
        }

        // Show loading state
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add('loading');
        }
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.add('show');
        }

        // Create skeleton loader
        this.showSidebarSkeleton();

        // Simulate loading delay and render content
        setTimeout(() => {
            this.renderSidebarContent(screenData);
        }, AppConstants.ANIMATIONS.LOADING_DELAY || 300);
    }

    /**
     * Render comparison view in sidebar
     */
    renderSidebarComparison() {
        // Set sidebar width based on number of screens
        this.setSidebarWidth(this.state.selectedScreens.length);

        // Show sidebar immediately
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add('show');
            console.log('👁️ Sidebar shown for comparison view');
        }

        // Show loading state
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add('loading');
        }
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.add('show');
        }

        // Create skeleton loader
        this.showSidebarSkeleton();

        // Render comparison content
        setTimeout(() => {
            this.renderSidebarComparisonContent();
        }, AppConstants.ANIMATIONS.LOADING_DELAY || 300);
    }

    /**
     * Hide the sidebar
     */
    hideSidebar() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('show', 'loading');
        }
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.remove('show');
        }
    }

    /**
     * Set sidebar width dynamically based on content
     */
    setSidebarWidth(numScreens = 1) {
        if (!this.elements.sidebar) return;

        let newWidth;
        if (numScreens === 1) {
            newWidth = '320px';
        } else if (numScreens === 2) {
            newWidth = '500px';
        } else if (numScreens === 3) {
            newWidth = '650px';
        } else {
            newWidth = '320px';
        }

        this.elements.sidebar.style.width = newWidth;
        console.log(`📏 Sidebar width set to ${newWidth} for ${numScreens} screen(s)`);
    }

    /**
     * Show skeleton loading state
     */
    showSidebarSkeleton() {
        if (!this.elements.sidebarBody) return;

        this.elements.sidebarBody.innerHTML = `
            <div class="skeleton-container">
                <div class="skeleton-header">
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-title">
                        <div class="skeleton-title-line"></div>
                        <div class="skeleton-title-line short"></div>
                    </div>
                </div>
                <div class="skeleton-section">
                    <div class="skeleton-section-title"></div>
                    <div class="skeleton-grid">
                        <div class="skeleton-item"></div>
                        <div class="skeleton-item"></div>
                        <div class="skeleton-item"></div>
                        <div class="skeleton-item"></div>
                    </div>
                </div>
                <div class="skeleton-section">
                    <div class="skeleton-section-title"></div>
                    <div class="skeleton-row"></div>
                    <div class="skeleton-row"></div>
                </div>
                <div class="skeleton-note"></div>
            </div>
        `;
    }

    /**
     * Render actual sidebar content
     */
    renderSidebarContent(screenData) {
        console.log('🎨 Rendering sidebar content for:', screenData?.name);
        if (!this.elements.sidebarBody) {
            console.log('❌ sidebarBody element not available');
            return;
        }

        // Create screen details content
        const content = this.createScreenDetailsContent(screenData);
        console.log('📝 Generated content length:', content.length);
        this.elements.sidebarBody.innerHTML = content;
        console.log('✅ Sidebar content set');

        // Verify sidebar is visible
        if (this.elements.sidebar) {
            const isVisible = this.elements.sidebar.classList.contains('show');
            console.log('👁️ Sidebar visibility:', isVisible ? 'visible' : 'hidden');
        }

        // Hide loading states
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.remove('show');
        }
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('loading');
        }

        // Add interaction handlers
        this.setupSidebarInteractions();

        // Animate content in
        setTimeout(() => {
            this.elements.sidebarBody.style.opacity = '1';
            this.elements.sidebarBody.style.transform = 'translateY(0) scale(1)';
        }, 50);
    }

    /**
     * Render comparison content in sidebar
     */
    renderSidebarComparisonContent() {
        console.log('🎨 Rendering sidebar comparison content');
        if (!this.elements.sidebarBody) {
            console.log('❌ sidebarBody element not available');
            return;
        }

        if (this.state.selectedScreens.length === 0) {
            // Fallback to empty state
            this.elements.sidebarBody.innerHTML = `
                <div class="sidebar-placeholder">
                    <div class="placeholder-icon">📊</div>
                    <p>No screens selected for comparison</p>
                </div>
            `;
            return;
        }

        // Create compact comparison content for sidebar
        const comparisonRows = this.generateComparisonRows();

        let content = `
            <div class="sidebar-comparison">
                <div class="comparison-header">
                    <h3 class="sidebar-title">Screen Comparison</h3>
                    <span class="comparison-count">${this.state.selectedScreens.length} selected</span>
                </div>

                <div class="comparison-table-container">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th class="field-label">Field</th>
                                ${this.state.selectedScreens.map(screen => `
                                    <th class="screen-header">
                                        <div class="screen-badge" style="background: ${screen.color}">${screen.plf_format}</div>
                                        <div class="screen-name">${screen.name}</div>
                                        <div class="screen-info">Screen ${screen.screen_number} • ${screen.location}</div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${comparisonRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        console.log('📝 Generated comparison content length:', content.length);
        this.elements.sidebarBody.innerHTML = content;
        console.log('✅ Sidebar comparison content set');

        // Hide loading states
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.remove('show');
        }
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('loading');
        }

        // Add interaction handlers
        this.setupSidebarInteractions();

        // Animate content in
        setTimeout(() => {
            this.elements.sidebarBody.style.opacity = '1';
            this.elements.sidebarBody.style.transform = 'translateY(0) scale(1)';
        }, 50);
    }

    /**
     * Generate comparison table rows
     */
    generateComparisonRows() {
        const rows = [];

        // Size section
        rows.push({
            label: 'Width',
            values: this.state.selectedScreens.map(s => `<span class="value" data-numeric="true">${s.width}'</span>`)
        });
        rows.push({
            label: 'Height',
            values: this.state.selectedScreens.map(s => `<span class="value" data-numeric="true">${s.height}'</span>`)
        });
        rows.push({
            label: 'Area',
            values: this.state.selectedScreens.map(s => `<span class="value" data-numeric="true">${Math.round(s.width * s.height)} ft²</span>`)
        });

        // Chain
        const hasChain = this.state.selectedScreens.some(s => s.chain);
        if (hasChain) {
            rows.push({
                label: 'Chain',
                values: this.state.selectedScreens.map(s => `<span class="value">${s.chain ? s.chain + ' ' + (s.theater_name || '') : '-'}</span>`)
            });
        }

        // Projection section
        rows.push({
            label: 'Projection',
            values: this.state.selectedScreens.map(s => {
                const p = s.projection || {};
                return `<span class="value">${p.type || '-'} ${p.resolution || ''}</span>`;
            })
        });

        const hasProjector = this.state.selectedScreens.some(s => s.projection?.brand);
        if (hasProjector) {
            rows.push({
                label: 'Projector',
                values: this.state.selectedScreens.map(s => {
                    const p = s.projection || {};
                    return `<span class="value">${p.brand || ''}${p.model ? ' ' + p.model : ''}</span>`;
                })
            });
        }

        rows.push({
            label: 'Brightness',
            values: this.state.selectedScreens.map(s => {
                const p = s.projection || {};
                const brightness = p.brightness_lumens ? `${p.brightness_lumens.toLocaleString()} lumens` : (p.brightness_nits ? `${p.brightness_nits.toLocaleString()} nits` : '-');
                return `<span class="value" data-numeric="true">${brightness}</span>`;
            })
        });

        rows.push({
            label: 'Aspect Ratio',
            values: this.state.selectedScreens.map(s => {
                const p = s.projection || {};
                return `<span class="value">${p.aspect_ratio || '-'}</span>`;
            })
        });

        // Sound section
        rows.push({
            label: 'Sound',
            values: this.state.selectedScreens.map(s => {
                const sound = s.sound_system || {};
                return `<span class="value">${sound.format || '-'}${sound.channels ? ' ' + sound.channels : ''}</span>`;
            })
        });

        const hasSoundBrand = this.state.selectedScreens.some(s => s.sound_system?.brand);
        if (hasSoundBrand) {
            rows.push({
                label: 'Sound Brand',
                values: this.state.selectedScreens.map(s => {
                    const sound = s.sound_system || {};
                    return `<span class="value">${sound.brand || '-'}</span>`;
                })
            });
        }

        // Screen Surface
        const hasScreenSurface = this.state.selectedScreens.some(s => s.screen_surface?.material);
        if (hasScreenSurface) {
            rows.push({
                label: 'Screen',
                values: this.state.selectedScreens.map(s => {
                    const ss = s.screen_surface || {};
                    return `<span class="value">${ss.material || '-'} ${ss.gain ? '(Gain: ' + ss.gain + ')' : ''}</span>`;
                })
            });
        }

        // Seating
        rows.push({
            label: 'Seating',
            values: this.state.selectedScreens.map(s => `<span class="value" data-numeric="true">${s.seating_capacity} seats</span>`)
        });

        // Features
        rows.push({
            label: 'Features',
            values: this.state.selectedScreens.map(s => {
                const cs = s.content_support || {};
                const tags = [];
                if (cs['3d_capability']) tags.push('3D');
                if (cs['hdr_support']) tags.push('HDR');
                if (cs['hfr_support']) tags.push('HFR');
                if (cs['4d_effects']) tags.push('4D');
                return `<span class="value">${tags.length ? tags.join(', ') : 'Standard'}</span>`;
            })
        });

        // Note
        const hasNote = this.state.selectedScreens.some(s => s.note);
        if (hasNote) {
            rows.push({
                label: 'Note',
                values: this.state.selectedScreens.map(s => `<span class="value note">${s.note || '-'}</span>`)
            });
        }

        return rows.map(row => `
            <tr>
                <td class="field-label">${row.label}</td>
                ${row.values.map(v => `<td class="field-value">${v}</td>`).join('')}
            </tr>
        `).join('');
    }

    /**
     * Create screen details content
     */
    createScreenDetailsContent(screenData) {
        const area = Math.round(screenData.width * screenData.height);
        const projection = screenData.projection || {};
        const sound = screenData.sound_system || {};
        const screenSurface = screenData.screen_surface || {};
        const contentSupport = screenData.content_support || {};

        const contentTags = [];
        if (contentSupport['3d_capability']) contentTags.push('3D');
        if (contentSupport['hdr_support']) contentTags.push('HDR');
        if (contentSupport['hfr_support']) contentTags.push('HFR');
        if (contentSupport['4d_effects']) contentTags.push('4D');
        if (contentTags.length === 0) contentTags.push('Standard');

        const brightness = projection.brightness_lumens ? `${projection.brightness_lumens.toLocaleString()} lumens` : (projection.brightness_nits ? `${projection.brightness_nits.toLocaleString()} nits` : 'N/A');

        return `
            <div class="screen-details">
                <div class="screen-header">
                    <span class="screen-format-badge" style="background: ${screenData.color}">${screenData.plf_format}</span>
                    <div>
                        <div class="screen-name">${screenData.name}</div>
                        <div class="screen-location">Screen ${screenData.screen_number} • ${screenData.location}</div>
                        ${screenData.chain ? `<div class="screen-chain">${screenData.chain} ${screenData.theater_name || ''}</div>` : ''}
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">📐 Screen Size</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Width</div>
                            <div class="detail-value" data-numeric="true">${screenData.width}'</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Height</div>
                            <div class="detail-value" data-numeric="true">${screenData.height}'</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Area</div>
                            <div class="detail-value" data-numeric="true">${area} ft²</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">🎬 Projection</div>
                    <div class="detail-row">
                        <span class="detail-row-label">Type</span>
                        <span class="detail-row-value">${projection.type || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Resolution</span>
                        <span class="detail-row-value">${projection.resolution || 'N/A'}</span>
                    </div>
                    ${projection.brand ? `
                    <div class="detail-row">
                        <span class="detail-row-label">Brand</span>
                        <span class="detail-row-value">${projection.brand}</span>
                    </div>` : ''}
                    ${projection.model ? `
                    <div class="detail-row">
                        <span class="detail-row-label">Model</span>
                        <span class="detail-row-value">${projection.model}</span>
                    </div>` : ''}
                    <div class="detail-row">
                        <span class="detail-row-label">Aspect Ratio</span>
                        <span class="detail-row-value">${projection.aspect_ratio || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Brightness</span>
                        <span class="detail-row-value" data-numeric="true">${brightness}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">🔊 Sound</div>
                    <div class="detail-row">
                        <span class="detail-row-label">Format</span>
                        <span class="detail-row-value">${sound.format || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Channels</span>
                        <span class="detail-row-value" data-numeric="true">${sound.channels || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Brand</span>
                        <span class="detail-row-value">${sound.brand || 'N/A'}</span>
                    </div>
                </div>

                ${screenSurface.material ? `
                <div class="detail-section">
                    <div class="detail-title">🎥 Screen Surface</div>
                    <div class="detail-row">
                        <span class="detail-row-label">Material</span>
                        <span class="detail-row-value">${screenSurface.material}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Gain</span>
                        <span class="detail-row-value" data-numeric="true">${screenSurface.gain}</span>
                    </div>
                </div>` : ''}

                <div class="detail-section">
                    <div class="detail-title">💺 Seating</div>
                    <div class="detail-row">
                        <span class="detail-row-label">Capacity</span>
                        <span class="detail-row-value" data-numeric="true">${screenData.seating_capacity} seats</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">🎞️ Content Support</div>
                    <div class="content-tags">
                        ${contentTags.map(tag => `<span class="content-tag">${tag}</span>`).join('')}
                    </div>
                </div>

                ${screenData.note ? `<div class="screen-note">📝 ${screenData.note}</div>` : ''}
            </div>
        `;
    }

    /**
     * Setup sidebar interaction handlers
     */
    setupSidebarInteractions() {
        // Click animations
        document.querySelectorAll('.detail-item, .detail-row').forEach(item => {
            item.addEventListener('click', function() {
                this.style.animation = 'pulse 0.3s ease';
                setTimeout(() => this.style.animation = '', 300);
            });
        });

        // Ripple effects on tags
        document.querySelectorAll('.content-tag').forEach(tag => {
            tag.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute; width: 10px; height: 10px;
                    background: rgba(255,255,255,0.6); border-radius: 50%;
                    transform: translate(-50%, -50%); pointer-events: none;
                    animation: ripple 0.6s ease-out;
                `;

                const rect = this.getBoundingClientRect();
                ripple.style.left = (e.clientX - rect.left) + 'px';
                ripple.style.top = (e.clientY - rect.top) + 'px';

                this.style.position = 'relative';
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Double-click to copy numeric values
        document.querySelectorAll('.detail-value[data-numeric="true"]').forEach(value => {
            value.style.cursor = 'pointer';
            value.title = 'Double-click to copy';

            value.addEventListener('dblclick', async function() {
                try {
                    await navigator.clipboard.writeText(this.textContent);
                    const originalText = this.textContent;
                    this.textContent = '✓ Copied!';
                    this.style.background = 'rgba(78, 205, 196, 0.3)';
                    this.style.color = '#4ecdc4';
                    this.style.fontWeight = '700';

                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.background = '';
                        this.style.color = '';
                        this.style.fontWeight = '';
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });
        });
    }

    // ===== COMPARISON MANAGEMENT =====

    /**
     * Initialize comparison system
     */
    initializeComparisonSystem() {
        console.log('🎯 Initializing comparison system');
        this.state.maxSelections = AppConstants.COMPARISON_LIMIT;
        console.log('📊 Max selections set to:', this.state.maxSelections);
    }

    /**
     * Toggle screen selection for comparison
     */
    toggleScreenSelection(screenData) {
        console.log('🎯 toggleScreenSelection called for:', screenData.name, screenData.screen_number);
        console.log('📊 Current selections before:', this.state.selectedScreens.length);

        const screenElement = d3.select(`rect[data-theater="${screenData.name}"][data-screen="${screenData.screen_number}"]`);

        const existingIndex = this.state.selectedScreens.findIndex(
            s => s.name === screenData.name && s.screen_number === screenData.screen_number
        );

        if (existingIndex >= 0) {
            // Remove selection
            this.state.selectedScreens.splice(existingIndex, 1);
            screenElement.classed('screen-selected', false);
            console.log('❌ Removed selection, new count:', this.state.selectedScreens.length);
        } else {
            // Add selection (if under limit)
            if (this.state.selectedScreens.length < this.state.maxSelections) {
                this.state.selectedScreens.push(screenData);
                screenElement.classed('screen-selected', true);
                console.log('✅ Added selection, new count:', this.state.selectedScreens.length);
            } else {
                alert(`You can compare up to ${this.state.maxSelections} screens. Please deselect one first.`);
                return;
            }
        }

        console.log('🔄 Calling update functions...');

        // Show comparison view in sidebar if this is the first selection
        if (this.state.selectedScreens.length === 1) {
            console.log('📊 First screen selected, showing comparison view in sidebar');
            this.renderSidebarComparison();
        } else if (this.state.selectedScreens.length > 1) {
            // Refresh comparison view if more screens are added
            this.renderSidebarComparison();
        }

        console.log('✅ Update functions called');
    }

    /**
     * Clear all selections
     */
    clearComparison() {
        this.state.selectedScreens = [];
        document.querySelectorAll('.screen-selected').forEach(el => el.classList.remove('screen-selected'));

        // Hide sidebar when clearing selection
        this.hideSidebar();
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Check if screen is selected
     */
    isScreenSelected(screenData) {
        return this.state.selectedScreens.some(s =>
            s.name === screenData.name && s.screen_number === screenData.screen_number
        );
    }
}

// Create global instance
const UIComponents = new UIComponentsManager();

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}

if (typeof window !== 'undefined') {
    console.log('🔗 Setting window.UIComponents');
    window.UIComponents = UIComponents;
    console.log('✅ window.UIComponents set:', !!window.UIComponents);
}