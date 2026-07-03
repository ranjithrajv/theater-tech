import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './layout.js';

const CITY_COORDS = {
    'Hyderabad': [17.3850, 78.4867],
    'Bangalore': [12.9716, 77.5946],
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.7041, 77.1025],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Pune': [18.5204, 73.8567],
    'Ahmedabad': [23.0225, 72.5714],
    'Gurgaon': [28.4595, 77.0266],
    'Noida': [28.5833, 77.3074],
    'Jaipur': [26.9124, 75.7873],
    'Lucknow': [26.8467, 80.9462],
    'Kochi': [9.9312, 76.2673],
    'Indore': [22.7196, 75.8577],
    'Bhopal': [23.2599, 77.4126],
    'Chandigarh': [30.7333, 76.7794],
    'Surat': [21.1702, 72.8311],
    'Nagpur': [21.1458, 79.0882],
    'Coimbatore': [11.0168, 76.9558],
    'Visakhapatnam': [17.6868, 83.2185],
    'Guwahati': [26.1445, 91.7362],
    'Sullurpetta': [13.6999, 80.0167],
    'Thiruvananthapuram': [8.5000, 76.9333],
    'Attingal': [8.6920, 76.8750],
    'Agra': [27.1767, 78.0081]
};

const CITY_COORDS_ALT = {
    'Delhi': [28.63, 77.22],
    'Gurgaon': [28.47, 77.04],
    'Noida': [28.57, 77.33],
};

function setStatus(msg, isError) {
    const el = document.getElementById('map-status');
    const text = document.getElementById('status-text');
    if (!el) return;
    if (isError) { el.classList.add('error'); } else { el.classList.remove('error'); }
    el.classList.remove('hidden');
    if (text) text.textContent = msg;
}

function hideStatus() {
    const el = document.getElementById('map-status');
    if (el) el.classList.add('hidden');
}

async function fetchWithRetry(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (err) {
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}

async function loadScreens() {
    try {
        return await fetchWithRetry('/theater-tech/data/all_cities_screens.json');
    } catch {
        try {
            return await fetchWithRetry('/theater-tech/public/data/screens.json');
        } catch {
            return await fetchWithRetry('/data/screens.json');
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
    let result = Object.values(cities).map(c => ({
        ...c,
        chains: c.chains.size,
        formats: [...c.formats].sort(),
        avgSeating: Math.round(c.totalSeating / c.count),
        coords: CITY_COORDS[c.city] || null
    })).filter(c => c.coords).sort((a, b) => b.count - a.count);

    const threshold = 45;
    for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
            const a = result[i].coords, b = result[j].coords;
            if (!a || !b) continue;
            const lat1 = a[0] * Math.PI / 180, lat2 = b[0] * Math.PI / 180;
            const dLat = (b[0] - a[0]) * Math.PI / 180;
            const dLng = (b[1] - a[1]) * Math.PI / 180;
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
            const distKm = 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
            if (distKm < threshold && CITY_COORDS_ALT[result[i].city]) {
                result[i].coords = CITY_COORDS_ALT[result[i].city];
            }
        }
    }
    return result;
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
    return 5 + (count / maxCount) * 20;
}

function showCityDetail(d) {
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
}

function buildLegend(maxCount) {
    const legendEl = document.getElementById('map-legend');
    if (!legendEl) return;
    const steps = [1, Math.ceil(maxCount * 0.25), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.75), maxCount];
    const bars = steps.map(v => `<div style="display:flex;flex-direction:column;align-items:center;flex:1;">
        <div style="width:100%;height:18px;border-radius:2px;background:${getColor(v, maxCount)};"></div>
        <span style="font-size:11px;color:#ccc;margin-top:4px;">${v}</span>
    </div>`).join('');
    legendEl.innerHTML = `
        <div style="font-size:11px;color:#ffd60a;margin-bottom:6px;font-weight:600;">Screen Density</div>
        <div style="display:flex;gap:2px;">${bars}</div>
        <div style="font-size:10px;color:#888;margin-top:6px;">Low → High</div>`;
}

async function init() {
    const container = document.getElementById('map-container');
    if (!container) return;

    try {
        setStatus('Loading India map boundaries...');
        const india = await fetchWithRetry('/theater-tech/data/india-states.json');

        setStatus('Loading theater data...');
        const screens = await loadScreens();
        const cities = aggregateByCity(screens);
        const maxCount = cities[0]?.count || 1;

        const map = L.map(container, {
            center: [22.5, 80.0],
            zoom: 5,
            minZoom: 4,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false,
            worldCopyJump: false,
        });
        map._isInit = true;

        container.style.background = '#0a0a1a';

        L.geoJSON(india, {
            style: {
                color: '#4a7abf',
                weight: 1,
                opacity: 0.8,
                fillColor: '#1a2744',
                fillOpacity: 1,
            },
        }).addTo(map);

        const cityLayer = L.layerGroup().addTo(map);

        cities.forEach(d => {
            const color = getColor(d.count, maxCount);
            const radius = getRadius(d.count, maxCount);

            const glow = L.circleMarker(d.coords, {
                radius: radius * 1.8,
                fillColor: color,
                color: color,
                weight: 0,
                fillOpacity: 0.15,
                interactive: false,
            });

            const dot = L.circleMarker(d.coords, {
                radius: radius,
                fillColor: color,
                color: '#fff',
                weight: 1.5,
                fillOpacity: 0.9,
            });

            dot.bindTooltip(
                `<strong style="color:#ffd60a;font-size:14px;">${d.city}</strong>
                <br>📍 ${d.count} screens
                <br>💺 ${d.avgSeating} avg seats
                <br>🏢 ${d.chains} chains
                <br>🎬 ${d.formats.slice(0, 4).join(', ')}${d.formats.length > 4 ? '...' : ''}`,
                {
                    className: 'india-map-tooltip',
                    direction: 'top',
                    opacity: 1,
                    offset: [0, -radius],
                }
            );

            dot.on('mouseover', () => {
                dot.setStyle({ radius: radius * 1.2, fillOpacity: 1 });
                glow.setStyle({ fillOpacity: 0.3 });
            });
            dot.on('mouseout', () => {
                dot.setStyle({ radius: radius, fillOpacity: 0.9 });
                glow.setStyle({ fillOpacity: 0.15 });
            });
            dot.on('click', () => showCityDetail(d));

            cityLayer.addLayer(glow);
            cityLayer.addLayer(dot);

            const label = L.marker(d.coords, {
                interactive: false,
                keyboard: false,
                icon: L.divIcon({
                    className: 'india-city-label',
                    html: `<div style="transform:translate(-50%, -100%);">
                        <div style="color:#fff;font-size:11px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap;pointer-events:none;text-align:center;">${d.city}</div>
                        <div style="color:#fff;font-size:10px;font-weight:bold;text-align:center;">${d.count}</div>
                    </div>`,
                    iconSize: [0, 0],
                }),
            });
            cityLayer.addLayer(label);
        });

        buildLegend(maxCount);

        const detailEl = document.getElementById('city-detail');
        if (detailEl && detailEl.innerHTML.trim() === '') {
            const top5 = cities.slice(0, 5);
            detailEl.innerHTML = `
                <div style="border-top:1px solid #444;padding-top:10px;margin-top:10px;">
                    <h3 style="color:#ffd60a;margin:0 0 8px;font-size:13px;">Top Cities</h3>
                    <table style="width:100%;font-size:12px;">
                        ${top5.map((c, i) => `
                        <tr>
                            <td style="padding:3px 0;color:#ccc;">${i + 1}. ${c.city}</td>
                            <td style="text-align:right;color:#ffd60a;">${c.count}</td>
                        </tr>`).join('')}
                    </table>
                    <p style="font-size:11px;color:#666;margin:8px 0 0;">Click any city dot on the map for full details</p>
                </div>`;
        }

        const total = screens.length;
        const citiesCount = cities.length;
        const attr = document.getElementById('data-attribution');
        if (attr) attr.innerHTML = `<strong>${total}</strong> screens · <strong>${citiesCount}</strong> cities · Zoom: scroll · Pan: drag`;

        const title = document.getElementById('page-title');
        if (title) title.textContent = 'India Cinema Heatmap';
        const desc = document.getElementById('page-description');
        if (desc) desc.textContent = `${total} screens · ${citiesCount} cities`;
        document.title = 'India Cinema Heatmap — Theater Tech Comparison';

        hideStatus();

        setTimeout(() => map.invalidateSize(), 100);
        window.addEventListener('resize', () => map.invalidateSize());

        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.main-container .sidebar');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                toggle.textContent = sidebar.classList.contains('open') ? '✕' : '☰';
                setTimeout(() => map.invalidateSize(), 320);
            });
            document.addEventListener('click', e => {
                if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
                    !sidebar.contains(e.target) && e.target !== toggle) {
                    sidebar.classList.remove('open');
                    toggle.textContent = '☰';
                    setTimeout(() => map.invalidateSize(), 320);
                }
            });
        }

    } catch (err) {
        console.error('India map initialization failed:', err);
        setStatus('Failed to load map. Please refresh or try again later.', true);
    }
}

document.addEventListener('DOMContentLoaded', init);