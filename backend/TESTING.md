# 📚 Dokumentasi Testing - Rizq Backend

> **Dokumentasi Lengkap Skenario Testing untuk Backend Rizq**
> 
> Versi: 1.0  
> Terakhir diperbarui: 4 November 2025

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Arsitektur Testing](#arsitektur-testing)
3. [Test Coverage Matrix](#test-coverage-matrix)
4. [Detailed Test Scenarios](#detailed-test-scenarios)
5. [Cara Menjalankan Tests](#cara-menjalankan-tests)
6. [Best Practices](#best-practices)
7. [Maintenance & Updates](#maintenance--updates)

---

## Overview

### 🎯 Tujuan Testing

Testing suite ini dirancang untuk memastikan:
- **Reliability**: Semua fitur berfungsi sesuai spesifikasi
- **Regression Prevention**: Perubahan code tidak merusak fitur existing
- **API Compatibility**: Routes API v2 integration bekerja dengan baik
- **Performance**: Cache layer dan optimization service optimal

### 🛠 Technology Stack

- **Test Framework**: pytest 7.4+
- **Test Client**: FastAPI TestClient
- **Database**: PostgreSQL dengan PostGIS (test database)
- **Mocking**: unittest.mock
- **Coverage**: pytest-cov

### 📊 Test Statistics

| Category | Files | Test Cases | Coverage |
|----------|-------|------------|----------|
| Service Layer | 2 | 30+ | Routes API, Cache |
| Repository Layer | 2 | 35+ | Courier, Recipient |
| API Layer | 3 | 40+ | CRUD, Optimization |
| Utilities | 1 | 5 | Profiler |
| Manual Scripts | 1 | 4 scenarios | Routes API |
| **TOTAL** | **9** | **110+** | **Comprehensive** |

---

## Arsitektur Testing

### 🏗 Struktur Testing Layers

```
┌─────────────────────────────────────────┐
│         API Layer Tests                 │
│  (Integration: Endpoints + Auth)        │
├─────────────────────────────────────────┤
│       Repository Layer Tests            │
│  (Unit: Database Operations)            │
├─────────────────────────────────────────┤
│        Service Layer Tests              │
│  (Unit: Business Logic)                 │
├─────────────────────────────────────────┤
│         Utility Tests                   │
│  (Unit: Helper Functions)               │
└─────────────────────────────────────────┘
```

### 📁 Struktur Direktori

```
backend/tests/
├── __init__.py                      # Test package initialization
├── conftest.py                       # Shared fixtures & configuration
│
├── test_cache_service.py            # ✅ Cache layer (2-layer Redis)
├── test_routes_api_service.py       # ✅ Routes API v2 integration
├── test_optimization_api.py         # ✅ TSP & CVRP endpoints
│
├── test_recipients_api.py           # ✅ Recipient CRUD API
├── test_recipient_repository.py     # ✅ Recipient repository
│
├── test_couriers_api.py             # ✅ Courier CRUD API
├── test_courier_repository.py       # ✅ Courier repository
│
├── test_profiler.py                 # ✅ Performance profiler
│
└── test_routes_api.py               # 🔧 Manual test script
```

---

## Test Coverage Matrix

### ✅ Status Relevansi setelah Routes API Migration

| Test File | Status | Perlu Update? | Keterangan |
|-----------|--------|---------------|------------|
| `test_cache_service.py` | ✅ **RELEVAN** | ❌ Tidak | Mendukung Routes API dengan baik |
| `test_routes_api_service.py` | ✅ **CORE TEST** | ❌ Tidak | Test khusus untuk Routes API v2 |
| `test_optimization_api.py` | ✅ **RELEVAN** | ✅ **SUDAH UPDATED** | Mock sudah menggunakan Routes API |
| `test_recipients_api.py` | ✅ **RELEVAN** | ❌ Tidak | Tidak terkait routing API |
| `test_recipient_repository.py` | ✅ **RELEVAN** | ❌ Tidak | Tidak terkait routing API |
| `test_couriers_api.py` | ✅ **RELEVAN** | ❌ Tidak | Tidak terkait routing API |
| `test_courier_repository.py` | ✅ **RELEVAN** | ❌ Tidak | Tidak terkait routing API |
| `test_profiler.py` | ✅ **RELEVAN** | ❌ Tidak | Independent dari routing API |
| `test_routes_api.py` | ✅ **MANUAL SCRIPT** | ❌ Tidak | Berguna untuk manual testing |

### 🗑 Deprecated Tests

| File | Status | Action | Alasan |
|------|--------|--------|--------|
| `test_recipients.py` | ❌ **DEPRECATED** | **HAPUS** | Redundant dengan `test_recipients_api.py` (pytest version) |

---

## Detailed Test Scenarios

### 1️⃣ Service Layer Tests

#### 📦 `test_cache_service.py` - 2-Layer Redis Caching

**Tujuan**: Menguji cache service yang mendukung Routes API dengan 2-layer caching.

**Coverage**: 14 test scenarios

##### **A. Cache Initialization & Configuration**

```python
✅ test_redis_connection_success()
   - Verifikasi koneksi Redis berhasil
   - Cache service dalam status enabled
```

##### **B. Layer 1: Base Distance Cache**

```python
✅ test_layer1_set_and_get_base_distance()
   - Set base distance ke cache
   - Retrieve cached distance
   - Validasi data integrity

✅ test_layer1_cache_miss()
   - Test behavior saat cache miss
   - Return None untuk data tidak ada

✅ test_layer1_bidirectional_caching()
   - Origin->Dest dan Dest->Origin punya hash berbeda
   - Tidak otomatis cached untuk reverse direction
```

##### **C. Layer 2: Traffic Duration Cache**

```python
✅ test_layer2_set_and_get_traffic_duration()
   - Set traffic duration dengan timestamp
   - Retrieve berdasarkan time bucket

✅ test_layer2_different_time_buckets()
   - Morning vs Evening = cache entry berbeda
   - Time bucket: peak_morning, business, peak_evening, offpeak

✅ test_layer2_different_days_of_week()
   - Friday vs Monday = cache entry berbeda
   - Day-specific caching untuk traffic patterns
```

##### **D. Time Bucketing & Dynamic TTL**

```python
✅ test_time_bucket_peak_morning()
   - 7-9 AM → "peak_morning"

✅ test_time_bucket_business_hours()
   - 10 AM-5 PM → "business"

✅ test_time_bucket_peak_evening()
   - 5-8 PM → "peak_evening"

✅ test_time_bucket_offpeak()
   - 9 PM-6 AM → "offpeak"

✅ test_dynamic_ttl_peak_hours()
   - Peak hours → 15 minutes TTL

✅ test_dynamic_ttl_business_hours()
   - Business hours → 30 minutes TTL

✅ test_dynamic_ttl_offpeak()
   - Off-peak → 60 minutes TTL
```

##### **E. Hash Generation & Statistics**

```python
✅ test_hash_generation_consistency()
   - Hash untuk same origin-dest selalu sama
   - 16 character hash

✅ test_cache_stats_tracking()
   - Track hits, misses, total requests
   - Calculate hit rate percentage
```

##### **F. Integration Tests**

```python
✅ test_full_layer1_workflow()
   - Real Redis connection test
   - Complete cache workflow

✅ test_full_layer2_workflow()
   - Real Redis connection test
   - Traffic duration caching dengan time bucket
```

---

#### 🗺 `test_routes_api_service.py` - Routes API v2 Integration

**Tujuan**: Menguji integrasi dengan Google Routes API v2.

**Coverage**: 15+ test scenarios

##### **A. Service Initialization**

```python
✅ test_initialization_with_api_key()
   - Init dengan API key explicit
   - Cache service otomatis created

✅ test_initialization_without_api_key()
   - Fallback ke settings.GOOGLE_MAPS_API_KEY
```

##### **B. Element Limits & Validation**

```python
✅ test_essentials_mode_element_limit()
   - Max 625 elements untuk Essentials mode

✅ test_pro_mode_element_limit()
   - Max 100 elements untuk Pro mode

✅ test_empty_origins_raises_error()
   - ValueError jika origins kosong

✅ test_empty_destinations_raises_error()
   - ValueError jika destinations kosong
```

##### **C. Distance Calculation**

```python
✅ test_euclidean_distance_same_point()
   - Distance = 0 untuk same point

✅ test_euclidean_distance_calculation()
   - Haversine formula untuk fallback
   - Jakarta-Bogor ~44-45 km
```

##### **D. Cache Integration**

```python
✅ test_cache_hit_essentials_mode()
   - Cache hit returns cached distance
   - Estimated duration = distance / 60 km/h

✅ test_cache_hit_pro_mode()
   - Layer 1 cache: base distance
   - Layer 2 cache: traffic duration

✅ test_cache_miss_calls_api()
   - Cache miss → API call
   - Result stored in cache
```

##### **E. Batching Logic**

```python
✅ test_no_batching_under_limit()
   - 10×10 = 100 elements < 625 → no batching
   - Single request ke API

✅ test_batching_over_limit_essentials()
   - 30×30 = 900 elements > 625 → batching
   - Multiple requests dengan max 625 each

✅ test_batching_over_limit_pro()
   - 15×15 = 225 elements > 100 → batching
   - Multiple requests dengan max 100 each
```

##### **F. API Payload Structure**

```python
✅ test_api_payload_essentials_mode()
   - routingPreference: "TRAFFIC_UNAWARE"
   - Tidak ada departureTime

✅ test_api_payload_pro_mode()
   - routingPreference: "TRAFFIC_AWARE"
   - Ada departureTime (ISO 8601 format)
```

##### **G. Error Handling**

```python
✅ test_api_error_fallback_to_euclidean()
   - API error → fallback ke Haversine distance
   - Status: "FALLBACK"
   - Estimated duration based on distance
```

---

### 2️⃣ API Layer Tests

#### 🎯 `test_optimization_api.py` - TSP & CVRP Optimization

**Tujuan**: Menguji optimization endpoints (TSP & CVRP).

**Coverage**: 12+ test scenarios

##### **A. TSP Endpoint Tests**

```python
✅ test_tsp_success()
   - TSP dengan 3 recipients
   - Return optimized sequence, total distance, duration
   - Mock Routes API untuk distance matrix

✅ test_tsp_with_custom_depot()
   - Custom depot location (lat, lng)
   - Optimized route dari depot

✅ test_tsp_empty_recipients()
   - Empty list → 422 Validation Error

✅ test_tsp_invalid_recipient_id()
   - Non-existent recipient → 400 Bad Request

✅ test_tsp_unauthorized()
   - No auth token → 401 Unauthorized
```

##### **B. CVRP Endpoint Tests**

```python
✅ test_cvrp_success()
   - CVRP dengan 5 recipients, 2 couriers
   - Return multiple routes dengan load balancing
   - Validasi total load per courier

✅ test_cvrp_insufficient_capacity()
   - Total demand > total capacity → 400 Infeasible

✅ test_cvrp_single_courier()
   - 1 courier → similar to TSP
   - Single route returned

✅ test_cvrp_invalid_params()
   - Negative capacity → 422 Validation Error
   - Zero couriers → 422 Validation Error

✅ test_cvrp_unauthorized()
   - No auth token → 401 Unauthorized
```

##### **C. Mock Strategy**

```python
@pytest.fixture
def mock_routes_api():
    """
    Mock Google Routes API response
    - Symmetric distance matrix
    - Distance = |i-j| × 2000 meters
    - Duration = |i-j| × 300 seconds
    """
```

---

#### 📍 `test_recipients_api.py` - Recipient CRUD API

**Tujuan**: Menguji CRUD endpoints untuk Recipients.

**Coverage**: 20+ test scenarios

##### **A. List & Search**

```python
✅ test_get_recipients_list()
   - GET /api/v1/recipients
   - Return items + pagination metadata

✅ test_get_recipients_with_pagination()
   - Page & per_page parameters
   - Correct total_pages calculation

✅ test_get_recipients_with_search()
   - Search by name or address
   - Filtered results

✅ test_get_recipients_with_status_filter()
   - Filter by status (Unassigned, Assigned, etc.)

✅ test_get_recipients_unauthorized()
   - No auth → 401
```

##### **B. Detail**

```python
✅ test_get_recipient_detail()
   - GET /api/v1/recipients/{id}
   - Return full recipient data + province + city

✅ test_get_recipient_detail_not_found()
   - Invalid ID → 404
```

##### **C. Create**

```python
✅ test_create_recipient()
   - POST /api/v1/recipients
   - Default status = "Unassigned"
   - Location stored as PostGIS POINT

✅ test_create_recipient_invalid_data()
   - Invalid phone format → 422

✅ test_create_recipient_missing_fields()
   - Required fields missing → 422
```

##### **D. Update**

```python
✅ test_update_recipient()
   - PUT /api/v1/recipients/{id}
   - Update name, phone, location, num_packages

✅ test_update_recipient_not_found()
   - Invalid ID → 404

✅ test_update_recipient_invalid_status()
   - Status = "Delivery" → 400 (cannot update)
```

##### **E. Delete**

```python
✅ test_delete_recipient()
   - DELETE /api/v1/recipients/{id}
   - Soft delete (is_deleted = True)
   - 204 No Content

✅ test_delete_recipient_not_found()
   - Invalid ID → 404

✅ test_delete_recipient_invalid_status()
   - Status = "Assigned" → 400 (cannot delete)
```

##### **F. Bulk Operations**

```python
✅ test_bulk_delete_recipients()
   - DELETE /api/v1/recipients/bulk/delete
   - Soft delete multiple recipients
   - Return deleted_count

✅ test_bulk_delete_empty_list()
   - Empty IDs array → 422
```

##### **G. Status History**

```python
✅ test_get_recipient_status_history()
   - GET /api/v1/recipients/{id}/history
   - Return status change history

✅ test_get_recipient_history_not_found()
   - Invalid ID → 404
```

---

#### 🚚 `test_couriers_api.py` - Courier CRUD API

**Tujuan**: Menguji CRUD endpoints untuk Couriers.

**Coverage**: 20+ test scenarios

##### **A. List & Search**

```python
✅ test_get_couriers_list()
   - GET /api/v1/couriers
   - Pagination support

✅ test_get_couriers_with_search()
   - Search by name or phone

✅ test_get_couriers_with_pagination()
   - 25 couriers → 3 pages (10 per page)

✅ test_get_couriers_with_sorting()
   - Sort by name asc/desc
```

##### **B. Detail**

```python
✅ test_get_courier_by_id()
   - GET /api/v1/couriers/{id}

✅ test_get_courier_not_found()
   - Invalid ID → 404
```

##### **C. Create**

```python
✅ test_create_courier()
   - POST /api/v1/couriers
   - Return 201 Created

✅ test_create_courier_duplicate_phone()
   - Duplicate phone → 400 Bad Request

✅ test_create_courier_invalid_data()
   - Empty name → 422
```

##### **D. Update**

```python
✅ test_update_courier()
   - PUT /api/v1/couriers/{id}

✅ test_update_courier_phone()
   - Update phone number

✅ test_update_courier_duplicate_phone()
   - Update to existing phone → 400

✅ test_update_courier_not_found()
   - Invalid ID → 404
```

##### **E. Delete**

```python
✅ test_delete_courier()
   - DELETE /api/v1/couriers/{id}
   - Soft delete

✅ test_delete_courier_not_found()
   - Invalid ID → 404
```

##### **F. Bulk Delete**

```python
✅ test_bulk_delete_couriers()
   - DELETE /api/v1/couriers/bulk/delete
   - Soft delete multiple

✅ test_bulk_delete_empty_list()
   - Empty array → 422
```

---

### 3️⃣ Repository Layer Tests

#### 📦 `test_recipient_repository.py` - Recipient Repository

**Tujuan**: Menguji repository layer untuk Recipient CRUD operations.

**Coverage**: 15+ test scenarios

##### **A. Create**

```python
✅ test_create_recipient()
   - Create new recipient
   - Default status = UNASSIGNED
   - is_deleted = False
```

##### **B. Read**

```python
✅ test_get_by_id()
   - Get recipient by ID
   - Include province & city relations

✅ test_get_by_id_not_found()
   - Return None untuk ID tidak ada

✅ test_get_all_with_pagination()
   - Page, per_page support
   - Return (items, total) tuple

✅ test_get_all_with_search()
   - Filter by name or address

✅ test_get_all_with_status_filter()
   - Filter by RecipientStatus enum
```

##### **C. Update**

```python
✅ test_update_recipient()
   - Update fields (name, num_packages, location)

✅ test_update_recipient_not_found()
   - Return None jika tidak ada

✅ test_update_recipient_with_invalid_status()
   - Status DELIVERY/DONE → ValueError
```

##### **D. Delete**

```python
✅ test_delete_recipient()
   - Soft delete (is_deleted = True)
   - Return True

✅ test_delete_recipient_not_found()
   - Return False jika tidak ada

✅ test_delete_recipient_with_invalid_status()
   - Status ASSIGNED/DELIVERY/DONE → ValueError
```

##### **E. Bulk Operations**

```python
✅ test_bulk_delete()
   - Soft delete multiple recipients
   - Return count

✅ test_bulk_delete_skips_invalid_status()
   - Skip recipients with ASSIGNED status
   - Only delete UNASSIGNED
```

##### **F. Utilities**

```python
✅ test_extract_location()
   - Extract lat/lng from PostGIS POINT
   - Return dict {"lat": float, "lng": float}
```

---

#### 🚚 `test_courier_repository.py` - Courier Repository

**Tujuan**: Menguji repository layer untuk Courier CRUD operations.

**Coverage**: 20+ test scenarios

##### **A. Create**

```python
✅ test_create_courier()
   - Create new courier
   - Auto-generate UUID
   - is_deleted = False

✅ test_create_courier_duplicate_phone()
   - Duplicate phone → ValueError
```

##### **B. Read**

```python
✅ test_get_by_id()
   - Get courier by UUID

✅ test_get_by_id_not_found()
   - Return None

✅ test_get_by_id_deleted()
   - Soft-deleted courier not returned

✅ test_get_by_phone()
   - Find by phone number

✅ test_get_by_phone_with_exclude()
   - Exclude specific ID (untuk validation)

✅ test_get_all_no_filters()
   - Get all couriers

✅ test_get_all_with_search()
   - Search by name or phone (ILIKE)

✅ test_get_all_with_pagination()
   - Page 1, 2, ... dengan per_page

✅ test_get_all_with_sorting()
   - Sort by name asc/desc
```

##### **C. Update**

```python
✅ test_update_courier()
   - Update name or phone

✅ test_update_courier_phone()
   - Update phone number

✅ test_update_courier_duplicate_phone()
   - Duplicate → ValueError

✅ test_update_courier_not_found()
   - Return None
```

##### **D. Delete**

```python
✅ test_delete_courier()
   - Soft delete
   - Return True

✅ test_delete_courier_not_found()
   - Return False
```

##### **E. Bulk Operations**

```python
✅ test_bulk_delete()
   - Bulk soft delete
   - Return deleted count

✅ test_bulk_delete_empty_list()
   - Empty list → return 0
```

---

### 4️⃣ Utility Tests

#### ⚡ `test_profiler.py` - Performance Profiler

**Tujuan**: Menguji performance profiling utility.

**Coverage**: 5 test scenarios

```python
✅ test_profiler_basic()
   - Profile single code block
   - Track execution time
   - Return summary

✅ test_profiler_multiple_blocks()
   - Profile multiple blocks
   - Sort by time (descending)
   - Calculate percentages

✅ test_profiler_disabled()
   - Profiler disabled → no overhead
   - summary() returns None

✅ test_profiler_percentages()
   - Percentage calculation accuracy
   - Sum of percentages = 100%

✅ test_profiler_log_summary()
   - log_summary() doesn't raise errors
   - Logging to console
```

---

### 5️⃣ Manual Test Scripts

#### 🔧 `test_routes_api.py` - Manual Routes API Testing

**Tujuan**: Script manual untuk testing Routes API dengan real API calls.

**Coverage**: 4 test scenarios

##### **Test Scenarios**

```python
✅ test_essentials_mode()
   - 2 origins × 3 destinations = 6 elements
   - No traffic (TRAFFIC_UNAWARE)
   - Cache stats tracking

✅ test_pro_mode()
   - 1 origin × 2 destinations = 2 elements
   - With traffic (TRAFFIC_AWARE)
   - Departure time = now
   - Layer 1 + Layer 2 cache

✅ test_batching()
   - 30 origins × 30 destinations = 900 elements
   - Auto-batching (900 > 625 limit)
   - Multiple API calls

✅ test_cache_workflow()
   - Cache miss → API call → cache set
   - Cache hit → no API call
   - Stats: hits, misses, hit rate
```

##### **Usage**

```bash
# Run manual test script
python backend/tests/test_routes_api.py

# Expected output:
# ✅ Essentials Mode - PASS
# ✅ Pro Mode - PASS
# ✅ Batching - PASS
# ✅ Cache Workflow - PASS
```

---

## Cara Menjalankan Tests

### 🚀 Setup Environment

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Setup test database
# Create PostgreSQL database: rizq_test
createdb rizq_test

# 3. Enable PostGIS extension
psql rizq_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 4. Setup Redis (for cache tests)
# Install Redis dan jalankan server
redis-server

# 5. Set environment variables
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/rizq_test"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
```

### ▶️ Run All Tests

```bash
# Run semua tests
pytest

# Run dengan verbose output
pytest -v

# Run dengan output detail
pytest -v -s
```

### 🎯 Run Specific Test Files

```bash
# Test cache service
pytest tests/test_cache_service.py -v

# Test Routes API service
pytest tests/test_routes_api_service.py -v

# Test optimization API
pytest tests/test_optimization_api.py -v

# Test recipients API
pytest tests/test_recipients_api.py -v

# Test couriers API
pytest tests/test_couriers_api.py -v
```

### 🔍 Run Specific Test Functions

```bash
# Run single test function
pytest tests/test_cache_service.py::TestCacheService::test_layer1_set_and_get_base_distance -v

# Run test class
pytest tests/test_optimization_api.py::TestTSPEndpoint -v
```

### 📊 Run dengan Coverage Report

```bash
# Generate coverage report
pytest --cov=app --cov-report=html

# Open coverage report
# Windows
start htmlcov/index.html

# Linux/Mac
open htmlcov/index.html
```

### ⚡ Run Tests Parallel (Fast)

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run dengan 4 workers
pytest -n 4
```

### 🏷 Run dengan Markers

```bash
# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

---

## Best Practices

### 1️⃣ **Fixture Usage**

```python
# ✅ GOOD: Reuse fixtures dari conftest.py
def test_example(client, auth_headers, test_recipient):
    response = client.get(
        f"/api/v1/recipients/{test_recipient.id}",
        headers=auth_headers
    )
    assert response.status_code == 200

# ❌ BAD: Create test data manually
def test_example_bad(client):
    # Don't do this - use fixtures instead
    user = User(username="test", password="test")
    # ...
```

### 2️⃣ **Mocking Strategy**

```python
# ✅ GOOD: Mock external API calls
@patch('app.services.routes_api_service.requests.post')
def test_api_call(mock_post):
    mock_post.return_value.json.return_value = {...}
    # Test logic here

# ❌ BAD: Make real API calls in tests
def test_api_call_bad():
    # Don't call real APIs - slow and unreliable
    response = requests.post("https://routes.googleapis.com/...")
```

### 3️⃣ **Test Data Management**

```python
# ✅ GOOD: Cleanup in fixtures
@pytest.fixture
def test_data(db_session):
    data = create_test_data()
    yield data
    # Cleanup automatically
    db_session.rollback()

# ❌ BAD: Manual cleanup yang bisa lupa
def test_example():
    data = create_test_data()
    # Test logic
    # Forgot to cleanup!
```

### 4️⃣ **Assertion Guidelines**

```python
# ✅ GOOD: Specific assertions
assert response.status_code == 200
assert data["name"] == "Expected Name"
assert len(data["items"]) == 5

# ❌ BAD: Generic assertions
assert response.status_code  # What code?
assert data  # What data?
assert True  # Meaningless
```

### 5️⃣ **Test Naming**

```python
# ✅ GOOD: Descriptive names
def test_create_recipient_with_valid_data_returns_201():
    ...

def test_update_recipient_with_invalid_status_returns_400():
    ...

# ❌ BAD: Vague names
def test_recipient():
    ...

def test_1():
    ...
```

---

## Maintenance & Updates

### 🔄 Kapan Update Tests?

1. **New Feature**: Tambah test untuk endpoint/service baru
2. **Bug Fix**: Tambah test untuk reproduce bug sebelum fix
3. **API Changes**: Update mock responses jika API berubah
4. **Database Schema**: Update fixtures jika model berubah

### 📋 Checklist Update Tests

- [ ] Update mock responses jika API contract berubah
- [ ] Update fixtures jika database schema berubah
- [ ] Update assertions jika response format berubah
- [ ] Run semua tests sebelum commit
- [ ] Check coverage report (minimum 80%)

### 🗑 Deprecated Tests

| File | Status | Action Date | Reason |
|------|--------|-------------|--------|
| `test_recipients.py` | ❌ DEPRECATED | Nov 2025 | Redundant dengan pytest version |

### 🔮 Future Test Plans

1. **Performance Tests**: Load testing untuk optimization endpoints
2. **E2E Tests**: Full workflow dari create recipient → assign → optimize → deliver
3. **API Contract Tests**: Validate OpenAPI schema compliance
4. **Security Tests**: Auth, authorization, input validation

---

## 📞 Support & Questions

Jika ada pertanyaan tentang testing:

1. Check dokumentasi ini terlebih dahulu
2. Review test files yang relevan
3. Ask team lead atau maintainer

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 4, 2025 | Initial documentation - comprehensive test scenarios |

---

**Happy Testing! 🎉**
