import React, { useState, useEffect } from 'react';
import patientApi from '../../api/patientApi';
import { usePatientAuth } from '../../context/PatientAuthContext';
import generatePrescriptionPDF from '../../utils/generatePrescriptionPDF';
import generateLabReportPDF from '../../utils/generateLabReportPDF';
import './PatientPortal.css';

const MyRecords = () => {
    const [ehr, setEhr] = useState(null);
    const { patientUser } = usePatientAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEhr = async () => {
            try {
                const res = await patientApi.get('/patient/my-ehr');
                setEhr(res.data);
            } catch (error) {
                console.error("Failed to fetch EHR", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEhr();
    }, []);

    if (loading) return <p>Loading your medical records...</p>;
    if (!ehr) return <p>No medical records found.</p>;

    const handleDownloadPrescription = (prescription) => {
        if (!patientUser || !prescription.doctor) {
            alert("Cannot generate PDF, essential data is missing.");
            return;
        }

        const age = new Date().getFullYear() - new Date(patientUser.dateOfBirth).getFullYear();

        const patientDetails = {
            name: `${patientUser.firstName} ${patientUser.lastName}`,
            age: `${age} Years`,
            gender: patientUser.gender,
            uhid: patientUser.uhid
        };

        const doctorDetails = {
            firstName: prescription.doctor.firstName,
            lastName: prescription.doctor.lastName,
        };

        const prescriptionDetails = {
            date: prescription.createdAt,
            medications: prescription.medications
        };

        generatePrescriptionPDF(prescriptionDetails, patientDetails, doctorDetails);
    };


    const handleDownloadLabReport = (test) => {
        if (!patientUser || !test.doctor || !test.completedBy) {
            alert("Cannot generate PDF, essential data is missing.");
            return;
        }

        const age = new Date().getFullYear() - new Date(patientUser.dateOfBirth).getFullYear();

        generateLabReportPDF(
            { // testDetails
                testName: test.testName,
                result: test.result,
                technicianName: `${test.completedBy.firstName} ${test.completedBy.lastName}`
            },
            { // patientDetails
                name: `${patientUser.firstName} ${patientUser.lastName}`,
                age: age,
                gender: patientUser.gender,
                uhid: patientUser.uhid,
            },
            { // doctorDetails
                firstName: test.doctor.firstName,
                lastName: test.doctor.lastName
            }
        );
    };

    return (
        <div className="patient-portal-page">
            <h2>My Medical Records</h2>

            <div className="record-section">
                <h3>Diagnoses History</h3>
                {ehr.diagnoses && ehr.diagnoses.length > 0 ? ehr.diagnoses.map(d => (
                    <div key={d._id} className="record-card">
                        <p><strong>Diagnosis:</strong> {d.diagnosis}</p>
                        <p><strong>Notes:</strong> {d.notes}</p>
                        <p className="record-meta">Diagnosed by Dr. {d.diagnosedBy.firstName} on {new Date(d.diagnosedAt).toLocaleDateString()}</p>
                    </div>
                )) : <p>No diagnoses on record.</p>}
            </div>

            <div className="record-section">
                <h3>Lab Reports</h3>
                {ehr.labReports && ehr.labReports.length > 0 ? ehr.labReports.map(r => (
                    <div key={r._id} className="record-card">
                        <div className="record-header">
                            <span><strong>Test:</strong> {r.testName}</span>
                            <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span>
                        </div>
                        <p><strong>Result Summary:</strong> {r.result || "Pending"}</p>
                        <small className="record-meta">
                            Ordered on {new Date(r.createdAt).toLocaleDateString()} by Dr. {r.doctor?.firstName}
                            {r.completedAt && ` | Completed on ${new Date(r.completedAt).toLocaleDateString()}`}
                        </small>

                        <div className="record-actions">
                            {/* Conditionally show the original upload if it exists */}
                            {r.reportUrl && (
                                <a href={r.reportUrl} target="_blank" rel="noopener noreferrer" >
                                    View Original Report
                                </a>
                            )}
                            {/* The new button to generate the professional PDF */}
                            {r.status === 'Completed' && (
                                <button
                                    onClick={() => handleDownloadLabReport(r)}
                                    className="btn btn-primary btn-sm"
                                >
                                    Download as PDF
                                </button>
                            )}
                        </div>
                    </div>
                )) : <p>No lab reports on record.</p>}
            </div>

            <div className="record-section">
                <h3>Prescriptions</h3>
                {ehr.prescriptions && ehr.prescriptions.length > 0 ? ehr.prescriptions.map(p => (
                    <div key={p._id} className="record-card">
                        <div className="record-header">
                            <span>Prescribed on {new Date(p.createdAt).toLocaleDateString()} by Dr. {p.doctor?.firstName}</span>
                            <div>
                                <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                                {/* --- ADD THE DOWNLOAD BUTTON HERE --- */}
                                <button onClick={() => handleDownloadPrescription(p)} className="btn btn-secondary btn-sm">Download PDF</button>
                            </div>
                        </div>
                        <ul>{p.medications.map((m, i) => <li key={i}>{m.medicineName} ({m.dosage}) - {m.frequency} for {m.duration}</li>)}</ul>
                    </div>
                )) : <p>No prescriptions on record.</p>}
            </div>
        </div>
    );
};

export default MyRecords;