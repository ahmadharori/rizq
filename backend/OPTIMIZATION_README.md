# Route Optimization Backend - Implementation Guide

## Overview

This document provides a comprehensive guide to the Route Optimization Backend implementation using Google OR-Tools and Google Distance Matrix API.

## Architecture

### Components

1. **distance_service.py** - Google Distance Matrix API integration
2. **optimization_service.py** - OR-Tools TSP and CVRP solvers
3. **optimization.py** (API) - FastAPI endpoints for optimization
4. **optimization.py** (schemas) - Request/response Pydantic models

### Technology Stack

- **Google OR-Tools 9.14+**: Constraint programming solver for CVRP/TSP
- **Google Maps Distance Matrix API**: Real distance and duration calculations
- **FastAPI**: RESTful API framework
- **Shapely**: Geometry operations for PostGIS integration

## API Endpoints

### 1. TSP Optimization (Manual Mode)

**Endpoint**: `POST /api/v1/optimize/tsp`

**Use Case**: When user has already grouped recipients and needs optimal visiting sequence for a single courier.

**Request**:
```json
{
  "recipient_ids": ["uuid1", "uuid2", "uuid3"],
  "depot_location": {
    "lat": -6.200000,
    "lng": 106.816666
  },
  "timeout_seconds": 5
}
```

**Response**:
```json
{
  "optimized_sequence": ["uuid2", "uuid1", "uuid3"],
  "total_distance_meters": 15420,
  "total_duration_seconds": 2340,
  "num_stops": 3
}
```

**Performance**: Target <5 seconds for up to 25 recipients

### 2. CVRP Optimization (Rekomendasi Mode)

**Endpoint**: `POST /api/v1/optimize/cvrp`

**Use Case**: System automatically distributes recipients to multiple couriers based on capacity constraints.

**Request**:
```json
{
  "recipient_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
  "num_couriers": 2,
  "capacity_per_courier": 20,
  "depot_location": {
    "lat": -6.200000,
    "lng": 106.816666
  },
  "timeout_seconds": 60
}
```

**Response**:
```json
{
  "routes": [
    {
      "courier_index": 0,
      "recipient_sequence": ["uuid1", "uuid2"],
      "num_stops": 2,
      "total_load": 8,
      "total_distance_meters": 7500,
      "total_duration_seconds": 1200
    },
    {
      "courier_index": 1,
      "recipient_sequence": ["uuid3", "uuid4", "uuid5"],
      "num_stops": 3,
      "total_load": 12,
      "total_distance_meters": 9200,
      "total_duration_seconds": 1580
    }
  ],
  "num_routes": 2,
  "total_distance_meters": 16700,
  "total_duration_seconds": 2780,
  "total_recipients": 5
}
```

**Performance**: Target <60 seconds for up to 100 recipients

## Configuration

### Environment Variables

```env
# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-api-key-here

# Depot Configuration (hardcoded for MVP)
DEPOT_LAT=-6.200000
DEPOT_LNG=106.816666
DEPOT_NAME=Warehouse Jakarta Pusat

# Optimization Timeouts
TSP_TIMEOUT_SECONDS=5
CVRP_TIMEOUT_SECONDS=60
```

### Depot Location

For MVP, depot location is hardcoded in config but environment-based:
- **Default**: Jakarta Pusat (-6.200000, 106.816666)
- **Configurable**: Via environment variables
- **Future**: Multi-depot support in Phase 2

## Algorithm Details

### TSP (Traveling Salesman Problem)

**Algorithm**: OR-Tools Routing with GUIDED_LOCAL_SEARCH

**Key Parameters**:
- `num_vehicles`: 1 (single courier)
- `first_solution_strategy`: PATH_CHEAPEST_ARC
- `local_search_metaheuristic`: GUIDED_LOCAL_SEARCH
- `time_limit`: 5 seconds (configurable)

**Process**:
1. Build distance matrix (depot + recipients)
2. Combine distance & duration (50/50 weight)
3. Create routing model with depot at index 0
4. Solve with timeout
5. Extract optimized sequence

### CVRP (Capacitated Vehicle Routing Problem)

**Algorithm**: OR-Tools Routing with Capacity Constraints

**Key Parameters**:
- `num_vehicles`: User-specified number of couriers
- `vehicle_capacities`: Maximum packages per courier
- `demands`: Packages per recipient
- `depot`: Index 0 (all couriers start here)
- `time_limit`: 60 seconds (configurable)

**Process**:
1. Build distance matrix (depot + recipients)
2. Extract demands from recipient.num_packages
3. Validate feasibility (total demand <= total capacity)
4. Create routing model with capacity dimension
5. Solve with timeout
6. Extract routes per courier

**Constraints**:
- Each courier has maximum capacity
- All couriers start from depot
- No return to depot required (Open VRP)
- Each recipient visited exactly once

## Distance Matrix API Integration

### Google Distance Matrix API

**Purpose**: Calculate real-world distances and durations considering traffic

**Features**:
- Multiple origins & destinations in single request
- Real-time traffic data (departure_time="now")
- Traffic models: best_guess, pessimistic, optimistic
- Travel mode: driving (default)

**Cost Calculation**:
```python
combined_cost = (distance_weight * distance_km * 100) + 
                (duration_weight * duration_min * 100)
```

**Default Weights**: 50% distance, 50% duration

### Error Handling

- API failures: Retry logic (future)
- Unreachable locations: Use large cost value (999999)
- Rate limits: Handled by googlemaps client
- Timeout: Configurable per request

## Testing

### Integration Tests

**File**: `tests/test_optimization_api.py`

**Test Coverage**:
- TSP success with 3 recipients
- TSP with custom depot location
- TSP with empty recipients (validation)
- TSP with invalid recipient ID
- TSP unauthorized access
- CVRP success with 5 recipients, 2 couriers
- CVRP insufficient capacity (error handling)
- CVRP single courier (TSP-like)
- CVRP invalid parameters
- CVRP unauthorized access

**Mocking Strategy**:
- Google Distance Matrix API mocked with synthetic data
- Test recipients created in database
- Distance matrix based on index difference

**Run Tests**:
```bash
cd backend
python -m pytest tests/test_optimization_api.py -v
```

## Performance Optimization

### Current Performance

- **TSP**: <5 seconds for 25 recipients (target met)
- **CVRP**: <60 seconds for 100 recipients (estimated)

### Future Optimizations

1. **Caching**: Cache distance matrices for common depot-recipient pairs
2. **Parallel Processing**: Run multiple CVRP solvers in parallel
3. **Incremental Solving**: Warm-start from previous solutions
4. **Redis**: Cache Google API responses

## Error Scenarios

### 1. No Feasible Solution

**TSP**: "No solution found for TSP. Try reducing the number of recipients."

**CVRP**: "No solution found for CVRP. Try increasing capacity or number of couriers."

**Causes**:
- Timeout exceeded
- Infeasible constraints
- Unreachable locations

### 2. Insufficient Capacity

**Error**: "Infeasible: total demand (25) exceeds total capacity (20)"

**Solution**: Increase capacity_per_courier or num_couriers

### 3. Google API Failures

**Errors**:
- "Google Maps API error: OVER_QUERY_LIMIT"
- "Google Maps API error: REQUEST_DENIED"
- "Google Maps API error: INVALID_REQUEST"

**Handling**: Logged and returned as 500 error with detail

## Usage Examples

### Example 1: Optimize Route for 3 Recipients (TSP)

```bash
curl -X POST http://localhost:8000/api/v1/optimize/tsp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_ids": [
      "123e4567-e89b-12d3-a456-426614174001",
      "123e4567-e89b-12d3-a456-426614174002",
      "123e4567-e89b-12d3-a456-426614174003"
    ],
    "timeout_seconds": 5
  }'
```

### Example 2: Distribute 10 Recipients to 2 Couriers (CVRP)

```bash
curl -X POST http://localhost:8000/api/v1/optimize/cvrp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_ids": [
      "uuid1", "uuid2", "uuid3", "uuid4", "uuid5",
      "uuid6", "uuid7", "uuid8", "uuid9", "uuid10"
    ],
    "num_couriers": 2,
    "capacity_per_courier": 30,
    "timeout_seconds": 30
  }'
```

## Files Created

### Backend

1. **app/services/distance_service.py** - Google Distance Matrix API wrapper
2. **app/services/optimization_service.py** - TSP & CVRP solvers
3. **app/api/optimization.py** - FastAPI endpoints
4. **app/schemas/optimization.py** - Pydantic schemas
5. **app/config.py** - Updated with depot and timeout configs
6. **app/main.py** - Registered optimization router

### Tests

1. **tests/test_optimization_api.py** - Integration tests (10 test cases)

### Dependencies

1. **requirements.txt** - Added ortools, googlemaps, shapely

## Next Steps

### Sprint 2A.2: Assignment Wizard - Step 1
- Google Maps React integration
- Recipient selection with map visualization
- Mode toggle (All vs Kabupaten/Kota)
- Marker clustering

### Future Enhancements
- Performance benchmarking with 50-100 recipients
- Caching layer (Redis)
- WebSocket for real-time progress updates
- Multi-depot support

## References

- [Google OR-Tools Documentation](https://developers.google.com/optimization)
- [Google Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
- [CVRP Wikipedia](https://en.wikipedia.org/wiki/Vehicle_routing_problem)
- [TSP Wikipedia](https://en.wikipedia.org/wiki/Travelling_salesman_problem)

## Support

For issues or questions, contact the development team or refer to:
- API Documentation: http://localhost:8000/docs
- Memory Bank: memory-bank/activeContext.md
