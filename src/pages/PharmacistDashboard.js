import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';
import generatePrescriptionPDF from '../utils/generatePrescriptionPDF';
import './PharmacistDashboard.css';

// A small component for a single prescription card in the queue
const PrescriptionCard = ({ prescription, onFulfill }) => (
    <div className="prescription-card">
        <div className="card-header">
            <div className="patient-info">
                <div className="patient-avatar">
                    {prescription.patient.firstName.charAt(0)}{prescription.patient.lastName.charAt(0)}
                </div>
                <div>
                    <span className="patient-name">{prescription.patient.firstName} {prescription.patient.lastName}</span>
                    <span className="patient-uhid">UHID: {prescription.patient.uhid}</span>
                </div>
            </div>
            <div className="prescription-meta">
                <span>Prescribed by: <strong>Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}</strong></span>
                <span>Date: {new Date(prescription.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
        <div className="medications-list">
            <h4>Medications</h4>
            <ul>
                {prescription.medications.map((med, index) => (
                    <li key={index}>
                        <span className="med-name">{med.medicineName}</span>
                        <span className="med-details">{med.dosage} | {med.frequency} | {med.duration}</span>
                    </li>
                ))}
            </ul>
        </div>
        <div className="card-footer">
            <button onClick={() => onFulfill(prescription._id)} className="btn btn-success">
                <span className="icon">✓</span> Mark as Fulfilled
            </button>
        </div>
    </div>
);

// A small component for the inventory insight widgets
const InventoryWidget = ({ title, value, link, type }) => (
    <Link to={link} className={`inventory-widget ${type}`}>
        <span className="widget-value">{value}</span>
        <p className="widget-title">{title}</p>
    </Link>
);


const PharmacistDashboard = () => {
    const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
    const [allPrescriptions, setAllPrescriptions] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('queue');
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pendingRes, allRes, lowStockRes] = await Promise.all([
                    api.get('/prescriptions/pending'),
                    api.get('/prescriptions/all'),
                    api.get('/inventory/low-stock')
                ]);
                setPendingPrescriptions(pendingRes.data);
                setAllPrescriptions(allRes.data);
                setLowStockItems(lowStockRes.data);
            } catch (error) {
                setMessage('Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFulfill = async (id) => {
        try {
            await api.patch(`/prescriptions/${id}/fulfill`);
            setMessage('Prescription fulfilled successfully!');
            setPendingPrescriptions(pendingPrescriptions.filter(p => p._id !== id));
            setAllPrescriptions(allPrescriptions.map(p => p._id === id ? { ...p, status: 'Fulfilled' } : p));
        } catch (error) {
            setMessage('Failed to fulfill prescription.');
        }
    };

    const handleDownloadPrescription = (prescription) => {
        if (!prescription.patient || !prescription.doctor) {
            alert("Cannot generate PDF, essential data is missing.");
            return;
        }

        const age = new Date().getFullYear() - new Date(prescription.patient.dateOfBirth).getFullYear();

        const patientDetails = {
            name: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
            age: `${age} Years`,
            gender: prescription.patient.gender,
            uhid: prescription.patient.uhid
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

    const filteredHistory = useMemo(() => {
        if (!historySearchTerm.trim()) {
            return allPrescriptions; // If search is empty, return all
        }

        const searchLower = historySearchTerm.toLowerCase();

        return allPrescriptions.filter(prescription => {
            if (!prescription.patient) return false; // Safety check

            const fullName = `${prescription.patient.firstName} ${prescription.patient.lastName}`.toLowerCase();
            const phone = prescription.patient.phone || '';

            return fullName.includes(searchLower) || phone.includes(searchLower);
        });
    }, [allPrescriptions, historySearchTerm]);


    if (loading) return <div className="dashboard-page"><p>Loading pharmacy data...</p></div>;

    return (
        <div className="dashboard-page pharmacist-dashboard">
            <div className="pharmacist-main-content">
                <header className="pharmacist-header">
                    <h1>Pharmacy Dashboard</h1>
                    <p>Process pending prescriptions and monitor inventory levels.</p>
                </header>

                <nav className="dashboard-tabs">
                    <button onClick={() => setActiveTab('queue')} className={activeTab === 'queue' ? 'active' : ''}>
                        Pending Queue ({pendingPrescriptions.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>
                        Prescription History
                    </button>
                </nav>

                {message && <p className="message success" style={{ marginTop: '1.5rem' }}>{message}</p>}

                <div className="tab-content">
                    {activeTab === 'queue' && (
                        <div className="prescription-queue">
                            {pendingPrescriptions.length > 0 ? (
                                pendingPrescriptions.map(p => (
                                    <PrescriptionCard key={p._id} prescription={p} onFulfill={handleFulfill} />
                                ))
                            ) : (
                                <div className="empty-message">The prescription queue is clear!</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="history-section">
                            <div className="history-controls">
                                <h3>Prescription History ({filteredHistory.length})</h3>
                                <div className="search-bar-container">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by Patient Name or Phone..."
                                        value={historySearchTerm}
                                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                                        className="history-search-input"
                                    />
                                </div>
                            </div>

                            <div className="history-table-container">
                                <table className="professional-table">
                                    <thead>
                                        <tr>
                                            <th>Patient Details</th>
                                            <th>Prescription Details</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.length > 0 ? (
                                            filteredHistory.map(p => (
                                                <tr key={p._id}>
                                                    <td>
                                                        {p.patient ? (
                                                            <div className="patient-cell-enhanced">
                                                                <div className="patient-avatar">{p.patient.firstName.charAt(0)}{p.patient.lastName.charAt(0)}</div>
                                                                <div>
                                                                    <div className="patient-name">{p.patient.firstName} {p.patient.lastName}</div>
                                                                    <div className="patient-sub-info">UHID: {p.patient.uhid}</div>
                                                                    <div className="patient-sub-info">Phone: {p.patient.phone}</div>
                                                                </div>
                                                            </div>
                                                        ) : <span className="error-text">Patient Deleted</span>}
                                                    </td>
                                                    <td>
                                                        <div className="info-cell">
                                                            <div>Prescribed by: Dr. {p.doctor?.firstName} {p.doctor?.lastName}</div>
                                                            <div className="sub-info">on {new Date(p.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="info-cell">
                                                            <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                                                            {p.fulfilledBy && <div className="sub-info">by {p.fulfilledBy.firstName}</div>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons-group">
                                                            <button onClick={() => handleDownloadPrescription(p)} className="btn btn-info btn-sm">Download PDF</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="empty-row">No matching prescriptions found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            <aside className="pharmacist-sidebar">
                <h3>Inventory Insights</h3>
                <div className="widgets-container">
                    <InventoryWidget
                        title="Low Stock Items"
                        value={lowStockItems.length}
                        link="/inventory"
                        type="danger"
                    />
                    {/* You can add more widgets here, e.g., for expired items */}
                    <InventoryWidget
                        title="Expired Items"
                        value={0} // Placeholder, logic would be needed for this
                        link="/inventory"
                        type="warning"
                    />
                </div>
                <Link to="/inventory" className="btn btn-primary full-width-btn">
                    Go to Full Inventory
                </Link>
            </aside>
        </div>
    );
};

export default PharmacistDashboard;