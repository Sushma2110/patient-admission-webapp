import os
import re
from datetime import date
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import create_engine, Column, Integer, String, Date, select
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./patients.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Update these options to match the hospital's actual lists if required.
GENDERS = ["Male", "Female", "Other"]
WARDS = ["General Ward", "ICU", "Private Ward", "Pediatric Ward", "Maternity Ward"]
DEPARTMENTS = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine", "Emergency"]
DOCTORS = ["Dr. Ananya Rao", "Dr. Arjun Kumar", "Dr. Meera Shetty", "Dr. Rahul Nair", "Dr. Priya Sharma"]

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    ward = Column(String(60), nullable=False)
    department = Column(String(60), nullable=False)
    doctor = Column(String(100), nullable=False)
    admission_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="Admitted")

Base.metadata.create_all(bind=engine)

class PatientInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=120)
    gender: str
    ward: str
    department: str
    doctor: str
    admission_date: date
    status: str = "Admitted"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if not value or not re.fullmatch(r"[A-Za-z ]+", value):
            raise ValueError("Name is required and must contain letters only.")
        return value

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value):
        if value not in GENDERS:
            raise ValueError("Please select a valid gender.")
        return value

    @field_validator("ward")
    @classmethod
    def validate_ward(cls, value):
        if value not in WARDS:
            raise ValueError("Please select a valid ward.")
        return value

    @field_validator("department")
    @classmethod
    def validate_department(cls, value):
        if value not in DEPARTMENTS:
            raise ValueError("Please select a valid department.")
        return value

    @field_validator("doctor")
    @classmethod
    def validate_doctor(cls, value):
        if value not in DOCTORS:
            raise ValueError("Please select a valid doctor.")
        return value

    @field_validator("admission_date")
    @classmethod
    def validate_date(cls, value):
        if value > date.today():
            raise ValueError("Admission date cannot be in the future.")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        if value not in ["Admitted", "Discharged"]:
            raise ValueError("Status must be Admitted or Discharged.")
        return value

app = FastAPI(title="DScribe Patient Admission API", version="1.0.0")

origins = os.getenv("FRONTEND_ORIGIN", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def patient_dict(patient):
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "ward": patient.ward,
        "department": patient.department,
        "doctor": patient.doctor,
        "admission_date": patient.admission_date.isoformat(),
        "status": patient.status,
    }

@app.get("/")
def root():
    return {"message": "DScribe Patient Admission API is running"}

@app.get("/api/options")
def get_options():
    return {"genders": GENDERS, "wards": WARDS, "departments": DEPARTMENTS, "doctors": DOCTORS}

@app.get("/api/patients")
def list_patients(
    search: Optional[str] = Query(default=None),
    ward: Optional[str] = Query(default=None),
    department: Optional[str] = Query(default=None),
    doctor: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(Patient)
    if search:
        stmt = stmt.where(Patient.name.ilike(f"%{search.strip()}%") if engine.dialect.name == "postgresql"
                          else Patient.name.like(f"%{search.strip()}%"))
    if ward:
        stmt = stmt.where(Patient.ward == ward)
    if department:
        stmt = stmt.where(Patient.department == department)
    if doctor:
        stmt = stmt.where(Patient.doctor == doctor)
    patients = db.scalars(stmt.order_by(Patient.id.desc())).all()
    return [patient_dict(p) for p in patients]

@app.post("/api/patients", status_code=201)
def create_patient(payload: PatientInput, db: Session = Depends(get_db)):
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient_dict(patient)

@app.put("/api/patients/{patient_id}")
def update_patient(patient_id: int, payload: PatientInput, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    for key, value in payload.model_dump().items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient_dict(patient)

@app.patch("/api/patients/{patient_id}/discharge")
def discharge_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    patient.status = "Discharged"
    db.commit()
    db.refresh(patient)
    return patient_dict(patient)

@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully."}
