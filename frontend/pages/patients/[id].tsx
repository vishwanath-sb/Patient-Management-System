import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, getToken } from '@/utils/api';

interface Patient {
  id: number;
  name: string;
  city: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  diagnosis?: string;
  prescription?: string;
  bmi: number;
  verdict: string;
  created_at: string;
}

export default function PatientDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    if (id) {
      fetchPatient(parseInt(id as string));
    }
  }, [id, router]);

  const fetchPatient = async (patientId: number) => {
    try {
      const data = await api.getPatient(patientId);
      setPatient(data);
    } catch (error) {
      console.error('Failed to fetch patient:', error);
      alert('Patient not found');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'underweight':
        return 'badge badge-underweight';
      case 'normal':
        return 'badge badge-normal';
      case 'overweight':
        return 'badge badge-overweight';
      case 'obese':
        return 'badge badge-obese';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!patient) {
    return <div className="container">Patient not found</div>;
  }

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>Patient Details</h1>
          <div className="header-actions">
            <button className="btn btn-small" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="patient-detail">
          <h2>{patient.name}</h2>
          
          <div className="detail-grid">
            <div className="detail-item">
              <label>Patient ID</label>
              <value>{patient.id}</value>
            </div>
            <div className="detail-item">
              <label>Age</label>
              <value>{patient.age} years</value>
            </div>
            <div className="detail-item">
              <label>Gender</label>
              <value>{patient.gender}</value>
            </div>
            <div className="detail-item">
              <label>City</label>
              <value>{patient.city}</value>
            </div>
            <div className="detail-item">
              <label>Height</label>
              <value>{patient.height} meters</value>
            </div>
            <div className="detail-item">
              <label>Weight</label>
              <value>{patient.weight} kg</value>
            </div>
            <div className="detail-item">
              <label>BMI</label>
              <value>{patient.bmi}</value>
            </div>
            <div className="detail-item">
              <label>Health Verdict</label>
              <value>
                <div className={getBadgeClass(patient.verdict)}>{patient.verdict}</div>
              </value>
            </div>
            {patient.diagnosis && (
              <div className="detail-item detail-full">
                <label>Diagnosis</label>
                <value>{patient.diagnosis}</value>
              </div>
            )}
            {patient.prescription && (
              <div className="detail-item detail-full">
                <label>Prescription</label>
                <value>{patient.prescription}</value>
              </div>
            )}
            <div className="detail-item detail-full">
              <label>Created At</label>
              <value>{new Date(patient.created_at).toLocaleString()}</value>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
