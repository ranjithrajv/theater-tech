# Tests Directory

## Active test

- **`quick-validate.mjs`** — the only test actually run by CI/the pre-commit hook (`npm test` / `npm run validate`). Connects to `public/data/theater_tech.db` and checks that the `screens`, `config`, `constants`, `tooltips`, and `icons` tables have rows. It's a sanity check, not a correctness check — it doesn't validate field values or schema conformance.

## Legacy scripts

The rest of this directory (`browser_test.js`, `data-validation-test.js`, `test_app_loading.js`, `test_network*.js`, `test_scaling.js`, `validate_runtime.js`, `validate_screens.js`, the `*.html` debug pages, etc.) predates the Vite migration. They were written as CommonJS scripts (`require(...)`) for the old `app/`-based static site and reference paths that no longer exist. With `"type": "module"` in `package.json`, plain `.js` files now default to ES modules, so `require()` in these files will throw — **they no longer run as-is**.

They're kept for reference rather than deleted, but treat them as historical, not as working tests. If you need browser-based testing, prefer driving the actual `dist/` build with Playwright instead of resurrecting these.

## Adding a real test

Add assertions to `quick-validate.mjs` directly, or introduce a proper test runner — there isn't one configured yet.
