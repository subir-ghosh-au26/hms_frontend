import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import './NurseDashboard.css'; // <-- The new dedicated CSS file

// Sub-component for the vitals entry form
const VitalsForm = ({ patient, onVitalsSubmit, onCancel }) => {
    const [vitals, setVitals] = useState({ bloodPressure: '', temperature: '', heartRate: '', respiratoryRate: '' });
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleVitalsChange = (e) => {
        setVitals({ ...vitals, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        try {
            await api.post(`/ehr/${patient._id}/vitals`, vitals);
            setMessage({ text: 'Vitals submitted successfully!', type: 'success' });
            setTimeout(() => {
                onVitalsSubmit(patient._id); // Notify parent to collapse/refresh
            }, 1500);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to submit vitals', type: 'error' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="vitals-form">
            {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
            <div className="form-grid">
                <div className="form-group"><label>Blood Pressure</label><input type="text" name="bloodPressure" value={vitals.bloodPressure} onChange={handleVitalsChange} placeholder="e.g., 120/80" required /></div>
                <div className="form-group"><label>Heart Rate (bpm)</label><input type="number" name="heartRate" value={vitals.heartRate} onChange={handleVitalsChange} required /></div>
                <div className="form-group"><label>Temperature (°C)</label><input type="number" name="temperature" value={vitals.temperature} step="0.1" onChange={handleVitalsChange} required /></div>
                <div className="form-group"><label>Respiratory Rate</label><input type="number" name="respiratoryRate" value={vitals.respiratoryRate} onChange={handleVitalsChange} required /></div>
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vitals</button>
            </div>
        </form>
    );
};


const NurseDashboard = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState(null); // ID of patient whose card is expanded

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                // In a real app, this would fetch patients assigned to THIS nurse
                // For now, we fetch all patients
                const res = await api.get('/staff-patients');
                setPatients(res.data);
            } catch (err) {
                setError("Failed to fetch assigned patients.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const handleCardClick = (patientId) => {
        // Toggle the selected patient card
        setSelectedPatientId(selectedPatientId === patientId ? null : patientId);
    };

    if (loading) return <div className="dashboard-page"><p>Loading patient list...</p></div>;
    if (error) return <div className="dashboard-page"><p className="error-message">{error}</p></div>;

    return (
        <div className="dashboard-page nurse-dashboard">
            <header className="nurse-header">
                <h1>Nurse Station</h1>
                <p>Welcome, {user?.firstName}. You have {patients.length} patients in your care today.</p>
            </header>

            <div className="patient-queue-container">
                <h3>Patient Queue</h3>
                <div className="patient-queue">
                    {patients.length > 0 ? patients.map(patient => (
                        <div key={patient._id} className="patient-task-card">
                            <div className="card-summary" onClick={() => handleCardClick(patient._id)}>
                                <div className="patient-info">
                                    <div className="patient-avatar">{patient.firstName.charAt(0)}{patient.lastName.charAt(0)}</div>
                                    <div>
                                        <span className="patient-name">{patient.firstName} {patient.lastName}</span>
                                        <span className="patient-details">UHID: {patient.uhid} | Age: {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} | Gender: {patient.gender}</span>
                                    </div>
                                </div>
                                <div className="card-status-indicator">
                                    {/* Logic here could show if vitals are recent or overdue */}
                                    <span className="status-badge status-pending">Vitals Due</span>
                                    <span className="expand-icon">{selectedPatientId === patient._id ? '▲' : '▼'}</span>
                                </div>
                            </div>
                            {/* Expandable form section */}
                            {selectedPatientId === patient._id && (
                                <div className="card-details-expanded">
                                    <VitalsForm
                                        patient={patient}
                                        onVitalsSubmit={() => setSelectedPatientId(null)} // Collapse on successful submit
                                        onCancel={() => setSelectedPatientId(null)}
                                    />
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="empty-message">No patients currently assigned.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NurseDashboard;