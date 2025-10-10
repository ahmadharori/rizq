"""Verify database schema and PostGIS installation."""
from app.database import engine
from sqlalchemy import text, inspect

print("=== Database Schema Verification ===\n")

# Check all tables
inspector = inspect(engine)
tables = sorted(inspector.get_table_names())
print(f"✅ Total tables created: {len(tables)}")
for table in tables:
    print(f"   - {table}")

# Check PostGIS version
print("\n=== PostGIS Installation ===\n")
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT PostGIS_Version()"))
        version = result.fetchone()[0]
        print(f"✅ PostGIS Version: {version}")
        
        # Check if recipients table has location column
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'recipients' 
            AND column_name = 'location'
        """))
        location_col = result.fetchone()
        if location_col:
            print(f"✅ Recipients table has 'location' column (type: {location_col[1]})")
        
        # Check spatial index
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'recipients' 
            AND indexname LIKE '%location%'
        """))
        spatial_index = result.fetchone()
        if spatial_index:
            print(f"✅ Spatial index created: {spatial_index[0]}")
            
except Exception as e:
    print(f"❌ Error: {e}")

print("\n=== Verification Complete ===")
