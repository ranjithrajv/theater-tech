import sqlite3
import psycopg2
import os
from pathlib import Path


def get_sqlite_connection(db_path):
    """Create SQLite database connection"""
    conn = sqlite3.connect(db_path)
    return conn


def get_postgres_connection():
    """Create PostgreSQL database connection"""
    conn = psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432"),
        database=os.environ.get("DB_NAME", "theater_tech"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", ""),
    )
    return conn


def create_postgres_tables(pg_conn):
    """Create PostgreSQL tables with the same schema as in json_to_postgres.py"""
    cursor = pg_conn.cursor()

    # Drop tables if they exist (to start fresh)
    drop_queries = [
        "DROP TABLE IF EXISTS tooltips CASCADE;",
        "DROP TABLE IF EXISTS content_support CASCADE;",
        "DROP TABLE IF EXISTS screens CASCADE;",
        "DROP TABLE IF EXISTS tech_descriptions CASCADE;",
        "DROP TABLE IF EXISTS icons CASCADE;",
        "DROP TABLE IF EXISTS constants CASCADE;",
        "DROP TABLE IF EXISTS glossary CASCADE;",
        "DROP TABLE IF EXISTS plf_formats CASCADE;",
        "DROP TABLE IF EXISTS config CASCADE;",
    ]

    for query in drop_queries:
        cursor.execute(query)

    # Create tables
    create_queries = [
        """
        CREATE TABLE config (
            id SERIAL PRIMARY KEY,
            title TEXT,
            description TEXT,
            data_current_as_of TEXT
        )
        """,
        """
        CREATE TABLE plf_formats (
            id SERIAL PRIMARY KEY,
            format TEXT,
            name TEXT,
            description TEXT,
            color TEXT,
            best_for TEXT,
            ideal_experience TEXT,
            config_id INTEGER,
            FOREIGN KEY (config_id) REFERENCES config (id)
        )
        """,
        """
        CREATE TABLE glossary (
            id SERIAL PRIMARY KEY,
            term TEXT,
            definition TEXT
        )
        """,
        """
        CREATE TABLE constants (
            id SERIAL PRIMARY KEY,
            category TEXT,
            data_key TEXT,
            data_value TEXT
        )
        """,
        """
        CREATE TABLE icons (
            id SERIAL PRIMARY KEY,
            category TEXT,
            subcategory TEXT,
            icon_key TEXT,
            icon_value TEXT
        )
        """,
        """
        CREATE TABLE tech_descriptions (
            id SERIAL PRIMARY KEY,
            category TEXT,
            tech_key TEXT,
            tech_value TEXT
        )
        """,
        """
        CREATE TABLE screens (
            id SERIAL PRIMARY KEY,
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
        """,
        """
        CREATE TABLE content_support (
            id SERIAL PRIMARY KEY,
            screen_id INTEGER,
            feature TEXT,
            value BOOLEAN,
            FOREIGN KEY (screen_id) REFERENCES screens (id)
        )
        """,
        """
        CREATE TABLE tooltips (
            id SERIAL PRIMARY KEY,
            category TEXT,
            term TEXT,
            explanation TEXT
        )
        """,
    ]

    for query in create_queries:
        cursor.execute(query)

    pg_conn.commit()
    cursor.close()


def copy_table_data(sqlite_conn, pg_conn, table_name, column_names=None):
    """Copy data from SQLite table to PostgreSQL table"""
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # If column names not provided, get them from SQLite
    if column_names is None:
        sqlite_cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
        column_names = [description[0] for description in sqlite_cursor.description]

    # Get all data from SQLite
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()

    if not rows:
        print(f"No data found in {table_name}")
        sqlite_cursor.close()
        pg_cursor.close()
        return

    # Prepare placeholders for INSERT
    placeholders = ", ".join(["%s"] * len(column_names))
    column_list = ", ".join(column_names)

    # Delete existing data in PostgreSQL table (if any)
    pg_cursor.execute(f"DELETE FROM {table_name}")

    # Insert data into PostgreSQL
    for row in rows:
        # Convert None to NULL (Python None is already handled by psycopg2 as NULL)
        pg_cursor.execute(
            f"INSERT INTO {table_name} ({column_list}) VALUES ({placeholders})", row
        )

    pg_conn.commit()
    print(f"Copied {len(rows)} rows from SQLite to PostgreSQL table {table_name}")

    sqlite_cursor.close()
    pg_cursor.close()


def reset_sequences(pg_conn):
    """Reset PostgreSQL sequences to match the maximum id in each table"""
    pg_cursor = pg_conn.cursor()

    # Get all tables
    pg_cursor.execute("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    """)
    tables = [row[0] for row in pg_cursor.fetchall()]

    for table in tables:
        # Check if the table has an id column that is a serial
        pg_cursor.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}' 
            AND column_name = 'id'
            AND data_type = 'integer'
        """)
        if pg_cursor.fetchone():
            # Reset the sequence for this table's id column
            pg_cursor.execute(f"""
                SELECT setval(pg_get_serial_sequence('{table}', 'id'), 
                             COALESCE((SELECT MAX(id) FROM {table}), 1), 
                             (SELECT COUNT(*) FROM {table}) > 0)
            """)

    pg_conn.commit()
    pg_cursor.close()


def main():
    # Define paths
    data_dir = Path(".")
    sqlite_db_path = data_dir / "theater_tech.db"

    # Check if SQLite database exists
    if not sqlite_db_path.exists():
        print(f"SQLite database not found at {sqlite_db_path}")
        return

    # Load environment variables for PostgreSQL (if .env file exists)
    env_file = data_dir / ".env"
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key] = value

    # Connect to databases
    print("Connecting to SQLite database...")
    sqlite_conn = get_sqlite_connection(sqlite_db_path)

    print("Connecting to PostgreSQL database...")
    try:
        pg_conn = get_postgres_connection()
        # Test the connection
        pg_cursor = pg_conn.cursor()
        pg_cursor.execute("SELECT 1")
        pg_cursor.fetchone()
        pg_cursor.close()
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        print("Please ensure PostgreSQL is running and the database/user exists.")
        sqlite_conn.close()
        return

    try:
        # Create PostgreSQL tables
        print("Creating PostgreSQL tables...")
        create_postgres_tables(pg_conn)

        # Define the order of tables to copy (respecting foreign keys)
        # Tables without foreign keys first
        tables_order = [
            "config",
            "glossary",
            "constants",
            "icons",
            "tech_descriptions",
            "screens",  # screens has no foreign keys in our schema
            "plf_formats",  # depends on config
            "content_support",  # depends on screens
            "tooltips",  # no foreign keys
        ]

        # Copy data for each table
        for table in tables_order:
            print(f"Copying data for table: {table}")
            copy_table_data(sqlite_conn, pg_conn, table)

        # Reset sequences to avoid conflicts on future inserts
        print("Resetting PostgreSQL sequences...")
        reset_sequences(pg_conn)

        print("Migration completed successfully!")

    except Exception as e:
        print(f"An error occurred during migration: {e}")
        pg_conn.rollback()
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
