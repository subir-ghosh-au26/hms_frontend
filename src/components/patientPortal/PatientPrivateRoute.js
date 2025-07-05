import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePatientAuth } from '../../context/PatientAuthContext';

const PatientPrivateRoute = () => {
    const { isPatientAuthenticated } = usePatientAuth();

    return isPatientAuthenticated ? <Outlet /> : <Navigate to="/patient/login" replace />;
};

export default PatientPrivateRoute;