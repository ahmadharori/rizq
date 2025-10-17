"""
Performance profiling utilities for optimization endpoints.

Usage:
    profiler = PerformanceProfiler()
    
    with profiler.profile("Database Query"):
        # ... code ...
    
    summary = profiler.summary()
"""
import time
from contextlib import contextmanager
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class PerformanceProfiler:
    """
    Simple performance profiler for measuring execution time.
    
    Tracks execution time of code blocks and generates summary statistics.
    """
    
    def __init__(self, enabled: bool = True):
        """
        Initialize profiler.
        
        Args:
            enabled: Whether profiling is enabled
        """
        self.enabled = enabled
        self.timings: Dict[str, float] = {}
        self.total_time: float = 0.0
    
    @contextmanager
    def profile(self, label: str):
        """
        Context manager for timing code blocks.
        
        Args:
            label: Description of the code block being profiled
        
        Example:
            with profiler.profile("Database Query"):
                result = db.query().all()
        """
        if not self.enabled:
            yield
            return
        
        start = time.perf_counter()
        try:
            yield
        finally:
            elapsed = time.perf_counter() - start
            self.timings[label] = elapsed
            logger.debug(f"[Profiler] {label}: {elapsed:.3f}s")
    
    def summary(self) -> Optional[Dict]:
        """
        Generate profiling summary with breakdown.
        
        Returns:
            dict with total_time_seconds and breakdown by component,
            or None if profiling is disabled
        
        Example:
            {
                "total_time_seconds": 4.231,
                "breakdown": [
                    {"component": "Distance Matrix API", "time_seconds": 2.183, "percentage": 51.6},
                    {"component": "OR-Tools Solver", "time_seconds": 1.847, "percentage": 43.7}
                ]
            }
        """
        if not self.enabled:
            return None
        
        self.total_time = sum(self.timings.values())
        
        breakdown = []
        for label, time_val in self.timings.items():
            percentage = (time_val / self.total_time * 100) if self.total_time > 0 else 0
            breakdown.append({
                "component": label,
                "time_seconds": round(time_val, 3),
                "percentage": round(percentage, 1)
            })
        
        # Sort by time descending (slowest first)
        breakdown.sort(key=lambda x: x["time_seconds"], reverse=True)
        
        return {
            "total_time_seconds": round(self.total_time, 3),
            "breakdown": breakdown
        }
    
    def log_summary(self):
        """Log profiling summary to logger."""
        summary = self.summary()
        if summary:
            logger.info(f"Performance Summary: {summary['total_time_seconds']}s total")
            for item in summary["breakdown"]:
                logger.info(
                    f"  - {item['component']}: {item['time_seconds']}s ({item['percentage']}%)"
                )
