/**
 * Tooltip Utilities for Hyderabad Cinema Technology Comparison
 * Centralized tooltip management to reduce duplication
 */

const TooltipUtils = {
    // Tooltip element references
    elements: {
        legendTooltip: null,
        formatInfoTooltip: null
    },

    // Initialize tooltips
    init() {
        this.elements.legendTooltip = d3.select("#legend-tooltip");
        this.elements.formatInfoTooltip = d3.select("#format-info-tooltip");

        if (this.elements.legendTooltip.empty()) {
            d3.select("body").append("div")
                .attr("class", "legend-tooltip")
                .attr("id", "legend-tooltip");
            this.elements.legendTooltip = d3.select("#legend-tooltip");
        }
    },

    // Setup glossary tooltips for legend terms
    async setupGlossaryTooltips(glossaryData) {
        this.init();

        // Load tooltip data from JSON
        let tooltipsData;
        try {
            const response = await fetch('../data/tooltips.json');
            if (response.ok) {
                tooltipsData = await response.json();
            }
        } catch (error) {
            console.error('Error loading tooltips data:', error);
        }

        // Create a lookup map for glossary terms
        const glossaryMap = {};
        glossaryData.forEach(item => {
            glossaryMap[item.term.toLowerCase()] = item.definition;
        });

        // List of glossary terms that might appear in legend
        const glossaryTerms = tooltipsData?.glossaryTerms || [
            "Dolby Atmos", "4K", "Laser", "LED", "70mm", "HDR", "HFR", "PLF",
            "Aspect Ratio", "Screen Gain", "Premium Large Format"
        ];

        // Function to show tooltip
        const showTooltip = (term, event) => {
            const definition = glossaryMap[term.toLowerCase()];
            if (definition) {
                this.elements.legendTooltip.html(`
                    <h4>${term}</h4>
                    <p>${definition}</p>
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px")
                .classed("show", true);
            }
        };

        // Function to hide tooltip
        const hideTooltip = () => {
            this.elements.legendTooltip.classed("show", false);
        };

        // Add hover events to glossary terms in legend text
        d3.selectAll(".legend-item:not(.plf-format)").each(function() {
            const element = d3.select(this);
            const text = element.text();

            // Check if text contains any glossary terms
            glossaryTerms.forEach(term => {
                if (text.toLowerCase().includes(term.toLowerCase())) {
                    // Wrap the term in a span for hover detection
                    const regex = new RegExp(`(${term})`, 'gi');
                    const newHtml = text.replace(regex, `<span class="glossary-highlight">$1</span>`);
                    element.html(newHtml);
                }
            });
        });

        // Add hover events to highlighted terms
        d3.selectAll(".glossary-highlight")
            .on("mouseover", function(event) {
                const term = d3.select(this).text();
                showTooltip(term, event);
            })
            .on("mouseout", hideTooltip)
            .on("mousemove", function(event) {
                TooltipUtils.elements.legendTooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            });

        // Also add hover for specific technical terms that appear in legend sections
        d3.selectAll(".legend-section").each(function() {
            const section = d3.select(this);
            const sectionText = section.text();

            // Add hover for specific technical terms
            glossaryTerms.forEach(term => {
                if (sectionText.toLowerCase().includes(term.toLowerCase())) {
                    section.on("mouseover", function(event) {
                        if (event.target.closest('.glossary-highlight')) return; // Already handled
                        showTooltip(term, event);
                    });
                }
            });
        });
    },

    // Setup info tooltips for technical terms in sidebar
    async setupInfoTooltips() {
        this.init();

        // Load tooltip explanations from JSON
        let explanations = {};
        try {
            const response = await fetch('../data/tooltips.json');
            if (response.ok) {
                const tooltipsData = await response.json();
                explanations = tooltipsData.explanations;
            }
        } catch (error) {
            console.error('Error loading tooltip explanations:', error);
            // Fallback to empty object
        }

        // Global functions for showing/hiding info tooltips
        window.showInfoTooltip = (term, event) => {
            if (!window.appData?.config) {
                console.log('Config not loaded yet');
                return;
            }

            const glossary = window.appData.config.glossary || [];
            const glossaryMap = {};
            glossary.forEach(item => {
                glossaryMap[item.term.toLowerCase()] = item.definition;
            });

            const explanation = explanations[term] || glossaryMap[term];

            if (explanation) {
                this.elements.legendTooltip.html(`
                    <h4 style="margin: 0 0 8px 0; color: #ffd60a;">ℹ️ ${term.toUpperCase().replace(/-/g, ' ')}</h4>
                    <p style="margin: 0; line-height: 1.4; color: #ccc; max-width: 300px;">${explanation}</p>
                `);

                // Position tooltip near cursor
                this.elements.legendTooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY + 15) + 'px')
                    .classed('show', true)
                    .style('opacity', 1);
            }
        };

        window.hideInfoTooltip = () => {
            this.elements.legendTooltip
                .classed('show', false)
                .style('opacity', 0);
        };
    }
};

// Export for global use
window.TooltipUtils = TooltipUtils;