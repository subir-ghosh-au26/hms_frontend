import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import generateLabReportPDF from '../utils/generateLabReportPDF';
import './LabTechnicianDashboard.css';

const LabTechnicianDashboard = () => {
    // --- State Management ---
    const { user } = useAuth();
    const [pendingTests, setPendingTests] = useState([]);
    const [allTests, setAllTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [formData, setFormData] = useState({ result: '' });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('queue');
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pendingRes, allRes] = await Promise.all([
                api.get('/labtests/pending'),
                api.get('/labtests/all')
            ]);
            setPendingTests(pendingRes.data);
            setAllTests(allRes.data);
        } catch (error) {
            setMessage({ text: 'Failed to fetch lab test data.', type: 'error' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Event Handlers ---
    const handleSelectTest = (test) => {
        setSelectedTest(test);
        setFormData({ result: test.result || '' });
        setFile(null);
        setMessage({ text: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTest) return;

        const uploadData = new FormData();
        uploadData.append('result', formData.result);
        if (file) {
            uploadData.append('report', file);
        }

        try {
            await api.patch(`/labtests/${selectedTest._id}/complete`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ text: 'Test result submitted successfully!', type: 'success' });

            setTimeout(() => {
                fetchData(); // Refetch all data to update both lists
                setSelectedTest(null);
                setMessage({ text: '', type: '' });
            }, 1500);

        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Failed to submit result.', type: 'error' });
        }
    };

    const handleDownloadReport = (test) => {
        if (!test.patient || !test.doctor || !test.completedBy) {
            alert("Cannot generate PDF, essential data is missing.");
            return;
        }
        const age = new Date().getFullYear() - new Date(test.patient.dateOfBirth).getFullYear();
        generateLabReportPDF(
            { testName: test.testName, result: test.result, technicianName: `${test.completedBy.firstName} ${test.completedBy.lastName}` },
            { name: `${test.patient.firstName} ${test.patient.lastName}`, age, gender: test.patient.gender, uhid: test.patient.uhid },
            { firstName: test.doctor.firstName, lastName: test.doctor.lastName }
        );
    };

    // --- Memoized Filtering for History Tab ---
    const filteredHistory = useMemo(() => {
        const completedTests = allTests.filter(t => t.status === 'Completed');
        if (!historySearchTerm.trim()) {
            return completedTests;
        }
        const searchLower = historySearchTerm.toLowerCase();
        return completedTests.filter(test => {
            if (!test.patient) return false;
            const fullName = `${test.patient.firstName} ${test.patient.lastName}`.toLowerCase();
            const phone = test.patient.phone || '';
            return fullName.includes(searchLower) || phone.includes(searchLower);
        });
    }, [allTests, historySearchTerm]);

    return (
        <div className="dashboard-page lab-dashboard-layout">
            <aside className="lab-sidebar">
                <header className="lab-sidebar-header">
                    <h3>Lab Menu</h3>
                </header>
                <nav className="dashboard-tabs vertical">
                    <button onClick={() => setActiveTab('queue')} className={activeTab === 'queue' ? 'active' : ''}>
                        Test Queue ({pendingTests.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>
                        Test History
                    </button>
                </nav>
            </aside>

            <main className="lab-main-content">
                <header className="lab-header">
                    <h1>Lab Technician Dashboard</h1>
                    <p>Welcome, {user?.firstName}. {activeTab === 'queue' ? 'Select a test from the queue to enter results.' : 'Browse completed tests.'}</p>
                </header>

                {activeTab === 'queue' ? (
                    <div className="master-detail-container">
                        <div className="test-queue-list master-pane">
                            {loading ? <p>Loading tests...</p> : pendingTests.length > 0 ? (
                                pendingTests.map(test => (
                                    <div key={test._id} className={`test-queue-card ${selectedTest?._id === test._id ? 'selected' : ''}`} onClick={() => handleSelectTest(test)}>
                                        <div className="test-card-header">
                                            <span className="test-name">{test.testName}</span>
                                            <span className="test-date">{new Date(test.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="patient-info">
                                            <span className="patient-name">{test.patient.firstName} {test.patient.lastName}</span>
                                            <span className="patient-uhid">UHID: {test.patient.uhid}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-queue-message">The test queue is empty.</p>
                            )}
                        </div>
                        <div className="result-entry-container detail-pane">
                            {selectedTest ? (
                                <div className="dashboard-card">
                                    <h3>Enter Results for: <strong>{selectedTest.testName}</strong></h3>
                                    <p className="patient-context">Patient: {selectedTest.patient.firstName} {selectedTest.patient.lastName} (UHID: {selectedTest.patient.uhid})</p>
                                    <hr />
                                    <form onSubmit={handleSubmit} className="dashboard-form">
                                        {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
                                        <div className="form-group"><label>Result Summary</label><textarea name="result" placeholder="Enter test result summary..." value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })} rows="5" required></textarea></div>
                                        <div className="form-group"><label>Upload Full Report (PDF/Image)</label><input type="file" name="report" onChange={(e) => setFile(e.target.files[0])} /></div>
                                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Results</button>
                                    </form>
                                </div>
                            ) : (
                                <div className="placeholder-container">
                                    <span className="placeholder-icon">🧪</span>
                                    <p>Please select a test from the queue on the left to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="history-section">
                        <div className="history-controls">
                            <h3>Completed Test History</h3>
                            <div className="search-bar-container">
                                <span className="search-icon">🔍</span>
                                <input type="text" placeholder="Search by Patient Name or Phone..." value={historySearchTerm} onChange={(e) => setHistorySearchTerm(e.target.value)} className="history-search-input" />
                            </div>
                        </div>
                        <div className="history-table-container">
                            <table className="professional-table">
                                <thead><tr><th>Patient Details</th><th>Test Information</th><th>Completed</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {filteredHistory.length > 0 ? (
                                        filteredHistory.map(test => (
                                            <tr key={test._id}>
                                                <td>
                                                    {test.patient ? <div className="patient-cell-enhanced"><div className="patient-avatar">{test.patient.firstName.charAt(0)}{test.patient.lastName.charAt(0)}</div><div><div className="patient-name">{test.patient.firstName} {test.patient.lastName}</div><div className="patient-sub-info">UHID: {test.patient.uhid}</div><div className="patient-sub-info">Phone: {test.patient.phone}</div></div></div> : <span className="error-text">Patient Deleted</span>}
                                                </td>
                                                <td><div className="test-info-cell"><div className="test-name">{test.testName}</div><div className="test-sub-info">Ref: Dr. {test.doctor?.firstName} {test.doctor?.lastName}</div></div></td>
                                                <td><div className="completion-info-cell"><div>{new Date(test.completedAt).toLocaleString()}</div><div className="test-sub-info">By: {test.completedBy?.firstName}</div></div></td>
                                                <td><div className="action-buttons-group">{test.reportUrl && <a href={`https://13.61.190.197:5000${test.reportUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">View Upload</a>}<button onClick={() => handleDownloadReport(test)} className="btn btn-info btn-sm">Download PDF</button></div></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="empty-row">No matching records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LabTechnicianDashboard;