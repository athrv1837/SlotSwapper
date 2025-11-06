from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, schemas
from app.utils import hash_password, verify_password
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserOut)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT token"""
    # Find user by email
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    
    # Verify credentials
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token with user ID (NOT email)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}