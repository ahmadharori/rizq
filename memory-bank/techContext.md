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
PostgreSQL 14+ with PostGIS
pip (package manager)

# Frontend
Node.js 18+
npm or yarn

# Optional
Docker & Docker Compose
Git
```

### Backend Setup
```bash
# Clone repository
git clone <repo-url>
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb rizq_db
psql -d rizq_db -c "CREATE EXTENSION postgis;"

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
alembic upgrade head

# Seed regional data (optional)
python scripts/seed_regions.py

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API URL and Google Maps key

# Run development server
npm run dev
```

### Docker Setup (Recommended)
```bash
# Root directory
docker-compose up --build

# Services:
# - backend: http://localhost:8000
# - frontend: http://localhost:5173
# - postgres: localhost:5432
```

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

## Deployment Architecture

### Production Stack
```
Internet
  ↓
Nginx (Reverse Proxy, SSL)
  ↓
├─ Frontend (Static Files)
└─ Backend (Uvicorn + FastAPI)
      ↓
   PostgreSQL + PostGIS
```

### Environment Variables (Production)
```bash
# Backend
DATABASE_URL=postgresql://...
SECRET_KEY=<strong-random-key>
GOOGLE_MAPS_API_KEY=<production-key>
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_GOOGLE_MAPS_API_KEY=<browser-key>
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

## Future Technical Considerations

### Scalability Improvements
- **Redis**: Caching layer for geocoding, regional data
- **WebSocket**: Real-time status updates
- **CDN**: Static asset delivery
- **Load balancer**: Horizontal scaling

### Additional Features
- **Mobile app**: React Native or Flutter
- **Real-time tracking**: GPS integration
- **Advanced analytics**: Data warehouse, BI tools
- **Multi-language**: i18n support
