/**
 * Tooltips Data Schema
 * 
 * Defines the validation schema for tooltips.json
 * which contains glossary terms and explanations.
 */

const TooltipsSchema = {
    type: 'object',
    required: ['glossaryTerms', 'explanations'],
    properties: {
        glossaryTerms: {
            type: 'array',
            minItems: 1,
            itemSchema: {
                type: 'string',
                validate: (value) => {
                    if (!value || typeof value !== 'string') return 'Glossary term must be a non-empty string';
                    if (value.length > 100) return 'Glossary term must not exceed 100 characters';
                    return true;
                }
            }
        },
        explanations: {
            type: 'object',
            properties: {
                projection: {
                    type: 'string',
                    maxLength: 500
                },
                'projection-type': {
                    type: 'string',
                    maxLength: 500
                },
                brightness: {
                    type: 'string',
                    maxLength: 500
                },
                'aspect-ratio': {
                    type: 'string',
                    maxLength: 500
                },
                'projection-brand': {
                    type: 'string',
                    maxLength: 500
                },
                sound: {
                    type: 'string',
                    maxLength: 500
                },
                'dolby-atmos': {
                    type: 'string',
                    maxLength: 500
                },
                'dolby-digital': {
                    type: 'string',
                    maxLength: 500
                },
                'digital-sound': {
                    type: 'string',
                    maxLength: 500
                },
                'analog-surround': {
                    type: 'string',
                    maxLength: 500
                },
                'sound-channels': {
                    type: 'string',
                    maxLength: 500
                },
                seating: {
                    type: 'string',
                    maxLength: 500
                },
                'screen-surface': {
                    type: 'string',
                    maxLength: 500
                },
                'screen-material': {
                    type: 'string',
                    maxLength: 500
                },
                'screen-gain': {
                    type: 'string',
                    maxLength: 500
                },
                'content-support': {
                    type: 'string',
                    maxLength: 500
                },
                '3d': {
                    type: 'string',
                    maxLength: 500
                },
                hdr: {
                    type: 'string',
                    maxLength: 500
                },
                hfr: {
                    type: 'string',
                    maxLength: 500
                },
                '4d': {
                    type: 'string',
                    maxLength: 500
                },
                laser: {
                    type: 'string',
                    maxLength: 500
                },
                led: {
                    type: 'string',
                    maxLength: 500
                },
                '70mm': {
                    type: 'string',
                    maxLength: 500
                },
                '4k': {
                    type: 'string',
                    maxLength: 500
                },
                '2k': {
                    type: 'string',
                    maxLength: 500
                },
                film: {
                    type: 'string',
                    maxLength: 500
                },
                resolution: {
                    type: 'string',
                    maxLength: 500
                }
            }
        }
    }
};

export { TooltipsSchema };
