"""
Region Schemas
Pydantic schemas for region API responses
"""

from pydantic import BaseModel


class RegionResponse(BaseModel):
    """
    Region response schema for provinces and cities
    """
    id: int
    name: str

    class Config:
        from_attributes = True
