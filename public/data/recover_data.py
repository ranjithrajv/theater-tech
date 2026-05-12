import sqlite3
import json
from pathlib import Path

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def recover_data():
    db_path = 'data/theater_tech.db'
    if not Path(db_path).exists():
        print(f"Error: {db_path} not found")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = dict_factory
    cursor = conn.cursor()

    # 1. Recover Screens
    cursor.execute("SELECT * FROM screens")
    screens_raw = cursor.fetchall()
    
    screens = []
    for s in screens_raw:
        screen_id = s.pop('id')
        
        # Reconstruct nested objects
        projection = {
            'type': s.pop('projection_type'),
            'resolution': s.pop('projection_resolution'),
            'brand': s.pop('projection_brand'),
            'model': s.pop('projection_model'),
            'aspect_ratio': s.pop('projection_aspect_ratio'),
        }
        
        unit = s.pop('projection_brightness_unit')
        val = s.pop('projection_brightness')
        if unit == 'lumens':
            projection['brightness_lumens'] = val
        elif unit == 'nits':
            projection['brightness_nits'] = val
            
        sound = {
            'format': s.pop('sound_format'),
            'channels': s.pop('sound_channels'),
            'brand': s.pop('sound_brand')
        }
        # Convert channels back to number or keep as string if it was '11.1'
        try:
            if sound['channels'] and '.' not in sound['channels']:
                sound['channels'] = int(sound['channels'])
        except:
            pass
            
        surface = {
            'material': s.pop('screen_surface_material'),
            'gain': s.pop('screen_surface_gain')
        }
        
        # Get content support
        cursor.execute("SELECT feature, value FROM content_support WHERE screen_id = ?", (screen_id,))
        support = {row['feature']: bool(row['value']) for row in cursor.fetchall()}
        
        screen = {
            **s,
            'projection': projection,
            'sound_system': sound,
            'screen_surface': surface,
            'content_support': support
        }
        screens.append(screen)

    with open('data/screens.json', 'w') as f:
        json.dump(screens, f, indent=2)
    print("✅ Recovered data/screens.json")

    # 2. Recover Constants
    cursor.execute("SELECT * FROM constants")
    constants_raw = cursor.fetchall()
    constants = {}
    for c in constants_raw:
        cat = c['category']
        key = c['data_key']
        val = c['data_value']
        
        if cat not in constants:
            constants[cat] = {}
        
        # Handle nested keys like 'dimensions.mobileHeight'
        parts = key.split('.')
        curr = constants[cat]
        for i, part in enumerate(parts):
            if i == len(parts) - 1:
                # Try to convert to number if possible
                try:
                    if '.' in val:
                        curr[part] = float(val)
                    else:
                        curr[part] = int(val)
                except:
                    # Handle boolean strings
                    if val.lower() == 'true': curr[part] = True
                    elif val.lower() == 'false': curr[part] = False
                    else: curr[part] = val
            else:
                if part not in curr:
                    curr[part] = {}
                curr = curr[part]
                
    with open('data/constants.json', 'w') as f:
        json.dump(constants, f, indent=2)
    print("✅ Recovered data/constants.json")

    # 3. Recover Icons
    cursor.execute("SELECT * FROM icons")
    icons_raw = cursor.fetchall()
    icons_data = {"icons": {}, "techDescriptions": {}}
    
    for i in icons_raw:
        cat = i['category']
        key = i['icon_key']
        val = i['icon_value']
        if cat not in icons_data["icons"]:
            icons_data["icons"][cat] = {}
        icons_data["icons"][cat][key] = val
        
    cursor.execute("SELECT * FROM tech_descriptions")
    tech_raw = cursor.fetchall()
    for t in tech_raw:
        cat = t['category']
        key = t['tech_key']
        val = t['tech_value']
        if cat not in icons_data["techDescriptions"]:
            icons_data["techDescriptions"][cat] = {}
        icons_data["techDescriptions"][cat][key] = val
        
    with open('data/icons.json', 'w') as f:
        json.dump(icons_data, f, indent=2)
    print("✅ Recovered data/icons.json")

    # 4. Recover Tooltips
    cursor.execute("SELECT * FROM tooltips")
    tooltips_raw = cursor.fetchall()
    tooltips = {"glossaryTerms": [], "explanations": {}}
    for t in tooltips_raw:
        if t['category'] == 'glossary':
            tooltips["glossaryTerms"].append(t['term'])
        else:
            tooltips["explanations"][t['term']] = t['explanation']
            
    with open('data/tooltips.json', 'w') as f:
        json.dump(tooltips, f, indent=2)
    print("✅ Recovered data/tooltips.json")

    conn.close()

if __name__ == "__main__":
    recover_data()
