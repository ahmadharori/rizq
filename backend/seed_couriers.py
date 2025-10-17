"""
Seed script for courier demo data.
Creates sample couriers for testing and development.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.courier import Courier


def seed_couriers():
    """Create demo courier data."""
    db = SessionLocal()
    
    try:
        # Check if couriers already exist
        existing_count = db.query(Courier).count()
        if existing_count > 0:
            print(f"⚠️  Database already has {existing_count} courier(s). Skipping seed.")
            return
        
        # Demo couriers with Indonesian names and phone numbers
        couriers = [
            {
                "name": "Ahmad Ridwan",
                "phone": "081234567890"
            },
            {
                "name": "Budi Santoso",
                "phone": "082345678901"
            },
            {
                "name": "Citra Dewi",
                "phone": "083456789012"
            },
            {
                "name": "Dedi Kurniawan",
                "phone": "085567890123"
            },
            {
                "name": "Eka Putri",
                "phone": "087678901234"
            },
            {
                "name": "Fajar Setiawan",
                "phone": "088789012345"
            },
            {
                "name": "Gita Maharani",
                "phone": "089890123456"
            },
            {
                "name": "Hendra Wijaya",
                "phone": "081901234567"
            }
        ]
        
        print(f"🚀 Seeding {len(couriers)} couriers...")
        
        for courier_data in couriers:
            courier = Courier(**courier_data)
            db.add(courier)
            print(f"   ✓ Created courier: {courier_data['name']} ({courier_data['phone']})")
        
        db.commit()
        
        print(f"\n✅ Successfully seeded {len(couriers)} couriers!")
        
        # Verify
        total = db.query(Courier).filter(Courier.is_deleted == False).count()
        print(f"📊 Total active couriers in database: {total}")
        
    except Exception as e:
        print(f"❌ Error seeding couriers: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("COURIER SEED SCRIPT")
    print("=" * 60)
    seed_couriers()
    print("=" * 60)
