/**
 * Icons Data Schema
 * 
 * Defines the validation schema for icons.json
 * which contains icon definitions and technology descriptions.
 */

const IconsSchema = {
    type: 'object',
    required: ['icons'],
    properties: {
        icons: {
            type: 'object',
            required: ['projection', 'sound', 'default'],
            properties: {
                projection: {
                    type: 'object',
                    properties: {
                        Film: { type: 'string' },
                        Laser: { type: 'string' },
                        LED: { type: 'string' },
                        '70mm Film': { type: 'string' },
                        '4K': { type: 'string' },
                        '2K': { type: 'string' }
                    }
                },
                sound: {
                    type: 'object',
                    properties: {
                        'Dolby Atmos': { type: 'string' },
                        'Dolby Digital': { type: 'string' },
                        'Digital Sound': { type: 'string' },
                        'Analog Surround': { type: 'string' }
                    }
                },
                default: {
                    type: 'object',
                    properties: {
                        projection: { type: 'string' },
                        sound: { type: 'string' }
                    }
                }
            }
        },
        techDescriptions: {
            type: 'object',
            properties: {
                projectionTypes: {
                    type: 'object',
                    properties: {
                        '70mm Film': { type: 'string' },
                        '4K': { type: 'string' },
                        Laser: { type: 'string' },
                        LED: { type: 'string' }
                    }
                },
                soundFormats: {
                    type: 'object',
                    properties: {
                        'Dolby Atmos': { type: 'string' },
                        'Dolby Digital': { type: 'string' },
                        'Digital Sound': { type: 'string' },
                        'Analog Surround': { type: 'string' }
                    }
                }
            }
        }
    }
};

export { IconsSchema };
