const puppeteer = require('puppeteer');

async function testApplicationInBrowser() {
    console.log('🚀 Starting browser-based application test...\n');

    let browser;
    try {
        // Launch browser
        console.log('🌐 Launching headless Chromium...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Monitor network requests
        console.log('📡 Setting up network monitoring...\n');
        const networkLogs = [];

        page.on('request', (request) => {
            networkLogs.push({
                type: 'REQUEST',
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: Date.now()
            });
        });

        page.on('response', (response) => {
            const request = networkLogs.find(log =>
                log.url === response.url() && log.type === 'REQUEST'
            );
            if (request) {
                request.status = response.status();
                request.duration = Date.now() - request.timestamp;
                request.contentType = response.headers()['content-type'];
            }
        });

        // Monitor console logs
        console.log('📝 Setting up console monitoring...\n');
        const consoleLogs = [];

        page.on('console', (msg) => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            };
            consoleLogs.push(logEntry);

            // Print important logs immediately
            if (msg.type() === 'error') {
                console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
            } else if (msg.text().includes('✅') || msg.text().includes('❌') || msg.text().includes('📊')) {
                console.log(`📝 ${msg.text()}`);
            }
        });

        // Navigate to the application
        console.log('🏠 Loading application at http://localhost:8080/app/index.html\n');
        await page.goto('http://localhost:8080/app/index.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for application to initialize
        console.log('⏳ Waiting for application initialization...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test hover functionality by triggering a mouseover event on the first screen
        console.log('🖱️ Testing hover functionality...\n');
        const firstScreen = await page.$('.screen-rect');
        if (firstScreen) {
            console.log('🎯 Found screen rectangle, triggering hover...');
            await firstScreen.hover();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for hover effects
        } else {
            console.log('❌ No screen rectangles found to test hover');
        }

        // Test screen selection by clicking on a screen
        console.log('🖱️ Testing screen selection...\n');

        // Add a global click listener to see all clicks
        await page.evaluate(() => {
            document.addEventListener('click', (e) => {
                console.log('🌍 Global click detected on:', e.target.tagName, e.target.className, e.target.id);
            });
        });

        // Check if screen elements exist
        const screenCount = await page.$$eval('.screen-rect', elements => elements.length);
        console.log('📐 Screen elements found:', screenCount);

        const screenToSelect = await page.$('.screen-rect');
        if (screenToSelect) {
            // Check initial button text
            const initialButtonText = await page.$eval('#comparison-toggle', el => el ? el.textContent : 'button not found');
            console.log('📋 Initial comparison button text:', initialButtonText);

            console.log('🎯 Clicking on screen to select...');
            await screenToSelect.click();
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for selection

            // Alternative: try calling the method directly
            console.log('🔧 Trying direct method call...');
            const directResult = await page.evaluate(() => {
                if (window.UIComponents && window.UIComponents.toggleScreenSelection) {
                    const currentSelections = window.UIComponents.state?.selectedScreens?.length || 0;
                    const mockScreen = {
                        name: "Prasads PCX",
                        screen_number: 6,
                        width: 101.6,
                        height: 64
                    };
                    window.UIComponents.toggleScreenSelection(mockScreen);
                    return `called toggleScreenSelection (selections before: ${currentSelections})`;
                }
                return 'UIComponents not available';
            });
            console.log('📞 Direct method call result:', directResult);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check button text after selection
            const buttonText = await page.$eval('#comparison-toggle', el => el ? el.textContent : 'button not found');
            console.log('📋 Comparison button text after selection:', buttonText);

            // Try manually triggering the update
            console.log('🔧 Manually triggering button update...');
            await page.evaluate(() => {
                if (window.UIComponents && window.UIComponents.updateComparisonToggle) {
                    console.log('Calling updateComparisonToggle manually');
                    window.UIComponents.updateComparisonToggle();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check button text after manual update
            const manualButtonText = await page.$eval('#comparison-toggle', el => el ? el.textContent : 'button not found');
            console.log('📋 Comparison button text after manual update:', manualButtonText);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if visualization elements exist
        console.log('🔍 Checking DOM elements...\n');
        const chartContainer = await page.$('#chart-container');
        const svg = await page.$('#chart-container svg');
        const rects = await page.$$('#chart-container rect');
        const sidebarClasses = await page.$eval('#sidebar', el => el ? el.className : 'not found').catch(() => 'sidebar not found');

        console.log(`📊 Chart container: ${chartContainer ? '✅' : '❌'}`);
        console.log(`🎨 SVG element: ${svg ? '✅' : '❌'}`);
        console.log(`📐 Screen rectangles: ${rects.length}`);
        console.log(`📋 Sidebar classes: ${sidebarClasses}`);

        // Get page title and basic info
        const title = await page.title();
        console.log(`📄 Page title: "${title}"`);

        // Summary of network requests
        console.log('\n🌐 Network Request Summary:\n');
        const successfulRequests = networkLogs.filter(log => log.status === 200);
        const failedRequests = networkLogs.filter(log => log.status && log.status !== 200);

        console.log(`✅ Successful requests: ${successfulRequests.length}`);
        console.log(`❌ Failed requests: ${failedRequests.length}`);

        if (failedRequests.length > 0) {
            console.log('\nFailed requests:');
            failedRequests.forEach(req => {
                console.log(`  ❌ ${req.method} ${req.url} - ${req.status}`);
            });
        }

        // Show some key network requests
        console.log('\n📋 Key Network Requests:');
        const keyUrls = ['index.html', 'screens.json', 'config.json', 'visualization.js'];
        keyUrls.forEach(urlPart => {
            const req = networkLogs.find(log => log.url.includes(urlPart));
            if (req) {
                console.log(`  ✅ ${urlPart}: ${req.status} (${req.duration || 'unknown'}ms)`);
            }
        });

        // Console log summary
        console.log('\n📝 Console Log Summary:');
        const errors = consoleLogs.filter(log => log.type === 'error');
        const successLogs = consoleLogs.filter(log => log.text.includes('✅'));
        const errorLogs = consoleLogs.filter(log => log.text.includes('❌'));

        console.log(`✅ Success logs: ${successLogs.length}`);
        console.log(`❌ Error logs: ${errorLogs.length}`);
        console.log(`🚨 Console errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log('\nConsole errors:');
            errors.forEach(error => {
                console.log(`  🚨 ${error.text}`);
            });
        }

        // Final assessment
        console.log('\n🎯 Test Results:');
        const allGood =
            chartContainer &&
            svg &&
            rects.length > 0 &&
            failedRequests.length === 0 &&
            errors.length === 0;

        if (allGood) {
            console.log('✅ SUCCESS: Application loaded and visualization is working!');
        } else {
            console.log('⚠️  PARTIAL: Application loaded but some issues detected');
            if (!chartContainer) console.log('   - Chart container missing');
            if (!svg) console.log('   - SVG element not created');
            if (rects.length === 0) console.log('   - No screen rectangles rendered');
            if (failedRequests.length > 0) console.log('   - Network request failures');
            if (errors.length > 0) console.log('   - JavaScript errors');
        }

    } catch (error) {
        console.error('❌ Browser test failed:', error.message);
        console.error(error.stack);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testApplicationInBrowser().catch(console.error);