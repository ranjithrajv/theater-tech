const fs = require('fs');
const path = require('path');

// Mock browser environment for testing
global.window = {
    addEventListener: () => {},
    location: { reload: () => {} },
    navigator: { userAgent: 'test' },
    AppConfig: null,
    AppConstants: null,
    App: null,
    Config: null,
    Visualization: null,
    SizeUtils: null,
    debounce: null,
    UIManager: null,
    UIComponents: null
};

global.document = {
    readyState: 'complete',
    addEventListener: () => {},
    createElement: () => ({
        setAttribute: () => {},
        appendChild: () => {},
        className: '',
        innerHTML: '',
        style: {}
    }),
    getElementById: () => ({
        appendChild: () => {},
        setAttribute: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        style: {}
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    body: { appendChild: () => {} }
};

global.fetch = async (url) => {
    const filePath = path.join(__dirname, url);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
        ok: true,
        json: async () => JSON.parse(content)
    };
};

console.log('🧪 Testing application loading sequence...\n');

// Load data files
try {
    console.log('📋 Loading configuration data...');
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/config.json'), 'utf8'));
    global.window.AppConfig = config;
    console.log('✅ Config data loaded');

    const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/constants.json'), 'utf8'));
    global.window.AppConstants = constants;
    console.log('✅ Constants data loaded');

    const screens = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/screens.json'), 'utf8'));
    console.log(`✅ Screens data loaded: ${screens.length} screens`);

    // Test loading modules in order
    console.log('\n📦 Loading modules...');

    const modules = [
        'app/js/utils.js',
        'app/js/config.js',
        'app/js/core.js',
        'app/js/visualization.js'
    ];

    for (const modulePath of modules) {
        try {
            console.log(`Loading ${modulePath}...`);
            require(path.join(__dirname, modulePath.replace('app/js/', '').replace('.js', '')));
            console.log(`✅ ${modulePath} loaded`);
        } catch (e) {
            console.log(`❌ Failed to load ${modulePath}: ${e.message}`);
        }
    }

    // Check if global objects are available
    console.log('\n🔍 Checking global objects...');
    const checks = [
        { name: 'Config', obj: global.window.Config },
        { name: 'App', obj: global.window.App },
        { name: 'Visualization', obj: global.window.Visualization },
        { name: 'SizeUtils', obj: global.window.SizeUtils },
        { name: 'debounce', obj: global.window.debounce },
        { name: 'UIManager', obj: global.window.UIManager }
    ];

    checks.forEach(check => {
        if (check.obj) {
            console.log(`✅ ${check.name} available`);
        } else {
            console.log(`❌ ${check.name} missing`);
        }
    });

    // Test basic initialization
    console.log('\n🎯 Testing basic initialization...');

    if (global.window.App && typeof global.window.App.initialize === 'function') {
        console.log('✅ App.initialize method available');

        // Mock the data loading for testing
        global.window.appData = { screens, config };

        console.log('✅ Mock data set');
        console.log('🎉 Basic loading test completed successfully!');

    } else {
        console.log('❌ App.initialize not available');
    }

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}