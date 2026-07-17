/**
 * Screen Data Validator - Cinema-Specific Implementation
 *
 * Uses the generic JSONSchemaValidator from lib/json-schema-validator.js
 * for cinema screen data validation. This provides the same functionality
 * as the original implementation but with better reusability.
 */

// Load the generic validator
let JSONSchemaValidator, ScreenValidator;

if (typeof require !== 'undefined') {
    // Node.js environment
    ({ JSONSchemaValidator } = require('../lib/json-schema-validator.js'));
} else {
    // Browser environment - assume it's loaded globally
    JSONSchemaValidator = window.JSONSchemaValidator;
}

// Create cinema-specific validator
if (JSONSchemaValidator) {
    ScreenValidator = JSONSchemaValidator.createCinemaScreenValidator();

    // Add custom duplicate checking
    const originalValidate = ScreenValidator.validate.bind(ScreenValidator);
    ScreenValidator.validate = function(data, options = {}) {
        const result = originalValidate(data, options);

        // Add duplicate checking (not handled by generic validator)
        if (Array.isArray(data)) {
            const identifiers = new Set();
            data.forEach((screen, index) => {
                const identifier = `${screen.name || ''}-${screen.location || ''}`;
                if (identifiers.has(identifier)) {
                    result.errors.push({
                        error: `Duplicate screen found for '${screen.name || 'Unnamed'}' at '${screen.location}' (index ${index}).`,
                        type: 'duplicate',
                        screen: screen.name || 'Unnamed',
                        index: index
                    });
                }
                identifiers.add(identifier);
            });
        }

        return result;
    };
} else {
    console.error('JSONSchemaValidator not found. Make sure to load lib/json-schema-validator.js first.');
    ScreenValidator = {
        validate: () => ({ success: false, errors: [{ error: 'Validator not available' }] }),
        validateFile: () => Promise.resolve({ success: false, errors: [{ error: 'Validator not available' }] }),
        validateJsonText: () => ({ success: false, errors: [{ error: 'Validator not available' }] }),
        generateSummary: () => ({ status: 'error', message: 'Validator not available' })
    };
}

// Additional utility methods (keeping backward compatibility)
ScreenValidator.validateScreenData = function(data) {
    const result = this.validate(data);
    return result.errors;
};

ScreenValidator.validateJsonText = function(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        const result = this.validate(data);
        return {
            success: result.success,
            errors: result.errors,
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            errors: [{ error: `JSON Parse Error: ${error.message}`, type: 'parse_error' }],
            data: null
        };
    }
};

ScreenValidator.generateSummary = function(validationResult) {
    if (validationResult.success) {
        return {
            status: 'success',
            message: `✅ Validation successful: ${validationResult.filePath || 'JSON data'} is valid.`,
            totalScreens: validationResult.data ? validationResult.data.length : 0,
            errors: 0
        };
    } else {
        const errorCounts = {};
        validationResult.errors.forEach(error => {
            errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
        });

        return {
            status: 'error',
            message: `❌ Validation failed: ${validationResult.errors.length} error(s) found.`,
            totalScreens: validationResult.data ? validationResult.data.length : 0,
            errors: validationResult.errors.length,
            errorBreakdown: errorCounts
        };
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenValidator;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.ScreenValidator = ScreenValidator;
}

// Make available globally for Node.js
if (typeof global !== 'undefined') {
    global.ScreenValidator = ScreenValidator;
}