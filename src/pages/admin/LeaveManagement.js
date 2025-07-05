import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import './LeaveManagement.css';

const LeaveManagement = () => {
    const [allLeaves, setAllLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaves');
            setAllLeaves(res.data);
        } catch (err) {
            setError('Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleStatusUpdate = async (leaveId, newStatus) => {
        try {
            await api.patch(`/leaves/${leaveId}/status`, { status: newStatus });
            // Optimistically update the UI before a full refetch
            setAllLeaves(allLeaves.map(leave =>
                leave._id === leaveId ? { ...leave, status: newStatus } : leave
            ));
        } catch (err) {
            alert('Failed to update leave status.');
        }
    };

    const filteredLeaves = useMemo(() => {
        if (activeTab === 'pending') {
            return allLeaves.filter(l => l.status === 'Pending');
        }
        // For history, show everything that is NOT pending
        return allLeaves.filter(l => l.status !== 'Pending');
    }, [allLeaves, activeTab]);

    if (loading) return <div className="dashboard-page"><p>Loading leave requests...</p></div>;
    if (error) return <div className="dashboard-page error-message">{error}</div>;

    return (
        <div className="dashboard-page leave-management-page">
            <h2>Staff Leave Management</h2>
            <nav className="dashboard-tabs">
                <button onClick={() => setActiveTab('pending')} className={activeTab === 'pending' ? 'active' : ''}>Pending Requests ({allLeaves.filter(l => l.status === 'Pending').length})</button>
                <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>Leave History</button>
            </nav>

            <div className="tab-content">
                <table className="professional-table">
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th>Leave Type</th>
                            <th>Dates Requested</th>
                            <th>Reason</th>
                            <th>Status / Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.length > 0 ? filteredLeaves.map(leave => (
                            <tr key={leave._id}>
                                <td>
                                    {leave.staffMember ?
                                        `${leave.staffMember.firstName} ${leave.staffMember.lastName}` :
                                        <span className="error-text">Staff Deleted</span>
                                    }
                                    <span className="sub-info">{leave.staffMember?.role}</span>
                                </td>
                                <td>{leave.leaveType}</td>
                                <td>{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</td>
                                <td className="reason-cell">{leave.reason}</td>
                                <td>
                                    {leave.status === 'Pending' ? (
                                        <div className="action-buttons-group">
                                            <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} className="btn btn-success btn-sm">Approve</button>
                                            <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} className="btn btn-danger btn-sm">Reject</button>
                                        </div>
                                    ) : (
                                        <span className={`status-badge status-${leave.status.toLowerCase()}`}>{leave.status}</span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="empty-row">No leave requests in this category.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManagement;