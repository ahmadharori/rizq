# Active Context

## Current Status

**Project Phase**: Phase 1 - Foundation & Auth (IN PROGRESS)
**Date**: October 10, 2025 - 15:40 WIB
**Stage**: Sprint 1.1 - Backend & Frontend Setup Complete ✅

The RizQ project has completed both backend and frontend setup with full-stack authentication system working end-to-end. Backend API is running at http://localhost:8000 and frontend at http://localhost:5173 with JWT authentication fully functional.

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
   - shadcn/ui components created (Button, Input, Label, Card)
   - React Router DOM with protected routes
   - Axios API service with JWT interceptors
   - Authentication context provider
   - Login and Dashboard pages
   - Full authentication flow working

### Next Tasks
7. ⏳ Docker Compose configuration
8. ⏳ Database schema for recipients, couriers, assignments
9. ⏳ Seed regional data (provinces, cities, districts, villages)

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
- Docker-based development environment
- **Status**: Planning phase

**Decision 3: Depot Location**
- Hardcoded depot location for Phase 1 MVP
- Future enhancement: configurable multi-depot
- **Coordinates**: To be determined based on actual warehouse location
- **Status**: Pending client input

## Next Steps

### Immediate (Week 1)
1. Set up development environment
   - Initialize Git repository
   - Create Docker Compose configuration
   - Set up PostgreSQL + PostGIS database
   - Configure backend (FastAPI project structure)
   - Configure frontend (React + Vite + Tailwind)

2. Project scaffolding
   - Backend folder structure (routers, services, models)
   - Frontend folder structure (components, features, services)
   - Environment configuration (.env files)
   - Database schema creation (Alembic migrations)

3. Regional data preparation
   - Source Indonesian regional data (provinces, cities, districts, villages)
   - Create seed scripts for database population
   - Validate data completeness

### Short-term (Weeks 1-2)
- Implement authentication system (JWT)
- Create user management (admin accounts)
- Set up protected routes
- Build basic layout (header, sidebar, routing)
- Implement login/logout flow

### Medium-term (Weeks 3-4)
- CRUD Recipients with geographic data
- CRUD Couriers
- Google Maps integration
- Regional data dropdowns (cascading)
- Basic assignment viewing

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

**Development Setup**: ✅ Full Stack Complete
**Database**: ✅ PostgreSQL running, rizq_db created
**Version Control**: ✅ Git initialized
**Backend Server**: ✅ Running at http://localhost:8000
**Frontend Server**: ✅ Running at http://localhost:5173
**API Documentation**: ✅ Available at http://localhost:8000/docs

### Backend Status
- ✅ FastAPI application running successfully
- ✅ PostgreSQL database connected
- ✅ User table created via Alembic migration
- ✅ Admin user seeded (username: admin, password: admin123!)
- ✅ JWT authentication working
- ✅ Bcrypt password hashing implemented
- ✅ API endpoints functional: /auth/login, /auth/me, /health
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

**Next Milestone**: Docker Compose configuration + Database schema for recipients, couriers, assignments
