"""
Application configuration using Pydantic Settings.
Loads environment variables and provides validation.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8
    
    # Application
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:4173"
    
    # API Keys (optional for now)
    GOOGLE_MAPS_API_KEY: str = ""
    
    # Depot Configuration (hardcoded for MVP)
    DEPOT_LAT: float = -6.200000  # Jakarta Pusat
    DEPOT_LNG: float = 106.816666
    DEPOT_NAME: str = "Warehouse Jakarta Pusat"
    
    # Optimization Settings
    OPTIMIZATION_TIMEOUT_SECONDS: int = 60
    TSP_TIMEOUT_SECONDS: int = 5
    CVRP_TIMEOUT_SECONDS: int = 60
    
    # Performance Profiling
    ENABLE_PROFILING: bool = False  # Set to True for debugging/benchmarking
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def depot_location(self) -> dict:
        """Get depot location as dict."""
        return {
            "lat": self.DEPOT_LAT,
            "lng": self.DEPOT_LNG,
            "name": self.DEPOT_NAME
        }
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
