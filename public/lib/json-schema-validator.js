/**
 * JSON Schema Validator Library
 *
 * A generic, reusable JSON schema validation library that can validate
 * any JSON data structure against a defined schema.
 *
 * Features:
 * - Schema-based validation
 * - Type checking
 * - Custom validation rules
 * - Detailed error reporting
 * - Browser and Node.js compatible
 *
 * @version 1.0.0
 * @license MIT
 */

class JSONSchemaValidator {
    constructor(schema = {}) {
        this.schema = schema;
        this.customValidators = {};
    }

    /**
     * Validate data against the schema
     * @param {any} data - Data to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result with success/errors
     */
    validate(data, options = {}) {
        const errors = [];

        if (!this.schema || Object.keys(this.schema).length === 0) {
            return { success: true, errors: [], data };
        }

        this.validateAgainstSchema(data, this.schema, '', errors, options);

        return {
            success: errors.length === 0,
            errors,
            data,
            validatedAt: new Date().toISOString()
        };
    }

    /**
     * Recursive validation against schema
     * @private
     */
    validateAgainstSchema(data, schema, path, errors, options) {
        // Handle array validation
        if (Array.isArray(data)) {
            if (schema.type !== 'array') {
                errors.push({
                    error: `Expected ${schema.type}, got array`,
                    path,
                    expected: schema.type,
                    received: 'array'
                });
                return;
            }

            // Validate array items if itemSchema is defined
            if (schema.itemSchema) {
                data.forEach((item, index) => {
                    this.validateAgainstSchema(item, schema.itemSchema, `${path}[${index}]`, errors, options);
                });
            }

            // Validate array constraints
            if (schema.minItems !== undefined && data.length < schema.minItems) {
                errors.push({
                    error: `Array must have at least ${schema.minItems} items`,
                    path,
                    constraint: 'minItems'
                });
            }
            return;
        }

        // Handle object validation
        if (typeof data === 'object' && data !== null) {
            if (schema.type !== 'object') {
                errors.push({
                    error: `Expected ${schema.type}, got object`,
                    path,
                    expected: schema.type,
                    received: 'object'
                });
                return;
            }

            // Check required fields
            if (schema.required) {
                schema.required.forEach(field => {
                    if (!(field in data)) {
                        errors.push({
                            error: `Missing required field: ${field}`,
                            path: path ? `${path}.${field}` : field,
                            field,
                            constraint: 'required'
                        });
                    }
                });
            }

            // Validate each field
            Object.entries(schema.properties || {}).forEach(([field, fieldSchema]) => {
                const fieldPath = path ? `${path}.${field}` : field;
                const fieldValue = data[field];

                if (fieldValue !== undefined) {
                    this.validateField(fieldValue, fieldSchema, fieldPath, errors, options);
                } else if (fieldSchema.required) {
                    errors.push({
                        error: `Missing required field: ${field}`,
                        path: fieldPath,
                        field,
                        constraint: 'required'
                    });
                }
            });
            return;
        }

        // Handle primitive validation
        this.validateField(data, schema, path, errors, options);
    }

    /**
     * Validate a single field
     * @private
     */
    validateField(value, schema, path, errors, _options) {
        // Type validation
        if (schema.type && !this.checkType(value, schema.type)) {
            errors.push({
                error: `Expected type ${schema.type}, got ${typeof value}`,
                path,
                expected: schema.type,
                received: typeof value,
                constraint: 'type'
            });
            return;
        }

        // Custom validators
        if (schema.validate && typeof schema.validate === 'function') {
            try {
                const result = schema.validate(value, path, errors);
                if (result !== true) {
                    errors.push({
                        error: result || 'Custom validation failed',
                        path,
                        constraint: 'custom'
                    });
                }
            } catch (e) {
                errors.push({
                    error: `Custom validation error: ${e.message}`,
                    path,
                    constraint: 'custom'
                });
            }
        }

        // String constraints
        if (schema.type === 'string' && typeof value === 'string') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push({
                    error: `String must be at least ${schema.minLength} characters`,
                    path,
                    constraint: 'minLength'
                });
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push({
                    error: `String must be at most ${schema.maxLength} characters`,
                    path,
                    constraint: 'maxLength'
                });
            }
            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors.push({
                    error: `String does not match pattern: ${schema.pattern}`,
                    path,
                    constraint: 'pattern'
                });
            }
        }

        // Number constraints
        if (schema.type === 'number' && typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push({
                    error: `Number must be at least ${schema.minimum}`,
                    path,
                    constraint: 'minimum'
                });
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push({
                    error: `Number must be at most ${schema.maximum}`,
                    path,
                    constraint: 'maximum'
                });
            }
        }
    }

    /**
     * Check if value matches expected type
     * @private
     */
    checkType(value, expectedType) {
        switch (expectedType) {
            case 'string': return typeof value === 'string';
            case 'number': return typeof value === 'number' && !isNaN(value);
            case 'boolean': return typeof value === 'boolean';
            case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array': return Array.isArray(value);
            case 'null': return value === null;
            default: return true; // Unknown type, allow
        }
    }

    /**
     * Load and validate JSON from file (browser-compatible)
     * @param {string} filePath - Path to JSON file
     * @returns {Promise<Object>} Validation result
     */
    async validateFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                return {
                    success: false,
                    errors: [{ error: `Failed to load file: ${response.status} ${response.statusText}`, constraint: 'file' }],
                    filePath
                };
            }

            const data = await response.json();
            const result = this.validate(data);

            return {
                ...result,
                filePath,
                fileSize: JSON.stringify(data).length
            };
        } catch (error) {
            return {
                success: false,
                errors: [{ error: `File loading error: ${error.message}`, constraint: 'file' }],
                filePath
            };
        }
    }

    /**
     * Validate JSON string directly
     * @param {string} jsonString - JSON string to validate
     * @returns {Object} Validation result
     */
    validateJsonString(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return this.validate(data);
        } catch (error) {
            return {
                success: false,
                errors: [{ error: `JSON parse error: ${error.message}`, constraint: 'parse' }],
                originalString: jsonString
            };
        }
    }

    /**
     * Set custom validator function
     * @param {string} name - Validator name
     * @param {Function} validatorFn - Validator function
     */
    setCustomValidator(name, validatorFn) {
        this.customValidators[name] = validatorFn;
    }

    /**
     * Create a cinema screen validator (specific use case)
     * @returns {JSONSchemaValidator} Configured validator
     */
    static createCinemaScreenValidator() {
        const schema = {
            type: 'array',
            itemSchema: {
                type: 'object',
                required: ['name', 'location', 'width', 'height', 'color', 'plf_format', 'projection', 'sound_system'],
                properties: {
                    name: { type: 'string' },
                    location: { type: 'string' },
                    width: { type: 'number', validate: (value) => value > 0 || 'Width must be positive' },
                    height: { type: 'number', validate: (value) => value > 0 || 'Height must be positive' },
                    color: {
                        type: 'string',
                        validate: (value) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) || 'Invalid hex color format'
                    },
                    plf_format: { type: 'string' },
                    screen_number: { type: 'number', validate: (value) => value > 0 || 'Screen number must be positive' },
                    seating_capacity: { type: 'number', validate: (value) => value > 0 || 'Seating capacity must be positive' },
                    projection: {
                        type: 'object',
                        required: ['type', 'resolution'],
                        properties: {
                            type: { type: 'string' },
                            resolution: { type: 'string' },
                            brand: { type: 'string' }
                        }
                    },
                    sound_system: {
                        type: 'object',
                        required: ['format'],
                        properties: {
                            format: { type: 'string' },
                            channels: { type: 'string' }
                        }
                    }
                }
            }
        };

        return new JSONSchemaValidator(schema);
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONSchemaValidator;
}

if (typeof window !== 'undefined') {
    window.JSONSchemaValidator = JSONSchemaValidator;
}

if (typeof global !== 'undefined') {
    global.JSONSchemaValidator = JSONSchemaValidator;
}