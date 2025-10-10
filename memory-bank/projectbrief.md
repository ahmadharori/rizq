# Project Brief

## Project Name
**RizQ** - Sembako Delivery Assignment Dashboard

## Version
1.0 (Draft - January 10, 2025)

## Core Purpose
RizQ is a web-based dashboard designed to optimize sembako (basic necessities) package delivery through intelligent route planning and assignment management. The system replaces manual, time-consuming assignment processes with automated optimization algorithms.

## Problem Statement

### Current Pain Points
- **Manual clustering**: Assignment based on administrative cities (e.g., "all Jakarta Selatan together") ignores actual geographic distances
- **Time waste**: Manual planning takes 1.5-2 hours per session
- **Inefficient routes**: Results in longer distances, wasted fuel, and courier fatigue
- **Poor tracking**: No systematic way to track delivery status or maintain audit trails
- **Coordination overhead**: Manual WhatsApp coordination with multiple couriers is error-prone

### Impact of Current Approach
- Suboptimal routes (estimated 15%+ unnecessary distance)
- Resource waste (time, fuel, personnel)
- Missed efficiency at city boundaries (nearby points in different cities get separated)

## Proposed Solution

### Core Innovation
Use **Capacitated Vehicle Routing Problem (CVRP)** algorithms powered by Google OR-Tools and Google Routes API to:
- Generate optimal clustering based on actual geographic distance
- Respect courier capacity constraints
- Optimize delivery sequences using Traveling Salesman Problem (TSP)
- Provide flexibility for manual overrides when needed
- Consider real-time traffic via Google Routes API

### Key Features (Phase 1 - MVP)
1. **Recipient Management**: Full CRUD with geographic data and status tracking
2. **Courier Management**: Manage delivery personnel
3. **Smart Assignment Creation**: 
   - **Manual Mode**: User creates clusters, system optimizes sequence
   - **Rekomendasi Mode**: Full automation with CVRP
4. **Interactive Visualization**: Google Maps integration with marker-table synchronization
5. **Status Tracking**: State machine-based delivery workflow
6. **WhatsApp Integration**: One-click sharing of route details to couriers

## Success Criteria

### Quantitative Targets
- **Time savings**: Reduce planning from 2 hours → <10 minutes (>85% reduction)
- **Distance optimization**: >15% reduction in total delivery distance
- **User adoption**: >90% of admin team using the system
- **Accuracy**: <5% of assignments need manual adjustments
- **Uptime**: >99.5% system availability
- **Satisfaction**: >4.5/5.0 user rating

### Qualitative Goals
- Intuitive UI that requires minimal training
- Confidence in algorithm recommendations
- Flexibility to override when needed
- Clear audit trail for accountability

## Scope Boundaries

### In Scope (Phase 1)
✅ CRUD operations for recipients, couriers, assignments
✅ Two-mode assignment creation (Manual + Rekomendasi/CVRP)
✅ Route optimization (TSP + CVRP)
✅ Google Maps visualization
✅ Status workflow management
✅ WhatsApp integration (deep linking)
✅ Admin authentication
✅ Indonesian regional data management

### Out of Scope (Phase 1)
❌ Mobile app for drivers
❌ Real-time GPS tracking
❌ Multi-depot support
❌ Time window constraints
❌ Payment/invoicing
❌ Advanced analytics dashboards
❌ Multi-language support

## Primary Users

**Admin/Dispatcher**
- Role: Coordinates sembako distribution operations
- Tech level: Medium (comfortable with web apps, Google Maps)
- Usage: 1-3 times daily
- Environment: Desktop/laptop in office/warehouse
- Team size: Manages 5-20 couriers per shift

## Technical Stack

### Backend
- FastAPI (Python 3.10+)
- PostgreSQL 14+ with PostGIS
- SQLAlchemy 2.0 ORM
- Google OR-Tools (optimization)
- Google Routes API

### Frontend
- React 18+ with Vite
- Tailwind CSS + shadcn/ui
- @react-google-maps/api
- React Beautiful DnD (drag & drop)

### Infrastructure
- Docker + Docker Compose
- JWT authentication
- HTTPS deployment

## Timeline
**9-week development cycle** divided into 6 phases:
1. Foundation & Auth (Week 1-2)
2. Core Features (Week 3-4)
3. Assignment Wizard (Week 5-6)
4. Assignment Management (Week 7)
5. Polish & Testing (Week 8)
6. Deployment & Handover (Week 9)

## Key Constraints

### Technical
- Single depot operation (hardcoded location in Phase 1)
- No return to depot required (open VRP)
- Indonesian addresses and phone numbers only
- Google Maps API quota management
- CVRP optimization timeout: <60 seconds for 100 recipients

### Business
- Budget for Google Maps Platform usage (~$77.5/month estimated)
- Desktop-first (mobile support secondary)
- Same-day deliveries only
- All couriers start from depot simultaneously

## Critical Success Factors
1. **User trust in algorithms**: Show comparison data, allow overrides
2. **Performance**: Fast optimization (<60s for CVRP)
3. **Usability**: Follow Schneiderman's 8 Golden Rules
4. **Reliability**: Automated backups, error handling
5. **Training**: Comprehensive admin training and documentation

## Definition of Done (MVP)
- All Phase 1 features implemented and tested
- >80% test coverage
- User documentation complete
- Admin training conducted
- System deployed to production
- Support plan in place
- All success metrics baseline established
