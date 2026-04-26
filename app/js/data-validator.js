/**
 * Data Validator Module
 * 
 * Provides centralized data validation using JSON schemas.
 * Integrates with SchemaRegistry to validate all application data files.
 */

class DataValidator {
    constructor() {
        this.validator = null;
        this.schemaRegistry = null;
        this.validationResults = new Map();
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        if (typeof JSONSchemaValidator === 'undefined') {
            throw new Error('JSONSchemaValidator not available');
        }

        if (typeof SchemaRegistry === 'undefined') {
            throw new Error('SchemaRegistry not available');
        }

        this.validator = new JSONSchemaValidator();
        this.schemaRegistry = SchemaRegistry;
        this.schemaRegistry.initialize();
        this.initialized = true;

        console.log('✅ DataValidator initialized');
    }

    async validateFile(dataType, filePath) {
        this.ensureInitialized();

        const schema = this.schemaRegistry.getSchema(dataType);
        if (!schema) {
            throw new Error(`No schema found for data type: ${dataType}`);
        }

        this.validator.schema = schema;

        const result = await this.validator.validateFile(filePath);

        this.validationResults.set(dataType, result);

        if (!result.success) {
            console.error(`❌ Validation failed for ${dataType}:`, result.errors);
        } else {
            console.log(`✅ Validation passed for ${dataType}`);
        }

        return result;
    }

    validateData(dataType, data) {
        this.ensureInitialized();

        const schema = this.schemaRegistry.getSchema(dataType);
        if (!schema) {
            throw new Error(`No schema found for data type: ${dataType}`);
        }

        this.validator.schema = schema;
        const result = this.validator.validate(data);

        this.validationResults.set(dataType, result);

        if (!result.success) {
            console.error(`❌ Validation failed for ${dataType}:`, result.errors);
        } else {
            console.log(`✅ Validation passed for ${dataType}`);
        }

        return result;
    }

    async validateAllFiles() {
        this.ensureInitialized();

        const dataTypes = ['screens', 'config', 'constants', 'tooltips', 'icons'];
        const results = {};
        const errors = [];

        for (const dataType of dataTypes) {
            try {
                const filePath = this.schemaRegistry.getDataPath(dataType);
                const result = await this.validateFile(dataType, filePath);
                results[dataType] = result;

                if (!result.success) {
                    errors.push({
                        dataType,
                        filePath,
                        errors: result.errors
                    });
                }
            } catch (error) {
                errors.push({
                    dataType,
                    error: error.message,
                    stack: error.stack
                });
                console.error(`❌ Failed to validate ${dataType}:`, error);
            }
        }

        return {
            allPassed: errors.length === 0,
            results,
            errors
        };
    }

    getValidationResult(dataType) {
        return this.validationResults.get(dataType);
    }

    getAllValidationResults() {
        return Object.fromEntries(this.validationResults);
    }

    hasValidationErrors(dataType) {
        const result = this.validationResults.get(dataType);
        return result ? !result.success : false;
    }

    formatErrors(errors) {
        if (!errors || errors.length === 0) return '';

        return errors.map(err => {
            if (err.path) {
                return `  • ${err.error} (path: ${err.path})`;
            }
            return `  • ${err.error}`;
        }).join('\n');
    }

    ensureInitialized() {
        if (!this.initialized) {
            this.initialize();
        }
    }

    reset() {
        this.validationResults.clear();
        console.log('🔄 DataValidator reset');
    }
}

const Validator = new DataValidator();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}

if (typeof window !== 'undefined') {
    window.Validator = Validator;
    window.DataValidator = DataValidator;
}
