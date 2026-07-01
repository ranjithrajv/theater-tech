class JSONSchemaValidator {
    constructor(schema = {}) {
        this.schema = schema;
        this.customValidators = {};
    }

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

    validateAgainstSchema(data, schema, path, errors, options) {
        if (Array.isArray(data)) {
            if (schema.type !== 'array') {
                errors.push({ error: `Expected ${schema.type}, got array`, path, expected: schema.type, received: 'array' });
                return;
            }
            if (schema.itemSchema) {
                data.forEach((item, index) => {
                    this.validateAgainstSchema(item, schema.itemSchema, `${path}[${index}]`, errors, options);
                });
            }
            if (schema.minItems !== undefined && data.length < schema.minItems) {
                errors.push({ error: `Array must have at least ${schema.minItems} items`, path, constraint: 'minItems' });
            }
            return;
        }

        if (typeof data === 'object' && data !== null) {
            if (schema.type !== 'object') {
                errors.push({ error: `Expected ${schema.type}, got object`, path, expected: schema.type, received: 'object' });
                return;
            }
            if (schema.required) {
                schema.required.forEach(field => {
                    if (!(field in data)) {
                        errors.push({ error: `Missing required field: ${field}`, path: path ? `${path}.${field}` : field, field, constraint: 'required' });
                    }
                });
            }
            Object.entries(schema.properties || {}).forEach(([field, fieldSchema]) => {
                const fieldPath = path ? `${path}.${field}` : field;
                const fieldValue = data[field];
                if (fieldValue !== undefined) {
                    this.validateField(fieldValue, fieldSchema, fieldPath, errors, options);
                } else if (fieldSchema.required) {
                    errors.push({ error: `Missing required field: ${field}`, path: fieldPath, field, constraint: 'required' });
                }
            });
            return;
        }

        this.validateField(data, schema, path, errors, options);
    }

    validateField(value, schema, path, errors, _options) {
        if (schema.type && !this.checkType(value, schema.type)) {
            errors.push({ error: `Expected type ${schema.type}, got ${typeof value}`, path, expected: schema.type, received: typeof value, constraint: 'type' });
            return;
        }
        if (schema.validate && typeof schema.validate === 'function') {
            try {
                const result = schema.validate(value, path, errors);
                if (result !== true) {
                    errors.push({ error: result || 'Custom validation failed', path, constraint: 'custom' });
                }
            } catch (e) {
                errors.push({ error: `Custom validation error: ${e.message}`, path, constraint: 'custom' });
            }
        }
        if (schema.type === 'string' && typeof value === 'string') {
            if (schema.minLength && value.length < schema.minLength) errors.push({ error: `String must be at least ${schema.minLength} characters`, path, constraint: 'minLength' });
            if (schema.maxLength && value.length > schema.maxLength) errors.push({ error: `String must be at most ${schema.maxLength} characters`, path, constraint: 'maxLength' });
            if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push({ error: `String does not match pattern: ${schema.pattern}`, path, constraint: 'pattern' });
        }
        if (schema.type === 'number' && typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) errors.push({ error: `Number must be at least ${schema.minimum}`, path, constraint: 'minimum' });
            if (schema.maximum !== undefined && value > schema.maximum) errors.push({ error: `Number must be at most ${schema.maximum}`, path, constraint: 'maximum' });
        }
    }

    checkType(value, expectedType) {
        switch (expectedType) {
            case 'string': return typeof value === 'string';
            case 'number': return typeof value === 'number' && !isNaN(value);
            case 'boolean': return typeof value === 'boolean';
            case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array': return Array.isArray(value);
            case 'null': return value === null;
            default: return true;
        }
    }

    async validateFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                return { success: false, errors: [{ error: `Failed to load file: ${response.status} ${response.statusText}`, constraint: 'file' }], filePath };
            }
            const data = await response.json();
            const result = this.validate(data);
            return { ...result, filePath, fileSize: JSON.stringify(data).length };
        } catch (error) {
            return { success: false, errors: [{ error: `File loading error: ${error.message}`, constraint: 'file' }], filePath };
        }
    }

    validateJsonString(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return this.validate(data);
        } catch (error) {
            return { success: false, errors: [{ error: `JSON parse error: ${error.message}`, constraint: 'parse' }], originalString: jsonString };
        }
    }

    setCustomValidator(name, validatorFn) {
        this.customValidators[name] = validatorFn;
    }

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
                    color: { type: 'string', validate: (value) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) || 'Invalid hex color format' },
                    plf_format: { type: 'string' },
                    screen_number: { type: 'number', validate: (value) => value > 0 || 'Screen number must be positive' },
                    seating_capacity: { type: 'number', validate: (value) => value > 0 || 'Seating capacity must be positive' },
                    projection: { type: 'object', required: ['type', 'resolution'], properties: { type: { type: 'string' }, resolution: { type: 'string' }, brand: { type: 'string' } } },
                    sound_system: { type: 'object', required: ['format'], properties: { format: { type: 'string' }, channels: { type: 'string' } } }
                }
            }
        };
        return new JSONSchemaValidator(schema);
    }
}

export { JSONSchemaValidator };
if (typeof window !== 'undefined') { window.JSONSchemaValidator = JSONSchemaValidator; }
