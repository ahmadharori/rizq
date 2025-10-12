"""
Seed Recipients Data for Testing
Generates dummy recipient data for Jabodetabek area
"""

import random
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.config import settings
from app.models.recipient import Recipient
from app.models.region import Province, City
from app.utils.constants import RecipientStatus

# Indonesian names for realistic data
FIRST_NAMES = [
    "Ahmad", "Budi", "Citra", "Dian", "Eko", "Fitri", "Gunawan", "Hadi",
    "Indah", "Joko", "Kartika", "Lina", "Made", "Nina", "Omar", "Putri",
    "Rudi", "Sari", "Tono", "Umar", "Vina", "Wati", "Yanto", "Zahra",
    "Agus", "Bambang", "Cahya", "Dewi", "Edi", "Farah", "Gita", "Hendra",
    "Ika", "Johan", "Kusuma", "Lia", "Maman", "Nita", "Oki", "Prita"
]

LAST_NAMES = [
    "Wijaya", "Santoso", "Kusuma", "Pratama", "Saputra", "Putra", "Putri",
    "Nugroho", "Hidayat", "Setiawan", "Rahmawati", "Wibowo", "Kurniawan",
    "Sari", "Lestari", "Permata", "Anggraini", "Utomo", "Maharani", "Susanto"
]

STREET_TYPES = ["Jl.", "Jalan", "Jl. Raya", "Gang"]
STREET_NAMES = [
    "Sudirman", "Thamrin", "Gatot Subroto", "Rasuna Said", "Kuningan",
    "Melawai", "Senopati", "Kemang", "Pejaten", "Pasar Minggu",
    "Tebet", "Matraman", "Cikini", "Menteng", "Kebayoran",
    "Blok M", "Fatmawati", "Cilandak", "Ragunan", "Jagakarsa"
]

# Area-specific coordinates (center points with radius)
AREA_COORDS = {
    # DKI Jakarta
    "Jakarta Pusat": {"lat": -6.1862, "lon": 106.8063, "radius": 0.05},
    "Jakarta Utara": {"lat": -6.1385, "lon": 106.8827, "radius": 0.05},
    "Jakarta Barat": {"lat": -6.1670, "lon": 106.7590, "radius": 0.05},
    "Jakarta Selatan": {"lat": -6.2615, "lon": 106.8106, "radius": 0.05},
    "Jakarta Timur": {"lat": -6.2250, "lon": 106.9004, "radius": 0.05},
    "Kepulauan Seribu": {"lat": -5.6112, "lon": 106.5756, "radius": 0.1},
    
    # Jawa Barat
    "Kota Bogor": {"lat": -6.5971, "lon": 106.8060, "radius": 0.03},
    "Kota Depok": {"lat": -6.4025, "lon": 106.7942, "radius": 0.03},
    "Kota Bekasi": {"lat": -6.2383, "lon": 106.9756, "radius": 0.03},
    "Kabupaten Bogor": {"lat": -6.5971, "lon": 106.8060, "radius": 0.1},
    "Kabupaten Bekasi": {"lat": -6.2644, "lon": 107.1489, "radius": 0.1},
    
    # Banten
    "Kota Tangerang": {"lat": -6.1781, "lon": 106.6297, "radius": 0.03},
    "Kota Tangerang Selatan": {"lat": -6.2880, "lon": 106.7174, "radius": 0.03},
    "Kabupaten Tangerang": {"lat": -6.1781, "lon": 106.6297, "radius": 0.1},
}


def generate_phone_number():
    """Generate realistic Indonesian phone number"""
    prefixes = ["0812", "0813", "0821", "0822", "0852", "0853", "0857", "0858"]
    prefix = random.choice(prefixes)
    number = "".join([str(random.randint(0, 9)) for _ in range(8)])
    return f"{prefix}{number}"


def generate_coordinate(city_name: str):
    """Generate random coordinate within city area"""
    area = AREA_COORDS.get(city_name)
    if not area:
        # Default to central Jakarta if city not found
        area = {"lat": -6.2088, "lon": 106.8456, "radius": 0.05}
    
    # Generate random point within radius
    lat_offset = random.uniform(-area["radius"], area["radius"])
    lon_offset = random.uniform(-area["radius"], area["radius"])
    
    lat = area["lat"] + lat_offset
    lon = area["lon"] + lon_offset
    
    return Point(lon, lat)  # Note: Point(longitude, latitude)


def generate_address(city_name: str):
    """Generate realistic Indonesian address"""
    street_type = random.choice(STREET_TYPES)
    street_name = random.choice(STREET_NAMES)
    number = random.randint(1, 200)
    rt = random.randint(1, 20)
    rw = random.randint(1, 15)
    kelurahan = f"Kelurahan {random.choice(['Menteng', 'Senayan', 'Kebayoran', 'Tebet', 'Cikini'])}"
    
    return f"{street_type} {street_name} No. {number}, RT.{rt:03d}/RW.{rw:03d}, {kelurahan}"


def seed_recipients():
    """Seed recipient data"""
    print("🌱 Starting recipient seeding...")
    
    # Create sync engine - convert async URL to sync
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(sync_url, echo=False)
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        # Get all provinces and cities
        provinces = session.execute(select(Province)).scalars().all()
        cities = session.execute(select(City)).scalars().all()
        
        if not cities:
            print("❌ No cities found! Run seed_jabodetabek.py first")
            return
        
        print(f"✅ Found {len(cities)} cities in database")
        
        # Create city to province mapping
        city_to_province = {}
        for province in provinces:
            province_cities = session.execute(
                select(City).where(City.province_id == province.id)
            ).scalars().all()
            for city in province_cities:
                city_to_province[city.id] = province.id
        
        # Generate recipients
        recipients_to_create = []
        num_recipients = 50
        
        print(f"📝 Generating {num_recipients} recipients...")
        
        for i in range(num_recipients):
            # Random name
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            name = f"{first_name} {last_name}"
            
            # Random city
            city = random.choice(cities)
            province_id = city_to_province[city.id]
            
            # Generate data
            phone = generate_phone_number()
            address = generate_address(city.name)
            location_point = generate_coordinate(city.name)
            location_geog = from_shape(location_point, srid=4326)
            num_packages = random.randint(1, 5)
            
            recipient = Recipient(
                name=name,
                phone=phone,
                address=address,
                location=location_geog,
                province_id=province_id,
                city_id=city.id,
                num_packages=num_packages,
                status=RecipientStatus.UNASSIGNED,
                is_deleted=False
            )
            
            recipients_to_create.append(recipient)
            
            if (i + 1) % 10 == 0:
                print(f"  Generated {i + 1}/{num_recipients} recipients...")
        
        # Bulk insert
        session.add_all(recipients_to_create)
        session.commit()
        
        print(f"✅ Successfully seeded {len(recipients_to_create)} recipients!")
        print(f"📊 Data distribution:")
        
        # Show distribution
        from collections import Counter
        city_distribution = Counter([r.city_id for r in recipients_to_create])
        for city in cities:
            count = city_distribution.get(city.id, 0)
            if count > 0:
                print(f"   - {city.name}: {count} recipients")
    
    engine.dispose()


if __name__ == "__main__":
    seed_recipients()
