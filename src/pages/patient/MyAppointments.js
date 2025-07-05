import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePatientAuth } from '../../context/PatientAuthContext';
import patientApi from '../../api/patientApi';
import { Link } from 'react-router-dom';
import './MyAppointments.css';

// Sub-component for a single appointment card (reusable and clean)
const AppointmentHistoryCard = ({ app, isClickable }) => {
    const appointmentDate = new Date(app.appointmentDate);

    const cardContent = (
        <>
            <div className="card-status-bar" style={{ backgroundColor: `var(--status-color-${app.status.toLowerCase()})` }}></div>
            <div className="card-content">
                <div className="card-main-info">
                    <h4>Dr. {app.doctor.firstName} {app.doctor.lastName}</h4>
                    <span className="doctor-specialization">{app.doctor.specialization}</span>
                    <p className="appointment-reason">{app.reason || 'General Consultation'}</p>
                </div>
                <div className="card-time-info">
                    <div className="time-item">
                        <span className="time-day">{appointmentDate.toLocaleDateString('en-US', { day: 'numeric' })}</span>
                        <span className="time-month">{appointmentDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="time-details">
                        <span>{appointmentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        <p>{appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </div>
            <div className="card-footer">
                <span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span>
                {/* Add a visual hint that it's clickable for past appointments */}
                {isClickable && <span className="view-details-prompt">View Details →</span>}
            </div>
        </>
    );


    if (isClickable && app.doctor?._id) { // Also check if doctor exists
        return (
            <Link to={`/patient/history/doctor/${app.doctor._id}`} className="appointment-history-card-link">
                {cardContent}
            </Link>
        );
    }

    // Otherwise, render a non-clickable div.
    return <div className="appointment-history-card">{cardContent}</div>;



};


const MyAppointments = () => {
    const { patientUser } = usePatientAuth();
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'pending'

    const fetchAppointments = useCallback(async () => {
        if (!patientUser) return;
        setLoading(true);
        setError('');
        try {
            const res = await patientApi.get('/appointments/my-appointments');
            // Sort by date, most recent first
            res.data.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
            setAllAppointments(res.data);
        } catch (err) {
            setError('Could not load your appointment history.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [patientUser]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const filteredAppointments = useMemo(() => {
        const now = new Date();
        switch (activeTab) {
            case 'upcoming':
                return allAppointments.filter(app => app.status === 'Approved' && new Date(app.appointmentDate) >= now);
            case 'pending':
                return allAppointments.filter(app => app.status === 'Pending');
            case 'past':
                return allAppointments.filter(app => app.status !== 'Pending' && new Date(app.appointmentDate) < now);
            default:
                return [];
        }
    }, [allAppointments, activeTab]);

    if (loading) return <div className="dashboard-page"><p>Loading your appointments...</p></div>;

    return (
        <div className="dashboard-page my-appointments-page">
            <header className="my-appointments-header">
                <h2>My Appointments</h2>
                <p>View your upcoming, pending, and past appointments.</p>
            </header>

            {error && <p className="message error">{error}</p>}

            <nav className="dashboard-tabs">
                <button onClick={() => setActiveTab('upcoming')} className={activeTab === 'upcoming' ? 'active' : ''}>Upcoming</button>
                <button onClick={() => setActiveTab('pending')} className={activeTab === 'pending' ? 'active' : ''}>Pending Approval</button>
                <button onClick={() => setActiveTab('past')} className={activeTab === 'past' ? 'active' : ''}>Past History</button>
            </nav>

            <div className="appointments-grid">
                {!loading && filteredAppointments.length > 0 ? (
                    filteredAppointments.map(app => (
                        <AppointmentHistoryCard key={app._id} app={app} isClickable={activeTab === 'past'} />
                    ))
                ) : (
                    <div className="empty-message">
                        {!loading && <p>No appointments in this category.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAppointments;