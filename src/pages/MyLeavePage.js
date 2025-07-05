import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Modal from '../components/layout/Modal';
import './MyLeavePage.css';

// --- Sub-component for the leave application form ---
const ApplyLeaveForm = ({ user, onLeaveApplied, closeModal }) => {
    const [formData, setFormData] = useState({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        try {
            const res = await api.post('/leaves/apply', formData);
            setMessage({ text: 'Leave application submitted successfully!', type: 'success' });
            onLeaveApplied(res.data); // Notify parent to update the list
            setTimeout(() => { closeModal(); }, 1500);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to submit application.', type: 'error' });
        }
    };

    return (
        <div className="dashboard-form">
            {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
            <form onSubmit={handleSubmit}>
                <p>Your current leave balance is <strong>{user.leaveBalance} days</strong>.</p>
                <div className="form-group"><label>Leave Type</label><select name="leaveType" value={formData.leaveType} onChange={handleChange}><option>Casual</option><option>Sick</option><option>Earned</option></select></div>
                <div className="form-group-row">
                    <div className="form-group"><label>Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required /></div>
                    <div className="form-group"><label>End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required /></div>
                </div>
                <div className="form-group"><label>Reason for Leave</label><textarea name="reason" value={formData.reason} onChange={handleChange} rows="4" required></textarea></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Submit Application</button>
                </div>
            </form>
        </div>
    );
};


const MyLeavePage = () => {
    const { user } = useAuth();
    const [myLeaves, setMyLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // We need to fetch the full user details to get leave balance
    const [fullUserDetails, setFullUserDetails] = useState(null);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const [leavesRes, userRes] = await Promise.all([
                api.get('/leaves/my-leaves'), // This gets all leaves, we'll filter
                api.get(`/staff/me`) // Fetch full details for the logged-in user
            ]);
            leavesRes.data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            setMyLeaves(leavesRes.data);
            setFullUserDetails(userRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setError("Could not load your leave information. Please try again later.");
        }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLeaveApplied = (newLeave) => {
        // Add new leave to the top of the list for an instant UI update
        setMyLeaves(prevLeaves => [newLeave, ...prevLeaves]);
        // We also need to refetch the user details to update the leave balance display
        api.get('/staff/me').then(res => setFullUserDetails(res.data));
    };

    if (loading) {
        return <div className="dashboard-page"><p>Loading your leave information...</p></div>;
    }

    if (error) {
        return <div className="dashboard-page"><p className="message error">{error}</p></div>;
    }

    if (!fullUserDetails) {
        return <div className="dashboard-page"><p>Could not load user details.</p></div>
    }

    return (
        <div className="dashboard-page my-leave-page">
            <header className="my-leave-header">
                <h2>My Leave Dashboard</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <span className="icon">✈️</span> Apply for New Leave
                </button>
            </header>

            {error && <p className="message error">{error}</p>}

            <div className="leave-balance-cards">
                <div className="balance-card"><p>Total Allotment</p><span>{fullUserDetails.totalLeaveDays}</span></div>
                <div className="balance-card"><p>Leave Taken</p><span>{fullUserDetails.leaveTaken}</span></div>
                <div className="balance-card available"><p>Available Balance</p><span>{fullUserDetails.leaveBalance}</span></div>
            </div>

            <h3>My Leave Applications History</h3>
            <div className="history-table-container">
                <table className="professional-table">
                    <thead>
                        <tr>
                            <th>Leave Dates & Duration</th>
                            <th>Type</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myLeaves.length > 0 ? myLeaves.map(leave => {
                            const startDate = new Date(leave.startDate);
                            const endDate = new Date(leave.endDate);
                            const duration = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

                            return (
                                <tr key={leave._id}>
                                    <td>
                                        <div className="info-cell">
                                            <div>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</div>
                                            <div className="sub-info">{duration} day{duration > 1 ? 's' : ''}</div>
                                        </div>
                                    </td>
                                    <td>{leave.leaveType}</td>
                                    <td className="reason-cell">{leave.reason}</td>
                                    <td>
                                        <span className={`status-badge status-${leave.status.toLowerCase()}`}>{leave.status}</span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="4" className="empty-row">You have no leave history.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Leave Application">
                <ApplyLeaveForm user={fullUserDetails} onLeaveApplied={handleLeaveApplied} closeModal={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default MyLeavePage;