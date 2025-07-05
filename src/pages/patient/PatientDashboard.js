import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePatientAuth } from '../../context/PatientAuthContext';
import patientApi from '../../api/patientApi';
import { Link } from 'react-router-dom';
import './PatientPortal.css';

const BookAppointmentWidget = () => {
    const [doctors, setDoctors] = useState([]);
    const [appointmentData, setAppointmentData] = useState({ doctorId: '', appointmentDate: '', appointmentTime: '', reason: '' });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fetch list of doctors when the widget mounts
    useEffect(() => {
        patientApi.get('/appointments/patient/doctors')
            .then(res => setDoctors(res.data))
            .catch(err => console.error("Could not fetch doctors", err));
    }, []);

    // Fetch available time slots when a doctor and date are selected
    useEffect(() => {
        const fetchSlots = async () => {
            if (appointmentData.doctorId && appointmentData.appointmentDate) {
                setSlotsLoading(true);
                setAvailableSlots([]);
                try {
                    const res = await patientApi.get(`/schedules/patient/${appointmentData.doctorId}/available-slots?date=${appointmentData.appointmentDate}`);
                    setAvailableSlots(res.data.availableSlots);
                } catch (error) {
                    console.error("Failed to fetch available slots", error);
                } finally {
                    setSlotsLoading(false);
                }
            }
        };
        fetchSlots();
    }, [appointmentData.doctorId, appointmentData.appointmentDate]);

    const handleChange = (e) => setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        const fullAppointmentDate = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}:00`);
        try {
            await patientApi.post('/appointments/book-by-patient', {
                doctorId: appointmentData.doctorId,
                appointmentDate: fullAppointmentDate,
                reason: appointmentData.reason
            });
            setMessage({ text: 'Appointment requested successfully! You will be notified upon doctor approval.', type: 'success' });
            // Reset form
            setAppointmentData({ doctorId: '', appointmentDate: '', appointmentTime: '', reason: '' });
            setAvailableSlots([]);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Booking failed. Please try again.', type: 'error' });
        }
    };

    return (
        <div className="dashboard-card action-card">
            <h3>Book a Follow-up Appointment</h3>
            {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
            <form onSubmit={handleSubmit} className="dashboard-form">
                <div className="form-group"><label>Select Doctor</label><select name="doctorId" value={appointmentData.doctorId} onChange={handleChange} required><option value="">-- Choose a Doctor --</option>{doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>)}</select></div>
                <div className="form-group-row">
                    <div className="form-group"><label>Select Date</label><input type="date" name="appointmentDate" value={appointmentData.appointmentDate} onChange={handleChange} disabled={!appointmentData.doctorId} required /></div>
                    <div className="form-group"><label>Available Time</label><select name="appointmentTime" value={appointmentData.appointmentTime} onChange={handleChange} disabled={!appointmentData.appointmentDate || slotsLoading} required><option value="">{slotsLoading ? 'Loading...' : 'Select a Time'}</option>{availableSlots.length > 0 ? availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>) : <option disabled>{!slotsLoading && appointmentData.appointmentDate ? 'No slots available' : ''}</option>}</select></div>
                </div>
                <div className="form-group"><label>Reason for Visit (Optional)</label><input type="text" name="reason" value={appointmentData.reason} onChange={handleChange} /></div>
                <button type="submit" className="btn btn-primary">Request Appointment</button>
            </form>
        </div>
    );
};


// ===================================================================
// The Main PatientDashboard Component
// ===================================================================
const PatientDashboard = () => {
    const { patientUser } = usePatientAuth();
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch ALL appointments for the logged-in patient
    const fetchAppointments = useCallback(async () => {
        if (!patientUser) return;
        setLoading(true);
        setError('');
        try {
            const res = await patientApi.get('/appointments/my-appointments');
            if (Array.isArray(res.data)) {
                setAllAppointments(res.data);
            } else {
                setAllAppointments([]);
            }
        } catch (err) {
            console.error('Failed to fetch appointments', err);
            setError('Could not load appointment history.');
            setAllAppointments([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    }, [patientUser]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // --- THIS IS THE CORE ELIGIBILITY LOGIC ---
    const canBookAppointment = useMemo(() => {
        // The patient is eligible to book if they have at least one appointment with 'Completed' status.
        return allAppointments.some(app => app.status === 'Completed');
    }, [allAppointments]);

    // This logic for displaying upcoming appointments remains the same
    const upcomingAppointments = useMemo(() => {
        const now = new Date();
        return allAppointments
            .filter(app => app.status === 'Approved' && new Date(app.appointmentDate) >= now)
            .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    }, [allAppointments]);

    if (loading) return <div className="dashboard-page"><p>Loading dashboard...</p></div>;

    return (
        <div className="patient-portal-page">
            <header className="patient-header">
                <h1>Welcome, {patientUser.firstName}!</h1>
                <p>This is your personal health dashboard.</p>
            </header>

            {error && <div className="info-widget error">{error}</div>}

            {!error && canBookAppointment && (
                <BookAppointmentWidget />
            )}

            {!error && !canBookAppointment && (
                <div className="info-widget">
                    <p>You can book follow-up appointments here after your first visit has been marked as completed by your doctor.</p>
                </div>
            )}

            <div className="dashboard-widget">
                <h3>Upcoming Appointments</h3>
                {upcomingAppointments.length > 0 ? (
                    <ul className="appointment-list">
                        {upcomingAppointments.map(app => (
                            <li key={app._id}>
                                <div>
                                    Appointment with <strong>Dr. {app.doctor.firstName} {app.doctor.lastName}</strong>
                                    <span className="appointment-reason">{app.reason}</span>
                                </div>
                                <span className="appointment-time">{new Date(app.appointmentDate).toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>You have no upcoming approved appointments.</p>
                )}
            </div>

            <div className="quick-links">
                <Link to="/patient/records" className="quick-link-card">
                    <h4>View My Medical Records</h4>
                    <p>Access your diagnoses, lab results, and more.</p>
                </Link>
                <Link to="/patient/bills" className="quick-link-card">
                    <h4>View My Bills</h4>
                    <p>Check your outstanding balance and payment history.</p>

                </Link>
            </div>
        </div>
    );
};

export default PatientDashboard;