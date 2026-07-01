# Data Sources & Credibility

This project compares cinema screen technologies across Indian cities. Every screen entry includes a `sources` array stored in both JSON (`screens.json`) and a dedicated `screen_sources` table in the SQLite database.

## Schema

Each source entry has these fields stored in the `screen_sources` table:

| Field | Type | Description |
|---|---|---|
| `url` | TEXT | Source URL (if available) |
| `publisher` | TEXT | Publishing organization / person |
| `published_date` | TEXT | Date of publication |
| `confidence` | TEXT | One of: `verified`, `verified (article)`, `estimated` |
| `notes` | TEXT | Free-text notes about data provenance |

## Credibility Scale

| Level | Meaning |
|---|---|
| **verified** | Specs confirmed from official source or direct inquiry |
| **verified (article)** | Specs reported in a news article or press release |
| **estimated** | Specs derived from PLF standards, chain averages, or known capacity |

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
SELECT s.name, ss.url, ss.publisher, ss.confidence
FROM screens s
LEFT JOIN screen_sources ss ON s.id = ss.screen_id;
```

## How to Contribute Verified Data

1. Find an authoritative source (theater website, BookMyShow listing, press release, or direct measurement)
2. Open a PR adding a new entry to the screen's `sources` array
3. Include the URL, publisher, date, confidence level, and any notes

See `CONTRIBUTING.md` for the full data format.
