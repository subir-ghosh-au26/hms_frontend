import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/api';
import ThemeToggle from '../components/layout/ThemeToggle';
import './AdminDashboard.css';

// ===================================================================
// WIDGET: Service Management (remains here as a core admin function)
// ===================================================================
const ServiceManagerWidget = () => {
    const [services, setServices] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [serviceForm, setServiceForm] = useState({ name: '', cost: '', category: 'Pharmacy' });
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, inventoryRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/inventory')
                ]);
                setServices(servicesRes.data);
                setInventoryItems(inventoryRes.data);
            } catch (err) {
                setMessage({ text: 'Failed to load service data.', type: 'error' });
            }
        };
        fetchData();
    }, []);

    const availableInventoryForService = useMemo(() => {
        const existingServiceNames = new Set(services.map(s => s.name));
        return inventoryItems.filter(item => !existingServiceNames.has(item.name));
    }, [services, inventoryItems]);

    const handleServiceChange = e => setServiceForm({ ...serviceForm, [e.target.name]: e.target.value });

    const handleServiceSubmit = async e => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        if (!serviceForm.name) {
            setMessage({ text: 'Please select an item from the inventory list.', type: 'error' });
            return;
        }
        try {
            const res = await api.post('/services', serviceForm);
            setServices([...services, res.data]);
            setServiceForm({ name: '', cost: '', category: 'Pharmacy' });
            setMessage({ text: 'Service added successfully!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to add service.', type: 'error' });
        }
    };

    return (
        <div className="admin-widget-card">
            <h3>Manage Hospital Services</h3>
            {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
            <form onSubmit={handleServiceSubmit} className="dashboard-form">
                <div className="form-group">
                    <label>Select Inventory Item to Make Billable</label>
                    <select name="name" value={serviceForm.name} onChange={handleServiceChange} required>
                        <option value="">-- Select an Item --</option>
                        {availableInventoryForService.map(item => (
                            <option key={item._id} value={item.name}>{item.name} ({item.category})</option>
                        ))}
                    </select>
                </div>
                <div className="form-group-row">
                    <div className="form-group">
                        <label>Billing Cost ($)</label>
                        <input type="number" name="cost" value={serviceForm.cost} onChange={handleServiceChange} required min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Billing Category</label>
                        <select name="category" value={serviceForm.category} onChange={handleServiceChange}>
                            <option value="Pharmacy">Pharmacy</option>
                            <option value="Surgical Supplies">Surgical Supplies</option>
                            <option value="Lab Test">Lab Test</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Procedure">Procedure</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add Service</button>
            </form>
        </div>
    );
};


// ===================================================================
// MAIN DASHBOARD COMPONENT
// ===================================================================
const AdminDashboard = () => {
    return (
        <div className="admin-dashboard-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h4>Admin Menu</h4>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/admin" className="nav-link" end>
                        <span className="nav-icon">🏠</span> Dashboard Home
                    </NavLink>
                    <NavLink to="/analytics" className="nav-link">
                        <span className="nav-icon">📊</span> Analytics & Reports
                    </NavLink>
                    <NavLink to="/staff-directory" className="nav-link">
                        <span className="nav-icon">👨‍⚕️</span> Staff Directory
                    </NavLink>
                    <NavLink to="/staff-patients" className="nav-link">
                        <span className="nav-icon">📂</span> Patient Directory
                    </NavLink>
                    <NavLink to="/leave-management" className="nav-link">
                        <span className="nav-icon">👨‍⚕️</span> Leave Management
                    </NavLink>
                    <NavLink to="/roster" className="nav-link">
                        <span className="nav-icon">📅</span> Manage Roster
                    </NavLink>
                    <NavLink to="/inventory" className="nav-link">
                        <span className="nav-icon">📦</span> Manage Inventory
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <ThemeToggle />
                </div>
            </aside>

            <main className="admin-main-content">
                <header className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, Admin! Manage your hospital's core operations from this control center.</p>
                </header>

                <div className="admin-widgets-grid">
                    {/* The main dashboard now primarily contains the service manager.
                        Other high-level widgets like "Recent System Activity" could go here. */}
                    <ServiceManagerWidget />

                    {/* Placeholder for another potential widget */}
                    <div className="admin-widget-card">
                        <h3>System Status</h3>
                        <p>All systems operational.</p>
                        {/* More status indicators can be added here */}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;