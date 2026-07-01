import * as d3 from 'd3';

const CITY_COORDS = {
    'Hyderabad': [78.4867, 17.3850],
    'Bangalore': [77.5946, 12.9716],
    'Mumbai': [72.8777, 19.0760],
    'Delhi': [77.1025, 28.7041],
    'Chennai': [80.2707, 13.0827],
    'Kolkata': [88.3639, 22.5726],
    'Pune': [73.8567, 18.5204],
    'Ahmedabad': [72.5714, 23.0225],
    'Gurgaon': [77.0266, 28.4595],
    'Noida': [77.3074, 28.5833],
    'Jaipur': [75.7873, 26.9124],
    'Lucknow': [80.9462, 26.8467],
    'Kochi': [76.2673, 9.9312],
    'Indore': [75.8577, 22.7196],
    'Bhopal': [77.4126, 23.2599],
    'Chandigarh': [76.7794, 30.7333],
    'Surat': [72.8311, 21.1702],
    'Nagpur': [79.0882, 21.1458],
    'Coimbatore': [76.9558, 11.0168],
    'Visakhapatnam': [83.2185, 17.6868],
    'Guwahati': [91.7362, 26.1445]
};

async function loadScreens() {
    try {
        const resp = await fetch('/theater-tech/data/all_cities_screens.json');
        const screens = await resp.json();
        return screens;
    } catch {
        try {
            const resp = await fetch('/theater-tech/public/data/screens.json');
            return await resp.json();
        } catch {
            const resp = await fetch('/data/screens.json');
            return await resp.json();
        }
    }
}

function aggregateByCity(screens) {
    const cities = {};
    screens.forEach(s => {
        const city = s.city || 'Unknown';
        if (!cities[city]) cities[city] = { city, count: 0, screens: [], chains: new Set(), formats: new Set(), totalSeating: 0 };
        cities[city].count++;
        cities[city].screens.push(s);
        if (s.chain) cities[city].chains.add(s.chain);
        cities[city].formats.add(s.plf_format);
        cities[city].totalSeating += s.seating_capacity || 0;
    });
    return Object.values(cities).map(c => ({
        ...c,
        chains: c.chains.size,
        formats: [...c.formats].sort(),
        avgSeating: Math.round(c.totalSeating / c.count),
        coords: CITY_COORDS[c.city] || null
    })).filter(c => c.coords).sort((a, b) => b.count - a.count);
}

function getColor(count, maxCount) {
    const t = count / maxCount;
    if (t === 0) return '#1a2744';
    if (t < 0.1) return '#2a4a7a';
    if (t < 0.2) return '#4a7abf';
    if (t < 0.3) return '#e94560';
    if (t < 0.5) return '#f5a623';
    return '#ffd60a';
}

function getRadius(count, maxCount) {
    return 5 + (count / maxCount) * 25;
}

async function init() {
    const container = document.getElementById('map-container');
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = Math.max(window.innerHeight - 20, 600);

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#0a0a1a');

    const g = svg.append('g');

    const projection = d3.geoMercator()
        .center([78.5, 22.5])
        .scale(width * 0.22)
        .translate([width * 0.52, height * 0.52]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Load GeoJSON
    const geojsonResp = await fetch('/theater-tech/data/india-states.json');
    const india = await geojsonResp.json();

    // Render states
    g.selectAll('.state')
        .data(india.features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', pathGenerator)
        .attr('fill', '#1a2744')
        .attr('stroke', '#4a7abf')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.8);

    // Load and aggregate screens
    const screens = await loadScreens();
    const cities = aggregateByCity(screens);
    const maxCount = cities[0]?.count || 1;

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Render heatmap dots
    const dots = g.selectAll('.city-dot')
        .data(cities)
        .enter()
        .append('g')
        .attr('class', 'city-group')
        .attr('transform', d => {
            const p = projection(d.coords);
            return `translate(${p[0]}, ${p[1]})`;
        });

    // Outer glow circle
    dots.append('circle')
        .attr('class', 'city-glow')
        .attr('r', d => getRadius(d.count, maxCount) * 1.8)
        .attr('fill', d => getColor(d.count, maxCount))
        .attr('opacity', 0.15)
        .attr('filter', 'url(#glow)');

    // Main dot
    dots.append('circle')
        .attr('class', 'city-dot')
        .attr('r', d => getRadius(d.count, maxCount))
        .attr('fill', d => getColor(d.count, maxCount))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer');

    // City label
    dots.append('text')
        .attr('class', 'city-label')
        .attr('dy', d => -getRadius(d.count, maxCount) - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)')
        .style('pointer-events', 'none')
        .text(d => d.city);

    // Screen count label
    dots.append('text')
        .attr('class', 'city-count')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => d.count);

    // Tooltip
    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'map-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(20,20,40,0.95)')
        .style('border', '1px solid #ffd60a')
        .style('border-radius', '6px')
        .style('padding', '10px 14px')
        .style('color', '#fff')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 100)
        .style('max-width', '260px');

    dots.on('mouseenter', function(e, d) {
        d3.select(this).select('.city-dot')
            .transition().duration(200)
            .attr('r', _r => getRadius(d.count, maxCount) * 1.2);
        d3.select(this).select('.city-glow')
            .transition().duration(200)
            .attr('opacity', 0.3);

        tooltip
            .style('opacity', 1)
            .html(`<strong style="color:#ffd60a;font-size:14px;">${d.city}</strong>
                <br>📍 ${d.count} screens
                <br>💺 ${d.avgSeating} avg seats
                <br>🏢 ${d.chains} chains
                <br>🎬 ${d.formats.slice(0,4).join(', ')}${d.formats.length > 4 ? '...' : ''}`);
    })
    .on('mousemove', function(e) {
        const rect = container.getBoundingClientRect();
        tooltip
            .style('left', (e.clientX - rect.left + 12) + 'px')
            .style('top', (e.clientY - rect.top - 10) + 'px');
    })
    .on('mouseleave', function(e, d) {
        d3.select(this).select('.city-dot')
            .transition().duration(200)
            .attr('r', _r => getRadius(d.count, maxCount));
        d3.select(this).select('.city-glow')
            .transition().duration(200)
            .attr('opacity', 0.15);
        tooltip.style('opacity', 0);
    });

    dots.on('click', function(e, d) {
        const detail = document.getElementById('city-detail');
        if (detail) {
            detail.innerHTML = `
                <div style="border-top:1px solid #444;padding-top:10px;margin-top:10px;">
                    <h3 style="color:#ffd60a;margin:0 0 8px;">${d.city}</h3>
                    <table style="width:100%;font-size:12px;">
                        <tr><td style="padding:2px 0;color:#aaa;">Screens</td><td style="text-align:right;">${d.count}</td></tr>
                        <tr><td style="padding:2px 0;color:#aaa;">Avg Seating</td><td style="text-align:right;">${d.avgSeating}</td></tr>
                        <tr><td style="padding:2px 0;color:#aaa;">Chains</td><td style="text-align:right;">${d.chains}</td></tr>
                        <tr><td style="padding:2px 0;color:#aaa;">Formats</td><td style="text-align:right;">${d.formats.length}</td></tr>
                    </table>
                </div>`;
        }
    });

    // Legend
    const legendEl = document.getElementById('map-legend');
    if (legendEl) {
        const legendSvg = d3.select(legendEl)
            .append('svg')
            .attr('width', '100%')
            .attr('height', 50);

        const legendG = legendSvg.append('g')
            .attr('transform', 'translate(10, 10)');

        const steps = [1, Math.ceil(maxCount * 0.25), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.75), maxCount];
        const legendData = steps.map((v, i) => ({ value: v, color: getColor(v, maxCount), x: i * 50 }));

        legendG.selectAll('.legend-bar')
            .data(legendData)
            .enter()
            .append('rect')
            .attr('x', d => d.x)
            .attr('y', 0)
            .attr('width', 50)
            .attr('height', 12)
            .attr('fill', d => d.color);

        legendG.selectAll('.legend-label')
            .data(legendData)
            .enter()
            .append('text')
            .attr('x', d => d.x + 25)
            .attr('y', 28)
            .attr('text-anchor', 'middle')
            .attr('fill', '#aaa')
            .style('font-size', '9px')
            .text(d => d.value);
    }

    // Attribution
    const total = screens.length;
    const citiesCount = cities.length;
    const attr = document.getElementById('data-attribution');
    if (attr) attr.textContent = `${total} screens across ${citiesCount} cities`;

    // Page metadata
    const title = document.getElementById('page-title');
    if (title) title.textContent = 'India Cinema Heatmap';
    const desc = document.getElementById('page-description');
    if (desc) desc.textContent = `${total} screens · ${citiesCount} cities · ${cities.map(c => c.city).join(', ')}`;
    document.title = 'India Cinema Heatmap — Theater Tech Comparison';

    // Resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = Math.max(window.innerHeight - 20, 600);
        svg.attr('width', newWidth).attr('height', newHeight);
        projection.scale(newWidth * 0.22).translate([newWidth * 0.52, newHeight * 0.52]);
        g.selectAll('.state').attr('d', pathGenerator);
    });
}

document.addEventListener('DOMContentLoaded', init);
