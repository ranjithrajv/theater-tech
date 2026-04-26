const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {
    AppConfig: null,
    AppConstants: null,
    Visualization: null,
    UIManager: null,
    UIComponents: null,
    SizeUtils: null
};
global.document = {
    createElement: () => ({
        setAttribute: () => {},
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: () => ({
            appendChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => []
        })
    }),
    getElementById: () => ({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
    })
};
global.d3 = require('d3');

// Mock SizeUtils
global.SizeUtils = {
    getSizeCategory: (width, height) => {
        const area = width * height;
        if (area > 2000) return 'Large';
        if (area > 1000) return 'Medium';
        return 'Small';
    }
};

console.log('🧪 Running visualization test...');

// Load data files
try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/config.json'), 'utf8'));
    const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/constants.json'), 'utf8'));
    const screens = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/screens.json'), 'utf8'));

    console.log('✅ Data files loaded');
    console.log(`📊 Screens data: ${screens.length} screens`);

    // Mock UIManager
    global.UIManager = {
        getResponsiveDimensions() {
            return {
                isMobile: false,
                margin: { top: 20, right: 20, bottom: 60, left: 60 },
                width: 800,
                height: 500,
                scale: 4
            };
        }
    };

    // Load visualization module
    require('./app/js/visualization.js');

    if (global.window.Visualization) {
        console.log('✅ Visualization module loaded');

        // Test initialization
        console.log('🎯 Testing visualization initialization...');
        global.window.Visualization.initialize(screens);

        console.log('✅ Test completed successfully');
    } else {
        console.error('❌ Visualization object not found');
    }

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}