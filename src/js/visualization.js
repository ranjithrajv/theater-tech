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
    initialize(data, options = {}) {
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
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
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
     * Initialize the sound-system bar chart
     * @param {Array} data - Screen data, pre-sorted by channelCount desc
     */
    initializeSoundChart(data) {
        console.log('📊 Initializing sound system chart...');

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('❌ No valid data provided to sound chart');
            return;
        }

        try {
            this.calculateDimensions();
            this.createSeatingSVG(data); // same layout (band of theater names + linear value axis)
            this.setupSoundScales(data);
            this.createSoundAxes();
            this.renderSoundBars(data);
            this.setupInteractions();

            console.log('✅ Sound chart initialized successfully');
        } catch (error) {
            console.error('❌ Error during sound chart initialization:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    /**
     * Setup scales for the sound chart (band scale for theaters, linear for channel count)
     */
    setupSoundScales(data) {
        const { width, height } = this.dimensions;
        const maxChannels = Math.max(...data.map(d => d.channelCount));

        this.scales = {
            x: d3.scaleLinear()
                .domain([0, maxChannels * 1.1])
                .range([0, width]),
            y: d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([0, height])
                .padding(0.25)
        };
    }

    /**
     * Create and render axes for the sound chart
     */
    createSoundAxes() {
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
            .text("Sound Channels (Dolby Atmos / Surround)");

        this.axes.y = svg.append("g")
            .call(d3.axisLeft(scales.y));

        this.axes.y.selectAll("text")
            .attr("fill", "white")
            .style("font-size", "12px");
    }

    /**
     * Render sound-system channel-count bars
     * @param {Array} data - Screen data with channelCount
     */
    renderSoundBars(data) {
        const { scales } = this;

        this.screens = this.svg.selectAll(".sound-bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "screen-rect sound-bar")
            .attr("x", 0)
            .attr("y", d => scales.y(d.name))
            .attr("width", d => scales.x(d.channelCount))
            .attr("height", scales.y.bandwidth())
            .attr("fill", d => d.color)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
            .attr("data-theater", d => d.name)
            .attr("data-screen", d => d.screen_number);

        this.svg.selectAll(".sound-label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "sound-label")
            .attr("x", d => scales.x(d.channelCount) + 8)
            .attr("y", d => scales.y(d.name) + scales.y.bandwidth() / 2 + 4)
            .attr("fill", "white")
            .style("font-size", "12px")
            .text(d => `${d.sound_system.format} ${d.sound_system.channels}`);

        console.log(`📐 Rendered ${this.screens.size()} sound bars`);
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
                // Use the y-axis scale to position screens correctly in feet
                const yPos = scales.y(d.height);
                return yPos;
            })
            .attr("width", d => {
                // Use the x-axis scale to size screens correctly in feet
                const screenWidth = scales.x(d.width) - scales.x(0);
                return screenWidth;
            })
            .attr("height", d => {
                // Use the y-axis scale to size screens correctly in feet
                const screenHeight = scales.y(0) - scales.y(d.height);
                return screenHeight;
            })
            .attr("fill", d => d.color)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
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
        const { scales, dimensions } = this;
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