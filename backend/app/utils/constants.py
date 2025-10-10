"""
Constants and enums used across the application.
"""

# Recipient status values (State Machine)
class RecipientStatus:
    UNASSIGNED = "Unassigned"
    ASSIGNED = "Assigned"
    DELIVERY = "Delivery"
    RETURN = "Return"
    DONE = "Done"
    
    @classmethod
    def all_statuses(cls):
        """Return all valid statuses."""
        return [cls.UNASSIGNED, cls.ASSIGNED, cls.DELIVERY, cls.RETURN, cls.DONE]
    
    @classmethod
    def valid_transitions(cls):
        """Define valid state transitions."""
        return {
            cls.UNASSIGNED: [cls.ASSIGNED],
            cls.ASSIGNED: [cls.DELIVERY, cls.UNASSIGNED],
            cls.DELIVERY: [cls.DONE, cls.RETURN, cls.UNASSIGNED],
            cls.RETURN: [cls.DELIVERY, cls.UNASSIGNED],
            cls.DONE: []  # Terminal state
        }
