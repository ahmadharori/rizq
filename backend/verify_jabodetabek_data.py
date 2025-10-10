"""
Verification script for Jabodetabek regional data seeding
"""
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import get_db
from app.models.region import Province, City
from sqlalchemy import func


def verify_jabodetabek_data():
    """Verify Jabodetabek provinces and cities data."""
    
    # Get database session
    db = next(get_db())
    
    try:
        print("=" * 70)
        print("🔍 JABODETABEK REGIONAL DATA VERIFICATION")
        print("=" * 70)
        
        # Get all provinces
        provinces = db.query(Province).order_by(Province.id).all()
        
        print(f"\n📍 PROVINCES ({len(provinces)} total):")
        print("-" * 70)
        for prov in provinces:
            city_count = db.query(func.count(City.id)).filter(City.province_id == prov.id).scalar()
            print(f"  [{prov.id}] {prov.name}")
            print(f"      └─ Cities/Regencies: {city_count}")
            print(f"      └─ Created: {prov.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"      └─ Soft Deleted: {'Yes' if prov.is_deleted else 'No'}")
        
        print("\n" + "=" * 70)
        print("🏙️  CITIES/REGENCIES BY PROVINCE:")
        print("=" * 70)
        
        for prov in provinces:
            cities = db.query(City).filter(City.province_id == prov.id).order_by(City.name).all()
            print(f"\n{prov.name} ({len(cities)} cities/regencies):")
            print("-" * 70)
            for idx, city in enumerate(cities, 1):
                print(f"  {idx}. {city.name} (ID: {city.id})")
        
        # Summary
        total_cities = db.query(func.count(City.id)).scalar()
        
        print("\n" + "=" * 70)
        print("📊 SUMMARY:")
        print("=" * 70)
        print(f"  Total Provinces: {len(provinces)}")
        print(f"  Total Cities/Regencies: {total_cities}")
        print(f"  Average Cities per Province: {total_cities / len(provinces):.1f}")
        print("=" * 70)
        print("✅ Verification completed successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    verify_jabodetabek_data()
