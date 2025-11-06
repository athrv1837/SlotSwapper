from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from typing import Optional, List
from app import models, schemas
from app.db import get_db
from app.deps import get_current_user
from app.utils.validators import validate_time_slot

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/", response_model=list[schemas.EventOut])
def get_my_events(
    status: Optional[str] = Query(None, enum=["BUSY", "SWAPPABLE", "SWAP_PENDING"]),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None, min_length=3),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Get events of the current user with advanced filtering
    - Filter by status
    - Filter by date range
    - Search by title
    """
    query = db.query(models.Event).filter(models.Event.owner_id == current_user.id)
    
    if status:
        query = query.filter(models.Event.status == status)
    
    if start_date:
        query = query.filter(models.Event.start_time >= start_date)
    
    if end_date:
        query = query.filter(models.Event.end_time <= end_date)
    
    if search:
        query = query.filter(models.Event.title.ilike(f"%{search}%"))
    
    return query.order_by(models.Event.start_time).all()

@router.get("/stats", response_model=dict)
def get_event_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get statistics about user's events"""
    total_events = db.query(func.count(models.Event.id)).filter(
        models.Event.owner_id == current_user.id
    ).scalar()
    
    status_counts = (
        db.query(models.Event.status, func.count(models.Event.id))
        .filter(models.Event.owner_id == current_user.id)
        .group_by(models.Event.status)
        .all()
    )
    
    current_time = datetime.utcnow()
    upcoming_events = db.query(func.count(models.Event.id)).filter(
        models.Event.owner_id == current_user.id,
        models.Event.start_time > current_time
    ).scalar()
    
    return {
        "total_events": total_events,
        "status_breakdown": dict(status_counts),
        "upcoming_events": upcoming_events
    }


@router.post("/", response_model=schemas.EventOut)
async def create_event(
    payload: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Create a new event with advanced validation:
    - Time slot validation
    - Overlap checking
    - Automatic conflict detection
    """
    # Validate time slot constraints
    validate_time_slot(payload.start_time, payload.end_time)
    
    # Check for overlapping events
    existing_events = db.query(models.Event).filter(
        models.Event.owner_id == current_user.id,
        models.Event.start_time < payload.end_time,
        models.Event.end_time > payload.start_time
    ).all()
    
    if existing_events:
        conflicting_events = [
            f"{event.title} ({event.start_time.strftime('%Y-%m-%d %H:%M')} - {event.end_time.strftime('%H:%M')})"
            for event in existing_events
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Time slot conflicts with existing events",
                "conflicts": conflicting_events
            }
        )
    
    # Create the event
    new_event = models.Event(
        title=payload.title,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=payload.status or "BUSY",
        owner_id=current_user.id,
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return new_event


@router.put("/{event_id}", response_model=schemas.EventOut)
def update_event(
    event_id: int,
    payload: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update an existing event"""
    event = db.query(models.Event).filter(
        models.Event.id == event_id, 
        models.Event.owner_id == current_user.id
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Event not found"
        )

    # Update event fields
    event.title = payload.title
    event.start_time = payload.start_time
    event.end_time = payload.end_time
    event.status = payload.status or "BUSY"
    
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete an event"""
    event = db.query(models.Event).filter(
        models.Event.id == event_id, 
        models.Event.owner_id == current_user.id
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Event not found"
        )

    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}