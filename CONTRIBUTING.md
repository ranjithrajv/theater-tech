# Contributing to India Cinema Technology Comparison

Thank you for helping make this the definitive resource for cinema technology comparisons in India!

## How to Add a New City

1. **Fork** this repository
2. **Add screens** to `public/data/screens.json` following the format below
3. **Run validation**: `npm run validate:schema`
4. **Commit** with a descriptive message (e.g., `add Bangalore theater data`)
5. **Open a Pull Request**

## Screen Data Format

Each screen entry in `screens.json` requires these fields:

```json
{
  "name": "PVR Forum",
  "city": "Bangalore",
  "state": "Karnataka",
  "location": "Koramangala",
  "width": 62.0,
  "height": 32.0,
  "color": "#457B9D",
  "plf_format": "PXL",
  "screen_number": 4,
  "seating_capacity": 312,
  "chain": "PVR",
  "theater_name": "Forum",
  "note": "Premium Large Format screen at Forum Mall",
  "projection": {
    "type": "Laser",
    "resolution": "4K",
    "brand": "Barco",
    "model": null,
    "aspect_ratio": "1.90:1",
    "brightness_lumens": 28000
  },
  "sound_system": {
    "format": "Dolby Atmos",
    "channels": "7.1",
    "brand": null
  },
  "screen_surface": {
    "material": "Acoustic Transparent",
    "gain": 1.7
  },
  "content_support": {
    "3d_capability": true,
    "hdr_support": true
  }
}
```

### Required Fields

| Field | Type | Notes |
|---|---|---|---|
| `name` | string | Full theater/screen name |
| `city` | string | City name |
| `state` | string | State name |
| `location` | string | Area/neighborhood |
| `width` | number | Screen width in feet |
| `height` | number | Screen height in feet |
| `color` | string | Hex color (`#RRGGBB`) |
| `plf_format` | string | One of: PCX, Superplex, PXL, EPIQ, LUX, Standard, 70mm, 35mm, Dolby Cinema |
| `screen_number` | number | Screen number (1-based) |
| `seating_capacity` | number | Total seats |
| `projection.type` | string | Laser, LED, Film, Lamp, Xenon Lamp |
| `projection.resolution` | string | 4K, 2K, 8K, 70mm Film, HD |
| `sound_system.format` | string | Dolby Atmos, Dolby Digital, etc. |
| `chain` | string | Theater chain name (required with `theater_name`) |
| `theater_name` | string | Specific theater name (required with `chain`) |

### Validation Rules

### Sources Array

Every screen must include a `sources` array with at least one entry describing data provenance:

```json
"sources": [
  {
    "url": "https://www.pvrcinemas.com/...",
    "publisher": "PVR Cinemas",
    "published_date": "2024-06",
    "confidence": "verified",
    "notes": "Official listing from PVR website"
  }
]
```

| Field | Required | Description |
|---|---|---|
| `url` | recommended | Source URL |
| `publisher` | recommended | Publishing organization or person |
| `published_date` | optional | When the source was published |
| `confidence` | required | `verified`, `verified (article)`, or `estimated` |
| `notes` | recommended | Free-text notes about data provenance |
| `last_verified` | required | Date of last verification (e.g., `2024-06` or `2024-06-15`) |

- Non-LED screens must have `projection.brightness_lumens`
- LED screens must have `projection.brightness_nits` instead
- `chain` and `theater_name` must be provided together (or both omitted)
- Colors must be valid 6-digit hex codes
- All dimensions must be positive numbers

## Data Sources

Please verify your data against at least one of:
- The theater's official website
- BookMyShow / PayTM listings
- Direct inquiry with the theater

Add a `"note"` field citing your source if it is not publicly obvious.

## Code Contributions

- Match the existing code style (vanilla JS, ES modules, no framework)
- Follow the existing component patterns
- Run `npm test` before committing

## Questions?

Open an issue or start a discussion — we are happy to help!
