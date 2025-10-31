# Routes API Migration Plan

## Overview

**Purpose**: Migrate from Google Distance Matrix API (Legacy) to Google Routes API (Compute Route Matrix)  
**Reason**: Distance Matrix API is deprecated and has lower element limits (100 vs 625)  
**Timeline**: 8 days (5 implementation phases + testing)  
**Approved**: November 1, 2025

---

## Problem Statement

### Current Issue
- **Error**: `MAX_ELEMENTS_EXCEEDED` when optimizing 10 recipients
- **Calculation**: 11 locations (10 recipients + 1 depot) × 11 = 121 elements
- **Distance Matrix Limit**: 100 elements with traffic
- **Root Cause**: Using legacy Distance Matrix API

### Solution
- **Migrate to Routes API**: New API with better limits (625 elements without traffic, 100 with traffic)
- **Implement Batching**: Handle requests exceeding element limits
- **Add 2-Layer Caching**: Reduce API costs and improve performance
- **Support 2 Modes**: Essentials (no traffic) and Pro (with traffic)

---

## API Comparison

| Aspect | Distance Matrix (Legacy) | Routes API (New) |
|--------|--------------------------|------------------|
| **Status** | Legacy (deprecated) | Current (recommended) |
| **Max Elements (no traffic)** | 100 | **625** (6.25x better!) |
| **Max Elements (traffic)** | 100 | 100 (same) |
| **Free Tier (no traffic)** | 10K elements/month | 10K elements/month |
| **Free Tier (traffic)** | None | **5K elements/month** |
| **Pricing (no traffic)** | $5/1K elements | $5/1K elements (Essentials SKU) |
| **Pricing (traffic)** | $10/1K elements | $10/1K elements (Pro SKU) |
| **API Format** | Simple REST | REST + gRPC streaming |

**Verdict**: Routes API is superior in every aspect! ✅

---

## Caching Strategy: 2-Layer Architecture

### Why 2 Layers?

**Layer 1: Base Distance (Static)**
- Cache Key: `hash(origin, destination)`
- TTL: 30 days
- Data: Distance in meters (never changes)
- Use Case: All requests (Essentials & Pro)
- API: Routes API Essentials SKU

**Layer 2: Traffic Duration (Dynamic)**
- Cache Key: `hash(origin, destination, time_bucket, day_of_week)`
- TTL: 15-60 minutes (dynamic based on time of day)
- Data: Duration with traffic (changes frequently)
- Use Case: Pro mode requests only
- API: Routes API Pro SKU

### Cost Savings Analysis

**Without 2-Layer Caching (100 optimizations/month):**
```
Essentials: 50 × 121 = 6,050 elements → $0 (within free tier)
Pro: 50 × 121 = 6,050 elements → (6,050 - 5,000) × $10/1000 = $10.50

Total: $10.50/month
```

**With 2-Layer Caching (70% hit rate):**
```
Actual API calls (30% miss rate):
- Essentials: 50 × 121 × 30% = 1,815 elements → $0 (within free tier)
- Pro traffic: 50 × 121 × 30% = 1,815 elements → $0 (within free tier)

Total: $0/month (100% in free tier!)
Savings: $10.50/month = $126/year
```

**ROI**: 2-layer caching keeps you in free tier! 🎉

---

## Implementation Phases

### Phase 1: Routes API Service (2 days)

**Files to Create**:
1. `backend/app/services/routes_api_service.py`
2. `backend/app/utils/cache_service.py`
3. `backend/tests/test_routes_api_service.py`
4. `backend/tests/test_cache_service.py`

**Files to Modify**:
- `backend/requirements.txt` (+1 line: redis==5.0.0)

---

### Phase 2: Optimization Service Integration (2 days)

**Files to Modify**:
1. `backend/app/services/optimization_service.py`
2. `backend/app/services/distance_service.py`

---

### Phase 3: API Endpoint Updates (1 day)

**Files to Modify**:
1. `backend/app/api/optimization.py`
2. `backend/app/schemas/optimization.py`
3. `backend/app/config.py`

---

### Phase 4: Frontend Integration (1 day)

**Files to Modify**:
1. `frontend/src/features/assignments/wizard/Step1ViewRecipients.tsx`
2. `frontend/src/services/optimizationService.ts`

**Optional New File**:
- `frontend/src/components/common/TrafficModeToggle.tsx`

---

### Phase 5: Redis Setup (0.5 day)

**Infrastructure**:
- Docker Compose service OR local Redis installation
- Environment variables configuration

---

## Testing Strategy (1.5 days)

### Unit Tests
- ✅ RoutesAPIService (cache, batching, errors)
- ✅ CacheService (Redis, JSON, fallback)

### Integration Tests
- ✅ Essentials mode (10 recipients)
- ✅ Pro mode (10 recipients with traffic)
- ✅ Large dataset (50 recipients, batching)
- ✅ Cache hit rate measurement

### Manual Testing
- ✅ UI toggle functionality
- ✅ API call verification
- ✅ Cache usage verification
- ✅ Cost estimation accuracy

---

## Success Criteria

### Must Have
- ✅ No `MAX_ELEMENTS_EXCEEDED` errors
- ✅ Support for 100+ recipients
- ✅ Both Essentials and Pro modes working
- ✅ Cache hit rate >70%
- ✅ All tests passing
- ✅ Stay within free tier (typical usage)

### Nice to Have
- ✅ Cache hit rate >80%
- ✅ Response time <2s (with cache)
- ✅ Cost <$5/month (heavy usage)
- ✅ Monitoring dashboard

---

## Timeline Summary

| Phase | Duration | 
|-------|----------|
| Phase 1: Routes API Service | 2 days |
| Phase 2: Optimization Integration | 2 days |
| Phase 3: API Updates | 1 day |
| Phase 4: Frontend | 1 day |
| Phase 5: Redis Setup | 0.5 day |
| Testing & QA | 1.5 days |
| **TOTAL** | **8 days** |

---

**Status**: Approved - Ready for Implementation  
**Last Updated**: November 1, 2025
