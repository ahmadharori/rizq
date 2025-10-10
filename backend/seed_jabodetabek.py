"""
Seed script for Jabodetabek regional data (Provinces and Cities)
Jabodetabek = Jakarta, Bogor, Depok, Tangerang, Bekasi metropolitan area
"""
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import get_db, engine
from app.models.region import Province, City
from sqlalchemy.orm import Session


def seed_jabodetabek_data():
    """Seed Jabodetabek provinces and cities data."""
    
    # Get database session
    db = next(get_db())
    
    try:
        print("🌱 Starting Jabodetabek regional data seeding...")
        
        # Check if data already exists
        existing_provinces = db.query(Province).count()
        if existing_provinces > 0:
            print(f"⚠️  Found {existing_provinces} existing provinces.")
            response = input("Do you want to clear existing data and reseed? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Seeding cancelled.")
                return
            
            # Clear existing data
            print("🗑️  Clearing existing data...")
            db.query(City).delete()
            db.query(Province).delete()
            db.commit()
            print("✅ Existing data cleared.")
        
        # Province data
        provinces_data = [
            {"id": 31, "name": "DKI Jakarta"},
            {"id": 32, "name": "Jawa Barat"},
            {"id": 36, "name": "Banten"},
        ]
        
        # Cities data (grouped by province)
        cities_data = [
            # DKI Jakarta (31) - 6 administrative areas
            {"province_id": 31, "name": "Jakarta Pusat"},
            {"province_id": 31, "name": "Jakarta Utara"},
            {"province_id": 31, "name": "Jakarta Barat"},
            {"province_id": 31, "name": "Jakarta Selatan"},
            {"province_id": 31, "name": "Jakarta Timur"},
            {"province_id": 31, "name": "Kepulauan Seribu"},
            
            # Jawa Barat (32) - Jabodetabek cities only
            {"province_id": 32, "name": "Kota Bogor"},
            {"province_id": 32, "name": "Kota Depok"},
            {"province_id": 32, "name": "Kota Bekasi"},
            {"province_id": 32, "name": "Kabupaten Bogor"},
            {"province_id": 32, "name": "Kabupaten Bekasi"},
            
            # Banten (36) - Jabodetabek cities only
            {"province_id": 36, "name": "Kota Tangerang"},
            {"province_id": 36, "name": "Kota Tangerang Selatan"},
            {"province_id": 36, "name": "Kabupaten Tangerang"},
        ]
        
        # Insert provinces
        print("\n📍 Seeding provinces...")
        provinces = []
        for prov_data in provinces_data:
            province = Province(**prov_data)
            db.add(province)
            provinces.append(province)
            print(f"  ✓ Added: {prov_data['name']} (ID: {prov_data['id']})")
        
        db.commit()
        print(f"✅ {len(provinces)} provinces seeded successfully!")
        
        # Insert cities
        print("\n🏙️  Seeding cities...")
        cities = []
        for city_data in cities_data:
            city = City(**city_data)
            db.add(city)
            cities.append(city)
            province_name = next(p['name'] for p in provinces_data if p['id'] == city_data['province_id'])
            print(f"  ✓ Added: {city_data['name']} (Province: {province_name})")
        
        db.commit()
        print(f"✅ {len(cities)} cities seeded successfully!")
        
        # Summary
        print("\n" + "="*60)
        print("📊 SEEDING SUMMARY")
        print("="*60)
        print(f"Total Provinces: {len(provinces)}")
        print(f"Total Cities: {len(cities)}")
        print("\nBreakdown by Province:")
        for prov_data in provinces_data:
            city_count = sum(1 for c in cities_data if c['province_id'] == prov_data['id'])
            print(f"  • {prov_data['name']}: {city_count} cities/regencies")
        print("="*60)
        print("✅ Jabodetabek regional data seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_jabodetabek_data()
