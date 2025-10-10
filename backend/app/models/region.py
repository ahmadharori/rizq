"""
Regional data models for Indonesian administrative divisions.

Indonesia administrative hierarchy (simplified):
- Province (Provinsi)
- City/Regency (Kabupaten/Kota)
"""
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Province(BaseModel):
    """Province (Provinsi) model."""
    
    __tablename__ = "provinces"
    
    # Override id to use Integer for regional data (easier data seeding)
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    
    # Relationships
    cities = relationship("City", back_populates="province")
    recipients = relationship("Recipient", back_populates="province")
    
    def __repr__(self):
        return f"<Province {self.name}>"


class City(BaseModel):
    """City/Regency (Kabupaten/Kota) model."""
    
    __tablename__ = "cities"
    
    # Override id to use Integer
    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("provinces.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    
    # Relationships
    province = relationship("Province", back_populates="cities")
    recipients = relationship("Recipient", back_populates="city")
    
    def __repr__(self):
        return f"<City {self.name}>"
