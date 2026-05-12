# Library Components

This directory contains **reusable library components** that can be used across multiple projects. These are generic, well-tested utilities with high potential for reuse.

## 📚 Available Libraries

### `json-schema-validator.js` - JSON Schema Validator
**Purpose:** Generic JSON data validation against schemas
- ✅ Schema-based validation with custom rules
- ✅ Type checking and constraint validation
- ✅ Nested object and array support
- ✅ Custom validation functions
- ✅ Browser and Node.js compatible
- ✅ Detailed error reporting

**Use Cases:**
- API data validation
- Configuration file validation
- Form data validation
- Any JSON structure validation

**Example:**
```javascript
const validator = new JSONSchemaValidator(schema);
const result = validator.validate(data);
if (!result.success) {
    console.log('Errors:', result.errors);
}
```

### `icon-manager.js` - Icon Management System
**Purpose:** Centralized icon mapping and management
- ✅ Multiple icon set support
- ✅ Automatic fallback mechanisms
- ✅ Category-based organization
- ✅ Dynamic icon set creation
- ✅ Import/export functionality

**Use Cases:**
- UI icon management
- Status indicators
- Data visualization icons
- Multi-theme icon support

**Example:**
```javascript
const iconManager = new IconManager();
iconManager.addIconSet('status', { success: '✅', error: '❌' });
const icon = iconManager.getIcon('success', 'status'); // Returns '✅'
```

### `html-templates.js` - HTML Template Engine
**Purpose:** Lightweight HTML templating system
- ✅ Template function registration
- ✅ Partial template support
- ✅ Helper function system
- ✅ Context-aware rendering
- ✅ HTML sanitization
- ✅ Template inheritance

**Use Cases:**
- Dynamic HTML generation
- Component rendering
- Email template generation
- Static site generation

**Example:**
```javascript
const engine = new TemplateEngine();
engine.registerTemplate('card', (context) => `
    <div class="card">
        <h3>${context.escape(context.title)}</h3>
        <p>${context.content}</p>
    </div>
`);
const html = engine.render('card', { title: 'Hello', content: 'World' });
```

## 🚀 Quick Start

### Browser Usage
```html
<script src="lib/json-schema-validator.js"></script>
<script src="lib/icon-manager.js"></script>
<script src="lib/html-templates.js"></script>
<script>
    // Use libraries directly
    const validator = new JSONSchemaValidator(schema);
    const iconManager = new IconManager();
    const templateEngine = new TemplateEngine();
</script>
```

### Node.js Usage
```javascript
const { JSONSchemaValidator } = require('./lib/json-schema-validator.js');
const { IconManager } = require('./lib/icon-manager.js');
const { TemplateEngine } = require('./lib/html-templates.js');

// Use libraries
const validator = new JSONSchemaValidator(schema);
const iconManager = new IconManager();
const templateEngine = new TemplateEngine();
```

## 📋 Library Standards

All libraries in this directory follow these standards:

- **Universal Compatibility:** Work in both browser and Node.js environments
- **No External Dependencies:** Self-contained, no third-party libraries required
- **Error Handling:** Comprehensive error handling with meaningful messages
- **Documentation:** Inline JSDoc comments and usage examples
- **Performance:** Optimized for speed and memory usage
- **Extensibility:** Designed for easy extension and customization

## 🔧 Development Guidelines

### Adding New Libraries
1. Follow the naming convention: `[purpose]-[type].js`
2. Include comprehensive JSDoc documentation
3. Provide both browser and Node.js exports
4. Include usage examples in this README
5. Add error handling and validation
6. Write tests in the `tests/` directory

### Code Quality
- Use modern JavaScript features (ES6+)
- Follow consistent coding style
- Include input validation
- Provide fallback mechanisms
- Document all public APIs

## 📈 Usage Statistics

These libraries are designed to be:
- **Reusable:** Can be dropped into any project
- **Maintainable:** Well-structured and documented
- **Performant:** Optimized for real-world usage
- **Reliable:** Thoroughly tested and error-handled

## 🤝 Contributing

When contributing to these libraries:
1. Maintain backward compatibility
2. Add comprehensive tests
3. Update documentation
4. Follow existing code patterns
5. Ensure cross-environment compatibility