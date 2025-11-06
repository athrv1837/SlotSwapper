from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum as PyEnum
from datetime import datetime
from app.db import Base


# ✅ Enums for slot and request statuses
class SlotStatus(str, PyEnum):
    BUSY = "BUSY"
    SWAPPABLE = "SWAPPABLE"
    SWAP_PENDING = "SWAP_PENDING"


class RequestStatus(str, PyEnum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


# ✅ User model
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    # One-to-many relationship with events
    events: Mapped[list["Event"]] = relationship(
        "Event", back_populates="owner", cascade="all, delete-orphan"
    )

    # Relationships for swap requests
    sent_requests: Mapped[list["SwapRequest"]] = relationship(
        "SwapRequest", foreign_keys="SwapRequest.requester_id", back_populates="requester"
    )
    received_requests: Mapped[list["SwapRequest"]] = relationship(
        "SwapRequest", foreign_keys="SwapRequest.responder_id", back_populates="responder"
    )


# ✅ Event model
class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[SlotStatus] = mapped_column(Enum(SlotStatus), default=SlotStatus.BUSY)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    # Relationship back to user
    owner: Mapped["User"] = relationship("User", back_populates="events")

    # Relationships for swap requests
    sent_swaps: Mapped[list["SwapRequest"]] = relationship(
        "SwapRequest", foreign_keys="SwapRequest.my_slot_id", back_populates="my_slot"
    )
    received_swaps: Mapped[list["SwapRequest"]] = relationship(
        "SwapRequest", foreign_keys="SwapRequest.their_slot_id", back_populates="their_slot"
    )


# ✅ SwapRequest model
class SwapRequest(Base):
    __tablename__ = "swap_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    responder_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    my_slot_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    their_slot_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    status: Mapped[RequestStatus] = mapped_column(Enum(RequestStatus), default=RequestStatus.PENDING)

    # Relationships
    requester: Mapped["User"] = relationship(
        "User", foreign_keys=[requester_id], back_populates="sent_requests"
    )
    responder: Mapped["User"] = relationship(
        "User", foreign_keys=[responder_id], back_populates="received_requests"
    )
    my_slot: Mapped["Event"] = relationship(
        "Event", foreign_keys=[my_slot_id], back_populates="sent_swaps"
    )
    their_slot: Mapped["Event"] = relationship(
        "Event", foreign_keys=[their_slot_id], back_populates="received_swaps"
    )