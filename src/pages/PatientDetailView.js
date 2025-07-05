import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import generatePrescriptionPDF from '../utils/generatePrescriptionPDF';
import './PatientDetailView.css';

// Helper function for smooth scrolling navigation
const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
        const headerOffset = 80; // Adjust this value based on your fixed header's height, if any
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
};

const PatientDetailView = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [ehr, setEhr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // State for the action forms
    const [diagnosis, setDiagnosis] = useState({ diagnosis: '', notes: '' });
    const [prescription, setPrescription] = useState({ medicineName: '', dosage: '', frequency: '', duration: '' });
    const [labTest, setLabTest] = useState({ testName: '' });


    const [inventoryItems, setInventoryItems] = useState([]);

    const fetchData = useCallback(async () => {

        setError('');
        try {
            // Fetch patient and EHR data in parallel
            const [patientRes, ehrRes, inventoryRes] = await Promise.all([
                api.get(`/staff-patients/${patientId}`),
                api.get(`/ehr/${patientId}`),
                api.get('/inventory')
            ]);
            setPatient(patientRes.data);
            setEhr(ehrRes.data);
            setInventoryItems(inventoryRes.data);
        } catch (err) {
            setError('Failed to fetch patient data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pharmacyItems = useMemo(() =>
        inventoryItems.filter(item => item.category === 'Pharmacy'),
        [inventoryItems]);

    // We assume lab tests are defined as 'Services' linked to inventory,
    // but for simplicity here, we'll filter inventory items categorized as 'Lab Test'.
    // A better approach would be to fetch from the 'services' collection.
    const labTestItems = useMemo(() => {

        return inventoryItems.filter(item => item.category === 'General Supplies');
    }, [inventoryItems]);

    const handleFormSubmit = async (e, type) => {
        e.preventDefault();
        setMessage('');
        let successMessage = '';
        try {
            if (type === 'diagnosis') {
                await api.post(`/ehr/${patientId}/diagnosis`, diagnosis);
                successMessage = 'Diagnosis added successfully!';
                setDiagnosis({ diagnosis: '', notes: '' });
            } else if (type === 'prescription') {
                await api.post('/prescriptions', { patientId, medications: [prescription] });
                successMessage = 'Prescription created successfully!';
                setPrescription({ medicineName: '', dosage: '', frequency: '', duration: '' });
            } else if (type === 'labTest') {
                await api.post('/labtests', { patientId, testName: labTest.testName });
                successMessage = 'Lab test ordered successfully!';
                setLabTest({ testName: '' });
            }
            setMessage(successMessage);
            fetchData(); // Refresh all data after a successful action
        } catch (err) {
            setMessage(err.response?.data?.message || 'Action failed.');
        }
    };

    // Handlers to update form state
    const handleDiagnosisChange = e => setDiagnosis({ ...diagnosis, [e.target.name]: e.target.value });
    const handlePrescriptionChange = e => setPrescription({ ...prescription, [e.target.name]: e.target.value });
    const handleLabTestChange = e => setLabTest({ ...labTest, [e.target.name]: e.target.value });


    if (loading) return <div className="dashboard-page"><p>Loading Patient EHR...</p></div>;
    if (error) return <div className="dashboard-page"><p className="error-message">{error}</p></div>;
    if (!patient || !ehr) return <div className="dashboard-page"><p>No data found for this patient.</p></div>;

    const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

    const handleDownloadPrescription = (prescription) => {
        if (!patient || !prescription.doctor) {
            alert("Cannot generate PDF, essential data is missing.");
            return;
        }

        // Prepare the data objects for the PDF generator
        const patientDetails = {
            name: `${patient.firstName} ${patient.lastName}`,
            age: `${age} Years`,
            gender: patient.gender,
            uhid: patient.uhid
        };

        const doctorDetails = {
            firstName: prescription.doctor.firstName,
            lastName: prescription.doctor.lastName,
            // You can add more details like qualifications here if available
        };

        const prescriptionDetails = {
            date: prescription.createdAt,
            medications: prescription.medications
        };

        generatePrescriptionPDF(prescriptionDetails, patientDetails, doctorDetails);
    };

    return (
        <div className="ehr-page-layout">
            {/* --- 1. Left Sticky Sidebar --- */}
            <aside className="ehr-sidebar">
                <div className="patient-summary-card">
                    <div className="patient-avatar-large">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                    </div>
                    <h3>{patient.firstName} {patient.lastName}</h3>
                    <p>{patient.gender}, {age} years old</p>
                    <div className="patient-contact-info">
                        <span><strong>UHID:</strong> {patient.uhid}</span>
                        <span><strong>Phone:</strong> {patient.phone}</span>
                    </div>
                </div>
                <nav className="ehr-nav">
                    <a onClick={() => scrollToSection('ehr-actions')}>Actions</a>
                    <a onClick={() => scrollToSection('ehr-vitals')}>Vitals History</a>
                    <a onClick={() => scrollToSection('ehr-diagnoses')}>Diagnosis History</a>
                    <a onClick={() => scrollToSection('ehr-prescriptions')}>Prescription History</a>
                    <a onClick={() => scrollToSection('ehr-labs')}>Lab Reports</a>
                </nav>
            </aside>

            {/* --- 2. Right Scrollable Main Content --- */}
            <main className="ehr-main-content">
                <header className="ehr-header">
                    <h1>Electronic Health Record</h1>
                    {message && <p style={{ color: 'var(--success-color)', fontStyle: 'italic' }}>{message}</p>}
                </header>

                <section id="ehr-actions" className="ehr-section">
                    <h3>Doctor's Actions</h3>
                    <div className="actions-grid">
                        <form onSubmit={(e) => handleFormSubmit(e, 'diagnosis')} className="dashboard-form-container">
                            <h4>Add Diagnosis</h4>
                            <div className="form-group"><input type="text" name="diagnosis" placeholder="Diagnosis" value={diagnosis.diagnosis} onChange={handleDiagnosisChange} required /></div>
                            <div className="form-group"><textarea name="notes" placeholder="Doctor's Notes" value={diagnosis.notes} onChange={handleDiagnosisChange}></textarea></div>
                            <button type="submit" className="btn btn-primary">Save Diagnosis</button>
                        </form>
                        <form onSubmit={(e) => handleFormSubmit(e, 'prescription')} className="dashboard-form-container">
                            <h4>Create Prescription</h4>
                            <div className="form-group">
                                <label>Medicine Name</label>
                                <input
                                    type="text"
                                    list="pharmacy-items-list"
                                    placeholder="Type or select a medicine..."
                                    name="medicineName"
                                    value={prescription.medicineName}
                                    onChange={handlePrescriptionChange}
                                    required
                                />
                                <datalist id="pharmacy-items-list">
                                    {pharmacyItems.map(item => (
                                        <option key={item._id} value={item.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="form-group"><input type="text" placeholder="Dosage (e.g., 500mg)" name="dosage" value={prescription.dosage} onChange={handlePrescriptionChange} required /></div>
                            <div className="form-group"><input type="text" placeholder="Frequency (e.g., 1-0-1)" name="frequency" value={prescription.frequency} onChange={handlePrescriptionChange} required /></div>
                            <div className="form-group"><input type="text" placeholder="Duration (e.g., 7 days)" name="duration" value={prescription.duration} onChange={handlePrescriptionChange} required /></div>
                            <button type="submit" className="btn btn-primary">Add Prescription</button>
                        </form>
                        <form onSubmit={(e) => handleFormSubmit(e, 'labTest')} className="dashboard-form-container">
                            <h4>Order Lab Test</h4>
                            <div className="form-group">
                                <label>Test Name</label>
                                <input
                                    type="text"
                                    list="lab-test-list"
                                    placeholder="Type or select a test..."
                                    name="testName"
                                    value={labTest.testName}
                                    onChange={handleLabTestChange}
                                    required
                                />
                                <datalist id="lab-test-list">
                                    {labTestItems.map(item => (
                                        <option key={item._id} value={item.name} />
                                    ))}
                                </datalist>
                            </div>
                            <button type="submit" className="btn btn-primary">Order Test</button>
                        </form>
                    </div>
                </section>

                <section id="ehr-vitals" className="ehr-section">
                    <h3>Vitals History</h3>
                    <div className="timeline">
                        {ehr.vitals.length > 0 ? ehr.vitals.slice().reverse().map(v => (
                            <div key={v._id} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <span className="timeline-date">{new Date(v.recordedAt).toLocaleString()}</span>
                                    <p><strong>BP:</strong> {v.bloodPressure} | <strong>Temp:</strong> {v.temperature}°C | <strong>HR:</strong> {v.heartRate} bpm | <strong>RR:</strong> {v.respiratoryRate} breaths/min</p>
                                    <small>Recorded by: {v.recordedBy?.firstName} {v.recordedBy?.lastName} ({v.recordedBy?.role})</small>
                                </div>
                            </div>
                        )) : <p>No vitals recorded.</p>}
                    </div>
                </section>

                <section id="ehr-diagnoses" className="ehr-section">
                    <h3>Diagnosis History</h3>
                    <div className="timeline">
                        {ehr.diagnoses.length > 0 ? ehr.diagnoses.slice().reverse().map(d => (
                            <div key={d._id} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <span className="timeline-date">{new Date(d.diagnosedAt).toLocaleString()}</span>
                                    <h4>{d.diagnosis}</h4>
                                    <p>{d.notes}</p>
                                    <small>Diagnosed by: Dr. {d.diagnosedBy?.firstName} {d.diagnosedBy?.lastName}</small>
                                </div>
                            </div>
                        )) : <p>No diagnoses recorded.</p>}
                    </div>
                </section>

                <section id="ehr-prescriptions" className="ehr-section">
                    <h3>Prescription History</h3>
                    {ehr.prescriptions.length > 0 ? ehr.prescriptions.slice().reverse().map(p => (
                        <div key={p._id} className="record-card">
                            <div className="record-header">
                                <span>Prescribed on {new Date(p.createdAt).toLocaleDateString()}</span>
                                <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                                <button onClick={() => handleDownloadPrescription(p)} className="btn btn-secondary btn-sm">Download PDF</button>
                            </div>
                            <ul>{p.medications.map((m, i) => <li key={i}>{m.medicineName} ({m.dosage}) - {m.frequency} for {m.duration}</li>)}</ul>
                            <small>Prescribed by: Dr. {p.doctor?.firstName} {p.doctor?.lastName}</small>
                        </div>
                    )) : <p>No prescriptions found.</p>}
                </section>

                <section id="ehr-labs" className="ehr-section">
                    <h3>Lab Report History</h3>
                    {ehr.labReports.length > 0 ? ehr.labReports.slice().reverse().map(r => (
                        <div key={r._id} className="record-card">
                            <div className="record-header">
                                <span>{r.testName}</span>
                                <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span>
                            </div>
                            <p><strong>Result:</strong> {r.result || 'Pending'}</p>
                            {r.reportUrl && <a href={`https://hms-backend-uoai.onrender.com${r.reportUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View Full Report</a>}
                            <small>Ordered by: Dr. {r.doctor?.firstName} {r.doctor?.lastName}</small>
                        </div>
                    )) : <p>No lab reports found.</p>}
                </section>
            </main>
        </div>
    );
};

export default PatientDetailView;