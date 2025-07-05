import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import './PatientDirectory.css';

import generatePrescriptionPDF from '../../utils/generatePrescriptionPDF';
import generateLabReportPDF from '../../utils/generateLabReportPDF';

const PatientDirectory = () => {
    const [allPatients, setAllPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedPatientEhr, setSelectedPatientEhr] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            setLoadingList(true);
            setError('');
            try {
                const res = await api.get('/patients');
                if (Array.isArray(res.data)) {
                    setAllPatients(res.data);
                } else {
                    // This handles cases where the API might return something unexpected
                    console.error("API did not return an array for patients:", res.data);
                    setAllPatients([]);
                }
            } catch (err) {
                console.error("Failed to fetch patients:", err);
                setError('Could not load the patient directory.');
            } finally {
                setLoadingList(false);
            }
        };
        fetchPatients();
    }, []);

    const filteredPatients = useMemo(() => {
        // Start with the full list
        let patientsToFilter = allPatients;

        // If there's a search term, apply the filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            patientsToFilter = allPatients.filter(p => {
                // Defensive checks for each property before using it
                const firstName = p.firstName || '';
                const lastName = p.lastName || '';
                const uhid = p.uhid || '';

                return (
                    firstName.toLowerCase().includes(searchLower) ||
                    lastName.toLowerCase().includes(searchLower) ||
                    uhid.toLowerCase().includes(searchLower)
                );
            });
        }

        return patientsToFilter;

    }, [allPatients, searchTerm]);

    const handleSelectPatient = async (patient) => {
        if (selectedPatient?._id === patient._id) return;
        setSelectedPatient(patient);
        setLoadingDetails(true);
        setSelectedPatientEhr(null);
        try {
            const res = await api.get(`/ehr/${patient._id}`);
            setSelectedPatientEhr(res.data);
        } catch (error) {
            console.error("Failed to fetch EHR for patient", error);
            setSelectedPatientEhr({ error: "Could not load patient records." });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDownloadPrescription = (prescription) => {
        if (!selectedPatient || !prescription.doctor) {
            alert("Cannot generate PDF, essential patient or doctor data is missing.");
            return;
        }

        const age = new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear();

        generatePrescriptionPDF(
            { // prescriptionDetails
                date: prescription.createdAt,
                medications: prescription.medications
            },
            { // patientDetails
                name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                age: `${age} Years`,
                gender: selectedPatient.gender,
                uhid: selectedPatient.uhid
            },
            { // doctorDetails
                firstName: prescription.doctor.firstName,
                lastName: prescription.doctor.lastName
            }
        );
    };

    const handleDownloadLabReport = (test) => {
        if (!selectedPatient || !test.doctor || !test.completedBy) {
            alert("Cannot generate PDF, essential data is missing.");
            return;
        }

        const age = new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear();

        generateLabReportPDF(
            { // testDetails
                testName: test.testName,
                result: test.result,
                technicianName: `${test.completedBy.firstName} ${test.completedBy.lastName}`
            },
            { // patientDetails
                name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                age: age,
                gender: selectedPatient.gender,
                uhid: selectedPatient.uhid,
            },
            { // doctorDetails
                firstName: test.doctor.firstName,
                lastName: test.doctor.lastName
            }
        );
    };

    // --- RENDER LOGIC with CORRECTED variable names ---
    return (
        <div className="dashboard-page patient-directory-layout">
            <aside className="directory-sidebar">
                <header className="directory-sidebar-header">
                    <h3>Patient Directory ({filteredPatients.length})</h3>
                    <div className="search-bar-container">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by Name or UHID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="history-search-input"
                        />
                    </div>
                </header>
                <div className="patient-master-list">
                    {loadingList ? (
                        <p>Loading patients...</p>
                    ) : error ? (
                        <p className="error-text">{error}</p>
                    ) : filteredPatients.length > 0 ? (
                        filteredPatients.map(p => (
                            <div
                                key={p._id}
                                className={`patient-list-card ${selectedPatient?._id === p._id ? 'selected' : ''}`}
                                onClick={() => handleSelectPatient(p)}
                            >
                                <div className="patient-avatar">{(p.firstName?.charAt(0) || '')}{(p.lastName?.charAt(0) || '')}</div>
                                <div className="patient-info">
                                    <span className="patient-name">{p.firstName} {p.lastName}</span>
                                    <span className="patient-uhid">UHID: {p.uhid}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="empty-list-message">No patients found.</p>
                    )}
                </div>
            </aside>

            <main className="directory-main-content">
                {loadingDetails ? (
                    <div className="placeholder-container">Loading Patient Details...</div>
                ) : selectedPatient && selectedPatientEhr ? (
                    <div className="ehr-details-view">
                        <header className="ehr-details-header">
                            {/* --- CORRECTED: Use selectedPatient --- */}
                            <h2>{selectedPatient.firstName} {selectedPatient.lastName}'s Full Record</h2>
                            <p>UHID: {selectedPatient.uhid} | Phone: {selectedPatient.phone}</p>
                        </header>

                        {selectedPatientEhr.error ? <p className="error-message">{selectedPatientEhr.error}</p> : (
                            <>
                                <section className="ehr-section">
                                    <h3>Diagnosis History</h3>
                                    <div className="timeline">
                                        {selectedPatientEhr.diagnoses?.length > 0 ? selectedPatientEhr.diagnoses.slice().reverse().map(d => (
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
                                <section className="ehr-section">
                                    <h3>Prescription History</h3>
                                    {selectedPatientEhr.prescriptions?.length > 0 ? selectedPatientEhr.prescriptions.slice().reverse().map(p => (
                                        <div key={p._id} className="record-card">
                                            <div className="record-header">
                                                <span>Prescribed on {new Date(p.createdAt).toLocaleDateString()}</span>
                                                <div className="action-buttons-group">
                                                    <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                                                    <button onClick={() => handleDownloadPrescription(p)} className="btn btn-secondary btn-sm">Download PDF</button>
                                                </div>
                                            </div>
                                            <ul>{p.medications.map((m, i) => <li key={i}>{m.medicineName} ({m.dosage}) - {m.frequency} for {m.duration}</li>)}</ul>
                                            <small>Prescribed by: Dr. {p.doctor?.firstName} {p.doctor?.lastName}</small>
                                        </div>
                                    )) : <p>No prescriptions found.</p>}
                                </section>

                                {/* --- 4. MODIFY LAB REPORT HISTORY SECTION --- */}
                                <section className="ehr-section">
                                    <h3>Lab Report History</h3>
                                    {selectedPatientEhr.labReports?.length > 0 ? selectedPatientEhr.labReports.slice().reverse().map(r => (
                                        <div key={r._id} className="record-card">
                                            <div className="record-header">
                                                <span>{r.testName}</span>
                                                <div className="action-buttons-group">
                                                    <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span>
                                                    {r.reportUrl && <a href={`https://13.61.190.197:5000${r.reportUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">View Upload</a>}
                                                    {r.status === 'Completed' && <button onClick={() => handleDownloadLabReport(r)} className="btn btn-info btn-sm">Download PDF</button>}
                                                </div>
                                            </div>
                                            <p><strong>Result:</strong> {r.result || 'Pending'}</p>
                                            <small>Ordered by: Dr. {r.doctor?.firstName} {r.doctor?.lastName}</small>
                                        </div>
                                    )) : <p>No lab reports found.</p>}
                                </section>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="placeholder-container">
                        <span className="placeholder-icon">📂</span>
                        <p>Select a patient from the directory on the left to view their complete medical history.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientDirectory;