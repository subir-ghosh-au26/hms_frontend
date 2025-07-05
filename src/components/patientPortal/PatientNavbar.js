import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../context/PatientAuthContext';
// import Notifications from './Notifications'; // The patient notification component
import './PatientNavbar.css'; // <-- The new dedicated CSS file

const PatientNavbar = () => {
    const { patientUser, patientLogout, isPatientAuthenticated } = usePatientAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        patientLogout();
        navigate('/patient/login');
    };

    return (
        <nav className="patient-navbar">
            <div className="navbar-section">
                <NavLink to={isPatientAuthenticated ? "/patient" : "/patient/login"} className="patient-navbar-brand">
                    <span className="logo-icon">❤️‍🩹</span>
                    <h1>Hopewell Patient Portal</h1>
                </NavLink>
            </div>
            {isPatientAuthenticated && (
                <div className="navbar-section patient-links-section">
                    <NavLink to="/patient" className="patient-nav-item" end>Dashboard</NavLink>
                    <NavLink to="/patient/appointments" className="patient-nav-item">My Appointments</NavLink>
                    <NavLink to="/patient/records" className="patient-nav-item">My Records</NavLink>
                    <NavLink to="/patient/bills" className="patient-nav-item">My Bills</NavLink>
                </div>
            )}

            <div className="navbar-section patient-user-section">
                {isPatientAuthenticated && patientUser ? (
                    <>
                        {/* <Notifications /> */}
                        <div className="patient-welcome">
                            <span>Welcome, <strong>{patientUser.firstName}</strong></span>
                        </div>
                        <button onClick={handleLogout} className="patient-logout-btn" title="Logout">
                            <span className="logout-icon">➡️</span>
                        </button>
                    </>
                ) : (
                    // Optional: You can add a "Login" button here if you want one
                    // on pages that might show the navbar but not have a logged-in user.
                    // For our current setup, this will mostly be empty on the login page.
                    <div style={{ width: '1px' }}></div> // Placeholder to maintain layout
                )}
            </div>
        </nav>
    );
};

export default PatientNavbar;