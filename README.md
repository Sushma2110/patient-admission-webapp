# CareFlow – Patient Admission Management App

A responsive patient admission dashboard built for the DScribe Software Engineer Intern – Round 1 task.

## Tech stack
- **Frontend:** React.js + Vite
- **Backend:** Python + FastAPI
- **Database:** SQLite for local development; PostgreSQL recommended for deployment
- **ORM / validation:** SQLAlchemy + Pydantic

## Features
- Add, list, edit and delete patient records
- Search by patient name
- Filter by ward, department and doctor
- Mark an admitted patient as discharged
- Frontend and backend validation
- Responsive desktop, tablet and mobile layout
- Persistent database storage

## Patient dropdown values
The starter dropdown values are defined in `backend/main.py` (`GENDERS`, `WARDS`, `DEPARTMENTS`, `DOCTORS`). Update these lists if DScribe expects a specific hospital list.

## Run locally

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend: http://localhost:8000  
Interactive API docs: http://localhost:8000/docs

SQLite database file `patients.db` is created automatically in the backend folder and retains data across application/server restarts.

### 2. Frontend
Open a second terminal:
```bash
cd frontend
npm install
```
Create `frontend/.env` from `.env.example`:
```env
VITE_API_URL=http://localhost:8000
```
Start React:
```bash
npm run dev
```
Frontend: http://localhost:5173

## Deployment notes

For a live submission, deploy the backend and frontend separately and use a managed PostgreSQL database so records persist across redeployments.

### Backend (Render)
1. Create a PostgreSQL database (Render PostgreSQL or Neon) and copy its connection URL.
2. Create a new **Web Service** from this GitHub repository.
3. Set the service root directory to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `DATABASE_URL` = PostgreSQL connection URL
   - `FRONTEND_ORIGIN` = deployed frontend URL (for example `https://your-app.vercel.app`)
7. Deploy and test `https://YOUR-BACKEND.onrender.com/docs`.

### Frontend (Vercel)
1. Import the same GitHub repository into Vercel.
2. Set root directory to `frontend`.
3. Framework preset: Vite.
4. Add environment variable `VITE_API_URL` = deployed backend URL, without a trailing slash.
5. Deploy and test all CRUD operations.

> Important: A local SQLite file is suitable for development. For a hosted app, use PostgreSQL with a persistent managed database. Do not commit `.env` files, database passwords, or secret keys.

## Validation rules
- Name is required and accepts letters and spaces only.
- Age is required and must be between 0 and 120.
- Gender, ward, department and doctor must match the allowed dropdown lists.
- Admission date is required and cannot be in the future.
- Backend rejects invalid payloads with clear validation messages.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/options` | Dropdown options |
| GET | `/api/patients` | List/search/filter patients |
| POST | `/api/patients` | Add patient |
| PUT | `/api/patients/{id}` | Edit patient |
| PATCH | `/api/patients/{id}/discharge` | Mark discharged |
| DELETE | `/api/patients/{id}` | Delete patient |

## Before submission
- [ ] Run the backend and frontend locally.
- [ ] Test add, list, search, all filters, edit, discharge and delete.
- [ ] Test invalid name, age above 120 and future admission date.
- [ ] Deploy backend and frontend and test the live URL.
- [ ] Add screenshots to this README (create a `screenshots/` folder).
- [ ] Push source code to a **public** GitHub repository.
- [ ] Email both repository and live links to the addresses in the task PDF, with your full name in the subject.
