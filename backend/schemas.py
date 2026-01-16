from pydantic import BaseModel, Field, EmailStr, computed_field
from typing import Annotated, Literal, Optional
from datetime import datetime

# Doctor Schemas
class DoctorRegister(BaseModel):
    name: Annotated[str, Field(..., description="Doctor's name")]
    email: Annotated[EmailStr, Field(..., description="Doctor's email")]
    password: Annotated[str, Field(..., min_length=6, description="Password (min 6 chars)")]

class DoctorLogin(BaseModel):
    email: Annotated[EmailStr, Field(..., description="Doctor's email")]
    password: Annotated[str, Field(..., description="Doctor's password")]

class DoctorResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Patient Schemas
class PatientCreate(BaseModel):
    name: Annotated[str, Field(..., description="Patient's name")]
    city: Annotated[str, Field(..., description="City where the patient lives")]
    age: Annotated[int, Field(..., gt=0, lt=120, description="Age of the patient")]
    gender: Annotated[Literal['male', 'female', 'others'], Field(..., description="Gender of the patient")]
    height: Annotated[float, Field(..., gt=0, description="Height in meters")]
    weight: Annotated[float, Field(..., gt=0, description="Weight in kilograms")]
    diagnosis: Annotated[Optional[str], Field(default=None, description="Patient diagnosis")]
    prescription: Annotated[Optional[str], Field(default=None, description="Patient prescription")]

class PatientUpdate(BaseModel):
    name: Annotated[Optional[str], Field(default=None)]
    city: Annotated[Optional[str], Field(default=None)]
    age: Annotated[Optional[int], Field(default=None, gt=0, lt=120)]
    gender: Annotated[Optional[Literal['male', 'female', 'others']], Field(default=None)]
    height: Annotated[Optional[float], Field(default=None, gt=0)]
    weight: Annotated[Optional[float], Field(default=None, gt=0)]
    diagnosis: Annotated[Optional[str], Field(default=None)]
    prescription: Annotated[Optional[str], Field(default=None)]

class PatientResponse(BaseModel):
    id: int
    name: str
    city: str
    age: int
    gender: str
    height: float
    weight: float
    diagnosis: Optional[str]
    prescription: Optional[str]
    created_at: datetime

    @computed_field
    @property
    def bmi(self) -> float:
        return round(self.weight / (self.height ** 2), 2)
    
    @computed_field
    @property
    def verdict(self) -> str:
        bmi_value = self.bmi
        if bmi_value < 18.5:
            return 'Underweight'
        elif bmi_value < 25:
            return 'Normal'
        elif bmi_value < 30:
            return 'Overweight'
        else:
            return 'Obese'

    class Config:
        from_attributes = True
