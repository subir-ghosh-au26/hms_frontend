import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import './AdminAnalytics.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
            <h4>{title}</h4>
            <p>{value}</p>
        </div>
    </div>
);

const AdminAnalytics = () => {
    const [kpis, setKpis] = useState(null);
    const [appointmentStatusData, setAppointmentStatusData] = useState(null);
    const [patientRegistrationData, setPatientRegistrationData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const kpiRes = await api.get('/analytics/kpis');
                setKpis(kpiRes.data);

                const apptStatusRes = await api.get('/analytics/appointments-by-status');
                setAppointmentStatusData({
                    labels: apptStatusRes.data.map(d => d._id),
                    datasets: [{
                        label: 'Appointments',
                        data: apptStatusRes.data.map(d => d.count),
                        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'],
                    }]
                });

                const patientRegRes = await api.get('/analytics/patient-registrations');
                // Ensure all last 7 days are present, even if count is 0
                const labels = [];
                const dataPoints = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateString = d.toISOString().slice(0, 10);
                    labels.push(dateString);
                    const found = patientRegRes.data.find(item => item._id === dateString);
                    dataPoints.push(found ? found.count : 0);
                }
                setPatientRegistrationData({
                    labels,
                    datasets: [{
                        label: 'New Patients',
                        data: dataPoints,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                });

            } catch (error) {
                console.error("Failed to fetch analytics data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <p>Loading analytics dashboard...</p>;
    if (!kpis) return <p>Could not load analytics data.</p>;

    return (
        <div className="analytics-dashboard">
            <h2>Hospital Analytics Dashboard</h2>

            <div className="stat-cards-container">
                <StatCard title="Total Patients" value={kpis.totalPatients} icon="👥" />
                <StatCard title="New Patients Today" value={kpis.newPatientsToday} icon="👶" />
                <StatCard title="Approved Appointments Today" value={kpis.appointmentsToday} icon="✔️" />
                <StatCard title="Total Revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} icon="💰" />
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>Patient Registrations (Last 7 Days)</h3>
                    {patientRegistrationData && <Line data={patientRegistrationData} />}
                </div>
                <div className="chart-card">
                    <h3>Appointments by Status</h3>
                    {appointmentStatusData && <Pie data={appointmentStatusData} />}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;