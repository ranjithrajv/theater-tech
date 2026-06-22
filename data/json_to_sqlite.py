import json
import sqlite3
from pathlib import Path

def create_database(db_path):
    """Create SQLite database with tables for all JSON data"""
    db_path = Path(db_path)
    if db_path.exists():
        db_path.unlink()  # Start fresh each run; CREATE TABLE IF NOT EXISTS would
                           # otherwise leave stale rows from previous runs in place.
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            data_current_as_of TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS plf_formats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            format TEXT,
            name TEXT,
            description TEXT,
            color TEXT,
            best_for TEXT,
            ideal_experience TEXT,
            config_id INTEGER,
            FOREIGN KEY (config_id) REFERENCES config (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS glossary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            term TEXT,
            definition TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS constants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            data_key TEXT,
            data_value TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS icons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            subcategory TEXT,
            icon_key TEXT,
            icon_value TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tech_descriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            tech_key TEXT,
            tech_value TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS screens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            location TEXT,
            width REAL,
            height REAL,
            color TEXT,
            plf_format TEXT,
            screen_number INTEGER,
            projection_type TEXT,
            projection_resolution TEXT,
            projection_brand TEXT,
            projection_model TEXT,
            projection_aspect_ratio TEXT,
            projection_brightness REAL,
            projection_brightness_unit TEXT,
            sound_format TEXT,
            sound_channels TEXT,
            sound_brand TEXT,
            screen_surface_material TEXT,
            screen_surface_gain REAL,
            seating_capacity INTEGER,
            note TEXT,
            chain TEXT,
            theater_name TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS content_support (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            screen_id INTEGER,
            feature TEXT,
            value BOOLEAN,
            FOREIGN KEY (screen_id) REFERENCES screens (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tooltips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            term TEXT,
            explanation TEXT
        )
    ''')
    
    conn.commit()
    return conn

def insert_config_data(conn, config_data):
    """Insert configuration data into the database"""
    cursor = conn.cursor()
    
    # Insert main config data
    cursor.execute('''
        INSERT INTO config (title, description, data_current_as_of)
        VALUES (?, ?, ?)
    ''', (
        config_data.get('title'),
        config_data.get('description'),
        config_data.get('data_current_as_of')
    ))
    
    config_id = cursor.lastrowid
    
    # Insert PLF formats
    for fmt in config_data.get('legend', {}).get('plf_formats', []):
        best_for_str = ', '.join(fmt.get('best_for', [])) if fmt.get('best_for') else None
        cursor.execute('''
            INSERT INTO plf_formats (format, name, description, color, best_for, ideal_experience, config_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            fmt.get('format'),
            fmt.get('name'),
            fmt.get('description'),
            fmt.get('color'),
            best_for_str,
            fmt.get('ideal_experience'),
            config_id
        ))
    
    # Insert glossary terms
    for term in config_data.get('glossary', []):
        cursor.execute('''
            INSERT INTO glossary (term, definition)
            VALUES (?, ?)
        ''', (
            term.get('term'),
            term.get('definition')
        ))
    
    conn.commit()

def insert_constants_data(conn, constants_data):
    """Insert constants data into the database"""
    cursor = conn.cursor()
    
    def flatten_dict(d, parent_key='', sep='.'):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, str(v)))
        return dict(items)
    
    flattened = flatten_dict(constants_data)
    for key, value in flattened.items():
        # Split the key to get category and subkey
        parts = key.split('.')
        category = parts[0] if parts else 'unknown'
        data_key = '.'.join(parts[1:]) if len(parts) > 1 else key
        
        cursor.execute('''
            INSERT INTO constants (category, data_key, data_value)
            VALUES (?, ?, ?)
        ''', (category, data_key, value))
    
    conn.commit()

def insert_icons_data(conn, icons_data):
    """Insert icons data into the database"""
    cursor = conn.cursor()
    
    # Insert icons
    for category, category_data in icons_data.get('icons', {}).items():
        if isinstance(category_data, dict):
            for icon_key, icon_value in category_data.items():
                cursor.execute('''
                    INSERT INTO icons (category, subcategory, icon_key, icon_value)
                    VALUES (?, ?, ?, ?)
                ''', (category, icon_key, icon_key, icon_value))
    
    # Insert tech descriptions
    for category, descriptions in icons_data.get('techDescriptions', {}).items():
        for tech_key, tech_value in descriptions.items():
            cursor.execute('''
                INSERT INTO tech_descriptions (category, tech_key, tech_value)
                VALUES (?, ?, ?)
            ''', (category, tech_key, tech_value))
    
    conn.commit()

def insert_screens_data(conn, screens_data):
    """Insert screens data into the database"""
    cursor = conn.cursor()
    
    for screen in screens_data:
        # Extract projection data
        projection = screen.get('projection', {})
        brightness_val = projection.get('brightness_lumens') or projection.get('brightness_nits')
        brightness_unit = 'lumens' if 'brightness_lumens' in projection else ('nits' if 'brightness_nits' in projection else None)
        
        # Extract sound system data
        sound_system = screen.get('sound_system', {})
        
        # Extract screen surface data
        screen_surface = screen.get('screen_surface', {})
        
        cursor.execute('''
            INSERT INTO screens (
                name, location, width, height, color, plf_format, screen_number,
                projection_type, projection_resolution, projection_brand, projection_model,
                projection_aspect_ratio, projection_brightness, projection_brightness_unit,
                sound_format, sound_channels, sound_brand,
                screen_surface_material, screen_surface_gain,
                seating_capacity, note, chain, theater_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            screen.get('name'),
            screen.get('location'),
            screen.get('width'),
            screen.get('height'),
            screen.get('color'),
            screen.get('plf_format'),
            screen.get('screen_number'),
            projection.get('type'),
            projection.get('resolution'),
            projection.get('brand'),
            projection.get('model'),
            projection.get('aspect_ratio'),
            brightness_val,
            brightness_unit,
            sound_system.get('format'),
            str(sound_system.get('channels')) if sound_system.get('channels') is not None else None,
            sound_system.get('brand'),
            screen_surface.get('material'),
            screen_surface.get('gain'),
            screen.get('seating_capacity'),
            screen.get('note'),
            screen.get('chain'),
            screen.get('theater_name')
        ))
        
        screen_id = cursor.lastrowid
        
        # Insert content support features
        content_support = screen.get('content_support', {})
        for feature, value in content_support.items():
            cursor.execute('''
                INSERT INTO content_support (screen_id, feature, value)
                VALUES (?, ?, ?)
            ''', (screen_id, feature, value))
    
    conn.commit()

def insert_tooltips_data(conn, tooltips_data):
    """Insert tooltips data into the database"""
    cursor = conn.cursor()
    
    # Insert glossary terms
    for term in tooltips_data.get('glossaryTerms', []):
        cursor.execute('''
            INSERT INTO tooltips (category, term, explanation)
            VALUES (?, ?, ?)
        ''', ('glossary', term, ''))
    
    # Insert explanations
    for key, explanation in tooltips_data.get('explanations', {}).items():
        cursor.execute('''
            INSERT INTO tooltips (category, term, explanation)
            VALUES (?, ?, ?)
        ''', ('explanation', key, explanation))
    
    conn.commit()

def main():
    # Define paths
    data_dir = Path(__file__).parent.parent / 'public' / 'data'
    db_path = data_dir / 'theater_tech.db'
    
    # Load JSON files
    # NOTE: The original project had config.json, constants.json, icons.json, screens.json, tooltips.json
    # We are loading these to populate the DB.
    
    with open(data_dir / 'config.json', 'r') as f:
        config_data = json.load(f)
    
    with open(data_dir / 'constants.json', 'r') as f:
        constants_data = json.load(f)
    
    with open(data_dir / 'icons.json', 'r') as f:
        icons_data = json.load(f)
    
    # screens.json is legacy, all_cities_screens.json is primary
    # If all_cities_screens.json exists, use it. Otherwise, fall back to screens.json.
    screens_file_path = data_dir / 'all_cities_screens.json'
    if not screens_file_path.exists():
        screens_file_path = data_dir / 'screens.json'
        
    if screens_file_path.exists():
        with open(screens_file_path, 'r') as f:
            screens_data = json.load(f)
    else:
        screens_data = [] # Provide empty list if neither file exists
        print("Warning: Neither 'all_cities_screens.json' nor 'screens.json' found. Screens data will be empty.")
    
    with open(data_dir / 'tooltips.json', 'r') as f:
        tooltips_data = json.load(f)
    
    # Create database and tables
    conn = create_database(db_path)
    
    # Insert data
    insert_config_data(conn, config_data)
    insert_constants_data(conn, constants_data)
    insert_icons_data(conn, icons_data)
    insert_screens_data(conn, screens_data)
    insert_tooltips_data(conn, tooltips_data)
    
    # Close connection
    conn.close()
    
    print(f"Database created successfully at {db_path}")
    print("Tables created:")
    print("- config")
    print("- plf_formats")
    print("- glossary")
    print("- constants")
    print("- icons")
    print("- tech_descriptions")
    print("- screens")
    print("- content_support")
    print("- tooltips")

if __name__ == "__main__":
    main()