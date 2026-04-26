/**
 * Data Validation Test
 * 
 * Test script to verify that all JSON data files
 * pass validation against their respective schemas.
 */

async function runValidationTests() {
    console.log('🧪 Starting Data Validation Tests...\n');

    const requiredGlobals = [
        'JSONSchemaValidator', 'ScreensSchema', 'ConfigSchema',
        'ConstantsSchema', 'TooltipsSchema', 'IconsSchema',
        'SchemaRegistry', 'Validator'
    ];

    const missing = requiredGlobals.filter(g => typeof window[g] === 'undefined');

    if (missing.length > 0) {
        console.error('❌ Required globals not available:', missing);
        console.log('Please ensure all scripts are loaded before running tests.');
        return false;
    }

    console.log('✅ All required globals available\n');

    try {
        Validator.initialize();

        const validationResults = await Validator.validateAllFiles();

        console.log('\n' + '='.repeat(60));
        console.log('VALIDATION SUMMARY');
        console.log('='.repeat(60));

        const dataTypes = ['screens', 'config', 'constants', 'tooltips', 'icons'];
        let totalErrors = 0;
        let totalPassed = 0;

        for (const dataType of dataTypes) {
            const result = validationResults.results[dataType];
            if (result) {
                if (result.success) {
                    console.log(`✅ ${dataType.toUpperCase().padEnd(12)} - PASSED (${result.data ? Array.isArray(result.data) ? result.data.length + ' items' : '1 object' : 'N/A'})`);
                    totalPassed++;
                } else {
                    console.log(`❌ ${dataType.toUpperCase().padEnd(12)} - FAILED (${result.errors.length} error(s))`);
                    result.errors.forEach(err => {
                        console.log(`   - ${err.error}${err.path ? ` (path: ${err.path})` : ''}`);
                    });
                    totalErrors += result.errors.length;
                }
            }
        }

        console.log('='.repeat(60));
        console.log(`Total: ${totalPassed}/${dataTypes.length} files passed`);
        console.log(`Errors: ${totalErrors} total`);
        console.log('='.repeat(60));

        if (validationResults.allPassed) {
            console.log('\n✅ All validation tests passed!\n');
            return true;
        } else {
            console.log('\n❌ Some validation tests failed.\n');
            return false;
        }

    } catch (error) {
        console.error('💥 Validation test failed with error:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = runValidationTests;
}

if (typeof window !== 'undefined') {
    window.runValidationTests = runValidationTests;
}
