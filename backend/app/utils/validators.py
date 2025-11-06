from fastapi import HTTPException
from datetime import datetime, timedelta
from typing import Optional
import re

def validate_time_slot(start_time: datetime, end_time: datetime, 
                      min_duration: int = 15, max_duration: int = 240) -> None:
    """
    Validate time slot constraints
    :param start_time: Start time of the slot
    :param end_time: End time of the slot
    :param min_duration: Minimum duration in minutes (default: 15)
    :param max_duration: Maximum duration in minutes (default: 240)
    """
    if start_time >= end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )
    
    duration = (end_time - start_time).total_seconds() / 60
    if duration < min_duration:
        raise HTTPException(
            status_code=400,
            detail=f"Time slot must be at least {min_duration} minutes"
        )
    
    if duration > max_duration:
        raise HTTPException(
            status_code=400,
            detail=f"Time slot cannot exceed {max_duration} minutes"
        )

def validate_email(email: str) -> bool:
    """
    Validate email format using enhanced regex pattern
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None

def check_slot_overlap(start_time: datetime, end_time: datetime, 
                      existing_start: datetime, existing_end: datetime) -> bool:
    """
    Check if two time slots overlap
    """
    return (start_time < existing_end and end_time > existing_start)