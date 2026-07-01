import { SizeUtils } from './utils.js';

const LegacyTemplateUtils = {
    createComparisonCard(screen, index) {
        const area = Math.round(screen.width * screen.height);
        const sizeCategory = SizeUtils ? SizeUtils.getSizeCategory(screen.width, screen.height) : 'Unknown';
        const projection = screen.projection || {};
        const sound = screen.sound_system || {};

        return `
            <div class="comparison-card selected">
                <h3 class="card-title">${screen.name} (Screen ${screen.screen_number})</h3>
                <div class="comparison-metrics">
                    <div class="metric-label">Format:</div>
                    <div class="metric-value">${screen.plf_format}</div>
                    <div class="metric-label">Size:</div>
                    <div class="metric-value">${screen.width}' \u00D7 ${screen.height}'</div>
                    <div class="metric-label">Area:</div>
                    <div class="metric-value">${area} ft\u00B2 (${sizeCategory})</div>
                    <div class="metric-label">Seating:</div>
                    <div class="metric-value">${screen.seating_capacity}</div>
                    <div class="metric-label">Projection:</div>
                    <div class="metric-value">${projection.type || 'N/A'} ${projection.resolution || ''}</div>
                    <div class="metric-label">Sound:</div>
                    <div class="metric-value">${sound.format || 'N/A'} ${sound.channels || ''}</div>
                    <div class="metric-label">Location:</div>
                    <div class="metric-value">${screen.location}</div>
                    <div class="metric-label">Brightness:</div>
                    <div class="metric-value">${projection.brightness || 'N/A'}</div>
                </div>
            </div>
        `;
    },

    createComparisonTable(selectedScreens) {
        try {
            const metrics = [
                { label: 'PLF Format', key: 'plf_format' },
                { label: 'Width (ft)', key: 'width' },
                { label: 'Height (ft)', key: 'height' },
                { label: 'Area (ft\u00B2)', key: 'area', calculate: d => Math.round(d.width * d.height) },
                { label: 'Seating Capacity', key: 'seating_capacity' },
                { label: 'Location', key: 'location' },
                { label: 'Projection Type', key: 'projection.type' },
                { label: 'Resolution', key: 'projection.resolution' },
                { label: 'Brightness', key: 'projection.brightness' },
                { label: 'Sound Format', key: 'sound_system.format' },
                { label: 'Sound Channels', key: 'sound_system.channels' },
                { label: 'Aspect Ratio', key: 'projection.aspect_ratio' },
                { label: 'Screen Surface', key: 'screen_surface.material' },
                { label: '3D Support', key: 'content_support["3d_capability"]', format: v => v ? 'Yes' : 'No' },
                { label: '4D Effects', key: 'content_support["4d_effects"]', format: v => v ? 'Yes' : 'No' },
                { label: 'HDR Support', key: 'content_support.hdr_support', format: v => v ? 'Yes' : 'No' }
            ];

            let html = '<table class="comparison-table">';
            html += '<thead><tr><th>Specification</th>';

            selectedScreens.forEach(screen => {
                html += `<th>${screen.name}<br><small>Screen ${screen.screen_number}</small></th>`;
            });

            html += '</tr></thead><tbody>';

            metrics.forEach(metric => {
                html += '<tr class="metric-row"><td><strong>' + metric.label + '</strong></td>';

                selectedScreens.forEach(screen => {
                    let value = '';
                    try {
                        if (metric.calculate) {
                            value = metric.calculate(screen);
                        } else if (metric.key.includes('.')) {
                            const keys = metric.key.split('.').map(key => {
                                if (key.includes('[') && key.includes(']')) {
                                    const bracketMatch = key.match(/(.+)\[(.+)\]/);
                                    if (bracketMatch) {
                                        return [bracketMatch[1], bracketMatch[2].replace(/"/g, '')];
                                    }
                                }
                                return key;
                            });

                            let obj = screen;
                            for (const key of keys) {
                                if (Array.isArray(key)) {
                                    obj = obj && obj[key[0]] && obj[key[0]][key[1]];
                                } else {
                                    obj = obj && obj[key];
                                }
                            }
                            value = obj || 'N/A';
                        } else {
                            value = screen[metric.key] || 'N/A';
                        }

                        if (metric.format) {
                            value = metric.format(value);
                        }
                    } catch (error) {
                        console.warn(`Error getting value for metric ${metric.label}:`, error);
                        value = 'N/A';
                    }

                    html += '<td>' + value + '</td>';
                });

                html += '</tr>';
            });

            html += '</tbody></table>';
            return html;
        } catch (error) {
            console.error('Error creating comparison table:', error);
            return '<p>Error generating comparison table</p>';
        }
    },

    createSizeComparison(selectedScreens) {
        try {
            const maxArea = selectedScreens.length > 0 ? Math.max(...selectedScreens.map(s => s.width * s.height)) : 0;

            let html = '<div class="visual-comparison">';
            html += '<h3>Size Comparison</h3>';
            html += '<div class="screen-size-comparison">';

            selectedScreens.forEach(screen => {
                try {
                    const area = screen.width * screen.height;
                    const heightPercent = (area / maxArea) * 100;
                    const sizeCategory = SizeUtils ? SizeUtils.getSizeCategory(screen.width, screen.height) : 'Unknown';

                    html += `
                        <div class="size-bar" style="height: ${Math.max(heightPercent, 10)}px; background: ${screen.color};">
                            <div class="size-value">${Math.round(area)}ft\u00B2</div>
                            <div class="size-label">${screen.name}<br>${sizeCategory}</div>
                        </div>
                    `;
                } catch (screenError) {
                    console.warn(`Error creating size bar for ${screen.name}:`, screenError);
                    html += `<div class="size-bar error">Error for ${screen.name}</div>`;
                }
            });

            html += '</div></div>';
            return html;
        } catch (error) {
            console.error('Error creating size comparison:', error);
            return '<div class="visual-comparison"><p>Error generating size comparison</p></div>';
        }
    },

    createScreenDetails(screenData) {
        const area = Math.round(screenData.width * screenData.height);
        const sizeCategory = SizeUtils ? SizeUtils.getSizeCategory(screenData.width, screenData.height) : 'Unknown';
        const projection = screenData.projection || {};
        const sound = screenData.sound_system || {};
        const screenSurface = screenData.screen_surface || {};
        const contentSupport = screenData.content_support || {};

        const isStale = (lv) => {
            if (!lv) return true;
            const parts = lv.split('-');
            if (parts.length < 2) return true;
            const ver = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return ver < sixMonthsAgo;
        };

        const stale = isStale(screenData.last_verified);
        const staleBadge = stale
            ? '<span class="stale-badge" style="display:inline-block;font-size:10px;color:#ff6b6b;border:1px dashed #ff6b6b;padding:1px 6px;border-radius:3px;margin-left:6px;">⚠ Stale</span>'
            : '<span class="stale-badge" style="display:inline-block;font-size:10px;color:#4ade80;padding:1px 6px;border-radius:3px;margin-left:6px;">✓ Verified</span>';

        const contentTags = [];
        if (contentSupport['3d_capability']) contentTags.push('3D');
        if (contentSupport['hdr_support']) contentTags.push('HDR');
        if (contentSupport['hfr_support']) contentTags.push('HFR');
        if (contentSupport['4d_effects']) contentTags.push('4D');
        if (contentTags.length === 0) contentTags.push('Standard');

        return `
            <div class="screen-details">
                <div class="screen-header">
                    <span class="screen-format-badge" style="background: ${screenData.color}">${screenData.plf_format}</span>
                    <div>
                        <div class="screen-name">${screenData.name} ${staleBadge}</div>
                        <div class="screen-location">Screen ${screenData.screen_number} \u2022 ${screenData.location}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">\uD83D\uDCD0 Screen Size</div>
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
                            <div class="detail-value" data-numeric="true">${area} ft\u00B2</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Category</div>
                            <div class="detail-value">${sizeCategory}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">\uD83C\uDFAC Projection <span class="info-icon" onmouseover="showInfoTooltip('projection', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></div>
                    <div class="detail-row">
                        <span class="detail-row-label">Type</span>
                        <span class="detail-row-value">${projection.type || 'N/A'} <span class="info-icon-small" onmouseover="showInfoTooltip('${projection.type?.toLowerCase() || 'projection-type'}', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Resolution</span>
                        <span class="detail-row-value">${projection.resolution || 'N/A'} <span class="info-icon-small" onmouseover="showInfoTooltip('${projection.resolution?.toLowerCase() || 'resolution'}', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Brightness</span>
                        <span class="detail-row-value" data-numeric="true">${projection.brightness || 'N/A'} <span class="info-icon-small" onmouseover="showInfoTooltip('brightness', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>
                    ${projection.aspect_ratio ? `
                    <div class="detail-row">
                        <span class="detail-row-label">Aspect Ratio</span>
                        <span class="detail-row-value">${projection.aspect_ratio} <span class="info-icon-small" onmouseover="showInfoTooltip('aspect-ratio', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>` : ''}
                    ${projection.brand ? `
                    <div class="detail-row">
                        <span class="detail-row-label">Brand</span>
                        <span class="detail-row-value">${projection.brand} <span class="info-icon-small" onmouseover="showInfoTooltip('projection-brand', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>` : ''}
                </div>

                <div class="detail-section">
                    <div class="detail-title">\uD83D\uDD0A Sound <span class="info-icon" onmouseover="showInfoTooltip('sound', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></div>
                    <div class="detail-row">
                        <span class="detail-row-label">Format</span>
                        <span class="detail-row-value">${sound.format || 'N/A'} <span class="info-icon-small" onmouseover="showInfoTooltip('${sound.format?.toLowerCase().replace(/\s+/g, '-') || 'sound-format'}', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-row-label">Channels</span>
                        <span class="detail-row-value" data-numeric="true">${sound.channels || 'N/A'} <span class="info-icon-small" onmouseover="showInfoTooltip('sound-channels', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-title">\uD83D\uDCBA Seating <span class="info-icon" onmouseover="showInfoTooltip('seating', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></div>
                    <div class="detail-row">
                        <span class="detail-row-label">Capacity</span>
                        <span class="detail-row-value" data-numeric="true">${screenData.seating_capacity} seats</span>
                    </div>
                </div>

                ${screenSurface.material ? `
                <div class="detail-section">
                    <div class="detail-title">\uD83D\uDDA5\uFE0F Screen Surface <span class="info-icon" onmouseover="showInfoTooltip('screen-surface', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></div>
                    <div class="detail-row">
                        <span class="detail-row-label">Material</span>
                        <span class="detail-row-value">${screenSurface.material} <span class="info-icon-small" onmouseover="showInfoTooltip('screen-material', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>
                    ${screenSurface.gain ? `
                    <div class="detail-row">
                        <span class="detail-row-label">Gain</span>
                        <span class="detail-row-value" data-numeric="true">${screenSurface.gain} <span class="info-icon-small" onmouseover="showInfoTooltip('screen-gain', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>
                    </div>` : ''}
                </div>` : ''}

                <div class="detail-section">
                    <div class="detail-title">\uD83C\uDF9E\uFE0F Content Support <span class="info-icon" onmouseover="showInfoTooltip('content-support', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></div>
                    <div class="content-tags">
                        ${contentTags.map(tag => `<span class="content-tag">${tag} <span class="info-icon-tag" onmouseover="showInfoTooltip('${tag.toLowerCase()}', event)" onmouseout="hideInfoTooltip()">\u2139\uFE0F</span></span>`).join('')}
                    </div>
                </div>

                ${screenData.note ? `
                <div class="screen-note">
                    \uD83D\uDCDD ${screenData.note}
                </div>` : ''}
            </div>
        `;
    }
};

window.TemplateUtils = LegacyTemplateUtils;
export { LegacyTemplateUtils as TemplateUtils };
