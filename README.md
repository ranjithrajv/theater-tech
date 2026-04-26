# India Cinema Technology Comparison

A comprehensive data visualization tool that compares cinema technology including screen sizes, projectors, sound systems, and technical specifications across major theaters in **8 metro cities in India**.

## 🌆 Supported Cities

- **Hyderabad** (Telangana) - 9 screens including Prasads PCX (India's largest)
- **Mumbai** (Maharashtra) - 4 screens including PVR IMAX BKC
- **Delhi NCR** (Delhi) - 4 screens including PVR Vegas Dwarka
- **Bangalore** (Karnataka) - 4 screens including PVR Nexus Koramangala
- **Chennai** (Tamil Nadu) - 4 screens including Palazzo IMAX
- **Kolkata** (West Bengal) - 2 screens including INOX South City
- **Pune** (Maharashtra) - 2 screens including PVR IMAX PMC
- **Ahmedabad** (Gujarat) - 2 screens including Gujarat Science City IMAX

## ✨ Features

*   **City Selector:** Choose from 8 major Indian metro cities to view local cinema data
*   **Visual Comparison:** Uses D3.js to render to-scale charts comparing cinema screens
*   **Detailed Information:** Hover over any screen to see technical specs like projection type, sound system, screen surface, and more
*   **Interactive Legend:** Filter screens by Premium Large Format (PLF) to highlight them on the chart
*   **Progressive Disclosure:** The legend provides both basic and advanced technical details
*   **Glossary:** Interactive glossary explains technical terms like "Dolby Atmos" and "4K Resolution"
*   **Responsive Design:** Layout adapts to mobile, tablet, and desktop screens
*   **LocalStorage Persistence:** Your city selection is saved and restored on your next visit

## 🚀 How to Use

1. Clone this repository
2. Open the `app/index.html` file in your web browser
3. Select your city from the dropdown menu
4. Explore the visual comparison of cinema screens
5. Hover over screens to see detailed technical specifications

No special build steps or servers are required. All the magic happens directly in your browser!

## 📊 Data Sources

The cinema technology data is stored in two locations:

1. **Primary JSON Source**: `data/all_cities_screens.json` - Contains comprehensive data for 8 metro cities in India
2. **Legacy JSON Source**: `data/screens.json` - Contains Hyderabad-only data (maintained for backward compatibility)

Both datasets contain:
- Screen dimensions (width, height in feet)
- Projection systems (type, resolution, brand, brightness)
- Sound systems (format, channels)
- Screen surfaces (material, gain)
- Content support (3D, HDR, HFR capabilities)
- Seating capacity and location details

### Data Storage Options

The project supports multiple data storage backends:

1. **SQLite** (default): Located at `data/theater_tech.db`
2. **PostgreSQL**: Requires separate setup (see instructions below)

#### SQLite Migration
The SQLite database is automatically created/updated by running:
```bash
cd data && python3 json_to_sqlite.py
```

#### PostgreSQL Setup Instructions

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS (using Homebrew)
   brew install postgresql
   
   # Start the service
   sudo service postgresql start  # Linux
   brew services start postgresql  # macOS
   ```

2. **Create a database and user**:
   ```bash
   sudo -u postgres psql
   ```
   Then in the PostgreSQL prompt:
   ```sql
   CREATE DATABASE theater_tech;
   CREATE USER theater_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE theater_tech TO theater_user;
   \q
   ```

3. **Configure environment variables**:
   Copy the example environment file and update with your credentials:
   ```bash
   cp data/.env.example data/.env
   # Edit data/.env with your actual database credentials
   ```

4. **Run the PostgreSQL migration**:
   ```bash
   cd data && python3 json_to_postgres.py
   ```

### Adding New Cities or Screens

To add or update cinema information:

1. Edit the `data/all_cities_screens.json` file (primary source)
2. Follow the existing JSON structure with city objects containing:
    - `id`: Unique city identifier
    - `name`: Display name
    - `state`: State name
    - `screens`: Array of screen objects with complete technical specifications
3. Use the JavaScript validator at `tests/validate_screens.html` to validate the structure
4. **After updating JSON data, re-run the migration script** to update your database:
   - For SQLite: `cd data && python3 json_to_sqlite.py`
   - For PostgreSQL: `cd data && python3 json_to_postgres.py`

## 🏆 Notable Screens

- **Prasads PCX** (Hyderabad) - India's largest commercial cinema screen at 101.6 × 64 feet
- **Gujarat Science City IMAX** (Ahmedabad) - India's largest IMAX screen at 95.1 × 66.8 feet (documentaries only)
- **PVR IMAX Jio World Plaza** (Mumbai) - Premium IMAX with Laser experience
- **PVR IMAX Priya** (Delhi) - India's first standalone IMAX property
- **Palazzo IMAX** (Chennai) - Chennai's premier IMAX experience

## 💻 Technologies Used

*   **HTML5** - Semantic markup and structure
*   **CSS3** - Responsive styling and animations
*   **JavaScript (ES6+)** - Application logic and interactivity
*   **D3.js (v7)** - Data visualization and interactive charts
*   **JSON Schema** - Data validation and structure enforcement

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🔧 Development

### Project Structure

```
theater-tech/
├── app/
│   ├── index.html          # Main application entry point
│   ├── style.css           # Application styles
│   └── js/                 # JavaScript modules
│       ├── index.js        # Application bootstrap
│       ├── core.js         # Core application logic
│       ├── visualization.js # D3.js visualization
│       └── ...
├── data/
│   ├── all_cities_screens.json  # Main cinema data (8 cities)
│   └── screens.json        # Legacy Hyderabad-only data
├── docs/
│   ├── market_study_competitive_analysis.md
│   └── MULTI_CITY_IMPLEMENTATION.md
├── lib/
│   └── d3.v7.min.js        # D3.js library
└── tests/
    └── validate_screens.html  # Data validation tool
```

### Adding a New City

1. Add city object to `data/all_cities_screens.json`:

```json
{
  "id": "cityname",
  "name": "City Name",
  "state": "State",
  "screens": [
    {
      "name": "Theater Name",
      "location": "Area",
      "width": 70,
      "height": 40,
      "color": "#FF0000",
      "plf_format": "IMAX",
      "screen_number": 1,
      "projection": { ... },
      "sound_system": { ... },
      ...
    }
  ]
}
```

2. The city will automatically appear in the dropdown
3. Validate using `tests/validate_screens.html`

## 🤝 Contributing

Contributions are welcome! You can help by:

- Adding new cities or theaters
- Updating existing screen specifications
- Adding photos of actual screens
- Improving the visualization
- Reporting bugs or suggesting features

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- Data compiled from IMAX official listings, PVR INOX announcements, and cinema enthusiast communities
- D3.js community for excellent visualization library
- Reddit r/imax community for technical insights and data verification

---

**Made with 🎬 for movie lovers across India**
