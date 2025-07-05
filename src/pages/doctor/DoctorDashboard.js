import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import for navigation
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/layout/Modal';
import './DoctorDashboard.css';

// ===================================================================
// Sub-component for the header statistic cards
// ===================================================================
const StatCard = ({ title, value, icon, color }) => (
    <div className="doctor-stat-card" style={{ '--icon-bg': color }}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
            <p>{value}</p>
            <span>{title}</span>
        </div>
    </div>
);

// ===================================================================
// Sub-component for rendering a single appointment card
// This component is now "dumber" and just calls the handlers passed via props.
// ===================================================================
const AppointmentCard = ({ app, onStatusUpdate, onReject, onViewEHR }) => {
    const appointmentDate = new Date(app.appointmentDate);
    const now = new Date();

    // Check if the appointment is for today
    const isToday = appointmentDate.getDate() === now.getDate() &&
        appointmentDate.getMonth() === now.getMonth() &&
        appointmentDate.getFullYear() === now.getFullYear();

    const isPast = new Date(app.appointmentDate) < new Date();

    return (
        <div className={`appointment-card ${isToday ? 'is-today' : ''}`}>
            {isToday && <div className="today-banner">TODAY</div>}
            <div className="patient-info-bar">
                {app.patient ? (
                    <>
                        <div className="patient-avatar">{app.patient.firstName.charAt(0)}{app.patient.lastName.charAt(0)}</div>
                        <div className="patient-details">
                            <span className="patient-name">{app.patient.firstName} {app.patient.lastName}</span>
                            <span className="patient-uhid">UHID: {app.patient.uhid}</span>
                        </div>
                    </>
                ) : <span style={{ color: 'var(--danger-color)' }}>Patient Not Found</span>}
            </div>
            <div className="appointment-details">
                <div className="detail-item"><span>Date & Time</span><p>{new Date(app.appointmentDate).toLocaleString()}</p></div>
                <div className="detail-item"><span>Reason</span><p>{app.reason || 'N/A'}</p></div>
            </div>
            <div className="card-footer">
                <span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span>
            </div>
            <div className="appointment-actions">
                {app.status === 'Pending' && (
                    <>
                        <button onClick={() => onStatusUpdate(app._id, 'Approved')} className="btn btn-success">Approve</button>
                        <button onClick={() => onReject(app._id)} className="btn btn-danger">Reject</button>
                    </>
                )}
                {app.status === 'Approved' && isPast && (
                    <button onClick={() => onStatusUpdate(app._id, 'Completed')} className="btn btn-primary">Mark as Completed</button>
                )}
                {app.status === 'Approved' && !isPast && app.patient && (
                    <button onClick={() => onViewEHR(app.patient._id)} className="btn btn-info">View Patient EHR</button>
                )}
                {app.status === 'Completed' && (
                    <span className="action-text">Action Complete</span>
                )}
            </div>
        </div>
    );
};


// ===================================================================
// Main DoctorDashboard Component
// ===================================================================
const DoctorDashboard = () => {
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const { user } = useAuth();
    const navigate = useNavigate(); // Hook for programmatic navigation

    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, appointmentId: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [modalError, setModalError] = useState('');

    const fetchAppointments = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('/appointments');
            const myAppointments = res.data.filter(app => app.doctor._id === user._id);
            setAllAppointments(myAppointments);
        } catch (err) {
            setError('Failed to fetch appointments.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleStatusUpdate = async (id, newStatus, reason = '') => {
        const originalAppointments = [...allAppointments];
        const appointmentToUpdate = originalAppointments.find(app => app._id === id);

        if (!appointmentToUpdate) return;

        // Optimistic UI Update
        const updatedAppointments = allAppointments.map(app =>
            app._id === id ? { ...app, status: newStatus, rejectionReason: reason || app.rejectionReason } : app
        );
        setAllAppointments(updatedAppointments);

        if (rejectionModal.isOpen) {
            setRejectionModal({ isOpen: false, appointmentId: null });
            setRejectionReason('');
        }

        try {
            await api.patch(`/appointments/${id}/status`, { status: newStatus, rejectionReason: reason });
        } catch (error) {
            console.error("Failed to update status on server:", error);
            alert('Failed to update appointment status. Reverting changes.');
            setAllAppointments(originalAppointments); // Rollback on failure
        }
    };

    const handleViewEHR = (patientId) => {
        navigate(`/doctor/patient/${patientId}`);
    };

    const stats = useMemo(() => {
        return {
            pending: allAppointments.filter(a => a.status === 'Pending').length,
            confirmed: allAppointments.filter(a => a.status === 'Approved').length,
            history: allAppointments.filter(a => ['Completed', 'Rejected', 'Cancelled'].includes(a.status)).length
        };
    }, [allAppointments]);

    const filteredAppointments = useMemo(() => {
        // Always sort the base list first
        const sortedAppointments = [...allAppointments].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

        switch (activeTab) {
            case 'pending':
                return sortedAppointments.filter(app => app.status === 'Pending');
            case 'confirmed': // <-- Renamed from 'upcoming'
                // Show ALL approved appointments
                return sortedAppointments.filter(app => app.status === 'Approved');
            case 'history': // <-- New comprehensive history tab
                // Show all appointments that are not pending or upcoming
                return sortedAppointments.filter(app => ['Completed', 'Rejected', 'Cancelled'].includes(app.status));
            default:
                return [];
        }
    }, [allAppointments, activeTab]);

    if (loading) return <div className="dashboard-page"><p>Loading dashboard...</p></div>;
    if (error) return <div className="dashboard-page"><p className="message error">{error}</p></div>;

    return (
        <div className="dashboard-page doctor-dashboard">
            <header className="doctor-header">
                <div>
                    <h1>Welcome Back, Dr. {user?.lastName}!</h1>
                    <p>Here is your summary for today and the upcoming days.</p>
                </div>
                <button onClick={() => navigate('/doctor/schedule')} className="btn btn-primary">
                    <span className="icon">📅</span> Manage Schedule
                </button>
            </header>

            <div className="doctor-stats-container">
                <StatCard title="Pending Approvals" value={stats.pending} icon="🔔" color="rgba(245, 158, 11, 0.15)" />
                <StatCard title="Total Confirmed" value={stats.confirmed} icon="✔️" color="rgba(16, 185, 129, 0.15)" />
            </div>

            <div className="appointments-section">
                <nav className="dashboard-tabs">
                    <button onClick={() => setActiveTab('pending')} className={activeTab === 'pending' ? 'active' : ''}>Pending Approval ({stats.pending})</button>
                    <button onClick={() => setActiveTab('confirmed')} className={activeTab === 'confirmed' ? 'active' : ''}>All Confirmed ({stats.confirmed})</button>
                    <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>History</button>
                </nav>

                <div className="appointments-list">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map(app => (
                            <AppointmentCard
                                key={app._id}
                                app={app}
                                onStatusUpdate={handleStatusUpdate}
                                onReject={(id) => setRejectionModal({ isOpen: true, appointmentId: id })}
                                onViewEHR={handleViewEHR}
                            />
                        ))
                    ) : (
                        <div className="empty-message">
                            <p>No appointments in this category.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={rejectionModal.isOpen} onClose={() => setRejectionModal({ isOpen: false, appointmentId: null })} title="Reason for Rejection">
                <div className="dashboard-form">
                    {modalError && <p style={{ color: 'var(--danger-color)' }}>{modalError}</p>}
                    <div className="form-group">
                        <label>Please provide a reason for rejecting this appointment request.</label>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows="4" required></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setRejectionModal({ isOpen: false, appointmentId: null })} className="btn btn-secondary">Cancel</button>
                        <button onClick={() => handleStatusUpdate(rejectionModal.appointmentId, 'Rejected', rejectionReason)} className="btn btn-danger">Confirm Rejection</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DoctorDashboard;