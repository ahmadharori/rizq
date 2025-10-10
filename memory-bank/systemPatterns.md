# System Patterns

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│              (React + Vite + Tailwind)                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS REST API
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend - FastAPI                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │         API Layer (Routers)                      │   │
│  │   /auth  /recipients  /couriers  /assignments    │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │      Business Logic (Services)                   │   │
│  │  - RecipientService                              │   │
│  │  - AssignmentService                             │   │
│  │  - OptimizationService (CVRP/TSP)                │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │      Data Access Layer (Repositories)            │   │
│  │             SQLAlchemy ORM                       │   │
│  └─────────────────┬────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL + PostGIS                       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────┐
│         External Services           │
│  - Google Maps APIs                 │
│  - Google OR-Tools                  │
│  - WhatsApp (Deep Links)            │
└─────────────────────────────────────┘
```

### Layered Architecture

**Presentation Layer (Frontend)**
- React components
- State management (Context API)
- API service layer
- UI component library (shadcn/ui)

**API Layer (Backend)**
- FastAPI routers
- Request/response validation (Pydantic)
- Authentication middleware (JWT)
- Error handling

**Business Logic Layer**
- Service classes (pure business logic)
- Optimization algorithms (CVRP, TSP)
- Status state machine
- Business rules validation

**Data Access Layer**
- Repository pattern
- SQLAlchemy ORM models
- Database transactions
- Query optimization

**Data Layer**
- PostgreSQL with PostGIS extension
- Spatial indexing
- Audit trails (status_history)

## Key Design Patterns

### 1. Repository Pattern
**Purpose**: Abstract data access logic from business logic

```python
class RecipientRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, id: UUID) -> Recipient:
        return self.db.query(Recipient).filter(Recipient.id == id).first()
    
    def get_all(self, filters: dict, pagination: dict) -> List[Recipient]:
        query = self.db.query(Recipient)
        # Apply filters, pagination
        return query.all()
```

### 2. Service Layer Pattern
**Purpose**: Encapsulate business logic separate from API layer

```python
class AssignmentService:
    def __init__(self, repo: AssignmentRepository, optimizer: OptimizationService):
        self.repo = repo
        self.optimizer = optimizer
    
    def create_assignment(self, data: AssignmentCreate) -> Assignment:
        # Business logic: validate, optimize, create
        optimized_route = self.optimizer.optimize_route(data.recipients)
        assignment = self.repo.create(data, optimized_route)
        self._update_recipient_statuses(assignment.recipients)
        return assignment
```

### 3. State Machine Pattern
**Purpose**: Manage recipient status transitions with validation

```python
class RecipientStateMachine:
    TRANSITIONS = {
        'Unassigned': ['Assigned'],
        'Assigned': ['Delivery', 'Unassigned'],
        'Delivery': ['Done', 'Return', 'Unassigned'],
        'Return': ['Delivery', 'Unassigned'],
        'Done': []  # Terminal state
    }
    
    def can_transition(self, from_status: str, to_status: str) -> bool:
        return to_status in self.TRANSITIONS.get(from_status, [])
```

### 4. Strategy Pattern (Optimization Modes)
**Purpose**: Switch between Manual and Rekomendasi optimization strategies

```python
class OptimizationStrategy(ABC):
    @abstractmethod
    def optimize(self, recipients, couriers, config) -> List[Assignment]:
        pass

class ManualTSPStrategy(OptimizationStrategy):
    def optimize(self, recipients, couriers, config):
        # User-defined clusters + TSP per cluster
        pass

class CVRPStrategy(OptimizationStrategy):
    def optimize(self, recipients, couriers, config):
        # Full CVRP with OR-Tools
        pass
```

### 5. Facade Pattern (Maps Service)
**Purpose**: Simplify Google Maps API interactions

```python
class MapsService:
    def __init__(self, api_key: str):
        self.client = googlemaps.Client(key=api_key)
    
    def optimize_route(self, waypoints: List[Location]) -> RouteData:
        # Abstracts Routes API complexity
        pass
    
    def geocode(self, address: str) -> Location:
        # Abstracts Geocoding API
        pass
```

## Component Relationships

### Data Flow: Assignment Creation (Rekomendasi Mode)

```
1. User (Frontend)
   ↓ POST /assignments/optimize {mode: 'cvrp', recipients, capacity}
2. AssignmentRouter
   ↓ validate request
3. AssignmentService.create_optimized_assignment()
   ↓ call optimizer
4. OptimizationService.run_cvrp()
   ↓ prepare distance matrix
5. MapsService.get_distance_matrix()
   ↓ Google Routes API call
6. MapsService returns distances
   ↓
7. OptimizationService.solve_cvrp_with_ortools()
   ↓ OR-Tools solver
8. Returns optimized clusters + sequences
   ↓
9. OptimizationService.calculate_routes_for_clusters()
   ↓ TSP for each cluster
10. MapsService.optimize_route() for each
    ↓ Google Routes API
11. Returns complete route data (polylines, distances)
    ↓
12. AssignmentService creates preview response
    ↓ JSON response
13. Frontend displays preview
    ↓ User confirms
14. POST /assignments {assignments with route_data}
    ↓
15. AssignmentRepository.create_bulk()
    ↓ Database transaction
16. Update recipient statuses
    ↓
17. Return success
```

### Map-Table Synchronization Pattern

```javascript
// Two-way binding pattern
const MapTableSync = () => {
  const [hoveredRecipientId, setHoveredRecipientId] = useState(null);
  
  // Table → Map
  const handleTableRowHover = (recipientId) => {
    setHoveredRecipientId(recipientId);
    highlightMarker(recipientId);
  };
  
  // Map → Table
  const handleMarkerClick = (recipientId) => {
    scrollToRow(recipientId);
    flashRowHighlight(recipientId);
  };
  
  return (
    <>
      <MapView hoveredId={hoveredRecipientId} onMarkerClick={handleMarkerClick} />
      <Table onRowHover={handleTableRowHover} highlightedId={hoveredRecipientId} />
    </>
  );
};
```

## Critical Implementation Paths

### Path 1: CVRP Optimization Algorithm

```python
def solve_cvrp(recipients, num_couriers, capacity, depot):
    """
    Critical path for Rekomendasi mode
    Performance target: <60s for 100 recipients
    """
    # 1. Build distance matrix (Google Routes API)
    distance_matrix = get_distance_matrix(depot, recipients)
    
    # 2. Create OR-Tools data model
    data = {
        'distance_matrix': distance_matrix,
        'num_vehicles': num_couriers,
        'depot': 0,
        'demands': [r.num_packages for r in recipients],
        'vehicle_capacities': [capacity] * num_couriers
    }
    
    # 3. Configure routing model
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'],
                                           data['depot'])
    routing = pywrapcp.RoutingModel(manager)
    
    # 4. Add capacity constraint
    def demand_callback(from_index):
        return data['demands'][manager.IndexToNode(from_index)]
    
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index, 0, data['vehicle_capacities'],
        True, 'Capacity')
    
    # 5. Set distance cost
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # 6. Solve with time limit
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.time_limit.seconds = 60
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    
    solution = routing.SolveWithParameters(search_parameters)
    
    # 7. Extract routes
    if solution:
        return extract_routes(manager, routing, solution, recipients)
    else:
        raise NoFeasibleSolutionError("CVRP could not find solution")
```

### Path 2: State Transition Validation

```python
def update_recipient_status(recipient_id, new_status, admin_id):
    """
    Critical path for status tracking
    Must maintain data integrity
    """
    recipient = get_recipient(recipient_id)
    old_status = recipient.status
    
    # Validate transition
    if not state_machine.can_transition(old_status, new_status):
        raise InvalidTransitionError(
            f"Cannot transition from {old_status} to {new_status}"
        )
    
    # Begin transaction
    with db.begin():
        # Update recipient
        recipient.status = new_status
        recipient.updated_at = datetime.utcnow()
        db.flush()
        
        # Create audit record
        history = StatusHistory(
            recipient_id=recipient_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=admin_id,
            changed_at=datetime.utcnow()
        )
        db.add(history)
        db.commit()
    
    return recipient
```

### Path 3: WhatsApp Message Generation

```javascript
function generateWhatsAppMessage(assignment) {
  const recipients = assignment.recipients.sort((a, b) => 
    a.sequence_order - b.sequence_order
  );
  
  let message = `*Daftar Penerima - ${assignment.name}*\n\n`;
  
  recipients.forEach((recipient, index) => {
    message += `${index + 1}. ${recipient.name}\n`;
    message += `📱 ${recipient.phone}\n`;
    message += `📍 ${recipient.address}\n`;
    message += `${recipient.village}, ${recipient.district}, ${recipient.city}, ${recipient.province}\n`;
    message += `🗺️ https://maps.google.com/?q=${recipient.location.lat},${recipient.location.lng}\n\n`;
  });
  
  // Add route URL
  const routeUrl = generateGoogleMapsRouteUrl(assignment);
  message += `---\n📍 *Rute Lengkap:*\n${routeUrl}\n\n`;
  
  // Add summary
  message += `Total: ${recipients.length} penerima\n`;
  message += `Jarak: ${(assignment.total_distance_meters / 1000).toFixed(1)} km\n`;
  message += `Estimasi: ${Math.round(assignment.total_duration_seconds / 60)} menit`;
  
  return encodeURIComponent(message);
}
```

## Design Decisions

### Decision 1: Open VRP (No Return to Depot)
**Rationale**: Couriers typically end routes at their homes, not warehouse
**Impact**: Simplifies algorithm, more realistic for use case

### Decision 2: Soft Delete Pattern
**Rationale**: Maintain audit trail, allow data recovery
**Implementation**: `is_deleted` boolean flag, filter in queries

### Decision 3: No Real-time State on Backend
**Rationale**: Polling-based updates sufficient for MVP
**Trade-off**: Future may need WebSocket for real-time features

### Decision 4: Embedded Route Data (JSONB)
**Rationale**: Avoid complex joins, fast reads, flexible schema
**Trade-off**: Slightly denormalized, but acceptable for read-heavy use case

### Decision 5: Client-side Map Rendering
**Rationale**: Rich interaction, no server load for maps
**Trade-off**: Google Maps API quota usage, but cached well

## Performance Considerations

### Database Indexes
```sql
-- Critical indexes for query performance
CREATE INDEX idx_recipients_status ON recipients(status) WHERE is_deleted = false;
CREATE INDEX idx_recipients_location ON recipients USING GIST(location);
CREATE INDEX idx_assignment_recipients_assignment ON assignment_recipients(assignment_id);
CREATE INDEX idx_status_history_recipient ON status_history(recipient_id);
```

### Caching Strategy
- **Geocoding results**: Cache address → coordinates (Redis future)
- **Regional data**: In-memory cache (rarely changes)
- **Distance matrix**: Cache for common depot-recipient pairs

### Optimization Timeouts
- TSP (25 waypoints): 5 second timeout
- CVRP (100 recipients): 60 second timeout
- Progress indicator shown to user during computation

## Error Handling Patterns

### Backend Error Hierarchy
```python
class RizqException(Exception):
    """Base exception"""
    pass

class ValidationError(RizqException):
    """Input validation failed"""
    pass

class NoFeasibleSolutionError(RizqException):
    """CVRP/TSP has no solution"""
    pass

class InvalidTransitionError(RizqException):
    """State machine transition invalid"""
    pass
```

### Frontend Error Strategy
- **Network errors**: Retry with exponential backoff
- **Validation errors**: Show field-level messages
- **Optimization timeout**: Offer to retry with fewer recipients
- **Maps API failures**: Graceful degradation (show table only)
