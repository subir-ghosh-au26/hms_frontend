import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatientAuth } from '../../context/PatientAuthContext';
import api from '../../api/api';
import './PatientPortal.css';

const PatientLoginPage = () => {
    const [step, setStep] = useState(1); // 1 for phone entry, 2 for OTP entry
    const [phone, setPhone] = useState('+91');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { patientLogin } = usePatientAuth();
    const navigate = useNavigate();

    const handlePhoneChange = (e) => {
        const { value } = e.target;

        // Don't allow the prefix to be deleted
        if (!value.startsWith('+91')) {
            return;
        }

        // Get the part after the prefix
        const numericPart = value.substring(3);

        // Allow only numbers and limit the total length to 13 (+91 and 10 digits)
        if (/^\d*$/.test(numericPart) && value.length <= 13) {
            setPhone(value);
        }
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (phone.length !== 13) {
            setError('Mobile number must be 10 digits long, following +91.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/patient/request-otp', { phone });
            setStep(2); // Move to OTP entry screen
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/patient/verify-otp', { phone, otp });
            patientLogin(response.data); // Log the user in
            navigate('/patient'); // Redirect to dashboard
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="patient-portal-login-container">
            <div className="patient-login-box">
                <h2>Patient Portal</h2>
                {error && <p className="error-message">{error}</p>}

                {step === 1 && (
                    <form onSubmit={handleRequestOtp}>
                        <p>Enter your registered mobile number to receive a login OTP.</p>
                        <div className="input-group">
                            <label>Mobile Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="+911234567890"
                                required
                            />
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <p>An OTP has been sent to <strong>{phone}</strong>. Please enter it below.</p>
                        <div className="input-group">
                            <label>One-Time Password (OTP)</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength="6"
                                required
                            />
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Verifying...' : 'Login'}
                        </button>
                        <button type="button" className="link-button" onClick={() => setStep(1)}>
                            Change Number
                        </button>
                    </form>
                )}

                <div className="staff-login-link">
                    <p>Are you a staff member? <Link to="/login">Login Here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default PatientLoginPage;