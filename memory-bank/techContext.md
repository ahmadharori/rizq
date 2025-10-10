# Technical Context

## Technology Stack

### Backend Stack

**Framework & Language**
- **FastAPI 0.104+**: Modern, fast Python web framework
  - Async support (ASGI)
  - Automatic API documentation (OpenAPI/Swagger)
  - Built-in request validation (Pydantic)
  - Dependency injection system
  
- **Python 3.10+**: Core language
  - Type hints for better IDE support
  - Match/case statements for cleaner code
  - Improved error messages

**Database & ORM**
- **PostgreSQL 14+**: Primary database
  - ACID transactions
  - JSON/JSONB support for flexible route data
  - Excellent performance for relational data
  
- **PostGIS 3.3+**: Spatial database extension
  - Geographic point storage (GEOGRAPHY type)
  - Spatial indexing (GIST)
  - Distance calculations
  - Coordinate validation
  
- **SQLAlchemy 2.0+**: ORM
  - Declarative models
  - Relationship management
  - Query builder
  - Migration support via Alembic

**Authentication & Security**
- **python-jose**: JWT token generation/validation
- **bcrypt**: Password hashing
- **passlib**: Password utilities
- **python-multipart**: File upload support

**Optimization & External APIs**
- **Google OR-Tools**: CVRP/TSP optimization
  - Constraint programming solver
  - Vehicle routing algorithms
  - Capacity constraints support
  
- **googlemaps (google-maps-services-python)**: Google APIs client
  - Routes API (route optimization, distance matrix)
  - Geocoding API (address → coordinates)
  - Maps JavaScript API (frontend visualization)

**Utilities**
- **pydantic v2**: Data validation & serialization
- **python-dotenv**: Environment variable management
- **uvicorn**: ASGI server
- **alembic**: Database migrations

### Frontend Stack

**Core Framework**
- **React 18+**: UI library
  - Hooks-based (useState, useEffect, useContext)
  - Concurrent rendering
  - No Redux needed (Context API sufficient for MVP)
  
- **Vite 5+**: Build tool & dev server
  - Fast HMR (Hot Module Replacement)
  - ES modules native support
  - Optimized production builds

**Styling & UI**
- **Tailwind CSS 3+**: Utility-first CSS framework
  - Rapid UI development
  - Responsive design utilities
  - Custom design tokens
  
- **shadcn/ui**: Component library
  - Built on Radix UI primitives
  - Accessible by default (ARIA)
  - Customizable with Tailwind
  - Copy-paste components (not npm package)
  - Components: Button, Card, Input, Table, Dialog, Badge, etc.

**Maps & Visualization**
- **@react-google-maps/api**: React wrapper for Google Maps
  - GoogleMap component
  - Marker, InfoWindow, Polyline components
  - Event handling
  - Clustering support (optional)

**Drag & Drop**
- **@dnd-kit** or **react-beautiful-dnd**: Drag & drop library
  - Accessible drag & drop
  - Touch support
  - Smooth animations
  - List reordering

**HTTP & Data Fetching**
- **Axios**: HTTP client
  - Request/response interceptors
  - Error handling
  - Automatic JSON transformation
  - Request cancellation

**Forms & Validation**
- **react-hook-form**: Form state management
  - Minimal re-renders
  - Easy validation integration
  - Better performance than Formik
  
- **zod**: Schema validation
  - TypeScript-first
  - Composable schemas
  - Type inference

**Icons & Assets**
- **lucide-react**: Icon library
  - Tree-shakeable
  - Consistent design
  - Wide variety of icons

### Infrastructure & DevOps

**Containerization**
- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration
  - Backend service
  - PostgreSQL service
  - Redis (future caching)

**Web Server**
- **Uvicorn**: ASGI server for FastAPI
- **Nginx** (optional): Reverse proxy for production
  - Static file serving
  - SSL termination
  - Load balancing (future)

**CI/CD**
- **GitHub Actions**: Automated testing & deployment
  - Run tests on PR
  - Lint checks (pylint, ESLint)
  - Build & deploy on merge to main

**Environment Management**
- **.env files**: Local development
- **Environment variables**: Production secrets
- **python-dotenv**: Load .env in development

## Development Setup

### Prerequisites
```bash
# Backend
Python 3.10+
PostgreSQL 14+ with PostGIS (local installation)
pip (package manager)

# Frontend
Node.js 18+
npm or yarn

# Version Control
Git
```

### Local Development Setup (Recommended for Phase 1-5)

#### Backend Setup
```bash
# Clone repository
git clone <repo-url>
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup local PostgreSQL database
createdb rizq_db
psql -d rizq_db -c "CREATE EXTENSION postgis;"

# Configure environment variables
cp .env.example .env
# Edit .env with your local credentials
```

**Backend .env.example:**
```env
# Database Configuration (environment-based)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rizq_db
DB_USER=your_username
DB_PASSWORD=your_password
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Application Settings
SECRET_KEY=your-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional: Future services
# REDIS_URL=redis://localhost:6379
```

```bash
# Run migrations
alembic upgrade head

# Seed admin user
python seed_admin.py

# Seed Jabodetabek regional data
python seed_jabodetabek.py

# Verify database schema and seeded data
python verify_schema.py
python verify_jabodetabek_data.py

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with API URL and Google Maps key
```

**Frontend .env.example:**
```env
# API Configuration (environment-based)
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-browser-key

# Application Settings
VITE_ENVIRONMENT=development
```

```bash
# Run development server
npm run dev
```

### Environment-Based Configuration Best Practices

**✅ DO:**
- Use environment variables for ALL external service connections
- Provide sensible defaults for development
- Document all environment variables in .env.example
- Never commit actual .env files to version control
- Use different API keys for development and production

**❌ DON'T:**
- Hardcode database URLs, API keys, or service endpoints
- Use absolute file paths
- Commit secrets to Git
- Mix configuration with application code

**Example: Configuration Loading Pattern**
```python
# backend/app/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database (environment-based, container-ready)
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_name: str = os.getenv("DB_NAME", "rizq_db")
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "")
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    # Application
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # External Services
    google_maps_api_key: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    # Optional: Future services
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### Docker Setup (Phase 6 - Containerization)

**Note**: Docker setup is postponed to Phase 6. During Phase 1-5, use local development setup above.

When ready for containerization (Phase 6), the following will be implemented:

```bash
# Root directory
docker-compose up --build

# Services:
# - backend: http://localhost:8000
# - frontend: http://localhost:5173
# - postgres: localhost:5432
```

**Benefits of Environment-Based Approach:**
- Same codebase works locally and in containers
- Easy transition to Docker in Phase 6
- No code changes needed for containerization
- Configuration managed through environment variables
- Supports multiple deployment targets (local, Docker, cloud)

## Technical Constraints

### Performance Requirements
- **Page load**: <3 seconds (initial)
- **API response**: <500ms (95th percentile)
- **TSP optimization**: <5 seconds (25 waypoints)
- **CVRP optimization**: <60 seconds (100 recipients)
- **Map rendering**: <2 seconds (200 markers)

### Resource Limits
- **Database connections**: Pool size 20
- **Concurrent requests**: ~50 per second
- **Google Maps API quota**: ~10,000 loads/month (~$70/month)
- **Routes API quota**: ~1,000 calls/month (~$5/month)

### Browser Support
- **Primary**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **No support**: IE11
- **Mobile browsers**: Chrome Mobile, Safari Mobile (basic support)

### Geographic Constraints
- **Country**: Indonesia only
- **Coordinates**: 
  - Latitude: -11° to 6°
  - Longitude: 95° to 141°
- **Address format**: Indonesian standard
- **Phone format**: Indonesian (+62, 08xx)

## Dependencies Management

### Backend Dependencies (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
googlemaps==4.10.0
ortools==9.8.3296
pytest==7.4.3
pytest-asyncio==0.21.1
```

### Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@react-google-maps/api": "^2.19.2",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.3.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

## External Service Configuration

### Google Maps Platform Setup

**Required APIs:**
1. **Maps JavaScript API**
   - Purpose: Frontend map visualization
   - Usage: ~10,000 loads/month
   - Cost: $7 per 1,000 loads
   
2. **Routes API**
   - Purpose: Route optimization, distance matrix
   - Usage: ~1,000 calls/month
   - Cost: $5 per 1,000 calls
   
3. **Geocoding API**
   - Purpose: Address to coordinates conversion
   - Usage: ~500 calls/month
   - Cost: $5 per 1,000 calls

**Estimated Cost**: ~$77.50/month

**API Key Configuration:**
```env
# Backend .env
GOOGLE_MAPS_API_KEY=your-server-side-key

# Frontend .env
VITE_GOOGLE_MAPS_API_KEY=your-browser-key
```

**API Key Restrictions:**
- Server key: IP restriction (backend server IP)
- Browser key: HTTP referrer restriction (frontend domain)

### Database Configuration

**PostgreSQL + PostGIS:**
```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
SELECT PostGIS_Version();

-- Example geography column
ALTER TABLE recipients 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Create spatial index
CREATE INDEX idx_recipients_location 
ON recipients USING GIST(location);
```

**Connection String:**
```
postgresql://username:password@host:port/database
```

## Development Tools

### Code Quality Tools

**Backend:**
- **pylint**: Python linter
- **black**: Code formatter
- **mypy**: Static type checker
- **pytest**: Testing framework

**Frontend:**
- **ESLint**: JavaScript linter
- **Prettier**: Code formatter
- **TypeScript** (optional): Type checking

### Database Tools
- **pgAdmin**: Database management GUI
- **DBeaver**: Multi-platform database tool
- **TablePlus**: Modern database client

### API Testing
- **Postman**: API testing & documentation
- **Thunder Client**: VS Code extension
- **Swagger UI**: Auto-generated from FastAPI

### Version Control
- **Git**: Version control
- **GitHub**: Repository hosting
- **Conventional Commits**: Commit message format

## Testing Strategy

### Backend Testing
```python
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# Coverage report
pytest --cov=app tests/
```

### Frontend Testing
```bash
# Component tests (future)
npm run test

# E2E tests (future - Playwright/Cypress)
npm run test:e2e
```

### Test Coverage Targets
- Unit tests: >80% coverage
- Integration tests: Critical paths covered
- E2E tests: Main user journeys

## Deployment Architecture (Phase 6)

### Local Development (Phase 1-5)
```
Developer Machine
  ↓
├─ Backend (Uvicorn + FastAPI)
│  - Port: 8000
│  - Config: .env file
│  - Database: Local PostgreSQL
│
├─ Frontend (Vite Dev Server)
│  - Port: 5173
│  - Config: .env file
│  - API: http://localhost:8000
│
└─ PostgreSQL + PostGIS
   - Port: 5432
   - Local installation
```

### Containerized Development (Phase 6)
```
Docker Compose
  ↓
├─ Backend Container
│  - Image: rizq-backend:latest
│  - Port: 8000
│  - Config: Environment variables
│
├─ Frontend Container
│  - Image: rizq-frontend:latest
│  - Port: 80
│  - Nginx serving static files
│
└─ PostgreSQL Container
   - Image: postgis/postgis:14-3.3
   - Port: 5432
   - Volume: Persistent data
```

### Production Stack (Phase 6)
```
Internet
  ↓
Nginx (Reverse Proxy, SSL)
  ↓
├─ Frontend (Static Files)
│  - Served by Nginx
│  - Environment variables injected at build
│
└─ Backend (Uvicorn + FastAPI)
   - Gunicorn + Uvicorn workers
   - Environment variables from secrets
      ↓
   PostgreSQL + PostGIS
   - Managed database service or container
   - Persistent volumes
   - Automated backups
```

### Environment Variables (Production)
```bash
# Backend
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=rizq_production
DB_USER=rizq_user
DB_PASSWORD=<strong-password>
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

SECRET_KEY=<strong-random-key-min-32-chars>
ENVIRONMENT=production
DEBUG=False

API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

GOOGLE_MAPS_API_KEY=<production-server-key>

# Optional: Production services
REDIS_URL=redis://production-redis:6379
SENTRY_DSN=<sentry-error-tracking-url>

# Frontend (injected at build time)
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_GOOGLE_MAPS_API_KEY=<production-browser-key>
VITE_ENVIRONMENT=production
```

### Container-Ready Configuration Pattern

**Backend Dockerfile (Phase 6):**
```dockerfile
# Multi-stage build for optimization
FROM python:3.10-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.10-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY . .

# Environment variables will be provided at runtime
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile (Phase 6):**
```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Environment variables injected at build time
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose (Phase 6):**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - SECRET_KEY=${SECRET_KEY}
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        - VITE_API_BASE_URL=http://localhost:8000
        - VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgis/postgis:14-3.3
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Security Considerations

### Authentication
- JWT tokens with 8-hour expiry
- Secure cookie storage (HttpOnly, Secure flags)
- Password minimum: 8 chars, mixed case + numbers
- Bcrypt hashing with salt rounds

### API Security
- CORS configuration (whitelist domains)
- Rate limiting (100 req/min per user)
- Input validation (Pydantic schemas)
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized outputs)

### Data Protection
- HTTPS only (TLS 1.2+)
- Environment variables for secrets
- No credentials in source code
- Soft delete for audit trail

## Configuration Management Principles

### 12-Factor App Compliance

The application follows 12-factor app principles for easy containerization:

1. **Codebase**: One codebase tracked in Git
2. **Dependencies**: Explicitly declared (requirements.txt, package.json)
3. **Config**: Stored in environment variables, never in code
4. **Backing Services**: Treated as attached resources (DB, Redis, APIs)
5. **Build, Release, Run**: Strict separation of stages
6. **Processes**: Stateless processes (session in DB/Redis, not memory)
7. **Port Binding**: Self-contained services (Uvicorn, Vite)
8. **Concurrency**: Scale via process model
9. **Disposability**: Fast startup, graceful shutdown
10. **Dev/Prod Parity**: Keep development and production similar
11. **Logs**: Treat logs as event streams
12. **Admin Processes**: Run admin tasks as one-off processes

### Environment Variable Hierarchy

**Development (Phase 1-5):**
```
.env file → Environment Variables → Application Defaults
```

**Production (Phase 6):**
```
Container Environment → Secrets Manager → Application Defaults
```

### File Path Management

**✅ Correct Approach:**
```python
import os
from pathlib import Path

# Base directory (relative to current file)
BASE_DIR = Path(__file__).resolve().parent.parent

# Upload directory (configurable)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))

# Static files (relative)
STATIC_DIR = BASE_DIR / "static"
```

**❌ Incorrect Approach:**
```python
# Hardcoded absolute paths - breaks in containers
UPLOAD_DIR = "C:/Users/Admin/uploads"
STATIC_DIR = "/home/user/project/static"
```

## Future Technical Considerations

### Scalability Improvements (Post-MVP)
- **Redis**: Caching layer for geocoding, regional data
- **WebSocket**: Real-time status updates
- **CDN**: Static asset delivery
- **Load balancer**: Horizontal scaling
- **Database replication**: Read replicas for performance

### Additional Features (Future Phases)
- **Mobile app**: React Native or Flutter
- **Real-time tracking**: GPS integration
- **Advanced analytics**: Data warehouse, BI tools
- **Multi-language**: i18n support
- **Multi-tenant**: Support multiple organizations

### Monitoring & Observability (Phase 6)
- **Application logs**: Structured logging (JSON format)
- **Metrics**: Prometheus + Grafana
- **Error tracking**: Sentry or similar
- **Uptime monitoring**: UptimeRobot or Pingdom
- **Performance monitoring**: New Relic or DataDog
