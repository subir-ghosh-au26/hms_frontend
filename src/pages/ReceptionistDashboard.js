import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import './ReceptionistDashboard.css';

const ReceptionistDashboard = () => {
    const generateUHID = () => `UHID${Date.now().toString().slice(-8)}`;
    // --- State for Forms ---
    const [patientData, setPatientData] = useState({ uhid: generateUHID(), firstName: '', lastName: '', dateOfBirth: '', gender: 'Male', phone: '+91' });
    const [appointmentData, setAppointmentData] = useState({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '' });

    // --- State for Data & UI Control ---
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedPatientForPortal, setSelectedPatientForPortal] = useState(null);
    const [phoneError, setPhoneError] = useState('');

    // --- State for User Feedback Messages ---
    const [patientMessage, setPatientMessage] = useState({ text: '', type: '' });
    const [appointmentMessage, setAppointmentMessage] = useState({ text: '', type: '' });
    const [portalMessage, setPortalMessage] = useState({ text: '', type: '' });

    // --- Initial Data Fetch (Patients & Doctors) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsRes, doctorsRes] = await Promise.all([
                    api.get('/staff-patients'),
                    api.get('/appointments/doctors')
                ]);
                setPatients(patientsRes.data);
                setDoctors(doctorsRes.data);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                setPatientMessage({ text: 'Could not load patient or doctor list.', type: 'error' });
            }
        };
        fetchData();
    }, []);

    // --- Fetch available slots when doctor or date changes ---
    useEffect(() => {
        const fetchSlots = async () => {
            if (appointmentData.doctorId && appointmentData.appointmentDate) {
                setSlotsLoading(true);
                setAvailableSlots([]);
                try {
                    const res = await api.get(`/schedules/${appointmentData.doctorId}/available-slots?date=${appointmentData.appointmentDate}`);
                    setAvailableSlots(res.data.availableSlots);
                } catch (error) {
                    console.error("Failed to fetch available slots", error);
                    setAvailableSlots([]);
                } finally {
                    setSlotsLoading(false);
                }
            }
        };
        fetchSlots();
    }, [appointmentData.doctorId, appointmentData.appointmentDate]);

    // --- Form Input Handlers ---
    const handlePatientChange = e => setPatientData({ ...patientData, [e.target.name]: e.target.value });
    const handleAppointmentChange = e => setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });

    const handlePhoneChange = (e) => {
        const { value } = e.target;
        setPhoneError('');

        // Ensure '+91' prefix is always there
        if (!value.startsWith('+91')) {
            return; // Or set it back to '+91'
        }

        // Allow only numbers after the prefix and limit length
        const numericPart = value.substring(3);
        if (/^\d*$/.test(numericPart) && numericPart.length <= 10) {
            setPatientData({ ...patientData, phone: value });
        }
    };


    // --- Form Submission Handlers ---
    const handlePatientSubmit = async e => {
        e.preventDefault();
        setPatientMessage({ text: '', type: '' });
        if (patientData.phone.length !== 13) { // +91 (3 chars) + 10 digits
            setPhoneError('Phone number must be 10 digits long.');
            return;
        }
        try {
            const res = await api.post('/staff/patients', patientData);
            setPatientMessage({ text: `Patient ${res.data.firstName} registered successfully!`, type: 'success' });
            setPatients([...patients, res.data]); // Add new patient to the list
            setPatientData({ uhid: generateUHID(), firstName: '', lastName: '', dateOfBirth: '', gender: 'Male', phone: '+91' }); // Reset form
        } catch (err) {
            setPatientMessage({ text: err.response?.data?.message || 'Registration failed', type: 'error' });
        }
    };

    const getTodayString = () => {
        const today = new Date();
        // Format to 'YYYY-MM-DD' which is required by the input type="date" min attribute
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleAppointmentSubmit = async e => {
        e.preventDefault();
        setAppointmentMessage({ text: '', type: '' });
        const fullAppointmentDate = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}:00`);
        try {
            await api.post('/appointments', {
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                appointmentDate: fullAppointmentDate,
                reason: appointmentData.reason,
            });
            setAppointmentMessage({ text: 'Appointment booked successfully! Awaiting doctor approval.', type: 'success' });
            setAppointmentData({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '' });
            setAvailableSlots([]);
        } catch (err) {
            setAppointmentMessage({ text: err.response?.data?.message || 'Booking failed', type: 'error' });
        }
    };

    const handlePortalSubmit = async () => {
        setPortalMessage({ text: '', type: '' });
        try {
            await api.post('/patient/create-portal', { patientId: selectedPatientForPortal._id });
            setPortalMessage({ text: 'Portal account created and SMS sent!', type: 'success' });
            const updatedPatients = patients.map(p =>
                p._id === selectedPatientForPortal._id ? { ...p, userAccount: true } : p
            );
            setPatients(updatedPatients);
            setSelectedPatientForPortal({ ...selectedPatientForPortal, userAccount: true });
        } catch (err) {
            setPortalMessage({ text: err.response?.data?.message || 'Failed to create portal account.', type: 'error' });
        }
    };

    const filteredPatients = patients.filter(p =>
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.uhid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-page receptionist-dashboard">
            <header className="receptionist-header">
                <h1>Receptionist Dashboard</h1>
                <p>Manage patient registrations, appointments, and portal access efficiently.</p>
            </header>

            <div className="receptionist-grid two-cols">
                <div className="dashboard-card action-card">
                    <h3><span className="icon">📝</span> Register New Patient</h3>
                    {patientMessage.text && <p className={`message ${patientMessage.type}`}>{patientMessage.text}</p>}
                    <form onSubmit={handlePatientSubmit} className="dashboard-form">
                        <div className="form-group"><label>UHID</label><input type="text" name="uhid" value={patientData.uhid} readOnly className="readonly-input" /></div>
                        <div className="form-group"><label>First Name</label><input type="text" name="firstName" value={patientData.firstName} onChange={handlePatientChange} required /></div>
                        <div className="form-group"><label>Last Name</label><input type="text" name="lastName" value={patientData.lastName} onChange={handlePatientChange} required /></div>
                        <div className="form-group"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={patientData.dateOfBirth} onChange={handlePatientChange} required /></div>
                        <div className="form-group"><label>Gender</label><select name="gender" value={patientData.gender} onChange={handlePatientChange}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                        <div className="form-group"><label>Phone Number</label><input type="tel" name="phone" value={patientData.phone} onChange={handlePhoneChange} required />
                            {phoneError && <small className="error-text">{phoneError}</small>}
                        </div>
                        <button type="submit" className="btn btn-primary">Register Patient</button>

                    </form>
                </div>

                <div className="dashboard-card action-card">
                    <h3><span className="icon">📅</span> Book Appointment</h3>
                    {appointmentMessage.text && <p className={`message ${appointmentMessage.type}`}>{appointmentMessage.text}</p>}
                    <form onSubmit={handleAppointmentSubmit} className="dashboard-form">
                        <div className="form-group"><label>Patient</label><select name="patientId" value={appointmentData.patientId} onChange={handleAppointmentChange} required><option value="">Select Patient</option>{patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}</select></div>
                        <div className="form-group"><label>Doctor</label><select name="doctorId" value={appointmentData.doctorId} onChange={handleAppointmentChange} required><option value="">Select Doctor</option>{doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>)}</select></div>
                        <div className="form-group"><label>Date</label><input type="date" name="appointmentDate" value={appointmentData.appointmentDate} onChange={handleAppointmentChange} disabled={!appointmentData.doctorId} min={getTodayString()} required /></div>
                        <div className="form-group"><label>Available Time</label><select name="appointmentTime" value={appointmentData.appointmentTime} onChange={handleAppointmentChange} disabled={!appointmentData.appointmentDate || slotsLoading} required><option value="">{slotsLoading ? 'Loading...' : 'Select a Time'}</option>{availableSlots.length > 0 ? availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>) : <option value="" disabled>{!slotsLoading && appointmentData.appointmentDate ? 'No slots available' : ''}</option>}</select></div>
                        <div className="form-group"><label>Reason for Visit (Optional)</label><input type="text" name="reason" value={appointmentData.reason} onChange={handleAppointmentChange} /></div>
                        <button type="submit" className="btn btn-primary">Book Appointment</button>
                    </form>
                </div>
            </div>

            <div className="dashboard-card full-width-card">
                <h3><span className="icon">👥</span> Patient Directory & Portal Management</h3>
                <div className="receptionist-grid two-cols">
                    <div className="patient-list-container">
                        <div className="form-group">
                            <input type="text" placeholder="Search by Name or UHID..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <ul className="patient-list">
                            {filteredPatients.map(p => (
                                <li key={p._id} onClick={() => setSelectedPatientForPortal(p)} className={selectedPatientForPortal?._id === p._id ? 'selected' : ''}>
                                    <span>{p.firstName} {p.lastName} ({p.uhid})</span>
                                    {p.userAccount ? (
                                        <span className="status-badge status-completed">Portal Active</span>
                                    ) : (
                                        <span className="status-badge status-cancelled">No Portal</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="portal-creation-container">
                        {selectedPatientForPortal ? (
                            <div>
                                <h4>Create Portal Account</h4>
                                <p>This will send an SMS with a portal link to <strong>{selectedPatientForPortal.firstName} {selectedPatientForPortal.lastName}</strong> on their number: <strong>{selectedPatientForPortal.phone || 'Not Provided'}</strong></p>
                                {portalMessage.text && <p className={`message ${portalMessage.type}`}>{portalMessage.text}</p>}
                                <div className="button-group">
                                    <button onClick={handlePortalSubmit} className="btn btn-success" disabled={selectedPatientForPortal.userAccount || !selectedPatientForPortal.phone}>
                                        {selectedPatientForPortal.userAccount ? 'Account Exists' : 'Create & Send SMS'}
                                    </button>
                                    <button onClick={() => setSelectedPatientForPortal(null)} className="btn btn-secondary">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="placeholder-text">
                                <p>Select a patient from the list to manage their portal account.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;