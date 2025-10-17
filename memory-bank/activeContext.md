# Active Context

## Current Status

**Project Phase**: Phase 2A - Assignment Creation Flow (**✅ SPRINT 2.1 COMPLETED**)
**Date**: October 17, 2025 - 03:02 WIB
**Stage**: Sprint 2.1 Complete - Ready for Sprint 2A.1 (Route Optimization) ✅

The RizQ project has completed Sprint 2.1 with full courier management (CRUD). Backend API provides 6 courier endpoints with 42/42 tests passing (98.51% coverage). Frontend features complete courier list and create/edit forms. Project roadmap has been restructured to prioritize Assignment Creation Flow (Phase 2A) before Assignment Management (Phase 2B). Backend API running at http://localhost:8000 and frontend at http://localhost:5173.

## Current Work Focus

### Completed Tasks
1. ✅ PRD completed and documented (120+ pages)
2. ✅ Memory bank structure created
3. ✅ Git repository initialized
4. ✅ Backend development environment setup (FastAPI + PostgreSQL)
5. ✅ Authentication system implemented and tested
6. ✅ Frontend setup (React + Vite + Tailwind + shadcn/ui)
   - Vite + React + TypeScript project initialized
   - Tailwind CSS v4 with @tailwindcss/postcss configured
   - shadcn/ui components created (Button, Input, Label, Card, Table, Dialog, Select, Badge, Sidebar)
   - React Router DOM with protected routes
   - Axios API service with JWT interceptors
   - Authentication context provider
   - Login and Dashboard pages
   - Full authentication flow working
7. ✅ Database schema for recipients, couriers, assignments
   - Created 9 new tables with proper relationships
   - PostGIS 3.5 extension installed and enabled
   - Spatial index on recipients.location (GEOGRAPHY type)
   - All foreign keys, constraints, and indexes in place
   - Migrations successfully applied (4 total)
   - **Simplified regional hierarchy**: Removed districts (kecamatan) and villages (kelurahan)
   - Regional structure now 2-level: provinces → cities only
   - Decision rationale: Original 4-level hierarchy with 83,000+ villages too large for MVP
8. ✅ Jabodetabek regional data seeded
   - 3 provinces: DKI Jakarta, Jawa Barat, Banten
   - 14 cities/regencies across Jabodetabek metropolitan area
   - Seed script created for reproducible data population
9. ✅ Recipient CRUD Backend (Sprint 1.2)
   - 7 RESTful API endpoints with full CRUD operations
   - Repository pattern implementation with RecipientRepository
   - PostGIS location handling (geoalchemy2 + shapely)
   - Status validation logic for business rules
   - 35/35 tests passing with 90.93% code coverage
   - Production-ready with comprehensive error handling
10. ✅ Regional API Backend
   - GET /api/v1/regions/provinces - List all provinces
   - GET /api/v1/regions/cities?province_id={id} - List cities with filtering
   - Fixed UUID type mismatch bug (changed to int for region IDs)
11. ✅ Recipient List Frontend (Sprint 1.2)
   - Complete table UI with shadcn/ui components
   - Search bar with debounced input (500ms)
   - 3 filter dropdowns: Status, Province, City (cascading)
   - 6 sortable columns: Name, Phone, Status, Provinsi, Kab/Kota, Jumlah Paket
   - Pagination controls (10/30/50/100 per page)
   - Bulk delete with checkbox selection and confirmation dialog
   - Row-level navigation to detail pages
   - Toast notifications for user feedback
   - StatusBadge component with color-coded display
12. ✅ Sidebar Navigation
   - Collapsible sidebar with keyboard shortcut (Ctrl/Cmd+B)
   - Navigation menu: Dashboard, Penerima, Pengantar, Assignment
   - Active state detection with highlight
   - User info and logout button in footer
   - Responsive mobile/desktop behavior
   - MainLayout wrapper for consistent structure

### Database Tables Created:
**Regional Hierarchy (Simplified - Indonesian administrative divisions):**
- `provinces` - Provinsi (3 seeded: DKI Jakarta, Jawa Barat, Banten)
- `cities` - Kabupaten/Kota (14 seeded: Jabodetabek area only)
- ~~`districts`~~ - **REMOVED** (Kecamatan - too large dataset)
- ~~`villages`~~ - **REMOVED** (Kelurahan/Desa - 83,000+ records too large for MVP)

**Core Business Tables:**
- `couriers` - Delivery personnel with phone (unique), soft delete support
- `recipients` - Package recipients with PostGIS location, status tracking, province_id and city_id only
- `assignments` - Delivery assignments with route_data (JSONB)
- `assignment_recipients` - Junction table with sequence_order for routes
- `status_history` - Audit trail for recipient status changes

**System Tables:**
- `users` - Admin authentication (existing)
- `spatial_ref_sys` - PostGIS spatial reference systems
- `alembic_version` - Migration tracking

**Database Seeding Status:**
- ✅ Provinces: 3 (DKI Jakarta, Jawa Barat, Banten)
- ✅ Cities/Regencies: 14 (Jabodetabek area only)
- ⏳ Couriers: Not yet seeded
- ⏳ Recipients: Not yet seeded

### Next Tasks
13. ✅ CRUD Couriers (Sprint 2.1) - **COMPLETED**
    - ✅ Backend: Courier API endpoints (CRUD) - 6 endpoints
    - ✅ Backend: 42/42 tests passing (98.51% API, 100% repository coverage)
    - ✅ Frontend: Courier list with search, sort, pagination
    - ✅ Frontend: Courier create/edit forms with validation
    
14. ⏳ Route Optimization Backend (Sprint 2A.1) - **NEXT SPRINT**
    - Install OR-Tools and dependencies
    - Google Routes API integration
    - TSP optimization service
    - CVRP optimization service
    - POST /api/v1/optimize endpoint
    - Unit tests for optimization logic

**Note**: Docker/containerization postponed to Phase 6 (end of project). Focus is on completing all functionality first using local development environment.

### Active Decisions

**Decision 1: Technology Stack Confirmed**
- Backend: FastAPI + PostgreSQL + PostGIS
- Frontend: React + Vite + Tailwind + shadcn/ui
- Optimization: Google OR-Tools + Google Routes API
- **Rationale**: Modern, performant, well-documented stack
- **Status**: Approved, documented in techContext.md

**Decision 2: Development Approach**
- Start with Phase 1: Foundation & Authentication (Weeks 1-2)
- Iterative development with 2-week sprints
- Local development environment (Phase 1-5)
- Docker containerization in Phase 6 (end of project)
- **Rationale**: Focus on functionality first, containerize when complete
- **Status**: Approved, documented in progress.md and techContext.md

**Decision 3: Regional Data Scope**
- **Decided**: Simplify regional hierarchy from 4 levels to 2 levels
- **Original Plan**: Provinces → Cities → Districts → Villages (83,000+ villages)
- **New Plan**: Provinces → Cities only (Jabodetabek area: 3 provinces, 14 cities)
- **Rationale**: 
  - 83,000+ villages dataset too large for MVP
  - Most delivery operations work at city/regency level
  - Can expand later if district/village precision needed
  - Reduces data seeding complexity and database size
- **Impact**: Recipient model uses only province_id and city_id (district_id and village_id removed)
- **Tables Dropped**: districts (kecamatan), villages (kelurahan/desa)
- **Status**: Implemented and migrated

**Decision 4: Depot Location**
- Hardcoded depot location for Phase 1 MVP
- Future enhancement: configurable multi-depot
- **Coordinates**: To be determined based on actual warehouse location
- **Status**: Pending client input

### Important: Regional Data Architecture Change

**Context**: During Sprint 1.1, we made a critical architectural decision to simplify the regional hierarchy.

**Original Design** (from PRD):
- 4-level hierarchy: Province → City → District → Village
- Complete Indonesian administrative structure
- ~34 provinces, ~514 cities, ~7,000+ districts, ~83,000+ villages
- Recipient model had: province_id, city_id, district_id, village_id

**Current Design** (Sprint 1.1 Implementation):
- 2-level hierarchy: Province → City only
- Jabodetabek metropolitan area only
- 3 provinces, 14 cities/regencies
- Recipient model has: province_id, city_id (district_id and village_id removed)

**Why the Change**:
1. **Data Size**: 83,000+ villages is excessive for MVP
2. **Practical Need**: Most delivery operations identify locations at city level
3. **Address Details**: Street address + coordinates provide sufficient precision
4. **Performance**: Smaller dataset reduces database size and query complexity
5. **Seeding Complexity**: Easier to maintain and validate smaller dataset
6. **MVP Focus**: Jabodetabek (Greater Jakarta) is the primary operational area

**Impact on Application**:
- ✅ Recipient forms: 2-level dropdown (Province → City) instead of 4-level
- ✅ Address display: Shows city and province only (not district/village)
- ✅ Database queries: Simpler joins and filters
- ✅ Seed data: Manageable 14 cities vs 83,000+ villages
- ✅ WhatsApp messages: Address format simplified

**Future Expansion Path**:
- Can add more provinces/cities as needed (e.g., Bandung, Surabaya, Medan)
- Can reintroduce districts/villages if client requires finer granularity
- Migration path exists to add back the columns and tables
- Current design doesn't prevent future expansion

**Files Created**:
- `backend/seed_jabodetabek.py` - Seed script for Jabodetabek data
- `backend/verify_jabodetabek_data.py` - Verification script
- Migration `74cdae8cd55e` - Drops districts and villages tables
- Migration `3cce8bcb1be2` - Adds is_deleted column to provinces and cities

## Next Steps

### Immediate (Week 1)
1. ✅ Set up development environment (COMPLETED)
   - ✅ Initialize Git repository
   - ✅ Set up local PostgreSQL database
   - ✅ Configure backend (FastAPI project structure)
   - ✅ Configure frontend (React + Vite + Tailwind)
   - ✅ Environment-based configuration (.env files)

2. Database schema & migrations (COMPLETED ✅)
   - ✅ Create recipients table with PostGIS
   - ✅ Create couriers table
   - ✅ Create assignments table
   - ✅ Create assignment_recipients junction table
   - ✅ Create status_history table
   - ✅ Create regional data tables (provinces, cities only - districts and villages removed)
   - ✅ Run Alembic migrations (4 migrations total)
   - ✅ PostGIS 3.5 extension enabled
   - ✅ Spatial GIST index on recipients.location

3. Regional data preparation (COMPLETED ✅)
   - ✅ Decided on Jabodetabek area only for MVP
   - ✅ Create seed script for Jabodetabek provinces and cities
   - ✅ Seed 3 provinces: DKI Jakarta, Jawa Barat, Banten
   - ✅ Seed 14 cities/regencies in Jabodetabek area
   - ✅ Validate data completeness

### Short-term (Weeks 1-2) - Sprint 1.1 ✅ COMPLETED
- ✅ Implement authentication system (JWT)
- ✅ Create user management (admin accounts)
- ✅ Set up protected routes
- ✅ Build basic layout (header, sidebar, routing)
- ✅ Implement login/logout flow
- ✅ Database schema with PostGIS
- ✅ Regional data seeding (Jabodetabek)

### Short-term (Weeks 2-3) - Sprint 1.2 ✅ COMPLETED
- ✅ CRUD Recipients backend with geographic data
- ✅ Regional API endpoints (provinces and cities)
- ✅ Regional data dropdowns (cascading: province → city)
- ✅ Recipient list with search, filter, sort, pagination
- ✅ Sidebar navigation with collapsible menu
- ✅ StatusBadge component
- ✅ Bulk delete operations
- ✅ Fixed CORS and type mismatch bugs
- Note: Google Maps coordinate picker and recipient detail page moved to Sprint 2.1

### Short-term (Weeks 3-4) - Sprint 2.1 ✅ COMPLETED
- ✅ CRUD Couriers (Backend + Frontend)
- ✅ Courier repository pattern implementation
- ✅ Courier tests (42/42 passing, >95% coverage)
- ✅ Courier list page with advanced features
- ✅ Courier create/edit forms with validation

### Short-term (Weeks 4-5) - Sprint 2A.1 - NEXT
- Route optimization integration (TSP + CVRP)
- Google Routes API setup
- OR-Tools implementation
- Optimization endpoint (POST /api/v1/optimize)
- Performance benchmarking

## Important Patterns & Preferences

### Architecture Patterns
1. **Layered Architecture**: API → Service → Repository → Database
2. **Repository Pattern**: Abstract data access
3. **Service Layer**: Encapsulate business logic
4. **State Machine**: Status transitions with validation
5. **Strategy Pattern**: Manual vs. Rekomendasi optimization modes

### Code Organization
- **Backend**: Feature-based organization (recipients, couriers, assignments)
- **Frontend**: Feature-based with shared components
- **Separation of Concerns**: Clear boundaries between layers
- **DRY Principle**: Reusable components and utilities
- **Configuration Management**: Environment-based, never hardcoded
- **12-Factor App**: Principles for easy containerization later

### UI/UX Principles
- **Schneiderman's 8 Golden Rules**: Consistency, shortcuts, feedback, closure, error prevention, reversal, control, memory load
- **Visual Feedback**: Hover states, loading indicators, toast notifications
- **Map-Table Sync**: Two-way binding for spatial understanding
- **Forgiving Design**: Soft deletes, edit modes, drag & drop undo

### Development Practices
- **Type Safety**: Python type hints, Pydantic schemas
- **Validation**: Client + server-side validation
- **Error Handling**: Graceful degradation, user-friendly messages
- **Testing**: >80% coverage target
- **Documentation**: Code comments for complex logic
- **Environment Variables**: All config via .env files
- **No Hardcoding**: Database URLs, API keys, service endpoints
- **Relative Paths**: No absolute file paths
- **Container-Ready**: Code works locally and in containers without changes

## Key Learnings & Project Insights

### User-Centric Design
The primary user (Admin/Dispatcher) needs:
- **Speed**: Reduce 2-hour manual process to <10 minutes
- **Trust**: Visual validation of algorithm results
- **Control**: Override capability for special cases
- **Clarity**: Clear status tracking and audit trail

### Technical Challenges Identified

**Challenge 1: CVRP Performance**
- Must complete within 60 seconds for 100 recipients
- Solution: OR-Tools with timeout, progress indicator
- Fallback: Offer manual mode if optimization fails

**Challenge 2: Google Maps API Quota**
- Estimated $77.50/month for expected usage
- Solution: Implement caching strategy for geocoding
- Monitor: Daily quota usage, set billing alerts

**Challenge 3: Map-Table Synchronization**
- Complex interaction between map markers and table rows
- Solution: Shared state with hover/click event handlers
- Implementation: Custom React hook for sync logic

**Challenge 4: Drag & Drop State Management**
- Preview changes without database commits
- Solution: In-memory state until final save
- Library: @dnd-kit or react-beautiful-dnd

### Business Logic Insights

**Status State Machine**
```
Unassigned → Assigned → Delivery → Done (terminal)
                           ↓
                        Return → (back to Delivery or Unassigned)
```

**Assignment Creation Modes**
1. **Manual Mode**: User creates clusters, system runs TSP per cluster
2. **Rekomendasi Mode**: Full CVRP automation with override capability

**Key Business Rules**
- Cannot delete assignment if any recipient has status "Done"
- Cannot edit recipient if status is "Delivery" or "Done"
- Each recipient can only be in one active assignment
- Soft delete pattern for audit trail preservation

## Project Constraints & Considerations

### Technical Constraints
- Single depot operation (Phase 1)
- No return to depot (open VRP)
- Indonesian addresses/phones only
- Desktop-first (mobile secondary)
- Browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Performance Targets
- Page load: <3 seconds
- API response: <500ms (95th percentile)
- TSP: <5 seconds (25 waypoints)
- CVRP: <60 seconds (100 recipients)
- Map rendering: <2 seconds (200 markers)

### Data Constraints
- Support 10,000 recipients
- Support 500 couriers
- Support 1,000 active assignments
- 20 concurrent admin users
- 50 requests per second

## Pending Questions & Clarifications

### From Client
1. **Depot Location**: Exact coordinates of warehouse/distribution center
2. **Initial Data**: Existing recipient/courier data to migrate
3. **User Accounts**: How many admin users initially
4. **Capacity**: Typical package capacity per courier
5. **Volume**: Average daily recipients and assignments
6. **Regional Expansion**: Need to expand beyond Jabodetabek to other regions? (Currently only Jakarta, Bogor, Depok, Tangerang, Bekasi area)

### Technical Decisions Pending
1. **Drag & Drop Library**: @dnd-kit vs. react-beautiful-dnd
2. **Caching Strategy**: Implement Redis in Phase 1 or Phase 2
3. **Hosting Provider**: AWS, GCP, DigitalOcean, Railway
4. **Domain Name**: Production URL
5. **SSL Certificate**: Let's Encrypt or paid certificate

## Risk Mitigation

### High-Priority Risks
1. **Google Maps API quota exceeded**
   - Mitigation: Implement caching, monitor daily usage, set alerts
   
2. **CVRP optimization timeout**
   - Mitigation: Set 60s timeout, show progress, offer retry or manual mode
   
3. **User resistance to algorithm**
   - Mitigation: Show distance comparison, allow full override, training

### Medium-Priority Risks
1. **Database performance degradation**
   - Mitigation: Proper indexing, query optimization, connection pooling
   
2. **Browser compatibility issues**
   - Mitigation: Test on major browsers, polyfills if needed

## Communication & Collaboration

### Documentation Status
- ✅ PRD completed (comprehensive, 120+ pages)
- ✅ Memory bank structure established
- ⏳ Technical documentation (API specs, in progress)
- ⏳ User manual (planned for Week 8-9)

### Team Handoff Notes
When development begins, ensure:
1. All team members read projectbrief.md first
2. Review productContext.md for user understanding
3. Study systemPatterns.md for architecture
4. Reference techContext.md for setup
5. Check activeContext.md for current state (this file)

## Current Environment

**Development Setup**: ✅ Full Stack Complete (Local Development)
**Database**: ✅ PostgreSQL running locally, rizq_db created with PostGIS 3.5
**Version Control**: ✅ Git initialized
**Backend Server**: ✅ Running at http://localhost:8000 (local Uvicorn)
**Frontend Server**: ✅ Running at http://localhost:5173 (local Vite dev server)
**API Documentation**: ✅ Available at http://localhost:8000/docs
**Configuration**: ✅ Environment-based (.env files)
**Containerization**: ⏳ Postponed to Phase 6
**Regional Data**: ✅ Jabodetabek seeded (3 provinces, 14 cities)

### Backend Status
- ✅ FastAPI application running successfully
- ✅ PostgreSQL database connected with PostGIS 3.5
- ✅ User table created via Alembic migration
- ✅ Admin user seeded (username: admin, password: admin123!)
- ✅ JWT authentication working
- ✅ Bcrypt password hashing implemented
- ✅ API endpoints functional: /auth/login, /auth/me, /health
- ✅ Database schema complete (10 tables)
- ✅ All migrations applied successfully (4 total)
- ✅ Regional data seeded (Jabodetabek area)

### Database Migration History
1. **f1a968b65236** - Initial migration: users table
2. **6e4a059a6c9a** - Add recipients, couriers, assignments tables + regional hierarchy (provinces, cities, districts, villages)
3. **74cdae8cd55e** - Remove districts and villages tables (simplified regional hierarchy)
4. **3cce8bcb1be2** - Add is_deleted column to provinces and cities tables

### Regional Data Status
- **Scope**: Jabodetabek metropolitan area only (Jakarta, Bogor, Depok, Tangerang, Bekasi)
- **Provinces Seeded**: 3
  - DKI Jakarta (ID: 31) - 6 administrative areas
  - Jawa Barat (ID: 32) - 5 cities/regencies (Jabodetabek portion only)
  - Banten (ID: 36) - 3 cities/regencies (Jabodetabek portion only)
- **Cities/Regencies Seeded**: 14 total
- **Districts**: None (removed for MVP)
- **Villages**: None (removed for MVP - original dataset had 83,000+ records)
- **Seed Script**: `backend/seed_jabodetabek.py`
- **Verification Script**: `backend/verify_jabodetabek_data.py`
- ✅ Authentication tested and verified

### Frontend Status
- ✅ React + Vite + TypeScript application running
- ✅ Tailwind CSS v4 configured with @tailwindcss/postcss
- ✅ shadcn/ui components implemented
- ✅ React Router DOM with protected routes
- ✅ Axios API service with JWT interceptors
- ✅ Authentication context provider
- ✅ Login page with form validation
- ✅ Dashboard page with user information
- ✅ Protected route wrapper component
- ✅ Full authentication flow working

### Testing Results
**Backend Login Test**: ✅ SUCCESS
- POST /auth/login returns valid JWT token
- Token type: bearer

**Backend Protected Endpoint Test**: ✅ SUCCESS
- GET /auth/me with JWT authentication
- Returns user data correctly
- JWT validation working

**Frontend Authentication Flow**: ✅ SUCCESS
- Login page redirects to dashboard on success
- Protected routes redirect to login when not authenticated
- Logout clears token and redirects to login
- User information displayed correctly on dashboard

**Next Milestone**: Sprint 1.2 - CRUD Recipients implementation

**Sprint 1.1 Achievements**: ✅ COMPLETED
- Full-stack authentication working
- Database schema with PostGIS support
- 10 tables created with proper relationships
- 4 Alembic migrations applied
- Regional hierarchy simplified (2-level instead of 4-level)
- Jabodetabek regional data seeded
- Seed scripts created for reproducible data population
- Verification scripts for data validation

**Sprint 1.2 Achievements**: ✅ COMPLETED
- Backend: 9 RESTful API endpoints (7 recipient + 2 region)
- Backend: Repository pattern with RecipientRepository
- Backend: 35/35 tests passing, 90.93% code coverage
- Frontend: Complete recipient list page with table
- Frontend: Advanced filtering (status, province, city)
- Frontend: 6 sortable columns with visual indicators
- Frontend: Pagination (10/30/50/100 per page)
- Frontend: Bulk operations with confirmation dialogs
- Frontend: Sidebar navigation with collapsible menu
- Frontend: StatusBadge component for color-coded statuses
- Frontend: Toast notifications for user feedback
- Bug Fixes: CORS UUID type mismatch, Select dropdown display issues
- New Files: 8 backend files (API, schemas, repository, tests), 7 frontend files (pages, components, services, types)

**Sprint 2.1 Achievements**: ✅ COMPLETED
- Backend: 6 courier API endpoints (GET, POST, PUT, DELETE, bulk delete)
- Backend: CourierRepository with full CRUD operations
- Backend: 42/42 tests passing (19 repository + 23 API)
- Backend: 98.51% API coverage, 100% repository coverage
- Backend: Phone number uniqueness validation
- Frontend: CourierList page (search, sort, pagination, delete)
- Frontend: CourierForm page (dual-mode: create & edit)
- Frontend: Client-side validation (required, length, format)
- Frontend: Server-side error handling (duplicate phone detection)
- Frontend: Loading states & toast notifications
- Frontend: Routes: /couriers, /couriers/new, /couriers/:id/edit
- New Files: 5 backend files (API, repository, schema, tests, seed), 4 frontend files (types, service, pages)

**Roadmap Restructure**: ✅ COMPLETED
- **Phase 2A (Priority 1)**: Assignment Creation Flow
  - Sprint 2A.1: Route Optimization Backend (5 days)
  - Sprint 2A.2: Wizard Step 1 - Recipient Selection & Map (5 days)
  - Sprint 2A.3: Wizard Step 2 - Courier Selection (3 days)
  - Sprint 2A.4: Wizard Step 3 - Preview & Drag-Drop (5 days)
  - Sprint 2A.5: Finalization & Save (2 days)
- **Phase 2B (Priority 2)**: Assignment Management (CRUD)
  - Sprint 2B.1: Assignment List & Detail (3 days)
  - Sprint 2B.2: Assignment Edit & Status (3 days)
  - Sprint 2B.3: Assignment Actions (Delete, WhatsApp) (2 days)
- **Phase 3**: Polish & Testing (5 days)
- **Phase 4**: Containerization & Deployment (5 days)

**Development Strategy**: 
- Phase 1-3: Local development with environment-based configuration
- Phase 4: Containerization and deployment
- All code is container-ready (no hardcoded values, environment-based config)
- **New Focus**: Complete assignment creation flow before CRUD operations
