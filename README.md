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
   - `DATABASE_URL`: required by current settings (project is currently configured to use Postgres locally).

   Example local `DATABASE_URL`:

   ```
   postgres://postgres:postgres@localhost:5432/checklists
   ```

5. Run migrations and start server:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
