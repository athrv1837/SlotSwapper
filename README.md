# SlotSwapper

A web application that helps users manage and swap their time slots efficiently. Built with React, TypeScript, and FastAPI.

## Overview

SlotSwapper allows users to:

- Create and manage time slots
- Mark slots as available for swapping
- Find and request slot swaps with other users
- Accept or decline swap requests

### Design Choices

- **Frontend**: React with TypeScript for type safety and better developer experience
- **Backend**: FastAPI for fast, async API development with automatic OpenAPI documentation
- **Authentication**: JWT-based authentication for secure user sessions
- **Database**: SQLAlchemy ORM with SQLite for simplicity and easy setup

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

1. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

1. Install dependencies:

```bash
pip install -r requirements.txt
```

1. Start the backend server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

1. Install dependencies:

```bash
npm install
```

1. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get access token |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | Get user's events |
| POST | `/events` | Create a new event |
| PUT | `/events/{id}` | Update an event |
| DELETE | `/events/{id}` | Delete an event |

### Swap Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/swap/requests` | Get all swap requests |
| POST | `/swap/request` | Create a swap request |
| PUT | `/swap/request/{id}` | Accept/reject a request |

## Assumptions and Challenges

### Assumptions

- Users are in the same timezone (UTC used throughout)
- Minimum slot duration is 15 minutes
- Maximum slot duration is 24 hours
- Users can only have one active swap request per slot

### Challenges Addressed

- Preventing double-booking of slots
- Handling timezone conversions
- Managing concurrent swap requests
- Validating slot availability

## Note

This is an academic project developed for demonstration purposes. For production use, additional security measures and optimizations would be recommended.