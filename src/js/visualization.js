/**
 * Visualization Module
 *
 * Handles D3.js chart creation, rendering, and updates.
 * Separated from core application logic for better maintainability.
 *
 * Responsibilities:
 * - D3.js chart initialization
 * - Screen visualization rendering
 * - Axis and scale management
 * - Chart updates and interactions
 */

import * as d3 from 'd3';
import { isStale } from './sources.js';

class VisualizationManager {
    constructor() {
        this.svg = null;
        this.screens = null;
        this.dimensions = {};
        this.margins = {};
        this.scales = {};
        this.axes = {};
    }

    /**
     * Initialize the visualization
     * @param {Array} data - Screen data to visualize
     * @param {Object} options - Visualization options
     */
    initialize(data, _options = {}) {
        console.log('📊 Initializing visualization...');
        console.log('Data received:', data ? data.length : 'no data');

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('❌ No valid data provided to visualization');
            return;
        }

        try {
            this.calculateDimensions();
            console.log('✅ Dimensions calculated');

            this.createSVG();
            console.log('✅ SVG created');

            this.setupScales();
            console.log('✅ Scales setup');

            this.createAxes();
            console.log('✅ Axes created');

            this.renderScreens(data);
            console.log('✅ Screens rendered');

            this.renderLabels(data);
            console.log('✅ Labels rendered');

            this.setupInteractions();
            console.log('✅ Interactions setup');

            console.log('✅ Visualization initialized successfully');
        } catch (error) {
            console.error('❌ Error during visualization initialization:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }

    /**
     * Initialize the seating-capacity bar chart
     * @param {Array} data - Screen data, pre-sorted by seating_capacity desc
     */
    initializeSeatingChart(data) {
        console.log('📊 Initializing seating capacity chart...');

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('❌ No valid data provided to seating chart');
            return;
        }

        try {
            this.calculateDimensions();
            this.createSeatingSVG(data);
            this.setupSeatingScales(data);
            this.createSeatingAxes();
            this.renderSeatingBars(data);
            this.setupInteractions();

            console.log('✅ Seating chart initialized successfully');
        } catch (error) {
            console.error('❌ Error during seating chart initialization:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    /**
     * Create the SVG container for the seating chart (wider left margin for theater names)
     */
    createSeatingSVG(data) {
        const { height } = this.dimensions;
        const barHeight = 36;
        const seatingMargins = { top: 20, right: 60, bottom: 50, left: 160 };
        const chartHeight = Math.max(height, data.length * barHeight);

        this.dimensions.height = chartHeight;
        this.margins = seatingMargins;

        const container = document.getElementById('chart-container');
        if (!container) {
            console.error('❌ Chart container not found!');
            return;
        }

        d3.select("#chart-container svg").remove();

        const { width } = this.dimensions;
        this.svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width + seatingMargins.left + seatingMargins.right)
            .attr("height", chartHeight + seatingMargins.top + seatingMargins.bottom)
            .append("g")
            .attr("transform", `translate(${seatingMargins.left},${seatingMargins.top})`);
    }

    /**
     * Setup scales for the seating chart (band scale for theaters, linear for seat counts)
     */
    setupSeatingScales(data) {
        const { width, height } = this.dimensions;
        const maxSeats = Math.max(...data.map(d => d.seating_capacity));

        this.scales = {
            x: d3.scaleLinear()
                .domain([0, maxSeats * 1.1])
                .range([0, width]),
            y: d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([0, height])
                .padding(0.25)
        };
    }

    /**
     * Create and render axes for the seating chart
     */
    createSeatingAxes() {
        const { width, height } = this.dimensions;
        const { svg, scales } = this;

        this.axes.x = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(scales.x).ticks(8));

        this.axes.x.append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "white")
            .style("text-anchor", "middle")
            .text("Seating Capacity (seats)");

        this.axes.y = svg.append("g")
            .call(d3.axisLeft(scales.y));

        this.axes.y.selectAll("text")
            .attr("fill", "white")
            .style("font-size", "12px");
    }

    /**
     * Render seating-capacity bars
     * @param {Array} data - Screen data
     */
    renderSeatingBars(data) {
        const { scales } = this;

        this.screens = this.svg.selectAll(".seating-bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "screen-rect seating-bar")
            .attr("x", 0)
            .attr("y", d => scales.y(d.name))
            .attr("width", d => scales.x(d.seating_capacity))
            .attr("height", scales.y.bandwidth())
            .attr("fill", d => d.color)
            .attr("stroke", d => isStale(d.last_verified) ? '#ff6b6b' : 'white')
            .attr("stroke-width", d => isStale(d.last_verified) ? 2 : 1)
            .attr("stroke-dasharray", d => isStale(d.last_verified) ? '4,3' : 'none')
            .attr("opacity", d => isStale(d.last_verified) ? 0.45 : 0.7)
            .attr("data-theater", d => d.name)
            .attr("data-screen", d => d.screen_number);

        this.svg.selectAll(".seating-label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "seating-label")
            .attr("x", d => scales.x(d.seating_capacity) + 8)
            .attr("y", d => scales.y(d.name) + scales.y.bandwidth() / 2 + 4)
            .attr("fill", "white")
            .style("font-size", "12px")
            .text(d => d.seating_capacity);

        console.log(`📐 Rendered ${this.screens.size()} seating bars`);
    }

    /**
     * Initialize the sound-system radial chart: one concentric ring per
     * theater, each ring's arc sweeping clockwise from 12 o'clock by an
     * angle proportional to its channel count. Highest channel count gets
     * the outermost ring. A full-circle "track" behind each arc shows the
     * 100% reference, and radial gridlines mark 25/50/75% of the max.
     * @param {Array} data - Screen data, pre-sorted by channelCount desc
     */
    initializeSoundChart(data) {
        console.log('📊 Initializing sound system radial chart...');

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('❌ No valid data provided to sound chart');
            return;
        }

        try {
            this.calculateDimensions();
            this.createRadialSoundSVG(data);
            this.renderSoundGridlines(data);
            this.renderSoundRings(data);
            this.setupInteractions();

            console.log('✅ Sound chart initialized successfully');
        } catch (error) {
            console.error('❌ Error during sound chart initialization:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    /**
     * Create the SVG container for the radial sound chart, centered, with
     * a small margin for the gridline value labels just outside the rings.
     */
    createRadialSoundSVG(data) {
        const ringThickness = 10;
        const ringGap = 1;
        const innerRadius = 50;
        const outerRadius = innerRadius + data.length * (ringThickness + ringGap);
        const labelMargin = 40;
        const size = (outerRadius + labelMargin) * 2;

        this.soundRadial = { innerRadius, ringThickness, ringGap, outerRadius };

        const container = document.getElementById('chart-container');
        if (!container) {
            console.error('❌ Chart container not found!');
            return;
        }

        d3.select("#chart-container svg").remove();

        this.svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", size)
            .attr("height", size)
            .append("g")
            .attr("transform", `translate(${size / 2},${size / 2})`);
    }

    /**
     * Render faint radial gridlines (25/50/75/100% of max channel count)
     * with value labels, for reading approximate magnitude.
     */
    renderSoundGridlines(data) {
        const { svg } = this;
        const { innerRadius, outerRadius } = this.soundRadial;
        const maxChannels = Math.max(...data.map(d => d.channelCount));
        const fractions = [0.25, 0.5, 0.75, 1];

        fractions.forEach(fraction => {
            const angle = fraction * 2 * Math.PI;
            const x1 = Math.sin(angle) * innerRadius;
            const y1 = -Math.cos(angle) * innerRadius;
            const x2 = Math.sin(angle) * outerRadius;
            const y2 = -Math.cos(angle) * outerRadius;

            svg.append("line")
                .attr("class", "sound-gridline")
                .attr("x1", x1).attr("y1", y1)
                .attr("x2", x2).attr("y2", y2)
                .attr("stroke", "rgba(255,255,255,0.15)");

            svg.append("text")
                .attr("x", x2)
                .attr("y", y2)
                .attr("dy", fraction === 1 ? "-0.6em" : "0.35em")
                .attr("fill", "rgba(255,255,255,0.6)")
                .style("font-size", "10px")
                .style("text-anchor", "middle")
                .text(Math.round(fraction * maxChannels));
        });
    }

    /**
     * Render the concentric value rings and tip labels.
     * @param {Array} data - Screen data with channelCount, pre-sorted desc
     */
    renderSoundRings(data) {
        const { innerRadius, ringThickness, ringGap } = this.soundRadial;
        const maxChannels = Math.max(...data.map(d => d.channelCount));

        const ringData = data.map((d, i) => {
            const ringIndex = data.length - 1 - i; // highest value -> outermost ring
            const inner = innerRadius + ringIndex * (ringThickness + ringGap);
            const outer = inner + ringThickness;
            const fraction = d.channelCount / maxChannels;
            return { ...d, inner, outer, endAngle: fraction * 2 * Math.PI };
        });

        // Background full-circle tracks (100% reference)
        this.svg.selectAll(".sound-ring-track")
            .data(ringData)
            .enter()
            .append("path")
            .attr("class", "sound-ring-track")
            .attr("d", d3.arc().innerRadius(d => d.inner).outerRadius(d => d.outer).startAngle(0).endAngle(2 * Math.PI))
            .attr("fill", "rgba(255,255,255,0.06)");

        // Foreground value arcs
        this.screens = this.svg.selectAll(".sound-ring")
            .data(ringData)
            .enter()
            .append("path")
            .attr("class", "screen-rect sound-ring")
            .attr("d", d3.arc().innerRadius(d => d.inner).outerRadius(d => d.outer).startAngle(0).endAngle(d => d.endAngle))
            .attr("fill", d => d.color)
            .attr("stroke", d => isStale(d.last_verified) ? '#ff6b6b' : 'white')
            .attr("stroke-width", d => isStale(d.last_verified) ? 2 : 1)
            .attr("stroke-dasharray", d => isStale(d.last_verified) ? '4,3' : 'none')
            .attr("opacity", d => isStale(d.last_verified) ? 0.5 : 0.8)
            .attr("data-theater", d => d.name)
            .attr("data-screen", d => d.screen_number);

        this.renderSoundLegend(data);

        console.log(`📐 Rendered ${this.screens.size()} sound rings`);
    }

    /**
     * Render a textual legend (outermost ring first) next to the radial
     * chart, since many theaters share identical channel counts and would
     * collide if labeled directly on the rings.
     * @param {Array} data - Screen data, pre-sorted by channelCount desc
     */
    renderSoundLegend(data) {
        const container = document.getElementById('chart-container');
        if (!container) return;

        container.querySelector('.sound-radial-legend')?.remove();

        const legend = document.createElement('div');
        legend.className = 'sound-radial-legend';

        data.forEach(d => {
            const row = document.createElement('div');
            row.className = 'sound-radial-legend-row';
            row.dataset.theater = d.name;
            row.dataset.screen = d.screen_number;
            row.innerHTML = `
                <span class="sound-radial-legend-swatch" style="background:${d.color}"></span>
                <span class="sound-radial-legend-name">${d.name}</span>
                <span class="sound-radial-legend-value">${d.sound_system.format} ${d.sound_system.channels}</span>
            `;
            row.addEventListener('click', () => {
                if (window.UIComponents) {
                    window.UIComponents.toggleScreenSelection(d);
                }
            });
            row.addEventListener('mouseover', () => this.handleScreenHover(null, d, true));
            row.addEventListener('mouseout', () => this.handleScreenHover(null, null, false));
            legend.appendChild(row);
        });

        container.appendChild(legend);
    }

    /**
     * Calculate responsive dimensions
     */
    calculateDimensions() {
        const { isMobile, margin, width, height, scale } = UIManager.getResponsiveDimensions();

        console.log('Calculated dimensions:', { isMobile, margin, width, height, scale });

        this.dimensions = { isMobile, width, height, scale };
        this.margins = margin;
    }

    /**
     * Create the main SVG container
     */
    createSVG() {
        console.log('D3 available:', typeof d3);
        console.log('d3.select available:', typeof d3?.select);

        if (typeof d3 === 'undefined') {
            console.error('❌ D3.js library not loaded!');
            return;
        }

        const { width, height } = this.dimensions;
        const { margins } = this;

        console.log('Creating SVG with dimensions:', { width, height, margins });

        // Check if chart container exists
        const container = document.getElementById('chart-container');
        console.log('Chart container exists:', !!container);

        if (!container) {
            console.error('❌ Chart container not found!');
            return;
        }

        // Remove existing SVG if it exists
        d3.select("#chart-container svg").remove();

        this.svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width + margins.left + margins.right)
            .attr("height", height + margins.top + margins.bottom)
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        console.log('SVG created:', !!this.svg);
        console.log('SVG dimensions set to:', width + margins.left + margins.right, 'x', height + margins.top + margins.bottom);
    }

    /**
     * Setup scales for the visualization
     */
    setupScales() {
        const { width, height } = this.dimensions;

        // Set up scales to represent actual feet dimensions
        // Domain represents feet, range represents pixels
        this.scales = {
            x: d3.scaleLinear()
                .domain([0, 110])  // 0 to 110 feet width
                .range([0, width]), // Map to full chart width
            y: d3.scaleLinear()
                .domain([0, 70])   // 0 to 70 feet height
                .range([height, 0]) // Map to full chart height (inverted)
        };

        console.log('Axis scales configured:', {
            xDomain: this.scales.x.domain(),
            xRange: this.scales.x.range(),
            yDomain: this.scales.y.domain(),
            yRange: this.scales.y.range()
        });
    }

    /**
     * Create and render axes
     */
    createAxes() {
        const { width, height } = this.dimensions;
        const { svg, scales } = this;

        // X-axis
        this.axes.x = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(scales.x).tickFormat(d => d + "ft"));

        this.axes.x.append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "white")
            .style("text-anchor", "middle")
            .text("Screen Width (feet)");

        // Y-axis
        this.axes.y = svg.append("g")
            .call(d3.axisLeft(scales.y).tickFormat(d => d + "ft"));

        this.axes.y.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .attr("fill", "white")
            .style("text-anchor", "middle")
            .text("Screen Height (feet)");
    }

    /**
     * Render screen rectangles
     * @param {Array} data - Screen data
     */
    renderScreens(data) {
        const { scales } = this;

        // Sort screens by area (largest first for proper layering)
        const sortedData = [...data].sort((a, b) => (b.width * b.height) - (a.width * a.height));

        console.log('Rendering screens:', sortedData.length);
        console.log('Sample screen data:', sortedData[0]);

        this.screens = this.svg.selectAll("rect")
            .data(sortedData)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", d => {
                const yPos = scales.y(d.height);
                return yPos;
            })
            .attr("width", d => {
                const screenWidth = scales.x(d.width) - scales.x(0);
                return screenWidth;
            })
            .attr("height", d => {
                const screenHeight = scales.y(0) - scales.y(d.height);
                return screenHeight;
            })
            .attr("fill", d => d.color)
            .attr("stroke", d => isStale(d.last_verified) ? '#ff6b6b' : 'white')
            .attr("stroke-width", d => isStale(d.last_verified) ? 2 : 1)
            .attr("stroke-dasharray", d => isStale(d.last_verified) ? '4,3' : 'none')
            .attr("opacity", d => isStale(d.last_verified) ? 0.45 : 0.7)
            .attr("class", "screen-rect")
            .attr("data-theater", d => d.name)
            .attr("data-screen", d => d.screen_number);

        // Log verification of screen dimensions
        console.log('Screen dimension verification:');
        sortedData.slice(0, 3).forEach(screen => {
            const pixelWidth = scales.x(screen.width) - scales.x(0);
            const pixelHeight = scales.y(0) - scales.y(screen.height);
            console.log(`${screen.name}: ${screen.width}ft x ${screen.height}ft -> ${pixelWidth.toFixed(1)}px x ${pixelHeight.toFixed(1)}px`);
        });

        console.log(`📐 Rendered ${this.screens.size()} screen rectangles using axis scales`);
    }

    /**
     * Render text labels and indicators
     * @param {Array} data - Screen data
     */
    renderLabels(data) {
        const { scales } = this;
        const sortedData = [...data].sort((a, b) => (b.width * b.height) - (a.width * a.height));

        // Theater names
        this.svg.selectAll(".label-name")
            .data(sortedData)
            .enter()
            .append("text")
            .attr("class", "label-name")
            .attr("x", 8)
            .attr("y", d => scales.y(d.height) + 15)
            .attr("fill", "white")
            .style("font-size", "12px")
            .text(d => d.name);

        // Size category indicators
        this.svg.selectAll(".label-tech")
            .data(sortedData)
            .enter()
            .append("text")
            .attr("class", "label-tech")
            .attr("x", d => scales.x(d.width) - 15)
            .attr("y", d => scales.y(d.height) + 15)
            .attr("fill", "white")
            .style("font-size", "9px")
            .style("font-weight", "bold")
            .style("opacity", 0.8)
            .text(d => {
                try {
                    if (typeof SizeUtils !== 'undefined' && SizeUtils.getSizeCategory) {
                        return SizeUtils.getSizeCategory(d.width, d.height);
                    }
                    return 'N/A';
                } catch (error) {
                    console.warn('SizeUtils not available for size category:', error);
                    return 'N/A';
                }
            });

        // Source tier indicator dots (top-right corner of each rectangle)
        const TIER_COLORS = { primary: '#4ade80', secondary: '#38bdf8', listing: '#fbbf24' };
        const getBestTier = (sources) => {
            if (!sources || sources.length === 0) return null;
            if (sources.some(s => s.tier === 'primary')) return 'primary';
            if (sources.some(s => s.tier === 'secondary')) return 'secondary';
            return 'listing';
        };

        this.svg.selectAll(".source-tier-dot")
            .data(sortedData)
            .enter()
            .append("circle")
            .attr("class", "source-tier-dot")
            .attr("cx", d => scales.x(d.width) - 8)
            .attr("cy", d => scales.y(d.height) + 8)
            .attr("r", 4)
            .attr("fill", d => {
                const tier = getBestTier(d.sources);
                return tier ? TIER_COLORS[tier] : '#666';
            })
            .attr("stroke", "rgba(0,0,0,0.4)")
            .attr("stroke-width", 1)
            .attr("opacity", 0.9)
            .style("cursor", "pointer")
            .append("title")
            .text(d => {
                const srcs = d.sources || [];
                if (srcs.length === 0) return 'No sources';
                const tiers = { primary: 0, secondary: 0, listing: 0 };
                srcs.forEach(s => { tiers[s.tier || 'secondary']++; });
                return `Sources: ${srcs.length} (${tiers.primary} primary, ${tiers.secondary} news, ${tiers.listing} listing)`;
            });
    }

    /**
     * Setup interaction handlers
     */
    setupInteractions() {
        if (!this.screens) {
            console.log('❌ No screens available for interactions');
            return;
        }

        console.log('🎮 Setting up interactions for', this.screens.size(), 'screens');
        console.log('🎮 UIComponents available at setup:', !!window.UIComponents);

        // Debounced hover handler
        const debounceFn = typeof debounce !== 'undefined' ? debounce : ((fn) => fn);
        const handleMouseOver = debounceFn((event, d) => {
            this.handleScreenHover(event, d, true);
        }, AppConstants?.ANIMATIONS?.DEBOUNCE_DELAY || 250);

        // Screen interactions
        this.screens
            .on("click", (event, d) => {
                console.log('🖱️ Screen clicked:', d.name, d.screen_number);
                console.log('🎯 UIComponents available at click:', !!window.UIComponents);
                if (window.UIComponents) {
                    console.log(`🎯 Calling UIComponents.toggleScreenSelection on instance ${window.UIComponents.id}`);
                    console.log(`📊 Current selections in UIComponents: ${window.UIComponents.state.selectedScreens.length}`);
                    try {
                        window.UIComponents.toggleScreenSelection(d);
                        console.log('✅ toggleScreenSelection called successfully');
                    } catch (error) {
                        console.error('❌ Error calling toggleScreenSelection:', error);
                    }
                } else {
                    console.log('❌ UIComponents not available');
                }
            })
            .on("mouseover", handleMouseOver)
            .on("mouseout", () => {
                this.handleScreenHover(null, null, false);
            });
    }

    /**
     * Handle screen hover effects
     * @param {Event} event - Mouse event
     * @param {Object} screenData - Screen data
     * @param {boolean} isHover - Whether hovering or not
     */
    handleScreenHover(event, screenData, isHover) {
        if (!this.screens) return;

        if (isHover && screenData) {
            // Highlight hovered screen
            this.screens
                .attr("opacity", 0.3)
                .filter(d => d.name === screenData.name && d.screen_number === screenData.screen_number)
                .attr("opacity", 1)
                .style("filter", "brightness(1.2) drop-shadow(0 0 10px rgba(255, 214, 10, 0.6))")
                .style("transform", "scale(1.02)");

            // Update sidebar if available and no screens are selected
            if (window.UIComponents) {
                const hasSelectedScreens = window.UIComponents.state.selectedScreens.length > 0;
                if (!hasSelectedScreens) {
                    console.log('📋 Updating sidebar for:', screenData.name);
                    window.UIComponents.updateSidebar(screenData);
                } else {
                    console.log('📊 Sidebar in comparison mode, not updating for individual screen');
                }
            } else {
                console.log('❌ UIComponents not available for sidebar update');
            }
        } else {
            // Reset all screens
            this.screens
                .attr("opacity", 0.7)
                .style("filter", "none")
                .style("transform", "none");

            // Hide sidebar
            if (window.UIComponents) {
                window.UIComponents.hideSidebar();
            }
        }
    }

    /**
     * Update visualization with new data
     * @param {Array} newData - Updated screen data
     */
    updateData(newData) {
        console.log('🔄 Updating visualization data...');

        // Recalculate dimensions (in case of resize)
        this.calculateDimensions();

        // Update SVG dimensions
        const { width, height } = this.dimensions;
        const margins = this.margins;

        d3.select("#chart-container svg")
            .attr("width", width + margins.left + margins.right)
            .attr("height", height + margins.top + margins.bottom);

        // Update scales
        this.setupScales();

        // Update axes positions
        this.axes.x.attr("transform", `translate(0,${height})`);
        this.axes.x.select("text").attr("x", width / 2);

        // Re-render everything with new data
        this.svg.selectAll("*").remove();
        this.createAxes();
        this.renderScreens(newData);
        this.renderLabels(newData);
        this.setupInteractions();

        console.log('✅ Visualization updated');
    }

    /**
     * Highlight specific screens
     * @param {Array} screenIds - Array of screen identifiers to highlight
     */
    highlightScreens(screenIds) {
        if (!this.screens) return;

        this.screens
            .attr("opacity", 0.3)
            .filter(d => screenIds.some(id =>
                id.name === d.name && id.screen_number === d.screen_number
            ))
            .attr("opacity", 1)
            .style("filter", "brightness(1.2)")
            .classed("highlighted", true);
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        if (!this.screens) return;

        this.screens
            .attr("opacity", 0.7)
            .style("filter", "none")
            .classed("highlighted", false);
    }

    /**
     * Get screen data at specific coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Screen data or null
     */
    getScreenAtPosition(x, y) {
        if (!this.screens || !this.scales) return null;

        // Find screen under cursor using axis scales
        const screen = this.screens.filter(d => {
            const screenX = 0;
            const screenY = this.scales.y(d.height);
            const screenWidth = this.scales.x(d.width) - this.scales.x(0);
            const screenHeight = this.scales.y(0) - this.scales.y(d.height);

            return x >= screenX && x <= screenX + screenWidth &&
                    y >= screenY && y <= screenY + screenHeight;
        });

        return screen.empty() ? null : screen.datum();
    }

    /**
     * Get visualization statistics
     * @returns {Object} Statistics about the visualization
     */
    getStats() {
        return {
            dimensions: this.dimensions,
            screenCount: this.screens ? this.screens.size() : 0,
            scales: Object.keys(this.scales),
            axes: Object.keys(this.axes)
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.svg) {
            this.svg.selectAll("*").remove();
            this.svg.remove();
        }

        this.svg = null;
        this.screens = null;
        this.axes = {};
        this.scales = {};

        console.log('🗑️ Visualization destroyed');
    }
}

const Visualization = new VisualizationManager();

if (typeof window !== 'undefined') {
    window.Visualization = Visualization;
    window.VisualizationManager = VisualizationManager;
}

export { Visualization, VisualizationManager };