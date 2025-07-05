import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PatientAuthProvider } from './context/PatientAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PatientBillDetail from './pages/PatientBillDetail';

// Staff Imports
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PatientDirectory from './pages/admin/PatientDirectory';
import StaffDirectory from './pages/admin/StaffDirectory';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import LabTechnicianDashboard from './pages/LabTechnicianDashboard';
import PatientDetailView from './pages/PatientDetailView';
import AccountantDashboard from './pages/AccountantDashboard';
import ManageSchedule from './pages/doctor/ManageSchedule';
import MyRosterPage from './pages/MyRosterPage';
import AdminAnalytics from './pages/AdminAnalytics';
import LeaveManagement from './pages/admin/LeaveManagement';
import MyLeavePage from './pages/MyLeavePage';
import NotFound from './pages/NotFound'; // A simple component that says "404 Not Found"

// Import Patient Portal components
import PatientNavbar from './components/patientPortal/PatientNavbar';
import PatientLoginPage from './pages/patient/PatientLoginPage';
import PatientPortalLayout from './pages/patient/PatientPortalLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import MyAppointments from './pages/patient/MyAppointments';
import MyRecords from './pages/patient/MyRecords';
import MyBills from './pages/patient/MyBills';
import InventoryPage from './pages/InventoryPage';
import RosterPage from './pages/RosterPage';
import DoctorHistory from './pages/patient/DoctorHistory';

const AppLayout = () => {
  const location = useLocation();
  const isPatientPortal = location.pathname.startsWith('/patient');
  // const isAdminSection = location.pathname.startsWith('/admin');
  // const isLoginPage = location.pathname === '/login';

  // if (isLoginPage) {
  //   return (
  //     <AuthProvider>
  //       <Routes>
  //         <Route path="/login" element={<LoginPage />} />
  //       </Routes>
  //     </AuthProvider>
  //   );
  // }

  if (isPatientPortal) {
    return (
      <PatientAuthProvider>
        <PatientNavbar />
        <Routes>
          <Route path="/patient/login" element={<PatientLoginPage />} />
          <Route path="/patient" element={<PatientPortalLayout />}>
            <Route index element={<PatientDashboard />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="records" element={<MyRecords />} />
            <Route path="history/doctor/:doctorId" element={<DoctorHistory />} />
            <Route path="bills" element={<MyBills />} />
          </Route>
        </Routes>
      </PatientAuthProvider>
    );
  } else {
    return (
      <>
        <AuthProvider>
          <Navbar />
          <main style={{ padding: '1rem' }}>
            <Routes>
              {/* All staff routes go here */}
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Routes */}
              <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/roster" element={<RosterPage />} />
                <Route path="/analytics" element={<AdminAnalytics />} />
                <Route path="/staff-patients" element={<PatientDirectory />} />
                <Route path="/staff-directory" element={<StaffDirectory />} />
                <Route path="/leave-management" element={<LeaveManagement />} />
              </Route>

              <Route element={<PrivateRoute />}>
                <Route path="/my-roster" element={<MyRosterPage />} />
                <Route path="/my-leave" element={<MyLeavePage />} />
              </Route>

              {/* A shared route for inventory */}
              <Route element={<PrivateRoute allowedRoles={['Admin', 'Pharmacist']} />}>
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>

              {/* Receptionist Routes */}
              <Route element={<PrivateRoute allowedRoles={['Receptionist']} />}>
                <Route path="/receptionist" element={<ReceptionistDashboard />} />
              </Route>

              {/* Nurse Routes */}
              <Route element={<PrivateRoute allowedRoles={['Nurse']} />}>
                <Route path="/nurse" element={<NurseDashboard />} />
              </Route>

              {/* Doctor Routes */}
              <Route element={<PrivateRoute allowedRoles={['Doctor']} />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/patient/:patientId" element={<PatientDetailView />} />
                <Route path="/doctor/schedule" element={<ManageSchedule />} />
              </Route>

              {/* Pharmacist Routes */}
              <Route element={<PrivateRoute allowedRoles={['Pharmacist']} />}>
                <Route path="/pharmacist" element={<PharmacistDashboard />} />
              </Route>

              {/* Lab Technician Routes */}
              <Route element={<PrivateRoute allowedRoles={['LabTechnician']} />}>
                <Route path="/lab" element={<LabTechnicianDashboard />} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={['Accountant']} />}>
                <Route path="/accountant" element={<AccountantDashboard />} />
                <Route path="/accountant/bill/:patientId" element={<PatientBillDetail />} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
                <Route path="/roster" element={<RosterPage />} />
              </Route>

              <Route path="/" element={<LoginPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </AuthProvider>
      </>
    );
  }
}

function App() {
  return (

    <ThemeProvider>
      <Router>
        <AppLayout />
        <Footer />
      </Router>
    </ThemeProvider>

  );
}

export default App;