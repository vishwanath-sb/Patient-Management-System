import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, getToken, removeToken } from '@/utils/api';

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
}

export default function Dashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    diagnosis: '',
    prescription: '',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPatients();
  }, [router]);

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData({
      name: '',
      city: '',
      age: '',
      gender: 'male',
      height: '',
      weight: '',
      diagnosis: '',
      prescription: '',
    });
    setShowModal(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      city: patient.city,
      age: patient.age.toString(),
      gender: patient.gender,
      height: patient.height.toString(),
      weight: patient.weight.toString(),
      diagnosis: patient.diagnosis || '',
      prescription: patient.prescription || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientData = {
      name: formData.name,
      city: formData.city,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      diagnosis: formData.diagnosis || undefined,
      prescription: formData.prescription || undefined,
    };

    try {
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, patientData);
      } else {
        await api.createPatient(patientData);
      }
      setShowModal(false);
      fetchPatients();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      try {
        await api.deletePatient(id);
        fetchPatients();
      } catch (error: any) {
        alert(error.message);
      }
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

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>Patient Management Dashboard</h1>
          <div className="header-actions">
            <button className="btn btn-small" onClick={openAddModal}>
              Add Patient
            </button>
            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {patients.length === 0 ? (
          <div className="text-center">
            <p>No patients found. Add your first patient!</p>
          </div>
        ) : (
          <div className="patients-grid">
            {patients.map((patient) => (
              <div key={patient.id} className="patient-card">
                <h3>{patient.name}</h3>
                <div className="patient-info">
                  <p><strong>Age:</strong> {patient.age} years</p>
                  <p><strong>Gender:</strong> {patient.gender}</p>
                  <p><strong>City:</strong> {patient.city}</p>
                  <p><strong>Height:</strong> {patient.height}m</p>
                  <p><strong>Weight:</strong> {patient.weight}kg</p>
                  <p><strong>BMI:</strong> {patient.bmi}</p>
                  <div className={getBadgeClass(patient.verdict)}>{patient.verdict}</div>
                  {patient.diagnosis && (
                    <p><strong>Diagnosis:</strong> {patient.diagnosis}</p>
                  )}
                  {patient.prescription && (
                    <p><strong>Prescription:</strong> {patient.prescription}</p>
                  )}
                </div>
                <div className="patient-actions">
                  <button
                    className="btn btn-small"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => openEditModal(patient)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(patient.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="1"
                  max="119"
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="form-group">
                <label>Height (meters)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  min="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  min="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Diagnosis (optional)</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Prescription (optional)</label>
                <textarea
                  value={formData.prescription}
                  onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn">
                  {editingPatient ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
