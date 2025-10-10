"""
Pytest fixtures and test configuration.
"""
import os
import sys
from typing import Generator
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.region import Province, City
from app.models.recipient import Recipient, RecipientStatus
from app.utils.security import get_password_hash


# Test database URL - PostgreSQL with PostGIS support
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/rizq_test"
)


@pytest.fixture(scope="session")
def engine():
    """Create test database engine."""
    from sqlalchemy import text
    
    test_engine = create_engine(TEST_DATABASE_URL)
    
    # Enable PostGIS extension
    with test_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
    
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    yield test_engine
    
    # Drop all tables after tests
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session(engine):
    """Create a new database session for each test."""
    from sqlalchemy import text
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.rollback()
        session.close()
        
        # Clean up test data after each test
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE recipients, assignment_recipients, assignments, couriers, status_history, cities, provinces, users RESTART IDENTITY CASCADE;"))
            conn.commit()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(client, test_user) -> dict:
    """Get authentication headers with JWT token."""
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_province(db_session) -> Province:
    """Create a test province."""
    province = Province(
        id=31,
        name="DKI Jakarta"
    )
    db_session.add(province)
    db_session.commit()
    db_session.refresh(province)
    return province


@pytest.fixture(scope="function")
def test_city(db_session, test_province) -> City:
    """Create a test city."""
    city = City(
        id=1,
        province_id=test_province.id,
        name="Jakarta Pusat"
    )
    db_session.add(city)
    db_session.commit()
    db_session.refresh(city)
    return city


@pytest.fixture(scope="function")
def test_recipient(db_session, test_province, test_city) -> Recipient:
    """Create a test recipient."""
    recipient = Recipient(
        name="Test Recipient",
        phone="081234567890",
        address="Jl. Test No. 123",
        province_id=test_province.id,
        city_id=test_city.id,
        location="SRID=4326;POINT(106.8456 -6.2088)",
        num_packages=2,
        status=RecipientStatus.UNASSIGNED.value
    )
    db_session.add(recipient)
    db_session.commit()
    db_session.refresh(recipient)
    return recipient


@pytest.fixture(scope="function")
def test_recipients(db_session, test_province, test_city) -> list[Recipient]:
    """Create multiple test recipients."""
    recipients = []
    
    for i in range(5):
        recipient = Recipient(
            name=f"Test Recipient {i+1}",
            phone=f"08123456789{i}",
            address=f"Jl. Test No. {i+1}",
            province_id=test_province.id,
            city_id=test_city.id,
            location=f"SRID=4326;POINT({106.8456 + i*0.001} {-6.2088 + i*0.001})",
            num_packages=i+1,
            status=RecipientStatus.UNASSIGNED.value
        )
        db_session.add(recipient)
        recipients.append(recipient)
    
    db_session.commit()
    
    for recipient in recipients:
        db_session.refresh(recipient)
    
    return recipients
