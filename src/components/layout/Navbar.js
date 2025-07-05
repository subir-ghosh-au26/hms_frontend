import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import StaffNotifications from './StaffNotifications';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return "/login";
        switch (user.role) {
            case 'Admin': return '/admin';
            case 'Receptionist': return '/receptionist';
            case 'Doctor': return '/doctor';
            case 'Nurse': return '/nurse';
            case 'Pharmacist': return '/pharmacist';
            case 'LabTechnician': return '/lab';
            case 'Accountant': return '/accountant';
            default: return '/login';
        }
    };

    // --- RENDER LOGIC WITH CONDITIONAL LINK ---
    return (
        <nav className="main-navbar">
            <div className="navbar-section brand-section">
                <Link to={getDashboardLink()} className="navbar-brand">
                    {/* You can use an SVG logo here instead of text */}
                    <span className="logo-icon">🏥</span>
                    <h1>Hopewell HMS</h1>
                </Link>
            </div>

            <div className="navbar-section links-section">
                {user && (
                    <>
                        {/* Use NavLink for automatic active class styling */}
                        <NavLink to={getDashboardLink()} className="nav-item" end>Dashboard</NavLink>
                        <NavLink to="/my-roster" className="nav-item">My Roster</NavLink>
                        <NavLink to="/my-leave" className="nav-item">My Leave</NavLink>

                        {(user.role === 'Admin' || user.role === 'Pharmacist') && (
                            <NavLink to="/inventory" className="nav-item">Inventory</NavLink>
                        )}
                        {user.role === 'Admin' && (
                            <NavLink to="/roster" className="nav-item">Manage Roster</NavLink>
                        )}
                    </>
                )}
            </div>

            <div className="navbar-section user-section">
                <ThemeToggle />
                {user ? (
                    <>
                        <StaffNotifications />
                        <div className="user-profile-menu">
                            <span className="welcome-message">Welcome, {user.firstName}</span>
                            <small className="user-role">{user.role}</small>
                        </div>
                        <button onClick={handleLogout} className="logout-button" title="Logout">
                            {/* <span className="logout-icon">Log Out</span> */}
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="btn btn-primary">Staff Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;