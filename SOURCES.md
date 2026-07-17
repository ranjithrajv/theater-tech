# Data Sources & Credibility

This project compares cinema screen technologies across Indian cities. Every screen entry includes a `sources` array stored in both JSON (`all_cities_screens.json`) and a dedicated `screen_sources` table in the SQLite database.

## Schema

Each source entry has these fields stored in the `screen_sources` table:

| Field | Type | Description |
|---|---|---|
| `url` | TEXT | Source URL (if available) |
| `publisher` | TEXT | Publishing organization / person |
| `published_date` | TEXT | Date of publication |
| `confidence` | TEXT | One of: `verified`, `verified (article)`, `estimated` |
| `tier` | TEXT | Credibility tier: `primary`, `secondary`, or `listing` |
| `notes` | TEXT | Free-text notes about data provenance |
| `last_verified` | TEXT | Date of last verification (e.g., `2024-06`). Screens with `last_verified` older than 6 months are visually flagged as stale in the chart. |

## Credibility Scale

| Level | Meaning |
|---|---|
| **verified** | Specs confirmed from official source or direct inquiry |
| **verified (article)** | Specs reported in a news article or press release |
| **estimated** | Specs derived from PLF standards, chain averages, or known capacity |

## Source Tiers

Each source is classified into a tier based on the publisher and URL:

| Tier | Label | Color | Meaning |
|---|---|---|---|
| `primary` | Primary | Green | Official theater chain sites (PVR, INOX, Cinepolis), press releases, official filings |
| `secondary` | News | Blue | Independent news outlets (Times of India, The Hindu, etc.), review sites, Wikipedia |
| `listing` | Listing | Gray | Booking platforms (BookMyShow), directories (JustDial, Google Maps), social media |

Tier classification is automatic based on URL pattern matching. The classification logic is in `src/js/sources.js` (runtime) and `data/json_to_sqlite.py` (build time).

**Why tiers matter:** A screen with only `listing` tier sources needs independent verification. Screens with at least one `primary` source have the strongest credibility.

## Hyderabad (21 screens)

**Data hand-researched by the project author.** Source confidence is documented per-screen in the `sources` array.

## Bangalore (14 screens)

**All data is estimated.** No publicly available verified sources for exact screen dimensions, projection brightness, or seating counts could be found online for individual Bangalore screens.

Estimates are based on:
- Published PLF format standards (e.g., PXL ≈ 80×40ft, IMAX with Laser ≈ 70×38ft)
- Known seating capacity from BookMyShow listings
- Cross-referencing with similar screens in Hyderabad
- General knowledge of theater layouts

### Screens Needing Verification

Every Bangalore screen needs confirmation from an authoritative source:

| Screen | Best Guess | Needs |
|---|---|---|
| PVR Forum (Koramangala) | 82×42ft, 520 seats | Official specs from PVR |
| Urvashi Theatre (Majestic) | 72×35ft, 950 seats | Heritage theater records |
| PVR VR Bengaluru (Whitefield) | 70×38ft, 350 seats, IMAX Laser | IMAX/BKS listing |
| PVR Orion Mall (Rajajinagar) | 62×33ft, 400 seats Superplex | PVR official dimensions |
| Galaxy Cinemas (Parappana Agrahara) | 60×32ft, 380 seats | Theater inquiry |
| INOX Central (Jayanagar) | 58×30ft, 350 seats Superplex | INOX listing |
| PVR Phoenix (Whitefield) | 56×30ft, 310 seats EPIQ | PVR official |
| V Cinemas (Yeshwanthpur) | 55×29ft, 290 seats | Theater inquiry |
| Cinepolis Vega (Whitefield) | 54×28ft, 280 seats LUX | Cinepolis listing |
| Gopalan Cinemas (Mysore Road) | 52×27ft, 260 seats | Theater inquiry |
| INOX Shantiniketan (Whitefield) | 52×28ft, 270 seats | INOX listing |
| Mantri Square (Malleshwaram) | 50×26ft, 220 seats | Theater listing |
| Cinepolis Fun Republic (Yelahanka) | 50×27ft, 250 seats | Cinepolis listing |
| INOX Garuda (Indiranagar) | 48×25ft, 210 seats | INOX listing |

## Querying in the App

Sources are loaded from the `screen_sources` table and joined to screens by `screen_id`. To query:

```sql
SELECT s.name, ss.url, ss.publisher, ss.confidence, ss.tier
FROM screens s
LEFT JOIN screen_sources ss ON s.id = ss.screen_id;
```

## PLF Format Standards

PLF (Premium Large Format) standards are stored in `constants.json` under `plfStandards` and loaded into the `constants` DB table. These provide typical dimensions and specs for each format, used as reference when estimating screen data.

| Format | Typical Size | Sound | Seats |
|---|---|---|---|
| PCX | 90-105 × 55-65 ft | Dolby Atmos 11.1 | 600-650 |
| PXL | 75-85 × 38-45 ft | Dolby Atmos 11.1 | 450-550 |
| IMAX | 65-75 × 35-40 ft | IMAX 12ch | 300-400 |
| Superplex | 55-65 × 28-34 ft | Dolby Atmos 7.1 | 300-400 |
| EPIQ | 50-60 × 26-32 ft | Dolby Atmos 7.1 | 280-350 |
| LUX | 48-58 × 24-30 ft | Dolby Atmos 7.1 | 250-350 |
| 70mm | 65-80 × 30-40 ft | Dolby Digital 5.1 | 800-1200 |
| Standard | 40-55 × 20-28 ft | Dolby Digital 5.1/7.1 | 200-300 |

## Verifying Data

Screens with `last_verified` older than **6 months** are shown with:
- Dashed red border in the chart
- Reduced opacity (0.45 vs 0.7)
- ⚠ Stale badge in the sidebar details panel

1. Find an authoritative source (theater website, BookMyShow listing, press release, or direct measurement)
2. Open a PR adding a new entry to the screen's `sources` array
3. Include the URL, publisher, date, confidence level, and any notes
4. The `tier` field will be auto-classified from the URL if not provided

See `CONTRIBUTING.md` for the full data format.
