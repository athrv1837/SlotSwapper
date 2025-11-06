from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        self.requests[client_ip] = [req_time for req_time in self.requests[client_ip] 
                                  if req_time > minute_ago]
        
        # Check if allowed
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return False
        
        # Add new request
        self.requests[client_ip].append(now)
        return True

class APIStats:
    def __init__(self):
        self.total_requests = 0
        self.endpoint_stats = defaultdict(int)
        self.status_codes = defaultdict(int)
        self.average_response_time = 0
        self._total_response_time = 0
    
    def update_stats(self, endpoint: str, status_code: int, response_time: float):
        self.total_requests += 1
        self.endpoint_stats[endpoint] += 1
        self.status_codes[status_code] += 1
        self._total_response_time += response_time
        self.average_response_time = self._total_response_time / self.total_requests
    
    def get_stats(self):
        return {
            "total_requests": self.total_requests,
            "endpoint_stats": dict(self.endpoint_stats),
            "status_codes": dict(self.status_codes),
            "average_response_time": round(self.average_response_time, 3)
        }

# Global instances
rate_limiter = RateLimiter()
api_stats = APIStats()