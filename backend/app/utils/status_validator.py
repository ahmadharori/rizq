"""
Status validation utility for recipient status transitions.
Ensures only valid status transitions are allowed.
"""
from typing import Dict, List
from app.models.recipient import RecipientStatus


# Define allowed status transitions
ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    RecipientStatus.UNASSIGNED.value: [RecipientStatus.ASSIGNED.value],
    RecipientStatus.ASSIGNED.value: [RecipientStatus.DELIVERY.value, RecipientStatus.RETURN.value],
    RecipientStatus.DELIVERY.value: [RecipientStatus.DONE.value, RecipientStatus.RETURN.value],
    RecipientStatus.DONE.value: [],  # Final status - no transitions allowed
    RecipientStatus.RETURN.value: [RecipientStatus.ASSIGNED.value]  # Can be re-assigned
}


def is_valid_transition(current_status: str, new_status: str) -> bool:
    """
    Check if status transition is valid.
    
    Args:
        current_status: Current status of recipient
        new_status: Desired new status
        
    Returns:
        True if transition is allowed, False otherwise
    """
    if current_status not in ALLOWED_TRANSITIONS:
        return False
    
    allowed_statuses = ALLOWED_TRANSITIONS[current_status]
    return new_status in allowed_statuses


def get_allowed_transitions(current_status: str) -> List[str]:
    """
    Get list of allowed status transitions from current status.
    
    Args:
        current_status: Current status of recipient
        
    Returns:
        List of allowed status values
    """
    return ALLOWED_TRANSITIONS.get(current_status, [])


def validate_bulk_transition(current_statuses: List[str], new_status: str) -> Dict[str, List[str]]:
    """
    Validate bulk status transition and return which recipients can/cannot transition.
    
    Args:
        current_statuses: List of current statuses
        new_status: Desired new status for all recipients
        
    Returns:
        Dictionary with 'valid' and 'invalid' lists of statuses
    """
    valid = []
    invalid = []
    
    for status in current_statuses:
        if is_valid_transition(status, new_status):
            valid.append(status)
        else:
            invalid.append(status)
    
    return {
        "valid": valid,
        "invalid": invalid
    }
