import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data);

            // Redirect based on role
            switch (response.data.role) {
                case 'Admin':
                    navigate('/admin');
                    break;
                case 'Receptionist':
                    navigate('/receptionist');
                    break;
                case 'Doctor':
                    navigate('/doctor');
                    break;
                case 'Nurse':
                    navigate('/nurse');
                    break;
                case 'Pharmacist':
                    navigate('/pharmacist');
                    break; // Add this
                case 'LabTechnician':
                    navigate('/lab');
                    break;
                case 'Accountant':
                    navigate('/accountant');
                    break;
                default:
                    navigate('/');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-box">
                <h2>Staff Portal</h2>
                <p className="subtitle">Please sign in to continue</p>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>

                <div className="patient-login-link">
                    <p>Are you a patient? <Link to="/patient/login">Login Here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;