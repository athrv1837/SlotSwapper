from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ✅ Token Schema for Login Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ✅ User Registration Schema
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)


# ✅ User Login Schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ✅ User Output Schema
class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# ✅ Event Schemas
class EventBase(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    status: Optional[str] = "BUSY"


class EventCreate(EventBase):
    pass


class EventOut(EventBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


# ✅ Swap Schemas
class SwapRequestCreate(BaseModel):
    mySlotId: int
    theirSlotId: int


class SwapResponse(BaseModel):
    accept: bool