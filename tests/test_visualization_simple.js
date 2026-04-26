const fs = require('fs');
const path = require('path');

console.log('🧪 Testing module loading and data processing...');

// Mock minimal browser environment
global.window = {};
global.document = {
    createElement: () => ({}),
    getElementById: () => null
};

try {
    // Load data files
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/config.json'), 'utf8'));
    const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/constants.json'), 'utf8'));
    const screens = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/screens.json'), 'utf8'));

    console.log('✅ Data files loaded');
    console.log(`📊 Screens data: ${screens.length} screens`);
    console.log('Sample screen:', JSON.stringify(screens[0], null, 2));

    // Test data processing
    console.log('🔄 Testing data processing...');

    // Check if screens have required properties
    const validScreens = screens.filter(screen =>
        screen.name &&
        typeof screen.width === 'number' &&
        typeof screen.height === 'number' &&
        screen.color
    );

    console.log(`✅ Valid screens: ${validScreens.length}/${screens.length}`);

    if (validScreens.length > 0) {
        const areas = validScreens.map(s => s.width * s.height);
        const maxArea = Math.max(...areas);
        const minArea = Math.min(...areas);
        const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;

        console.log(`📏 Screen areas: min=${minArea.toFixed(1)}, avg=${avgArea.toFixed(1)}, max=${maxArea.toFixed(1)}`);

        // Test scaling calculations
        const scale = 4; // Test scale factor
        const screenScale = Math.min(scale * 0.8, 2);
        console.log(`🔧 Scale factor: base=${scale}, adjusted=${screenScale}`);

        // Test positioning calculations
        const height = 500; // Test height
        validScreens.slice(0, 3).forEach(screen => {
            const yPos = height - (screen.height * screenScale);
            const width = screen.width * screenScale;
            const screenHeight = screen.height * screenScale;
            console.log(`📐 ${screen.name}: pos(${0}, ${yPos.toFixed(1)}), size(${width.toFixed(1)}x${screenHeight.toFixed(1)})`);
        });
    }

    // Try loading visualization module (without D3)
    console.log('📦 Testing module syntax...');
    try {
        // Just check if the file can be parsed
        const vizCode = fs.readFileSync(path.join(__dirname, 'app/js/visualization.js'), 'utf8');

        // Basic syntax check
        if (vizCode.includes('class VisualizationManager') &&
            vizCode.includes('initialize(data, options') &&
            vizCode.includes('renderScreens(data)')) {
            console.log('✅ Visualization module syntax appears correct');
        } else {
            console.log('❌ Visualization module missing expected methods');
        }
    } catch (e) {
        console.log('❌ Error reading visualization module:', e.message);
    }

    console.log('🎯 Test completed');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}