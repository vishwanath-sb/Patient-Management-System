from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from database import get_db, engine, Base
from models import Doctor, Patient
from schemas import (
    DoctorRegister, DoctorLogin, DoctorResponse, Token,
    PatientCreate, PatientUpdate, PatientResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_doctor, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Patient Management System API",
    description="A REST API for managing patient records",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint - API health check"""
    return {
        "message": "Patient Management System API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Authentication Endpoints
@app.post("/auth/register", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(doctor_data: DoctorRegister, db: Session = Depends(get_db)):
    # Check if doctor already exists
    existing_doctor = db.query(Doctor).filter(Doctor.email == doctor_data.email).first()
    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new doctor
    hashed_password = get_password_hash(doctor_data.password)
    new_doctor = Doctor(
        name=doctor_data.name,
        email=doctor_data.email,
        password_hash=hashed_password
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    
    return new_doctor

@app.post("/auth/login", response_model=Token)
def login_doctor(login_data: DoctorLogin, db: Session = Depends(get_db)):
    # Find doctor by email
    doctor = db.query(Doctor).filter(Doctor.email == login_data.email).first()
    if not doctor or not verify_password(login_data.password, doctor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": doctor.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=DoctorResponse)
def get_current_doctor_info(current_doctor: Doctor = Depends(get_current_doctor)):
    return current_doctor

# Patient Endpoints (All Protected)
@app.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    new_patient = Patient(**patient_data.model_dump())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return new_patient

@app.get("/patients", response_model=List[PatientResponse])
def list_patients(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patients = db.query(Patient).all()
    return patients

@app.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient

@app.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Update only provided fields
    update_data = patient_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)
    
    db.commit()
    db.refresh(patient)
    
    return patient

@app.delete("/patients/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    db.delete(patient)
    db.commit()
    
    return {"message": "Patient deleted successfully"}
