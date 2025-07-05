import React, { createContext, useState, useContext, useEffect } from 'react';

const PatientAuthContext = createContext(null);

export const PatientAuthProvider = ({ children }) => {
    const [patientUser, setPatientUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('patientToken'));

    useEffect(() => {
        // Persist token
        if (token) {
            localStorage.setItem('patientToken', token);
        } else {
            localStorage.removeItem('patientToken');
        }

        // Persist user data
        const storedPatient = localStorage.getItem('patientUser');
        if (storedPatient) {
            setPatientUser(JSON.parse(storedPatient));
        }
    }, [token]);

    const patientLogin = (userData) => {
        setToken(userData.token);
        setPatientUser(userData.patient);
        localStorage.setItem('patientUser', JSON.stringify(userData.patient));
    };

    const patientLogout = () => {
        setToken(null);
        setPatientUser(null);
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientUser');
    };

    return (
        <PatientAuthContext.Provider value={{ patientUser, token, patientLogin, patientLogout, isPatientAuthenticated: !!token }}>
            {children}
        </PatientAuthContext.Provider>
    );
};

export const usePatientAuth = () => {
    return useContext(PatientAuthContext);
};