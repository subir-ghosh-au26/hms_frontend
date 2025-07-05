import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import patientApi from '../../api/patientApi';
import generatePrescriptionPDF from '../../utils/generatePrescriptionPDF';
import generateLabReportPDF from '../../utils/generateLabReportPDF';
import { usePatientAuth } from '../../context/PatientAuthContext';
import './DoctorHistory.css';

const DoctorHistory = () => {
    const { doctorId } = useParams();
    const [fullEhr, setFullEhr] = useState(null);
    const [doctorInfo, setDoctorInfo] = useState(null);
    const { patientUser } = usePatientAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                // We only need to fetch the full EHR. The doctor's info will be inside it.
                const { data } = await patientApi.get('/patient/my-ehr');
                setFullEhr(data);

                let foundDoctor = null;

                // Check diagnoses
                const diag = data.diagnoses?.find(d => d.diagnosedBy?._id === doctorId);
                if (diag) foundDoctor = diag.diagnosedBy;

                // If not found, check prescriptions
                if (!foundDoctor) {
                    const pres = data.prescriptions?.find(p => p.doctor?._id === doctorId);
                    if (pres) foundDoctor = pres.doctor;
                }

                // If still not found, check lab reports
                if (!foundDoctor) {
                    const lab = data.labReports?.find(l => l.doctor?._id === doctorId);
                    if (lab) foundDoctor = lab.doctor;
                }

                if (foundDoctor) {
                    setDoctorInfo(foundDoctor);
                } else {
                    // This can happen if the doctor has no records but an appointment exists
                    // We should still show something. We can try fetching the doctor directly.
                    // For now, let's set a placeholder.
                    console.warn(`Could not find details for doctor with ID: ${doctorId} in the EHR records.`);
                    setError("No records found for this doctor."); // Set an error to display a message
                }

            } catch (err) {
                setError('Could not load detailed history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) {
            fetchHistory();
        }
    }, [doctorId]);

    // Find the specific doctor's info from the first record we find them in.


    // --- Memoized Filtering Logic ---
    const filteredRecords = useMemo(() => {
        if (!fullEhr) return { diagnoses: [], prescriptions: [], labReports: [] };

        return {
            diagnoses: fullEhr.diagnoses?.filter(d => d.diagnosedBy?._id === doctorId) || [],
            prescriptions: fullEhr.prescriptions?.filter(p => p.doctor?._id === doctorId) || [],
            labReports: fullEhr.labReports?.filter(l => l.doctor?._id === doctorId) || [],
        };
    }, [fullEhr, doctorId]);

    if (loading) return <div className="dashboard-page"><p>Loading history...</p></div>;
    if (error) return <div className="dashboard-page"><p className="message error">{error}</p></div>;

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
        <div className="dashboard-page doctor-history-page">
            <header className="doctor-history-header">
                <Link to="/patient/appointments" className="back-link">← Back to All Appointments</Link>
                {doctorInfo ? (
                    <>
                        <h1>Your History with Dr. {doctorInfo.firstName} {doctorInfo.lastName}</h1>
                        <p>{doctorInfo.specialization}</p>
                    </>
                ) : <h1>History</h1>}
            </header>

            <div className="history-content-grid">
                <section className="ehr-section">
                    <h3>Diagnoses by this Doctor</h3>
                    {filteredRecords.diagnoses.length > 0 ? (
                        filteredRecords.diagnoses.map(d => (
                            <div key={d._id} className="record-card">
                                <p><strong>Diagnosis:</strong> {d.diagnosis}</p>
                                <p><strong>Notes:</strong> {d.notes}</p>
                            </div>
                        ))
                    ) : <p>No diagnoses recorded by this doctor.</p>}
                </section>

                <section className="ehr-section">
                    <h3>Prescriptions by this Doctor</h3>
                    {filteredRecords.prescriptions.length > 0 ? (
                        filteredRecords.prescriptions.map(p => (
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
                        ))
                    ) : <p>No prescriptions from this doctor.</p>}
                </section>

                <section className="ehr-section">
                    <h3>Lab Tests Ordered by this Doctor</h3>
                    {filteredRecords.labReports.length > 0 ? (
                        filteredRecords.labReports.map(r => (
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
                        ))
                    ) : <p>No lab tests ordered by this doctor.</p>}
                </section>
            </div>
        </div>
    );
};

export default DoctorHistory;