"""Tests for performance profiler."""
import pytest
import time
from app.utils.profiler import PerformanceProfiler


def test_profiler_basic():
    """Test basic profiling functionality."""
    profiler = PerformanceProfiler()
    
    with profiler.profile("Test Block"):
        time.sleep(0.1)
    
    summary = profiler.summary()
    
    assert summary is not None
    assert summary['total_time_seconds'] >= 0.1
    assert len(summary['breakdown']) == 1
    assert summary['breakdown'][0]['component'] == "Test Block"
    assert summary['breakdown'][0]['percentage'] == 100.0


def test_profiler_multiple_blocks():
    """Test profiling multiple code blocks."""
    profiler = PerformanceProfiler()
    
    with profiler.profile("Block 1"):
        time.sleep(0.05)
    
    with profiler.profile("Block 2"):
        time.sleep(0.10)
    
    summary = profiler.summary()
    
    assert summary is not None
    assert len(summary['breakdown']) == 2
    assert summary['total_time_seconds'] >= 0.15
    
    # Block 2 should be first (sorted by time descending)
    assert summary['breakdown'][0]['component'] == "Block 2"
    assert summary['breakdown'][1]['component'] == "Block 1"


def test_profiler_disabled():
    """Test profiler when disabled."""
    profiler = PerformanceProfiler(enabled=False)
    
    with profiler.profile("Test"):
        time.sleep(0.1)
    
    summary = profiler.summary()
    assert summary is None


def test_profiler_percentages():
    """Test percentage calculation."""
    profiler = PerformanceProfiler()
    
    with profiler.profile("50% Block"):
        time.sleep(0.05)
    
    with profiler.profile("50% Block 2"):
        time.sleep(0.05)
    
    summary = profiler.summary()
    
    # Each block should be approximately 50%
    for item in summary['breakdown']:
        assert 45 <= item['percentage'] <= 55  # Allow 5% tolerance


def test_profiler_log_summary():
    """Test log summary doesn't raise errors."""
    profiler = PerformanceProfiler()
    
    with profiler.profile("Test"):
        time.sleep(0.01)
    
    # Should not raise any exceptions
    profiler.log_summary()
