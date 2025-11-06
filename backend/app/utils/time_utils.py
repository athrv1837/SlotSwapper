from fastapi import HTTPException, status
from typing import Optional
from datetime import datetime, timedelta

class TimeSlotError(Exception):
    """Custom exception for time slot validation errors"""
    pass

def format_duration(minutes: int) -> str:
    """Convert minutes to human-readable duration"""
    hours = minutes // 60
    mins = minutes % 60
    if hours > 0:
        return f"{hours}h {mins}m" if mins > 0 else f"{hours}h"
    return f"{mins}m"

def get_time_slots(start_time: datetime, end_time: datetime, duration: int) -> list[tuple[datetime, datetime]]:
    """Split a time range into slots of specified duration (in minutes)"""
    slots = []
    current = start_time
    while current + timedelta(minutes=duration) <= end_time:
        slot_end = current + timedelta(minutes=duration)
        slots.append((current, slot_end))
        current = slot_end
    return slots

def format_time_slot(start: datetime, end: datetime) -> str:
    """Format a time slot in a human-readable way"""
    if start.date() == end.date():
        return f"{start.strftime('%Y-%m-%d %H:%M')} - {end.strftime('%H:%M')}"
    return f"{start.strftime('%Y-%m-%d %H:%M')} - {end.strftime('%Y-%m-%d %H:%M')}"