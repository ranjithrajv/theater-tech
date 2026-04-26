const puppeteer = require('puppeteer');

async function testScalingOnly() {
    console.log('🔍 Testing visualization scaling calculations...\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Mock the necessary dependencies
    await page.evaluate(() => {
        // Mock screen data
        window.testScreens = [
            { name: "Prasads PCX", width: 101.6, height: 64, color: "#E63946" },
            { name: "AMB Cinemas", width: 76, height: 42, color: "#4ECDC4" },
            { name: "PVR Inorbit", width: 55, height: 31, color: "#45B7D1" }
        ];

        // Mock dimensions (desktop)
        window.testDimensions = {
            width: 800,
            height: 500,
            scale: 7
        };

        // Test scaling calculation
        function calculateScaling(screens, dimensions) {
            const maxWidth = Math.max(...screens.map(d => d.width));
            const maxHeight = Math.max(...screens.map(d => d.height));

            const widthScale = (dimensions.width * 0.8) / maxWidth;
            const heightScale = (dimensions.height * 0.8) / maxHeight;
            const screenScale = Math.min(widthScale, heightScale, 3);

            console.log('Scaling calculation:');
            console.log(`Chart dimensions: ${dimensions.width}px x ${dimensions.height}px`);
            console.log(`Max screen: ${maxWidth}ft x ${maxHeight}ft`);
            console.log(`Scale factors: width=${widthScale.toFixed(3)}, height=${heightScale.toFixed(3)}, final=${screenScale.toFixed(3)}`);

            screens.forEach(screen => {
                const finalWidth = screen.width * screenScale;
                const finalHeight = screen.height * screenScale;
                console.log(`${screen.name}: ${screen.width}ft x ${screen.height}ft -> ${finalWidth.toFixed(1)}px x ${finalHeight.toFixed(1)}px`);
            });

            return screenScale;
        }

        calculateScaling(window.testScreens, window.testDimensions);
    });

    await browser.close();
}

testScalingOnly().catch(console.error);