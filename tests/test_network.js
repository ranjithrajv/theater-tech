const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🌐 Starting network simulation test...\n');

const baseUrl = 'http://localhost:8080';

// Simulate the loading sequence that the application does
async function simulateAppLoading() {
    const requests = [
        { url: '/app/index.html', desc: 'Main HTML page' },
        { url: '/app/style.css', desc: 'Main stylesheet' },
        { url: '/data/config.json', desc: 'Configuration data' },
        { url: '/data/constants.json', desc: 'Constants data' },
        { url: '/data/screens.json', desc: 'Screens data' },
        { url: '/lib/json-schema-validator.js', desc: 'JSON Schema Validator' },
        { url: '/lib/icon-manager.js', desc: 'Icon Manager' },
        { url: '/lib/html-templates.js', desc: 'HTML Templates' },
        { url: '/app/js/config.js', desc: 'Config Module' },
        { url: '/app/js/utils.js', desc: 'Utils Module' },
        { url: '/app/js/templates.js', desc: 'Templates Module' },
        { url: '/app/js/tooltips.js', desc: 'Tooltips Module' },
        { url: '/app/js/core.js', desc: 'Core Module' },
        { url: '/app/js/ui-components.js', desc: 'UI Components Module' },
        { url: '/app/js/visualization.js', desc: 'Visualization Module' }
    ];

    console.log('📊 Testing network requests in loading order:\n');

    for (const request of requests) {
        try {
            const start = Date.now();
            const response = await makeRequest(request.url);
            const duration = Date.now() - start;

            if (response.status === 200) {
                console.log(`✅ ${request.desc}: ${response.status} (${duration}ms) - ${response.size} bytes`);
            } else {
                console.log(`❌ ${request.desc}: ${response.status} (${duration}ms)`);
            }
        } catch (error) {
            console.log(`❌ ${request.desc}: ERROR - ${error.message}`);
        }
    }

    console.log('\n🎯 Network test completed!');
    console.log('All critical resources should be accessible.');
}

function makeRequest(urlPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: urlPath,
            method: 'GET',
            headers: {
                'User-Agent': 'Network-Test/1.0'
            }
        };

        const req = http.request(options, (res) => {
            let size = 0;
            res.on('data', (chunk) => {
                size += chunk.length;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    size: size,
                    headers: res.headers
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Check if server is running
function checkServer() {
    return makeRequest('/').then(() => true).catch(() => false);
}

// Run the test
checkServer().then(isRunning => {
    if (!isRunning) {
        console.log('❌ Server not running on localhost:8080');
        console.log('Please start the server with: python3 -m http.server 8080');
        process.exit(1);
    }

    return simulateAppLoading();
}).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});