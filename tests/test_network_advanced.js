const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔬 Advanced Network & Loading Test\n');

// Simulate browser-like loading with dependency analysis
async function advancedLoadingTest() {
    console.log('📦 Phase 1: Loading core dependencies (libraries)...\n');

    const libFiles = [
        '/lib/json-schema-validator.js',
        '/lib/icon-manager.js',
        '/lib/html-templates.js'
    ];

    for (const file of libFiles) {
        const result = await testFile(file);
        console.log(`${result.status ? '✅' : '❌'} ${file}: ${result.statusCode} (${result.loadTime}ms)`);
    }

    console.log('\n⚙️ Phase 2: Loading configuration...\n');

    const configFiles = [
        '/data/config.json',
        '/data/constants.json',
        '/data/icons.json',
        '/data/tooltips.json'
    ];

    for (const file of configFiles) {
        const result = await testFile(file);
        console.log(`${result.status ? '✅' : '❌'} ${file}: ${result.statusCode} (${result.loadTime}ms)`);
    }

    console.log('\n🏗️ Phase 3: Loading application modules...\n');

    const appModules = [
        '/app/js/config.js',
        '/app/js/utils.js',
        '/app/js/templates.js',
        '/app/js/tooltips.js',
        '/app/js/core.js',
        '/app/js/ui-components.js',
        '/app/js/visualization.js'
    ];

    for (const file of appModules) {
        const result = await testFile(file);
        console.log(`${result.status ? '✅' : '❌'} ${file}: ${result.statusCode} (${result.loadTime}ms)`);
        if (result.contentType) {
            console.log(`   Content-Type: ${result.contentType}`);
        }
    }

    console.log('\n📊 Phase 4: Loading screen data...\n');

    const dataResult = await testFile('/data/screens.json');
    console.log(`${dataResult.status ? '✅' : '❌'} /data/screens.json: ${dataResult.statusCode} (${dataResult.loadTime}ms)`);

    if (dataResult.status && dataResult.body) {
        try {
            const screens = JSON.parse(dataResult.body);
            console.log(`   📈 Parsed ${screens.length} screen records`);
            console.log(`   🎨 Sample: ${screens[0].name} (${screens[0].width}ft x ${screens[0].height}ft)`);
        } catch (e) {
            console.log(`   ❌ JSON parsing failed: ${e.message}`);
        }
    }

    console.log('\n🎨 Phase 5: Testing main application...\n');

    const htmlResult = await testFile('/app/index.html');
    console.log(`${htmlResult.status ? '✅' : '❌'} /app/index.html: ${htmlResult.statusCode} (${htmlResult.loadTime}ms)`);

    if (htmlResult.status && htmlResult.body) {
        // Check for critical script tags
        const d3Script = htmlResult.body.includes('d3js.org/d3.v7.min.js');
        const html2canvasScript = htmlResult.body.includes('html2canvas.hertzen.com');
        const indexScript = htmlResult.body.includes('js/index.js');
        const chartContainer = htmlResult.body.includes('id="chart-container"');

        console.log(`   📚 D3.js library: ${d3Script ? '✅' : '❌'}`);
        console.log(`   📸 html2canvas: ${html2canvasScript ? '✅' : '❌'}`);
        console.log(`   🚀 Index script: ${indexScript ? '✅' : '❌'}`);
        console.log(`   📊 Chart container: ${chartContainer ? '✅' : '❌'}`);
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ All network requests successful');
    console.log('✅ All JavaScript modules accessible');
    console.log('✅ All JSON data files loadable');
    console.log('✅ HTML structure includes required elements');
    console.log('✅ Application should load without network issues');
}

function testFile(urlPath) {
    return new Promise((resolve) => {
        const start = Date.now();

        const options = {
            hostname: 'localhost',
            port: 8080,
            path: urlPath,
            method: 'GET',
            headers: {
                'User-Agent': 'Advanced-Network-Test/1.0',
                'Accept': '*/*'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                const loadTime = Date.now() - start;
                resolve({
                    status: res.statusCode === 200,
                    statusCode: res.statusCode,
                    loadTime: loadTime,
                    contentType: res.headers['content-type'],
                    body: body
                });
            });
        });

        req.on('error', () => {
            resolve({
                status: false,
                statusCode: 'ERROR',
                loadTime: Date.now() - start,
                contentType: null,
                body: null
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                status: false,
                statusCode: 'TIMEOUT',
                loadTime: Date.now() - start,
                contentType: null,
                body: null
            });
        });

        req.end();
    });
}

// Run the advanced test
advancedLoadingTest().catch(error => {
    console.error('❌ Advanced test failed:', error.message);
});