# Tests Directory

This directory contains development and testing utilities for the Hyderabad Cinema Technology Comparison application.

## Test Files

### JavaScript Test Files
- `simple-test.js` - Basic D3.js interaction testing
- `simple-test-2.js` - Additional D3.js functionality tests
- `simple-test-3.js` - Extended D3.js testing scenarios
- `test-mouse-events.js` - Mouse event handling tests
- `test-syntax.js` - JavaScript syntax validation tests
- `validate_screens.js` - **NEW:** JavaScript data validation library (replacement for Python validator)

### HTML Test Files
- `test-emoji.html` - Emoji rendering test for UI components
- `validate_screens.html` - **NEW:** Browser-based data validation interface

## Purpose

These files were created during development to:
- Test D3.js functionality and syntax
- Validate mouse event handling
- Check emoji rendering compatibility
- Isolate and debug specific code sections
- Ensure proper JavaScript syntax before integration

## Data Validation Tools

### `validate_screens.js` & `validate_screens.html`
**Purpose:** JavaScript-based data validation replacing the deprecated Python script.

**Features:**
- Browser-compatible validation (no Python dependency)
- Real-time validation feedback
- Detailed error reporting with error types
- Support for file URLs and direct JSON text input
- Validation summary with error breakdown

**Usage:**
```bash
# Open browser interface
open tests/validate_screens.html

# Or use programmatically in JavaScript
import { ScreenValidator } from './validate_screens.js';
const result = await ScreenValidator.validateFile('../data/screens.json');
```

**Validation Types:**
- `missing_field` - Required fields are absent
- `type_error` - Field has wrong data type
- `business_logic` - Values don't meet business rules
- `duplicate` - Same screen appears multiple times
- `file_error` - Issues loading the file
- `parse_error` - Invalid JSON syntax

## Usage

These test files are standalone and can be run individually for debugging purposes. They are not part of the main application and are kept separate for development reference.

The validation tools (`validate_screens.js` and `validate_screens.html`) are production-ready replacements for the deprecated Python validator.

## Maintenance

When adding new test files, follow the naming convention:
- `test-[feature].js` for feature-specific tests
- `simple-test-[number].js` for general functionality tests
- `[feature]-test.html` for HTML-specific tests

For validation tools:
- `validate_[feature].js` for validation libraries
- `validate_[feature].html` for validation interfaces