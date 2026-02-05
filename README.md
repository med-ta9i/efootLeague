# efootLeague

## Project Structure
- `backend/` - Django + DRF
- `frontend-web/` - React (To be implemented)
- `mobile/` - React Native (To be implemented)
- `docker-compose.yml` - Infra (Postgres + Redis)

## Validating Backend

### Prerequisites
- Docker & Docker Compose
- Python 3.12+

### Setup
1. Start infrastructure:
   ```bash
   docker-compose up -d
   ```

2. Setup Backend:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env # Create .env if not exists
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. Access API:
   - http://localhost:8000/api/v1/
   - docs: http://localhost:8000/api/v1/schema/ (if configured) or see `docs/API_DOCS.md`
