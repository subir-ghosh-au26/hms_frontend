import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PatientNavbar from '../../components/patientPortal/PatientNavbar';
import PatientPrivateRoute from '../../components/patientPortal/PatientPrivateRoute';
import MyAppointments from './MyAppointments';
import MyRecords from './MyRecords';
import MyBills from './MyBills';
import PatientDashboard from './PatientDashboard';
import DoctorHistory from './DoctorHistory';

const PatientPortalLayout = () => {
    return (
        <PatientPrivateRoute>
            <div className="patient-portal-layout">
                <PatientNavbar />
                <main className="patient-portal-content">
                    <Routes>
                        <Route index element={<PatientDashboard />} />
                        <Route path="appointments" element={<MyAppointments />} />
                        <Route path="history/doctor/:doctorId" element={<DoctorHistory />} />
                        <Route path="records" element={<MyRecords />} />
                        <Route path="bills" element={<MyBills />} />
                        <Route path="*" element={<Navigate to="/patient" />} />
                    </Routes>
                </main>
            </div>
        </PatientPrivateRoute>
    );
};

export default PatientPortalLayout;