"""
FastAPI main application.
RizQ - Sembako Delivery Assignment Dashboard
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, recipients, regions, couriers

# Create FastAPI application
app = FastAPI(
    title="RizQ API",
    description="Sembako Delivery Assignment Dashboard API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api/v1 prefix for consistency
app.include_router(auth.router, prefix="/api/v1")
app.include_router(recipients.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1/regions")
app.include_router(couriers.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to RizQ API",
        "docs": "/docs",
        "health": "/health"
    }
