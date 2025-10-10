"""
Seed script to create initial admin user.
Run this script once to create the default admin account.

Usage:
    python seed_admin.py
"""
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def seed_admin():
    """Create initial admin user if not exists."""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("❌ Admin user already exists!")
            return
        
        # Create admin user
        admin = User(
            username="admin",
            hashed_password=get_password_hash("admin123!"),
            full_name="System Administrator"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"   Username: admin")
        print(f"   Password: admin123!")
        print(f"   Full Name: {admin.full_name}")
        print(f"   User ID: {admin.id}")
        print("\n⚠️  Please change the password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
