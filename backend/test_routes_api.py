#!/usr/bin/env python
"""
Manual test script for Routes API Service.
Tests both Essentials and Pro modes with cache integration.

Usage:
    python test_routes_api.py
"""
import sys
from datetime import datetime
from app.services.routes_api_service import RoutesAPIService
from app.utils.cache_service import CacheService


def test_essentials_mode():
    """Test Essentials mode (no traffic)."""
    print("\n" + "=" * 60)
    print("TEST 1: Essentials Mode (No Traffic)")
    print("=" * 60)
    
    service = RoutesAPIService()
    
    # Test locations (Jakarta area)
    origins = [
        (-6.2088, 106.8456),  # Jakarta Pusat
        (-6.2297, 106.8266),  # Menteng
    ]
    destinations = [
        (-6.1751, 106.8650),  # Monas
        (-6.2615, 106.7810),  # Tanah Abang
        (-6.1945, 106.8227),  # Bundaran HI
    ]
    
    print(f"\nOrigins: {len(origins)} locations")
    print(f"Destinations: {len(destinations)} locations")
    print(f"Total elements: {len(origins) * len(destinations)}")
    print(f"\nCalling Routes API (Essentials mode)...")
    
    try:
        result = service.compute_route_matrix(
            origins=origins,
            destinations=destinations,
            use_traffic=False
        )
        
        print(f"\n✅ Success!")
        print(f"Status: {result['status']}")
        print(f"\nDistance Matrix (meters):")
        for i, row in enumerate(result['distance_matrix']):
            print(f"  Origin {i}: {row}")
        
        print(f"\nDuration Matrix (seconds):")
        for i, row in enumerate(result['duration_matrix']):
            print(f"  Origin {i}: {row}")
        
        # Cache stats
        stats = service.cache_service.get_cache_stats()
        print(f"\nCache Stats:")
        print(f"  Layer 1: {stats['layer1']['hits']} hits, {stats['layer1']['misses']} misses")
        print(f"  Hit rate: {stats['layer1']['hit_rate']:.2f}%")
        
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_pro_mode():
    """Test Pro mode (with traffic)."""
    print("\n" + "=" * 60)
    print("TEST 2: Pro Mode (With Traffic)")
    print("=" * 60)
    
    service = RoutesAPIService()
    
    # Smaller set for Pro mode (100 element limit)
    origins = [
        (-6.2088, 106.8456),  # Jakarta Pusat
    ]
    destinations = [
        (-6.1751, 106.8650),  # Monas
        (-6.2615, 106.7810),  # Tanah Abang
    ]
    
    print(f"\nOrigins: {len(origins)} locations")
    print(f"Destinations: {len(destinations)} locations")
    print(f"Total elements: {len(origins) * len(destinations)}")
    print(f"Departure time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nCalling Routes API (Pro mode with traffic)...")
    
    try:
        result = service.compute_route_matrix(
            origins=origins,
            destinations=destinations,
            use_traffic=True,
            departure_time=datetime.now()
        )
        
        print(f"\n✅ Success!")
        print(f"Status: {result['status']}")
        print(f"\nDistance Matrix (meters):")
        for i, row in enumerate(result['distance_matrix']):
            print(f"  Origin {i}: {row}")
        
        print(f"\nDuration Matrix (seconds, with traffic):")
        for i, row in enumerate(result['duration_matrix']):
            print(f"  Origin {i}: {row}")
        
        # Cache stats
        stats = service.cache_service.get_cache_stats()
        print(f"\nCache Stats:")
        print(f"  Layer 1: {stats['layer1']['hits']} hits, {stats['layer1']['misses']} misses")
        print(f"  Layer 2: {stats['layer2']['hits']} hits, {stats['layer2']['misses']} misses")
        print(f"  Layer 1 hit rate: {stats['layer1']['hit_rate']:.2f}%")
        print(f"  Layer 2 hit rate: {stats['layer2']['hit_rate']:.2f}%")
        
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_batching():
    """Test batching with large request."""
    print("\n" + "=" * 60)
    print("TEST 3: Batching (30x30 = 900 elements)")
    print("=" * 60)
    
    service = RoutesAPIService()
    
    # Generate 30 origins and 30 destinations (900 elements > 625 limit)
    origins = [
        (-6.20 + i*0.01, 106.84 + i*0.005) for i in range(30)
    ]
    destinations = [
        (-6.17 + j*0.01, 106.86 + j*0.005) for j in range(30)
    ]
    
    print(f"\nOrigins: {len(origins)} locations")
    print(f"Destinations: {len(destinations)} locations")
    print(f"Total elements: {len(origins) * len(destinations)}")
    print(f"Element limit: 625 (Essentials mode)")
    print(f"Expected batches: ~2")
    print(f"\nCalling Routes API with batching...")
    
    try:
        result = service.compute_route_matrix(
            origins=origins,
            destinations=destinations,
            use_traffic=False
        )
        
        print(f"\n✅ Success!")
        print(f"Status: {result['status']}")
        print(f"Matrix dimensions: {len(result['distance_matrix'])}x{len(result['distance_matrix'][0])}")
        
        # Sample output
        print(f"\nSample distances (first 3x3):")
        for i in range(min(3, len(result['distance_matrix']))):
            row = result['distance_matrix'][i][:3]
            print(f"  Origin {i}: {row}")
        
        # Cache stats
        stats = service.cache_service.get_cache_stats()
        print(f"\nCache Stats:")
        print(f"  Layer 1: {stats['layer1']['hits']} hits, {stats['layer1']['misses']} misses")
        print(f"  Hit rate: {stats['layer1']['hit_rate']:.2f}%")
        
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_cache_workflow():
    """Test cache hit/miss workflow."""
    print("\n" + "=" * 60)
    print("TEST 4: Cache Hit/Miss Workflow")
    print("=" * 60)
    
    cache = CacheService()
    
    if not cache.enabled:
        print("\n⚠️  Redis not available, skipping cache test")
        return False
    
    # Clear cache
    cache.clear_cache(pattern="distance:*")
    cache.reset_stats()
    
    origin = (-6.2088, 106.8456)
    destination = (-6.1751, 106.8650)
    
    print(f"\nOrigin: {origin}")
    print(f"Destination: {destination}")
    
    # First call: cache miss
    print(f"\n1. First call (cache miss)...")
    result1 = cache.get_base_distance(origin, destination)
    print(f"   Result: {result1}")
    
    # Set cache
    print(f"\n2. Setting cache (distance=15000m)...")
    cache.set_base_distance(origin, destination, 15000)
    
    # Second call: cache hit
    print(f"\n3. Second call (cache hit)...")
    result2 = cache.get_base_distance(origin, destination)
    print(f"   Result: {result2}")
    
    # Stats
    stats = cache.get_cache_stats()
    print(f"\n✅ Cache Stats:")
    print(f"  Hits: {stats['layer1']['hits']}")
    print(f"  Misses: {stats['layer1']['misses']}")
    print(f"  Hit rate: {stats['layer1']['hit_rate']:.2f}%")
    
    return result2 == 15000


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Routes API Service - Manual Test Suite")
    print("=" * 60)
    print("\nNOTE: These tests will call the actual Routes API if GOOGLE_MAPS_API_KEY is set.")
    print("If no API key, tests will use Haversine fallback (Euclidean distance).")
    
    results = []
    
    # Test 1: Essentials mode
    results.append(("Essentials Mode", test_essentials_mode()))
    
    # Test 2: Pro mode
    results.append(("Pro Mode", test_pro_mode()))
    
    # Test 3: Batching
    results.append(("Batching", test_batching()))
    
    # Test 4: Cache workflow
    results.append(("Cache Workflow", test_cache_workflow()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
