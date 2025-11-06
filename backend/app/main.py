from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import time
from app.middleware.rate_limiter import rate_limiter, api_stats
from app.db import Base, engine
from app.core.config import settings
from app.routers import auth, events, swap

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enhanced SlotSwapper API with advanced features for slot management and swapping",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.middleware("http")
async def add_api_version(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-API-Version"] = "2.0.0"
    return response

# Include routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(swap.router)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests", "retry_after": "60 seconds"}
        )
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Update API stats
    api_stats.update_stats(
        endpoint=str(request.url.path),
        status_code=response.status_code,
        response_time=process_time
    )
    
    return response

@app.get("/")
async def root():
    return {
        "service": "Enhanced SlotSwapper API",
        "version": "2.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/stats")
async def get_api_stats():
    """Get API usage statistics"""
    return api_stats.get_stats()