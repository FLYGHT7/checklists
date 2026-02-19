# checklists

A series of checklists for reviewing compliance for aeronautical charts and procedure design

Note: This code is in development and provided as is, it may contain errors and you are solely resposible for using it. Any feedback is welcome.

## Local setup

1. Create and activate virtual environment:
   - Windows PowerShell:

     ```powershell
     py -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```

2. Install dependencies:

   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Create your `.env` from the template:

   ```bash
   copy .env.example .env
   ```

4. Update `.env` values:
   - `SECRET_KEY`: required.
   - `ENVIRONMENT`: use `development` for local work.
   - `DATABASE_URL`: required when using Postgres.
   - `POSTGRES_LOCALLY`: set `True` only if you want Postgres in local development.

   Example local `DATABASE_URL`:

   ```text
   postgres://postgres:postgres@localhost:5432/checklists
   ```

## Render deployment (recommended)

- `Start Command`: `gunicorn app_checklist.wsgi:application --log-file -`
- `Pre-Deploy Command`: `python manage.py migrate`
- Required env vars:
  - `ENVIRONMENT=production`
  - `SECRET_KEY=<your-production-secret>`
  - `DATABASE_URL=<supabase-session-pooler-url-with-sslmode=require>`
  - `POSTGRES_LOCALLY=False`

Run migrations and start server:

```bash
python manage.py migrate
python manage.py runserver
```
