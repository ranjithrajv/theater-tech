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
    },

    // Type checking utilities
    isValidType(value, expectedType) {
        if (expectedType === 'string') return typeof value === 'string';
        if (expectedType === 'number') return typeof value === 'number' && !isNaN(value);
        if (expectedType === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
        if (expectedType === 'array') return Array.isArray(value);
        return false;
    },

    // Validate hex color format
    isValidHexColor(color) {
        return typeof color === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    },

    // Main validation function
    validateScreenData(data) {
        if (!Array.isArray(data)) {
            return [{ error: 'Data must be an array of screen objects', type: 'structure' }];
        }

        const errors = [];
        const screenIdentifiers = new Set();

        data.forEach((screen, index) => {
            const screenName = screen.name || `Unnamed Screen ${index}`;

            // Validate main screen object fields
            const screenSchema = this.schemas.screen;
            for (const [field, expectedType] of Object.entries(screenSchema)) {
                if (!(field in screen)) {
                    errors.push({
                        error: `Screen '${screenName}' (index ${index}): Missing required field '${field}'.`,
                        type: 'missing_field',
                        screen: screenName,
                        index: index,
                        field: field
                    });
                } else if (!this.isValidType(screen[field], expectedType)) {
                    errors.push({
                        error: `Screen '${screenName}' (index ${index}): Field '${field}' has incorrect type. Expected ${expectedType}, got ${typeof screen[field]}.`,
                        type: 'type_error',
                        screen: screenName,
                        index: index,
                        field: field
                    });
                }
            }

            // Validate projection object
            if (screen.projection && typeof screen.projection === 'object') {
                const projectionData = screen.projection;
                const projectionSchema = this.schemas.projection;

                // Required projection fields
                for (const [field, expectedType] of Object.entries(projectionSchema)) {
                    if (!(field in projectionData)) {
                        errors.push({
                            error: `Screen '${screenName}' (index ${index}), projection object: Missing required field '${field}'.`,
                            type: 'missing_field',
                            screen: screenName,
                            index: index,
                            object: 'projection',
                            field: field
                        });
                    } else if (!this.isValidType(projectionData[field], expectedType)) {
                        errors.push({
                            error: `Screen '${screenName}' (index ${index}), projection object: Field '${field}' has incorrect type. Expected ${expectedType}, got ${typeof projectionData[field]}.`,
                            type: 'type_error',
                            screen: screenName,
                            index: index,
                            object: 'projection',
                            field: field
                        });
                    }
                }

                // Optional projection fields
                const projectionOptionalSchema = this.schemas.projectionOptional;
                for (const [field, expectedType] of Object.entries(projectionOptionalSchema)) {
                    if (field in projectionData && !this.isValidType(projectionData[field], expectedType)) {
                        errors.push({
                            error: `Screen '${screenName}' (index ${index}), projection object: Field '${field}' has incorrect type. Expected ${expectedType}, got ${typeof projectionData[field]}.`,
                            type: 'type_error',
                            screen: screenName,
                            index: index,
                            object: 'projection',
                            field: field
                        });
                    }
                }
            }

            // Validate sound_system object
            if (screen.sound_system && typeof screen.sound_system === 'object') {
                const soundData = screen.sound_system;
                const soundSchema = this.schemas.soundSystem;

                for (const [field, expectedType] of Object.entries(soundSchema)) {
                    if (!(field in soundData)) {
                        errors.push({
                            error: `Screen '${screenName}' (index ${index}), sound_system object: Missing required field '${field}'.`,
                            type: 'missing_field',
                            screen: screenName,
                            index: index,
                            object: 'sound_system',
                            field: field
                        });
                    } else if (!this.isValidType(soundData[field], expectedType)) {
                        errors.push({
                            error: `Screen '${screenName}' (index ${index}), sound_system object: Field '${field}' has incorrect type. Expected ${expectedType}, got ${typeof soundData[field]}.`,
                            type: 'type_error',
                            screen: screenName,
                            index: index,
                            object: 'sound_system',
                            field: field
                        });
                    }
                }
            }

            // Business logic validations
            // Positive width
            if ('width' in screen && this.isValidType(screen.width, 'number') && screen.width <= 0) {
                errors.push({
                    error: `Screen '${screenName}' (index ${index}): 'width' must be a positive number.`,
                    type: 'business_logic',
                    screen: screenName,
                    index: index,
                    field: 'width'
                });
            }

            // Positive height
            if ('height' in screen && this.isValidType(screen.height, 'number') && screen.height <= 0) {
                errors.push({
                    error: `Screen '${screenName}' (index ${index}): 'height' must be a positive number.`,
                    type: 'business_logic',
                    screen: screenName,
                    index: index,
                    field: 'height'
                });
            }

            // Valid hex color
            if ('color' in screen && typeof screen.color === 'string' && !this.isValidHexColor(screen.color)) {
                errors.push({
                    error: `Screen '${screenName}' (index ${index}): 'color' must be a valid hex color code (e.g., #RRGGBB or #RGB).`,
                    type: 'business_logic',
                    screen: screenName,
                    index: index,
                    field: 'color'
                });
            }

            // Positive screen number
            if ('screen_number' in screen && this.isValidType(screen.screen_number, 'number') && screen.screen_number <= 0) {
                errors.push({
                    error: `Screen '${screenName}' (index ${index}): 'screen_number' must be a positive integer.`,
                    type: 'business_logic',
                    screen: screenName,
                    index: index,
                    field: 'screen_number'
                });
            }

            // Positive seating capacity
            if ('seating_capacity' in screen && this.isValidType(screen.seating_capacity, 'number') && screen.seating_capacity <= 0) {
                errors.push({
                    error: `Screen '${screenName}' (index ${index}): 'seating_capacity' must be a positive integer.`,
                    type: 'business_logic',
                    screen: screenName,
                    index: index,
                    field: 'seating_capacity'
                });
            }

            // Check for duplicates based on name and location
            const identifier = `${screen.name || ''}-${screen.location || ''}`;
            if (screenIdentifiers.has(identifier)) {
                errors.push({
                    error: `Duplicate screen found for '${screenName}' at '${screen.location}' (index ${index}).`,
                    type: 'duplicate',
                    screen: screenName,
                    index: index
                });
            }
            screenIdentifiers.add(identifier);
        });

        return errors;
    },

    // Load and validate JSON file (browser-compatible)
    async validateFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const errors = this.validateScreenData(data);

            return {
                success: errors.length === 0,
                errors: errors,
                data: data,
                filePath: filePath
            };
        } catch (error) {
            return {
                success: false,
                errors: [{ error: `Failed to load ${filePath}: ${error.message}`, type: 'file_error' }],
                data: null,
                filePath: filePath
            };
        }
    },

    // Validate JSON text directly
    validateJsonText(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            const errors = this.validateScreenData(data);

            return {
                success: errors.length === 0,
                errors: errors,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                errors: [{ error: `JSON Parse Error: ${error.message}`, type: 'parse_error' }],
                data: null
            };
        }
    },

    // Generate validation summary
    generateSummary(validationResult) {
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
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenValidator;
}

// Make available globally for browser use and Node.js
if (typeof window !== 'undefined') {
    window.ScreenValidator = ScreenValidator;
} else if (typeof global !== 'undefined') {
    global.ScreenValidator = ScreenValidator;
}