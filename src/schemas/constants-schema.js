/**
 * Constants Data Schema
 * 
 * Defines the validation schema for constants.json
 * which contains application constants including UI settings,
 * animations, colors, and data paths.
 */

const ConstantsSchema = {
    type: 'object',
    required: ['ui', 'animations', 'colors', 'sizeThresholds'],
    properties: {
        ui: {
            type: 'object',
            required: ['responsiveBreakpoints', 'margins', 'dimensions'],
            properties: {
                responsiveBreakpoints: {
                    type: 'object',
                    required: ['mobile', 'tablet'],
                    properties: {
                        mobile: {
                            type: 'number',
                            validate: (value) => {
                                if (typeof value !== 'number' || isNaN(value)) return 'Mobile breakpoint must be a number';
                                if (value < 300) return 'Mobile breakpoint must be at least 300';
                                if (value > 1200) return 'Mobile breakpoint must not exceed 1200';
                                return true;
                            }
                        },
                        tablet: {
                            type: 'number',
                            validate: (value) => {
                                if (typeof value !== 'number' || isNaN(value)) return 'Tablet breakpoint must be a number';
                                if (value < 600) return 'Tablet breakpoint must be at least 600';
                                if (value > 2000) return 'Tablet breakpoint must not exceed 2000';
                                return true;
                            }
                        }
                    }
                },
                margins: {
                    type: 'object',
                    required: ['mobile', 'desktop'],
                    properties: {
                        mobile: {
                            type: 'object',
                            required: ['top', 'right', 'bottom', 'left'],
                            properties: {
                                top: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Top must be non-negative number' },
                                right: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Right must be non-negative number' },
                                bottom: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Bottom must be non-negative number' },
                                left: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Left must be non-negative number' }
                            }
                        },
                        desktop: {
                            type: 'object',
                            required: ['top', 'right', 'bottom', 'left'],
                            properties: {
                                top: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Top must be non-negative number' },
                                right: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Right must be non-negative number' },
                                bottom: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Bottom must be non-negative number' },
                                left: { type: 'number', validate: (v) => typeof v === 'number' && v >= 0 || 'Left must be non-negative number' }
                            }
                        }
                    }
                },
                dimensions: {
                    type: 'object',
                    required: ['mobileHeight', 'desktopHeight', 'containerWidth', 'scale'],
                    properties: {
                        mobileHeight: {
                            type: 'number',
                            validate: (value) => {
                                if (typeof value !== 'number' || isNaN(value)) return 'Mobile height must be a number';
                                if (value < 200) return 'Mobile height must be at least 200';
                                if (value > 2000) return 'Mobile height must not exceed 2000';
                                return true;
                            }
                        },
                        desktopHeight: {
                            type: 'number',
                            validate: (value) => {
                                if (typeof value !== 'number' || isNaN(value)) return 'Desktop height must be a number';
                                if (value < 400) return 'Desktop height must be at least 400';
                                if (value > 2000) return 'Desktop height must not exceed 2000';
                                return true;
                            }
                        },
                        containerWidth: {
                            type: 'number',
                            validate: (value) => {
                                if (typeof value !== 'number' || isNaN(value)) return 'Container width must be a number';
                                if (value < 400) return 'Container width must be at least 400';
                                if (value > 5000) return 'Container width must not exceed 5000';
                                return true;
                            }
                        },
                        scale: {
                            type: 'object',
                            required: ['mobile', 'desktop'],
                            properties: {
                                mobile: {
                                    type: 'number',
                                    validate: (value) => {
                                        if (typeof value !== 'number' || isNaN(value)) return 'Mobile scale must be a number';
                                        if (value < 1) return 'Mobile scale must be at least 1';
                                        if (value > 20) return 'Mobile scale must not exceed 20';
                                        return true;
                                    }
                                },
                                desktop: {
                                    type: 'number',
                                    validate: (value) => {
                                        if (typeof value !== 'number' || isNaN(value)) return 'Desktop scale must be a number';
                                        if (value < 1) return 'Desktop scale must be at least 1';
                                        if (value > 20) return 'Desktop scale must not exceed 20';
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                },
                comparisonLimit: {
                    type: 'number',
                    validate: (value) => {
                        if (value === null || value === undefined) return true;
                        if (typeof value !== 'number' || isNaN(value)) return 'Comparison limit must be a number';
                        if (value < 1) return 'Comparison limit must be at least 1';
                        if (value > 10) return 'Comparison limit must not exceed 10';
                        return true;
                    }
                }
            }
        },
        animations: {
            type: 'object',
            required: ['debounceDelay', 'loadingDelay', 'fadeDuration', 'transitionDelay'],
            properties: {
                debounceDelay: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'Debounce delay must be a number';
                        if (value < 0) return 'Debounce delay must be non-negative';
                        if (value > 5000) return 'Debounce delay must not exceed 5000ms';
                        return true;
                    }
                },
                loadingDelay: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'Loading delay must be a number';
                        if (value < 0) return 'Loading delay must be non-negative';
                        if (value > 10000) return 'Loading delay must not exceed 10000ms';
                        return true;
                    }
                },
                fadeDuration: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'Fade duration must be a number';
                        if (value < 0) return 'Fade duration must be non-negative';
                        if (value > 5000) return 'Fade duration must not exceed 5000ms';
                        return true;
                    }
                },
                transitionDelay: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'Transition delay must be a number';
                        if (value < 0) return 'Transition delay must be non-negative';
                        if (value > 5000) return 'Transition delay must not exceed 5000ms';
                        return true;
                    }
                }
            }
        },
        colors: {
            type: 'object',
            required: ['primary', 'secondary', 'accent', 'background', 'surface', 'border', 'text'],
            properties: {
                primary: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Primary color must be valid hex'
                },
                secondary: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Secondary color must be valid hex'
                },
                accent: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Accent color must be valid hex'
                },
                background: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Background color must be valid hex'
                },
                surface: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Surface color must be valid hex'
                },
                border: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Border color must be valid hex'
                },
                text: {
                    type: 'string',
                    validate: (value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Text color must be valid hex'
                },
                textSecondary: {
                    type: 'string',
                    validate: (value) => value === null || value === undefined || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Text secondary color must be valid hex or null'
                },
                textMuted: {
                    type: 'string',
                    validate: (value) => value === null || value === undefined || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || 'Text muted color must be valid hex or null'
                }
            }
        },
        sizeThresholds: {
            type: 'object',
            required: ['XXL', 'XL', 'L', 'M'],
            properties: {
                XXL: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'XXL threshold must be a number';
                        if (value < 1000) return 'XXL threshold must be at least 1000';
                        return true;
                    }
                },
                XL: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'XL threshold must be a number';
                        if (value < 1000) return 'XL threshold must be at least 1000';
                        return true;
                    }
                },
                L: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'L threshold must be a number';
                        if (value < 500) return 'L threshold must be at least 500';
                        return true;
                    }
                },
                M: {
                    type: 'number',
                    validate: (value) => {
                        if (typeof value !== 'number' || isNaN(value)) return 'M threshold must be a number';
                        if (value < 100) return 'M threshold must be at least 100';
                        return true;
                    }
                }
            }
        },
        dataPaths: {
            type: 'object',
            properties: {
                screens: {
                    type: 'string',
                    validate: (value) => value && typeof value === 'string' || 'Screens path must be a non-empty string'
                },
                config: {
                    type: 'string',
                    validate: (value) => value && typeof value === 'string' || 'Config path must be a non-empty string'
                }
            }
        }
    }
};

export { ConstantsSchema };
