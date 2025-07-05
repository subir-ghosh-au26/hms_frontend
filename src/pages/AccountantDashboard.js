import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import api from '../api/api';
import './AccountantDashboard.css'; // The dedicated CSS for this page

// ===================================================================
// Sub-component for the header statistic cards
// ===================================================================
const StatCard = ({ title, value, icon, color }) => (
    <div className="accountant-stat-card" style={{ borderLeftColor: color }}>
        <div className="stat-info">
            <h4>{title}</h4>
            <p>{value}</p>
        </div>
        <div className="stat-icon" style={{ backgroundColor: color }}>{icon}</div>
    </div>
);

// ===================================================================
// Main AccountantDashboard Component
// ===================================================================
const AccountantDashboard = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // --- All Modal-related state has been removed ---

    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            try {
                const res = await api.get('/bills');
                // Sort by status to show Unpaid bills first
                res.data.sort((a, b) => {
                    const statusOrder = { 'Unpaid': 1, 'Partially Paid': 2, 'Paid': 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                });
                setBills(res.data);
            } catch (err) {
                setError('Failed to fetch bills. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, []);

    // --- All Modal-related functions (openModal, closeModal, handlePaymentSubmit) have been removed ---

    const financialStats = useMemo(() => {
        let totalRevenue = 0;
        let totalOutstanding = 0;
        let paidBills = 0;
        bills.forEach(bill => {
            totalRevenue += bill.amountPaid;
            totalOutstanding += (bill.totalAmount - bill.amountPaid);
            if (bill.status === 'Paid') {
                paidBills++;
            }
        });
        return { totalRevenue, totalOutstanding, paidBills, totalBills: bills.length };
    }, [bills]);

    const filteredBills = useMemo(() => {
        if (!searchTerm.trim()) return bills;
        const searchLower = searchTerm.toLowerCase();
        return bills.filter(bill => {
            if (!bill.patient) return false;
            return (
                bill.patient.firstName.toLowerCase().includes(searchLower) ||
                bill.patient.lastName.toLowerCase().includes(searchLower) ||
                bill.patient.uhid.toLowerCase().includes(searchLower)
            );
        });
    }, [bills, searchTerm]);

    if (loading) return <div className="dashboard-page"><p>Loading financial data...</p></div>;
    if (error) return <div className="dashboard-page"><p className="error-message">{error}</p></div>;

    return (
        <div className="dashboard-page accountant-dashboard">
            <header className="accountant-header">
                <h1>Financials Dashboard</h1>
                <p>Monitor revenue, manage billing, and track patient accounts.</p>
            </header>

            <div className="stats-container">
                <StatCard title="Total Revenue" value={`₹${financialStats.totalRevenue.toFixed(2)}`} icon="💰" color="var(--success-color)" />
                <StatCard title="Total Outstanding" value={`₹${financialStats.totalOutstanding.toFixed(2)}`} icon="⌛" color="var(--warning-color)" />
                <StatCard title="Fully Paid Bills" value={`${financialStats.paidBills} / ${financialStats.totalBills}`} icon="✔️" color="var(--primary-color)" />
                <StatCard title="Unpaid/Partial Bills" value={financialStats.totalBills - financialStats.totalBills} icon="❗" color="var(--danger-color)" />
            </div>

            <div className="history-section">
                <div className="history-controls">
                    <h3>All Patient Bills</h3>
                    <div className="search-bar-container">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by Patient Name or UHID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="history-search-input"
                        />
                    </div>
                </div>
                <div className="history-table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>Patient Details</th>
                                <th>Total Bill</th>
                                <th>Amount Paid</th>
                                <th>Outstanding</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.length > 0 ? filteredBills.map(bill => (
                                <tr key={bill._id}>
                                    <td>
                                        {bill.patient ? (
                                            <div className="patient-cell-enhanced">
                                                <div className="patient-avatar">{bill.patient.firstName?.charAt(0) || ''}{bill.patient.lastName?.charAt(0) || ''}</div>
                                                <div>
                                                    <div className="patient-name">{bill.patient.firstName} {bill.patient.lastName}</div>
                                                    <div className="patient-sub-info">UHID: {bill.patient.uhid}</div>
                                                </div>
                                            </div>
                                        ) : <span className="error-text">Patient Deleted</span>}
                                    </td>
                                    <td>${bill.totalAmount.toFixed(2)}</td>
                                    <td>${bill.amountPaid.toFixed(2)}</td>
                                    <td>
                                        <strong style={{ color: (bill.totalAmount - bill.amountPaid) > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                            ${(bill.totalAmount - bill.amountPaid).toFixed(2)}
                                        </strong>
                                    </td>
                                    <td><span className={`status-badge status-${bill.status.toLowerCase().replace(' ', '-')}`}>{bill.status}</span></td>
                                    <td>
                                        {/* --- UPDATED ACTION: Use Link instead of a button that opens a modal --- */}
                                        {bill.patient && (
                                            <Link to={`/accountant/bill/${bill.patient._id}`} className="btn btn-info btn-sm">
                                                View Details
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="empty-row">No matching bills found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* The Modal has been completely removed from this component */}
        </div>
    );
};

export default AccountantDashboard;