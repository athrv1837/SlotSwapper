from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/swap", tags=["Swap"])


@router.get("/swappable-slots", response_model=list[schemas.EventOut])
def get_swappable_slots(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all swappable slots from other users (excluding current user's slots)"""
    slots = db.query(models.Event).filter(
        models.Event.status == "SWAPPABLE",
        models.Event.owner_id != current_user.id
    ).all()
    return slots


@router.post("/swap-request")
def create_swap_request(
    payload: schemas.SwapRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new swap request"""
    # Get both slots
    my_slot = db.query(models.Event).filter(models.Event.id == payload.mySlotId).first()
    their_slot = db.query(models.Event).filter(models.Event.id == payload.theirSlotId).first()

    # Validate slots exist
    if not my_slot or not their_slot:
        raise HTTPException(status_code=404, detail="One of the slots not found")

    # Validate ownership
    if my_slot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only swap your own slots")

    # Validate both slots are swappable
    if my_slot.status != "SWAPPABLE":
        raise HTTPException(status_code=400, detail="Your slot must be SWAPPABLE")

    if their_slot.status != "SWAPPABLE":
        raise HTTPException(status_code=400, detail="Their slot must be SWAPPABLE")

    # Update both slots to SWAP_PENDING
    my_slot.status = "SWAP_PENDING"
    their_slot.status = "SWAP_PENDING"

    # Create swap request
    swap = models.SwapRequest(
        requester_id=current_user.id,
        responder_id=their_slot.owner_id,
        my_slot_id=my_slot.id,
        their_slot_id=their_slot.id,
    )

    db.add(swap)
    db.commit()
    db.refresh(swap)
    
    return {"message": "Swap request created successfully", "id": swap.id}


@router.get("/requests")
def get_swap_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all swap requests (incoming and outgoing) for the current user"""
    # Get incoming requests (where current user is responder)
    incoming = db.query(models.SwapRequest).filter(
        models.SwapRequest.responder_id == current_user.id
    ).all()

    # Get outgoing requests (where current user is requester)
    outgoing = db.query(models.SwapRequest).filter(
        models.SwapRequest.requester_id == current_user.id
    ).all()

    # Format incoming requests with full details
    incoming_formatted = []
    for req in incoming:
        incoming_formatted.append({
            "id": req.id,
            "status": req.status.value,
            "requester_name": req.requester.name,
            "requester_email": req.requester.email,
            "my_slot": {
                "id": req.their_slot.id,
                "title": req.their_slot.title,
                "start_time": req.their_slot.start_time.isoformat(),
                "end_time": req.their_slot.end_time.isoformat(),
            },
            "their_slot": {
                "id": req.my_slot.id,
                "title": req.my_slot.title,
                "start_time": req.my_slot.start_time.isoformat(),
                "end_time": req.my_slot.end_time.isoformat(),
            }
        })

    # Format outgoing requests with full details
    outgoing_formatted = []
    for req in outgoing:
        outgoing_formatted.append({
            "id": req.id,
            "status": req.status.value,
            "responder_name": req.responder.name,
            "responder_email": req.responder.email,
            "my_slot": {
                "id": req.my_slot.id,
                "title": req.my_slot.title,
                "start_time": req.my_slot.start_time.isoformat(),
                "end_time": req.my_slot.end_time.isoformat(),
            },
            "their_slot": {
                "id": req.their_slot.id,
                "title": req.their_slot.title,
                "start_time": req.their_slot.start_time.isoformat(),
                "end_time": req.their_slot.end_time.isoformat(),
            }
        })

    return {"incoming": incoming_formatted, "outgoing": outgoing_formatted}


@router.post("/swap-response/{request_id}")
def respond_to_swap(
    request_id: int,
    payload: schemas.SwapResponse,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Accept or reject a swap request"""
    # Get the swap request
    swap = db.query(models.SwapRequest).filter(
        models.SwapRequest.id == request_id
    ).first()

    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")

    # Verify current user is the responder
    if swap.responder_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot respond to this request")

    # Verify request is still pending
    if swap.status != "PENDING":
        raise HTTPException(
            status_code=400, 
            detail=f"This request has already been {swap.status.value.lower()}"
        )

    # Get both events
    my_event = db.query(models.Event).filter(models.Event.id == swap.my_slot_id).first()
    their_event = db.query(models.Event).filter(models.Event.id == swap.their_slot_id).first()

    if not my_event or not their_event:
        raise HTTPException(status_code=404, detail="One of the slots no longer exists")

    if payload.accept:
        # ACCEPT: Swap the ownership of the two slots
        temp_owner = my_event.owner_id
        my_event.owner_id = their_event.owner_id
        their_event.owner_id = temp_owner

        # Update statuses
        swap.status = "ACCEPTED"
        my_event.status = "BUSY"
        their_event.status = "BUSY"

        message = "Swap accepted successfully"
    else:
        # REJECT: Set both slots back to SWAPPABLE
        swap.status = "REJECTED"
        my_event.status = "SWAPPABLE"
        their_event.status = "SWAPPABLE"

        message = "Swap rejected successfully"

    db.commit()
    return {"message": message, "status": swap.status.value}