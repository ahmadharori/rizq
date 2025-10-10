# RizQ Backend API

FastAPI backend for RizQ - Sembako Delivery Assignment Dashboard

## Tech Stack

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database with PostGIS extension (for future geographic features)
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- PostgreSQL 14+
- pip

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rizq_db
SECRET_KEY=your-secret-key-change-in-production
```

### 4. Database Setup

Create database:
```bash
createdb rizq_db
```

Run migrations:
```bash
python -m alembic upgrade head
```

Seed admin user:
```bash
python seed_admin.py
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123!`

### 5. Run Development Server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Server will be available at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /auth/login` - Login (returns JWT token)
- `GET /auth/me` - Get current user info (requires authentication)

### Health Check

- `GET /health` - Health check endpoint
- `GET /` - Root endpoint (API info)

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   └── versions/         # Migration files
├── app/
│   ├── api/             # API routes
│   │   └── auth.py      # Authentication endpoints
│   ├── models/          # SQLAlchemy models
│   │   ├── base.py      # Base model
│   │   └── user.py      # User model
│   ├── schemas/         # Pydantic schemas
│   │   └── user.py      # User schemas
│   ├── services/        # Business logic (empty for now)
│   ├── utils/           # Utilities
│   │   ├── constants.py # Constants and enums
│   │   └── security.py  # JWT & password hashing
│   ├── config.py        # Configuration
│   ├── database.py      # Database connection
│   ├── dependencies.py  # FastAPI dependencies
│   └── main.py          # FastAPI application
├── tests/               # Tests (to be added)
├── .env                 # Environment variables (gitignored)
├── .env.example         # Environment template
├── alembic.ini          # Alembic configuration
├── requirements.txt     # Python dependencies
└── seed_admin.py        # Admin user seeder
```

## Development

### Create New Migration

```bash
python -m alembic revision --autogenerate -m "description"
```

### Apply Migrations

```bash
python -m alembic upgrade head
```

### Rollback Migration

```bash
python -m alembic downgrade -1
```

## Testing

To test authentication:

1. Start the server
2. Go to http://localhost:8000/docs
3. Try the `/auth/login` endpoint with:
   - username: `admin`
   - password: `admin123!`
4. Copy the `access_token` from the response
5. Click "Authorize" button and paste the token
6. Test the `/auth/me` endpoint

## Next Steps (Sprint 1.1 Remaining Tasks)

- [ ] Setup frontend (React + Vite + Tailwind)
- [ ] Docker Compose configuration
- [ ] Create remaining database models (recipients, couriers, assignments)
- [ ] Seed regional data (provinces, cities, districts, villages)

## Notes

- PostGIS extension will be enabled in a future migration when needed for recipients table
- Change default admin password after first login
- Keep `.env` file secure and never commit it to git
