/**
 * Application Config Schema
 * 
 * Defines the validation schema for config.json
 * which contains application configuration including legend,
 * glossary, and metadata.
 */

const ConfigSchema = {
    type: 'object',
    required: ['title', 'description', 'data_current_as_of'],
    properties: {
        title: {
            type: 'string',
            minLength: 1,
            maxLength: 200
        },
        description: {
            type: 'string',
            minLength: 1,
            maxLength: 500
        },
        data_current_as_of: {
            type: 'string',
            validate: (value) => {
                if (!value) return 'Data current as of is required';
                if (typeof value !== 'string') return 'Data current as of must be a string';
                if (!/^\d{4}$/.test(value)) {
                    return 'Data current as of must be a 4-digit year (e.g., 2024)';
                }
                return true;
            }
        },
        legend: {
            type: 'object',
            required: ['plf_formats', 'glossary'],
            properties: {
                plf_formats: {
                    type: 'array',
                    itemSchema: {
                        type: 'object',
                        required: ['format', 'name', 'color'],
                        properties: {
                            format: {
                                type: 'string',
                                minLength: 1,
                                maxLength: 20
                            },
                            name: {
                                type: 'string',
                                minLength: 1,
                                maxLength: 100
                            },
                            description: {
                                type: 'string',
                                maxLength: 200
                            },
                            color: {
                                type: 'string',
                                validate: (value) => {
                                    if (!value) return 'Color is required';
                                    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
                                        return 'Color must be valid hex color (e.g., #E63946)';
                                    }
                                    return true;
                                }
                            },
                            best_for: {
                                type: 'array',
                                itemSchema: { type: 'string' }
                            },
                            ideal_experience: {
                                type: 'string',
                                maxLength: 300
                            }
                        }
                    }
                },
                technical_specifications: {
                    type: 'object',
                    properties: {
                        basic: {
                            type: 'object',
                            properties: {
                                projection_types: { type: 'array', itemSchema: { type: 'string' } },
                                sound_systems: { type: 'array', itemSchema: { type: 'string' } },
                                content_support: { type: 'array', itemSchema: { type: 'string' } }
                            }
                        },
                        advanced: {
                            type: 'object',
                            properties: {
                                projection_details: { type: 'array', itemSchema: { type: 'string' } },
                                resolution_options: { type: 'array', itemSchema: { type: 'string' } },
                                sound_formats: { type: 'array', itemSchema: { type: 'string' } },
                                screen_surfaces: { type: 'array', itemSchema: { type: 'string' } },
                                advanced_content: { type: 'string' }
                            }
                        }
                    }
                },
                screen_geometry: {
                    type: 'object',
                    properties: {
                        basic: {
                            type: 'object',
                            properties: {
                                size_range: { type: 'string' },
                                seating_range: { type: 'string' },
                                aspect_ratios: { type: 'array', itemSchema: { type: 'string' } }
                            }
                        },
                        advanced: {
                            type: 'object',
                            properties: {
                                size_categories: { type: 'array', itemSchema: { type: 'string' } },
                                seating_breakdown: { type: 'object' },
                                aspect_ratio_details: { type: 'object' }
                            }
                        }
                    }
                },
                visual_elements: {
                    type: 'object',
                    properties: {
                        basic: {
                            type: 'object',
                            properties: {
                                click_formats: { type: 'string' },
                                hover_details: { type: 'string' },
                                size_indicators: { type: 'string' }
                            }
                        },
                        advanced: {
                            type: 'object',
                            properties: {
                                screen_colors: { type: 'string' },
                                interactive_tooltips: { type: 'string' },
                                size_categories: { type: 'string' },
                                format_filtering: { type: 'string' }
                            }
                        }
                    }
                },
                theater_categories: {
                    type: 'object',
                    properties: {
                        basic: {
                            type: 'object',
                            properties: {
                                luxury: { type: 'array', itemSchema: { type: 'string' } },
                                premium: { type: 'array', itemSchema: { type: 'string' } },
                                standard: { type: 'array', itemSchema: { type: 'string' } },
                                heritage: { type: 'array', itemSchema: { type: 'string' } }
                            }
                        },
                        advanced: {
                            type: 'object',
                            properties: {
                                luxury_multiplexes: { type: 'array', itemSchema: { type: 'string' } },
                                premium_multiplexes: { type: 'array', itemSchema: { type: 'string' } },
                                grand_format: { type: 'array', itemSchema: { type: 'string' } },
                                standard_multiplex: { type: 'array', itemSchema: { type: 'string' } },
                                heritage_cinemas: { type: 'array', itemSchema: { type: 'string' } }
                            }
                        }
                    }
                }
            }
        },
        glossary: {
            type: 'array',
            minItems: 1,
            itemSchema: {
                type: 'object',
                required: ['term', 'definition'],
                properties: {
                    term: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 100
                    },
                    definition: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 1000
                    }
                }
            }
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigSchema;
}

if (typeof window !== 'undefined') {
    window.ConfigSchema = ConfigSchema;
}
