"""
Route Optimization Service using Google OR-Tools.
Implements TSP (Traveling Salesman Problem) and CVRP (Capacitated Vehicle Routing Problem).
"""
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from typing import List, Dict, Tuple, Optional
import logging
from uuid import UUID

from app.config import settings
from app.services.distance_service import DistanceService
from app.database import SessionLocal
from app.models.recipient import Recipient
from app.utils.profiler import PerformanceProfiler
from geoalchemy2.shape import to_shape

logger = logging.getLogger(__name__)


class OptimizationService:
    """Service for route optimization using OR-Tools."""
    
    def __init__(self, distance_service: Optional[DistanceService] = None):
        """
        Initialize Optimization Service.
        
        Args:
            distance_service: Distance service instance (creates new if None)
        """
        self.distance_service = distance_service or DistanceService()
    
    def get_recipient_locations(
        self,
        recipient_ids: List[UUID],
        db_session=None
    ) -> List[Tuple[float, float]]:
        """
        Get recipient locations from database.
        
        Args:
            recipient_ids: List of recipient UUIDs
            db_session: Database session (creates new if None)
        
        Returns:
            List of (lat, lng) tuples
        """
        close_session = False
        if db_session is None:
            db_session = SessionLocal()
            close_session = True
        
        try:
            recipients = db_session.query(Recipient).filter(
                Recipient.id.in_(recipient_ids),
                Recipient.is_deleted == False
            ).all()
            
            if len(recipients) != len(recipient_ids):
                raise ValueError(f"Some recipients not found. Expected {len(recipient_ids)}, got {len(recipients)}")
            
            locations = []
            for recipient in recipients:
                # Convert PostGIS GEOGRAPHY to shapely Point
                point = to_shape(recipient.location)
                locations.append((point.y, point.x))  # (lat, lng)
            
            return locations
            
        finally:
            if close_session:
                db_session.close()
    
    def solve_tsp(
        self,
        recipient_ids: List[UUID],
        depot_location: Optional[Tuple[float, float]] = None,
        timeout_seconds: Optional[int] = None
    ) -> Dict:
        """
        Solve Traveling Salesman Problem (TSP) for single courier.
        
        Args:
            recipient_ids: List of recipient UUIDs to visit
            depot_location: (lat, lng) of depot (defaults to config)
            timeout_seconds: Solver timeout (defaults to TSP_TIMEOUT_SECONDS)
        
        Returns:
            Dict with optimized_sequence, total_distance, total_duration
        """
        profiler = PerformanceProfiler(enabled=settings.ENABLE_PROFILING)
        
        if not recipient_ids:
            raise ValueError("recipient_ids cannot be empty")
        
        # Use default depot if not provided
        if depot_location is None:
            depot_location = (settings.DEPOT_LAT, settings.DEPOT_LNG)
        
        timeout = timeout_seconds or settings.TSP_TIMEOUT_SECONDS
        
        logger.info(f"Solving TSP for {len(recipient_ids)} recipients with {timeout}s timeout")
        
        # Get recipient locations
        with profiler.profile("1. Fetch Recipients from Database"):
            recipient_locations = self.get_recipient_locations(recipient_ids)
        
        # Build locations list: [depot, recipient1, recipient2, ...]
        all_locations = [depot_location] + recipient_locations
        
        # Get distance matrix from Google API
        with profiler.profile("2. Google Distance Matrix API"):
            matrix_data = self.distance_service.get_distance_matrix(
                origins=all_locations,
                destinations=all_locations
            )
        
        # Combine distance and duration with equal weights (0.5 each)
        cost_matrix = self.distance_service.calculate_combined_cost_matrix(
            matrix_data["distance_matrix"],
            matrix_data["duration_matrix"],
            distance_weight=0.5,
            duration_weight=0.5
        )
        
        # Create routing model and solve
        with profiler.profile("3. OR-Tools TSP Solver"):
            manager = pywrapcp.RoutingIndexManager(
                len(all_locations),  # number of locations
                1,                   # number of vehicles (TSP = 1)
                0                    # depot index
            )
            
            routing = pywrapcp.RoutingModel(manager)
            
            # Create distance callback
            def distance_callback(from_index, to_index):
                """Returns the cost between the two nodes."""
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                return cost_matrix[from_node][to_node]
            
            transit_callback_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
            
            # Set search parameters
            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )
            search_parameters.local_search_metaheuristic = (
                routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
            )
            search_parameters.time_limit.seconds = timeout
            
            # Solve
            solution = routing.SolveWithParameters(search_parameters)
        
        if not solution:
            raise ValueError("No solution found for TSP. Try reducing the number of recipients.")
        
        # Extract solution
        index = routing.Start(0)
        route_indices = []
        total_cost = 0
        
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route_indices.append(node)
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            total_cost += routing.GetArcCostForVehicle(previous_index, index, 0)
        
        # Add final node
        route_indices.append(manager.IndexToNode(index))
        
        # Convert indices to recipient IDs (skip depot at start and end)
        optimized_sequence = []
        for idx in route_indices[1:-1]:  # Skip depot (index 0) at start and end
            optimized_sequence.append(recipient_ids[idx - 1])  # -1 because depot is at index 0
        
        # Calculate actual distance and duration from original matrices
        total_distance = 0
        total_duration = 0
        for i in range(len(route_indices) - 1):
            from_node = route_indices[i]
            to_node = route_indices[i + 1]
            total_distance += matrix_data["distance_matrix"][from_node][to_node]
            total_duration += matrix_data["duration_matrix"][from_node][to_node]
        
        logger.info(f"TSP solved: {len(optimized_sequence)} stops, {total_distance}m, {total_duration}s")
        
        result = {
            "optimized_sequence": [str(uid) for uid in optimized_sequence],
            "total_distance_meters": total_distance,
            "total_duration_seconds": total_duration,
            "num_stops": len(optimized_sequence)
        }
        
        # Add profiling data if enabled
        profiling_summary = profiler.summary()
        if profiling_summary:
            result["_profiling"] = profiling_summary
            profiler.log_summary()
        
        return result
    
    def solve_cvrp(
        self,
        recipient_ids: List[UUID],
        num_couriers: int,
        capacity_per_courier: int,
        depot_location: Optional[Tuple[float, float]] = None,
        timeout_seconds: Optional[int] = None
    ) -> Dict:
        """
        Solve Capacitated Vehicle Routing Problem (CVRP) for multiple couriers.
        
        Args:
            recipient_ids: List of recipient UUIDs to distribute
            num_couriers: Number of couriers available
            capacity_per_courier: Maximum packages per courier
            depot_location: (lat, lng) of depot (defaults to config)
            timeout_seconds: Solver timeout (defaults to CVRP_TIMEOUT_SECONDS)
        
        Returns:
            Dict with routes (per courier), total_distance, total_duration
        """
        if not recipient_ids:
            raise ValueError("recipient_ids cannot be empty")
        
        if num_couriers < 1:
            raise ValueError("num_couriers must be at least 1")
        
        if capacity_per_courier < 1:
            raise ValueError("capacity_per_courier must be at least 1")
        
        # Use default depot if not provided
        if depot_location is None:
            depot_location = (settings.DEPOT_LAT, settings.DEPOT_LNG)
        
        timeout = timeout_seconds or settings.CVRP_TIMEOUT_SECONDS
        
        logger.info(f"Solving CVRP for {len(recipient_ids)} recipients, {num_couriers} couriers, capacity {capacity_per_courier}")
        
        # Get recipient locations and demands
        db_session = SessionLocal()
        try:
            recipients = db_session.query(Recipient).filter(
                Recipient.id.in_(recipient_ids),
                Recipient.is_deleted == False
            ).all()
            
            if len(recipients) != len(recipient_ids):
                raise ValueError(f"Some recipients not found")
            
            # Build locations and demands
            recipient_locations = []
            demands = [0]  # Depot has 0 demand
            recipient_map = {}  # Map index to recipient_id
            
            for idx, recipient in enumerate(recipients):
                point = to_shape(recipient.location)
                recipient_locations.append((point.y, point.x))
                demands.append(recipient.num_packages or 1)  # Default to 1 package if not set
                recipient_map[idx + 1] = recipient.id  # +1 because depot is at index 0
            
            all_locations = [depot_location] + recipient_locations
            
            # Check feasibility
            total_demand = sum(demands)
            total_capacity = num_couriers * capacity_per_courier
            if total_demand > total_capacity:
                raise ValueError(
                    f"Infeasible: total demand ({total_demand}) exceeds total capacity ({total_capacity})"
                )
            
        finally:
            db_session.close()
        
        # Get distance matrix
        matrix_data = self.distance_service.get_distance_matrix(
            origins=all_locations,
            destinations=all_locations
        )
        
        # Combine distance and duration
        cost_matrix = self.distance_service.calculate_combined_cost_matrix(
            matrix_data["distance_matrix"],
            matrix_data["duration_matrix"],
            distance_weight=0.5,
            duration_weight=0.5
        )
        
        # Create routing model
        manager = pywrapcp.RoutingIndexManager(
            len(all_locations),
            num_couriers,
            0  # depot index
        )
        
        routing = pywrapcp.RoutingModel(manager)
        
        # Create distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return cost_matrix[from_node][to_node]
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add capacity constraint
        def demand_callback(from_index):
            from_node = manager.IndexToNode(from_index)
            return demands[from_node]
        
        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # null capacity slack
            [capacity_per_courier] * num_couriers,  # vehicle maximum capacities
            True,  # start cumul to zero
            "Capacity"
        )
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = timeout
        
        # Solve
        solution = routing.SolveWithParameters(search_parameters)
        
        if not solution:
            raise ValueError("No solution found for CVRP. Try increasing capacity or number of couriers.")
        
        # Extract routes
        routes = []
        total_distance = 0
        total_duration = 0
        
        for vehicle_id in range(num_couriers):
            if not routing.IsVehicleUsed(solution, vehicle_id):
                continue
            
            index = routing.Start(vehicle_id)
            route_indices = []
            route_distance = 0
            route_duration = 0
            route_load = 0
            
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                route_indices.append(node)
                route_load += demands[node]
                
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                
                # Calculate actual distance and duration
                from_node = manager.IndexToNode(previous_index)
                to_node = manager.IndexToNode(index)
                route_distance += matrix_data["distance_matrix"][from_node][to_node]
                route_duration += matrix_data["duration_matrix"][from_node][to_node]
            
            # Add final node
            route_indices.append(manager.IndexToNode(index))
            
            # Convert to recipient IDs
            recipient_sequence = []
            for idx in route_indices[1:-1]:  # Skip depot at start and end
                recipient_sequence.append(str(recipient_map[idx]))
            
            if recipient_sequence:  # Only add non-empty routes
                routes.append({
                    "courier_index": vehicle_id,
                    "recipient_sequence": recipient_sequence,
                    "num_stops": len(recipient_sequence),
                    "total_load": route_load,
                    "total_distance_meters": route_distance,
                    "total_duration_seconds": route_duration
                })
                
                total_distance += route_distance
                total_duration += route_duration
        
        # Calculate route balance metrics
        balance_metrics = self._calculate_route_balance(routes)
        
        # Add per-route metrics
        for route in routes:
            route["avg_distance_per_stop"] = round(
                route["total_distance_meters"] / route["num_stops"], 2
            ) if route["num_stops"] > 0 else 0.0
            
            # Efficiency score: normalize load usage (0-100)
            route["efficiency_score"] = round(
                (route["total_load"] / capacity_per_courier) * 100, 1
            )
        
        logger.info(f"CVRP solved: {len(routes)} routes, {total_distance}m, {total_duration}s, balance={balance_metrics['route_balance_status']}")
        
        return {
            "routes": routes,
            "num_routes": len(routes),
            "total_distance_meters": total_distance,
            "total_duration_seconds": total_duration,
            "total_recipients": len(recipient_ids),
            **balance_metrics
        }
    
    def _calculate_route_balance(self, routes: List[Dict]) -> Dict:
        """
        Calculate route balance metrics using Coefficient of Variation.
        
        Args:
            routes: List of route dicts with total_load
        
        Returns:
            Dict with route balance metrics
        """
        if not routes:
            return {
                "route_balance_cv": 0.0,
                "route_balance_status": "N/A",
                "avg_load_per_route": 0.0,
                "max_load": 0,
                "min_load": 0
            }
        
        loads = [route["total_load"] for route in routes]
        
        # Calculate statistics
        avg_load = sum(loads) / len(loads)
        max_load = max(loads)
        min_load = min(loads)
        
        # Calculate Coefficient of Variation (CV)
        if avg_load > 0:
            variance = sum((x - avg_load) ** 2 for x in loads) / len(loads)
            std_dev = variance ** 0.5
            cv = std_dev / avg_load
        else:
            cv = 0.0
        
        # Determine status based on CV thresholds
        if cv < 0.15:
            status = "Excellent"  # Very balanced
        elif cv < 0.25:
            status = "Good"       # Acceptable balance
        elif cv < 0.40:
            status = "Fair"       # Some imbalance
        else:
            status = "Poor"       # Significant imbalance
        
        return {
            "route_balance_cv": round(cv, 3),
            "route_balance_status": status,
            "avg_load_per_route": round(avg_load, 2),
            "max_load": max_load,
            "min_load": min_load
        }
